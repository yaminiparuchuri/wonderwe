var charityServices = require('./charity.js');
var wepayService = require('./wepay');
var elasticService = require('./elastic');
var feedBotSrevice = require('./feedBot');
var _ = require('underscore');
var stripeService = require('./stripe');
var codeService = require('./code');
var emoji = require('emojione');
var donorService = require('./donors.js');

/**
 * TODO: Write the Documentation for this Method.
 */


//updating the user deatails
exports.updateUserAddress = function(userObj, callback) {
  excuteQuery.queryForObject(sqlQueryMap["updateUserAddress"], [userObj.country, userObj.state, userObj.city, userObj.address_1, userObj.address_2, userObj.user_id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, result);
    }
  });
};

exports.gettingUserAddress = function(email, callback) {
  excuteQuery.queryForAll(sqlQueryMap["checkemail"], [email], function(err, result) {
    if (err) {
      callback(new Error(err), null)
      utility.nodeLogs('ERROR', 'Error occured while getting the user');
    } else {
      if (result[0] && result[0].id) {
        excuteQuery.queryForAll(sqlQueryMap["getProfileByUserId"], result[0].id, function(err, row) {
          if (err) {
            utility.nodeLogs('ERROR', 'Error occured while getting the user address');
            callback(new Error(err), null)
          } else {
            utility.nodeLogs('INFO', 'Getting user address');
            callback(null, row[0]);
          }
        })
      } else {
        callback(null, null);
      }
    }
  });
}

exports.onetimeDonations = function(donationObj, logsObj, callback) {
  var me = this;
  if (donationObj.code_id) {
    var queryName = "getGateWayAccountDetails";
    var code_id = donationObj.code_id;
  } else {
    var queryName = "getCharityGateWayAccountDetails";
    var code_id = donationObj.charity_id;
    donationObj.code_id = null;
  }
  // var queryName = "getGateWayAccountDetails";
  excuteQuery.queryForObject(sqlQueryMap[queryName], [code_id], function(err, charityResult) {
    if (err) {
      callback(new Error(err), null);
    } else {

      var account_id = "";
      var percentage = "";
      var access_token = "";
      var currency = "";

      // We have claimed and unclaimed charities and have different charges
      // wepay account state is active then we will charge claimed charity charge other wise unclimed charge

      if (charityResult && charityResult.length > 0) {

        if (charityResult[0].access_token && charityResult[0].account_id) {
          var verified = charityResult[0].verified;
          account_id = charityResult[0].account_id;
          access_token = charityResult[0].access_token;
          currency = charityResult[0].currency;
          percentage = props.claimedCharge;
          donationObj.account_type = 'claimed';
          donationObj.verified = verified;

          if (!currency) {
            currency = 'USD';
          }

          var wepay_settings = {
            'client_id': props.client_id,
            'client_secret': props.client_secret,
            'access_token': access_token
          };

          wp = new wepay(wepay_settings);

          if (process.env.NODE_ENV == 'production') {
            wp.use_production();
          } else {
            wp.use_staging();
          }
          if (charityResult && charityResult.length > 0) {

            if (charityResult[0].name_tmp) {
              var name_tmp = charityResult[0].name_tmp;
            } else if (charityResult[0].charity_title) {
              var name_tmp = charityResult[0].charity_title;
            } else {
              var name_tmp = "";
            }

          } else {
            var name_tmp = "";
          }
          if (props.environment_type === 'local') {
            props.domain = 'http://local.wonderwe.can'
          }
          if (!donationObj.app_fee) {
            donationObj.app_fee = 0;
          }
          //TODO: Need to check what is going on with this on the app_fee.
          var paymentObj = {
            'account_id': account_id,
            'short_description': name_tmp,
            'type': 'DONATION',
            'amount': new Number(donationObj.amount + (donationObj.app_fee * donationObj.amount)).toFixed(2),
            'currency': currency,
            'payment_method_id': donationObj.credit_card_id, // user's credit_card_id
            'payment_method_type': 'credit_card',
            "app_fee": new Number(donationObj.app_fee * donationObj.amount).toFixed(2),
            "fee_payer": 'payee',
            "callback_uri": props.domain + "/wepay/checkout/ipns"
          };

          // use staging environment (payments are not charged)
          wp.call('/checkout/create', paymentObj,
            function(response) {

              var buffer = new Buffer(response);
              var responseObj = JSON.parse(buffer.toString('utf-8'));

              if (responseObj.error) {
                var errObj = {
                  status: 400,
                  errors: [responseObj.error_description]
                };

                callback(new Error(JSON.stringify(errObj)), null);

              } else {
                utility.nodeLogs('info', "Checkout Successful");

                logsObj.message = { "message": "Checkout (One time donation) done well", module: "Donations" };
                logsObj.action = "Checkout(One time donation) done successflly -- Donations Router : 141";
                utility.nodeLogs('INFO', logsObj);
                async.waterfall([
                    function(cardCallback) {
                      if (donationObj.savecard == 'yes') {

                        // Insert card details into credit_card_tbl;
                        var cardObj = {
                          last_four: donationObj.last4,
                          date_added: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
                          date_expires: null,
                          user_id: donationObj.user_id,
                          token: donationObj.credit_card_id,
                          month: donationObj['cc-month'],
                          year: donationObj['cc-year'],
                          postal_code: donationObj.zip,
                          name: donationObj.name,
                          email: donationObj.email,
                          payment_gateway: 'wepay',
                          wepay_token: donationObj.credit_card_id
                        };
                        excuteQuery.insertAndReturnKey(sqlQueryMap['saveCreditCard'], cardObj, cardCallback);
                      } else {
                        cardCallback(null, null);
                      }
                    },
                    function(cardid, tranCallback) {
                      // arg1 now equals 'one' and arg2 now equals 'two'
                      //TODO:
                      //TODO:Amount coming from Response Object should be less?
                      var currentdate = moment().toDate();
                      var transactionObj = {
                        'group_donation_id': null,
                        'transaction_date': moment(currentdate).format('YYYY-MM-DD HH:mm:ss'),
                        'user_id': donationObj.user_id,
                        'charity_id': donationObj.charity_id,
                        'code_id': donationObj.code_id,
                        'type': "code",
                        'amount': donationObj.amount,
                        'refunded_date': null,
                        'refunded_amount': null,
                        'refund_transaction_id': null,
                        'processing_fee': responseObj.fee,
                        'wonderwe_fee': responseObj.app_fee,
                        'source': "app",
                        'user_ip_address': donationObj.ip,
                        'withdrawal_process_date': null,
                        'transaction_key': null,
                        'description': responseObj.short_description,
                        'account_id': account_id,
                        'access_token': access_token,
                        'checkout_id': responseObj.checkout_id,
                        'checkout_state': responseObj.state,
                        'anonymous': donationObj.anonymous,
                        'hide_amount': donationObj.hide_amount,
                        'created_date': donationObj.created_date
                      };
                      //inserting the tr into transaction_tbl
                      if (donationObj.donor_comment) {
                        transactionObj.donor_comment = emoji.toShort(donationObj.donor_comment);
                      } else {
                        transactionObj.donor_comment = null;
                      }
                      //checkout_id
                      if (cardid) {
                        transactionObj.card_id = cardid;
                        donationObj.card_id = cardid;
                      } else {
                        transactionObj.card_id = null;
                      }
                      //checking givingLevels yes or not-
                      if (donationObj.givingLevels && donationObj.givingLevels == 'yes') {
                        transactionObj.code_level_id = donationObj.giving_id;
                      } else {
                        transactionObj.code_level_id = ''
                      }
                      //updating type in transaction tbl
                      if (donationObj.charity_id && !donationObj.code_id) {
                        transactionObj.type = "charity";
                      } else {
                        transactionObj.type = "code";
                      }
                      excuteQuery.insertAndReturnKey(sqlQueryMap['saveDonationTransaction'], transactionObj, tranCallback)
                    }
                  ],
                  function(err, result) {
                    if (err) {

                      callback(new Error(err), null);

                    } else {
                      callback(null, donationObj);
                      if (donationObj.charity_id && !donationObj.code_id) {
                        me.updateCharityDonationEntity(donationObj, function(err, resultCharity) {});
                      } else {
                        me.donationAmountUpdate(donationObj, function(err, result7) {});
                      }
                      me.trackDonationData(donationObj, function(err, resulti) {});
                      if (donationObj.givingLevels && donationObj.givingLevels == 'yes') {
                        me.updateGivingLevels(donationObj, function(err, result) {});
                      }

                      if (donationObj.zip) {
                        me.donorZipCodeUpdate({
                          user_id: donationObj.user_id,
                          zip: donationObj.zip
                        }, function(err, updateDonorResult) {});
                      }

                      if (donationObj.savecard == 'yes') {
                        var cardObject = {
                          credit_card_id: donationObj.credit_card_id,
                          cardid: donationObj.card_id,
                        };
                        me.updateCreditCardName(cardObject, function(err, resultUpdate) {});
                      }
                      // me.sendEmailToDonater(donationObj, function(err, data) {});
                      // console.log('Background job started');
                      //agenda.now('sendAnEmailToDonater', donationObj);

                      //VVIMP for sending donor address in donation receipt and donation alert email
                      if (donationObj.city && donationObj.state && donationObj.countryCode && donationObj.address_1 && donationObj.address_2) {
                        charityServices.checkingCanMailing({
                          userId: donationObj.user_id,
                          city: donationObj.city,
                          state: donationObj.state,
                          country: donationObj.countryCode,
                          address_2: donationObj.address_2,
                          address_1: donationObj.address_1,
                          postal_code: donationObj.zip
                        }, function(err, result) {
                          //me.sendEmailToDonater(donationObj, function(err, data) {});
                          console.log('Background job started');
                          agenda.now('sendAnEmailToDonater', donationObj);
                          if (donationObj.code_id) {
                            agenda.now('sendAnEmailToCampaignOwnersAndAdmins', donationObj);
                          }
                        });
                      } else {
                        //me.sendEmailToDonater(donationObj, function(err, data) {});
                        console.log('Background job started');
                        agenda.now('sendAnEmailToDonater', donationObj);
                        if (donationObj.code_id) {
                          agenda.now('sendAnEmailToCampaignOwnersAndAdmins', donationObj);
                        }
                      }


                      if (donationObj.code_id) {
                        feedBotSrevice.campaignReachedThresholds({ code_id: donationObj.code_id }, function(err, botResponse) {
                          console.log('This is from feed bot response');
                          console.log(botResponse);
                        });
                        agenda.now('Check fundraiser goal reached or not', {
                          code_id: donationObj.code_id,
                          user_id: donationObj.user_id
                        });
                      }
                      /* agenda.now('campaignReachedThresholds', {
                           code_id: donationObj.code_id,
                           user_id: donationObj.user_id
                         });*/



                    }
                  });
              }
            });
        } else {
          if (donationObj.code_id) {
            callback(new Error(JSON.stringify({
              errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'],
              status: 400
            })), null);
          } else {
            callback(new Error(JSON.stringify({
              errors: ['Your not able to donate to this charity because owner has submitted in sufficient details'],
              status: 400
            })), null);
          }
        }
      } else {
        if (donationObj.code_id) {
          callback(new Error(JSON.stringify({
            errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'],
            status: 400
          })), null);
        } else {
          callback(new Error(JSON.stringify({
            errors: ['Your not able to donate to this charity because owner has submitted in sufficient details'],
            status: 400
          })), null);

        }
      }
    }
  });
};



