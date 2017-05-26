var express = require('express');
var donationsRouter = express.Router();
var donationServices = require('../services/donations');
var followerService = require('../services/follower');
var stripeService = require('../services/stripe');

/**
 * @api {post} /donation/onetime One time donation.
 * @apiName onetimeDonation
 * @apiGroup Donation
 * @apiDescription  Used to make a donation for onetime
 *  @apiParam {string}   name                 Users name. 
 *  @apiParam {string}   email                Users email.
 *  @apiParam {number}   cc-month             Userd card cc-month.
 *  @apiParam {number}   cc-year              Users card cc-year.
 *  @apiParam {string}   country              Users country.
 *  @apiParam {number}   zip                  Users zip.
 *  @apiParam {string}   donorpic             Users donorpic.
 *  @apiParam {string}   donor_comment        Users donation_comment.
 *  @apiParam {number}   [team]               campaign team fundraiser or not flag
 *  @apiParam {number}   [teamid]             team fundraiser id
 *  @apiParam {number}   user_id              loggedin user id.
 *  @apiParam {number}   fundraiser_userid    campaign creator user_id.
 *  @apiParam {string}   [fundraiser]         flag for benificiary campaign or not. 
 *  @apiParam {number}   charity_id           We are send user_id as charity for benificiary campaigns
 *  @apiParam {number}   reference_userid     loggedin user id.
 *  @apiParam {string}   payment_gateway      Campaign payment gateway.
 *  @apiParam {symbol}   currency_symbol      Campaign currency symbol.  
 *  @apiParam {string}   currency_code        Campaign currecny symbol. 
 *  @apiParam {number}   code_id              Campaigns unique id. 
 *  @apiParam {string}   typeof_payment       onetime or monthly. 
 *  @apiParam {string}   savecard             User wants save card or not. 
 *  @apiParam {string}   anonymous            User wants hide name or not.
 *  @apiParam {string}   hide_amount          Users wants hide amount or not.
 *  @apiParam {number}   amount               Users Donation amount.
 *  @apiParam {number}   app_fee              WonderWe Appfee.
 *  @apiParam {string}   stripeToken          Stripe token.
 *  @apiParam {number}   last4                Users creditcard last four digits.
 *  @apiParam {string}   brand                Users card brand.
 *  @apiParam {string}   stripe_card_country  stripe card country.
 *  @apiParam {string}   countrycode          Campaign country code.

 * @apiParamExample {json} Request-Example:
 * Body for guest donation:
 * {
 *  "name":"venkata narendra", 
 *  "email":"bvnkumar007@gmail.com",
 *  "cc-month":"12",
 *  "cc-year":"2019",
 *  "country":"US",
 *  "zip":"90001",
 *  "donorpic":"",
 *  "donor_comment":"This is for testing",
 *  "team":"",
 *  "teamid":"",
 *  "user_id":3519,
 *  "fundraiser_userid":"5933",
 *  "fundraiser":"fundraiser",
 *  "charity_id":"5933",
 *  "reference_userid":"3519",
 *  "payment_gateway":"stripe",
 *  "currency_symbol":"£",
 *  "currency_code":"GBP",
 *  "code_id":89162,
 *  "typeof_payment":"one time",
 *  "savecard":"no",
 *  "anonymous":"no",
 *  "hide_amount":"no",
 *  "amount":12,
 *  "app_fee":0.1,
 *  "stripeToken":"tok_19cutIGDdr5zIXnHcZ7pcKtO",
 *  "last4":"4242",
 *  "brand":"Visa",
 *  "stripe_card_country":"US",
 *  "countrycode":"GB"
 *  }
   
 

 *  @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * {"status":"success",
 *  "data":
 *     {
 *       "name":"venkata narendra",
 *         "email":"bvnkumar007@gmail.com",
 *        "cc-month":"12",
 *        "cc-year":"2019",
 *        "country":"US",
 *         "zip":"90001",
 *         "donorpic":"",
 *         "donor_comment":"This is for testing",
 *         "team":"",
 *         "teamid":"",
 *         "user_id":3519,
 *         "fundraiser_userid":"5933",
 *         "fundraiser":"fundraiser",
 *         "charity_id":5933,
 *         "reference_userid":"3519",
 *         "payment_gateway":"stripe",
 *         "currency_symbol":"£",
 *         "currency_code":"GBP",
 *         "code_id":89162,
 *         "typeof_payment":"one time",
 *         "savecard":"no",
 *         "anonymous":"no",
 *         "hide_amount":"no",
 *         "amount":12,
 *         "app_fee":0.1,
 *         "stripeToken":"tok_19cutIGDdr5zIXnHcZ7pcKtO",
 *         "last4":"4242",
 *         "brand":"Visa",
 *         "stripe_card_country":"US",
 *         "countrycode":"GB",
 *          "ip":"127.0.0.1",
 *          "created_date":"2017-01-17 16:42:40",
 *          "verified":null,
 *          "currency":"GBP",
 *          "account_type":"claimed",
 *          "charity_title":"Alekhya Surabattina",
 *          "account_id":"acct_19ctDpC2n8UXpuXs",
 *         "date_followed":"2017-01-17T11:12:59.297Z"
 *         }
 *      }
 *  @apiErrorExample {json} Error-Response:
 *        {
 *  "status":"error",
 *  "errors":
 *      ["this account is no longer able to transact"]
 *        }
 * 
 */


