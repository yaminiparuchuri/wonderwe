var express = require('express');
var authRouter = express.Router();
var authServices = require('../services/auth');
var charityService = require('../services/charity');
var pageRouter = require('./pages');
var dripCampaign = require('../services/drip-campaign');

/*authRouter.use('/!*', function(req, res, next) {
 res.status(200);
 setDevHeaders(res);
 next();

 });*/
/**
 * @api {post} /auth/register/ Request User creation
 * @apiName User creation
 * @apiGroup Auth
 * @apiParamExample {json} Request-Example:
 *     {
 *"email": "narendar@gmail.com",
 *"firstname": "narendar",
 *"lastname": "nath",
 *"password": "narendra1$"
 *}
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": {
 *       "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOjM5MCwiZXhwIjoxNDMwNzM5NDc2OTc2fQ.npCxRJNADwWBnX-mKXWblkEwRZIhDU3iU2TMVYf05Fc",
 *       "expires": 1
 *   }
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *{
 *   "status": "error",
 *   "error": {
 *       "error": "User already exists!",
 *       "location": "userRegistration....routes/auth.js ,narendar@gmail.com"
 *   }
 *}
 */
authRouter.post('/register', function(req, res, next) {
  var userObject = req.body;
  var logsObj = req.logsObj;
  var visitedUserToken = (req.body && req.body.visitedUser) || (req.query && req.query.visitedUser) || req.headers['visiteduser'];
  async.series({
    validation: function(callback) {
      validationController.userRegistration(userObject, callback);
    },
    data: function(callback) {
      authServices.userRegistration(userObject, visitedUserToken, callback);
    }
  }, function(err, result) {
    if (err) {

      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data

      if (userObject && !userObject.addressExists) {
        authServices.updateProfileAddress(userObject, function(err, profileAddressResult) {
          if (err) {
            utility.newAppErrorHandler(new Error(JSON.stringify({ errors: ['USER_PROFILE_ADDRESS_ERROR'], status: 400 })), logsObj, res);
          } else {
            console.log(result);

            utility.dataHandler(result, res);
            utility.devMetrics('userEvent', req.body.email, [req.originalUrl, "signed up, done, In auth route"]);
          }
        });
      } else {
        utility.dataHandler(result, res);
        utility.devMetrics('userEvent', req.body.email, [req.originalUrl, "signed up, done, In auth route"]);
      }
    }
  });
});
authRouter.post('/campaign/register', function(req, res, next) {
  var userObject = req.body;
  var logsObj = req.logsObj;
  var visitedUserToken = (req.body && req.body.visitedUser) || (req.query && req.query.visitedUser) || req.headers['visiteduser'];
  async.series({
    validation: function(callback) {
      validationController.userRegistration(userObject, callback);
    },
    data: function(callback) {
      authServices.registerUserOnly(userObject, visitedUserToken, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      authServices.updateProfileAddress(userObject, function(err, profileAddressResult) {
        if (err) {
          utility.newAppErrorHandler(new Error(JSON.stringify({ errors: ['USER_PROFILE_ADDRESS_ERROR'], status: 400 })), logsObj, res);
        } else {
          console.log(result);

          utility.dataHandler(result, res);
          utility.devMetrics('userEvent', req.body.email, [req.originalUrl, "signed up, done, In auth route"]);
        }
      });
    }
  });
});
/**
 * @api {post} /auth/login/ User Login
 * @apiName User Login
 * @apiGroup Auth
 * @apiParamExample  Request-Example:
 *
 *       "email" : "dominic@quartermastermarketing.com",
 *         "password": "freedom333"
 *
 *
 * @apiVersion 0.0.1
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *    "status": "success",
 *    "data": {
 *        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0MzAyMTQ3MzI1Mzd9.wgmvyUN4hRAEcQxAcqVs-LSae3Sr7au13mUTj8EA1Bw",
 *        "expires": 1
 *    }
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *    {
 *    "status": "error",
 *    "error": {
 *        "error": "Username and Password mismatch."
 *    }
 *}
 */
authRouter.post('/login', function(req, res, next) {
  var userObject = req.body;
  var logsObj = req.logsObj;
  var visitedUserToken = (req.body && req.body.visitedUser) || (req.query && req.query.visitedUser) || req.headers['visiteduser']

  async.series({
    validation: function(callback) {
      validationController.login(userObject, callback);
    },
    data: function(callback) {
      authServices.userLogin(userObject, visitedUserToken, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data

      utility.dataHandler(result, res);
    }

  });
});


authRouter.post('/login/get/charity', function(req, res) {

});

/**
 * @api {post} /auth/donor/default/login User Login
 * @apiName User Login
 * @apiGroup Auth
 * @apiParamExample  Request-Example:
 *
 *     "userid" : 3
 *
 *
 * @apiVersion 0.0.1
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *   "status": "success",
 *   "data": {
 *       "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0MzAyMTQ3MzI1Mzd9.wgmvyUN4hRAEcQxAcqVs-LSae3Sr7au13mUTj8EA1Bw",
 *        "expires": 1
 *    }
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 * {
 *    "status": "error",
 *    "error": {
 *        "error": "Username and Password mismatch.",
 *        "location": "userLogin....routes/auth.js ,"
 *    }
 *}
 */



authRouter.post('/donor/default/login', function(req, res, next) {
  var userObject = req.body;
  var logsObj = req.logsObj;

  var visitedUserToken = (req.body && req.body.visitedUser) || (req.query && req.query.visitedUser) || req.headers['visiteduser'];

  async.series({
    // validation : function(callback) {
    //  validationController.login(userObject, callback);
    // },
    data: function(callback) {
      authServices.donorDefaultLogin(userObject, visitedUserToken, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data

      utility.dataHandler(result, res);
    }

  });
});
authRouter.get('/default/superadmin/:email', function(req, res, next) {
  var logsObj = req.logsObj;
  authServices.makuUserSuperAdmin(req.params.email, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data

      utility.dataHandler(result, res);
    }

  });
});

authRouter.get('/token/verify', function(req, res, next) {

  var logsObj = {};
  logsObj.userAgent = req.headers['user-agent'];
  logsObj.ip = req.ip;
  logsObj = req.logsObj;
  utility.tokenAuthVerify(req, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      console.log('in token verify');
      //console.log('Array:', JSON.stringify(result));
      if (result) {

        utility.getUserData(result, function(err, data) {
          console.log("in utilsnjsfnsdnfj");
          // console.log(data);
          if (err) {
            utility.newAppErrorHandler(err, logsObj, res);
          } else {
            obj.data = {};
            obj.data.user = data;
            utility.dataHandler(obj, res);
            logsObj.userData = obj.data.user;
            logsObj.message = "User successfully logged in - Auth controller verify API"
            utility.nodeLogs('INFO', logsObj);

          }
        });

        /* obj.data = {};
         obj.data.user = result[0];
         charityService.getCharityData(result[0].user_id, function(err, charityResult) {
           if (err) {
             utility.log('error', "getCharityData in charity services from auth route - " + result[0].user_id);
             err.type = "login";
             utility.appErrorHandler(err, res);
           } else {
             //TODO: Let's Decide What to do with Dev Metrics.
             obj.data.user.charities = charityResult;
             utility.dataHandler(obj, res);
             logsObj.userData = obj.data.user;
             logsObj.message = "User successfully logged in - Auth controller verify API"
             utility.nodeLogs('INFO', logsObj);
           }
         });*/
      } else {
        obj.data.user = {};
        utility.dataHandler(obj, res);
      }
    }
  });
});

