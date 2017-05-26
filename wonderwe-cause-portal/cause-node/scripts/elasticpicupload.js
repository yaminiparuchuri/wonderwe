var elasticsearch = require('elasticsearch');
var props = require('config').props;
var mysql = require('mysql');
var async = require('async');
var q = require('q');
var underscore = require('underscore');
var geocoder = require('geocoder');

var client = new elasticsearch.Client({
  host: props.elasticServer,
  // log: 'trace'
});

var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database,
  connectionLimit: 1500,
  debug: props.dbdebug,
  acquireTimeout: 500000,
  connectTimeout: props.connectTimeout
});

client.ping({
  requestTimeout: 1000,
  // undocumented params are appended to the query string
  hello: "elasticsearch!"
}, function(err) {

});

client.update({
    index: props.elastic_index,
    type: 'entity',
    id: 3812434,
    body: {
      doc: {
        profilepic: 'https://wonderwe-prod.s3.amazonaws.com/profile/92cc3195-8136-4f4f-8f5e-f859263d34f5-default-userpng.png'
      }
    }
  },
  function(err, result4) {
    console.log(err);
    console.log(result4);
    console.log('Done well...');
  });
