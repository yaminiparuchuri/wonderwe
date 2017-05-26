var props = require('config').props;
var elasticsearch = require('elasticsearch');
var async = require('async');
var mysql = require('mysql');
db_template = require('db-template');
var elasticClient = new elasticsearch.Client({
  host: props.elasticServer,
  log: props.elasticSearchlog
});


var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database
});

executeQuery = db_template(pool);


function getElasticCampaigns() {

  var npSearchQuery = {
    filtered: {
      "filter": {
        "term": {
          "username": "12345we234"
        }
      }
    }
  };



  var elasticSeachQuery = {
    size: 350,
    query: npSearchQuery,
    highlight: {
      "pre_tags": ['<b>'],
      "post_tags": ['</b>'],
      fields: {
        'username': {},
        'fullname': {},
        'state': {},
        'city': {},
        'description': {},
        'wecode': {},
        'approved': {},
        'id': {},
        'status': {}
      }
    }
  };

  var searchQuery = {
    index: props.elastic_index,
    type: 'entity',
    body: elasticSeachQuery
  };



  elasticClient.search(searchQuery, function(err, result) {
    if (err) {
      console.log('In the error:');
      console.log(err);
    } else {
      async.each(result.hits.hits, function(ele, eachCallback) {
        executeQuery.queryForAll('SELECT * FROM code_tbl WHERE id=?', [ele._source.id], function(err, result) {
          console.log(ele._source.entityid);
          console.log(result);
          // if(err){
          // 	console.log(err);
          // }else if(!result.length){
          // 	console.log(ele._source.entityid);
          // }
          eachCallback(null);
        });
      }, function(err) {
        console.log(err);
        console.log('Completed:');
        process.exit();
      });
    }
  });

}



function deleteEleasticCode(id,callback) {

  elasticClient.delete({
    index: props.elastic_index,
    type: 'entity',
    id: id
  }, function(err, result) {
    if (err) {
      console.log(err);
      callback(err,null);
    } else {
    	callback(null,result)
      console.log(result);
      console.log('Deleted successfully');
      process.exit();
    }
  })
}

function getDeletedCamapigns() {
  executeQuery.queryForAll('SELECT * FROM code_tbl WHERE date_deleted IS NOT NULL', [], function(err, result) {
    if (err) {
      console.log(err);
    } else {
      async.each(result, function(ele, eachCallback) {

        var npSearchQuery = {
          filtered: {
            "filter": {
              "term": {
                "username": "12345we234"
              }
            }
          }
        };

        var elasticSeachQuery = {
          size: 350,
          query: npSearchQuery,
          highlight: {
            "pre_tags": ['<b>'],
            "post_tags": ['</b>'],
            fields: {
              'username': {},
              'fullname': {},
              'state': {},
              'city': {},
              'description': {},
              'wecode': {},
              'approved': {},
              'id': {},
              'status': {}
            }
          }
        };

        var searchQuery = {
          index: props.elastic_index,
          type: 'entity',
          body: elasticSeachQuery
        };

        elasticClient.search(searchQuery, function(err, result) {
          if (err) {
            console.log(err);
          } else {
            if (result.hits.total) {
              console.log(result);
            }
          }
          eachCallback(null);
        });
      }, function(err) {
        console.log(err);
        console.log('Completed:');
        process.exit();
      });
    }
  });
}


function getDraftedCamapigns() {
  executeQuery.queryForAll('SELECT * FROM code_tbl WHERE status="draft"', [], function(err, result) {
    if (err) {
      console.log(err);
    } else {

      async.each(result, function(ele, eachCallback) {
        var npSearchQuery = {
          filtered: {
            "filter": {
              "term": {
                "username": ele.code_text
              }
            }
          }
        };

        var elasticSeachQuery = {
          size: 350,
          query: npSearchQuery,
          highlight: {
            "pre_tags": ['<b>'],
            "post_tags": ['</b>'],
            fields: {
              'username': {},
              'fullname': {},
              'state': {},
              'city': {},
              'description': {},
              'wecode': {},
              'approved': {},
              'id': {},
              'status': {}
            }
          }
        };

        var searchQuery = {
          index: props.elastic_index,
          type: 'entity',
          body: elasticSeachQuery
        };

        elasticClient.search(searchQuery, function(err, result) {
          if (err) {
            console.log(err);
          } else {
            if (result.hits.total) {
              if ((result.hits.hits[0]._source.status != 'draft') && (result.hits.hits[0]._source.type === 'code')) {
                console.log(result.hits.hits[0]._source.username + ':' + ele.code_text);
                console.log(result.hits.hits[0]._source.entityid);
              }
            }
          }
          eachCallback(null);
        });
      }, function(err) {
        console.log(err);
        console.log('Completed:');
        process.exit();
      });
    }
  });
}


function updateElasticData(id) {
  elasticClient.update({
      id: id,
      type: 'entity',
      index: props.elastic_index,
      body: {
        doc: {
          status: 'draft'
        }
      }
    }).then(function(result) {
      console.log(result);
      console.log('Success:');
      process.exit();
    })
    .error(function(error) {
      console.log(error);
    });
}


function getElasticCampaignsAndDelete() {

  var npSearchQuery = {
    filtered: {
      "filter": {
        "term": {
          "type": "code"
        }
      }
    }
  };



  var elasticSeachQuery = {
    size: 5744,
    query: npSearchQuery,
    highlight: {
      "pre_tags": ['<b>'],
      "post_tags": ['</b>'],
      fields: {
        'username': {},
        'fullname': {},
        'state': {},
        'city': {},
        'description': {},
        'wecode': {},
        'approved': {},
        'id': {},
        'status': {}
      }
    }
  };

  var searchQuery = {
    index: props.elastic_index,
    type: 'entity',
    body: elasticSeachQuery
  };



  elasticClient.search(searchQuery, function(err, result) {
    if (err) {
      console.log('In the error:');
      console.log(err);
    } else {
      console.log('count:', result.hits.hits.length);
      async.each(result.hits.hits, function(ele, eachCallback) {

        executeQuery.queryForAll('SELECT * FROM code_tbl WHERE id=?', [ele._source.id], function(err, result) {
          //console.log(ele._source.entityid);
          //				console.log(result);
          //				console.log("in result1");
          if (err) {
            console.log(err);
          } else if (!result.length) {
            console.log(ele._source.entityid);
            deleteEleasticCode(ele._source.entityid, function(err, result) {
              if (err) {
                eachCallback(err);
              } else {
                eachCallback(null);
              }
            });

          }
         // eachCallback(null);
        });
      }, function(err) {
        console.log("in each")
        console.log(err);
        console.log("in result");
        console.log('Completed:');
        process.exit();
      });
    }
  });

}

//getElasticCampaigns();

//deleteEleasticCode(3812501);

//getDeletedCamapigns();

//getDraftedCamapigns();


//updateElasticData(6167199);
getElasticCampaignsAndDelete();


/***
3812612
6165940
3812502
6165943
3812614
6165947
6165942
3812613
6165941
***/