exports.donorZipCodeUpdate = function(obj, callback) {

  request('http://maps.googleapis.com/maps/api/geocode/json?address=' + obj.zip, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var array = JSON.parse(body);
      var locationDetails = {};
      locationDetails.userId = obj.user_id;
      locationDetails.postal_code = obj.zip;
      if (array && array.results[0] && array.results[0].address_components) {
        async.each(array.results[0].address_components, function(data, eachCallback) {
          if (data.types[0] === "administrative_area_level_1") {
            locationDetails.state = data.long_name;
          }
          if (data.types[0] === "country") {
            locationDetails.country = data.short_name;
          }
          if (data.types[0] === "locality") {
            locationDetails.city = data.long_name;
          }
          eachCallback(null);
        }, function(err) {
          if (err) {
            callback(err, null);
          } else {
            excuteQuery.queryForAll(sqlQueryMap['donorCountryState'], [locationDetails.state, locationDetails.country], function(err, result) {
              if (err) {
                callback(err, null);
              } else if (result && result.length > 0) {
                excuteQuery.queryForAll(sqlQueryMap['getProfileByUserId'], [locationDetails.userId], function(err, userData) {
                  if (userData && userData[0]) {
                    if (!userData[0].country) {
                      if (result[0] && result[0].state_id) {
                        var queryName = "saveDonorLocation";
                        var fields = [result[0].country_id, result[0].state_id, locationDetails.city, locationDetails.postal_code, locationDetails.userId];
                      } else {
                        var queryName = "saveDonorLocationWithOutState";
                        var fields = [result[0].country_id, locationDetails.city, locationDetails.postal_code, locationDetails.userId];
                      }
                      excuteQuery.update(sqlQueryMap[queryName], fields, callback);
                    } else {
                      callback(null, [])
                    }
                  } else {
                    callback(null, null);
                    utility.nodeLogs('INFO', 'We are not getting user details')
                  }
                })
              } else {
                callback(null, []);
              }
            });
          }
        });
      } else {
        callback('Zipcode is not a valid one', null);
      }
    } else {
      callback('Zipcode is not a valid one', null);
    }
  });
};

exports.ticketpayment = function(donationObj, callback) {
  //donationObj.savecard = 'yes';
  var me = this;
  /*if (donationObj && donationObj.fundraiser && donationObj.fundraiser === 'fundraiser') {
    var queryName = "getFundariserAccount";
    var commonId = donationObj.fundraiser_userid;
  } else {
    var queryName = "getAccessToken";
    var commonId = donationObj.charity_id;
  }*/

  //excuteQuery.queryForObject(sqlQueryMap[queryName], [commonId], function(err, charityResult) {
  excuteQuery.queryForObject(sqlQueryMap['getEventCreaterData'], [donationObj.createrId, donationObj.createrId], function(err, charityResult) {
    if (err) {
      callback(err, null);
    } else {
      var account_id = "";
      var percentage = "";
      var access_token = "";
      var currency = "";

      // We have claimed and unclaimed charities and have different charges
      // wepay account state is active then we will charge claimed charity charge other wise unclimed charge
      if (charityResult && charityResult.length > 0) {

        if (charityResult[0].access_token && charityResult[0].account_id) {

          if (charityResult[0].wepay_account_state == 'active') {
            account_id = charityResult[0].account_id;
            access_token = charityResult[0].access_token;
            currency = charityResult[0].currency;
            percentage = props.claimedCharge;
            donationObj.account_type = 'claimed';

          } else {
            account_id = props.account_id;
            access_token = props.access_token;
            percentage = props.unClaimedCharge;
            currency = 'USD';
            donationObj.account_type = 'unclaimed';
          }

        } else {
          account_id = props.account_id;
          access_token = props.access_token;
          currency = 'USD';
          percentage = props.unClaimedCharge;
          donationObj.account_type = 'unclaimed';
        }

      } else {
        account_id = props.account_id;
        access_token = props.access_token;
        currency = 'USD';
        percentage = props.unClaimedCharge;
        donationObj.account_type = 'unclaimed';
      }

      if (!currency) {
        currency = 'USD';
      }

      var wepay_settings = {
        'client_id': props.client_id,
        'client_secret': props.client_secret,
        'access_token': access_token
      };

      wp = new wepay(wepay_settings);

      if (process.env.NODE_ENV == 'production') {
        wp.use_production();
      } else {
        wp.use_staging();
      }
      if (charityResult && charityResult.length > 0 && charityResult[0].name_tmp) {
        var name_tmp = charityResult[0].name_tmp;
      } else {
        var name_tmp = "";
      }

      var paymentObj = {
        'account_id': account_id,
        'short_description': name_tmp,
        'type': 'DONATION',
        'amount': donationObj.amount,
        'currency': currency,
        'payment_method_id': donationObj.credit_card_id, // user's credit_card_id
        'payment_method_type': 'credit_card',
        "app_fee": donationObj.amount * percentage,
        "callback_uri": props.domain + "/wepay/checkout/ipns"
      };

      if (donationObj.coverfee == 'yes') {
        paymentObj.fee_payer = "payer";
      } else {
        paymentObj.fee_payer = "payee";
      }

      // use staging environment (payments are not charged)
      wp.call('/checkout/create', paymentObj,
        function(response) {

          var buffer = new Buffer(response);
          var responseObj = JSON.parse(buffer.toString('utf-8'));

          if (responseObj.error) {
            utility.nodeLogs('WARN', "Failed in Checkout");
            callback(responseObj, null);
          } else {
            utility.nodeLogs('info', "Checkout Successful");

            async.waterfall([
                function(cardCallback) {
                  if (donationObj.savecard == 'yes') {
                    // Insert card details into credit_card_tbl;
                    var cardObj = {
                      last_four: donationObj.last4,
                      date_added: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
                      date_expires: null,
                      user_id: donationObj.user_id,
                      token: donationObj.credit_card_id,
                      month: donationObj['cc-month'],
                      year: donationObj['cc-year'],
                      postal_code: donationObj.zip,
                      name: donationObj.name,
                      email: donationObj.email,
                      payment_gateway: 'wepay',
                      wepay_token: donationObj.credit_card_id
                    };
                    excuteQuery.insertAndReturnKey(sqlQueryMap['saveCreditCard'], cardObj, cardCallback);
                  } else {
                    cardCallback(null, null);
                  }
                },
                function(cardid, tranCallback) {
                  // arg1 now equals 'one' and arg2 now equals 'two'
                  var currentdate = moment().toDate();
                  var transactionObj = {
                    'group_donation_id': null,
                    'transaction_date': moment(currentdate).format('YYYY-MM-DD HH:mm:ss'),
                    'user_id': donationObj.user_id,
                    'charity_id': donationObj.createrId,
                    'event_id': donationObj.event_id,
                    'type': "event",
                    'amount': responseObj.amount,
                    'refunded_date': null,
                    'refunded_amount': null,
                    'refund_transaction_id': null,
                    'processing_fee': responseObj.fee,
                    'wonderwe_fee': responseObj.app_fee,
                    'source': "app",
                    'user_ip_address': donationObj.ip,
                    'withdrawal_process_date': null,
                    'transaction_key': null,
                    'description': responseObj.short_description,
                    'account_id': account_id,
                    'access_token': access_token,
                    'checkout_id': responseObj.checkout_id,
                    'checkout_state': responseObj.state
                  };
                  //checkout_id
                  if (cardid) {
                    transactionObj.card_id = cardid;
                    donationObj.card_id = cardid;
                  } else {
                    transactionObj.card_id = null;
                  }
                  excuteQuery.insertAndReturnKey(sqlQueryMap['saveEventTransaction'], transactionObj, tranCallback)
                }
              ],
              function(err, result) {
                if (err) {
                  callback(err, null);
                } else {
                  callback(null, donationObj);

                  if (donationObj.zip) {
                    me.donorZipCodeUpdate({
                      user_id: donationObj.user_id,
                      zip: donationObj.zip
                    }, function(err, updateDonorResult) {});
                  }


                  if (donationObj.savecard == 'yes') {

                    var cardObject = {
                      credit_card_id: donationObj.credit_card_id,
                      cardid: donationObj.card_id,
                    };
                    me.updateCreditCardName(cardObject, function(err, resultUpdate) {});

                  }
                  //  me.sendEmailToDonater(donationObj, function(err, data) {});
                  agenda.now('sendAnEmailToDonater', donationObj);
                  agenda.now('Check fundraiser goal reached or not', {
                    code_id: donationObj.code_id,
                    user_id: donationObj.user_id
                  });

                }
              });
          }
        });
    }
  });
};

exports.updateCreditCardName = function(cardObject, callback) {

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

  wp.call('/credit_card', {
    "client_id": props.client_id,
    "client_secret": props.client_secret,
    "credit_card_id": cardObject.credit_card_id
  }, function(response) {
    var buffer = new Buffer(response);
    var responseObj = JSON.parse(buffer.toString('utf-8'));

    if (responseObj) {
      if (responseObj.error) {
        callback(responseObj.error, null)
      } else {
        excuteQuery.update(sqlQueryMap['updateCreditCardName'], [responseObj.credit_card_name, cardObject.cardid], callback);
      }
    }
  });

}


// async.parallel({
//   card_preference: function(cardCallback) {
//     if (donationObj.savecard == 'yes') {
//       // Insert card details into credit_card_tbl;
//       var cardObj = {
//         last_four: donationObj['cc-number'].slice(-4),
//         date_added: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
//         date_expires: null,
//         user_id: donationObj.user_id,
//         token: donationObj.credit_card_id,
//         month: donationObj['cc-month'],
//         year: donationObj['cc-year'],
//         postal_code: donationObj.zip,
//         name: donationObj.name,
//         email: donationObj.email
//       };
//       excuteQuery.insertAndReturnKey(sqlQueryMap['saveCreditCard'], cardObj, cardCallback);
//     } else {
//       cardCallback(null, null);
//     }
//   }
// }, function(err, result) {
//   if (err) {
//     callback(err, null);
//   } else {

//     // Insert data into transaction table..
//     var transactionObj = {
//       'group_donation_id': null,
//       'transaction_date': moment.utc().format('YYYY-MM-DD HH:mm:ss'),
//       'user_id': donationObj.user_id,
//       'charity_id': donationObj.charity_id,
//       'code_id': donationObj.code_id,
//       'type': "code",
//       'amount': responseObj.amount,
//       'refunded_date': null,
//       'refunded_amount': null,
//       'refund_transaction_id': null,
//       'processing_fee': responseObj.fee,
//       'wonderwe_fee': responseObj.app_fee,
//       'source': "app",
//       'user_ip_address': donationObj.ip,
//       'withdrawal_process_date': null,
//       'transaction_key': null,
//       'description': responseObj.short_description,
//       'account_id': account_id,
//       'access_token': access_token,
//       'checkout_id': responseObj.checkout_id,
//       'checkout_state': responseObj.state
//     };
//     //checkout_id
//     if (result.card_preference) {
//       transactionObj.card_id = result.card_preference;

//     } else {
//       transactionObj.card_id = null;
//     }
//     excuteQuery.insertAndReturnKey(sqlQueryMap['saveDonationTransaction'], transactionObj, function(err, transResult) {
//       if (err) {
//         callback(err, null);
//       } else {

//         //......      emailsending is here...........
//         sendEmailToDonater(donationObj, function(err, data) {
//           if (err) {
//             // callback(err, null);
//           } else {
//             //  callback(null, donationObj);
//           }
//         });
//         me.donationAmountUpdate(donationObj);
//         callback(null, donationObj);
//       }
//     });
//   }
// });


// WePay user and account creation...

