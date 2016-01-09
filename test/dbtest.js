'use strict';

var chai = require('chai');
var expect = chai.expect;

var fs = require('fs');

var mysql = require('mysql');
var methods = require('../methods');

var pool = mysql.createPool({
	host : 'localhost',
	user : 'root',
	password : '',
	database : 'testbase',
	multipleStatements: true
});

//mocks a bunch of data for the local mysql db.

before(function(done){
	pool.getConnection(function(err, connection){
		fs.readFile(__dirname + '/../experimentalNotificationSchema.sql', 'utf-8', function(err, data){
			connection.query(data, function(err, rows){
				connection.release();
				var testDates = [
					"2019-01-06 17:33:38.475",
					"1980-01-06 17:33:38.475",
					"2018-01-06 17:33:38.475",
					"1970-01-06 18:33:38.475",
					"1970-01-06 17:33:38.475",
					"1970-01-06 16:33:38.475"
				];
				var counter = 6;
				var insertIntoNotification = function insertIntoNotification(){
					pool.getConnection(function(err, connection){
						connection.query('INSERT INTO notification (lastSentToSalesforce) VALUES (?)', [testDates[counter-1]], function(err, rows){
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



describe("queryForItemsToSendToSalesforce", function(){
	it("should send back a timestamp from the db's internal clock as the first row n", function(done){
		pool.getConnection(function(err, connection){
			methods.queryForItemsToSendToSalesforce(connection)
				.then(function(rows){
					console.log(rows[0][0].n);
					expect(rows[0][0].n).to.be.ok;
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
					console.log(message);
					expect(message).to.be.ok;
					done();
				});
		});
	});
});

describe("entire flow", function(){
	it("should only update rows 2-6, since row 1 had a modification made to it after the db clock time was recorded", function(done){
		pool.getConnection(function(err, connection){
			methods.queryForItemsToSendToSalesforce(connection)
				.then(function(rows){
					var dbClockTime = rows[0][0].n;
					console.log(dbClockTime);
					//next: use rows[0][0].n as the timestamp value.
					pool.getConnection(function(err, connection){
						methods._simulateSendItemsToSalesforce(connection, "Read")
							.then(function(message){
								//call the stored procedure.
								pool.getConnection(function(err, connection){
									methods.updateSentRowsAfterSFResponse(connection, dbClockTime)
										.then(function(rows){
											done();
										});
								});
							});
					});
				});
		});
	});
});



