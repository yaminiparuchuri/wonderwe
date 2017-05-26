/*
  Web hook To update the WePay account status in charity tabl while donor active/delete their wepay account.
 */
var codeService = require('../services/code');
exports.wepayAccountActive = function(wepayObj, callback) {
  //getPaymentAccountData
  excuteQuery.queryForObject(sqlQueryMap['getPaymentAccountData'], [wepayObj.account_id], function(err, charityResult) {

    if (err) {
      callback(err, null);
    } else {
      if (charityResult && charityResult.length > 0) {

        var wepay_settings = {
          'client_id': props.client_id,
          'client_secret': props.client_secret,
          'access_token': charityResult[0].access_token
        };

        wp = new wepay(wepay_settings);

        if (process.env.NODE_ENV === 'production') {
          wp.use_production();
        } else {
          wp.use_staging();
        }
        wp.call('/account', {
          account_id: wepayObj.account_id
        }, function(response) {

          var buffer = new Buffer(response);
          var responseObj = JSON.parse(buffer.toString('utf-8'));
          if (responseObj.error) {
            callback(responseObj, null);
          } else {
            // Here we need to update the wepay state
            //  excuteQuery.update(sqlQueryMap['updateWepayState'], [responseObj.state, charityResult[0].id], callback);
            excuteQuery.update(sqlQueryMap['updateWepayAccountStatus'], [responseObj.state, charityResult[0].id], callback);
          }
        });
      } else {
        callback({
          error: 'SOmething'
        })
      }
    }

  });
}

exports.wepayDonorFundraiserAccountActive = function(wepayObj, callback) {
  excuteQuery.queryForObject(sqlQueryMap['getWepayFundraiserAccessToken'], [wepayObj.account_id], function(err, charityResult) {
    if (err) {
      callback(err, null);
    } else {
      if (charityResult && charityResult.length > 0) {

        var wepay_settings = {
          'client_id': props.client_id,
          'client_secret': props.client_secret,
          'access_token': charityResult[0].access_token
        };

        wp = new wepay(wepay_settings);

        if (process.env.NODE_ENV === 'production') {
          wp.use_production();
        } else {
          wp.use_staging();
        }

        wp.call('/account', {
          account_id: wepayObj.account_id
        }, function(response) {

          var buffer = new Buffer(response);
          var responseObj = JSON.parse(buffer.toString('utf-8'));
          if (responseObj.error) {
            callback(responseObj, null);
          } else {
            if (responseObj.state == 'active') {
              if (wepayObj && wepayObj.code_id) {
                codeService.updateCodeStatus(wepayObj.code_id, function(err, data) {

                });
              }
            }
            // Here we need to update the wepay state
            excuteQuery.update(sqlQueryMap['updateWepayFundraiserState'], [responseObj.state, charityResult[0].id], callback);

          }
        });
      } else {
        callback({
          error: 'SOmething'
        })
      }
    }

  });
}

exports.wepayCheckoutActive = function(wepayObj, callback) {

  excuteQuery.queryForObject(sqlQueryMap['getWepayTransactionAccessToken'], [wepayObj.checkout_id], function(err, charityResult) {

    if (err) {
      callback(err, null);
    } else {

      if (charityResult && charityResult.length > 0) {

        var wepay_settings = {
          'client_id': props.client_id,
          'client_secret': props.client_secret,
          'access_token': charityResult[0].access_token
        };

        wp = new wepay(wepay_settings);

        if (process.env.NODE_ENV === 'production') {
          wp.use_production();
        } else {
          wp.use_staging();
        }

        wp.call('/checkout', {
          checkout_id: wepayObj.checkout_id
        }, function(response) {

          var buffer = new Buffer(response);
          var responseObj = JSON.parse(buffer.toString('utf-8'));

          if (responseObj.error) {
            callback(responseObj, null);
          } else {
            // Here we need to update the wepay state
            excuteQuery.update(sqlQueryMap['updateWepayTransationState'], [responseObj.state, charityResult[0].id], callback);
          }
        });
      } else {
        callback({
          error: 'SOmething'
        })
      }
    }

  });
}

