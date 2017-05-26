var mysql = require('mysql');
var props = require('config').props;
var wepay = require('wepay');
var db_template = require('db-template');
var async = require('async');
var uuid = require('uuid');
var fs = require('fs');
var parser = require('xml2json');
var wepay = require('wepay').WEPAY;




var pool = mysql.createPool({
  host: props.host,
  user: props.username,
  password: props.password,
  port: props.port,
  database: props.database,
  connectionLimit: props.connectionLimit,
  debug: props.dbdebug,
  connectTimeout: props.connectTimeout
    //  acquireTimeout : 30000
});

var content = fs.readFileSync(__dirname + '/../sql-queries.xml');

var json = parser.toJson(content, {
    sanitize: false
  })
  // returns a string containing the JSON structure by default
var sqlQueries = JSON.parse(json)['sql-queries']['sql-query']
sqlQueryMap = {}
for (var i = 0; i < sqlQueries.length; i++) {
  sqlQueryMap[sqlQueries[i]['id']] = sqlQueries[i]['$t']
}

var excuteQuery = db_template(pool);


function testRecurringDonations(){

var wepay_settings = {
        //     'account_id' : account_id,
        'client_id': props.client_id,
        'client_secret': props.client_secret,
        "access_token": 'STAGE_7ab934d2b39948b52cdc4f5c052392a68bd40c7663d8135a9ef2b9ca7d61f061'
      }

      wp = new wepay(wepay_settings);
     
        wp.use_staging();

var success = 0;
var fail = 0;

var paymentObject = {
  "account_id": 533148279,
  "short_description": "monthly subscription is on live",
  "amount": 1,
  "currency": 'USD',
  'type': 'DONATION',
  "app_fee": 0,
  "fee_payer": 'payee',
  'payment_method_id': 1724931887, // user's credit_card_id
  'payment_method_type': 'credit_card',
  "reference_id": 4402 + "#" + uuid.v4(),
  "callback_uri": props.domain + "/wepay/subscription/plan/ipns",
};

	for(var i=0;i<200;i++){
		wp.call('/checkout/create',paymentObject,function(response){
			var buffer = new Buffer(response);
      var responseObj = JSON.parse(buffer.toString('utf-8'));


      if (responseObj.error) {
            var errObj = {
              status: 400,
              errors: [responseObj.error_description]
            };

            
            console.log(errObj);
            //  callback(responseObj.error, null);
            ++fail;
	          console.log('success:'+success+', error:'+fail);
          }else{
          	console.log(responseObj);
          	++success;
          	console.log('success:'+success+', error:'+fail);

          }
		});
	}
}


testRecurringDonations();