exports.wepayUserRegister = function(userObj, callback) {
  //"scope" : "manage_accounts, collect_payments, view_user, preapprove_payments, manage_subscriptions, send_money"
  var me = this;
  excuteQuery.queryForObject(sqlQueryMap['getClimedUser'], [userObj.id], function(err, claimedUserResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      utility.nodeLogs('info', "Succeded the Claimed User");
      if (claimedUserResult && claimedUserResult.length > 0) {
        console.log(claimedUserResult);
        var charityAdminObj = claimedUserResult[0];
        //charityAdminObj.id=userObj.admin_user_id;
        charityAdminObj.email = claimedUserResult[0].email_address;
        charityAdminObj.yourname = claimedUserResult[0].first_name + ' ' + claimedUserResult[0].last_name;
        charityAdminObj.charity_id = claimedUserResult[0].charity_id;
        charityAdminObj.can_post = 'yes';
        charityAdminObj.can_update_financial = 'yes';
        charityAdminObj.can_request_withdrawal = 'yes';
        charityAdminObj.can_view_reports = 'yes';
        charityAdminObj.can_code = 'yes';
        charityAdminObj.can_manage_followers = 'yes';
        charityAdminObj.can_admin = 'yes';
        charityAdminObj.date_deleted = 'yes';
        charityAdminObj.defaultuser = 1;
        console.log("first....");
        console.log(claimedUserResult[0].email_address);
        excuteQuery.queryForAll(sqlQueryMap['checkemail'], [claimedUserResult[0].email_address], function(err, userData) {
          if (err) {
            callback(new Error(err), null);
          } else {
            if (userData && userData.length > 0 && userData[0].password) {
              charityAdminObj.charityApproval = "exists";
            } else if (userData && userData.length > 0 && (userData[0].provider == 'facebook' || userData[0].provider == 'google')) {
              charityAdminObj.charityApproval = "exists";
            } else {
              charityAdminObj.charityApproval = "new";
            }

            charityServices.addCharityAdmin(charityAdminObj, function(err, result) {
              if (err) {
                utility.nodeLogs('WARN', "Adding Charity Admin is not Successful");
                callback(new Error(err), null);
              } else {

                utility.nodeLogs('info', "Successfully Added Charity Admin");
                callback(null, result);

                excuteQuery.queryForAll(sqlQueryMap['getCodeIdByCharityAndUser'], [claimedUserResult[0].charity_id, userData[0].id], function(err, result) {
                  if (err) {
                    callback(new Error(err), null);
                  } else {
                    if (result && result[0]) {
                      userObj.code_id = result[0].id;
                      userObj.title = result[0].title;
                      userObj.user_id = userData[0].id;
                      userObj.charity_id = claimedUserResult[0].charity_id;
                      //Creating payment gateway for charity and updating it into campaigns of charity based on country codes
                      utility.nodeLogs('INFO', 'In before get country code');
                      /*userObj.Id = userObj.code_id;
                      userObj.wepayquery = "CharityDetails";*/

                      if (claimedUserResult[0].payment_user_id) {
                        userObj.user_id = claimedUserResult[0].payment_user_id;;
                      }
                      userObj.wepayquery = 'CharityDetails';

                      userObj.Id = userObj.code_id;

                      me.addPaymentGatewayToCharityAndCampaign(userObj, function(err, result) {
                        if (err) {
                          utility.nodeLogs('ERROR', {
                            message: 'Error in creating wepay accounts in claim approval method .Code publish also not done',
                            charity_id: claimedUserResult[0].charity_id,
                            userData: userData[0]
                          });
                        } else {
                          //Updates all campaign status in elastic search which is belongs to charity
                          codeService.updateCharityCodeStatus(claimedUserResult[0].charity_id, function(err, result) {
                            if (err) {
                              utility.nodeLogs('ERROR', {
                                message: 'Error in updating code status into elastic search for charity :' + claimedUserResult[0].charity_id + ' after claim approved'
                              });
                            } else {
                              utility.nodeLogs('INFO', {
                                message: 'Updated code status into elastic search'
                              });
                            }
                          });

                          //agenda.now('Send fundraiser/create email for charity campaigns',{charity_id:claimedUserResult[0].charity_id});
                        }
                      });
                    } else {
                      console.log("second else....second else...");
                      userObj.user_id = userData[0].id;
                      userObj.charity_id = claimedUserResult[0].charity_id;
                      utility.nodeLogs('INFO', 'In before get country code');
                      if (claimedUserResult[0].payment_user_id) {
                        userObj.user_id = claimedUserResult[0].payment_user_id;;
                      }
                      userObj.wepayquery = 'getCharityDetailsForGatewaycreation';

                      userObj.Id = userObj.charity_id;
                      userObj.charityOnly = true;
                      excuteQuery.queryForAll(sqlQueryMap['selectedCharityName'], [userObj.charity_id], function(err, charityResult) {
                        if (err) {
                          utility.nodeLogs('ERROR', {
                            message: 'Error in getting stripe name'
                          });
                        } else if (charityResult[0]) {
                          userObj.title = charityResult[0].name_tmp;
                        }
                      });
                      me.addPaymentGatewayToCharityAndCampaign(userObj, function(err, result) {
                        if (err) {
                          utility.nodeLogs('ERROR', {
                            message: 'Error in creating stripe accounts in claim approval method .Code publish also not done',
                            charity_id: claimedUserResult[0].charity_id,
                            userData: userData[0]
                          });
                        } else {
                          utility.nodeLogs('INFO', {
                            message: 'Payment gateway has been successfully created'
                          });
                        }
                      });
                      /* utility.nodeLogs('ERROR', {
                         message: 'Something went wrong in updating payment gateways into code table',
                         error: 'No campaigns found for claimed user and charity'
                       });*/
                    }
                  }
                });
                //Updates non profit status in elastic search
                //TODO Needs to integrate with existing agenda process if there is any
                elasticService.updateNonProfitStatus(claimedUserResult[0].charity_id, 'APPROVED', claimedUserResult[0].profile_pic_url, function(err, result) {
                  if (err) {
                    utility.nodeLogs('ERROR', {
                      message: 'Error in creating charity claim ',
                      error: err
                    });
                  } else {
                    utility.nodeLogs('INFO', 'Charity claim status updated to pending in elastic search');
                    utility.nodeLogs('INFO', result);
                  }
                });
              }
            });
          }
        });
      } else {
        utility.nodeLogs('WARN', "It should not happen, Need to check what is the cause");
        callback({
          error: 'something went wrong'
        }, null);
      }
    }
  });
};


exports.collectDonarCards = function(user_id, gateway, callback) {
  var array = [];
  /* if (gateway === 'both') {
     var query = "collectAllDonarCards";
     array = [user_id, 'wepay', 'stripe'];
   } else {*/
  var query = "collectDonarCards";
  array = [user_id];
  //wepay
  // if (gateway == "wepay" || gateway == "stripe") {
  //   array.push(gateway);
  // } else {
  //   query = 'collectAllDonarCards'
  // }

  // }

  if (gateway == "wepay") {
    query = 'collectDonarWepayCards'
  } else if (gateway == "stripe") {
    query = 'collectDonarStripeCards'
  } else {
    query = 'collectAllDonarCards'
  }

  excuteQuery.queryForAll(sqlQueryMap[query], array, function(err, cardResult) {
    if (err) {
      callback(err, null);
    } else {
      callback(err, cardResult);
    }
  });
};

