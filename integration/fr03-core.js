// fr03-core


// batch process - FR03
var S = require("string"),
	fs = require("fs"),
	q  = require("q"),
	async = require("async"),
	moment = require("moment"),
	AdmZip = require("adm-zip"),
	_ = require('underscore');


var config = require('../config')();
var taskLog = require("./tasklog");

var MongoClient = require("mongodb").MongoClient;

var db;
var connectionString = "mongodb://" + config.db;


function processRecord(line){
	var record = S(line);
	var obj = {
		tipo: record.substr(67, 1).toString(),
		cpf: record.substr(70,11).toString(),
		nome: S(record.substr(11,50).toString()).trim().toString()
	};
	return obj;
}

module.exports = function(runnerScript){
	var outputPretty = "";
	var outputRaw = "";

	return{
		createLog: function(callback){
			var params = {
				config: config,
				connectionString: connectionString,
				directory: config.fr03.path,
				bkpDirectory: config.fr03.pathBackup
			};
			
			var taskParams = {
				type: "FR03",
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

		filterFr03Files: function(files, callback){
			var newFiles = _.filter(files, function(file){ 
				var regex = /^FR03([0-9]{2,2})([0-9]{2,2})([0-9]{2,2})([0-9]{2,2})([0-9]{2,2})([0-9]{2,2})([0-9]{2,2}).ZIP$/
				var result = file.match(regex);
				return result!=null;
			});
			async.setImmediate(function(){
				callback(null, newFiles);
			});
		},
		sortFileNamesByDate: function(files, callback){
			var regex = /^FR03([0-9]{2,2})([0-9]{2,2})([0-9]{2,2})([0-9]{2,2})([0-9]{2,2})([0-9]{2,2})([0-9]{2,2}).ZIP$/
			var sortedFiles = _.sortBy(files, function(file){ 
				var result = file.match(regex);
				if(result!=null){
					var date = moment().year("20"+result[4]).month(result[3]).day(result[2]).hour(result[5]).minutes(result[6]).seconds(result[7]);
					return date.valueOf();
				}
				return 0;
			});
			async.setImmediate(function(){
				callback(null, sortedFiles);
			});
		},
		limitFilesNumber: function(limit, files, callback){
			
			if(files.length > limit){
				outputRaw+=" Returned FR03 files: "+files.length+" but we limited to "+limit+"\n";
				files = files.splice(0, limit);
			}

			async.setImmediate(function(){
				callback(null, files);
			});
		},
		connectToMongo: function(cb){
			MongoClient.connect(connectionString, function(err, dbLocal){
				db = dbLocal;
				cb(null);
			});
		},
		readAndProcessEachFile: function(dir, files, callback){
			var totalUsers = 0;

			async.each(files, function iterator(item, cb){
				console.log(dir+item);
				var zip = AdmZip(dir+item);
				var zipEntries = zip.getEntries();
				var objs = [];
				zipEntries.forEach(function(zipEntry){
					var content = zip.readAsText(zipEntry);
					var records = content.split("\n");
					var k = records.length;
					for(var i=0 ; i<k; i++){
					  	objs.push(processRecord(records[i]));
					}
				});

				// filtering to Inserts and Deletes
				objs = _.filter(objs, function(obj){ return (obj.tipo=="D" || obj.tipo=="I"); });

				var users = db.collection("users");
				console.log("Users", objs.length);

				/*
				var bulkop = users.initializeOrderedBulkOp();  
				objs.forEach(function(obj){
					if(obj.tipo=="I"){
						bulkop.insert({ nome: obj.nome, cpf: obj.cpf, statusFR03: "I" });
					} else if(obj.tipo=="D"){
						bulkop.find({cpf: obj.cpf }).upsert().updateOne({ $set: { nome: obj.nome, cpf: obj.cpf, statusFR03: "D" }});
					}
				});

				if(objs.length==0){
					async.setImmediate(function(){
						cb(null);
					});
				}else{
					console.log("Batch operations executing...");
					bulkop.execute(cb);
				}*/

				async.eachSeries(objs, function iterator2(obj, cb2){
					if(obj.tipo=="I"){
						totalUsers++;
						console.log(obj);
						users.insertOne({ nome: obj.nome, cpf: obj.cpf, statusFR03: "I", updated: new Date() }, cb2);
					} else if(obj.tipo=="D"){
						totalUsers++;
						console.log(obj);
						users.updateOne({cpf: obj.cpf }, { $set: { nome: obj.nome, cpf: obj.cpf, statusFR03: "D", updated: new Date() }}, { upsert: true }, cb2);
					}else{
						async.nextTick(function(){
							cb2(null);
						});
					}
				}, function(err){
					outputRaw+= item+" processed with " + objs.length+" Users processed in it \n";
					cb(err);
				});

				//console.log(objs);
			}, function(err){
				outputRaw+= totalUsers+ " users processed.\n";
				outputPretty+= totalUsers+ " users processed.\n";
				callback(null, files);
			});
		},
		backupFr03Files: function(dir, backupDir, files, callback){

			async.eachSeries(files, function iterator(file, cb){
				fs.stat(dir+file, function(err, stat){
					if(stat.isFile()){
						outputRaw+= file+" backuping...\n";
						fs.rename(dir+file, backupDir+"/"+file, cb);
					}else{
						cb(null);
					}
				});
			}, callback);
		}
	}
}