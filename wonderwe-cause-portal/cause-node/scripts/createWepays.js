var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var moment = require('moment');
var uuid = require('node-uuid');
var fs = require('fs');

var parser = require('xml2json')
var Agenda = require('agenda')
wepay = require('wepay').WEPAY
var utility = require('../utils/util');
db_template = require('db-template');
var wePayService = require('../services/wepay');
var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database
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

excuteQuery = db_template(pool);

/**
 * Original ip parameters
 */
var original_ip = "49.207.171.153";
var original_device = "153.171.207.49-ras.beamtele.net";

var createPaymentGateWays = function(){
	excuteQuery.queryForAll('SELECT c.title,IFNULL(c.country,up.country) AS country,c.id AS code_id,c.user_id,u.name,u.email FROM user_tbl u INNER JOIN code_tbl c ON c.user_id=u.id AND c.country=223 AND u.id IN  (SELECT user_id FROM code_tbl WHERE individual="yes" AND user_id NOT in (select user_id FROM payment_gateways_tbl))'+
 'LEFT OUTER JOIN user_profile_tbl up ON up.user_id = c.user_id;',[],function(err,result){
 	if(err){
    console.log(err);
 		utility.nodeLogs('ERROR',{message:'Error in create payment gateways'});
 		process.exit(0);
 	}else{
 		
 		 async.eachSeries(result,function(ele,eachCallback){
 			if(ele.country === 223 || ele.country === 224){
 				console.log(ele); 				
 				ele.country_code = 'US';
 				ele.original_ip = original_ip;
 				ele.original_device = original_device;
 				wepayAccountRegistration(ele,function(err,result){
 					if(err){
 						utility.nodeLogs('ERROR',{error:err});
 						eachCallback(err);
 					}else{
 						utility.nodeLogs('INFO',{result:result});
 						eachCallback();
 					}
 				}); 
 			}else{
 				eachCallback(null);
 			}
 		},function(err){
 			process.exit();
 		}); 
 	}
 });
};


function wepayAccountRegistration(obj, callback) {
  var me = this;
  // Get the details realated to the charity/fundraiser

  var logsObj = obj;
  console.log('In wepay account registration');
  console.log(sqlQueryMap['CharityOrFundDetails']);
  excuteQuery.queryForObject(sqlQueryMap['CharityDetails'], [obj.code_id], function(err, detailsObj) {
    if (err) {
      console.log(err);
      callback(err, null);

      logsObj.error = err;
      logsObj.data = obj;
      logsObj.action = "Got an error while get the details of user and charity details -- wepay Service : 668";
      utility.nodeLogs('ERROR', logsObj);

    } else {
      var result = detailsObj[0];

      //Set WePay settings properties from props
      if(result.country_code != 'US' && result.country_code != 'CA' ){
      	callback(null,{message:'Not an us country'});
      	return false;
      }
      if(result.first_name){
        result.first_name = result.first_name.escapeQoutes();
      }

      if(result.description){
        result.description = result.description.escapeQoutes();
      }

      if(result.last_name){
        result.last_name = result.last_name.escapeQoutes();
      }

      if(result.title){
        result.title = result.title.escapeQoutes();
      }

      if(result.name){
        result.name = result.name.escapeQoutes();
      }

      excuteQuery.queryForAll(sqlQueryMap['checkUserAccessToken'], [obj.user_id, 'wepay'], function(err, accessTokenDetails) {
        if (err) {
          callback(err, null);

          logsObj.error = err;
          logsObj.action = "Got an error while get the wepay account details of user or charity details -- wepay Service : 681";
          utility.nodeLogs('ERROR', logsObj);

        } else {
          if (accessTokenDetails && accessTokenDetails.length > 0) {
            result.existingUser = true;
            accountRegistration(result, obj, accessTokenDetails[0].access_token, callback);

          } else {

            var wepay_settings = {
              'client_id': props.client_id,
              'client_secret': props.client_secret
            };

            // Initialized the WePay constructor
            wp = new wepay(wepay_settings);

            if (process.env.NODE_ENV == 'production') {
              wp.use_production();
            } else {
              wp.use_staging();
            }
            if (result.name) {
              var nameArray = result.name.split(' ');
              if (nameArray && nameArray.length > 1) {
                result.first_name = nameArray[0];
                result.last_name = nameArray[1];
              } else {
                result.first_name = nameArray[0];
                result.last_name = nameArray[0];
              }
            } else {
              result.first_name = result.title;
              result.last_name = result.title;
            }

            // User account creation for Wepay
            // WePay will give us a access_toke to us and Svae that in our database
            // While donate we should use access_token, Mean it will give the access to the user's WePay account
            console.log(result);
            wp.call('/user/register', {
                "client_id": props.client_id,
                "client_secret": props.client_secret,
                "email": result.email_address,
                "scope": "manage_accounts,collect_payments,view_user,preapprove_payments,manage_subscriptions,send_money",
                "first_name": result.first_name,
                "last_name": result.last_name,
                "original_ip": obj.original_ip,
                "original_device": obj.original_device,
                "tos_acceptance_time": moment.utc().valueOf()
              },
              function(response) {
              	console.log(response);
                var buffer = new Buffer(response);
                var responseObj = JSON.parse(buffer.toString('utf-8'));
                if (responseObj.error) {

                  utility.log('WARN', "We Pay User Register Got an Error");
                  callback(responseObj, null);

                  logsObj.error = responseObj.error;
                  logsObj.responseObj = responseObj;
                  logsObj.action = "Got an error while create WePay user account -- wepay Service : 743";
                  utility.nodeLogs('ERROR', logsObj);

                } else {
                  // Create WePay account and attach to the WePay user account
                  // Means, We attach the WePay account to the user, based on access_token
                  accountRegistration(result, obj, responseObj.access_token, callback);
                }
              });
          }
        }
      });
    }
  });
};



