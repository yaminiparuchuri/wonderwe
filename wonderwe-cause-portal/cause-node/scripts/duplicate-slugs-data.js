var async = require('async');
var mysql = require('mysql');
var props = require('config').props;


pool = mysql.createPool({

  host: props.host,
  user: props.username,
  port: props.port,
  password: props.password,
  database: props.database,
  acquireTimeout: 100000
});


var values = [];

pool.query('select slug, count(*) as count from entity_tbl where entity_type=? group by slug having count(*)>1', ['charity'], function(err, result) {
  if (err) {
    console.log(err);
  } else {
    async.each(result, function(singleObj, callback) {
      values.push([singleObj.slug, singleObj.count, 'np']);
      callback(null);
      //['demian', 'demian@gmail.com', 1], ['john', 'john@gmail.com', 2], ['mark', 'mark@gmail.com', 3], ['pete', 'pete@gmail.com', 4]
    }, function(err) {

      var sql = "INSERT INTO ww_duplicate_slugs_tbl (slug, count, status) VALUES ?";
      pool.query(sql, [values], function(err) {
        if (err) {
          console.log('Bulk insert error');
          console.log(err);
        } else {
          console.log('DOne wel...');
        }
      });
    });
  }
});