exports.wepaySubscritionActive = function(wepayObj, callback) {
   
    excuteQuery.queryForObject(sqlQueryMap['getWepayRecurringAccessToken'], [wepayObj.subscription_id], function(err, charityResult) {

      if (err) {
        callback(err, null);
      } else {

        if (charityResult && charityResult.length > 0) {

          var wepay_settings = {
            'client_id': props.client_id,
            'client_secret': props.client_secret,
            'access_token': charityResult[0].access_token
          };

          wp = new wepay(wepay_settings);

          if (process.env.NODE_ENV === 'production') {
            wp.use_production();
          } else {
            wp.use_staging();
          }

          wp.call('/subscription', {
            subscription_id: wepayObj.subscription_id
          }, function(response) {

            var buffer = new Buffer(response);
            var responseObj = JSON.parse(buffer.toString('utf-8'));

            if (responseObj.error) {
              console.log(responseObj.error);
              callback(responseObj, null);
            } else {
              console.log(responseObj)
              // Here we need to update the wepay state
              var transactionObj = {
                'group_donation_id': null,
                'transaction_date': moment.utc().toDate(),
                'user_id': charityResult[0].user_id,
                'charity_id': charityResult[0].charity_id,
                'code_id': charityResult[0].code_id,
                'type': "code",
                'amount': charityResult[0].amount,
                'refunded_date': null,
                'refunded_amount': null,
                'refund_transaction_id': null,
                'processing_fee': (((charityResult[0].amount + responseObj.app_fee) * 2.9) / 100) + 0.30,
                'wonderwe_fee': responseObj.app_fee,
                'source': "app",
                'withdrawal_process_date': null,
                'transaction_key': null,
                //'description': responseObj.short_description,
                //'account_id': account_id,
                'access_token': charityResult[0].access_token
                  // 'anonymous': donationObj.anonymous,
                  //'hide_amount': donationObj.hide_amount
              };
              //excuteQuery.insertAndReturnKey(sqlQueryMap['saveDonationTransaction'], transactionObj, function(err, tranResult) {
                excuteQuery.update(sqlQueryMap['updateWepayRecurringState'], [responseObj.state, charityResult[0].id], callback);

             // })

            }
          });
        } else {
          callback({
            error: 'SOmething'
          })
        }
      }

    });
  }
  /**
   * [wepayAccountCreation description]
   * @param  {[type]}   charityObj [description]
   * @param  {Function} callback   [description]
   * @return {[type]}              [description]
   */
exports.wepayAccountCreation = function(charityObj, callback) {

  excuteQuery.update(sqlQueryMap['getCharityInformation'], [charityObj.charityId], function(err, charityResult) {
    if (err) {
      callback(err, null);
    } else {
      if (charityResult && charityResult.length > 0) {

        var charityResponseObj = charityResult[0];

        var wepay_settings2 = {
          'client_id': props.client_id,
          'client_secret': props.client_secret,
          "access_token": charityResponseObj.access_token
        }

        wp2 = new wepay(wepay_settings2);

        if (process.env.NODE_ENV === 'production') {
          wp2.use_production();
        } else {
          wp2.use_staging();
        }

        var accountObject = {
          "name": charityAdminObj.title,
          "reference_id": charityResponseObj.charity_id + "-" + uuid.v4(),
          "callback_uri": props.domain + "/wepay/account/ipns",
          "country": "US",
          "currencies": [
            "USD"
          ]
        };

        //charity description
        accountObject.description = charityResponseObj.brief_description;
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
                    "access_token": charityResponseObj.access_token
                  }

                  wp3 = new wepay(user_settings);

                  if (process.env.NODE_ENV === 'production') {
                    wp3.use_production();
                  } else {
                    wp3.use_staging();
                  }

                  wp3.call('/wepay/send_confirmation/', {
                      "email_message": "Donations made to your WonderWe campaigns are powered by WePay. Press the confirm button so you can keep receiving donations."
                    },
                    function(userResponse) {
                      var userBuffer = new Buffer(userResponse);
                      var userBufferObj = JSON.parse(userBuffer.toString('utf-8'));
                      if (userBufferObj.error) {
                        confirmationCallback(userBufferObj.error, null);
                      } else {
                        utility.log('info', "Sending Confirmation for the User Got Object");
                        confirmationCallback(null, userBufferObj);
                      }
                    });
                },
                charityTableUpdate: function(cahrityCallback) {
                  //About to update the Charity Table with Account ID
                  utility.log('info', "About to update the Charity Table with Account ID");

                  excuteQuery.update(sqlQueryMap['updateCharityAccountDetails'], [accountObj.account_id, charityResponseObj.access_token, accountObj.state, charityResponseObj.id], cahrityCallback);
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
      } else {
        callback({
          'error': 'Looks like not a valid charity'
        }, null);
      }
    }
  });
}

