var express = require('express');
var settingsRouter = express.Router();
var settingsService = require('../services/settings');
var donorService = require('../services/donors');
var wepayService = require('../services/wepay');

settingsRouter.use('/*', function(req, res, next) {
  var logsObj = req.logsObj;

  utility.log('info', "In Settings Router");
  utility.tokenAuth(req, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      if (result) {
        next();
      } else {
        utility.appErrorHandler({
          "error": "token problem"
        }, res);
      }
    }
  });
});

/**
 * @api {get} /settings/:userId Get Charity admin profile
 * @apiName  Charity admin profile
 * @apiGroup Settings
 * @apiParamExample {json} Request-Example:
 *     {
 *       "user_id": 3
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *   "status": "success",
 *   "data": [
 *       {
 *           "id": 18400,
 *           "date_created": "2014-01-24T04:04:11.000Z",
 *           "date_verified": "2014-01-24T04:04:11.000Z",
 *           "verification_key": "NRpEkCDvwXPy6MbEdm8uCQJ3y6DQCa0.38809100 1390577651",
 *           "password_salt": "jnoWi4XAFX7GqMiNvwpa",
 *           "email": "dominic@quartermastermarketing.com",
 *           "password": "c45637cf828284daec7d4af8ec195b18d16014bdac244369b92ca3e31e244ddb64efc02a736a822add71240df6790e42752b899db7188b464db0b36e57e8266c",
 *           "active": "yes",
 *           "name": "Dominic Ismert",
 *           "default_card_id": 3,
 *           "last_active_date": "2015-04-16T03:26:41.000Z",
 *           "facebook_id": null,
 *           "is_admin": 0,
 *           "user_id": 3,
 *           "birth_day": 22,
 *           "birth_month": 3,
 *           "birth_year": 1972,
 *           "address_1": "125 Main St",
 *           "address_2": "Another address test here",
 *           "city": "Kansas City",
 *           "state": "MO",
 *           "postal_code": "64108",
 *           "home_phone": "916 - 91",
 *           "cell_phone": "8169169213",
 *           "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/6ecc0e13-b879-4096-aade-0d7317e59364.jpeg",
 *           "profile_pic_thumb_url": "https://wonderwe.s3.amazonaws.com/150x150/profile/6ecc0e13-b879-4096-aade-0d7317e59364.jpeg",
 *           "about_me": "I am a person. As a person, I have skin and bones and eyes and stuff. These things hold me together while I walk and pretend that I know what I am doing. ",
 *           "allow_follows": "yes",
 *           "allow_public": "yes",
 *           "show_donations": "yes",
 *           "show_follows": "yes",
 *           "gender": "male",
 *           "relationship": "married",
 *           "religious_affiliation": null,
 *           "political": null,
 *           "income": null
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *     {
 *   "status": "error",
 *   "error": {
 *       "userId": [
 *          "User id is not a number"
 *       ],
 *       "flag": 400
 *   }
 *}
 */

// Used by settingsmodel.js as getProfileInfo for donor settings page
settingsRouter.get('/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.validateUserId({
        userId: userId
      }, callback);
    },
    data: function(callback) {

      settingsService.accountDetails(userId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }

  });
});

settingsRouter.put('/', function(req, res, next) {

});

settingsRouter.post('/', function(req, res, next) {

});

settingsRouter.get('/user/:userId', function(req, res, next) {

  var userId = req.params.userId;
  var logsObj = req.logsObj;
  async.series({

    validation: function(callback) {

      validationController.validateUserId({
        userId: userId
      }, callback);
    },

    data: function(callback) {

      settingsService.emailnotificationsUserId(userId, callback);

    }
  }, function(err, result) {

    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }
  });
});

