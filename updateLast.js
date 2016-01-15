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

var updateLastSentToSalesforce = function updateLastSentToSalesforce(notificationRecord){
	pool.getConnection(function(err, connection){
		connection.query("UPDATE notification SET lastSentToSalesforce = CURRENT_TIMESTAMP, lastModifiedTime = CURRENT_TIMESTAMP " +
			"WHERE notification.id = '" + notificationRecord.id + "'", function(err, rows){
				connection.release();
				console.log(rows);
			});
	});
};

updateLastSentToSalesforce({
	id : "17312f31-69c3-4a9f-974a-13a76db97efa"
});