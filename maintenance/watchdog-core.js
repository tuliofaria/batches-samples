	
var exec = require('child_process').exec,
    	child;
var fs = require("fs");
var async = require("async");
var _ = require("underscore");
var request    = require('request');

var taskLog = require("../integration/tasklog");
var config = require('../config')();

var MongoClient = require("mongodb").MongoClient;
var db;

var connectionString = "mongodb://"+config.db; // stress enviroment

var s3 = require('s3')

var nodemailer = require('nodemailer');

var moment = require("moment");



function WatchDogCore(runnerScript){
	var self = this;
	var db;

	var outputPretty = "";
	var outputRaw = "";

	var convertPath = config.ghostScriptPath || "\"C:\\Program Files\\gs\\gs9.18\\bin\\gswin64c.exe\"";

	function watchSettings(callback){
		// fs.stat(convertPath, function(err, stat){
		// 	console.log(convertPath, err);
		// 	if(err){
		// 		outputRaw+="ConvertPath with problem. .exe not found.\n";
		// 	}else{
		// 		if(!stat.isFile()){
		// 			outputRaw+="ConvertPath with problem. .exe not found.\n";
		// 		}
		// 	}
		// 	callback(null);
		// });
		callback(null);
	}


	
	function watchCustomersWithCDLProblems(callback){
		// find some problems
		callback(null);
	}

	function watchCustomers(cb){
		async.waterfall([
			// we can add more checks here
			watchCustomersWithCDLProblems,
		], function(callback){
			cb(null);
		});
	}

	function watchThirdPartyServices(callback){
		async.waterfall([
			watchCDLService
		], function(err){
			callback(null);
		})
	}

	// public interface
	return {
		init: function(callback){
			MongoClient.connect(connectionString, function(err, dbLocal){
				db = dbLocal;
				callback(null);
			});
		},
		createLog: function(callback){
			var params = {
				config: config,
				connectionString: connectionString,
				//ghostScriptPath: convertPath
			};
			var taskParams = {
				type: "WATCHDOG",
				scriptName: runnerScript,
				params: params
			};
			taskLog.settings(db);
			taskLog.init(taskParams, callback);
		},
		closeLog: function(callback){
			var params = {
				status: "FINISHED",
				output: {
					pretty: outputPretty,
					raw: outputRaw
				},
			}
			taskLog.end(params, callback);
			//callback(null);
		},
		closeLogError: function(callback){
			var params = {
				status: "ERROR",
				output: {
					pretty: outputPretty,
					raw: outputRaw
				},
			}
			taskLog.end(params, callback);
			//callback(null);
		},
		watchSettings: watchSettings,
		watchCustomers: watchCustomers,
		watchThirdPartyServices: watchThirdPartyServices,
		sendResults: function(callback){

			if(outputPretty!=""){

				// create reusable transporter object using the default SMTP transport
				var transporter = nodemailer.createTransport(settings);

				// setup e-mail data with unicode symbols
				var mailOptions = {
				    from: 'DogBot <tuliofaria@gmail.com>', // sender address
				    to: 'tuliofaria@gmail.com',
				    subject: 'WatchDog: Problems', // Subject line
				    text: outputPretty+"\n\n"+outputRaw,
				    html: outputPretty+'<br><pre>'+outputRaw+'</pre>' // html body
				};

				// send mail with defined transport object
				transporter.sendMail(mailOptions, function(error, info){
				    if(error){
				        //return console.log(error);
				    }
				    callback(null);
				    console.log('Message sent: ' + info.response);
				});
			}else{
				outputPretty = "Everything is just fine!  :) ";
				callback(null);
			}
		}
	}
}
module.exports = WatchDogCore;