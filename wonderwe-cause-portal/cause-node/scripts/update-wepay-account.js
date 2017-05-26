/*
* This script will be used to attach the WePay account to User Campaigns Created for NonProfit.
* 
 */
var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var moment = require('moment');
var uuid = require('node-uuid');
db_template = require('db-template');
var utility = require('../utils/util');
var fs = require('fs');
var parser = require('xml2json')
var Agenda = require('agenda')
wepay = require('wepay').WEPAY

var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: props.username,
  port: props.port,
  password: props.password,
  database: props.database,
  acquireTimeout:30000
});

excuteQuery = db_template(pool);
agenda = new Agenda({
  db: {
    address: props.agendadb,
    collection: props.agendaJobCollection
  }
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

<<<<<<< HEAD
//Holy Croos School
var obj2 = {};

obj2.user_id = 2063;
obj2.code_id = 1179666;
obj2.charity_id = 2655869; 
obj2.original_ip = "49.207.171.153";
obj2.original_device = "153.171.207.49-ras.beamtele.net";


// 1501867, 2330, 83692  


// WePay Manual Account creation
// WePay Account Creation for charity/fundraiser while creation of campaign

// To add charity admin details

var claimObj = {
  charity_id: obj2.charity_id, //"1501272",
  first_name: "Debby",
  last_name: "Efurd",
  title: "Initiative 180.",
  email_address: "debby.efurd@gmail.com",
  phone_number: "9999999999",
  ein: "465281539", 
  date_created: moment.utc().toDate(), 
  approval_date: moment.utc().toDate(),
  approved_by: "705"
};


pool.query('insert into charity_claim_tbl SET ?', claimObj, function(err, claimResult) {
  console.log('Claim Insert response');
  console.log(err);
  console.log(claimResult);
=======
>>>>>>> 63055420d3fdffb2efb5472190571b6c4e704b46

/*excuteQuery.queryForAll('SELECT c.title,IFNULL(c.country,up.country) AS country,c.id AS code_id,c.user_id,u.name,u.email FROM user_tbl u INNER JOIN code_tbl c ON c.user_id=u.id  AND u.id IN  (SELECT user_id FROM code_tbl WHERE individual="yes" AND user_id NOT in (select user_id FROM payment_gateways_tbl)) LEFT OUTER JOIN user_profile_tbl up ON up.user_id = c.user_id',
//  SELECT c.title,IFNULL(c.country,up.country) AS country,c.id AS code_id,c.user_id,u.name,u.email FROM user_tbl u INNER JOIN code_tbl c ON c.user_id=u.id  AND u.id IN  (SELECT user_id FROM code_tbl WHERE individual="yes" AND user_id NOT in (select user_id FROM payment_gateways_tbl)) LEFT OUTER JOIN user_profile_tbl up ON up.user_id = c.user_id;
  [],function(err,result){
    if(err){
      console.log(err);
    }else{

  
    console.log(result[9]);
  if(result[9].country ===223 || result[9].country ===224){
    var obj2 = {};
    obj2.user_id = result[9].user_id;
    obj2.code_id = result[9].code_id;
    obj2.charity_id = null; 
    obj2.original_ip = "49.207.171.153";
    obj2.original_device = "153.171.207.49-ras.beamtele.net";
      wepayAccountRegistration(obj2, function(err, result44) {
        console.log('WePay Account Response...');
        console.log(err);
        console.log(result44);

      });
  }
  }
  });    */


function wepayAccountRegistration(obj, callback) {
  var me = this;
  // Get the details realated to the charity/fundraiser

  excuteQuery.queryForObject(sqlQueryMap['CharityDetails'], [obj.code_id], function(err, detailsObj) {
    if (err) {
      callback(err, null);
    } else {
      console.log(detailsObj);
      var result = detailsObj[0];

      //Set WePay settings properties from props

      excuteQuery.queryForAll(sqlQueryMap['checkUserAccessToken'], [obj.user_id, 'wepay'], function(err, accessTokenDetails) {
        if (err) {
          callback(err, null);
        } else {

          console.log(accessTokenDetails);
          if (accessTokenDetails && accessTokenDetails.length > 0) {
            console.log('User account already exists');
            result.existingUser = true;
            accountRegistration(result, obj, accessTokenDetails[0].access_token, callback);

          } else {

            var wepay_settings = {
              'client_id': props.client_id,
              'client_secret': props.client_secret
            };

            // Initialized the WePay constructor
            wp = new wepay(wepay_settings);

            if (props.environment_type == 'production') {
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
                var buffer = new Buffer(response);
                var responseObj = JSON.parse(buffer.toString('utf-8'));
                console.log(responseObj);
                if (responseObj.error) {
                  console.log('In the error');
                  //  utility.log('WARN', "We Pay User Register Got an Error");
                  callback(responseObj, null);
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
}


function accountRegistration(result, obj, access_token, callback) {
  var me = this;
  var wepay_settings2 = {
    'client_id': props.client_id,
    'client_secret': props.client_secret,
    "access_token": access_token
  }

  wp2 = new wepay(wepay_settings2);
  if (props.environment_type == 'production') {
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
  if(accountObject.country === 'CA'){
    accountObject.country_options = {
      "debit_opt_in": true
    };
  }

  //accountObject.description = accountObject.name;
  wp2.call('/account/create', accountObject,
    function(accountResponse) {

      var accountBuffer = new Buffer(accountResponse);
      var accountObj = JSON.parse(accountBuffer.toString('utf-8'));
      console.log('Account obj',accountObject);
      console.log('Error in account creation');
      console.log(accountObj);
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

                if (props.environment_type == 'production') {
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
                    var userBufferObj = JSON.parse(userBuffer.toString('utf-8'));
                    console.log('User Email confirmation Response');
                    console.log(userBufferObj);
                    if (userBufferObj.error) {
                      confirmationCallback(userBufferObj.error, null);
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
  // Here it is updating the campaign table - Just make it the default campaign and also individual to null.
  // If they have multiple campaigns we need to update.
  excuteQuery.update(sqlQueryMap['updatePaymentGateway'], [obj.payment_gateway_id, 'published', obj.code_id], callback);

};


function modifyAccount(obj,callback){
  var wepay_settings2 = {
    'client_id': props.client_id,
    'client_secret': props.client_secret,
    "access_token": 'PRODUCTION_31ba97797df91ec474d1d9059dfa76cc8737a151d378aa4be5a6edaf6b6f38b0'
  };

  wp2 = new wepay(wepay_settings2);
      wp2.use_production();

  var accountObject = {
    account_id:1299612443,
    reference_id:2517366+'#'+uuid.v4()
  }

  wp2.call('/account/modify', accountObject,
    function(accountResponse) {

      var accountBuffer = new Buffer(accountResponse);
      var accountObj = JSON.parse(accountBuffer.toString('utf-8'));
      console.log('Account obj',accountObject);
      console.log('Error in account creation');
      console.log(accountObj);
      if (accountObj.error) {
        console.log(error);
      }else{
        console.log('Success:');
        console.log(accountResponse);
      }
    });
}


modifyAccount({},function(err,result){

});

// accountRegistration({
//   first_name:'Meloniey',
//   last_name:'Koebley',
//   description:'The Warren County YMCA provides opportunities to all individuals, youth, adults, and families in the community by putting Christian values and principles into practice through facilities, programs, and activities that build healthy spirit, mind, and body. Programs are made available to all persons regardless of their ability to pay.',
//   title:'Young Mens Christian Association of Warren Pa',
//   name:'Meloniey Koebley',
//   currency_code:'USD',
//   country_code:'US'
// },{
//   wepayquery:'CharityDetails',
//   Id:'1179863',
//   code_id:1179863,
//   user_id:3322,
//   charity_id:2517366
// },'PRODUCTION_31ba97797df91ec474d1d9059dfa76cc8737a151d378aa4be5a6edaf6b6f38b0',
// function(err,result){
//   console.log(err);
//   console.log(result);
// })
