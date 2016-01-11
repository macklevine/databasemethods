'use strict';

var mysql = require('mysql');
var Promise = require('bluebird');

var Methods = function Methods(){};

Methods.prototype.queryForItemsToSendToSalesforce = function queryForItemsToSendToSalesforce(connection){
	return new Promise(function(resolve, reject){
		connection.query("SELECT DATE_FORMAT(CURRENT_TIMESTAMP(3), '%Y-%m-%d %H:%i:%s.%f') AS n; SELECT * from notification AS n WHERE n.lastModifiedTime > n.lastSentToSalesforce", function(err, results){
			if (err){
				connection.release();
				reject(err);
			} else {
				connection.release();
				var idArray = [];
				for (var i = 0; i < results[1].length; i++){
					idArray.push(results[1][i].id);
				}
				//do some work here to extract all of the ids from the results.
				resolve({
					dbClockTime : results[0][0].n,
					idArray : idArray.toString()
				});
			}
		});
	});
};

Methods.prototype.updateSentRowsAfterSFResponse = function updateSentRowsAfterSFResponse(connection, dbClockTime, rowIds){
	return new Promise(function(resolve, reject){

		//rowIds must take the form of a string that looks like '1, 2, 3'

			//next, add the AND condition so that our procedure only runs on IDs that we specify. Experiment with including
			//and excluding id '1' in order to verify functionality.

		connection.query('CALL update_lastSentToSalesforce(?, ?, @dbClockTime2, @idListOut)', [dbClockTime, rowIds], function(err, rows){
			connection.release();
			if(err){
				reject(err);
			} else {
				resolve(rows);
			}
		});
	});
};

Methods.prototype._simulateSendItemsToSalesforce = function(connection, statusToMockUpdate){
	var self = this;
	//a mock function that simulates a delay. To be replaced with Parikshit's actual function later.
	return new Promise(function(resolve, reject){
		self._simulateRowUpdate(connection, statusToMockUpdate)
			.then(function(){
				setTimeout(function(){
					resolve("success!");
				}, 1000);
			});
		//may need to wrap the below in an anonymous function to preserve access to scope variables like resolve and reject.
	});
};

Methods.prototype._simulateRowUpdate = function _simulateRowUpdate(connection, statusToMockUpdate){
	return new Promise(function(resolve, reject){
		connection.query("UPDATE notification SET notificationStatus = ? WHERE id = '17312f31-69c3-4a9f-974a-13a76db97efa'", [statusToMockUpdate], function(err, rows){
			if(err){
				connection.release();
				reject(err);
			} else {
				connection.release();
				resolve(rows);
			}
		});
	});
};


module.exports = new Methods();

//The below is verified as functional...
// connection.query("UPDATE notification SET lastModifiedTime = TIMESTAMP(?), " +
// 	"lastSentToSalesforce = TIMESTAMP(?) WHERE lastModifiedTime < TIMESTAMP(?) ",
// 	[dbClockTime, dbClockTime, dbClockTime],
// 	function(err, rows){
// 		// console.log(rows);
// 		connection.release();
// 	});