authRouter.get('/account/activation/:`', function(req, res, next) {
  //TODO: This Code has to be Fixed for Link Expiration and Need to Render a Server Page Instead of Sending JSON With this
  var user = {};
  var logsObj = req.logsObj;
  user.verification_key = req.params.verification_key;
  if (req.query.referral_id) {
    var referralid = req.query.referral_id;
  } else {
    var referralid = "";
  }
  async.series({
    validation: function(callback) {
      validationController.validateVerificationKey(user, callback);
    },
    data: function(callback) {
      authServices.accountActivation(user.verification_key, referralid, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      //dataHandler(result, res);
      //Redirecting to Page Instead of sending to Data Handler
      utility.devMetrics('userEvent', user.verification_key, [req.originalUrl, "Account activation done with verification_key, done, In auth route"]);


      var userDevice = device(req.headers['user-agent']);
      var userDeviceIsPhone = userDevice.is('phone');
      if (userDeviceIsPhone) {
        res.redirect(props.mobileredirect + '/auth/account/activation/' + user.verification_key);
      } else {
        res.set('Cache-Control', 'no-cache');
        res.render("pages/activationpage", result.data);
      }
    }
  });
});

/**
 * @api {get} /auth/resetPassword/:email Reset Password
 * @apiName Reset pasword
 * @apiGroup Auth
 * @apiParamExample {json} Request-Example:
 *     {
 *       "userId": 53042
 *       "charityId": 4711
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *"status": "success",
 *"data": {
 *"message": "250 2.0.0 Ok: queued as 62BF72A00D7",
 *"messageId": "b7644135276499d3a034110fae810a@scriptbees"
 *}
 *}
 *
 *
 */

authRouter.get('/resetpassword/:email', function(req, res, next) {
  console.log("password");
  var email = req.params.email;
  var setPassword = req.query.setPassword;

  var obj = {};
  obj.email = email;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.checkEmailValidate(obj, callback);
    },
    data: function(callback) {
      authServices.verifyemailExists(email, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          //Inserted for mandrill password rest template
          var finalobjectmandril = {};
          finalobjectmandril.email = result[0].email;
          finalobjectmandril.from = props.fromemail;
          finalobjectmandril.text = "Hai/Hello";
          console.log(setPassword);
          if(setPassword=="yes"){
            finalobjectmandril.subject = 'Set password';
            finalobjectmandril.template_name = "set password";
          }else{
            finalobjectmandril.subject = 'Password reset';
            finalobjectmandril.template_name = "Password Reset";
          }
          finalobjectmandril.template_content = [{
            "name": "email",
            "content": "*|EMAIL|*"
          }, {
            "name": "resetlink",
            "content": "*|RESETLINK|*"
          }];
          finalobjectmandril.merge_vars = [{
            "name": "EMAIL",
            "content": result[0].name
          }, {
            "name": "RESETLINK",
            "content": props.domain + "/pages/resetpassword/" + result[0].id
          }];


          utility.mandrillTemplate(finalobjectmandril, function(err, data) {
            if (err) {
              callback(new Error(err), null);
            } else {
              var obj = {};
              obj.data = data;
              // utility.dataHandler(obj, res);
              callback(null, obj);
            }
          });
        }
      });
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      utility.dataHandler(result, res);
    }

  });

});

