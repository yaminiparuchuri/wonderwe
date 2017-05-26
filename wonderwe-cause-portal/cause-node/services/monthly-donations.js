var donationService = require('./donations');
var feedBotSrevice = require('./feedBot');



exports.getMonthlyDonationsForThisDay = function(data, callback) {
  var me = this;
  var month = moment().month() + 1;
  excuteQuery.queryForAll('SELECT * FROM recurring_gift_tbl WHERE payment_gateway="wepay" AND date_deleted IS NULL AND (timestampdiff(day,date_created,now())>1) and (timestampdiff(day,date_created,now())%30)=0 ORDER BY id; ', [], function(err, result) {
    if (err) {
      console.log(err);
    } else {
      utility.nodeLogs('INFO', { message: 'Job started for monthly donatioins', count: result.length });
      async.eachSeries(result, function(ele, eachCallback) {
        /*if(!ele.noofoccurences){
          ele.noofoccurences=100;
        }*/
       // var futureDate = moment(ele.date_created).add(parseInt(ele.noofoccurences), 'M')
           // if (futureDate._d >= moment().toDate()){
          excuteQuery.queryForAll(sqlQueryMap['getMonthlyDonationStatus'], [ele.id, month, moment().year()], function(err, result) {
            if (err) {
              eachCallback(null);
            } else {
              if (!result || !result[0] || (result[0].status != 'payment_recorded' && result[0].status != "payment_success")) {
                if (result[0]) {
                  ele.status_id = result[0].id;
                }
                me.doMonthlyDonation(ele, function(err, result) {
                  if (err) {
                    callback(err, null);
                  } else {
                    eachCallback(null, result);
                  }
                });
              } else {
                utility.nodeLogs('ERROR', { message: 'Recurring method called for already done payments' });
              }
            }
          });
        //} else {
        //  eachCallback(null)
       // }
      }, function(err) {
        if (err) {
          utility.nodeLogs('ERROR', { message: 'Error in monthly donations', data: result });
          callback({ error: err, data: result }, null);
        } else {
          utility.nodeLogs('ERROR', { message: 'Monthly donations done successfully' });
          callback(null, {
            message: 'Monthly donations done successfully',
            data: result
          });
        }
      });
    }
  });
}