exports.donarMonthlySubscription = function(donationObj, callback) {
  //var me = this;
  var me = this;
  /*  if (donationObj && donationObj.fundraiser && donationObj.fundraiser === 'fundraiser') {
      var queryName = "getFundariserAccount";
      var commonId = donationObj.fundraiser_userid;
    } else {
      var queryName = "getAccessToken";
      var commonId = donationObj.charity_id;
    }
  */

  var queryName = "getGateWayAccountDetails"

  excuteQuery.queryForObject(sqlQueryMap[queryName], [donationObj.code_id], function(err, charityResult) {
    //  excuteQuery.queryForObject(sqlQueryMap[queryName], [commonId], function(err, charityResult) {
    //  excuteQuery.queryForObject(sqlQueryMap['getAccessToken'], [donationObj.charity_id], function(err, charityResult) {
    if (err) {
      callback(err, null);
    } else {

      var account_id = "";
      var access_token = "";
      var percentage = "";
      var currency = "";

      if (charityResult && charityResult.length > 0) {
        console.log(charityResult);
        console.log("sdhfhsd.....")
        if (charityResult[0].account_id && charityResult[0].access_token) {

          //  if (charityResult[0].wepay_account_state == 'active') {

          account_id = charityResult[0].account_id;
          access_token = charityResult[0].access_token;
          percentage = props.claimedCharge;
          currency = charityResult[0].currency;
          donationObj.account_type = 'claimed';

          /*  } else {

              account_id = props.account_id;
              access_token = props.access_token;
              percentage = props.unClaimedCharge;
              currency = 'USD';
              donationObj.account_type = 'unclaimed';

            } */
        } else {
          account_id = props.account_id;
          access_token = props.access_token;
          percentage = props.unClaimedCharge;
          currency = 'USD';
          donationObj.account_type = 'unclaimed';
          callback(new Error(JSON.stringify({
            errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'],
            status: 400
          })), null);
        }
      } else {

        account_id = props.account_id;
        access_token = props.access_token;
        percentage = props.unClaimedCharge;
        currency = 'USD';
        donationObj.account_type = 'unclaimed';
        callback(new Error(JSON.stringify({
          errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'],
          status: 400
        })), null);

      }

      if (!currency) {
        currency = 'USD';
      }

      var wepay_settings = {
        //     'account_id' : account_id,
        'client_id': props.client_id,
        'client_secret': props.client_secret,
        "access_token": access_token
      }

      wp = new wepay(wepay_settings);

      if (process.env.NODE_ENV == 'production') {
        wp.use_production();
      } else {
        wp.use_staging();
      }
      //wp.use_staging();
      //plans creation
      wp.call('/subscription_plan/create', {
        "account_id": account_id,
        "name": "MonthlyPlan",
        "short_description": "monthly subscription is on live",
        "amount": donationObj.amount + (donationObj.app_fee * donationObj.amount),
        "currency": currency,
        "period": "monthly",
        "app_fee": donationObj.app_fee * donationObj.amount,
        // "fee_payer": 'payee',
        "reference_id": donationObj.charity_id + "#" + uuid.v4(),
        "callback_uri": props.domain + "/wepay/subscription/plan/ipns",
      }, function(response) {

        //subscription_plan_id
        console.log("response from wepay");
        console.log(response);
        var buffer = new Buffer(response);
        var responseObj = JSON.parse(buffer.toString('utf-8'));
        console.log(responseObj);
        if (responseObj) {

          if (responseObj.error) {
            var errObj = {
              status: 400,
              errors: [responseObj.error_description]
            };

            callback(new Error(JSON.stringify(errObj)), null);
            //  callback(responseObj.error, null);
          } else {

            //subscription charge
            wp.call('/subscription/create', {
              'subscription_plan_id': responseObj.subscription_plan_id,
              'payment_method_id': donationObj.credit_card_id,
              'payment_method_type': 'credit_card',
              "callback_uri": props.domain + '/wepay/subscription/ipns'
            }, function(subscriptionRes) {
              console.log("subscriptionRes");
              console.log(subscriptionRes);
              var buffer2 = new Buffer(subscriptionRes);
              var subObj = JSON.parse(buffer2.toString('utf-8'));

              if (subObj) {
                if (subObj.error) {
                  callback(subObj.error, null);
                } else {

                  async.parallel({
                    card_preference: function(cardCallback) {
                      if (donationObj.savecard == 'yes') {
                        // Insert card details into credit_card_tbl;
                        var cardObj = {
                          last_four: donationObj.last4,
                          date_added: moment.utc().format('YYYY-MM-DD'),
                          date_expires: null,
                          user_id: donationObj.user_id,
                          token: donationObj.credit_card_id,
                          month: donationObj['cc-month'],
                          year: donationObj['cc-year'],
                          postal_code: donationObj.zip,
                          name: donationObj.name,
                          email: donationObj.email,
                          payment_gateway: 'wepay',
                          wepay_token: donationObj.credit_card_id
                        };

                        excuteQuery.insertAndReturnKey(sqlQueryMap['saveCreditCard'], cardObj, cardCallback);
                      } else {
                        cardCallback(null, null);
                      }
                    },
                    reccurrence_gift: function(giftCallback) {
                      // user_id, cahrity_id, amount, gift_interval, interval_value, date_created, date_deleted, code_id
                      // gift_interval -- month (or) week
                      var giftObj = {
                        user_id: donationObj.user_id,
                        charity_id: donationObj.charity_id,
                        amount: donationObj.amount,
                        gift_interval: 'month',
                        interval_value: '30',
                        date_created: moment.utc().format('YYYY-MM-DD'),
                        date_deleted: null,
                        code_id: donationObj.code_id,
                        subscription_id: subObj.subscription_id,
                        subscription_plan_id: responseObj.subscription_plan_id,
                        card_token: donationObj.credit_card_id,
                        access_token: access_token,
                        subscription_state: subObj.state,
                        payment_gateway: 'wepay',
                        card_id: donationObj.user_card_id
                      };

                      if (donationObj.noofoccurences) {
                        giftObj.noofoccurences = donationObj.noofoccurences;
                      }

                      excuteQuery.insertAndReturnKey(sqlQueryMap['sendMonthlyGift'], giftObj, giftCallback);
                      utility.nodeLogs('info', "sending monthly gift callback Successful ");
                    }

                  }, function(err, result) {
                    if (err) {
                      callback(err, null);
                    } else {
                      console.log("result");
                      console.log(result)
                        // Insert data into transaction table..
                      var transactionObj = {
                        'group_donation_id': null,
                        'transaction_date': moment.utc().toDate(),
                        'user_id': donationObj.user_id,
                        'charity_id': donationObj.charity_id,
                        'code_id': donationObj.code_id,
                        'type': "code",
                        'amount': donationObj.amount,
                        'refunded_date': null,
                        'refunded_amount': null,
                        'refund_transaction_id': null,
                        'processing_fee': (((donationObj.amount + responseObj.app_fee) * 2.9) / 100) + 0.30,
                        'wonderwe_fee': responseObj.app_fee,
                        'source': "app",
                        'user_ip_address': donationObj.ip,
                        'withdrawal_process_date': null,
                        'transaction_key': null,
                        'description': responseObj.short_description,
                        'account_id': account_id,
                        'access_token': access_token,
                        'anonymous': donationObj.anonymous,
                        'hide_amount': donationObj.hide_amount,
                        'created_date': donationObj.created_date
                      };

                      if (result.card_preference) {
                        transactionObj.card_id = result.card_preference;
                        donationObj.card_id = result.card_preference;
                      } else {
                        transactionObj.card_id = null;
                        donationObj.card_id = donationObj.user_card_id;
                      }
                      //inserting the comment into transaction_tbl
                      if (donationObj.donor_comment) {
                        transactionObj.donor_comment = donationObj.donor_comment;
                      } else {
                        transactionObj.donor_comment = null;
                      }
                      excuteQuery.queryForAll(sqlQueryMap['recurrenceUpdate'], [donationObj.card_id, result.reccurrence_gift], function(err, cardInsert) {

                        excuteQuery.insertAndReturnKey(sqlQueryMap['saveDonationTransaction'], transactionObj, function(err, tranResult) {
                          if (err) {
                            callback(err, null);
                          } else {
                            callback(null, donationObj);
                            if (donationObj.charity_id && !donationObj.code_id) {
                              me.updateCharityDonationEntity(donationObj, function(err, resultCharity) {});
                            } else {
                              me.donationAmountUpdate(donationObj, function(err, result7) {});
                            }
                            me.trackDonationData(donationObj, function(err, resulti) {});
                            if (donationObj.givingLevels && donationObj.givingLevels == 'yes') {
                              me.updateGivingLevels(donationObj, function(err, result) {});
                            }

                            if (donationObj.zip) {
                              me.donorZipCodeUpdate({
                                user_id: donationObj.user_id,
                                zip: donationObj.zip
                              }, function(err, updateDonorResult) {});
                            }

                            if (donationObj.savecard == 'yes') {
                              var cardObject = {
                                credit_card_id: donationObj.credit_card_id,
                                cardid: donationObj.card_id,
                              };
                              me.updateCreditCardName(cardObject, function(err, resultUpdate) {});

                            }
                            //sendEmailToDonater(donationObj, function(err, data) {});
                            agenda.now('sendAnEmailToDonater', donationObj);
                            agenda.now('Check fundraiser goal reached or not', {
                              code_id: donationObj.code_id,
                              user_id: donationObj.user_id
                            });
                            feedBotSrevice.campaignReachedThresholds({ code_id: donationObj.code_id }, function(err, botResponse) {
                              console.log('This is from feed bot response');
                              console.log(botResponse);
                            });
                            //me.sendEmailToDonater(donationObj, function(err, data) {});
                            console.log('Background job started');
                            agenda.now('sendAnEmailToCampaignOwnersAndAdmins', donationObj);

                          }

                        });
                      })
                    }
                  });

                }
              } else {
                callback({
                  'error': 'subscription failed'
                }, null);
              }
            });
          }
        } else {
          callback({
            'error': 'subscription failed'
          }, null);
        }

      });

    }
  });

};




exports.sendEmailToDonater = function(donationObj, callback) {

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
        donationObj.donatedAmount = charityResult[0].currency_symbol + new Number(donationObj.amount).toFixed(2) + ' ' + charityResult[0].currency_code;


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
//send mails to campaign owner and admins after donation succes
exports.sendMailsToCampaignOwner = function(donationObj, callback) {
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
                        mandrilObject.email = eachObject.email;
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
                          "content": moment().format("MMM Do YYYY")
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
                        callback(err, null);
                      });
                    } else {
                      utility.nodeLogs('INFO', {
                        'message': 'no campaign owner details'
                      });
                      callback(null, null);
                    }
                  }
                });
              } else {
                utility.nodeLogs('INFO', {
                  message: 'This campaign is unchecked for email receiving to owner'
                });
                callback(null, null);
              }
            } else {
              utility.nodeLogs('INFO', {
                message: 'No campaign details found'
              });
              callback(null, null);
            }
          }
        });
      } else {
        utility.nodeLogs('INFO', 'user details not found')
        callback(null, null);
      }
    }

  });
}

