var mysql = require('mysql');
var async = require('async');
 props = require('config').props;
var moment = require('moment');
var uuid = require('node-uuid');
db_template = require('db-template');
var utility = require('../utils/util');
var fs = require('fs');
var parser = require('xml2json');
 mandrill = require('mandrill-api/mandrill');
 mail = require('../mail');


var pool = mysql.createPool({
  host: props.host,
  port:props.port,
  user: props.username,
  password: props.password,
  database: props.database
});


excuteQuery = db_template(pool);

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







function sendMailsToCampaignOwner(donationObj, callback) {
  var codeId = donationObj.code_id;
  var userDetailsObj;
  var logsObj = {};
  excuteQuery.queryForAll(sqlQueryMap['getUser'], [donationObj.user_id], function(err, userResult) {
    if (err) {
      callback(err, null);
      logsObj.error = err;
      logsObj.action = "Failed to get the user details while send donation email to campaign owner -- donations Service : 1132";
      utility.nodeLogs('ERROR', logsObj);
    } else {
      var userDetailsObj = {};
      if (userResult && userResult[0]) {
        if (userResult[0] && userResult[0].address_1) {
          userDetailsObj.address_1 = userResult[0].address_1;
        } else {
          userDetailsObj.address_1 = '';
        }
        if (userResult[0] && userResult[0].state) {
          userDetailsObj.state = userResult[0].state;
        } else {
          userDetailsObj.state = '';
        }
        if (userResult[0] && userResult[0].country) {
          userDetailsObj.country = userResult[0].country;
        } else {
          userDetailsObj.country = '';
        }
        if (userResult[0] && userResult[0].city) {
          userDetailsObj.city = userResult[0].city;
        } else {
          userDetailsObj.city = '';
        }
        if (userResult[0] && userResult[0].postal_code) {
          userDetailsObj.postal_code = userResult[0].postal_code;
        } else {
          userDetailsObj.postal_code = '';
        }
        if (userResult[0] && userResult[0].name) {
          userDetailsObj.name = userResult[0].name;
        } else {
          userDetailsObj.name = '';
        }
        if (userResult[0] && userResult[0].email) {
          userDetailsObj.email = userResult[0].email;
        } else {
          userDetailsObj.email = '';
        }

        excuteQuery.queryForAll(sqlQueryMap['getCodeById'], [codeId], function(err, result) {
          if (err) {
            callback(err, null);
            utility.nodeLogs('ERROR', {
              message: 'Error occured in while getting the campaign details'
            });
          } else {
            if (result && result[0]) {
              var codeObject = result[0];
              var donation_alert_required = result[0].donation_alert_required;
              if (donation_alert_required == "yes") {
                var codeId = donationObj.code_id;
                var donorId = donationObj.user_id;
                var fundraiserId = donationObj.fundraiser_userid;
                // var campaign_creator;
                excuteQuery.queryForAll(sqlQueryMap['gettingCampaingOwnerAndAdminDetails'], [codeId, codeId], function(err, AdminDetails) {
                  if (err) {
                  	console.log(err);
                    callback(err, null);
                    utility.nodeLogs('ERROR', {
                      message: 'Error occured in while getting the campaign Owner details'
                    });
                  } else {
                    if (AdminDetails.length > 0) {
                      var adminDetails = AdminDetails;
                      var campaign_creator = adminDetails[0].name;
                      async.each(adminDetails, function(eachObject, eachCallback) {
                        var mandrilObject = {};
                        var mandrilObject = {};
                        mandrilObject.from = props.fromemail;
                        mandrilObject.text = "";
                        mandrilObject.subject = "New donation for " + codeObject.title;
                        mandrilObject.template_name = "Donation alert to campaign owner";
                        mandrilObject.email =  eachObject.email;
                        var current_year = moment.utc().format('YYYY');
                        mandrilObject.template_content = [{
                          "name": "campaignOwnerName",
                          "content": "*|NAME|*"
                        }, {
                          "name": "campaign_creator",
                          "content": "*|CAMPAIGN_CREATOR|*"
                        }, {
                          "name": "campaingname",
                          "content": "*|CAMPAIGN_NAME|*"
                        }, {
                          "name": "donatorname",
                          "content": "*|DONATOR_NAME|*"
                        }, {
                          "name": "amount",
                          "content": "*|AMOUNT|*"
                        }, {
                          "name": "currentdate",
                          "content": "*|CURRENT_DATE|*"
                        }, {
                          "name": "donatoremail",
                          "content": "*|DONATOR_EMAIL|*"
                        }, {
                          "name": "donoraddress1",
                          "content": "*|DONOR_ADDRESS1|*"
                        }, {
                          "name": "donorcity",
                          "content": "*|DONOR_CITY|*"
                        }, {
                          "name": "donorstate",
                          "content": "*|DONOR_STATE|*"
                        }, {
                          "name": "donorzip",
                          "content": "*|DONOR_ZIP|*"
                        }, {
                          "name": "currency_symbol",
                          "content": "*|CURRENCY_SYMBOL|*"
                        }, {
                          "name": "current_year",
                          "content": "*|CURRENT_YEAR|*"
                        }];
                        mandrilObject.merge_vars = [{
                          "name": "NAME",
                          "content": eachObject.name
                        }, {
                          "name": "CAMPAIGN_CREATOR",
                          "content": campaign_creator
                        }, {
                          "name": "CAMPAIGN_NAME",
                          "content": codeObject.title
                        }, {
                          "name": "CURRENCY_SYMBOL",
                          "content": donationObj.currency_symbol

                        }, {
                          "name": "DONATOR_NAME",
                          "content": userDetailsObj.name
                        }, {
                          "name": "DONATOR_EMAIL",
                          "content": userDetailsObj.email
                        }, {
                          "name": "AMOUNT",
                          "content": donationObj.amount
                        }, {
                          "name": "CURRENT_DATE",
                          "content": moment('2017-01-05').format("MMM Do YYYY")
                        }, {
                          "name": "DONOR_ADDRESS1",
                          "content": userDetailsObj.address_1
                        }, {
                          "name": "DONOR_CITY",
                          "content": userDetailsObj.city
                        }, {
                          "name": "DONOR_STATE",
                          "content": userDetailsObj.state
                        }, {
                          "name": "DONOR_ZIP",
                          "content": userDetailsObj.postal_code
                        }, {
                          "name": "CURRENT_YEAR",
                          "content": current_year
                        }];

                        console.log(mandrilObject);
                     	utility.mandrillTemplate(mandrilObject, function(err, result) {
                          if (err) {
                            eachCallback(err, null);
                            utility.nodeLogs('ERROR', {
                              message: 'error occured in while send the mail to campaign owner after donation success'
                            });
                          } else {
                            eachCallback(null, result);
                            utility.nodeLogs('INFO', {
                              message: 'Mail sent successfully'
                            });
                          }
                        });  
                      }, function(err) {
                      	console.log('Error:',err);
                      	console.log('all emails completed');
                        //callback(err, null);
                      });
                    } else {
                      utility.nodeLogs('INFO', {
                        'message': 'no campaign owner details'
                      });
                   //   callback(null, null);
                    }
                  }
                });
              } else {
                utility.nodeLogs('INFO', {
                  message: 'This campaign is unchecked for email receiving to owner'
                });
              //  callback(null, null);
              }
            } else {
              utility.nodeLogs('INFO', {
                message: 'No campaign details found'
              });
             // callback(null, null);
            }
          }
        });
      } else {
        utility.nodeLogs('INFO', 'user details not found')

       // callback(null, null);
      }
    }

  });
}

/***
	
***/

var donationObj = {
	user_id: 3325,
	code_id:1179835,
	fundraiser_userid:3020,
	amount: 75.00,
	currency_symbol: '$'
};


console.log(donationObj);


sendMailsToCampaignOwner(donationObj);