/**
 * @api {get} /settings/user/:userId/email/:emailid Update email
 * @apiName  Update email
 * @apiGroup Settings
 * @apiParamExample {json} Request-Example:
 * {
 *   "emailid":"narendra@gmail.com",
 *   "userId":512
 * }
 *@apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *  {
 *     "status": "success",
 *      "data": 1
 *  }
 *@apiErrorExample {json} Error-Response:
 *  {
 *   "status": "error",
 *   "error": {
 *       "userId": [
 *           "User id is not a number"
 *       ],
 *       "flag": 400
 *   }
 *}
 */


settingsRouter.put('/user/:userId/email/:emailid', function(req, res, next) {

  var userId = req.params.userId;
  var emailid = req.params.emailid;
  var logsObj = req.logsObj;

  async.series({

    validation: function(callback) {

      validationController.validateUserIdAndEmailId({
        userId: userId,
        emailid: emailid
      }, callback);
    },

    data: function(callback) {

      settingsService.emailnotificationsUserIdput(emailid, userId, callback);

    }
  }, function(err, result) {

    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }

  });
});

settingsRouter.get('/orgname/:orgname', function(req, res, next) {
  var orgName = req.params.orgname;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.validateOrg({
        orgName: orgName
      }, callback);
    },
    data: function(callback) {
      settingsService.organizationsServices(orgName, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get orgname, done, In settings route"]);
      utility.dataHandler(result, res);
    }
  });
});

settingsRouter.get('/fetch/donor/:userid/preferences', function(req, res, next) {
  var userId = req.params.userid;
  var obj = {};
  obj.userid = userId;
  var logsObj = req.logsObj;
  // obj.campType="fundraiseCamp"
  // if (req.query.campType) obj.campType = req.query.campType;
  settingsService.getDonorWwCategories(obj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var data = {};
      data.data = result;
      utility.dataHandler(data, res);
    }
  });
});

settingsRouter.post('/donor/wwpreferences', function(req, res, next) {
  var preferenceObj = req.body;
  var logsObj = req.logsObj;
  if (preferenceObj.code_id) {
    settingsService.saveFundraisePreferences(preferenceObj, function(err, result) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        var obj = {};
        obj.data = result;
        utility.dataHandler(result, res);
      }
    });
  } else {
    settingsService.saveDonorPreferences(preferenceObj, function(err, result) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        var obj = {};
        obj.data = result;
        utility.dataHandler(obj, res);
      }
    });
  }
});
/**
 * @api {post} /settings/update/account/details Account creation
 * @apiName  Account creation
 * @apiGroup Settings
 * @apiParamExample Request-Example:
 *
 *
 *     "email":"dominic@quartermastermarketing.com",
 *     "name":"dominic",
 *     "cell":1234345213
 *
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *        "status": "success",
 *        "data": 1
 *      }
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *     {
 *    "status": "error",
 *   "error": {
 *       "Email can't be blank"
 *    ],
 *   "flag": 400
 *}
 *}
 */
//Donor profile Update Details
settingsRouter.post('/donor/update/account/details/save', function(req, res, next) {

  var accountDetails = req.body;
  var logsObj = req.logsObj;

  async.series({
    validation: function(callback) {
      validationController.accountDetailsValidate(accountDetails, callback);
    },
    data: function(callback) {
      settingsService.accountDetailsUpdate(accountDetails, callback);
    }
  }, function(err, result) {

    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }

  });
});

//This is for mobile app
settingsRouter.post('/donor/update/profile/save', function(req, res, next) {

  var accountDetails = req.body;
  var logsObj = req.logsObj;

  async.series({

    /* validation: function(callback) {

       validationController.accountDetailsValidate(accountDetails, callback);
     },*/

    data: function(callback) {

      settingsService.donorProfileDetailsUpdate(accountDetails, callback);

    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }

  });
});


