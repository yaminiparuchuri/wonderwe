var mysql = require('mysql');
var async = require('async');
props = require('config').props;
db_template = require('db-template');

mandrill = require('mandrill-api/mandrill');
mail = require('../mail');

utility = require('../utils/util');
var moment = require('moment');

var parser = require('xml2json')
var fs = require('fs');

var db = require("mongoskin").db("mongodb://vmarkapp:vmarkapp1$@iad-c11-0.objectrocket.com:48172/vmarkprod?auto_reconnect=true&poolSize=10", {
  w: 1
});

var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: 'venkat',
  password: 'venkat1$',
  database: props.database
});

excuteQuery = db_template(pool);
var content = fs.readFileSync(__dirname + '/../sql-queries.xml');

var json = parser.toJson(content, {
  sanitize: false
});
// returns a string containing the JSON structure by default
var sqlQueries = JSON.parse(json)['sql-queries']['sql-query']
sqlQueryMap = {}
for (var i = 0; i < sqlQueries.length; i++) {
  sqlQueryMap[sqlQueries[i]['id']] = sqlQueries[i]['$t']
}



var donationObj =  {
            "name": "Roberto Couto",
            "email": "adoptedrdnfarmer@gmail.com",
            "cc-month": "5",
            "cc-year": "2018",
            "country": "US",
            "zip": "95381",
            "donor_comment": "Good luck with the fundraiser and God Bless! :sunglasses:",
            "hide_amount": "no",
            "anonymous": "no",
            "user_id": 3021,
            "typeof_payment": "one time",
            "amount": 50,
            "app_fee": 0,
            "charity_id": 3020,
            "fundraiser": "fundraiser",
            "fundraiser_userid": 3020,
            "code_id": 1179835,
            "currency_code": "USD",
            "currency_symbol": "$",
            "payment_gateway": "wepay",
            "credit_card_id": 2667487545,
            "ip": "172.15.81.88",
            "date_followed": "2016-12-09T07:52:51.179Z",
            "created_date": "2016-12-09 07:52:51",
            "account_type": "claimed",
            "verified": null
        };



var sendEmailToDonater = function(donationObj, callback) {

  console.log("DAYLILLY");
  console.log(donationObj);

  var logsObj = donationObj;

  if (donationObj && donationObj.fundraiser && donationObj.fundraiser === 'fundraiser') {
    var queryName1 = "getUserFund";
    var commonId1 = donationObj.fundraiser_userid;
  } else {
    var queryName1 = "getCharity";
    var commonId1 = donationObj.charity_id;
  }

  excuteQuery.queryForAll(sqlQueryMap[queryName1], [commonId1], function(err, charityResult) {
    if (err) {
      callback(err);

      logsObj.error = err;
      logsObj.action = "Failed to send donation receipt email to donor -- donations Service : 1097";
      utility.nodeLogs('ERROR', logsObj);

    } else {

      donationObj.donationAmount = donationObj.amount;
      if (charityResult && charityResult.length > 0) {

        donationObj.total_amount = charityResult[0].currency_symbol + new Number(donationObj.amount + (donationObj.app_fee * donationObj.amount)).toFixed(2) + ' ' + charityResult[0].currency_code;

        if (donationObj.app_fee) {
          donationObj.app_fee = charityResult[0].currency_symbol + new Number(donationObj.donationAmount * donationObj.app_fee).toFixed(2) + ' ' + charityResult[0].currency_code;
        }
        donationObj.amount = charityResult[0].currency_symbol + new Number(donationObj.amount).toFixed(2) + ' ' + charityResult[0].currency_code;


      }
      if (donationObj.email) {
        // New Card
        sendEmailToDonors(donationObj, charityResult, callback);

      } else {
        // Existing card
        excuteQuery.queryForAll(sqlQueryMap['getCardDetails'], [donationObj.credit_card_id], function(err, cardUserResult) {
          if (err) {
            callback(err);

            logsObj.error = err;
            logsObj.action = "Failed to send donation receipt email to donor -- donations Service : 1125";
            utility.nodeLogs('ERROR', logsObj);

          } else {
            if (cardUserResult && cardUserResult.length > 0) {
              donationObj.zip = cardUserResult[0].postal_code;
              if (cardUserResult[0].email) {
                donationObj.email = cardUserResult[0].email;
              }
              donationObj.name = cardUserResult[0].name;
            }
            sendEmailToDonors(donationObj, charityResult, callback);

          }
        });
      }
    }

  });
};


