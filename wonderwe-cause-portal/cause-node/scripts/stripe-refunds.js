var props = require('config').props;
var async = require('async');
var stripe = require('stripe')(props.stripe_secret_key);
var mysql = require('mysql');

var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database,
  connectionLimit: props.connectionLimit,
  debug: props.dbdebug,
  connectTimeout: props.connectTimeout
});

stripe.refunds.list({
    limit: 100
  }, {
    stripe_account: props.stripe_account_id
  },
  function(err, refunds) {
    // asynchronously called
    if (err) {
      console.log(err);
    } else {

      console.log(err);
      console.log(refunds);
      var funds = refunds.data;
      console.log(funds);
      async.each(funds, function(singleObj, eachCallback) {

        pool.query('select * from transaction_tbl where checkout_id=?', [singleObj.charge], function(err, result) {
          console.log(err);
          console.log(result);
          eachCallback(null);
        });

        /*pool.query('delete from transaction_tbl where checkout_id=?', [singleObj.id], function(err, result) {
          console.log(err);
          console.log(result);
          eachCallback(null);
        });*/
      }, function(err) {
        console.log('Done well...');
      });
    }
  });