exports.authorizeCard = function(creditCardObj, callback) {

  var user_settings = {
    'client_id': props.client_id,
    'client_secret': props.client_secret,
  }

  var wp3 = new wepay(user_settings);

  if (process.env.NODE_ENV === 'production') {
    wp3.use_production();
  } else {
    wp3.use_staging();
  }

  wp3.call('/credit_card/authorize', {
      "client_id": props.client_id,
      "client_secret": props.client_secret,
      "credit_card_id": creditCardObj.credit_card_id
    },
    function(cardResponse) {
      var userCardBuffer = new Buffer(cardResponse);
      var userCardBuffer2 = JSON.parse(userCardBuffer.toString('utf-8'));
      console.log(userCardBuffer2);
      if (userCardBuffer2.error) {
        callback(userCardBuffer2.error, null);
      } else {
        excuteQuery.update(sqlQueryMap['updateCreditCardName'], [userCardBuffer2.credit_card_name, creditCardObj.cardid], callback);
      }
    });
};

exports.wepayCardCreation = function(paymentObject, confirmationCallback) {

  var user_settings = {
    'client_id': props.client_id,
    'client_secret': props.client_secret,
  }

  var wp3 = new wepay(user_settings);


  if (process.env.NODE_ENV === 'production') {

    wp3.use_production();
  } else {

    wp3.use_staging();
  }


  wp3.call('/credit_card/create', {
    "client_id": props.client_id,
    "user_name": paymentObject['name'],
    // "full_name": paymentObject['name'],
    "email": paymentObject['email'],
    "cc_number": paymentObject['cc-number'],
    "cvv": paymentObject['cc-cvv'],
    "expiration_month": paymentObject['cc-month'],
    "expiration_year": paymentObject['cc-year'],
    "address": {
      "zip": paymentObject['zip']
    }
  }, function(userResponse) {

    var userBuffer = new Buffer(userResponse);
    var userBufferObj = JSON.parse(userBuffer.toString('utf-8'));

    if (userBufferObj.error) {
      confirmationCallback(userBufferObj.error, null);
    } else {
      // confirmationCallback(null, userBufferObj);

      wp3.call('/credit_card/authorize', {
          "client_id": props.client_id,
          "client_secret": props.client_secret,
          "credit_card_id": userBufferObj.credit_card_id
        },
        function(cardResponse) {
          var userCardBuffer = new Buffer(cardResponse);
          var userCardBuffer2 = JSON.parse(userCardBuffer.toString('utf-8'));
          if (userCardBuffer2.error) {
            confirmationCallback(userCardBuffer2.error, null);
          } else {
            confirmationCallback(null, userCardBuffer2);
          }
        });
    }
  });
};

exports.wepayAccountStatus = function(obj, callback) {

  pool.query(sqlQueryMap['selectPendingWePayAccounts'], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      async.each(result, function(singleObj, eachCallback) {

        var wepay_settings = {
          'client_id': props.client_id,
          'client_secret': props.client_secret,
          'access_token': singleObj.access_token
        };

        wp = new wepay(wepay_settings);

        if (process.env.NODE_ENV === 'production') {
          wp.use_production();
        } else {
          wp.use_staging();
        }

        wp.call('/account', {
          account_id: singleObj.account_id,

        }, function(response) {

          var buffer = new Buffer(response);
          var responseObj = JSON.parse(buffer.toString('utf-8'));

          if (responseObj.error) {

            callback(responseObj);
          } else {
            // Here we need to update the wepay state
            excuteQuery.update(sqlQueryMap['updateWepayAccountStatus'], [responseObj.state, singleObj.id], function(err, updateResult) {
              if (err) {
                eachCallback(err);
              } else {
                eachCallback(null);
              }

            });
          }
        });
      }, function(err) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, obj);
        }

      });
    }
  });
};


