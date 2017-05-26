var async = require('async');
var props = require('config').props;
var elasticsearch = require('elasticsearch');

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
recurringMethod();

function recurringMethod() {

  elasticClient.search({
      index: props.elastic_index + '_np',
      type: 'charity_for_fundraiser',
      size: 1000,
      body: {
        "query": {
          "constant_score": {
            "filter": {
              "missing": { "field": "status" }
            }
          }
        }
      }
    },
    function(err, result) {
      //  console.log(err);
      //  console.log(result);
      var data = result.hits.hits;

      console.log(data);

      if (data.result == 0) {
        process.exit(0);
      }

      async.each(data, function(singleObj, eachCallback) {

        // console.log(singleObj);

        elasticClient.update({
            index: props.elastic_index + '_np',
            type: 'charity_for_fundraiser',
            id: singleObj._id,
            body: {
              doc: {
                status: 'NOT_CLAIMED'
              }
            }
          },
          function(err, result4) {
            if (err) {
              eachCallback(err);
            } else {
              console.log(result4);
              eachCallback(null);
            }
          });
      }, function(err) {
        //recurringMethod();
        //
        console.log('This works well..');
      });
    });
};