exports.doMonthlyDonation = function(ele, callback) {
  var access_token = ele.access_token;
  var month = moment().month() + 1;
  var year = moment().year();
  var created_date = moment().toDate();
  var status_id = ele.status_id;
  var me = this;

  var transactionObj = {
    'payment_method_type': 'credit_card',
    'payment_method_id': ele.card_token,
    'fee_payer': 'payee',
    'callback_uri': props.domain + '/wepay/checkout/ipns',
    'type': "DONATION",
    'amount': ele.amount,
    'app_fee': ele.app_fee
  };

  if (!transactionObj.app_fee) {
    transactionObj.app_fee = 0;
  }

  var wepay_settings = {
    //     'account_id' : account_id,
    'client_id': props.client_id,
    'client_secret': props.client_secret,
    'access_token': access_token
  };

  wp = new wepay(wepay_settings);

  if (props.environment_type === 'production') {
    wp.use_production();
  } else {
    console.log('Came to stage');
    wp.use_staging();
  }

  async.waterfall([
    function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['getUserCardDetails'], [ele.card_id, ele.card_id], function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result[0]);
        }
      });
    },
    function(card_id, callback) {
      var name_tmp;

      excuteQuery.queryForAll(sqlQueryMap['getGateWayAccountDetails'], [ele.code_id], function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          if (result[0]) {
            transactionObj.account_id = result[0].account_id;
            transactionObj.currency = result[0].currency;
          }
          if (result[0].name_tmp) {
            name_tmp = result[0].name_tmp;
          } else if (result[0].charity_title) {
            name_tmp = result[0].charity_title;
          } else {
            name_tmp = "";
          }
          transactionObj.short_description = name_tmp;
          callback(null, result[0]);
        }
      });
    },
    function(code, callback) {
      if (ele.status_id) {
        excuteQuery.queryForAll(sqlQueryMap['updateMonthlyDonationStatus'], ['payment_pending', ele.id, month, year], function(err, result) {
          if (err) {
            callback(new Error(JSON.stringify(err)), null);
          } else {
            callback(null, true);
          }
        });
      } else {
        excuteQuery.insertAndReturnKey(sqlQueryMap['monthlyDonationStatus'], [month, year, ele.id, 'payment_pending', created_date, created_date], function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, result);
          }
        });
      }

    },
    function(code, callback) {
      excuteQuery.queryForAll('SELECT * FROM transaction_tbl WHERE recurring_gift_id=? ORDER BY transaction_date DESC LIMIT 1', [ele.id], function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          if (result[0]) {
            callback(null, result[0]);
          } else {
            callback(null, {
              user_ip_address: '127.0.0.1',
              anonymous: 'yes',
              hide_amount: 'yes'
            });
          }
        }
      });
    },
    function(prev_transaction, callback) {
      wp.call('/checkout/create', transactionObj, function(response) {
        var buffer = new Buffer(response);
        var responseObj = JSON.parse(buffer.toString('utf-8'));

        if (responseObj.error) {
          var errObj = {
            status: 400,
            errors: [responseObj.error_description]
          };
          utility.nodeLogs('ERROR', { message: 'Payment failed ', data: transactionObj, error: errObj });
          excuteQuery.queryForAll(sqlQueryMap['updateMonthlyDonationStatus'], ['payment_failed', ele.id, month, year], function(err, result) {
            if (err) {
              callback(new Error(JSON.stringify(errObj)), null);
            } else {
              callback(new Error(JSON.stringify(errObj)), null);
            }
          });
        } else {
          transactionObj.user_ip_address = prev_transaction.user_ip_address;
          transactionObj.anonymous = prev_transaction.anonymous;
          transactionObj.hide_amount = prev_transaction.hide_amount;
         /* excuteQuery.queryForAll(sqlQueryMap['updateOccurences'], [parseInt(ele.completedoccurences) - 1, ele.id], function(err, occurence) {
            if (err) {
              callback(new Error(JSON.stringify(err)), null);

            } else {*/
              excuteQuery.queryForAll(sqlQueryMap['updateMonthlyDonationStatus'], ['payment_success', ele.id, month, year], function(err, result) {
                if (err) {
                  callback(new Error(JSON.stringify(err)), null);
                } else {
                  callback(null, responseObj);
                }

              });
           /* }
          })*/
        }
      });
    },function(wepay_result, callback) {

      transactionObj.checkout_id = wepay_result.checkout_id;
      var currentdate = moment().toDate();
      var savePaymentObj = {
        'group_donation_id': null,
        'transaction_date': moment(currentdate).format('YYYY-MM-DD HH:mm:ss'),
        'user_id': ele.user_id,
        'charity_id': ele.charity_id,
        'code_id': ele.code_id,
        'type': "code",
        'amount': wepay_result.amount,
        'refunded_date': null,
        'refunded_amount': null,
        'refund_transaction_id': null,
        'processing_fee': wepay_result.fee,
        'wonderwe_fee': wepay_result.app_fee,
        'source': "app",
        'user_ip_address': transactionObj.user_ip_address,
        'withdrawal_process_date': null,
        'transaction_key': null,
        'description': wepay_result.short_description,
        'account_id': transactionObj.account_id,
        'access_token': ele.access_token,
        'checkout_id': wepay_result.checkout_id,
        'checkout_state': wepay_result.state,
        'anonymous': transactionObj.anonymous,
        'hide_amount': transactionObj.hide_amount,
        'created_date': moment(currentdate).format('YYYY-MM-DD HH:mm:ss'),
        'recurring_gift_id': ele.id
      };
      excuteQuery.insertAndReturnKey(sqlQueryMap['saveDonationTransaction'], savePaymentObj, callback)

    },
    function(transaction_id, callback) {
      excuteQuery.queryForAll(sqlQueryMap['updateMonthlyDonationStatus'], ['payment_recorded', ele.id, month, year], function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          var donationObj = {};
          donationObj.amount = ele.amount;
          donationObj.credit_card_id = ele.token;
          donationObj.app_fee = ele.app_fee;
          donationObj.user_id = ele.user_id;
          donationObj.typeof_payment = 'monthly';
          donationObj.code_id = ele.code_id;

          excuteQuery.queryForAll(sqlQueryMap['getCodeById'], [ele.code_id], function(err, codeData) {
            if (codeData && codeData.length) {
              if (codeData[0].charity_id) {
                donationObj.charity_id = codeData[0].charity_id;
              } else {
                donationObj.fundraiser = "fundraiser";
                donationObj.fundraiser_userid = codeData[0].user_id;
              }
            }
            me.sendEmailtoDonater(donationObj, function(err, reuslt) {
              callback(null, result);
            });
            donationService.donationAmountUpdate(donationObj, function(err, result) {
              if (err) {
                utility.nodeLogs('ERROR', { error: err, message: 'Error in updating donation amount to entity in monthly donation script', module: 'Donation' });
              } else {
                utility.nodeLogs('INFO', { message: 'Updated donation about' });
              }
            });
            donationService.trackDonationData(donationObj, function(err, result) {
              if (err) {
                utility.nodeLogs('ERROR', { error: err, message: 'Error in updating tracking.', module: 'Donation' });
              } else {
                utility.nodeLogs('INFO', { message: 'successfully added to tracking', data: donationObj });
              }
            });

            feedBotSrevice.campaignReachedThresholds({ code_id: donationObj.code_id }, function(err, botResponse) {
              console.log('This is from feed bot response');
              console.log(botResponse);
            });


          })

        }
      });
    }
  ], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', {
        message: 'Error in running monthly donations',
        data: ele
      });
    } else {
      utility.nodeLogs('INFO', { message: 'Monthly donation successfully done ', data: ele });
    }
    callback(null, true);
  });
}