donationsRouter.post('/onetime', function(req, res, next) {
  var paymentObject = req.body;
  paymentObject.ip = req.ip;
  paymentObject.date_followed = moment().toDate();
  var logsObj = req.logsObj;
  var createdDate = moment().toDate()
  paymentObject.created_date = moment(createdDate).format('YYYY-MM-DD HH:mm:ss');
  //onetimeDonations
  async.series({
    validation: function(callback) {
      validationController.onetimeDonation(paymentObject, callback);
    },
    data: function(callback) {

      donationServices.onetimeDonations(paymentObject, logsObj, callback);
    }
  }, function(err, result) {
    if (err) {
      logsObj.module = "Donations";
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.dataHandler(result, res);
      paymentObject.date_followed = moment.utc().toDate();
      if (paymentObject.team == 'no' && paymentObject.code_id) {
        followerService.createFollowCode(paymentObject, function(err, result1) {});
      }
      if (paymentObject.charity_id && !paymentObject.code_id) {
        followerService.charityFollow(paymentObject, function(err, result2) {});
      }
      logsObj.message = { message: "One time donation done well", module: "Donations" };
      logsObj.action = "One time donation done successflly -- donations Router : 49";
      logsObj.module = "Donations";

      utility.nodeLogs('INFO', logsObj);
    }
  });

});

donationsRouter.post('/ticket/payment', function(req, res, next) {
  var paymentObject = req.body;
  paymentObject.ip = req.ip;
  paymentObject.date_followed = moment().toDate();
  // paymentObject.entity_id = 3812168;
  //paymentObject.entity_code = "code";
  //onetimeDonations
  async.series({
    data: function(callback) {


      donationServices.ticketpayment(paymentObject, callback);

    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "onetimeDonation in validationController from donations route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "createFollowCode/onetimeDonations in followerService/donationServices from donations route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      utility.dataHandler(result, res);
      followerService.createFollowCode(paymentObject, function(err, result1) {});
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "onetime donation, done, In donations route"]);
    }
  });

});


donationsRouter.post('/claimed/user/register', function(req, res, next) {

  var userObject = {
    id: req.body.id
  };
  userObject.original_ip = req.ip;
  userObject.original_device = req.hostname;
  //onetimeDonations

  async.series({
    validation: function(callback) {
      validationController.wepayUserRegister(userObject, callback);
    },
    data: function(callback) {
      donationServices.wepayUserRegister(userObject, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "wepayUserRegister in validationController from donations route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "wepayUserRegister in donationServices from donations route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "claimed user register, done, In donations route"]);
      utility.dataHandler(result, res);
    }
  });

});


/**
 * @api {get} /donations/donor/:userid/cards Get card details of donations
 * @apiName  Get card details of donations
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "user_id": 3
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *   "status": "success",
 *   "data": [
 *       {
 *           "id": 10,
 *           "last_four": 2020,
 *           "date_added": null,
 *           "date_expires": null,
 *           "user_id": 3,
 *           "token": 1464660858,
 *           "month": 4,
 *           "year": 18,
 *           "postal_code": null,
 *           "name": null
 *       },
 *       {
 *           "id": 118,
 *           "last_four": 1117,
 *           "date_added": "2015-05-10T18:30:00.000Z",
 *           "date_expires": null,
 *           "user_id": 3,
 *           "token": 1267730868,
 *           "month": 10,
 *           "year": 2023,
 *           "postal_code": "10001",
 *           "name": "Laxman G"
 *       }
 *   ]
 *}
 *
 */


