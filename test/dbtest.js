'use strict';

var chai = require('chai');
var expect = chai.expect;

var fs = require('fs');
var uuid = require('node-uuid');

var mysql = require('mysql');
var methods = require('../methods');

var pool = mysql.createPool({
	host : 'localhost',
	user : 'root',
	password : '',
	database : 'testbase',
	multipleStatements: true
});

var initialId = "17312f31-69c3-4a9f-974a-13a76db97efa"

//mocks a bunch of data for the local mysql db.

before(function(done){
	pool.getConnection(function(err, connection){
		fs.readFile(__dirname + '/../experimentalNotificationSchema.sql', 'utf-8', function(err, data){
			connection.query(data, function(err, rows){
				connection.release();
				var testDates = [
					"2015-01-06 17:33:38.475",
					"1980-01-06 17:33:38.475",
					"2015-01-06 17:33:38.475",
					"1970-01-06 18:33:38.475",
					"1970-01-06 17:33:38.475",
					"1970-01-06 16:33:38.475"
				];
				var testIds = [
					"17312f31-69c3-4a9f-974a-13a76db97efa",
					"b169fb98-3de3-4c0a-9888-bd9c97adff07",
					"42bab995-1fdd-4a10-a116-ef74b5ff0492",
					"5989724e-a847-45c6-9d63-100e5da6a81a",
					"af488487-fccc-4d13-a102-5f394c996f98",
					"e553fa8b-a78b-4458-9dec-4a380e3c70a7"
				];
				var testRefIds = [
					"123456781234567890",
					null,
					"123456781234567892",
					null,
					null,
					"123456781234567895"
				];
				var counter = 6;
				var insertIntoNotification = function insertIntoNotification(){
					pool.getConnection(function(err, connection){
						connection.query('INSERT INTO notification (id, lastSentToSalesforce, refId) VALUES (?, ?, ?)', [testIds[counter-1], testDates[counter-1], testRefIds[counter-1]], function(err, rows){
							initialId = null;
							if (err) throw err;
							connection.release();
							counter--;
							if (counter === 0){
								done();
							} else {
								insertIntoNotification();
							}
						});
					});
				};
				insertIntoNotification();
			});
		});
	});
});

describe("prepareStatementFromSfResponse method", function(){
	it("should prepare a dynamic sql sub-statement from an sfResponse object", function(done){
		var sfResponse = {
			"sfNotificationIds": [
				{
					"sfNotificationId": "a0F3B00000008H1UAI",
					"notificationId": "16a14b1d-b497-4320-8439-84bd868dfd7d"
				},
				{
					"sfNotificationId": "a0F3B00000008H1UAQ",
					"notificationId": "16a14b1d-b497-4320-8439-84bd868dfd7r"
				}
			]
		};
		var returnedValue = methods.prepareStatementFromSfResponse(sfResponse);
		expect(returnedValue).to.equal("n.refId = CASE WHEN n.id = '16a14b1d-b497-4320-8439-84bd868dfd7d' THEN COALESCE(n.refId, 'a0F3B00000008H1UAI') WHEN n.id = '16a14b1d-b497-4320-8439-84bd868dfd7r' THEN COALESCE(n.refId, 'a0F3B00000008H1UAQ') ELSE n.refId END");
		done();
	});
});


describe("queryForItemsToSendToSalesforce", function(){
	it("should send back a timestamp from the db's internal clock as the first row n", function(done){
		pool.getConnection(function(err, connection){
			methods.queryForItemsToSendToSalesforce(connection)
				.then(function(object){
					expect(object).to.be.ok;
					done();
				})
				.catch(function(err){
					console.log(err);
				});
		});
	});
});

describe("dummy send shit to Salesforce function", function(){
	it("should resolve after a few milliseconds", function(done){
		pool.getConnection(function(err, connection){
			methods._simulateSendItemsToSalesforce(connection, "Received")
				.then(function(message){
					done();
				});
		});
	});
});

describe("entire flow", function(){
	it("should only update rows 2, 3, 4, 5, and 6 since the function accepts IDs from 1, 2, 3 and 5 " + 
		" but rejects updating row1 because an update had been made to that row while we were " +
		"waiting for Salesforce", function(done){

		var dummySfResponse = {
			"sfNotificationIds": [
				{
					"sfNotificationId": "SHOULD NOT SHOW UP",
					"notificationId": "17312f31-69c3-4a9f-974a-13a76db97efa"
				},
				{
					"sfNotificationId": "should show up____",
					"notificationId": "b169fb98-3de3-4c0a-9888-bd9c97adff07"
				},
				{
					"sfNotificationId": "SHOULD NOT SHOW UP",
					"notificationId": "42bab995-1fdd-4a10-a116-ef74b5ff0492"
				},
				{
					"sfNotificationId": "should show up too",
					"notificationId": "5989724e-a847-45c6-9d63-100e5da6a81a"
				},
				{
					"sfNotificationId": "should show up TOO",
					"notificationId": "af488487-fccc-4d13-a102-5f394c996f98"
				},
				{
					"sfNotificationId": "SHOULD NOT SHOW UP",
					"notificationId": "e553fa8b-a78b-4458-9dec-4a380e3c70a7"
				}
			]
		};

		var statementChunk = methods.prepareStatementFromSfResponse(dummySfResponse);
		pool.getConnection(function(err, connection){
			methods.queryForItemsToSendToSalesforce(connection)
				.then(function(object){
					console.log(object.idArray);
					var modifiedArray = object.idArray.split(",");
					console.log(modifiedArray.length);
					modifiedArray.splice(4, 1);
					modifiedArray = modifiedArray.join(",");
					console.log(modifiedArray);
					//figure out how to slice it.
					//TODO: pop id 5989724e-a847-45c6-9d63-100e5da6a81a out of idArray, just to see if the FIND_IN_SET
					//feature of the stored procedure actually works.


					pool.getConnection(function(err, connection){
						methods._simulateSendItemsToSalesforce(connection, "Read")
							.then(function(message){
								pool.getConnection(function(err, connection){



									methods.updateSentRowsAfterSFResponse(connection, object.dbClockTime, modifiedArray, statementChunk)
										.then(function(rows){
											expect(rows[0][0].r).to.equal(4);
											done();
										});
								});
							});
					});
				});
		});
	});
});