// WePay User Account Creation with Oauth2

exports.charityWepayAuthentication = function(wepayObj, callback) {
  console.log(wepayObj);
  var me = this;

  pool.query(sqlQueryMap['selectPaymentGatewaysByUser'], [wepayObj.userId, 'wepay'], function(err, userResult) {
    console.log(err);
    console.log(userResult);
    if (err) {
      callback(err, null);
    } else {

      if (userResult && userResult.length > 0 && userResult[0].access_token) {
        me.generateWepayAccount(wepayObj, userResult[0].access_token, callback);
      } else {

        var wepay_settings = {
          'client_id': props.client_id,
          'client_secret': props.client_secret,
          'access_token': null
        };

        wp = new wepay(wepay_settings);

        if (process.env.NODE_ENV === 'production') {
          wp.use_production();
        } else {
          wp.use_staging();
        }

        wp.call('/oauth2/token', {
          client_id: props.client_id,
          'client_secret': props.client_secret,
          code: wepayObj.code,
          redirect_uri: props.domain
        }, function(response) {

          var buffer = new Buffer(response);
          var responseObj = JSON.parse(buffer.toString('utf-8'));
          if (responseObj.error) {
            callback(responseObj.error, null);
          } else {
            console.log(responseObj);
            me.generateWepayAccount(wepayObj, responseObj.access_token,wepay_user_id, callback);
          }
        });
      }
    }
  });

};

exports.generateWepayAccount = function(wepayObj, access_token,wepay_user_id, callback) {
  console.log('WePay connect Object ');
  console.log(wepayObj);
  var me = this;
  var wepay_settings2 = {
    'client_id': props.client_id,
    'client_secret': props.client_secret,
    "access_token": access_token
  }

  wp2 = new wepay(wepay_settings2);

  if (process.env.NODE_ENV === 'production') {
    wp2.use_production();
  } else {
    wp2.use_staging();
  }

  // callback_uri    -- Based country currency
  var accountObject = {
    "name": wepayObj.title,
    "reference_id": wepayObj.charityId + "#" + uuid.v4(),
    "country": "US",
    "currencies": [
      "USD"
    ]
  };

  if (wepayObj.fundraiser === 'yes') {
    if (wepayObj && wepayObj.code_id) {
      var urlFund = props.domain + "/wepay/donor/account/ipns?codeid=" + wepayObj.code_id;
    } else {
      var urlFund = props.domain + "/wepay/account/ipns";
    }
    accountObject.callback_uri = urlFund;
  } else {
    accountObject.callback_uri = props.domain + "/wepay/account/ipns";
  }

  //charity description
  accountObject.description = wepayObj.title;
  //action_required, active, disabled or deleted  -- status

  wp2.call('/account/create', accountObject,
    function(accountResponse) {
      var accountBuffer = new Buffer(accountResponse);
      var accountObj = JSON.parse(accountBuffer.toString('utf-8'));

      if (accountObj.error) {
        callback(accountObj.error, null);
      } else {

        var gateWayObj = {};
        gateWayObj.account_id = accountObj.account_id;
        gateWayObj.user_id = wepayObj.userId;
        if (wepayObj.charityId) {
          gateWayObj.charity_id = wepayObj.charityId;
        }
        if (wepayObj.fundraiser === 'yes') {
          gateWayObj.charity_id = null;
        }
        gateWayObj.access_token = access_token;
        gateWayObj.payment_gateway = 'wepay';
        gateWayObj.account_status = accountObj.state;

        excuteQuery.queryForAll(sqlQueryMap['vaidateExistingPaymentGateway'], [gateWayObj.access_token, gateWayObj.account_id], function(err, paymentGatewaysResult) {
          if (err) {
            clalback(err, null);
          } else {
            if (paymentGatewaysResult && paymentGatewaysResult.length > 0) {
              // Just update the payment_gateway_id in campaing table
              wepayObj.payment_gateway_id = paymentGatewaysResult[0].id;
              me.updateCampaignPaymentGateway(wepayObj, function(err, updatePaymentResult) {});

              wepayObj.account_id = accountObj.account_id;
              wepayObj.state = accountObj.state;
              wepayObj.wepay_account_state = accountObj.state;
              wepayObj.account_status = accountObj.state;
              wepayObj.payment_gateway = 'wepay';
              callback(null, wepayObj);
            } else {
              // Create a payment gateway record and update the payment_gateway_id in campaign table
              excuteQuery.insertAndReturnKey(sqlQueryMap['addPaymentGateWay'], gateWayObj, function(err, rows) {
                if (err) {
                  callback(err, null);
                } else {

                  wepayObj.payment_gateway_id = rows;
                  wepayObj.account_id = accountObj.account_id;
                  wepayObj.state = accountObj.state;
                  wepayObj.wepay_account_state = accountObj.state;
                  wepayObj.account_status = accountObj.state;
                  wepayObj.payment_gateway = 'wepay';
                  if (wepayObj.code_id && wepayObj.payment_gateway_id) {
                    me.updateCampaignPaymentGateway(wepayObj, function(err, updatePaymentResult) {});
                  }
                  callback(null, wepayObj);
                }
              });
            }
          }
        });
      }
    });
};