function sendEmailToDonors(donationObj, charityResult, callback) {
  var logsObj = donationObj;

  excuteQuery.queryForAll(sqlQueryMap['getUser'], [donationObj.user_id], function(err, userResult) {
    if (err) {
      callback(err);

      logsObj.error = err;
      logsObj.action = "Failed to get the user details while send donation receipt email to donor -- donations Service : 1152";
      utility.nodeLogs('ERROR', logsObj);

    } else {
      if (donationObj.charity_id && !donationObj.code_id) {
        var query = 'getCharityThankYouMsg'
        var code_id = donationObj.charity_id;
      } else {
        var code_id = donationObj.code_id;
        var query = 'getCodeThankYouMsg'
      }
      excuteQuery.queryForAll(sqlQueryMap[query], [code_id], function(err, thankResult) {
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
            }, {
              "name": "codeid",
              "content": "*|CODE_ID|*"
            }];
            finalobjectmandril.merge_vars = [{
              "name": "NAME",
              "content": userObject.name
            }, {
              "name": "AMOUNT",
              "content": donationObj.donatedAmount
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
            }, {
              "name": "CODE_ID",
              "content": donationObj.code_id
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
              "content": donationObj.donatedAmount
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




exports.cancelSubscription = function(subscriptionCancelObj, callback) {


  excuteQuery.update(sqlQueryMap['updateTransactionGift'], [moment.utc().format('YYYY-MM-DD HH:mm:ss'), subscriptionCancelObj.id], callback);

  /*
   excuteQuery.queryForObject(sqlQueryMap['gettingPaymentData'], [subscriptionCancelObj.paymentgatewayid], function(err, charityResult) {
     if (err) {
       callback(err, null);
     } else {
       console.log(charityResult);
       if (charityResult && charityResult.length > 0) {

         if (charityResult[0].wepay_account_state == 'active') {
           var account_id = charityResult[0].account_id;
           var access_token = charityResult[0].access_token;
         } else {
           var account_id = props.account_id;
           var access_token = props.access_token;
         }
       } else {
         var account_id = props.account_id;
         var access_token = props.access_token;
       }

       if (subscriptionCancelObj.access_token) {
         var access_token = subscriptionCancelObj.access_token;
       } else {
         var access_token = props.access_token;
       }

       var wepay_settings = {
         'client_id': props.client_id,
         'client_secret': props.client_secret,
         "access_token": access_token,
       };

       wp = new wepay(wepay_settings);

       if (process.env.NODE_ENV == 'production') {
         wp.use_production();
       } else {
         wp.use_staging();
       }

       async.series({
         plan_cancel: function(palnCallback) {

           wp.call('/subscription_plan/delete', {
             "subscription_plan_id": subscriptionCancelObj.subscription_plan_id,
             "reason": "Subscription plan is canceled"
           }, function(planResponse) {

             var buffer = new Buffer(planResponse);
             var responseObj = JSON.parse(buffer.toString('utf-8'));

             if (responseObj) {
               if (responseObj.error) {
                 palnCallback(responseObj, null);
               } else {
                 palnCallback(null, responseObj);
               }
             } else {
               palnCallback({
                 'error': 'Plan not deleted'
               }, null);
             }
           });
         },
         subscription_cancel: function(subscriptionCallback) {
           wp.call('/subscription/cancel', {
             "subscription_id": subscriptionCancelObj.subscription_id,
             "reason": "subscription Canceled"
           }, function(subscriptionResponse) {

             var buffer2 = new Buffer(subscriptionResponse);
             var responseObj2 = JSON.parse(buffer2.toString('utf-8'));

             if (responseObj2) {
               if (responseObj2.error) {
                 subscriptionCallback(responseObj2, null);
               } else {
                 subscriptionCallback(null, responseObj2);
               }
             } else {
               subscriptionCallback({
                 'error': 'something went wrong while cancel the description'
               }, null);
             }
           });
         }
       }, function(err, asyncResult) {
         if (err) {
           callback(err, null);
         } else {
           excuteQuery.update(sqlQueryMap['updateTransactionGift'], [moment.utc().format('YYYY-MM-DD HH:mm:ss'), subscriptionCancelObj.id], callback);
         }
       });
     }
   }); */
};

exports.donorSubscriptions = function(user_id, callback) {

  excuteQuery.queryForObject(sqlQueryMap['donorSubscriptions'], [user_id, user_id], function(err, recResult) {
    if (err) {
      console.log(err)
      callback(err, null);
    } else {

      if (recResult && recResult.length > 0) {

        var finalObj = {
          monthlyPayments: recResult
        }
        finalObj.donorPayments = 'yes';
        callback(null, finalObj);

      } else {
        var finalObj = {
          nextPayments: [],
          monthlyPayments: []
        }
        callback(null, finalObj);
      }
    }
  });
};


//         var wepay_settings = {
//           //     'account_id' : account_id,
//           'client_id': props.client_id,
//           'client_secret': props.client_secret,
//           //  "access_token": access_token
//         }

//         wp = new wepay(wepay_settings);

//         if (process.env.NODE_ENV == 'production') {
//           wp.use_production();
//         } else {
//           wp.use_staging();
//         }

//         async.each(recResult, function(singleObj, callback) {

//             //  var resObject = singleObj;
//             var month = moment.utc().month();
//             var year = moment.utc().year();
//             var day = moment.utc(singleObj.date_created).get('date');
//             singleObj.payment_date = moment.utc(moment.utc(year + '-' + (month + 1) + '-' + day, 'YYYY-MM-DD').add(30, 'd')).format('Do'); //MMM-DD-YYYY
//             singleObj.paymentDay = day;

//             wp.call('/credit_card', {
//               "client_id": props.client_id,
//               "client_secret": props.client_secret,
//               "credit_card_id": singleObj.card_token
//             }, function(response) {
//               var buffer = new Buffer(response);
//               var responseObj = JSON.parse(buffer.toString('utf-8'));

//               if (responseObj) {
//                 if (responseObj.error) {
//                   callback(null);
//                 } else {
//                   singleObj.cardName = responseObj.credit_card_name
//                   responseArray.push(singleObj);
//                   callback(null);
//                 }
//               } else {
//                 callback(null);
//               }
//             });
//           },
//           function(err) {

//             if (responseArray && responseArray.length > 0) {

//               var sortedDate = [];

//               responseArray.sort(function(a, b) {
//                 return a.paymentDay - b.paymentDay;
//               });

//               /*          for (var i in responseArray) {
//                 if (responseArray[i].paymentDay > moment.utc().date()) {
//                   sortedDate.push(responseArray[i]);
//                 }
//               }
//               sortedDate.sort(function(a, b) {
//                 return b.paymentDay - a.paymentDay;
//               });

// */
//               var finalObj = {
//                 monthlyPayments: responseArray
//               }
//               finalObj.donorPayments = 'yes';
//               /*              if (sortedDate && sortedDate.length > 0) {
//                               var paymentDate = sortedDate[0].paymentDay;
//                               var payment_date = sortedDate[0].payment_date;
//                             } else {
//                               var paymentDate = responseArray[0].paymentDay;
//                               var payment_date = responseArray[0].payment_date;
//                             }
//               */
//               /*      finalObj.nextPayments = _.where(responseArray, {
//                         paymentDay: paymentDate
//                       }),
//               */
//               callback(null, finalObj);
//             } else {
//               var finalObj = {
//                 nextPayments: [],
//                 monthlyPayments: []
//               }
//  callback(null, finalObj);
//   }
// });



exports.donorUniqSubscription = function(obj, callback) {
  console.log("subscription");
  console.log(obj);
  excuteQuery.queryForObject(sqlQueryMap['donorUniqSubscription'], [obj.id], function(err, subscription) {

    if (err) {
      callback(err, null);
    } else {
      console.log(subscription);
      if (subscription && subscription.length > 0) {

        if (subscription[0].payment_gateway === 'stripe') {
          subscription[0].payment_date = moment.utc(subscription[0].date_created).format('Do');
        } else {
          subscription[0].payment_date = moment.utc(moment.utc(subscription[0].date_created).add(31, 'days')).format('Do');
        }
        //if (result.card && result.card.last_four) {
        // result.subscription[0].last_four = result.subscription[0].last_four;
        //}
        callback(null, subscription);
      } else {
        callback({
          error: 'Something went wrong'
        }, null);
      }
    }
  });

  // async.parallel({
  //   subscription: function(subCallback) {

  //     excuteQuery.queryForObject(sqlQueryMap['donorUniqSubscription'], [obj.id], subCallback)
  //   }
  //   card: function(cardCallback) {
  //     var wepay_settings = {
  //         //     'account_id' : account_id,
  //         'client_id': props.client_id,
  //         'client_secret': props.client_secret,
  //       },
  //       wp = new wepay(wepay_settings);

  //     if (process.env.NODE_ENV == 'production') {
  //       wp.use_production();
  //     } else {
  //       wp.use_staging();
  //     }
  //     wp.call('/credit_card', {
  //       "client_id": props.client_id,
  //       "client_secret": props.client_secret,
  //       "credit_card_id": obj.token
  //     }, function(response) {

  //       //subscription_plan_id
  //       var buffer = new Buffer(response);
  //       var responseObj = JSON.parse(buffer.toString('utf-8'));

  //       if (responseObj) {
  //         if (responseObj.error) {
  //           //cardCallback(null, responseObj);
  //           cardCallback(null, null);
  //         } else {
  //           responseObj.last_four = responseObj.credit_card_name.substr(responseObj.credit_card_name.length - 4);
  //           cardCallback(null, responseObj);
  //         }
  //       } else {
  //         cardCallback(null, responseObj);
  //       }
  //     });

  //   }

  // }, function(err, result) {
  //   if (err) {
  //     callback(err, null);
  //   } else {

  //     if (result.subscription && result.subscription.length > 0) {
  //       result.subscription[0].payment_date = moment.utc(moment.utc(result.subscription[0].date_created).add(31, 'days')).format('Do');
  //       //if (result.card && result.card.last_four) {
  //       // result.subscription[0].last_four = result.subscription[0].last_four;
  //       //}
  //       callback(null, result.subscription);
  //     } else {
  //       callback({
  //         error: 'Something went wrong'
  //       }, null);
  //     }
  //   }
  // });
};

exports.updateOccurences = function(id, occurences, callback) {
  excuteQuery.queryForObject(sqlQueryMap["updateOccurences"], [occurences, id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      console.log('updated successfully');
      callback(null, { 'occurences': occurences });
    }
  });
};

exports.getTransactions = function(userId, callback) { // Shows the transactions for the Impact tab in member dashboard
  excuteQuery.queryForAll(sqlQueryMap['userTransactions'], [userId, userId, userId], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      callback(null, result);
      // excuteQuery.queryForAll(sqlQueryMap['userTransactionsFund'], [userId], function(err, result1) {
      //   if (err) {
      //     callback(err, null);
      //   } else if (result1) {
      //     async.each(result, function(object, callback) {
      //       result1.push(object);
      //       callback(null);
      //     }, function(err) {
      //       callback(null, result1);
      //     });
      //
      //   }
      // });
    } else {
      callback(null, []);
    }
  });

};


exports.updateDonorSubscription = function(obj, callback) {

  var wepay_settings = {
    //     'account_id' : account_id,
    'client_id': props.client_id,
    'client_secret': props.client_secret,
    'access_token': obj.access_token
  };

  wp = new wepay(wepay_settings);

  if (process.env.NODE_ENV == 'production') {
    wp.use_production();
  } else {
    wp.use_staging();
  }
  //Added Expired days parameter to avoid the subscription re-auth

  excuteQuery.update(sqlQueryMap['updateTransactionGiftAmount'], [obj.amount, obj.id], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });

  /***
    wp.call('/subscription_plan/modify', {
      "subscription_plan_id": obj.subscription_plan_id,
      "short_description": "Donor updated his subscription",
      "amount": parseFloat(obj.amount),
      "update_subscriptions": "all",
      "transition_expire_days": 2
    }, function(response) {
      var buffer = new Buffer(response);
      var responseObj = JSON.parse(buffer.toString('utf-8'));
      if (responseObj) {
        if (responseObj.error) {
          callback(responseObj, null);
        } else {
          excuteQuery.update(sqlQueryMap['updateTransactionGiftAmount'], [obj.amount, obj.id], callback);
        }
      } else {
        callback(null, responseObj);
      }
    }); ***/

};

//updating the donation amount in team
exports.updateTeamDonation = function(donationObj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['updateTeamDonation'], [parseFloat(donationObj.amount), donationObj.teamid], function(err, result) {})
  excuteQuery.queryForAll(sqlQueryMap['gettingTeamDetails'], [donationObj.teamid], function(err, result) {
    if (err) {
      utility.nodeLogs('Error', 'error occured while getting team details')
      callback(err, null);
    } else {
      if (result && result[0]) {
        excuteQuery.queryForAll(sqlQueryMap['updatingTeamMainCampaign'], [parseInt(donationObj.amount), result[0].code_id], function(err, result) {
          if (err) {
            utility.nodeLogs('Error', 'error occured while updating to main campaign')
            callback(err, null);
          } else {
            console.log("updated amount to main campaing");
          }
        });
      }
    }
  });
};

//updating charity donation details in entity_tbl
exports.updateCharityDonationEntity = function(donationObj, callback) {
  async.parallel({
    updateCharityAmount: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['updateCharityAmount'], [parseInt(donationObj.amount), donationObj.charity_id, 'charity'], function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          utility.nodeLogs('INFO', 'charity amount updated in entity_tbl')
          callback(null, result);
        }
      });
    },
    donarValidation: function(charityCallback2) {
      excuteQuery.queryForAll(sqlQueryMap['charityDonarsValidationCount'], [donationObj.charity_id, donationObj.user_id], function(err, codeDonarsResult) {
        if (err) {
          callback(err, null);
        } else {
          if (codeDonarsResult && codeDonarsResult.length === 1) {
            utility.nodeLogs('INFO', 'charity donors count updated in entity_tbl')
            excuteQuery.update(sqlQueryMap['updateCharityDonorsCount'], [donationObj.charity_id, 'charity'], charityCallback2);
          } else {
            callback(null, {
              'msg': 'done well'
            });
          }
        }
      });
    }
  }, function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, donationObj);
    }
  });

}

exports.donationAmountUpdate = function(donationObj, callback) {
  var me = this;
  async.parallel({
    codeDonationUpdate: function(codeCallback) {
      excuteQuery.queryForAll(sqlQueryMap['getEntityUser'], [donationObj.code_id, 'code'], function(err, codeResult) {
        if (err) {
          //          require('devmetrics')().logger('WARN', " donation update failed ");
          codeCallback(err, null);
        } else {
          if (codeResult && codeResult.length > 0) {
            async.parallel({
              updateDonation: function(donationCodeCallback) {
                excuteQuery.update(sqlQueryMap['updateCodeDonation'], [parseInt(donationObj.amount), codeResult[0].id], function(err, result) {
                  console.log(err);
                  console.log(result);
                });
                //TODO: It should update the Parent Donation Amount As well in Entity Table.
                excuteQuery.update(sqlQueryMap['updateParentCodeDonation'], [parseInt(donationObj.amount), donationObj.code_id], function(err, result) {});
                if (donationObj.teamid) {
                  me.updateTeamDonation(donationObj, function(err, result11) {});
                }
                if (donationObj && donationObj.offline == 'yes') {
                  excuteQuery.queryForAll(sqlQueryMap['getCodeById'], donationObj.code_id, function(err, result) {
                    if (err) {
                      utility.nodeLogs('Error', 'error occured while getting the campaign details')
                      donationCodeCallback(err, null);
                    } else {
                      if (result && result[0].team_id) {
                        donationObj.teamid = result[0].team_id;
                        me.updateTeamDonation(donationObj, function(err, result12) {});
                      }
                      donationCodeCallback(null, null);

                    }
                  });
                }
              },
              donarValidation: function(donorCallback) {
                excuteQuery.queryForAll(sqlQueryMap['codeDonarsValidation'], [donationObj.code_id, donationObj.user_id], function(err, codeDonarsResult) {
                  if (err) {
                    require('devmetrics')().logger('WARN', "in codedonor validation failed");
                    donorCallback(err, null);
                  } else {
                    if (codeDonarsResult && codeDonarsResult.length === 1) {
                      excuteQuery.update(sqlQueryMap['codeDonarsUpdate'], [codeResult[0].id], donorCallback);
                      if (donationObj.teamid) {
                        excuteQuery.queryForAll(sqlQueryMap['updateTeamDonars'], [donationObj.teamid], function(err, result) {})
                      }
                    } else {
                      donorCallback(null, {
                        'msg': 'done well'
                      });
                    }
                    /*else {

                                         excuteQuery.update(sqlQueryMap['codeDonarsUpdate'], [codeResult[0].id], donorCallback);
                                         Update donars count in db..
                                       }*/
                  }
                });
              }
            }, function(err, asyncCallbackResult) {
              if (err) {
                codeCallback(err, null);
              } else {
                codeCallback(null, asyncCallbackResult);
              }
            });

          } else {
            codeCallback({
              'error': 'something went wrong'
            }, null);
          }
        }
      });
    },
    charityCountUpdate: function(charityCallback) {
      if (donationObj.beneficiary_type === 'charity') {
        excuteQuery.queryForAll(sqlQueryMap['getEntityUser'], [donationObj.charity_id, 'charity'], function(err, codeResult) {
          if (err) {
            require('devmetrics')().logger('info', "in charity count update falied ");
            charityCallback(err, null);
          } else {
            if (codeResult && codeResult.length > 0) {
              // Update code donation...
              async.parallel({
                updateDonation: function(charityDonationCallback) {

                  excuteQuery.update(sqlQueryMap['updateCodeDonation'], [parseInt(donationObj.amount), codeResult[0].id], charityDonationCallback);
                },
                donarValidation: function(charityCallback2) {

                  excuteQuery.queryForAll(sqlQueryMap['charityDonarsValidation'], [donationObj.charity_id, donationObj.user_id], function(err, codeDonarsResult) {
                    if (err) {
                      require('devmetrics')().logger('WARN', "in charity donor validation failed");
                      charityCallback2(err, null);
                    } else {

                      if (codeDonarsResult && codeDonarsResult.length === 1) {
                        excuteQuery.update(sqlQueryMap['codeDonarsUpdate'], [codeResult[0].id], charityCallback2);
                      } else {

                        charityCallback2(null, {
                          'msg': 'done well'
                        });
                        // Update donars count in db..
                      }
                    }
                  });
                }
              }, function(err, asyncCallbackResult) {
                if (err) {
                  charityCallback(err, null);
                } else {
                  charityCallback(null, asyncCallbackResult);
                }
              });
            } else {
              charityCallback({
                'error': 'something went wrong'
              }, null);
            }
          }
        });
      } else {
        charityCallback(null, {
          'msg': 'done well'
        });
      }
    }
  }, function(err, result) {
    if (err) {
      var logsObj = donationObj;
      logsObj.error = err;
      logsObj.message = 'Might be, with fundraiser data..';
      logsObj.action = "Failed to update the data in entity_tbl after made a donation -- donations Services :2026";
      utility.nodeLogs('ERROR', logsObj);

    } else {

    }
  });
}



