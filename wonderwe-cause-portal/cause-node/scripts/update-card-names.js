var mysql = require('mysql');
var wepay = require('wepay').WEPAY;
var async = require('async');

var pool = mysql.createPool({
  host: '104.236.69.222',
  user: 'root',
  password: 'scriptbees1$',
  database: "wonderwe_dev_test"
});

var props = {
  client_id: "121705", // test mode
  client_secret: "963f864c20"
};

pool.query('select * from credit_card_tbl', function(err, result) {


  console.log(result.length);
  var wepay_settings = {
    'client_id': props.client_id,
    'client_secret': props.client_secret,
  };
  wp = new wepay(wepay_settings);

  if (process.env.NODE_ENV == 'production') {
    wp.use_production();
  } else {
    wp.use_staging();
  }

  async.eachSeries(result, function(singleObject, eachCallback) {

    wp.call('/credit_card', {
      "client_id": props.client_id,
      "client_secret": props.client_secret,
      "credit_card_id": singleObject.token
    }, function(response) {
      console.log("Response is not in good state...");

      var buffer = new Buffer(response);
      var responseObj = JSON.parse(buffer.toString('utf-8'));

      if (responseObj) {
        if (responseObj.error) {
          console.log(responseObj.error);
          eachCallback(null);
          //utility.log('error', responseObj.error);
        } else {
          console.log(responseObj);
          pool.query('update credit_card_tbl set card_name=? where id=?', [responseObj.credit_card_name, singleObject.id], function(err, resulty) {
            eachCallback(null);
          });
        }
      }
    });

  }, function(err) {
    console.log('Done Well...');
  });
});
