 
var local = {
	fr03: {
		path: "",
		pathBackup: ""
	},
	db: "localhost/opa",
	s3:{
		accessKeyId: "",
		secretAccessKey: "",
		region: "",
	}
};

var development = {
	fr03: {
		path: "",
		pathBackup: ""
	},
	db: "localhost/opa",
	s3:{
		accessKeyId: "",
		secretAccessKey: "",
		region: "",
	}
};

var stage = {
	fr03: {
		path: "",
		pathBackup: ""
	},
	db: "localhost/opa",
	s3:{
		accessKeyId: "",
		secretAccessKey: "",
		region: "",
	}
};

var production = {
	fr03: {
		path: "",
		pathBackup: ""
	},
	db: "localhost/opa",
	s3:{
		accessKeyId: "",
		secretAccessKey: "",
		region: "",
	}
};


module.exports = function(){
  var env = process.env.NODE_ENV || 'local';
  if(env=="development"){
  	return development;
  }
  if(env=="production"){
  	return production;
  }
  if(env=="stage"){
  	return stage;
  }
  return local;
};