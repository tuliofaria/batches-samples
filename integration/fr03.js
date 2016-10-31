'use strict'

/*
	FR03 FILE MANIFEST

	NAME: FR03
	OBJECTIVE: Import customers established from system.

	SCHEDULED AT: everyday at 6 PM

	FEATURES:
		- this script will get settings from ./config.js. So set the enviorment var NODE_ENV before running this.
		- all the core routines are in modules: fr03-core
		- read all fr03 files from selected diretory
		- input read users from files to users collection in database
*/

var fs = require("fs"),
	async = require("async");

var config = require("../config")();

var dir = config.fr03.path;
var bkpDir = config.fr03.pathBackup;

var fr03 = require('./fr03-core')(__filename);

async.waterfall([
	fr03.connectToMongo,
	fr03.createLog,
	async.apply(fs.readdir, dir),
	fr03.filterFr03Files,
	fr03.sortFileNamesByDate,
	async.apply(fr03.limitFilesNumber, 25), // 25 is the limit
	async.apply(fr03.readAndProcessEachFile, dir),
	async.apply(fr03.backupFr03Files, dir, bkpDir),
	fr03.closeLog,
], function(err){
	if(err){
		// just a last check for errors
		console.log("Batch not executed properly.");
		fr03.closeLogError({ error: err }, function(err){
			process.exit(0);
		});
	}else{
		console.log("Batch executed.");
		process.exit(0);
	}
});