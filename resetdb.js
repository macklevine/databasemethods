'use strict';

var mysql = require('mysql');
var fs = require('fs');

var pool = mysql.createPool({
	host : 'localhost',
	user : 'root',
	password : '',
	database : 'testbase'
});

fs.readFile(__dirname + '/experimentalNotificationSchema.sql', 'utf-8', function(err, data){
	pool.getConnection(function(err, connection){
		connection.query(data, function(err, rows){
			if(err){
				console.dir(err);
			}
			connection.release();
		});
	});
});
