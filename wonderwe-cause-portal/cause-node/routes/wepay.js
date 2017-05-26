var express = require('express');
var wepayRouter = express.Router();
var wepayServices = require('../services/wepay');
var donationService = require('../services/donations');
var feedBotSrevice = require('../services/feedBot');


//Instant Payment Notifications  --IPNS
wepayRouter.post('/account/ipns', function(req, res) {

  // account_id
  var accountObj = req.body;

  async.series({
    validation: function(callback) {
      validationController.wepayAccountValidation(accountObj, callback);
    },
    data: function(callback) {
      wepayServices.wepayAccountActive(accountObj, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "wepayAccountValidation in validationController from wepay route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "wepayAccountActive in wepay services from wepay route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "wepay account activate, done, In wepay route"]);
      utility.log('info', 'Account web hook updated well');
    }
  });
});

wepayRouter.post('/donor/account/ipns', function(req, res) {

  // account_id
  var accountObj = req.body;
  if (req.query.codeid) {
    accountObj.code_id = req.query.codeid;
  }
  async.series({
    validation: function(callback) {
      validationController.wepayAccountValidation(accountObj, callback);
    },
    data: function(callback) {
      wepayServices.wepayDonorFundraiserAccountActive(accountObj, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "wepayAccountValidation in validationController from wepay route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "wepayAccountActive in wepay services from wepay route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "wepay account activate, done, In wepay route"]);
      utility.log('info', 'Account web hook updated well');
    }
  });
});

wepayRouter.post('/checkout/ipns', function(req, res) {

  // account_id
  var checkoutObj = req.body;
  //checkout_id
  async.series({
    validation: function(callback) {
      validationController.wepayCheckoutValidation(checkoutObj, callback);
    },
    data: function(callback) {
      wepayServices.wepayCheckoutActive(checkoutObj, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "wepayCheckoutValidation in validationController from wepay route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "wepayCheckoutActive in wepay services from wepay route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "wepayCheckoutActive, done, In wepay route"]);
      utility.log('info', "Checkout web hook updated well");
    }
  });
});
//

wepayRouter.post('/subscription/ipns', function(req, res) {


  var subscriptionObj = req.body;
  //subscription_id
  if (subscriptionObj && subscriptionObj.subscription_id) {

    async.series({
      validation: function(callback) {
        validationController.wepaySubscriptionValidation(subscriptionObj, callback);
      },
      data: function(callback) {
        wepayServices.wepaySubscritionActive(subscriptionObj, callback);
      }
    }, function(err, result) {
      if (err) {
        if (err.flag) {
          utility.log('error', "wepaySubscriptionValidation in validationController from wepay route - " + req.cookies.logindonorid);
        } else {
          utility.log('error', "wepaySubscritionActive in wepay services from wepay route - " + req.cookies.logindonorid);
        }
        utility.appErrorHandler(err, res);
      } else {
        utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "wepay subscription activate, done, In wepay route"]);
        utility.log('info', 'Subscription web hook updated well');
      }
    });
  } else {
    utility.log('info', 'Subscription Charge Done well');
  }
});


wepayRouter.post('/charity/:charityid/account/creation', function(req, res, next) {

  // account_id
  var charityObj = {};
  charityObj.charityId = req.params.charityid;

  async.series({
    validation: function(callback) {
      validationController.paramExistsAndNumber(charityObj, callback);
    },
    data: function(callback) {
      wepayServices.wepayAccountCreation(charityObj, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "paramExistsAndNumber in validationController from wepay route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "wepayAccountCreation in wepay services from wepay route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "wepay account creation, done, In wepay route"]);
      utility.dataHandler(result, res);
      //res.send(result.data);
    }
  });
});