/**
 * @api {get} /auth/auto/activate/:email Activate Email
 * @apiName Activate Email
 * @apiGroup Auth
 * @apiParamExample {json} Request-Example:
 *
 *    {
 *
 *         "email" : "narendar@gmail.com"
 *    }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        "status": "success"
 *     }
 *
 *
 */

authRouter.get('/auto/activate/:email', function(req, res, next) {
  var email = req.params.email;
  var logsObj = req.logsObj;
  excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [email], function(err, data) {
    if (err) {
      utility.newAppErrorHandler(new Error(err), logsObj, res);
    } else {
      if (data && data.length > 0) {
        if (data[data.length-1].active == 'yes') {
          utility.devMetrics('userEvent', email, [req.originalUrl, "auto account activated,done"]);
          utility.dataHandler('yes', res);
          //utility.dataHandler('yes', res);
          //res.redirect(props.domainname);
          //res.send("Your account has already been activated, Please login");
        } else {
          data.active = 'yes';
          excuteQuery.queryForAll(sqlQueryMap['directactivation'], [moment.utc().toDate(), 'yes', email], function(err, data) {
            if (err) {
              utility.newAppErrorHandler(new Error(err), logsObj, res);
            } else {
              //data.url = props.domainname;
              //res.render("./pages/activationpage", data);

              utility.dataHandler(data, res);
            }
          });
        }
      } else {
        utility.dataHandler(null, res);
      }
    }
  });
});

authRouter.get('/all/notifications/:entity_id/:skip', function(req, res, next) {
  var entity_id = req.params.entity_id;
  var skip = parseInt(req.params.skip);
  var logsObj = req.logsObj;
  excuteQuery.queryForAll(sqlQueryMap['getnotifications'], [entity_id, skip], function(err, results) {
    if (err) {
      utility.newAppErrorHandler(new Error(err), logsObj, res);
    } else {
      var obj = {};
      obj.data = results
      utility.dataHandler(obj, res);
    }
  });
});

authRouter.get('/notifications/:entity_id', function(req, res, next) {
  var entity_id = req.params.entity_id;
  var logsObj = req.logsObj;
  excuteQuery.queryForAll(sqlQueryMap['getNotificationsCount'], [entity_id], function(err, results) {
    if (err) {
      utility.newAppErrorHandler(new Error(err), logsObj, res);
    } else {
      var obj = {};
      obj.data = results[0]
      utility.dataHandler(obj, res);
    }
  });
});

authRouter.get('/remove/notifications/count/:entity_id', function(req, res, next) {
  var entity_id = req.params.entity_id;
  var logsObj = req.logsObj;
  excuteQuery.queryForAll(sqlQueryMap['resetNotificationsCount'], [entity_id], function(err, results) {
    if (err) {
      utility.newAppErrorHandler(new Error(err), logsObj, res);
    } else {
      var obj = {};
      obj.data = results;
      utility.dataHandler(obj, res);
    }
  });
});


