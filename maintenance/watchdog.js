'use strict'

/*
	BATCH FILE MANIFEST

	NAME: WATCHDOG
	OBJECTIVE: Convert PDF docs to IMG to preview during the approval process

	SCHEDULED AT: hourly

	FEATURES:
		- this script will get settings from ./config.js. So set the enviorment var NODE_ENV before running this.
		- all the core routines are in modules: pdf2img-core

	DEPENDENCIES:
		- This script needs GhostScript installed. Its important to define the GhostScript execution in config.
*/

var async = require("async");
var watchdog = require("./watchdog-core")(__filename);


async.waterfall([
	watchdog.init,
	watchdog.createLog,
	watchdog.watchSettings,
	watchdog.watchCustomers,
	watchdog.watchThirdPartyServices,
	watchdog.sendResults,
	watchdog.closeLog,
], function(err){
	if(err){
		// just a last check for errors
		console.log("Batch not executed properly.");
		watchdog.closeLogError({ error: err }, function(err){
			process.exit(0);
		});
	}else{
		console.log("Batch executed.");
		process.exit(0);
	}
});
