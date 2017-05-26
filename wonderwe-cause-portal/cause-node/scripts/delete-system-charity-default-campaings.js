var props = require('config').props;
var mysql = require('mysql');
var async = require('async');
var db_template = require('db-template');




var pool = mysql.createPool({
  host: props.host,
  port:props.port,
  user: props.username,
  password: props.password,
  database: props.database,
  connectionLimit: 1500,
  debug: false,
  acquireTimeout: 500000,
  connectTimeout: 50000
});

var excuteQuery = db_template(pool);


function deleteSystemCharitiesDefaultCampaigns(){
	excuteQuery.queryForAll('SELECT * FROM code_tbl WHERE charity_id IN (SELECT id FROM charity_tbl WHERE charity_from="system") AND description IS NULL ORDER BY charity_id',[],
		function(err,result){
			if(err){
				console.log(err);
				process.exit();
			}else{
				console.log(result.length);
				deleteAllDefaultCampaigns(result,function(err,result){
					console.log('Error',err);
					console.log('Result',result);
					process.exit();
				});
			}
		})
}

function deleteAllDefaultCampaigns(campaigns,callback){
	var temp =0;
	async.eachSeries(campaigns,function(campaign,eachCallback){
		excuteQuery.queryForAll('DELETE FROM entity_tbl WHERE entity_id=? AND entity_type="code"',[campaign.id],function(err,result){
			if(err){
				console.log('Error in delete campaign');
				eachCallback(err,null);
			}else{
				console.log('Successfully deleted entity with entity_id',campaign.id);
				excuteQuery.queryForAll('DELETE FROM code_tbl WHERE id=?',[campaign.id],function(err,result){
					if(err){
						eachCallback(err,null);
					}else{
						eachCallback(null);
						temp++;
						console.log(result);
					}
				});
			}
		});
	},function(err){
		if(err){
			callback(err,null);
		}else{
			callback(null,{message:'Successfully deleted campaigns',total:campaigns.length,deleted:temp});
		}
	});
}

deleteSystemCharitiesDefaultCampaigns();