exports.missedWepayUserRegister = function(userObj, callback) {

  excuteQuery.queryForObject(sqlQueryMap['getClimedUser'], [userObj.id], function(err, claimedUserResult) {
    if (err) {
      callback(err, null);
    } else {
      utility.nodeLogs('info', "Succeded the Claimed User");
      if (claimedUserResult && claimedUserResult.length > 0) {

        var charityAdminObj = claimedUserResult[0];
        //charityAdminObj.id=userObj.admin_user_id;
        charityAdminObj.email = claimedUserResult[0].email_address;
        charityAdminObj.yourname = claimedUserResult[0].first_name + ' ' + claimedUserResult[0].last_name;
        charityAdminObj.charity_id = claimedUserResult[0].charity_id;

        //TODO need to change for every organization
        charityAdminObj.name_tmp = "Charity Test";


        var wepay_settings = {
          'client_id': props.client_id,
          'client_secret': props.client_secret
        };

        wp = new wepay(wepay_settings);

        if (process.env.NODE_ENV == 'production') {
          wp.use_production();
        } else {
          wp.use_staging();
        }

        wp.call('/user/register', {
            "client_id": props.client_id,
            "client_secret": props.client_secret,
            "email": charityAdminObj.email_address,
            "scope": "manage_accounts,collect_payments,view_user,preapprove_payments,manage_subscriptions,send_money",
            "first_name": charityAdminObj.first_name,
            "last_name": charityAdminObj.last_name,
            "original_ip": userObj.original_ip,
            "original_device": userObj.original_device,
            "tos_acceptance_time": moment.utc().valueOf()
          },
          function(response) {

            var buffer = new Buffer(response);
            var responseObj = JSON.parse(buffer.toString('utf-8'));
            if (responseObj.error) {



              utility.nodeLogs('WARN', "We Pay User Register Got an Error");
              callback(responseObj, null);
            } else {
              utility.nodeLogs('info', "Checkout Successful");


              var wepay_settings2 = {
                'client_id': props.client_id,
                'client_secret': props.client_secret,
                "access_token": responseObj.access_token //"STAGE_29b328ff7e498e5cfb5c7b071035d7ca12617e68ed6a925c610c6921400b2513"

              }

              wp2 = new wepay(wepay_settings2);

              if (process.env.NODE_ENV == 'production') {
                wp2.use_production();
              } else {
                wp2.use_staging();
              }

              // wp2.use_staging();

              //TODO: Need to check the below code seems not right..
              //Changed the Reference ID to Charity ID Need to Check the API Again.

              // callback_uri
              var accountObject = {
                "name": charityAdminObj.name_tmp,
                "reference_id": charityAdminObj.charity_id + "#" + uuid.v4(),
                "callback_uri": props.domain + "/wepay/account/ipns",
                "country": "US",
                "currencies": [
                  "USD"
                ]
              };

              //charity description
              accountObject.description = charityAdminObj.name_tmp;
              //action_required, active, disabled or deleted  -- status

              wp2.call('/account/create', accountObject,
                function(accountResponse) {

                  var accountBuffer = new Buffer(accountResponse);
                  var accountObj = JSON.parse(accountBuffer.toString('utf-8'));
                  async.parallel({
                      user_confirmation: function(confirmationCallback) {

                        var user_settings = {
                          'client_id': props.client_id,
                          'client_secret': props.client_secret,
                          "access_token": responseObj.access_token
                        }

                        wp3 = new wepay(user_settings);

                        if (process.env.NODE_ENV == 'production') {
                          wp3.use_production();
                        } else {
                          wp3.use_staging();
                        }

                        wp3.call('/user/send_confirmation/', {
                            "email_message": "Welcome to my <strong>WonderWe Application</strong>"
                          },
                          function(userResponse) {
                            var userBuffer = new Buffer(userResponse);
                            var userBufferObj = JSON.parse(userBuffer.toString('utf-8'));
                            if (userBufferObj.error) {
                              utility.nodeLogs('WARN', "Sending Confirmation for the User Got Error");
                              confirmationCallback(userBufferObj.error, null);
                            } else {
                              utility.nodeLogs('info', "Sending Confirmation for the User Got Object");
                              confirmationCallback(null, userBufferObj);
                            }
                          });
                      },
                      charityTableUpdate: function(cahrityCallback) {
                        //About to update the Charity Table with Account ID
                        //wepay_account_status.state
                        //state

                        excuteQuery.update(sqlQueryMap['updateCharityAccountDetails'], [accountObj.account_id, responseObj.access_token, accountObj.state, charityAdminObj.charity_id], cahrityCallback);
                      }
                    },
                    function(err, asyncResult) {

                      if (err) {
                        callback(err, null);
                      } else {
                        callback(null, asyncResult.user_confirmation);
                      }
                    });

                });
            }
          });

      } else {
        utility.nodeLogs('WARN', "It should not happen, Need to check what is the cause");
        callback({
          error: 'something went wrong'
        }, null);
      }
    }
  });

};

exports.updateDonorCardData = function(paymentobject, callback) {
  pool.query('update credit_card_tbl set wepay_token=? where id=?', [paymentobject.wepay_token, paymentobject.card_id], callback);
};

exports.updateDonorStripeCardData = function(cardObj, callback) {

  var me = this;
  pool.query('select * from credit_card_tbl where user_id=?', [cardObj.user_id], function(err, cardResult) {
    if (err) {
      callback(err, null);
    } else {

      if (cardResult && cardResult.length > 0 && cardResult[0].customer_id) {

        stripe.customers.createSource(cardResult[0].customer_id, {
          source: cardObj.stripe_token
        }, function(err, card) {
          if (err) {
            callback(err, null);
          } else {
            cardObj.stripe_card_id = card.id;
            cardObj.customer_id = cardResult[0].customer_id;
            cardObj.payment_gateway = 'stripe';
            cardObj.card_name = cardObj.brand + ' xxxxxx' + cardObj.last4;
            me.saveCardData(cardObj, callback);
          }
        });
      } else {

        stripe.customers.create({
          description: 'Welcome to App ' + cardObj.email + ' & ' + cardObj.user_id,
          source: cardObj.stripe_token, // obtained with Stripe.js
          email: cardObj.email,
          metadata: {
            user_id: cardObj.user_id
          }
        }, function(err, customer) {

          if (err) {
            callback(err, null);
          } else {

            cardObj.customer_id = customer.id;
            cardObj.stripe_card_id = customer.default_source
            cardObj.payment_gateway = 'stripe';
            cardObj.card_name = cardObj.brand + ' xxxxxx' + cardObj.last4;
            me.saveCardData(cardObj, callback);
          }
        });
      }
    }
  });
};


exports.saveCardData = function(paymentobject, callback) {
  pool.query('update credit_card_tbl set token=?,customer_id=?,stripe_card_id=?, card_name=?,last_four=? where id=?', [paymentobject.stripe_token, paymentobject.customer_id, paymentobject.stripe_card_id, paymentobject.card_name, paymentobject.last4, paymentobject.card_id], callback);
};

exports.trackDonationData = function(donationObj, callback) {
  var trackInfo = {};
  if (donationObj.user_id) {
    trackInfo.user_id = donationObj.user_id;
  }
  if (donationObj.code_id) {
    trackInfo.code_id = donationObj.code_id;
  }
  if (donationObj.charity_id) {
    trackInfo.charity_id = donationObj.charity_id;
  }
  if (donationObj.reference_userid) {
    trackInfo.reference_userid = donationObj.reference_userid;
  }
  if (!trackInfo.reference_userid) {
    trackInfo.reference_userid = donationObj.user_id;
  }

  trackInfo.time_stamp = moment().toDate();
  trackInfo.track_type = "donation";
  trackInfo.amount = donationObj.amount;
  excuteQuery.insertAndReturnKey(sqlQueryMap['trackedInfo'], trackInfo, function(err, rows) {
    if (err) {

    } else {

    }
  });
};
//updating the giving levels
exports.updateGivingLevels = function(donationObj, callback) {
  console.log("camehere update givinglevels....");
  console.log(donationObj);
  var me = this;
  var quantity_left = donationObj.quantity_left;
  var new_quantity_left = quantity_left + 1;
  var codeId = donationObj.code_id;
  var id = donationObj.giving_id;
  excuteQuery.queryForAll(sqlQueryMap['updateGivingLevels'], [new_quantity_left, id, codeId], function(err, result) {

    if (err) {
      utility.nodeLogs('WARN', 'error while updating the givingLevels ');
      callback(err, null);
    } else {
      /* if (donationObj && donationObj.teamid) {
         me.updateTeamDonation(donationObj, function(err, result11) {
           callback(null, null);
           utility.nodeLogs('INFO', 'updated campaign givingLevel successfully');
         });

       } else {*/
      callback(null, null);
      utility.nodeLogs('INFO', 'updated campaign givingLevel successfully');
      // }

    }
  })
}

exports.updateCharityAndCampaignPaymentGateWays = function(paymentData, callback) {
  utility.nodeLogs('INFO', 'Come to update campaigns data');
  utility.nodeLogs('INFO', paymentData);

  excuteQuery.queryForAll(sqlQueryMap['updateCodePaymentGatewayOnCharity'], [paymentData.payment_gateway_id, paymentData.charity_id],
    function(err, result) {
      if (err) {
        utility.nodeLogs('ERROR', {
          message: 'Error in updating in payment gateway for all campaigns of the charity ',
          error: err,
          inpuData: paymentData
        });
        callback(err, null);
      } else {
        utility.nodeLogs('INFO', 'Code table payment gateway update on charity id' + paymentData.charity_id + ':' + result);
        callback(null, result);
      }
    });

};


