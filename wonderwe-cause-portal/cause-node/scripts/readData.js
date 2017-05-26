var path = "/home/sbees/ssh-git/wonderwe-cause-portal/cause-node/scripts/charities-jun-01-201s.json";
var data1 = [];
var csv = require("fast-csv");
var fs = require('fs');
var async = require('async');

//TODO Mysql connection
// var mysql = require('mysql');
// var pool = mysql.createPool({
//   host: '104.131.114.107',
//   user: 'root',
//   password: 'wonderwe1$',
//   database: "wonderwe_prod1"
// });


var fs = require('fs');
var obj;
fs.readFile(path, 'utf8', function(err, data) {
  if (err) throw err;
  charitiesArray = JSON.parse(data);
  console.log(obj);
  var insertedArray = [];

  async.each(charitiesArray, function(singleObj, callback) {

    pool.getConnection(function(err, connection) {
      connection.query('INSERT INTO guide_star(ein,response_json) values (?,?)', [singleObj.ein, JSON.stringify(singleObj)], function(err, rows) {

        connection.release();
        if (err) {
          callback(err);
        } else {
          callback(null);
        }

      });

    });
    
  }, function(err) {
    console.log('Done well');
    //    console.log(insertedArray);

    /*var sql = "INSERT INTO guide_star(ein,response_json) values) VALUES ?";

    pool.getConnection(function(err, connection) {
      connection.query(sql, [insertedArray], function(err) {
        if (err) throw err;
        console.log('DOne well..');
      });

    });
  });*/

  });

});