exports.updateCampaignPaymentGateway = function(obj, callback) {
  console.log("updateCampaignPaymentgateway");
  console.log(obj);
  obj.date_created = moment.utc().toDate();
  excuteQuery.update(sqlQueryMap['updatePaymentGateway'], [obj.payment_gateway_id, 'published', obj.code_id], function(err, result) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      excuteQuery.queryForAll(sqlQueryMap['updateenddate'], [obj.date_created, obj.code_id], function(err1, result1) {
        if (err1) {
          console.log(err1);
          callback(err, null);
        } else {
          excuteQuery.queryForAll(sqlQueryMap['addUserPaymentGateWay'], [obj.code_id, obj.user_id, obj.charityid, obj.payment_gateway_id, obj.date_created], function(err2, result2) {
            if (err2) {
              console.log(err2);
              callback(err, null);
            } else {
              callback(null, result2);
            }
          });
        }
      });
    }
  });

};

exports.updateCodePaymentGateway = function(obj, callback) {
  obj.date_created = moment.utc().toDate();
  console.log(obj);
  excuteQuery.update(sqlQueryMap['updateCodePaymentGateway'], [obj.payment_gateway_id, obj.code_id, obj.code_id], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      excuteQuery.queryForAll(sqlQueryMap['updateenddate'], [obj.date_created, obj.code_id], function(err1, result1) {
        if (err1) {
          console.log(err1);
          callback(err, null);
        } else {
          excuteQuery.queryForAll(sqlQueryMap['addUserPaymentGateWay'], [obj.code_id, obj.user_id, obj.charityid, obj.payment_gateway_id, obj.date_created], function(err2, result2) {
            if (err2) {
              callback(err, null);
            } else {
              callback(null, result2);
            }
          });
        }
      });
    }
  });

};

// exports.insertUserPaymentGateway = function(gateWayObj, callback) {
//   gateWayObj.date_created = moment.utc().toDate();
//    if (gateWayObj.charity_id) {
//        gateWayObj.code_id = null;
//        excuteQuery.queryForAll(sqlQueryMap['getCharityGateways'], [gateWayObj.charity_id] , function(err,result){
//          if(err){
//            callback(err,null);
//          }else{
//           if(result && result.length > 0){
//             excuteQuery.queryForAll(sqlQueryMap['updatCharityGatewayStatus'], ['draft',gateWayObj.charity_id],function(err1,result1){
//               if(err1){
//                 callback(err1,null);
//               }else{
//                 excuteQuery.insertAndReturnKey(sqlQueryMap['addUserPaymentGateWay'], [gateWayObj.code_id,gateWayObj.user_id,gateWayObj.charity_id,gateWayObj.payment_gateway_id,gateWayObj.date_created,'active',gateWayObj.payment_gateway,gateWayObj.account_id], function(err,res){
//                   if(err){
//                     callback(err,null);
//                   }else{
//                     excuteQuery.queryForAll(sqlQueryMap['updateCampaignPaymentgateway'],[gateWayObj.payment_gateway_id,gateWayObj.charity_id],callback);
//                   }
//                 });
//               }
//             });
//           }else{
//             excuteQuery.insertAndReturnKey(sqlQueryMap['addUserPaymentGateWay'], [gateWayObj.code_id,gateWayObj.user_id,gateWayObj.charity_id,gateWayObj.payment_gateway_id,gateWayObj.date_created,'active',gateWayObj.payment_gateway,gateWayObj.account_id], function(err,resobj){
//               if(err){
//                 callback(err,null);
//               }else{
//                 excuteQuery.queryForAll(sqlQueryMap['updateCampaignPaymentgateway'],[gateWayObj.payment_gateway_id,gateWayObj.charity_id],callback);
//               }
//             });
//           }
//          }
//        }) ;

