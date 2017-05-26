var fs = require('fs');
var mysql = require('mysql');
var async = require('async');
var parser = require('xml2json');
var utility = require('../utils/util');
var mandrill = require('mandrill-api/mandrill')

db_template = require('db-template');
props = require('config').props;

var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: 'amar',
  password: 'amar1$',
  database: props.database,
  acquireTimeout : 30000
});

var content = fs.readFileSync(__dirname + '/../sql-queries.xml');

var json = parser.toJson(content, {
    sanitize: false
  });
  // returns a string containing the JSON structure by default
var sqlQueries = JSON.parse(json)['sql-queries']['sql-query']
sqlQueryMap = {}
for (var i = 0; i < sqlQueries.length; i++) {
  sqlQueryMap[sqlQueries[i]['id']] = sqlQueries[i]['$t']
}	

excuteQuery = db_template(pool);

var temp =0;
var labels  = ['Non-transaction'];

var checkAndCreateLableAsGroup = function(label,callback){
	excuteQuery.queryForAll('SELECT * FROM email_group_tbl WHERE name=?',[label],function(err,result){
		if(err){
			callback(err,null);
		}else{
			if(result.length){
				console.log('Email group already exists:'+label);
				callback(null,true);
			}else{
				excuteQuery.insertAndReturnKey('INSERT INTO email_group_tbl (name) VALUES (?)',[label],function(err,result){
					if(err){
						console.log(err);
						callback(err,null);
					}else{
						console.log('Email group created:'+label);
						console.log(result);
						callback(null,result);
					}
				});
			}
		}
	});
};



var addMandrillTemplates = function(label,callback){
	mandrill_client = new mandrill.Mandrill(props.mandrilkey);

	mandrill_client.templates.list({label:label},function(result){

		excuteQuery.queryForAll('SELECT * FROM email_group_tbl WHERE name=?',[label],function(err,groups){
			if(err){
				callback(err,null);
			}else{

				async.eachSeries(result,function(ele,eachCallback){
					excuteQuery.queryForAll('SELECT * FROM email_templates WHERE name=?',[ele.name],
						function(err,result){
							if(err){
								eachCallback(null,null);
							}else{
								if(result.length){
									temp++;
									console.log('Email template already exists:'+temp);
									eachCallback(null,{message:'Email template already exists'});
								}else{
									excuteQuery.queryForAll('INSERT INTO email_templates (name,email_group) VALUES (?,?)',[ele.name,groups[0].id],function(err,result){
										if(err){
											console.log(err);
											eachCallback(null,null);
										}else{
											temp ++;
											console.log('Success fully inserted:'+temp);
											eachCallback(null,result);
										}
									});
								}	
							}
						})
				},function(err){
					if(err){
						console.log('error',err);
					}
					callback(null,true);
				}); 
			
			}
		});
	},function(e){
		console.log(e);
		process.exit();
	});
};

var loadTemplates= function(){
	checkAndCreateLableAsGroup(labels[0],function(err,group){
		if(err){
			console.log(err);
			process.exit();
		}else{
			addMandrillTemplates(labels[0],function(err,result){
				if(err){
					console.log(err);
					process.exit();
				}else{
					console.log(result);
					process.exit();
				}
			});
		}
	});
}




loadTemplates();