settingsRouter.post('/validate/email', function(req, res, next) {
  //TODO:Validation of Parameter Charity ID
  //var codeId = req.body.code;
  var typeOfMode = req.body.type;
  var Obj = {
    email: req.body.email,
    typeOfMode: req.body.type,
    orgiginal: req.body.orgiginal
  };
  if(req.body.admin){
    Obj.admin=req.body.admin;
  }
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.emailValidation(Obj, callback);
    },
    data: function(callback) {
      settingsService.validationEmail(Obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "validate email, done, In settings route"]);
      utility.dataHandler(result, res);
    }
  });
});
/**
 * @api {post} /settings/password/reset Reset password
 * @apiName  Password reset
 * @apiGroup Settings
 * @apiParamExample  Request-Example:
 *
 *
 *  "currentPassword":"srinivas",
 *  "newPassword":"sriniv",
 *  "id":8
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": {
 *       "msg": "updated successfully"
 *   }
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *   {
 *   "status": "error",
 *   "error": {
 *       "id": [
 *           "Id is not a number"
 *       ],
 *       "flag": 400
 *   }
 *}
 */

settingsRouter.post('/password/reset', function(req, res, next) {
  var passwordUpdate = req.body;
  var logsObj = req.logsObj;
  async.series({

    validation: function(callback) {

      validationController.changePasswordValidate(passwordUpdate, callback);
    },

    data: function(callback) {
      settingsService.changePassword(passwordUpdate, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }

  });
});

/**
 * @api {post} /settings/email/check Email checking
 * @apiName  Email checking
 * @apiGroup Settings
 * @apiParamExample  Request-Example:
 *
 *   "email":"dominic@quartermastermarketing.com"
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *    "status": "success",
 *   "data": [
 *       {
 *           "id": 3,
 *           "date_created": "2014-01-24T04:04:11.000Z",
 *           "date_verified": "2014-01-24T04:04:11.000Z",
 *           "verification_key": "NRpEkCDvwXPy6MbEdm8uCQJ3y6DQCa0.38809100 1390577651",
 *           "password_salt": "jnoWi4XAFX7GqMiNvwpa",
 *           "email": "dominic@quartermastermarketing.com",
 *           "password": "c45637cf828284daec7d4af8ec195b18d16014bdac244369b92ca3e31e244ddb64efc02a736a822add71240df6790e42752b899db7188b464db0b36e57e8266c",
 *           "active": "yes",
 *           "name": "Dominic Ismert",
 *           "default_card_id": 3,
 *           "last_active_date": "2015-04-16T03:26:41.000Z",
 *           "facebook_id": null,
 *           "is_admin": 0
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *    {
 *   "status": "error",
 *   "error": {
 *       "email": [
 *           "Email should be an email"
 *       ],
 *       "flag": 400
 *   }
 *}
 */

settingsRouter.post('/email/check', function(req, res, next) {

  var passwordUpdate = req.body;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.checkEmailValidate(passwordUpdate, callback);
    },
    data: function(callback) {
      settingsService.checkEmail(passwordUpdate, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }
  });
});


