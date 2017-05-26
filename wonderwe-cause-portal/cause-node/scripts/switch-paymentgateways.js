var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var elasticsearch = require('elasticsearch');

var pool = mysql.createPool({

  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database,
  acquireTimeout: 100000
});


async.series({
  charity: function(callback) {
    pool.query("select * from charity_tbl c inner join charity_admin_tbl ad on ad.charity_id =c.id and ad.default_value=1 where c.account_id is not null and c.access_token !=''", function(err, charityresult) {
      if (err) {
        callback(err, null);
      } else {
        async.each(charityresult, function(eachObj, eachCallback) {
          var paymentObj = {};
          paymentObj.user_id = eachObj.user_id;
          paymentObj.charity_id = eachObj.charity_id;
          paymentObj.payment_gateway = eachObj.payment_gateway;
          paymentObj.account_id = eachObj.account_id;
          paymentObj.access_token = eachObj.access_token;
          paymentObj.account_status = eachObj.wepay_account_state;

          pool.query('insert into payment_gateways_tbl set ?', paymentObj, function(err, insertResult) {
            console.log(err);
            eachCallback(null);
          });
        }, function(err) {
          callback(null, 'done well...');
        });
      }
    });
  },
  fundraiser: function(callback) {
    pool.query("select * from user_payment_tbl", function(err, fundraiserResult) {
      if (err) {
        callback(err, null);
      } else {
        async.each(fundraiserResult, function(eachObj2, eachCallback2) {
          var paymentObj = {};
          paymentObj.user_id = eachObj2.user_id;
          paymentObj.charity_id = null;
          paymentObj.payment_gateway = eachObj2.payment_gateway;
          paymentObj.account_id = eachObj2.account_id;
          paymentObj.access_token = eachObj2.access_token;
          paymentObj.account_status = eachObj2.account_status;

          pool.query('insert into payment_gateways_tbl set ?', paymentObj, function(err, insertResult) {
            console.log(err);
            eachCallback2(null);
          });
        }, function(err) {
          callback(null, 'done well...');
        });
      }
    });
  }
}, function(err, result) {
  if (err) {
    console.log(err);
  } else {
    console.log('Finished weel....');
  }
});