exports.sendEmailtoDonater = function(donationObj, callback) {
  var me = this;
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
        donationObj.email_amount = charityResult[0].currency_symbol + new Number(donationObj.amount).toFixed(2) + ' ' + charityResult[0].currency_code;


      }
      if (donationObj.email) {
        // New Card
        me.sendEmailToDonors(donationObj, charityResult, callback);

      } else {
        // Existing card
        excuteQuery.queryForAll(sqlQueryMap['getCardDetails'], [donationObj.credit_card_id], function(err, cardUserResult) {
          if (err) {
            callback(err);


          } else {
            if (cardUserResult && cardUserResult.length > 0) {
              donationObj.zip = cardUserResult[0].postal_code;
              if (cardUserResult[0].email) {
                donationObj.email = cardUserResult[0].email;
              }
              donationObj.name = cardUserResult[0].name;
            }
            me.sendEmailToDonors(donationObj, charityResult, callback);

          }
        });
      }
    }

  });
}

exports.sendEmailToDonors = function(donationObj, charityResult, callback) {
  var logsObj = donationObj;
  excuteQuery.queryForAll(sqlQueryMap['getUser'], [donationObj.user_id], function(err, userResult) {
    if (err) {
      callback(err);

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
          finalobjectmandril.email = userObject.email;
          finalobjectmandril.from = props.fromemail;
          finalobjectmandril.text = "Hai/Hello";
          if (charityResult && charityResult.length > 0 && charityResult[0].name_tmp) {
            var name_tmp = charityResult[0].name_tmp;
          } else {
            var name_tmp = "";
          }
          finalobjectmandril.subject = 'Receipt for your donation to ' + name_tmp;

          if (donationObj.account_type == 'claimed') {
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
              "content": donationObj.email_amount
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

                /* logsObj.error = err;
                 logsObj.action = "Failed to send Claimed account donation receipt email to donor -- donations Service : 1417";
                 utility.nodeLogs('ERROR', logsObj);*/

              } else {
                //  utility.nodeLogs('info', "mail send successfully");
                callback(null, data);
              }
            });
          } else {
            if (charityResult && charityResult.length > 0 && charityResult[0].ein) {
              var ein = charityResult[0].ein;
            } else {
              var ein = '';
            }
            // utility.nodeLogs('info', "unclaimed charity");

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
              "content": donationObj.email_amount
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
              "content": donationObj.typeof_payment || 'monthly'
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
