var props = require('config').props;
var async = require('async');
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



var stripe = require("stripe")("sk_live_WWhyVTjO4tjwUNbobG7ofRCo");

stripe.refunds.create({charge:"ch_19QqFKAW3oZs3U3lInB8GRfY"},
  function(err, charge){
    // asynchronously called
    console.log(err);
    console.log(charge);
  });