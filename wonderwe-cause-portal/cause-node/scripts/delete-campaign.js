var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var elasticsearch = require('elasticsearch');
var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: props.username,
  port:props.port,
  password: props.password,
  database: props.database,
  acquireTimeout:30000
}); 
var moment = require('moment');

var elasticClient = new elasticsearch.Client({
  host: props.elasticServer,
  // log: 'trace'
});

var codeTitles = ["HappyBottoms"] /* ["Heartland Habitat", //Heartland Habitat For Humanity, inc.
"ND Club of KC",  //Notre Dame Club of Kansas City
"Rosedale",  //Rosedale Development Association
"Connecting for Good",   //Deleted 
"Education Foundation of Palm Beach", //Education Foundation of Palm Beach County
"HappyBottoms", //Deleted
"Kutz Foundation",  //Draft
"Tech Museum", //The Tech Museum of Innovation
"Aim 2 Impact", //Draft
"Donald's Org", //Draft
"Disney Studios", //Draft
"3rd and Goal",   //3rd & Goal - Veterans Home Aid
"Nativity House", //Nativity House KC  //Help raise money for Nativity House
"Face of Mercy",  //Draft
"Vancouver",      //Vancouver Neighbourhood Food Networks
"Greener Pastures", //Greener Pastures Holisticare, Inc.
"Myworldwall",      //Draft
"St. Paul's Outreach", //St Paul's Outreach, Inc  //Saint Paul's Outreach
"Rededef",  //Draft
"Happy",    //Draft 
"Martha's", //Martha's Foundation 
"Texas Humane Heroes", //Draft
"Test org System"]; //Did not find exact one 


/*
1. Get the entitydata
2. delete the data in elasticsearch based on entityid, entityid is the unique id in elasticsearch
3. delete the data from DB
*/

function deleteCampaignById(codeId,deleteCallback){
var deleteCampaignQuery = "delete  e.*,f.* from entity_tbl e inner join code_tbl c on e.entity_id = c.id and e.entity_type ='code' left outer join transaction_tbl t on t.code_id = c.id left outer join follow_tbl f on f.entity_id = e.id where c.id = ?";
var elasticQuery = "select * from entity_tbl where entity_id=? and entity_type=?";

pool.query(elasticQuery, [codeId, 'code'], function(err, elasticResult) {
  if (err) {
    deleteCallback(err);
  } else {

    async.each(elasticResult, function(entityObj, elasticCallback) {

      elasticClient.delete({
        index: props.elastic_index,
        type: 'entity',
        id: entityObj.id
      }, function(error, response) {

        if (error) {
          console.error(error);
        } else {
          console.log(response);
        }
        elasticCallback(null);
      });

    }, function(err) {
      if (err) {
        deleteCallback(err);
      } else {

        pool.query(deleteCampaignQuery, [codeId],function(err, deleteResult) {
          if(err){
            console.log('In delete campagin query');
            deleteCallback(err,null);
          }else{
            console.log('Delete entity,follow result:',deleteResult);
            pool.query('UPDATE code_tbl SET date_deleted=?,show_in_search=0 WHERE id=?',[moment.utc().toDate(),codeId],function(err,result){
              if(err){
                deleteCallback(err);
              }else{
                console.log(result);
                deleteCallback(null,{
                  codeId:codeId,
                  message:'Successfully deleted code id'
                });
              }
            });
          }          
        });
      }
    });
  }
});

}

var getCampaignIdsByTitle = function(){
  var query = 'SELECT * FROM code_tbl WHERE title=?';

  async.eachSeries(codeTitles,function(ele,eachSeriesCallback){
    console.log(ele);
    pool.query(query,[ele],function(err,result){
      if(err){
        eachSeriesCallback(err);
      }else{
        if(result[0]){
          var codeInfo = result[0];
          deleteCampaignById(codeInfo.id,function(err,result){
            if(err){
              eachSeriesCallback(err);
            }else{
              eachSeriesCallback(null);
              console.log(result);
              process.exit();
            }
          });
        }else{
          eachSeriesCallback('Campaign not found');
        } 
      }
    });  
  },function(err){
    console.log('Came to each callback');
    if(err){
      console.log('Error in each callback');
      console.log(err);
    }else{
      console.log('Successfully deleted campagins');
    }
    process.exit();
  });

};

console.log('Script starting');
getCampaignIdsByTitle();


