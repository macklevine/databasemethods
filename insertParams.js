'use strict';

var mysql = require('mysql');
var Promise = require('bluebird');

var pool = mysql.createPool({
	host : 'localhost',
	user : 'root',
	password : '',
	database : 'testbase',
	multipleStatements: true
});

var updateLastSentToSalesforce = function updateLastSentToSalesforce(params){
	pool.getConnection(function(err, connection){
		connection.query("UPDATE notification SET ?", [params], function(err, rows){
				connection.release();
				console.log(rows);
			});
	});
};

updateLastSentToSalesforce({
	notificationStatus : "Responded"
});