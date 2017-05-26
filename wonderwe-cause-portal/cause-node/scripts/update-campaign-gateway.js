var async = require('async');
var mysql = require('mysql');
var props = require('config').props;

pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database,
  acquireTimeout: 100000
});

var fundraiserQuery = "SELECT pt.* FROM payment_gateways_tbl pt inner join user_tbl u on u.id= pt.user_id and pt.charity_id is null"
var charityQuery = "SELECT pt.* FROM payment_gateways_tbl pt inner join charity_tbl c on c.id= pt.charity_id";

async.parallel({
  fundraisers: function(callback) {
    pool.query(fundraiserQuery, function(err, fundraiserResult) {
      if (err) {
        callback(err, null);
      } else {
        async.each(fundraiserResult, function(singleObj, eachCallback) {
          pool.query('update code_tbl set payment_gateway_id=? where user_id=?', [singleObj.id, singleObj.user_id], function(err, updateResult) {
            eachCallback(null);
          });
        }, function(err) {
          callback(null, 'Done well..');
        });
      }
    });
  },
  charity: function(callback) {
    pool.query(charityQuery, function(err, charityResult) {
      if (err) {
        callback(err, null);
      } else {
        async.each(charityResult, function(singleObj2, eachCallback2) {
          pool.query('update code_tbl set payment_gateway_id=? where charity_id=?', [singleObj2.id, singleObj2.charity_id], function(err, updateResult) {
            eachCallback2(null);
          });
        }, function(err) {
          callback(null, 'Done well..');
        });
      }
    });
  }
}, function(err, result) {
  console.log(err);
  console.log(result);
  console.log('DOne well...');
});