//    }else{
//      excuteQuery.insertAndReturnKey(sqlQueryMap['addUserPaymentGateWay'], [gateWayObj.code_id,gateWayObj.user_id,gateWayObj.charity_id,gateWayObj.payment_gateway_id,gateWayObj.date_created,'active',gateWayObj.payment_gateway,gateWayObj.account_id], callback);
//    }
// };

// exports.resendWepayConfirmationEmail = function(wepayObj, callback) {
//
//   pool.query('select access_token from charity_tbl where id=?', [wepayObj.charityId], function(err, result) {
//
//     if (err) {
//       callback(err, null);
//     } else {
//
//       var wepay_settings = {
//         'client_id': props.client_id,
//         'client_secret': props.client_secret,
//         "access_token": result[0].access_token
//       };
//
//       wp = new wepay(wepay_settings);
//       if (process.env.NODE_ENV === 'production') {
//         wp.use_production();
//       } else {
//         wp.use_staging();
//       }
//
//       wp.call('/user/send_confirmation/', {
//           "email_message": "Donations made to your WonderWe campaigns are powered by WePay. Press the confirm button so you can keep receiving donations."
//         },
//         function(response) {
//           var userBuffer = new Buffer(response);
//           var userObj = JSON.parse(userBuffer.toString('utf-8'));
//           if (userObj.error) {
//             callback(userObj, null);
//           } else {
//             callback(null, userObj);
//           }
//         });
//     }
//
//   });
// };




// WePay Manual Account creation
// WePay Account Creation for charity/fundraiser while creation of campaign

exports.wepayAccountRegistration = function(obj, callback) {
  var me = this;
  // Get the details realated to the charity/fundraiser

  var logsObj = obj;
  excuteQuery.queryForObject(sqlQueryMap[obj.wepayquery], [obj.Id], function(err, detailsObj) {
    if (err) {
      callback(err, null);
      logsObj.error = err;
      logsObj.action = "Got an error while get the details of user and charity details -- wepay Service : 668";
      utility.nodeLogs('ERROR', logsObj);

    } else {
      var result = detailsObj[0];

      //Set WePay settings properties from props

      if (result.first_name) {
        result.first_name = result.first_name.escapeQoutes();
      }

      if (result.description) {
        result.description = result.description.escapeQoutes();
      }

      if (result.last_name) {
        result.last_name = result.last_name.escapeQoutes();
      }

      if (result.title) {
        result.title = result.title.escapeQoutes();
      }

      if (result.name) {
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
            me.accountRegistration(result, obj, accessTokenDetails[0].access_token, accessTokenDetails[0].wepay_user_id,callback);

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
              result.name = result.name.replace(/ +/g, ' ');
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
                  me.accountRegistration(result, obj, responseObj.access_token,responseObj.user_id, callback);
                }
              });
          }
        }
      });
    }
  });
};