//adding default user
settingsRouter.put('/defaultuser/:userID', function(req, res, next) {

  var user_id = req.params.userID;
  var id = req.query.id;
  var charityid = req.query.charityid;
  var logsObj = req.logsObj;
  async.series({
    data: function(callback) {
      settingsService.defaultusrupdate(user_id, id, charityid, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }

  });

});



settingsRouter.get('/charity/:id/wepay/status', function(req, res, next) {
   var object ={};
  object.id = req.params.id;
  object.type = req.query.type;
  var logsObj = req.logsObj;
  console.log(object)
  async.series({
    validation: function(callback) {
      validationController.paramExistsAndNumber({
        charityId: parseInt(object.id)
      }, callback);
    },
    data: function(callback) {
      settingsService.getPaymentGatewayCharityStatus(object, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }

  });

});

/**
 * I just skip this method from logging, Because we are using method yet
 */

settingsRouter.post('/adding/organization', function(req, res, next) {
  var charityObj = req.body;
  charityObj.original_ip = req.ip;
  charityObj.original_device = req.hostname;
  async.series({
    /*validation: function(callback) {
      validationController.paramExistsAndNumber({
        charityId: parseInt(id)
      }, callback);
    },*/
    data: function(callback) {
      settingsService.addingCharity(charityObj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.log('error', "addingCharity in settings services from settings route - " + req.cookies.logindonorid);

      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "adding charity, done, In settings route"]);
      utility.dataHandler(result, res);
    }
  });
});

settingsRouter.get('/added/orglist/:charityId', function(req, res, next) {
  var charityId = req.params.charityId;
  var logsObj = req.logsObj;
  async.series({
    /*validation: function(callback) {
     validationController.paramExistsAndNumber({
     charityId: parseInt(id)
     }, callback);
     },*/
    data: function(callback) {
      settingsService.getCharityList(charityId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }
  });
});

settingsRouter.post('/info/charity/save', function(req, res, next) {
  var charityInfo = req.body;
  var logsObj = req.logsObj;
  charityInfo.charityId = parseInt(charityInfo.charityid);
  async.series({
    validation: function(callback) {
      validationController.paramExistsAndNumber(charityInfo, callback);
    },
    data: function(callback) {
      settingsService.getCharityInformantion(charityInfo, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      console.log("in rhabh");
      console.log(result);
      utility.dataHandler(result, res);
    }
  });
});

settingsRouter.post('/getFollowOrg', function(req, res, next) {
  var ids = req.body;
  var logsObj = req.logsObj;
  async.series({
    data: function(callback) {
      donorService.getDonorFollowingOrganizations(ids.sessionuserid, ids.fuserId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }
  });
});
settingsRouter.get('/donor/:userid/wepay/status', function(req, res, next) {
  var id = req.params.userid;
  var logsObj = req.logsObj;
  settingsService.getCharityStatusFundraise(id, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });
});
settingsRouter.post('/user/payment/gateways', function(req, res, next) {

  var obj = req.body;
  var logsObj = req.logsObj;

  async.series({
    validation: function(callback) {
      validationController.paramExistsAndNumber({
        charityId: parseInt(obj.charityId || obj.userId)
      }, callback);
    },
    data: function(callback) {
      settingsService.getPaymentGateways({
        userId: obj.userId,
        charityId: obj.charityId
      }, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }

  });

});

settingsRouter.post('/get/email/templates',function(req,res){
  var data = req.body;
  settingsService.getUserEmailNotificationSettings(data,function(err,result){
    if(err){
      utility.appErrorHandler(new Error(JSON.stringify({
        errors:[err],
        status:400
      })),res);
    }else{
      utility.dataHandler({
        success:true,
        data:result
      },res);
    }
  });
});


settingsRouter.post('/set/email/templates',function(req,res){
  var data = req.body;

  settingsService.setUserEmailNotificationSettings(data,function(err,result){
    if(err){
      utility.appErrorHandler(new Error(JSON.stringify({
        errors:[err],
        status:400
      })),res);
    }else{
      utility.dataHandler({
        success:true,
        data:result
      },res);
    }
  }); 
});

settingsRouter.post('/update/gatewaystatus', function(req, res, next) {
  var data = req.body;
  wepayService.updateCodePaymentGateway(data,function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, res);
    } else {
      utility.dataHandler(result, res);
    }
  });
});
settingsRouter.post('/savefeatures', function(req, res) {
  var data = req.body;
  settingsService.saveAdditonalFeatures(data, function(err, result) {
    if (err) {
      utility.appErrorHandler(new Error(JSON.stringify({
        errors: [err],
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
settingsRouter.post('/getfeatures', function(req, res, next) {
  var data = req.body;
  settingsService.getAdditionalFeatures(data, function(err, result) {
    console.log("in routes......")
    if (err) {
      utility.appErrorHandler(new Error(JSON.stringify({
        errors: [err],
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

module.exports = settingsRouter;
