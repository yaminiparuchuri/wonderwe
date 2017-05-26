var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var elasticsearch = require('elasticsearch');
var moment = require('moment');
var db_template = require('db-template');
var fs = require('fs');
var parser = require('xml2json');

var pool = mysql.createPool({

  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database
});

var excuteQuery = db_template(pool);

var content = fs.readFileSync(__dirname + '/../sql-queries.xml');

var json = parser.toJson(content, {
    sanitize: false
  })
  // returns a string containing the JSON structure by default
var sqlQueries = JSON.parse(json)['sql-queries']['sql-query']
sqlQueryMap = {}
for (var i = 0; i < sqlQueries.length; i++) {
  sqlQueryMap[sqlQueries[i]['id']] = sqlQueries[i]['$t']
}


elasticClient = new elasticsearch.Client({
  host: props.elasticServer,
  log: props.elasticSearchlog
});

elasticClient.ping({
  // ping usually has a 3000ms timeout
  requestTimeout: Infinity,
  hello: "elasticsearch!"
}, function(error) {
  if (error) {
    console.trace('elasticsearch cluster is down!');
  } else {
    console.log('Elastic server is up..');
    console.log('All is well');
  }
});



var sqlQuery = "select ct.*, et.id as entity_id from entity_tbl et inner join code_tbl ct on ct.id = et.entity_id where et.entity_type='code'";
var getCodeIds=[];
var charityNotFound=[];
var success = 0;
pool.query(sqlQuery, function(err, elasticResult) {
  if (err) {
    console.log(err);
  } else {
    console.log('Total campaigns:'+elasticResult.length);
    async.each(elasticResult, function(singleObj, callback) {

      var codeObj = {};


      elasticClient.get({
          index: props.elastic_index,
          type: 'entity',
          id: singleObj.entity_id,
          // body: {
          //   doc: codeObj
          // }
        },
        function(err, result4) {
          if (err) {
       //     console.log(err);
            callback(null);
          } else {
          if(!result4._source.campaign_creator){
            getCodeIds.push(singleObj.id);
            if(singleObj.charity_id){
              query = 'charityCodeJob';              
            }else{
              query = 'fundraiserCodeJob';
            }

            excuteQuery.queryForAll(sqlQueryMap[query],[singleObj.id],function(err,result){
              if(err){
                console.log(err);
                process.exit();
              }else if(result[0]){
                if(singleObj.charity_id){
                  if(singleObj.team_campaign === 'yes'){
                    codeObj.campaign_creator = result[0].user_name;
                  }else{
                    codeObj.campaign_creator = result[0].charity_name;
                  }
                }else{
                    codeObj.campaign_creator = result[0].creator_name;
                }
                 
                 elasticClient.update({
                    index: props.elastic_index,
                    type: 'entity',
                    id: singleObj.entity_id,
                     body: {
                       doc: codeObj
                     }
                  },function(err,updateResult){
                    if(err){
                      console.log(err);
                    }else{
                      console.log(updateResult);
                      success++;
                      callback(null);
                    }
                  });

              }else{
                charityNotFound.push(singleObj.id);
                callback(null);
              }
            });
          }else{
            callback(null);
          }
        }

        });

    }, function(err) {

      console.log('Done well...');
      console.log('Total campaign ids which do not have campaign creator in elastic search are:');
      console.log(getCodeIds.toString());

      console.log('Charity not found images:');
      console.log(charityNotFound.toString());

      console.log('Successfully updated campaigns count:');
      console.log(success);
      process.exit();
    });

  }
});
