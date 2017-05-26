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
numeral = require('numeral')

var pool = mysql.createPool({
  host: props.host,
  port: props.port,
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


function sendNewsLetterToGuestDonators(callback) {
  excuteQuery.queryForAll(sqlQueryMap['getGuestDonorsDetails'], function(err, usersResult) {
    if (err) {
      callback(err, null);
    } else {
      if (usersResult.length) {

        async.each(usersResult, function(singleObj, eachCallback) {
          excuteQuery.queryForAll(sqlQueryMap['getTrendingCampaigns'], [singleObj.id], function(err, trendingData) {
            if (err) {
              utility.nodeLogs('ERROR', {
                message: 'Error in getting result of trending data'
              });
              callback(err, null);
            } else {
              if (trendingData && trendingData[0]) {

                var finalObjectMandril = {};
                finalObjectMandril.from = props.fromsupport;
                finalObjectMandril.email = singleObj.email;
                finalObjectMandril.text = "";
                finalObjectMandril.subject = "Mail from WonderWe";
                finalObjectMandril.template_name = "Send Mail to Guest Donater";
                finalObjectMandril.template_content = [{
                  "name": "username",
                  "content": "*|NAME|*"
                }, {
                  "name": "campaignurl",
                  "content": "*|CAMPAIGN_URL|*"
                }, {
                  "name": "campaigntitle",
                  "content": "*|CAMPAIGN_TITLE|*"
                }, {
                  "name": "facebookclientid",
                  "content": "*|FACEBOOK_CLIENT_ID|*"
                }, {
                  "name": "signupurl",
                  "content": "*|SIGN_UP_URL|*"
                }, {
                  "name": "campaignimage",
                  "content": "*|CAMPAIGN_IMG|*"
                },{
                "name": "trendingcampaigntitle1",
                "content": "*|TREND_CAMP_TITLE1|*"
              }, {
                "name": "trendingcampaigndescription1",
                "content": "*|TREND_CAMP_DESCRIPTION1|*"
              }, {
                "name": "trendingcampaigngoal1",
                "content": "*|TREND_CAMP_GOAL1|*"
              }, {
                "name": "trendingcampaigncurrency1",
                "content": "*|TREND_CAMP_CURRENCY_SYMBOL1|*"
              }, {
                "name": "trendingcampaigncurrencycode1",
                "content": "*|TREND_CAMP_CURRENCY_CODE1|*"
              }, {
                "name": "trendingcampaignamontraised1",
                "content": "*|TREND_CAMP_AMOUNT_RAISED1|*"
              }, {
                "name": "trendingcampaignslug1",
                "content": "*|TREND_CAMP_CODE_SLUG1|*"
              }, {
                "name": "trendingcampaignpicture1",
                "content": "*|TREND_CAMP_PICTURE_URL1|*"
              }, {
                "name": "trendingcampaigndonation1",
                "content": "*|TREND_CAMP_DONATION_PROGRESS1|*"
              }, {
                "name": "trendingcampaignurl1",
                "content": "*|TREND_CAMP_URL1|*"
              }, {
                "name": "trendingcampaign1",
                "content": "*|TREND_CAMP1|*"
              }, {
                "name": "trendingcampaigntitle2",
                "content": "*|TREND_CAMP_TITLE2|*"
              }, {
                "name": "trendingcampaigndescription2",
                "content": "*|TREND_CAMP_DESCRIPTION2|*"
              }, {
                "name": "trendingcampaigngoal2",
                "content": "*|TREND_CAMP_GOAL2|*"
              }, {
                "name": "trendingcampaigncurrencycode2",
                "content": "*|TREND_CAMP_CURRENCY_CODE2|*"
              }, {
                "name": "trendingcampaigncurrency2",
                "content": "*|TREND_CAMP_CURRENCY_SYMBOL2|*"
              }, {
                "name": "trendingcampaignampountraised2",
                "content": "*|TREND_CAMP_AMOUNT_RAISED2|*"
              }, {
                "name": "trendingcampaignslug2",
                "content": "*|TREND_CAMP_CODE_SLUG2|*"
              }, {
                "name": "trendingcampaignpicture2",
                "content": "*|TREND_CAMP_PICTURE_URL2|*"
              }, {
                "name": "trendingcampaigndonation1",
                "content": "*|TREND_CAMP_DONATION_PROGRESS2|*"
              }, {
                "name": "trendingcampaignurl2",
                "content": "*|TREND_CAMP_URL2|*"
              }, {
                "name": "trendingcampaign2",
                "content": "*|TREND_CAMP2|*"
              }];
                finalObjectMandril.merge_vars = [{
                  "name": "NAME",
                  "content": singleObj.name
                }, {
                  "name": "CAMPAIGN_URL",
                  "content": props.domain + '/' + singleObj.code_slug
                }, {
                  "name": "FACEBOOK_CLIENT_ID",
                  "content": props.facebook_client_id
                }, {
                  "name": "CAMPAIGN_TITLE",
                  "content": singleObj.title
                }, {
                  "name": "SIGN_UP_URL",
                  "content": props.domain + "/pages/resetpassword/" + singleObj.id + '?guest=guest'
                }, {
                  "name": "CAMPAIGN_IMG",
                  "content": singleObj.code_picture_url
                },{
                "name": "TREND_CAMP_TITLE1",
                "content": trendingData[0].title
              }, {
                "name": "TREND_CAMP_DESCRIPTION1",
                "content": trendingData[0].description.escapeTags().substr(0,200)
              }, {
                "name": "TREND_CAMP_GOAL1",
                "content": numeral(trendingData[0].goal).format('0,0')
              }, {
                "name": "TREND_CAMP_CURRENCY_SYMBOL1",
                "content": trendingData[0].currency_symbol
              }, {
                "name": "TREND_CAMP_CURRENCY_CODE1",
                "content": trendingData[0].currency_code
              }, {
                "name": "TREND_CAMP_AMOUNT_RAISED1",
                "content": numeral(trendingData[0].donation).format('0,0')
              }, {
                "name": "TREND_CAMP_CODE_SLUG1",
                "content": trendingData[0].code_slug
              }, {
                "name": "TREND_CAMP_PICTURE_URL1",
                "content": trendingData[0].code_picture_url
              }, {
                "name": "TREND_CAMP_DONATION_PROGRESS1",
                "content": trendingData[0].donation_progress
              }, {
                "name": "TREND_CAMP_URL1",
                "content": props.domain + '/'+ trendingData[0].code_slug
              }, {
                "name": "TREND_CAMP1",
                "content": props.domain + '/'+ trendingData[0].code_slug + '?donate=true'
              }, {
                "name": "TREND_CAMP_TITLE2",
                "content": trendingData[1].title
              }, {
                "name": "TREND_CAMP_DESCRIPTION2",
                "content": trendingData[1].description.escapeTags().substr(0,200)
              }, {
                "name": "TREND_CAMP_GOAL2",
                "content": numeral(trendingData[1].goal).format('0,0')
              }, {
                "name": "TREND_CAMP_CURRENCY_CODE2",
                "content": trendingData[1].currency_code
              }, {
                "name": "TREND_CAMP_CURRENCY_SYMBOL2",
                "content": trendingData[1].currency_symbol
              }, {
                "name": "TREND_CAMP_AMOUNT_RAISED2",
                "content": numeral(trendingData[1].donation).format('0,0')
              }, {
                "name": "TREND_CAMP_CODE_SLUG2",
                "content": trendingData[1].code_slug
              }, {
                "name": "TREND_CAMP_PICTURE_URL2",
                "content": trendingData[1].code_picture_url
              }, {
                "name": "TREND_CAMP_DONATION_PROGRESS2",
                "content": trendingData[1].donation_progress
              }, {
                "name": "TREND_CAMP_URL2",
                "content": props.domain + '/'+ trendingData[1].code_slug
              }, {
                "name": "TREND_CAMP2",
                "content": props.domain + '/'+ trendingData[1].code_slug + '?donate=true'
              }];
                utility.mandrillTemplate(finalObjectMandril, function(err, reuslt) {
                  if (err) {
                    eachCallback(err, null);
                  } else {
                    eachCallback(null, reuslt);
                  }
                });
              } else {
                eachCallback(null, null);
              }
            }
          });
        }, function(err) {
          if (err) {
            utility.nodeLogs('ERROR', "error occred while sending mail")
            callback(err)
          } else {
            utility.nodeLogs('INFO', "mail sent successflly")
            callback()
          }
        });
      } else {
        utility.nodeLogs('INFO', "No details found")
        callback(null, null);
      }
    }
  });
}

sendNewsLetterToGuestDonators(function(err, result) {
  if (err) {
    utility.nodeLogs('ERROR', 'Error occured while sending the mail');
  } else {
    utility.nodeLogs('INFO', 'Mails sent successflly');
  }
});
