var props = require('config').props;
var async = require('async');
var stripe = require('stripe')(props.stripe_secret_key);
var mysql = require('mysql');
var wepay = require('wepay').WEPAY

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

var access_token = "PRODUCTION_b60ca1cc00cf97f84a8ab458debb348604524742c9fe4fef7b2077234684c731";

var wepay_settings = {
            'client_id': props.client_id,
            'client_secret': props.client_secret,
            'access_token': access_token
          };
wp = new wepay(wepay_settings);

 if (props.environment_type == 'production') {
            wp.use_production();
            console.log('In the production ');
          } else {
          //  wp.use_staging();
           // console.log('Using stageg');
          }

var refundObj = {
  "checkout_id":185074403,
  "refund_reason":"Donor requested for refund",
};

console.log(refundObj);

  wp.call('/checkout/refund', refundObj,
             function(response) {
              console.log('%s', response);
   var buffer = new Buffer(response);
              //var responseObj = JSON.parse(buffer.toString('utf-8'));
   //console.log(responseObj);    
   });