/*authRouter.get('/send/activate/:userid/:email', function(req, res) {

  var value = "";
  var sqlQuery = "";

  if (req.params.email) {
    sqlQuery = "select * from user_tbl where email =?";
    value = req.params.email;
  } else {
    sqlQuery = "select * from user_tbl where id =?";
    value = req.params.userid;
  }

  pool.query(sqlQuery, [value], function(err, userResult) {
    if (err) {
      res.send(err);
    } else {
      //  var userObj = userResult[0];
      //   var user_id = userResult[0].id;
      authServices.sendActivationEmail(userResult[0], userResult[0].id, "", function(err, result) {
        res.send({
          'msg': 'Email send successfully...'
        });
      });
    }

  });
});*/

authRouter.get('/resend/activation/link/:email', function(req, res, next) {
  var email = req.params.email;
  var logsObj = req.logsObj;
  authServices.resendActivationEmail(email, function(err, userData) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data

      var obj = {};
      obj.data = 'Activation link has been sent, please check your email and activate.';
      utility.dataHandler(obj, res);
    }
  });
});

authRouter.post('/mobile/device/token/register/:token/:userid/:type', function(req, res, next) {
  var devicetoken = req.params.token;
  var userid = req.params.userid;
  var type = req.params.type;
  var logsObj = req.logsObj;
  authServices.insertUserDeviceToken(devicetoken, userid, type, function(err, userData) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data

      utility.dataHandler(null, res);
    }
  });
});

authRouter.delete('/mobile/device/token/unregister/:token/:userid', function(req, res, next) {

  var devicetoken = req.params.token;
  var userid = req.params.userid;
  var logsObj = req.logsObj;
  //need to write call
  authServices.deleteDeviceToken(userid, devicetoken, function(err, userData) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.dataHandler(null, res);
    }
  });
});