wepayRouter.post('/create/card', function(req, res, next) {

  /* {
     "client_id": props.client_id,
     "user_name": paymentObject['name'],
     "full_name": paymentObject['name'],
     "email": paymentObject['email'],
     "cc_number": paymentObject['cc-number'],
     "cvv": paymentObject['cc-cvv'],
     "expiration_month": paymentObject['cc-month'],
     "expiration_year": paymentObject['cc-year'],
     "address": {
       "zip": paymentObject['zip']
     }*/
  var wepayObj = req.body;

  wepayServices.wepayCardCreation(wepayObj, function(err, result) {
    if (err) {
      utility.log('error', "wepayCardCreation in wepay services from wepay route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "wepay card creation, done, In wepay route"]);
      res.send(result);
    }
  });
});



//Create WePay account using Ouath
wepayRouter.post('/charity/account', function(req, res) {

  var wepayObj = req.body;

  wepayServices.charityWepayAuthentication(wepayObj, function(err, result) {
    if (err) {
      utility.log('error', "wepayCardCreation in wepay services from wepay route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);

    } else {

      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "wepay card creation, done, In wepay route"]);

      var resObj = {};
      resObj.data = [result];

      utility.dataHandler(resObj, res);
      //  res.send(result);

    }
  });

});

// Resend WePay user email

//resendWepayConfirmationEmail

wepayRouter.get('/charity/:charityid/confirmation/email', function(req, res) {

  var wepayObj = {};
  wepayObj.charityId = req.params.charityid;

  wepayServices.resendWepayConfirmationEmail(wepayObj, function(err, result) {
    if (err) {
      utility.log('error', "WePay resend confirmation email in wepay services from wepay route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);

    } else {

      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "wepay resend confirmation email, done, In wepay route"]);
      res.send(result);

    }
  });

});


wepayRouter.post('/campaign/gateway/update', function(req, res) {

  var gateWayObj = req.body;

  wepayServices.updateCampaignPaymentGateway(gateWayObj, function(err, result) {
    if (err) {
      utility.log('error', "wepayCardCreation in wepay services from wepay route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);

    } else {

      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "wepay card creation, done, In wepay route"]);

      var resObj = {};
      resObj.data = [result];

      utility.dataHandler(resObj, res);
      //  res.send(result);

    }
  });

});


wepayRouter.get('/email/confirmation/', function(req, res) {
  console.log('in user id ');
  var object = {};
  object.Id = req.query.id;
  object.type = req.query.type;
  wepayServices.sendConfirmationEmail(object, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      var resObj = {};
      resObj.data = [result];
      utility.dataHandler(resObj, res);
      //  res.send(result);
    }
  });
});


