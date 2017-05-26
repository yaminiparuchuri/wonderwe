/**
 * To update the default campaign, user_id in code_tbl
 * [mysql description]
 * @type {[type]}
 */
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

pool.query('select * from code_tbl where user_id is null', function(err, result) {
  if (err) {
    console.log(err);
  } else {

    async.eachSeries(result, function(singleObj, callback) {

        pool.query('select * from charity_admin_tbl where charity_id=? and default_value=?', [singleObj.charity_id, 1], function(err, charityresult) {

          if (charityresult && charityresult.length > 0) {
            var user_id = charityresult[0].user_id;

            pool.query('update code_tbl set user_id=? where id=?', [user_id, singleObj.id], function(err, updatedResult) {

              console.log(err);
              callback(null);
            });
          } else {
            console.log(singleObj);
            callback(null);
          }
        });

      },
      function(err) {
        console.log('DOne well...');
      });
  }
});
