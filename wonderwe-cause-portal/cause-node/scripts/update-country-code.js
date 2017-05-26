var mysql = require('mysql');
var async = require('async');
var props = require('config').props;

var pool = mysql.createPool({

  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database
});

pool.query('select * from country_tbl', function(err, result) {
  if (err) {
    console.log(err);
  } else {

    async.each(result, function(singleobj, callback) {

      pool.query('update countries_tbl set country_code=? where name=?', [singleobj.country_code, singleobj.country_name], function(err, result2) {

        console.log(err);


        callback(null);
      });

    }, function(err) {
      console.log('DOne well...');
    });
  }
});