function accountRegistration(result, obj, access_token, callback) {
  var me = this;
  var wepay_settings2 = {
    'client_id': props.client_id,
    'client_secret': props.client_secret,
    "access_token": access_token
  }

  wp2 = new wepay(wepay_settings2);
  if (process.env.NODE_ENV == 'production') {
    wp2.use_production();
  } else {
    wp2.use_staging();
  }

  // If we did not get the country then the defaulr country is "US"
  if (!result.currency_code) {
    result.currency_code = 'USD'
  }
  if (!result.country_code) {
    result.country_code = "US"
  }

  // Provide information to create a WePay Account
  // callback_uri will get wepay account IPNS, When user activate thieir account, delete an account and all
  var callback_uri;
  if (props.domain == 'http://localhost:3000') {
    callback_uri = 'http://local.wonderwe.can';
  } else {
    callback_uri = props.domain;
  }

  var accountObject = {
    "name": result.title,
    "reference_id": result.commonid + "#" + uuid.v4(),
    "callback_uri": callback_uri + "/wepay/account/ipns",
    "country": result.country_code,
    "currencies": [result.currency_code] // Here we need to get the currency based country
  };
  accountObject.description = result.description; // Get the description of charity/fundraiser.
  if (!accountObject.description) {
    accountObject.description = result.title;
  }

  //action_required, active, disabled or deleted  -- status
  // WePay Account Creation API

  wp2.call('/account/create', accountObject,
    function(accountResponse) {      
      var accountBuffer = new Buffer(accountResponse);
      var accountObj = JSON.parse(accountBuffer.toString('utf-8'));      
      if (accountObj.error) {
        callback(accountObj, null);
      } else {
        // We will get the Account_id with the status of action_required
        // account_id and status will save in db, We Need an account_id while donate
        async.parallel({
            user_confirmation: function(confirmationCallback) {

              if (!result.existingUser) {

                var user_settings = {
                  'client_id': props.client_id,
                  'client_secret': props.client_secret,
                  "access_token": access_token
                }

                wp3 = new wepay(user_settings);

                if (process.env.NODE_ENV == 'production') {
                  wp3.use_production();
                } else {
                  wp3.use_staging();
                }
                // It will send the WePay confirmation email
                var message = "Donations made to your WonderWe fundraiser are powered by WePay. Press the confirm button so you can keep receiving donations to your awesome campaign.";
                wp3.call('/user/send_confirmation/', {
                    "email_message": message
                  },
                  function(userResponse) {

                    var userBuffer = new Buffer(userResponse);
                    console.log(userBuffer.toString('utf-8'));
                    var userBufferObj = JSON.parse(userBuffer.toString('utf-8'));
                    console.log('User Email confirmation Response');
                    console.log(userBufferObj);
                    if (userBufferObj.error) {
                      console.log(userBufferObj.error);
                      confirmationCallback(null, userBufferObj);
                      //confirmationCallback(userBufferObj.error, null);
                    } else {
                      confirmationCallback(null, userBufferObj);
                    }
                  });

              } else {
                confirmationCallback(null, {
                  msg: 'Connected well.'
                });
              }
            },
            createPaymentGateway: function(cahrityCallback) {
              // Insert the WePay account details and update in code_tbl
              // charity_id, user_id, access_toke, account_id, status, payment_gateway
              var gateWayObj = {};
              gateWayObj.account_id = accountObj.account_id;
              gateWayObj.access_token = access_token;
              gateWayObj.account_status = accountObj.state;
              gateWayObj.payment_gateway = 'wepay';
              gateWayObj.user_id = obj.user_id;
              if (obj.charity_id) {
                gateWayObj.charity_id = obj.charity_id;
              } else {
                gateWayObj.charity_id = null;
              }
              console.log(gateWayObj);
              excuteQuery.insertAndReturnKey(sqlQueryMap['addPaymentGateWay'], gateWayObj, function(err, rows) {
                if (err) {
                  cahrityCallback(err, null);
                } else {
                  gateWayObj.payment_gateway_id = rows;
                  gateWayObj.code_id = obj.code_id;
                  //Update the payment_gateway_id in the code_tbl
                  if (gateWayObj.code_id && gateWayObj.payment_gateway_id) {
                    updateCampaignPaymentGateway(gateWayObj, function(err, updatePaymentResult) {
                      console.log('Campaign Update done..');
                      console.log(err);
                    });
                  }
                  cahrityCallback(null, gateWayObj);
                }
              });
            }
          },
          function(err, asyncResult) {
            console.log('Payment gateway and confirmation email response');
            console.log(err);
            if (err) {
              callback(err, null);
            } else {
              callback(null, asyncResult.user_confirmation);
            }
          });
      }
    });
};

function updateCampaignPaymentGateway(obj, callback) {
  console.log('Update done..');
  excuteQuery.update(sqlQueryMap['updatePaymentGateway'], [obj.payment_gateway_id, 'published', obj.code_id], callback);

  // To updat the Payment Gateway for all the campaigns which is releated to this charity
  /*  pool.query('update code_tbl set payment_gateway_id=? where charity_id=?', [obj.payment_gateway_id, obj.charity_id], function(err, gatewayUpdatedResult) {
      console.log('Payment Gateway Update Response');
      console.log(err);
      console.log(gatewayUpdatedResult);

    });*/
};


createPaymentGateWays();