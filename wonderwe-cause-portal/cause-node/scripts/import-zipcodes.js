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
  acquireTimeout : 100000
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

// zipcodes_tbl
var csv = require("fast-csv");
var fs = require('fs');

var path = "/Users/Trinesh/Downloads/allCountries.csv"
var array = [];
var count = 0;

fs.createReadStream(path)
  .pipe(csv({
    headers: false
  }))
  .on("data", function(data) {
if(data[0].split('\t')[0]  && data[0].split('\t')[1]){
array.push([data[0].split('\t')[1], data[0].split('\t')[0]]);
}


    console.log(data[0].split('\t')[0]);
    console.log(data[0].split('\t')[1])
    count = count + 1;
  //  console.log(count);
  //  array.push([data.zip, data.country_code]);
}).on('error', function(error){
console.log('Errorr....');
  console.log(error);
})
  .on("end", function() {
    console.log("This is done well...");
  //  console.log(array);
    console.log(count);
  //  console.log(array.length);
    //  async.each(array, function(singleObj, callback) {

    //   pool.query('insert into zipcodes_tbl (zipcode, country_code) values(?,?)', [singleObj.zip, singleObj.country_code], function(err, result) {
    //     if (err) {
    //       console.log(err);
    //       count = count + 1;
    //     }
    //     console.log(count);
    //     callback(null);
    //   });
    // }, function(err) {
    //   console.log(count);
    //   console.log(array.length);
    //   console.log('This is done well..');
    // });

    var sql = "INSERT INTO zipcodes_tbl (zipcode, country_code) VALUES ?";

    pool.query(sql, [array], function(err, finalResult) {

      console.log(err);
      console.log(finalResult);
    });
  });