donationsRouter.get('/donor/:userid/cards/:gateway', function(req, res, next) {

  var user_id = req.params.userid;
  var gateway = req.params.gateway;

  async.series({
    validation: function(callback) {
      validationController.wepayUserRegister({
        id: user_id
      }, callback);
    },
    data: function(callback) {
      donationServices.collectDonarCards(user_id, gateway, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "wepayUserRegister in validationController from donations route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "collectDonarCards in donationServices from donations route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "collect donor cards, done, In donations route"]);
      utility.dataHandler(result, res);
    }
  });
});

/**
 * @api {get} /donations/donor/:userid/transactions Get donations
 * @apiName  Get donations
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "user_id": 3
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *   "status": "success",
 *   "data": [
 *       {
 *           "transaction_date": "2014-10-19T12:12:36.000Z",
 *           "code_text": "a",
 *           "title": "habitasse platea",
 *           "charity_name": "PHYSICIANS FOR SOCIAL RESPONSIBILITY INC",
 *           "amount": 100
 *       },
 *       {
 *           "transaction_date": "2014-10-19T14:41:03.000Z",
 *           "code_text": "49W",
 *           "title": "49 WRITERS",
 *           "charity_name": "49 WRITERS",
 *           "amount": 300
 *       }
 *   ]
 *}
 *
 */
donationsRouter.get('/donor/:userid/transactions', function(req, res, next) {
  donationServices.getTransactions(req.params.userid, function(err, result) {
    if (err) {
      utility.log('error', "getTransactions in donationServices from donations route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "donor transactions, done, In donations route"]);
      utility.dataHandler({
        data: result
      }, res);
    }
  });
});
donationsRouter.post('/monthly/subscription', function(req, res, next) {

  var donationObj = req.body;
  donationObj.ip = req.ip;

  var createdDate = moment().toDate();
  donationObj.created_date = moment(createdDate).format('YYYY-MM-DD HH:mm:ss');

  //TODO data should come from front end..
  //       donationObj.savecard ='yes/no';
  //     donationObj.code_id ="2641";
  //    donationObj.coverfee ="yes/no"
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.onetimeDonation(donationObj, callback);
    },
    data: function(callback) {
      // followerService.createFollowCode(donationObj, function(err, result1) {
      donationServices.newMonthlySubscription(donationObj, callback);
      // });
    }
  }, function(err, result) {
    if (err) {
      logsObj.module = "Donations";
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      donationObj.date_followed = moment.utc().toDate();
      if (donationObj.team == 'no' && donationObj.code_id) {
        followerService.createFollowCode(donationObj, function(err, result1) {});
      }
      if (donationObj.charity_id && !donationObj.code_id) {
        followerService.charityFollow(donationObj, function(err, result2) {});
      }
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "monthly subscription, done, In donations route"]);
      utility.dataHandler(result, res);
    }
  });
});


// To cancel MOnthly subscription

donationsRouter.post('/cancel/donor/subscription', function(req, res, next) {
  /*{
      subscription_id:12345,
       subscription_plan_id:67890,
      reason:"Your wish",
      charity_id :"12345"
   }*/
  var cancelSubObj = req.body;
  console.log(cancelSubObj);

  console.log("acgvhbnj")
  async.series({
    validation: function(callback) {
      validationController.cancelSubscription(cancelSubObj, callback);
    },
    data: function(callback) {
      if (cancelSubObj.payment_gateway === 'stripe') {
        stripeService.cancelStripeSubscription(cancelSubObj, callback);
      } else {
        donationServices.cancelSubscription(cancelSubObj, callback);
      }
    }
  }, function(err, result) {
    console.log(err);
    if (err) {
      if (err.flag) {
        utility.log('error', "cancelSubscription in validationController from donations route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "cancelSubscription in donationServices from donations route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "cancel donor subscriptions, done, In donations route"]);
      utility.dataHandler(result, res);
    }
  });
});
donationsRouter.get('/donor/:userid/recurring/subscriptions', function(req, res, next) {

  var user_id = req.params.userid;

  async.series({
    validation: function(callback) {
      validationController.wepayUserRegister({
        id: user_id
      }, callback);
    },
    data: function(callback) {
      donationServices.donorSubscriptions(user_id, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "wepayUserRegister in validationController from donations route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "donorSubscriptions in donationServices from donations route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      utility.log('info', "before sending date to frontend donations");
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "donor recurring subscription, done, In donations route"]);
      utility.dataHandler(result, res);
    }
  });
});