exports.accountRegistration = function(result, obj, access_token,wepay_user_id, callback) {
  var me = this;
  var logsObj = obj;
  var wepay_settings2 = {
    'client_id': props.client_id,
    'client_secret': props.client_secret,
    "access_token": access_token
  }
  console.log("aCCOUNRGYGHHV SREGISGFGGHGH")

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
  if (accountObject.country === 'CA') {
    accountObject.country_options = {
      "debit_opt_in": true
    };
  }

  wp2.call('/account/create', accountObject,
    function(accountResponse) {

      var accountBuffer = new Buffer(accountResponse);
      var accountObj = JSON.parse(accountBuffer.toString('utf-8'));

      if (accountObj.error) {
        callback(accountObj, null);

        logsObj.error = accountObj.error;
        logsObj.accountObj = accountObj;
        logsObj.action = "Got an error while create WePay Account -- wepay Service : 818";
        utility.nodeLogs('ERROR', logsObj);

      } else {
        console.log("imh paymenstsd createnjsnjdn")
        // We will get the Account_id with the status of action_required
        // account_id and status will save in db, We Need an account_id while donate
        async.parallel({
            user_confirmation: function(confirmationCallback) {
             console.log("confirmationCallbackconfirmationCallbackconfirmationCallback")
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
                    console.log("userresponsjdbdb")
                    console.log(userResponse);
                    var userBuffer = new Buffer(userResponse);
                    var userBufferObj = JSON.parse(userBuffer.toString('utf-8'));
                    console.log(userBufferObj);
                    if (userBufferObj.error) {
                      utility.log('WARN', "Got an error while sending WePay confirmation email to the user ");
                      confirmationCallback(userBufferObj.error, null);
                    } else {
                      utility.log('info', "Sent WePay Account creation Confirmation email to the related user");
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
              gateWayObj.wepay_user_id = wepay_user_id;
              if (obj.charity_id) {
                gateWayObj.charity_id = obj.charity_id;
              } else {
                gateWayObj.charity_id = null;
              }

console.log("paymentcasgdas djsd creation jsh")
              excuteQuery.insertAndReturnKey(sqlQueryMap['addPaymentGateWay'], gateWayObj, function(err, rows) {
                if (err) {
                  console.log(err);
                  cahrityCallback(err, null);
                } else {
                  console.log(gateWayObj);
                  gateWayObj.payment_gateway_id = rows;
                  gateWayObj.code_id = obj.code_id;
                  //Update the payment_gateway_id in the code_tbl
                  if (gateWayObj.code_id && gateWayObj.payment_gateway_id) {
                    me.updateCampaignPaymentGateway(gateWayObj, function(err, updatePaymentResult) {});
                  }
                  cahrityCallback(null, gateWayObj);
                }
              });
            }
          },
          function(err, asyncResult) {
            if (err) {
              console.log(err);
              callback(err, null);
              logsObj.error = err;
              logsObj.action = "Failed to update in DB after created WePay account for an charity/user -- wepay Service : 900";
              utility.nodeLogs('ERROR', logsObj);

            } else {
              callback(null, asyncResult.createPaymentGateway);
            }
          });
      }
    });
};


exports.sendConfirmationEmail = function(object, callback) {
  var query;
  if (object.type === 'user') {
    query = 'getUserAccessToken';
  } else {
    query = 'getCharityAccessToken';
  }


  excuteQuery.queryForAll(sqlQueryMap[query], [object.Id, 'wepay'], function(err, accessTokenDetails) {
    if (err) {
      callback(err, null);
    } else {

      var access_token = "";

      if (accessTokenDetails && accessTokenDetails.length > 0) {

        access_token = accessTokenDetails[0].access_token;

        var user_settings = {
          'client_id': props.client_id,
          'client_secret': props.client_secret,
          "access_token": access_token
        }

        wp3 = new wepay(user_settings);

        if (process.env.NODE_ENV === 'production') {
          wp3.use_production();
        } else {
          wp3.use_staging();
        }

        wp3.call('/user/send_confirmation', {
            "email_message": "Donations made to your WonderWe campaigns are powered by WePay. Press the confirm button so you can keep receiving donations."
          },
          function(userResponse) {
            var userBuffer = new Buffer(userResponse);
            var userBufferObj = JSON.parse(userBuffer);

            console.log(userBufferObj);

            if (userBufferObj.error) {
              callback(userBufferObj.error, null);
            } else {
              callback(null, { msg: 'WePay email sent successfully.' })
            }
          });
      } else {
        callback({ error: 'User does not connected to any WePay account yet.' });
      }
    }
  });

};