authRouter.get('/social/:strategy', function(req, res, next) {
  var id = uuid.v4();
  var logsObj = req.logsObj;
  var visitedUserToken = req.query.visitedUser;
  var address = {};
  var callbackUrl;
  address.state_name = req.query.state_name;
  address.country_id = req.query.country_id;
  address.postal_code = req.query.postal_code;
  address.city = req.query.city;


  var redisInfo = {
    redirect_url: req.query.redirect_url,
    visitedUserToken: visitedUserToken,
    address: address,
    teamid:req.query.teamid,
    userid:req.query.userid
  };

  callbackUrl = props.domain + '/auth/social/' + req.params.strategy + '/callback?uid=' + id;

  if(req.query.app === 'mobile'){
    callbackUrl += '&app=mobile';
  }

  redisClient.get(visitedUserToken, function(err, redisData) {
    if (redisData) {
      redisData = JSON.parse(redisData);
      redisInfo.outsideUserSlug = redisData.outsideUserSlug;
      redisInfo = JSON.stringify(redisInfo);

    } else {
      redisInfo = JSON.stringify(redisInfo);
    }
    redisClient.set(id, redisInfo, function(err, result) {
      if (err) {
        console.log(err);
      } else {
        if(req.params.strategy === 'facebook'){
          passport.authenticate('facebook', {
            callbackURL: callbackUrl,
            authType: 'rerequest',
            scope: ['email', 'user_friends', 'user_about_me', 'manage_pages']
          })(req, res, next);
        }

        if(req.params.strategy === 'google'){
            passport.authenticate('google', {state:id, scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.profile','https://www.googleapis.com/auth/userinfo.email'] })(req,res,next);
        }

      }
    });
  });


});

//1. Not getting email
//2. Failure redirect
//3.
authRouter.get('/social/:strategy/callback', function(req, res, next) {

  
  var result;
  var userRole;
  var logindonorid;
  var callbackUrl = props.domain + '/auth/social/' + req.params.strategy + '/callback?uid=' + req.query.uid


  if(req.query.app==='mobile'){
    callbackUrl += '&app=mobile';
  }


  if(req.params.strategy === 'facebook'){
    passport.authenticate(req.params.strategy, {
      failureRedirect: '/login',
      authtype: 'rerequest',
      callbackURL: callbackUrl,
      scope: ['email', 'user_friends', 'user_about_me', 'manage_pages']
    })(req, res, next);
  }

  if(req.params.strategy === 'google'){
     passport.authenticate(req.params.strategy,{
      failureRedirect: '/login' 
     })(req,res,next);
  }
}, function(req, res, next) {
  var app_type = req.query.app;
  var uid = req.query.uid;

  if(req.params.strategy === 'google'){
    uid = req.query.state;
  }
  
  if(req.params.strategy === 'google'){
    req.user._json.email = req.user._json.emails[0].value;
    req.user.access_token = req.user.etag;
  }

  req.user._json = getGeneraicUser(req.params.strategy,req.user._json);
  redisClient.get(uid, function(err, redisInfo) {
    if (err) {
      utility.log('error', " Error in login with facebook " + req.user._json);
      res.redirect('/a?error=Error in login with facebook');
    } else if (redisInfo) {
      redisInfo = JSON.parse(redisInfo);

      var redirect_url = redisInfo.redirect_url;

      async.waterfall([
        function(callback) {
          if (req.user._json.email) {
            authServices.checkUserByEmail(req.user._json.email, callback);
          } else {
            callback('No email', null);
          }

        },
        function(user, callback) {
          if (user) {
            console.log(user);
            user.access_token = req.user.access_token;
            logindonorid = user.id;
            user.address = redisInfo.address;
            authServices.saveProviderToken(user, req.user._json, redisInfo.visitedUserToken, callback);

          } else {

            user = req.user._json;
            user.address = redisInfo.address;
            user.provider_access_token = req.user.access_token;
            user.provider = req.params.strategy;
            logindonorid = user.id;
            authServices.createSocialUser(user, redisInfo.visitedUserToken, callback);
            //        callback(null,null);
          }
        }
      ], function(err, result) {
        if (err) {
          if (err === 'No email') {
            utility.log('error', " Email not getting from the facebook with user :" + JSON.stringify(req.user._json));
            console.log('before render');
            res.render('pages/500.hbs', { error: "Your facebook account privacy settings not allowing to get email address ." });
          } else {
            utility.log('error', " Error in login with facebook " + req.user._json);
            utility.appErrorHandler(err, res);
          }
        } else {
          if (redirect_url.indexOf('#') >= 0) {
            redirect_url = redirect_url.split('#');
            redirect_url[0] += '?provider=' + req.params.strategy;
            redirect_url = redirect_url.join('#');
          } else {
            if (redirect_url === props.domain + '/login/' || redirect_url === props.domain + '/signup/') {
              if (result.switch) {

                if (redisInfo.outsideUserSlug) {
                  redirect_url = props.domain + '/' + redisInfo.outsideUserSlug;
                  redirect_url += '?provider=' + req.params.strategy;
                } else if(redisInfo.teamid){
                  redirect_url=props.domain+"/member/#!teampeer/create&teamid=" + redisInfo.teamid + "&userid=" + redisInfo.userid
                }else {
                  redirect_url = props.domain + '#!switch'
                  redirect_url += '?provider=' + req.params.strategy;
                }

              } else {
                console.log(redisInfo);
                /*redisClient.get(result.token, function(err, redisResult) {
                  console.log('Redis temp data');
                  console.log(redisResult);*/
                if (redisInfo.outsideUserSlug) {
                  redirect_url = props.domain + '/' + redisInfo.outsideUserSlug;
                  redirect_url += '?provider=' + req.params.strategy;
                }else if(redisInfo.teamid){
                  redirect_url=props.domain+"/member/#!teampeer/create&teamid=" + redisInfo.teamid + "&userid=" + redisInfo.userid
                }
                 else {
                  redirect_url = props.domain + '/member/#!manage/fundraisers';
                  redirect_url += '?provider=' + req.params.strategy;
                }
                //})
              }
            } else if(redisInfo.teamid){
              redirect_url=props.domain+"/member/#!teampeer/create&teamid=" + redisInfo.teamid + "&userid=" + redisInfo.userid
            }else {
              if (redirect_url.split('?').length > 1) {
                redirect_url += '&provider=' + req.params.strategy;
              } else {
                redirect_url += '?provider=' + req.params.strategy;
              }
            }
          }

          if(app_type === 'mobile'){
            redirect_url +='&token='+result.token;
            console.log('In the mobile');
            res.redirect(redirect_url);
          }else{
            res.cookie('token', result.token).redirect(redirect_url);
          }

        }
      });
    } else {
      res.redirect(props.domain + '/a');
    }
  });
  //res.redirect(props.domain+'/profilemiss');
});


authRouter.post('/get/intercom/users', function(req, res) {
  console.log('Before going to admin details');
  dripCampaign.sendThankYouEmail(req.body, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      console.log('In the result');
      utility.dataHandler({ data: result }, res);
    }
  });
});

function getGeneraicUser(strategy,user){

  if(strategy === 'google'){
    user.name = user.displayName;
    user.bio = user.aboutMe;
    user.picture = {
      data:{
        url:user.image.url
      }
    };

    user.first_name = user.name.split(' ')[0] || user.name;
    user.last_name = user.name.split(' ')[1] || '';
  }

  return user;
}
module.exports = authRouter;