donationsRouter.post('/donor/:id/subscription', function(req, res, next) {

  var id = req.params.id;
  var obj = req.body;
  console.log("sadndjna")
  console.log(id);
  console.log(obj);
  async.series({
    validation: function(callback) {
      validationController.wepayUserRegister({
        id: id
      }, callback);
    },
    data: function(callback) {
      donationServices.donorUniqSubscription(obj, callback);
    }
  }, function(err, result) {
    console.log(result);
    if (err) {
      if (err.flag) {
        utility.log('error', "wepayUserRegister in validationController from donations route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "donorUniqSubscription in donationServices from donations route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "donor subscription, done, In donations route"]);
      utility.dataHandler(result, res);
    }
  });
});

donationsRouter.post('/updates/:id/occurences', function(req, res, next) {
  var id = req.params.id;
  var occurences = req.query.occurencesCount;
  var logsObj = req.logsObj;
  donationServices.updateOccurences(id, occurences, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res)
    } else {
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  });
});


donationsRouter.post('/update/donor/subscription', function(req, res, next) {

  var id = req.params.id;
  var obj = req.body;

  async.series({
    /*   validation : function(callback) {
         validationController.wepayUserRegister({id:id}, callback);
       },*/
    data: function(callback) {
      if (obj.payment_gateway === 'stripe') {
        stripeService.updateStripeSubscription(obj, callback);
      } else {
        donationServices.updateDonorSubscription(obj, callback);
      }

    }
  }, function(err, result) {
    if (err) {
      utility.log('error', "updateDonorSubscription in donationServices from donations route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "donor subscription update, done, In donations route"]);
      utility.dataHandler(result, res);
    }
  });
});






//TODO need to remove after implemented the donation flow..
donationsRouter.post('/user/register', function(req, res, next) {
  /*
  {
    "client_id":12345,
    "client_secret":"6446c521bd",
    "email":"api@wepay.com",
    "scope":"manage_accounts,view_balance,collect_payments,view_user",
    "first_name":"Bill",
    "last_name":"Clerico",
    "original_ip":"74.125.224.84",
    "original_device":"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6;
                       en-US) AppleWebKit/534.13 (KHTML, like Gecko)
                       Chrome/9.0.597.102 Safari/534.13",
    "tos_acceptance_time":1209600
  }
  */
  var wepay_settings = {
    'client_id': props.client_id,
    'client_secret': props.client_secret,
    // 'api_version': 'API_VERSION'
  };

  wp = new wepay(wepay_settings);
  wp.use_staging();
  wp.call('/user/register', {
      "client_id": props.client_id,
      "client_secret": props.client_secret,
      "email": "venkatsep14@gmail.com",
      //preapprove_payments, send_money,
      "scope": "manage_accounts,view_balance,collect_payments,view_user,manage_subscriptions",
      "first_name": "Venkat",
      "last_name": "Dulipalli",
      "original_ip": "74.125.224.84",
      "original_device": "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; en-US) AppleWebKit/534.13 (KHTML, like Gecko) Chrome/9.0.597.102 Safari/534.13",
      "tos_acceptance_time": 1429472773671
    },
    function(response) {
      res.send(response);
    });
});
donationsRouter.post('/account/create', function(req, res, next) {
  var wepay_settings = {
    'client_id': props.client_id,
    'client_secret': props.client_secret,
    "access_token": "STAGE_29b328ff7e498e5cfb5c7b071035d7ca12617e68ed6a925c610c6921400b2513"

  };

  wp = new wepay(wepay_settings);
  wp.use_staging();

  wp.call('/account/create', {
      "name": "WonderWe",
      "description": "Recive wondewe donations",
      "reference_id": "WE333",
      "country": "US",
      "currencies": [
        "USD"
      ]
    },
    function(response) {

      res.send(response);

    });
});



donationsRouter.post('/user/send_confirmation', function(req, res, next) {
  var wepay_settings = {
    'client_id': props.client_id,
    'client_secret': props.client_secret,
    //   "access_token": "STAGE_29b328ff7e498e5cfb5c7b071035d7ca12617e68ed6a925c610c6921400b2513"
  };
  wp = new wepay(wepay_settings);
  wp.use_production();

  wp.call('/user/send_confirmation/', {
      "email_message": "Welcome to my <strong>WonderWe Application</strong>"
    },
    function(response) {

      res.send(response);

    });
});


donationsRouter.post('/subscription_plan/create', function(req, res, next) {


  /*{
     "account_id":54321,
     "name":"WeGym Bronze Plan Membership",
     "amount":50,
     "currency":"USD",
     "period":"monthly",
     "app_fee":5,
     "callback_uri":"http://example.com/callback/status/1531",
     "trial_length":"2",
     "setup_fee":5,
     "reference_id":"cba123"
  }
  */


  var wepay_settings = {
    'account_id': 1962809409,
    'client_id': props.client_id,
    'client_secret': props.client_secret,
    "access_token": "STAGE_29b328ff7e498e5cfb5c7b071035d7ca12617e68ed6a925c610c6921400b2513"

  };

  wp = new wepay(wepay_settings);
  wp.use_staging();

  wp.call('/subscription_plan/create', {
      "account_id": 1962809409,
      "name": "MonthlyPlan",
      "short_description": "monthly subscription is on live",
      "amount": 50,
      "currency": "USD",
      "period": "monthly",
      "app_fee": (50 * 0.03),
      "reference_id": "WE333"
    },
    function(response) {

      res.send(response);

    });
});



//missedWepayUserRegister

donationsRouter.post('/miss/claimed/user/register', function(req, res, next) {

  var userObject = {
    id: req.body.id
  };
  userObject.original_ip = req.ip;
  userObject.original_device = req.hostname;
  //onetimeDonations

  async.series({
    validation: function(callback) {
      validationController.wepayUserRegister(userObject, callback);
    },
    data: function(callback) {
      donationServices.missedWepayUserRegister(userObject, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "wepayUserRegister in validationController from donations route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "wepayUserRegister in donationServices from donations route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "claimed user register, done, In donations route"]);
      utility.dataHandler(result, res);
    }
  });

});

