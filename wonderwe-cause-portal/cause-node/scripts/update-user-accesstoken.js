var props = require('config').props;
var mysql = require('mysql');
var async = require('async');

var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database,
  //connectionLimit: 1500,
  //debug: props.dbdebug,
  //acquireTimeout: 500000,
  //connectTimeout: props.connectTimeout
});
console.log(props);
/*select ct.*,cat.user_id from charity_tbl  ct inner join charity_admin_tbl cat on cat.charity_id = ct.id where ct.access_token is not null group by cat.charity_id;*/

pool.query('select ct.*,cat.user_id from charity_tbl  ct inner join charity_admin_tbl cat on cat.charity_id = ct.id where ct.access_token is not null group by cat.charity_id;', function(err, result) {
  if (err) {
    console.log('It is in error state...');
    console.log(err);
  } else {
    console.log(result.length);
    async.eachSeries(result, function(singleObj, callback) {
      console.log(singleObj);
      pool.query('update user_tbl set access_token=? where id=?', [singleObj.access_token, singleObj.user_id], function(err, userResult) {

        if (err) {
          console.log("Error while update user access_token..");
          console.log(err);
        } else {}
        callback(null);
      });
      //callback(null);
    }, function(err) {
      console.log("DOne well...");
    })
  }
});