function sendEmailToDonors(donationObj, charityResult, callback) {
  var logsObj = donationObj;

  excuteQuery.queryForAll(sqlQueryMap['getUser'], [donationObj.user_id], function(err, userResult) {
    if (err) {
      callback(err);

      logsObj.error = err;
      logsObj.action = "Failed to get the user details while send donation receipt email to donor -- donations Service : 1152";
      utility.nodeLogs('ERROR', logsObj);

    } else {
      excuteQuery.queryForAll(sqlQueryMap['getCodeThankYouMsg'], [donationObj.code_id], function(err, thankResult) {
        if (err) {
          callback(err);
        } else {
          var userDetailsObj = {};
          var peer2peer_url = '';

          if (thankResult[0] && thankResult[0].thank_message) {
            userDetailsObj.thank_message = thankResult[0].thank_message;
          }
          if (thankResult[0] && thankResult[0].beneficiary) {
            userDetailsObj.beneficiary = thankResult[0].beneficiary;
          }
          if (thankResult[0] && thankResult[0].campaign_name) {
            userDetailsObj.campaign_name = thankResult[0].campaign_name;
          }

          if (userResult[0] && userResult[0].address_1) {
            userDetailsObj.address_1 = userResult[0].address_1;
          } else {
            userDetailsObj.address_1 = '';
          }
          if (userResult[0] && userResult[0].address_2) {
            userDetailsObj.address_2 = userResult[0].address_2;
          } else {
            userDetailsObj.address_2 = '';
          }
          if (userResult[0] && userResult[0].city) {
            userDetailsObj.city = userResult[0].city;
          } else {
            userDetailsObj.city = '';
          }
          if (userResult[0] && userResult[0].state) {
            userDetailsObj.state = userResult[0].state;
          } else {
            userDetailsObj.state = '';
          }

          if (thankResult[0] && thankResult[0].slug) {
            userDetailsObj.slug = thankResult[0].slug;
          } else {
            userDetailsObj.slug = '';
          }
          if (thankResult[0] && thankResult[0].team_campaign === 'no' && !donationObj.teamid && donationObj.user_id != thankResult[0].user_id) {
            peer2peer_url = props.domain + '/' + userDetailsObj.slug + '?p2p=true';
          }

          var userObject = {};

          if (donationObj.email) {
            userObject.email = donationObj.email;
          } else {
            userObject.email = userResult[0].email;
          }
          if (donationObj.name) {
            userObject.name = donationObj.name;
          } else {
            userObject.name = userResult[0].name;
          }
          if (donationObj.zip) {
            userObject.zip = donationObj.zip;
          } else {
            if (userResult[0] && userResult[0].postal_code) {
              userObject.zip = userResult[0].postal_code;
            } else {
              userObject.zip = "";
            }
          }
          var finalobjectmandril = {};
          finalobjectmandril.email = donationObj.email;
          finalobjectmandril.from = props.fromemail;
          finalobjectmandril.text = "Hai/Hello";
          if (charityResult && charityResult.length > 0 && charityResult[0].name_tmp) {
            var name_tmp = charityResult[0].name_tmp;
          } else {
            var name_tmp = "";
          }
          finalobjectmandril.subject = 'Receipt for your donation to ' + name_tmp;

          if (donationObj.account_type == 'claimed') {
            utility.nodeLogs('info', "claimed charity");
            var charityData = {};
            if (charityResult && charityResult.length > 0 && charityResult[0].address_1 && charityResult[0].address_1 != null) {
              charityData.address_1 = charityResult[0].address_1;
            } else {
              charityData.address_1 = '';
            }
            if (charityResult && charityResult.length > 0 && charityResult[0].address_2 && charityResult[0].address_2 != null) {
              charityData.address_2 = charityResult[0].address_2;
            } else {
              charityData.address_2 = '';
            }
            if (charityResult && charityResult.length > 0 && charityResult[0].city && charityResult[0].city != null) {
              charityData.city = charityResult[0].city;
            } else {
              charityData.city = '';
            }
            if (charityResult && charityResult.length > 0 && charityResult[0].state && charityResult[0].state != null) {
              charityData.state = charityResult[0].charityState;
            } else {
              charityData.state = '';
            }
            if (charityResult && charityResult.length > 0 && charityResult[0].postal_code && charityResult[0].postal_code != null) {
              charityData.postal_code = charityResult[0].postal_code;
            } else {
              charityData.postal_code = '';
            }
            if (charityResult && charityResult.length > 0 && charityResult && charityResult.length > 0 && charityResult[0].ein) {
              charityData.ein = charityResult[0].ein;
            } else {
              charityData.ein = '';
            }
            if (donationObj && donationObj.fundraiser && donationObj.fundraiser === 'fundraiser') {
              finalobjectmandril.template_name = "Donation success to personal fundraiser";
            } else {
              finalobjectmandril.template_name = "Donation Success to Claimed Charity";
            }
            finalobjectmandril.template_content = [{
              "name": "name",
              "content": "*|NAME|*"
            }, {
              "name": "amount",
              "content": "*|AMOUNT|*"
            }, {
              "name": "organization_ein",
              "content": "*|ORGANIZATION_EIN|*"
            }, {
              "name": "organization-title",
              "content": "*|ORGANIZATION|*"
            }, {
              "name": "currentDate",
              "content": "*|CURRENT_DATE|*"
            }, {
              "name": "name",
              "content": "*|DONOR_NAME|*"
            }, {
              "name": "address_1",
              "content": "*|DONOR_ADDRESS1|*"
            }, {
              "name": "address_2",
              "content": "*|DONOR_ADDRESS2|*"
            }, {
              "name": "city",
              "content": "*|DONOR_CITY|*"
            }, {
              "name": "state",
              "content": "*|DONOR_STATE|*"
            }, {
              "name": "zipcode",
              "content": "*|DONOR_ZIP|*"
            }, {
              "name": "address_1",
              "content": "*|ORGANIZATION_ADDRESS1|*"
            }, {
              "name": "address_2",
              "content": "*|ORGANIZATION_ADDRESS2|*"
            }, {
              "name": "city",
              "content": "*|ORGANIZATION_CITY|*"
            }, {
              "name": "state",
              "content": "*|ORGANIZATION_STATE|*"
            }, {
              "name": "postal_code",
              "content": "*|ORGANIZATION_ZIP|*"
            }, {
              "name": "typeof_payment",
              "content": "*|DONATION_TYPE|*"
            }, {
              "name": "thank_message",
              "content": "*|THANK_MESSAGE|*"
            }, {
              "name": "beneficiary",
              "content": "*|BENEFICIARY|*"
            }, {
              "name": "campaign_name",
              "content": "*|CAMPAIGN_NAME|*"
            }, {
              "name": "verified",
              "content": "*|VERIFIED|*"
            }, {
              "name": "app_fee",
              "content": "*|APP_FEE|*"
            }, {
              "name": "total_amount",
              "content": "*|TOTAL_AMOUNT|*"
            }, {
              "name": "campaign_url",
              "content": "*|CAMPAIGN_URL|*"
            }, {
              "name": "peer2peer_url",
              "content": "*|PEER2PEER_URL|*"
            }, {
              "name": "email",
              "content": "*|EMAIL|*"
            }];
            finalobjectmandril.merge_vars = [{
              "name": "NAME",
              "content": userObject.name
            }, {
              "name": "AMOUNT",
              "content": donationObj.amount
            }, {
              "name": "ORGANIZATION_EIN",
              "content": charityData.ein
            }, {
              "name": "ORGANIZATION",
              "content": name_tmp
            }, {
              "name": "CURRENT_DATE",
              "content": moment().format("MMM Do YYYY")
            }, {
              "name": "DONOR_NAME",
              "content": userObject.name
            }, {
              "name": "DONOR_ADDRESS1",
              "content": userDetailsObj.address_1
            }, {
              "name": "DONOR_ADDRESS2",
              "content": userDetailsObj.address_2
            }, {
              "name": "DONOR_CITY",
              "content": userDetailsObj.city
            }, {
              "name": "DONOR_STATE",
              "content": userDetailsObj.state
            }, {
              "name": "DONOR_ZIP",
              "content": userObject.zip
            }, {
              "name": "ORGANIZATION_ADDRESS1",
              "content": charityData.address_1
            }, {
              "name": "ORGANIZATION_ADDRESS2",
              "content": charityData.address_2
            }, {
              "name": "ORGANIZATION_CITY",
              "content": charityData.city
            }, {
              "name": "ORGANIZATION_STATE",
              "content": charityData.state
            }, {
              "name": "ORGANIZATION_ZIP",
              "content": charityData.postal_code
            }, {
              "name": "DONATION_TYPE",
              "content": donationObj.typeof_payment
            }, {
              "name": "THANK_MESSAGE",
              "content": userDetailsObj.thank_message
            }, {
              "name": "BENEFICIARY",
              "content": userDetailsObj.beneficiary
            }, {
              "name": "CAMPAIGN_NAME",
              "content": userDetailsObj.campaign_name
            }, {
              "name": "VERIFIED",
              "content": donationObj.verified
            }, {
              "name": "APP_FEE",
              "content": donationObj.app_fee
            }, {
              "name": "TOTAL_AMOUNT",
              "content": donationObj.total_amount
            }, {
              "name": "CAMPAIGN_URL",
              "content": props.domain + '/' + userDetailsObj.slug
            }, {
              "name": "PEER2PEER_URL",
              "content": peer2peer_url
            }, {
              "name": "EMAIL",
              "content": props.supportemail
            }];

            utility.mandrillTemplate(finalobjectmandril, function(err, data) {
              if (err) {
                callback(err);

                logsObj.error = err;
                logsObj.action = "Failed to send Claimed account donation receipt email to donor -- donations Service : 1417";
                utility.nodeLogs('ERROR', logsObj);

              } else {

                utility.nodeLogs('info', "mail send successfully");
                callback(null, data);
              }
            });
          } else {
            if (charityResult && charityResult.length > 0 && charityResult[0].ein) {
              var ein = charityResult[0].ein;
            } else {
              var ein = '';
            }
            utility.nodeLogs('info', "unclaimed charity");

            //finalobjectmandril.template_name = "Donation Success to unclaimed Charity";
            if (donationObj && donationObj.fundraiser && donationObj.fundraiser === 'fundraiser') {
              finalobjectmandril.template_name = "Donation success to personal fundraiser";
            } else {
              finalobjectmandril.template_name = "Donation Success to unclaimed Charity";
            }
            finalobjectmandril.template_content = [{
              "name": "name",
              "content": "*|NAME|*"
            }, {
              "name": "amount",
              "content": "*|AMOUNT|*"
            }, {
              "name": "organization_ein",
              "content": "*|ORGANIZATION_EIN|*"
            }, {
              "name": "organization-title",
              "content": "*|organization|*"
            }, {
              "name": "organization-title",
              "content": "*|ORGANIZATION|*"
            }, {
              "name": "currentDate",
              "content": "*|CURRENT_DATE|*"
            }, {
              "name": "name",
              "content": "*|DONOR_NAME|*"
            }, {
              "name": "address_1",
              "content": "*|DONOR_ADDRESS1|*"
            }, {
              "name": "address_2",
              "content": "*|DONOR_ADDRESS2|*"
            }, {
              "name": "city",
              "content": "*|DONOR_CITY|*"
            }, {
              "name": "state",
              "content": "*|DONOR_STATE|*"
            }, {
              "name": "zipcode",
              "content": "*|DONOR_ZIP|*"
            }, {
              "name": "typeof_payment",
              "content": "*|DONATION_TYPE|*"
            }, {
              "name": "thank_message",
              "content": "*|THANK_MESSAGE|*"
            }, {
              "name": "beneficiary",
              "content": "*|BENEFICIARY|*"
            }, {
              "name": "campaign_name",
              "content": "*|CAMPAIGN_NAME|*"
            }, {
              "name": "app_fee",
              "content": "*|APP_FEE|*"
            }, {
              "name": "total_amount",
              "content": "*|TOTAL_AMOUNT|*"
            }, {
              "name": "campaign_url",
              "content": "*|CAMPAIGN_URL|*"
            }, {
              "name": "peer2peer_url",
              "content": "*|PEER2PEER_URL|*"
            }, {
              "name": "email",
              "content": "*|EMAIL|*"
            }];
            finalobjectmandril.merge_vars = [{
              "name": "NAME",
              "content": userObject.name
            }, {
              "name": "AMOUNT",
              "content": donationObj.amount
            }, {
              "name": "ORGANIZATION_EIN",
              "content": ein
            }, {
              "name": "organization",
              "content": name_tmp
            }, {
              "name": "ORGANIZATION",
              "content": name_tmp
            }, {
              "name": "CURRENT_DATE",
              "content": moment().format("MMM Do YYYY")
            }, {
              "name": "DONOR_NAME",
              "content": userObject.name
            }, {
              "name": "DONOR_ADDRESS1",
              "content": userDetailsObj.address_1
            }, {
              "name": "DONOR_ADDRESS2",
              "content": userDetailsObj.address_2
            }, {
              "name": "DONOR_CITY",
              "content": userDetailsObj.city
            }, {
              "name": "DONOR_STATE",
              "content": userDetailsObj.state
            }, {
              "name": "DONOR_ZIP",
              "content": userObject.zip
            }, {
              "name": "DONATION_TYPE",
              "content": donationObj.typeof_payment
            }, {
              "name": "THANK_MESSAGE",
              "content": userDetailsObj.thank_message
            }, {
              "name": "BENEFICIARY",
              "content": userDetailsObj.beneficiary
            }, {
              "name": "CAMPAIGN_NAME",
              "content": userDetailsObj.campaign_name
            }, {
              "name": "APP_FEE",
              "content": donationObj.app_fee
            }, {
              "name": "TOTAL_AMOUNT",
              "content": donationObj.total_amount
            }, {
              "name": "CAMPAIGN_URL",
              "content": props.domain + '/' + userDetailsObj.slug
            }, {
              "name": "PEER2PEER_URL",
              "content": peer2peer_url
            }, {
              "name": "EMAIL",
              "content": props.supportemail
            }];


            console.log(finalobjectmandril);
            utility.mandrillTemplate(finalobjectmandril, function(err, data) {
              if (err) {
                callback(err);

                logsObj.error = err;
                logsObj.action = "Failed to send unclaimed account donation receipt email to donor -- donations Service : 1556";
                utility.nodeLogs('ERROR', logsObj);

              } else {
                utility.nodeLogs('info', 'mail send successfully');
                callback(null, data);
              }
            });
          }
        }
      });
    }
  });

}


sendEmailToDonater(donationObj,function(err,result){
  if(err){
    console.log('Script completed with error:');
    console.log(err);
  }else{
    console.log('Script completed successfully:');
    console.log(result);
  }
});