donationsRouter.post('/update/donor/card', function(req, res, next) {

  var obj = req.body;
  async.series({
    /*   validation : function(callback) {
         validationController.wepayUserRegister({id:id}, callback);
       },*/
    data: function(callback) {
      donationServices.updateDonorCardData(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.log('error', "updateDonorSubscription in donationServices from donations route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "donor subscription update, done, In donations route"]);
      utility.dataHandler(result, res);
    }
  });
});

donationsRouter.post('/update/donor/stripe/card', function(req, res, next) {
  var obj = req.body;
  async.series({
    /*   validation : function(callback) {
         validationController.wepayUserRegister({id:id}, callback);
       },*/
    data: function(callback) {
      donationServices.updateDonorStripeCardData(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.log('error', "updateDonorSubscription in donationServices from donations route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "donor subscription update, done, In donations route"]);
      utility.dataHandler(result, res);
    }
  });
});
//updating user detatils
donationsRouter.post('/updateuser', function(req, res, next) {
  var userObj = req.body;
  async.series({
    data: function(callback) {
      donationServices.updateUserAddress(userObj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      utility.dataHandler(result, res);
    }
  });

});

donationsRouter.post('/get/profile/byemail', function(req, res) {
  var obj = req.body;
  donationServices.gettingUserAddress(obj.email, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, res);
    } else {
      utility.dataHandler({
        data: result
      }, res);
    }
  });
});

//donation prising modal limits
donationsRouter.post('/get/prising/limits', function(req, res) {
  var obj = req.body;
  
  console.log(obj);
  donationServices.getPrisingModals(obj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, res);
    } else {
      utility.dataHandler({
        data: result
      }, res);
    }
  })
})

module.exports = donationsRouter;