/**
 * Creates payment gateways for charity either wepay or stripe based on the country code
 * @param {[type]}   userObj  [description]
 * @param {Function} callback [description]
 */
exports.addPaymentGatewayToCharityAndCampaign = function(userObj, callback) {
  console.log("inpaymentgatewaymethod")
  console.log(userObj);
  var me = this;
  async.waterfall([
    function(callback) {
      utility.nodeLogs('INFO', 'Before excuting query');
      excuteQuery.queryForAll(sqlQueryMap['getcharityCountryCode'], [userObj.charity_id], function(err, result) {
        if (err) {
          callback(new Error(err), null);
        } else {
          utility.nodeLogs('INFO klsajfkjsa', result);
          if (result[0]) {
            callback(null, result[0].country_code);
          } else {
            callback(new Error(JSON.stringify({
              errors: ['Country code not in the list'],
              status: 500
            })), null);
          }
        }
      });
    },
    function(country_code, callback) {
      /*if (country_code === 'US' || country_code === 'CA') { 
        console.log("inwepay.....");
        console.log(userObj);
        wepayService.wepayAccountRegistration(userObj, function(err, wepayResult) {
          if (err) {
            utility.nodeLogs('ERROR', {
              message: 'Error in user creating payment gateway',
              error: err
            });
            callback(err, null);
          } else {
            utility.nodeLogs('INFO', wepayResult);
            callback(null, wepayResult);
          }
        });
      } else { */
      console.log("In stripe", country_code);
      userObj.country_code = country_code;
      var stripeObj = {};
      console.log('User object:', userObj);
      stripeService.stripeManagedAccountRegistration(userObj, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          stripeObj.payment_gateway_id = result;
          stripeObj.charity_id = userObj.charity_id;
          callback(null, stripeObj);
        }
      });
      /*}*/
    },
    function(wePayResult, callback) {
      if (!userObj.charity) {
        me.updateCharityAndCampaignPaymentGateWays(wePayResult, function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, result);
          }
        });
      } else {
        callback(null, null);
      }

    }
  ], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'Error in creating and updating payment gateways');
      utility.nodeLogs('ERROR', err);
      callback(err, null);
    } else {
      utility.nodeLogs('INFO', 'Created payment gateways and updated to campaigns successfully');
      utility.nodeLogs('INFO', result);
      callback(null, result);
    }
  });
};


exports.newMonthlySubscription = function(donationObj, callback) {
  var me = this;

  console.log(' Added monthly donations');
  if (donationObj.code_id) {
    var queryName = "getGateWayAccountDetails";
    var code_id = donationObj.code_id;
  } else {
    var queryName = "getCharityGateWayAccountDetails";
    var code_id = donationObj.charity_id;
    donationObj.code_id = null;
  }

  excuteQuery.queryForObject(sqlQueryMap[queryName], [code_id], function(err, charityResult) {
    //  excuteQuery.queryForObject(sqlQueryMap[queryName], [commonId], function(err, charityResult) {
    //  excuteQuery.queryForObject(sqlQueryMap['getAccessToken'], [donationObj.charity_id], function(err, charityResult) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {

      var account_id = "";
      var access_token = "";
      var percentage = "";
      var currency = "";

      if (charityResult && charityResult.length > 0) {
        if (charityResult[0].account_id && charityResult[0].access_token) {

          //  if (charityResult[0].wepay_account_state == 'active') {

          account_id = charityResult[0].account_id;
          access_token = charityResult[0].access_token;
          percentage = props.claimedCharge;
          currency = charityResult[0].currency;
          donationObj.account_type = 'claimed';
          donationObj.campaigntitle = charityResult[0].campaigntitle;

        } else {

          account_id = props.account_id;
          access_token = props.access_token;
          percentage = props.unClaimedCharge;
          currency = 'USD';
          donationObj.account_type = 'unclaimed';
          callback(new Error(JSON.stringify({
            errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'],
            status: 400
          })), null);

        }
      } else {

        account_id = props.account_id;
        access_token = props.access_token;
        percentage = props.unClaimedCharge;
        currency = 'USD';
        donationObj.account_type = 'unclaimed';
        callback(new Error(JSON.stringify({
          errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'],
          status: 400
        })), null);

      }

      if (!currency) {
        currency = 'USD';
      }

      var wepay_settings = {
        //     'account_id' : account_id,
        'client_id': props.client_id,
        'client_secret': props.client_secret,
        "access_token": access_token
      }

      wp = new wepay(wepay_settings);

      if (process.env.NODE_ENV == 'production') {
        wp.use_production();
      } else {
        wp.use_staging();
      }
      //wp.use_staging();
      //plans creation
      if (charityResult && charityResult.length > 0) {

        if (charityResult[0].name_tmp) {
          var name_tmp = charityResult[0].name_tmp;
        } else if (charityResult[0].charity_title) {
          var name_tmp = charityResult[0].charity_title;
        } else {
          var name_tmp = "";
        }

      } else {
        var name_tmp = "";
      }


      //subscription charge
      wp.call('/checkout/create', {
        'account_id': account_id,
        'short_description': name_tmp,
        'type': 'DONATION',
        'amount': new Number(donationObj.amount + (donationObj.app_fee * donationObj.amount)).toFixed(2),
        'currency': currency,
        'payment_method_id': donationObj.credit_card_id, // user's credit_card_id
        'payment_method_type': 'credit_card',
        "app_fee": new Number(donationObj.app_fee * donationObj.amount).toFixed(2),
        "fee_payer": 'payee',
        "callback_uri": props.domain + "/wepay/checkout/ipns"
      }, function(responseObj) {
        var buffer2 = new Buffer(responseObj);
        var subObj = JSON.parse(buffer2.toString('utf-8'));
        if (subObj) {
          if (subObj.error) {
            var errObj = {
              status: 400,
              errors: [subObj.error_description]
            };
            callback(new Error(JSON.stringify(errObj)), null);
          } else {

            async.parallel({
              card_preference: function(cardCallback) {
                console.log('Before going to save card');
                if (donationObj.savecard == 'yes') {
                  console.log('In the saving the card');
                  // Insert card details into credit_card_tbl;
                  var cardObj = {
                    last_four: donationObj.last4,
                    date_added: moment.utc().format('YYYY-MM-DD'),
                    date_expires: null,
                    user_id: donationObj.user_id,
                    token: donationObj.credit_card_id,
                    month: donationObj['cc-month'],
                    year: donationObj['cc-year'],
                    postal_code: donationObj.zip,
                    name: donationObj.name,
                    email: donationObj.email,
                    payment_gateway: 'wepay',
                    wepay_token: donationObj.credit_card_id
                  };

                  excuteQuery.insertAndReturnKey(sqlQueryMap['saveCreditCard'], cardObj, cardCallback);
                } else {
                  cardCallback(null, null);
                }
              },
              reccurrence_gift: function(giftCallback) {
                // user_id, cahrity_id, amount, gift_interval, interval_value, date_created, date_deleted, code_id
                // gift_interval -- month (or) week
                var giftObj = {
                  user_id: donationObj.user_id,
                  charity_id: donationObj.charity_id,
                  amount: donationObj.amount,
                  gift_interval: 'month',
                  interval_value: '30',
                  date_created: moment.utc().format('YYYY-MM-DD'),
                  date_deleted: null,
                  code_id: donationObj.code_id,
                  subscription_id: null,
                  subscription_plan_id: null,
                  card_token: donationObj.credit_card_id,
                  access_token: access_token,
                  subscription_state: subObj.state,
                  payment_gateway: 'wepay',
                  card_id: donationObj.user_card_id
                };

                if (donationObj.noofoccurences) {
                  giftObj.noofoccurences = donationObj.noofoccurences;
                }

                if (donationObj.givingLevels && donationObj.givingLevels == 'yes') {
                  giftObj.code_level_id = donationObj.giving_id;
                } else {
                  giftObj.code_level_id = null;
                }

                excuteQuery.insertAndReturnKey(sqlQueryMap['sendMonthlyGift'], giftObj, giftCallback);
                utility.nodeLogs('info', "sending monthly gift callback Successful ");
              }

            }, function(err, result) {

              if (err) {
                callback(err, null);
              } else {
                var transactionObj = {
                  'group_donation_id': null,
                  'transaction_date': moment.utc().toDate(),
                  'user_id': donationObj.user_id,
                  'charity_id': donationObj.charity_id,
                  'code_id': donationObj.code_id,
                  'type': "code",
                  'amount': donationObj.amount,
                  'refunded_date': null,
                  'refunded_amount': null,
                  'refund_transaction_id': null,
                  'processing_fee': subObj.fee,
                  'wonderwe_fee': subObj.app_fee,
                  'source': "app",
                  'user_ip_address': donationObj.ip,
                  'withdrawal_process_date': null,
                  'transaction_key': null,
                  'description': subObj.short_description,
                  'account_id': account_id,
                  'access_token': access_token,
                  'anonymous': donationObj.anonymous,
                  'hide_amount': donationObj.hide_amount,
                  'created_date': donationObj.created_date,
                  'checkout_id': subObj.checkout_id,
                  'checkout_state': subObj.state
                };

                if (result.card_preference) {
                  transactionObj.card_id = result.card_preference;
                  donationObj.card_id = result.card_preference;
                } else {
                  transactionObj.card_id = null;
                  donationObj.card_id = donationObj.user_card_id;
                }
                if (donationObj.donor_comment) {
                  transactionObj.donor_comment = emoji.toShort(donationObj.donor_comment);
                } else {
                  transactionObj.donor_comment = null;
                }
                //updating type in transaction tbl
                if (donationObj.charity_id && !donationObj.code_id) {
                  transactionObj.type = "charity";
                } else {
                  transactionObj.type = "code";
                }

                excuteQuery.queryForAll(sqlQueryMap['recurrenceUpdate'], [donationObj.card_id, result.reccurrence_gift], function(err, cardInsert) {

                  if (donationObj.givingLevels && donationObj.givingLevels == 'yes') {
                    transactionObj.code_level_id = donationObj.giving_id;
                  } else {
                    transactionObj.code_level_id = ''
                  }
                  excuteQuery.insertAndReturnKey(sqlQueryMap['saveDonationTransaction'], transactionObj, function(err, tranResult) {
                    if (err) {
                      console.log(err);
                      callback(err, null);
                    } else {
                      callback(null, donationObj);
                      if (donationObj.charity_id && !donationObj.code_id) {
                        me.updateCharityDonationEntity(donationObj, function(err, resultCharity) {});
                      } else {
                        me.donationAmountUpdate(donationObj, function(err, result7) {});
                      }
                      me.trackDonationData(donationObj, function(err, resulti) {});
                      if (donationObj.givingLevels && donationObj.givingLevels == 'yes') {
                        me.updateGivingLevels(donationObj, function(err, result) {});
                      }

                      if (donationObj.zip) {
                        me.donorZipCodeUpdate({
                          user_id: donationObj.user_id,
                          zip: donationObj.zip
                        }, function(err, updateDonorResult) {});
                      }

                      if (donationObj.savecard == 'yes') {
                        var cardObject = {
                          credit_card_id: donationObj.credit_card_id,
                          cardid: donationObj.card_id,
                        };
                        me.updateCreditCardName(cardObject, function(err, resultUpdate) {
                          if (donationObj.city && donationObj.state && donationObj.countryCode && donationObj.address_1 && donationObj.address_2) {
                            charityServices.checkingCanMailing({
                              userId: donationObj.user_id,
                              city: donationObj.city,
                              state: donationObj.state,
                              country: donationObj.countryCode,
                              address_2: donationObj.address_2,
                              address_1: donationObj.address_1,
                              postal_code: donationObj.zip
                            }, function(err, result) {
                              console.log('Befor going to send monthly donation email');
                              me.sendMonthlyEmailToDonater(donationObj, function(err, result) {
                                console.log(err);
                                console.log(result);
                              });
                              //agenda.now('sendMonthlyEmailToDonater', donationObj);
                              agenda.now('sendAnEmailToDonater', donationObj);
                            });
                          } else {
                            console.log('Before going to send monthly donation email');
                            me.sendMonthlyEmailToDonater(donationObj, function(err, result) {
                              console.log(err);
                              console.log(result);
                            });
                            //agenda.now('sendMonthlyEmailToDonater', donationObj);
                            agenda.now('sendAnEmailToDonater', donationObj);
                          }

                        });

                      } else {

                        if (donationObj.city && donationObj.state && donationObj.countryCode && donationObj.address_1 && donationObj.address_2) {
                          console.log('In the monthly charge user update');
                          charityServices.checkingCanMailing({
                            userId: donationObj.user_id,
                            city: donationObj.city,
                            state: donationObj.state,
                            country: donationObj.countryCode,
                            address_2: donationObj.address_2,
                            address_1: donationObj.address_1,
                            postal_code: donationObj.zip
                          }, function(err, result) {

                            me.sendMonthlyEmailToDonater(donationObj, function(err, result) {
                              console.log(err);
                              console.log(result);
                            });
                            //agenda.now('sendMonthlyEmailToDonater', donationObj);
                            agenda.now('sendAnEmailToDonater', donationObj);
                          });
                        } else {
                          me.sendMonthlyEmailToDonater(donationObj, function(err, result) {
                            console.log(err);
                            console.log(result);
                          });
                          //agenda.now('sendMonthlyEmailToDonater', donationObj);
                          agenda.now('sendAnEmailToDonater', donationObj);
                        }
                      }

                      if (donationObj.code_id) {
                        agenda.now('Check fundraiser goal reached or not', {
                          code_id: donationObj.code_id,
                          user_id: donationObj.user_id
                        });
                        feedBotSrevice.campaignReachedThresholds({ code_id: donationObj.code_id }, function(err, botResponse) {
                          console.log('This is from feed bot response');
                          console.log(botResponse);
                        });
                        console.log('Background job started');
                        agenda.now('sendAnEmailToCampaignOwnersAndAdmins', donationObj);
                      }

                    }

                  });
                });
              }
            }); //End of parallel
          }
        } else {
          callback({
            'error': 'subscription failed'
          }, null);
        }
      }); //End of checkoout create
    }
  });

};

