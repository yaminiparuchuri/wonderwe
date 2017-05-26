var express = require('express');
var stripeRouter = express.Router();

var stipeService = require('../services/stripe.js');
var followerService = require('../services/follower.js');
var codeService = require('../services/code');

var TOKEN_URI = 'https://connect.stripe.com/oauth/token';
var AUTHORIZE_URI = 'https://connect.stripe.com/oauth/authorize';

stripeRouter.get('/authorize', function(req, res) {

  res.redirect(AUTHORIZE_URI + '?' + qs.stringify({
    response_type: 'code',
    scope: 'read_write',
    client_id: props.stripe_client_id
  }));

});

// OAuth call back

stripeRouter.get('/oauth/callback', function(req, res) {

  var responseObj = req.query;
  var redirectState = responseObj.state;
  stipeService.stripeOAuth(responseObj, function(err, result) {
    var splitArray = redirectState.split('-');
    if (splitArray[2]) {
      var code_id = splitArray[2];
    }
    if (err) {
      utility.log('error', "Stripe Autherization error");
      if (code_id) {
        var obj = {};
        obj.status = 'error';
        obj.code_id = code_id;
        obj.error = err;
        utility.createRedisCodeData(obj, function(err, redisToken) {
          console.log('Error token data');
          console.log(err);
          console.log(redisToken);
          if (splitArray[1] === 'donor') {
            res.redirect('/member/#!settings/withdrawls');
          } else {
            res.redirect('/a/#!settings/withdrawls');
          }
        });
        //res.redirect('/start/#!step/processor?data=' + JSON.stringify(obj));
      } else {
        if (splitArray[1] === 'donor') {
          res.redirect('/member/#!settings/withdrawls');
        } else {
          res.redirect('/a/#!settings/withdrawls');
        }
      }
    } else {
      if (code_id) {
        result.status = 'success';
        utility.createRedisCodeData(result, function(err, redisToken) {
          console.log('Success token data');
          console.log(err);
          console.log(redisToken);
          if (splitArray[1] === 'donor') {
            res.redirect('/member/#!settings/withdrawls');
          } else {
            res.redirect('/a/#!settings/withdrawls');
          }
        });
      } else {
        if (splitArray[1] === 'donor') {
          if (splitArray[2]) {
            codeService.updateCodeStatus(splitArray[2], function(err, data) {});
          }
          res.redirect('/member/#!settings/withdrawls');
        } else {
          console.log('In the last option');
          res.redirect('/a/#!settings/withdrawls');
        }
      }
    }
  });
});

stripeRouter.post('/onetime/donation', function(req, res) {

  var obj = req.body;
  obj.ip = req.ip;

  var logsObj = req.logsObj;
  var createdDate = moment().toDate();
      obj.created_date = moment(createdDate).format('YYYY-MM-DD HH:mm:ss');

  stipeService.stripeOneTimeCharge(obj, logsObj, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var result = {
        data: data
      };
      obj.date_followed = moment.utc().toDate();
      utility.dataHandler(result, res);
      //res.send(result);
      if (obj.team == 'no'&&obj.code_id) {
        followerService.createFollowCode(obj, function(err, result1) {});
      }
      if(obj.charity_id&&!obj.code_id){
        followerService.charityFollow(obj,function(err ,result2){});
      }
      logsObj.message = "Stripe One time donation done well with new card";
      logsObj.action = "Stripe One time donation done successflly with new card -- code Router : 96";
      utility.nodeLogs('INFO', logsObj);

    }
  });
});

stripeRouter.post('/existing/card/donation', function(req, res) {

  var obj = req.body;
  obj.ip = req.ip;

  var logsObj = req.logsObj;
  var createdDate = moment().toDate();
      obj.created_date = moment(createdDate).format('YYYY-MM-DD HH:mm:ss');
  stipeService.stripeExistingCardPayment(obj, logsObj, function(err, data) {
    if (err) {
      console.log(err);
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      var result = {
        data: data
      };

      obj.date_followed = moment.utc().toDate();
      utility.dataHandler(result, res);
      if (obj.team == 'no'&&obj.code_id) {
        followerService.createFollowCode(obj, function(err, result1) {});
      }
      if(obj.charity_id&&!obj.code_id){
       followerService.charityFollow(obj,function(err ,result2){});
     }

      logsObj.message = "Stripe One time donation done well with existing card";
      logsObj.action = "Stripe One time donation done successflly with existing card -- code Router : 96";
      utility.nodeLogs('INFO', logsObj);

      //res.send(result);
    }
  });
});

// To create a change for donor

