var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var elasticsearch = require('elasticsearch');

var pool = mysql.createPool({

  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database
});

elasticClient = new elasticsearch.Client({
  host: props.elasticServer,
  log: props.elasticSearchlog
})

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

recurringMethod();

function recurringMethod() {

  elasticClient.search({
    index: props.elastic_index + '_np',
    type: 'charity_for_fundraiser',
    size: 1000,
    "query": {
      "filtered": {
        "filter": {
          "missing": {
            "field": "ein"
          }
        }
      }
    }
  }, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      if (result.hits.hits.length <= 80) {
        process.exit(0);
      }
      //console.log(result.hits.hits);
      var data = result.hits.hits;
      console.log(data.length);
      async.eachSeries(data, function(singleObj, eachCallback) {

        pool.query('select c.ein from charity_tbl c where c.id =?', [singleObj._source.id], function(err, charityResult) {
          if (err) {
            console.log(err);
            eachCallback(null);
          } else {
            if (charityResult && charityResult.length > 0) {
              console.log(singleObj._id);
              console.log(charityResult[0].ein);
              console.log(singleObj._source.id);
              elasticClient.update({
                  index: props.elastic_index + '_np',
                  type: 'charity_for_fundraiser',
                  id: singleObj._id,
                  body: {
                    doc: {
                      ein: charityResult[0].ein
                    }
                  }
                },
                function(err, result4) {
                  console.log(err);
                  console.log(result4);
                  eachCallback(null);
                });

            } else {
              console.log("Failed Conditions...");
              console.log(singleObj._source);
              console.log('......................................');
              eachCallback(null);
            }
          }
        });
      }, function(err) {
        //  console.log('Done wel...');
        recurringMethod();
      });
    }
  });
}
