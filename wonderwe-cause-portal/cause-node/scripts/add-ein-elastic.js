var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var elasticsearch = require('elasticsearch');

var pool = mysql.createPool({

  host: props.host,
  port:props.port,
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

//var offset = 0;
recurringMethod(0);

function recurringMethod(offset) {

  var query = 'select c.ein, e.id as entity_id, c.id as charity_id from charity_tbl c inner join entity_tbl e on e.entity_id = c.id and e.entity_type=? limit 1000 offset ?';

  pool.query(query, ['charity', offset]function(err, charityResult) {
    if (err) {
      console.log(err);
    } else {

      if (charityResult.length === 0) {
        process.exit(0);
      }

      async.each(charityResult, function(singleObj, callback) {

        elasticClient.update({
            index: 'we_prod_np',
            type: 'charity_for_fundraiser',
            id: singleObj.entity_id,
            body: {
              doc: {
                ein: singleObj.ein
              }
            }
          },
          function(err, result4) {
            if (err) {
              callback(err);
            } else {
              console.log(result4);
              callback(null);
            }
          });
      }, function(err) {
        console.log(err);
        console.log('Done well..');
        var offset = offset + 1000;
        recurringMethod(offset);
      });
    }
  });
}