stripeRouter.post('/monthly/subscription', function(req, res) {

  var obj = req.body;
  obj.ip = req.ip;
  var logsObj = req.logsObj;

  if (obj.existing_card === true) {
    var createdDate = moment().toDate();
      obj.created_date = moment(createdDate).format('YYYY-MM-DD HH:mm:ss');
    stipeService.existingCardMonthlySubscription(obj, function(err, result) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);

      } else {

        var result2 = {
          data: result
        };
        obj.date_followed = moment.utc().toDate();        
        utility.dataHandler(result2, res);
        if(obj.team == 'no' && obj.code_id){
        followerService.createFollowCode(obj, function(err, result1) {});
      }
         if(obj.charity_id&&!obj.code_id){
        followerService.charityFollow(obj,function(err ,result2){});
      }
        //  res.redirect('/a/#!settings/wepay');
        //res.send(result);
      }
    });

  } else {
    var createdDate = moment().toDate();
      obj.created_date = moment(createdDate).format('YYYY-MM-DD HH:mm:ss');
    stipeService.stripeMonthlySubscription(obj, function(err, result) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        var result2 = {
          data: result
        };
        obj.date_followed = moment().toDate();        
        utility.dataHandler(result2, res);
        followerService.createFollowCode(obj, function(err, result1) {});
         if(obj.charity_id&&!obj.code_id){
        followerService.charityFollow(obj,function(err ,result2){});
      }
        //  res.redirect('/a/#!settings/wepay');
        //res.send(result);
      }
    });
  }
});


stripeRouter.post('/save/new/card', function(req, res) {

  var obj = req.body;

  stipeService.saveNewCard(obj, function(err, result) {
    if (err) {
      utility.log('error', "Stripe Autherization error");

      var resObj = {
        status: 'error',
        error: err
      };
      res.send(resObj);
      //utility.appErrorHandler(err, res);
    } else {

      var result2 = {
        data: result
      };
      utility.dataHandler(result2, res);
      //  res.redirect('/a/#!settings/wepay');
      //res.send(result);
    }
  });
});


stripeRouter.post('/update/subscription', function(req, res) {

  var obj = req.body;

  stipeService.updateStripeSubscription(obj, function(err, result) {
    if (err) {
      utility.log('error', "Stripe Autherization error");

      var resObj = {
        status: 'error',
        error: err
      };
      res.send(resObj);

      // utility.appErrorHandler(err, res);
    } else {

      var result2 = {
        data: result
      };
      utility.dataHandler(result2, res);
      //  res.redirect('/a/#!settings/wepay');
      //res.send(result);
    }
  });
});

stripeRouter.post('/cancel/subscription', function(req, res) {

  var obj = req.body;

  stipeService.cancelStripeSubscription(obj, function(err, result) {
    if (err) {
      utility.log('error', "Stripe Autherization error");

      var resObj = {
        status: 'error',
        error: err
      };
      res.send(resObj);
      //  utility.appErrorHandler(err, res);
    } else {

      var result2 = {
        data: result
      };
      utility.dataHandler(result2, res);
      //  res.redirect('/a/#!settings/wepay');
      //res.send(result);
    }
  });
});

stripeRouter.post('/update/manage/account', function(req, res) {

  var data = req.body;
  console.log('came to request');
  data.tos_acceptance = {
    date: moment().utc().unix(),
    ip: req.ip
  }
  stipeService.updateManageAccount(data, function(err, result) {
    if (err) {
      var logsObj = {
        messge: 'Validation error in updating stripe managed account',
        data: {
          user_id: data.user_id,
          data: JSON.stringify(data)
        }
      };
      utility.newAppErrorHandler(err, {}, res);
    } else {
      utility.dataHandler({
        success: true,
        data: result
      }, res);
    }
  });
});

stripeRouter.post('/get/account', function(req, res) {
  var data = req.body;

  stipeService.getStripeAccountDetails(data, function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', { message: 'Error in getting stirpe account details' });
      utility.appErrorHandler({ error: err, message: 'Error in getting stripe account' }, res);
    } else {
      utility.dataHandler({
        success: true,
        data: result
      }, res);
    }
  });
});

stripeRouter.post('/get/bank/account', function(req, res) {
  var data = req.body;
  stipeService.getStripeAccount(data, function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', { message: 'Error in getting stirpe account details' });
      utility.appErrorHandler({ error: err, message: 'Error in getting stripe account' }, res);
    } else {
      utility.dataHandler({
        success: true,
        data: result
      }, res);
    }
  });
});


stripeRouter.post('/transfor/to/account', function(req, res) {
  var data = req.body;

  stipeService.transforAmountToAccount(data, function(err, result) {
    if (err) {
      console.log(err);
      utility.appErrorHandler(new Error(JSON.stringify({
        errors: ['Something blow up'],
        status: 400
      })), res);
    } else {
      utility.dataHandler({
        success: true,
        data: result
      }, res);
    }
  });
});

stripeRouter.post('/file/upload', function(req, res) {
  console.log(req.files);
  var file = req.files.qqfile;
  var data = req.body;

  stipeService.stripeFileUpload(file, data, function(err, result) {

    console.log(err);
    console.log(result);

    if (err) {
      utility.nodeLogs('ERROR', { message: 'Error in uploading file ' });
      utility.appErrorHandler(new Error(JSON.stringify({
        errors: ['Error in uploading file'],
        status: 400
      })), res);
    } else {
      console.log(result);
      result.success = true;
      res.send(result);
    }
  })
});

module.exports = stripeRouter;