exports.sendMonthlyEmailToDonater = function(donationObj, callback) {

  console.log('Send monthly email donator');
  var mandrilObject = {};
  var current_year = moment.utc().format('YYYY');
  mandrilObject.from = props.supportemail;
  mandrilObject.text = "";
  if (donationObj.code_id && !donationObj.charity_id) {
    mandrilObject.subject = " Your monthly donation successful to campaign";
  } else {
    mandrilObject.subject = " Your monthly donation successful to charity"
  }
  mandrilObject.template_name = "sendMonthlyDonationThankYou";
  mandrilObject.email = donationObj.email;

  mandrilObject.template_content = [{
    "name": "fullname",
    "content": "*|FULL_NAME|*"
  }, {
    "name": "campaignname",
    "content": "*|CAMPAIGN_ORG_NAME|*"
  }, {
    "name": "current_year",
    "content": "*|CURRENT_YEAR|*"
  }, {
    "name": "amount",
    "content": "*|AMOUNT|*"
  }, {
    "name": "date",
    "content": "*|DATE|*"
  }, {
    "name": "cardnum",
    "content": "*|CARDNUM|*"
  }];

  mandrilObject.merge_vars = [{
    "name": "CAMPAIGN_ORG_NAME",
    "content": donationObj.campaigntitle
  }, {
    "name": "CURRENT_YEAR",
    "content": current_year
  }, {
    "name": "AMOUNT",
    "content": donationObj.currency_symbol + ' ' + donationObj.amount + ' ' + donationObj.currency_code
  }, {
    "name": "DATE",
    "content": moment.utc().format('Do')
  }];
  excuteQuery.queryForAll(sqlQueryMap['getUser'], [donationObj.user_id], function(err, userResult) {
    if (err) {
      console.log(err);
    } else {
      excuteQuery.queryForAll(sqlQueryMap['getUserCardDetails'], [donationObj.credit_card_id, donationObj.user_card_id], function(err, result) {
        if (err) {
          console.log(err);
        } else {
          mandrilObject.email = userResult[0].email;
          mandrilObject.merge_vars.push({
            "name": "FULL_NAME",
            "content": userResult[0].name
          });
          if (result[0]) {
            mandrilObject.merge_vars.push({
              "name": "CARDNUM",
              "content": result[0].card_name
            })
          }
          console.log(mandrilObject);
          utility.mandrillTemplate(mandrilObject, function(err, result) {
            if (err) {
              console.log(err);
            } else {
              console.log(result);
            }
          });
        }
      });

    }
  });
};


exports.updateMemberCampaignPaymentGateways = function(gatewayObj, callback) {
  console.log(sqlQueryMap['updateMemberCampaignPaymentGateway']);
  excuteQuery.queryForAll(sqlQueryMap['updateMemberCampaignPaymentGateway'], [gatewayObj.payment_gateway_id, gatewayObj.user_id], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};

exports.codeDonationPage = function(req, res, entityObj) {
  var codeId = entityObj.codeId;
  var mobileLoginDonorId = req.query.logindonorid

  //TODO: May be get rid of this in the next version once we make this to the API.
  if (req.cookies.logindonorid || mobileLoginDonorId) {
    if (mobileLoginDonorId) {
      var user_id = mobileLoginDonorId
    } else {
      var user_id = req.cookies.logindonorid
    }
  } else {
    if (req.query.user_id) {
      var user_id = req.query.user_id
    } else {
      var user_id = ''
    }
  }
  var serviceRequests = {};
  async.parallel({
    campainData: function(callback) {
      donorService.campaignDetails(codeId, user_id, callback)
    },
    campainCharityData: function(callback) {
      donorService.campaignCharityDetails(codeId, user_id, function(err, charityResult) {
        if (charityResult) {
          callback(null, charityResult);
        } else {
          donorService.fundraiserDetails(codeId, function(err, fundraiseUserResult) {
            if (fundraiseUserResult) {
              var fundraiseUserResult = fundraiseUserResult;
              var charityData = {};
              charityData.currency_symbol = fundraiseUserResult.currency_symbol;
              charityData.currency_code = fundraiseUserResult.currency_code;
              charityData.payment_gateway = fundraiseUserResult.payment_gateway;
              charityData.country_name = fundraiseUserResult.country_name;
              charityData.currency_conversion = fundraiseUserResult.currency_conversion;
              charityData.fundraiser = "yes";
              callback(null, charityData);
            } else {
              var charityData = {};
              callback(null, charityData);
            }
          });
        }
      })
    },
    // teamCampaigns: function(teamCampaignCallback) {
    //   donorService.teamCampaigns(codeId, user_id, teamCampaignCallback);
    // },
    donorData: function(callback) {
      donorService.donorCountryData(user_id, callback);
    },
    givingLevelsTotal: function(callback) {
      donorService.givingLevelsOfCampaign(codeId, callback)
    }
  }, function(err, result) {
    var object = {};
    if (!req.cookies.token) {
      object.donornav = "signUpModule";
    }
    var donationObj = {}
    donationObj.charityId = result.campainCharityData.charity_id;
    donationObj.charityTittle = result.campainCharityData.tittle;
    donationObj.codeId = result.campainData.id;
    donationObj.donations = result.campainData.suggested_donation;
    donationObj.payment_gateway = result.campainData.payment_gateway;
    donationObj.title = result.campainData.title;
    donationObj.wecode = result.campainData.code_text;
    donationObj.currency_code = result.campainCharityData.currency_code;
    donationObj.currency_symbol = result.campainCharityData.currency_symbol;
    //donationObj.team_campaign = result.campainData.team_campaign;
    donationObj.canmailing = result.campainData.can_mailing_required;
    //donationObj.teamid = result.campainData.team_id;
    donationObj.countrycode = result.campainData.countrycode;
    donationObj.givinglevels = result.givingLevelsTotal;
    donationObj.appFee = result.campainData.app_fee;
    donationObj.profile_pic_url = result.campainData.code_picture_url;
    donationObj.code_text=result.campainData.code_text
    if (donationObj.appFee || donationObj.appFee === 0) {
      donationObj.appfee = donationObj.appFee / 100;
    } else {
      donationObj.appfee = "";
    }
    if (donationObj.givinglevels) {
      donationObj.givingLevelsArray = donationObj.givinglevels;
      donationObj.givingLevelsArrayStringfy = JSON.stringify(donationObj.givingLevelsArray);
    }
    if (result.donorData) {
      donationObj.adminCard = result.donorData
    }
    if (result.campainData.fundraiseruserid) {
      donationObj.fundraiser_userid = result.campainData.fundraiseruserid;
      donationObj.reference_userid = result.campainData.referenceuserid;
      donationObj.fundraiser = result.campainData.fundraiser;
      donationObj.furl = result.campainData.furl;
      donationObj.turl = result.campainData.turl;
      if (result.donorData) {
        donationObj.donateuserid = result.donorData.user_id;
      }
    }
    var userCurrencyValue = "";
    var userCountryCode = "";
    var userCurrencySymbol = "";

    if (result.donorData && result.donorData.length > 0) {
      userCurrencyValue = result.donorData[0].currency_conversion;
      userCountryCode = result.donorData[0].currency_code;
      userCurrencySymbol = result.donorData[0].currency_symbol;
    } else {
      userCurrencyValue = 1;
      userCountryCode = 'USD';
      userCurrencySymbol = '$';
    }

    donationObj.goalConversion = numeral(((result.campainData.goal / result.campainCharityData.currency_conversion) * userCurrencyValue).toFixed(2)).format('0,0');
    donationObj.donationConversion = numeral(((result.campainData.noof_donations / result.campainCharityData.currency_conversion) * userCurrencyValue).toFixed(2)).format('0,0');
    donationObj.userCountryCode = userCountryCode;
    donationObj.userCurrencySymbol = userCurrencySymbol;
    if (result.campainData.donation_progress >= 100) {
      donationObj.donation_progress = 100
    }
    donationObj.layout = 'donation'
    console.log(donationObj);
    if (user_id) {
      var array = [];
      var query = "collectDonarCards";
      array = [user_id];

      if (donationObj.payment_gateway == "wepay") {
        query = 'collectDonarWepayCards'
      } else if (donationObj.payment_gateway == "stripe") {
        query = 'collectDonarStripeCards'
      } else {
        query = 'collectAllDonarCards'
      }
      donationObj.user_id = user_id;
      excuteQuery.queryForAll(sqlQueryMap[query], array, function(err, cardResult) {
        if (err) {
          callback(err, null);
        } else {

          donationObj.cards = cardResult;

          res.render('./pages/donationpage.hbs', donationObj);
        }
      });
    } else {
      res.render('./pages/donationpage.hbs', donationObj);
    }

  })
}

exports.getPrisingModals = function(obj, callback) {
  console.log(obj);
  excuteQuery.queryForObject(sqlQueryMap["getPrisingModals"], [parseInt(obj.prisingAmountFrom), parseInt(obj.prisingAmountTo)], function(err, result) {
    console.log(err);
    if (err) {
      callback(new Error(err), null);
    } else {
      console.log(result);
      callback(null, result);
    }
  });
};
