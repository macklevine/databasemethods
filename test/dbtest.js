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
						connection.query('INSERT INTO notification (id, lastSentToSalesforce, refId) VALUES (?, ?, ?)', [initialId || uuid.v4(), testDates[counter-1], testRefIds[counter-1]], function(err, rows){
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
		expect(returnedValue).to.equal("refId = CASE WHEN id = '16a14b1d-b497-4320-8439-84bd868dfd7d' AND refId = NULL THEN 'a0F3B00000008H1UAI' WHEN id = '16a14b1d-b497-4320-8439-84bd868dfd7r' AND refId = NULL THEN 'a0F3B00000008H1UAQ' END");
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
		pool.getConnection(function(err, connection){
			methods.queryForItemsToSendToSalesforce(connection)
				.then(function(object){
					//next: use rows[0][0].n as the timestamp value.
					pool.getConnection(function(err, connection){
						methods._simulateSendItemsToSalesforce(connection, "Read")
							.then(function(message){
								//call the stored procedure.
								pool.getConnection(function(err, connection){
									methods.updateSentRowsAfterSFResponse(connection, object.dbClockTime, object.idArray)
										.then(function(rows){
											expect(rows[0][0].r).to.equal(5);
											done();
										});
								});
							});
					});
				});
		});
	});
});