wepayRouter.post('/create/accoount', function(req, res) {
  wepayServices.wepayAccountRegistration(req.body, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
    }
  });
});
wepayRouter.post("/stripe/stripehook", function(request, response) {
  // Retrieve the request's body and parse it as JSON
  var event_json = request.body;
  if (event_json.type == 'invoice.payment_succeeded') {
    console.log("stripe webhook.....");
    console.log(event_json.data);
    console.log(event_json.data.object['application_fee'])
    excuteQuery.queryForAll(sqlQueryMap['getDetailsForCancel'], [event_json.data.object.customer, event_json.data.object.subscription], function(err, subscriptionCancelObj) {
      console.log(subscriptionCancelObj)
      if (subscriptionCancelObj && subscriptionCancelObj.length) {
        excuteQuery.queryForAll('SELECT * FROM transaction_tbl WHERE code_id=? and user_id=? and card_id=? ORDER BY created_date DESC', [subscriptionCancelObj[0]['code_id'], subscriptionCancelObj[0]['user_id'], subscriptionCancelObj[0]['card_id']], function(err, transResult) {
  
          var transactionObj = {
            'group_donation_id': null,
            'transaction_date': moment.utc().toDate(),
            'user_id': subscriptionCancelObj[0]['user_id'],
            'charity_id': subscriptionCancelObj[0]['charity_id'],
            'code_id': subscriptionCancelObj[0]['code_id'],
            'type': "code",
          //  'amount': ((parseFloat(event_json.data.object['amount_due'])/100)-(parseFloat(event_json.data.object['application_fee']))).toString(),
            'refunded_amount': null,
            'refund_transaction_id': null,
          //  'wonderwe_fee': (parseFloat(event_json.data.object['application_fee'])).toString(),
            'source': "app",
            'withdrawal_process_date': null,
            'transaction_key': null,
            'description': event_json.data.object.description,
            'account_id': event_json['user_id'],
            'access_token': subscriptionCancelObj[0]['access_token'],
            'created_date': moment().toDate()
          };
          if (transResult && transResult.length) {
            transactionObj.processing_fee = transResult[0]['processing_fee'];
            transactionObj.user_ip_address = transResult[0]['user_ip_address'];
            transactionObj.anonymous = transResult[0].anonymous;
            transactionObj.hide_amount = transResult[0]['hide_amount'];
            transactionObj.account_type = 'claimed';
            transactionObj.card_id=transResult[0].card_id;
            transactionObj.amount=transResult[0].amount;
            transactionObj.wonderwe_fee=transResult[0].wonderwe_fee;

            var now = moment().toDate();
            var createdToday = moment(transResult[0]['created_date']).isSame(now, 'day');
            if (!createdToday) {
              excuteQuery.insertAndReturnKey(sqlQueryMap['saveDonationTransaction'], transactionObj, function(err, response) {
                  if (subscriptionCancelObj[0].codecharityid !=null) {
                    transactionObj.beneficiary_type = "charity";
                  } else {
                    transactionObj.fundraiser = 'fundraiser';
                    transactionObj.fundraiser_userid = subscriptionCancelObj[0]['codeuserid'];
                  }
                  if (subscriptionCancelObj[0].codeteamid) {
                    transactionObj.teamid = subscriptionCancelObj[0].codeteamid;
                  }
                  if (subscriptionCancelObj[0].creditcardtoken) {
                    transactionObj.credit_card_id = subscriptionCancelObj[0].creditcardtoken;
                  }
                  transactionObj.app_fee=transactionObj.wonderwe_fee;
                //  transactionObj.total_amount=transactionObj.wonderwe_fee+transactionObj.amount;
              //  }
                feedBotSrevice.campaignReachedThresholds({ code_id: transactionObj.code_id }, function(err, botResponse) {
                  console.log('This is from feed bot response');
                  console.log(botResponse);
                });
                // agenda.now('sendAnEmailToDonater', transactionObj);
                console.log("cvs bs final tranacgsdgsdhsd shvshdhs");
                console.log(transactionObj)
                donationService.sendEmailToDonater(transactionObj, function(err, result) {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log("dxcfgvhbjb hvhbjn");
                    console.log(result);
                  }
                })

                donationService.trackDonationData(transactionObj, function(err, result) {
                  if (err) {
                    utility.nodeLogs('ERROR', { error: err, message: 'Error in updating tracking.', module: 'Donation' });
                  } else {
                    utility.nodeLogs('INFO', { message: 'successfully added to tracking', data: donationObj });
                  }
                });
              })
            }
          }
        })

      }
    })
  } else if (event_json.type == 'invoice.payment_failed') {
    console.log("paymnetshbah ashd adb s")
  }
});
/*  excuteQuery.queryForAll(sqlQueryMap['getStripeData'], [event_json.data.object.subscription, event_json.data.object.customer], function(err, result) {
      console.log(result);
      if (result && result.length && result[0].subscription_state == 'active') {
        console.log(result);
        excuteQuery.queryForAll(sqlQueryMap['updateOccurences'], [parseInt(result[0].completedoccurences) + 1, result[0].id], function(err, occurence) {
          if (err) {
            console.log(err);
            response.send(err);
          } else {
            if (parseInt(result[0].completedoccurences) - 1 == 0) {
              excuteQuery.queryForAll(sqlQueryMap['getDetailsForCancel'], [event_json.data.object.customer,event_json.data.object.subscription], function(err, subscriptionCancelObj) {
                stripe.customers.cancelSubscription(
                  subscriptionCancelObj.customer_id,
                  subscriptionCancelObj.subscription_id, {
                    stripe_account: subscriptionCancelObj.account_id
                  },
                  function(err, confirmation) {
                    // asynchronously called
                    if (err) {
                      console.log("stripe cancel error");
                      response.send(err);
                    } else {
                      console.log("stripecancel suvcccess")
                      excuteQuery.update(sqlQueryMap['cancelStripeSubscription'], [moment.utc().toDate(), 'cancelled', subscriptionCancelObj.id], function(err, resultres) {
                        response.send(resultres);

                      });
                    }
                  });
              })
            }

          }
        })

      }
    })*/
module.exports = wepayRouter;
