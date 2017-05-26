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

var offset2 = 0;
recurringMethod();

function recurringMethod() {
  console.log(offset2);
  var query = 'select * from entity_tbl e where e.entity_type=? limit 1000 offset ?';

  pool.query(query, ['charity', offset2], function(err, charityResult) {
    if (err) {
      console.log(err);
    } else {

      // console.log(charityResult)
      if (charityResult.length === 0) {
        process.exit(0);
      }

      async.eachSeries(charityResult, function(singleObj, callback) {

        console.log(singleObj.id);
        console.log(singleObj.slug);

        elasticClient.update({
            index: props.elastic_index + '_np',
            type: 'charity_for_fundraiser',
            id: singleObj.id,
            body: {
              doc: {
                username: singleObj.slug
              }
            }
          },
          function(err, result4) {
            if (err) {
              console.log(err);
            }
            callback(null);
          });
      }, function(err) {
        offset2 = offset2 + 1000;
        recurringMethod(offset2);
      });
    }
  });
}
