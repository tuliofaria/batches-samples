

var MongoClient = require("mongodb").MongoClient;

var connectionString;
var tasks;
var created;
var db;
var taskId;

var valor = 1;

module.exports = {
	settings: function(dbLocal){
		db = dbLocal;
		valor =2;
	},
	init: function(params, callback){
		var task = {
			type: params.type,
			created: new Date(),
			env_type: process.env.NODE_ENV || 'NOT_SET',
			params: params.params,
			status: 'STARTED',
			script_name: params.scriptName
		};
		created = task.created.getTime();

		var tasks = db.collection("tasks_logs");
		tasks.insert(task, {w: 1}, function(err, records){
			taskId = records.insertedIds[0];
			callback(null);
		});
	},
	end: function(params, callback){
		var task = {
			duration: new Date().getTime()-created,
			status: params.status,
			output:{
				flows: params.output.flows || "-",
				pretty: params.output.pretty,
				raw: params.output.raw
			}
		};
		console.log("Atualizando log de id: ", taskId);
		var tasks = db.collection("tasks_logs");
		tasks.update({_id: taskId}, {$set: task }, callback);
	}
}