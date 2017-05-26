var express = require('express');
var charityRouter = express.Router();
var charityService = require('../services/charity');
var donationServices = require('../services/donations');

charityRouter.use('/*', function(req, res, next) {
  var logsObj = req.logsObj;
  console.log('In charity router init');
  utility.nodeLogs('INFO', 'In Charity Router Init');
  utility.tokenAuth(req, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      if (result) {
        utility.nodeLogs('INFO', 'Result Came From the Redis');
        utility.nodeLogs('INFO', "Token Vaidation Success");
        next();
        utility.nodeLogs('INFO', "After Next Is Not Knowing What happens");
      } else {
        utility.appErrorHandler({
          "error": "token problem"
        }, res);
      }
    }
  });


});

/**
 * @api {get} /charity/:charityId/ Get charity Details
 * @apiName Charity Details
 * @apiGroup Charity
 * @apiParamExample {json} Request-Example:
 *     {
 *      "charity_id": 1500337
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *    "status": "success",
 *    "data": [
 *        {
 *            "id": 1500337,
 *            "name_tmp": "PHYSICIANS FOR SOCIAL RESPONSIBILITY INC",
 *            "city": "Hyd",
 *            "state": "KS"
 *        }
 *    ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *   {
 *    "status": "error",
 *    "error": {
 *        "charityId": [
 *            "Charity id is not a number"
 *        ],
 *        "flag": 400
 *    }
 *}
 */
charityRouter.get('/:charityId', function(req, res, next) {
  var charityId = req.params.charityId;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.paramExistsAndNumber({
        charityId: charityId
      }, callback);
    },
    data: function(callback) {
      charityService.getCharityInformation(charityId, callback);
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
 * @api {post} /charity/admin Admin login
 * @apiName Admin login
 * @apiGroup Charity
 * @apiParamExample {json} Request-Example:
 *     {
 *    "charity_id": 1500432,
 *    "user_id": 413,
 *    "can_post": "yes",
 *    "can_update_financial": "yes",
 *    "can_request_withdrawal": "yes",
 *    "can_view_reports": "yes",
 *    "can_code": "yes",
 *    "can_manage_followers": "yes",
 *    "can_admin": "yes",
 *    "date_deleted": null
 *}
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *    "status": "success",
 *    "data": {
 *        "msg": "please enter the email"
 *    }
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *     {
 *    "status": "error",
 *    "error": {
 *        "charity_id": [
 *            "Charity id is not a number"
 *        ],
 *        "flag": 400
 *    }
 *}
 */

charityRouter.post('/admin', function(req, res, next) {

  var adminObject = req.body;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.validateCharityAdmin(adminObject, callback);
    },
    data: function(callback) {
      charityService.addCharityAdmin(adminObject, callback);
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
 * @api {put} /charity/admin/:id/charity/:charityId Update charity details
 * @apiName Charity details
 * @apiGroup Charity
 * @apiParamExample  Request-Example:
 *
 *   "charity_id": "df",
 *   "user_id": 413,
 *   "can_post": "no",
 *   "can_update_financial": "yes",
 *   "can_request_withdrawal": "yes",
 *   "can_view_reports": "yes",
 *   "can_code": "yes",
 *   "can_manage_followers": "yes",
 *   "can_admin": "yes",
 *   "date_deleted": null
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": {
 *       "charity_id": "1500432",
 *       "user_id": "413",
 *      "can_post": "no",
 *       "can_update_financial": "yes",
 *       "can_request_withdrawal": "yes",
 *       "can_view_reports": "yes",
 *       "can_code": "yes",
 *       "can_manage_followers": "yes",
 *       "can_admin": "yes",
 *       "date_deleted": null,
 *       "affectedRows": 8
 *   }
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *    {
 *   "status": "error",
 *   "error": {
 *      "charity_id": [
 *            "Charity id is not a number"
 *       ],
 *       "flag": 400
 *   }
 *}
 */

charityRouter.put('/admin/:id/charity/:charityId', function(req, res, next) {
  var updateAdminObject = req.body;
  var logsObj = req.logsObj;
  if (req.params.charityId) {
    updateAdminObject.charity_id = req.params.charityId;
  }
  if (req.params.id) {
    updateAdminObject.user_id = req.params.id;
  }

  async.series({
    validation: function(callback) {
      validationController.validateCharityAdmin(updateAdminObject, callback);
    },
    data: function(callback) {
      charityService.updateCharityAdmin(updateAdminObject, callback);
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
 * @api {get} /charity/admin/:id/charity/:charityId Get Admin details for charity
 * @apiName Get Admin details for charity
 * @apiGroup Charity
 * @apiParamExample  Request-Example:
 *
 *         "admin_id"   : 21
 *         "charity_id" : 1500432
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *         {
 *   "status": "success",
 *   "data": [
 *       {
 *           "name": "Matt Cole",
 *           "admin_id": 21
 *       },
 *       {
 *           "id": 8,
 *           "can_post": "no",
 *           "can_update_financial": "yes",
 *           "can_request_withdrawal": "yes",
 *           "can_view_reports": "yes",
 *           "can_code": "no",
 *           "can_manage_followers": "no",
 *           "can_admin": "yes",
 *           "organization_id": 1145324,
 *           "title": "E3KIDS INTERNATIONAL ",
 *           "profile_pic_url": "",
 *           "entity_id": 3806692,
 *           "url_slug": "avalon-educational-institute"
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *     {
 *   "status": "error",
 *   "error": {
 *       "charityId": [
 *           "Charity id is not a number"
 *       ],
 *       "flag": 400
 *   }
 *}
 */

charityRouter.get('/admin/:id/charity/:charityId', function(req, res, next) {
  //TODO:Validation of Parameter userID
  var userId = req.params.id;
  var charityId = req.params.charityId;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.paramUserExistsAndNumber({
        userId: userId,
        charityId: charityId
      }, callback);
    },
    data: function(callback) {
      charityService.getCharityAdmin(userId, charityId, callback);
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
 * @api {delete} /charity/admin/:id Delete admin
 * @apiName Delete admin
 * @apiGroup Charity
 * @apiParamExample {json} Request-Example:
 *
 *       "admin_id": 343
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": "343"
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *     {
 *   "status": "error",
 *    "error": {
 *        "charityAdminId": [
 *            "Charity admin id is not a number"
 *        ],
 *        "flag": 400
 *    }
 *}
 */

charityRouter.get('/admin/delete/:id/:charityid', function(req, res, next) {
  //TODO:Validation of Parameter userID
  var charityAdminId = req.params.id;
  var logsObj = req.logsObj;

  var obj = {
    charityAdminId: charityAdminId,
    charityId: req.params.charityid
  };

  async.series({
    validation: function(callback) {
      validationController.paramAdminUserExistsAndNumber({
        charityAdminId: charityAdminId
      }, callback);
    },
    data: function(callback) {
      charityService.removeAdminUserByCharity(obj, callback);
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
 * @api {get} /charity/admin/list/:charityId Get admins list for charity
 * @apiName Admins list for charity
 * @apiGroup Charity
 * @apiParamExample {json}} Request-Example:
 *
 *     {
 *
 *      "charity_id" : 1500432
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *      {
 *          "id": 13,
 *          "user_id": 3,
 *          "name": "Dominic Ismert"
 *      },
 *      {
 *          "id": 8,
 *          "user_id": 21,
 *          "name": "Matt Cole"
 *      },
 *      {
 *          "id": 49,
 *          "user_id": 80,
 *           "name": "sri"
 *       },
 *       {
 *           "id": 50,
 *            "user_id": 80,
 *            "name": "sri"
 *        },
 *        {
 *            "id": 44,
 *            "user_id": 78,
 *            "name": "sri"
 *        },
 *        {
 *            "id": 25,
 *            "user_id": 40,
 *            "name": "TejaNagaSrikanth"
 *        }
 *    ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *     {
 *    "status": "error",
 *    "error": {
 *        "charityId": [
 *            "Charity id is not a number"
 *        ],
 *        "flag": 400
 *    }
 *}
 */

charityRouter.get('/admin/list/:charityId/:userId', function(req, res, next) {
  //TODO:Validation of Parameter Charity ID
  var charityId = req.params.charityId;
  var userId = req.params.userId;
  var logsObj = req.logsObj;

  async.series({
    validation: function(callback) {
      validationController.paramExistsAndNumberSer({
        charityId: charityId
      }, callback);
    },
    data: function(callback) {
      charityService.getAllAdminUsersByCharity(charityId, userId, callback);
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
 * @api {get} /charity/profile/charity/:charityId Get charity prifile
 * @apiName Get charity prifile
 * @apiGroup Charity
 * @apiParamExample {json} Request-Example:
 *     {
 *       "charity_id": 1500432
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *       {
 *   "status": "success",
 *   "data": [
 *       {
 *          "organization_id": 1145324,
 *           "email": "srinugo@gmail.com",
 *           "phone": "996625568",
 *           "reach": "local",
 *           "tax_id": "234678",
 *           "address_1": "5803 TIPPERARY TRL",
 *           "address_2": "hydjl",
 *           "city": "FREDERICKSBRG",
 *           "state": "GA",
 *           "postal_code": "22407-4397",
 *           "code_registry": null,
 *           "title": "E3KIDS INTERNATIONAL ",
 *           "brief_description": "nothing",
 *           "web_url": "http://www.e3kids.com/",
 *           "profile_pic_thumb_url": "krish",
 *           "profile_pic_url": "ram",
 *           "category": [
 *               2255
 *           ]
 *       }
 *    ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *           {
 *   "status": "error",
 *    "error": {
 *        "charityId": [
 *            "Charity id is not a number"
 *        ],
 *        "flag": 400
 *    }
 *}
 */

charityRouter.get('/profile/charity/:charityId', function(req, res, next) {
  //TODO:Validation of Parameter Charity ID
  var charityId = req.params.charityId;
  var logsObj = req.logsObj;

  async.series({
    validation: function(callback) {
      validationController.paramExistsAndNumber({
        charityId: charityId
      }, callback);
    },
    data: function(callback) {
      charityService.getProfileByCharity(charityId, callback);
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
 * @api {put} /charity/profile/charity/:charityId Update charity prifile
 * @apiName Update charity prifile
 * @apiGroup Charity
 * @apiParamExample  Request-Example:
 *
 *     "charity_id" : 1500432
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *       {
 *   "status": "success",
 *   "data": {
 *       "email": "srinugo@gmail.com",
 *       "phone": "9966256",
 *       "reach": "local",
 *       "tax_id": 45,
 *       "address_1": "5803 TIPPERARY TRL",
 *       "address_2": "hydjl",
 *       "city": "FREDERICKSBRG",
 *       "state": "VL",
 *       "postal_code": "22407-4397",
 *       "code_registry": "fg",
 *       "title": "E3KIDS INTERNATIONAL",
 *       "brief_description": "nothing",
 *       "web_url": "jjj",
 *       "profile_pic_thumb_url": "krish",
 *       "charityId": "1500432"
 *   }
 *}
 *
 * @apiErrorExample {json} Error-Response:
 *
 *{
 *   "status": "error",
 *   "error": {
 *       "charityId": [
 *           "Charity id is not a number"
 *       ],
 *        "flag": 400
 *   }
 *}
 */

charityRouter.put('/profile/charity/:charityId', function(req, res, next) {
  var logsObj = req.logsObj;
  var updateAdminObject = req.body;
  updateAdminObject.charityId = req.params.charityId;
  console.log('WATER');
  console.log(updateAdminObject);
  async.series({
    validation: function(callback) {
      validationController.validateCharityProfile(updateAdminObject, callback);
    },
    data: function(callback) {
      charityService.updateCharityProfile(updateAdminObject, callback);
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
 * @api {get} /charity/category/list Get category list
 * @apiName get category list
 * @apiGroup Charity
 * @apiParamExample {json} Request-Example:
 *     {
 *       "user_id": 413
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "id": 1967,
 *           "title": "Addictive Disorders N.E.C."
 *       },
 *       {
 *           "id": 2059,
 *           "title": "Administration of Justice, Courts"
 *       }
 *   ]
 *}
 *
 * @apiErrorExample {json} Error-Response:
 *
 *{
 *       "error": "500 Internal Error"
 *}
 */

charityRouter.get('/category/list', function(req, res, next) {
  var responseObject = {};
  var logsObj = req.logsObj;
  // Add stuff here
  charityService.getAllCategories({}, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get category list, done, In charity route"]);
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }

  });

});

/**
 * @api {post} /charity/:id/claim/  Send claim for Charity
 * @apiName Send claim for Charity
 * @apiGroup Charity
 * @apiParamExample {json} Request-Example:
 *     {
 *      "charity_id": 1500337
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *   {
 *
 *}
 */

charityRouter.post('/:id/claim/', function(req, res, next) {
  var logsObj = req.logsObj;
  var claimObj = req.body;
  claimObj.charity_id = req.params.id;
  claimObj.date_created = moment().toDate();
  charityService.sendClaim(claimObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "charity claim, done, In charity route"]);
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });
});

/**
 * @api {put} /charity/claim/:id  Update claim for Charity
 * @apiName Update claim for Charity
 * @apiGroup Charity
 * @apiParamExample {json} Request-Example:
 *     {
 *      "charity_id": 1500337
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *   "status": "success",
 *   "data": {
 *       "id": "25",
 *       "approval_date": "2015-04-27T16:13:30.928Z",
 *       "affectedRows": 0
 *   }
 *}
 *
 */

charityRouter.put('/claim/:id', function(req, res, next) {
  var logsObj = req.logsObj;
  var claimObj = req.body;
  claimObj.id = req.params.id;
  claimObj.approval_date = moment().toDate();

  charityService.updateClaim(claimObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });
});

/**
 * @api {get} /charity/donor/claims  Get donor claims for Charity
 * @apiName Get donor claims for Charity
 * @apiGroup Charity
 * @apiParamExample {json} Request-Example:
 *     {
 *      "charity_id": 1500337
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *   "status": "success",
 *   "data": [
 *       {
 *           "id": 13,
 *           "charity_id": 1500337,
 *           "first_name": "Srinivas",
 *           "last_name": "Gorantla",
 *           "title": "WonderWe",
 *           "email_address": "",
 *           "phone_number": "9160600690",
 *           "ein": "110001100",
 *            "date_created": "2015-04-27T07:07:24.000Z",
 *           "approval_date": null,
 *            "approved_by": 0
 *       },
 *       {
 *           "id": 18,
 *           "charity_id": 1500337,
 *           "first_name": "Trinesh",
 *          "last_name": "Yadla",
 *           "title": "WonderWe",
 *           "email_address": "volunteer.trinesh+c3@gmail.com",
 *           "phone_number": "9160600690",
 *           "ein": "110001103",
 *           "date_created": "2015-04-27T07:40:21.000Z",
 *           "approval_date": null,
 *           "approved_by": 0
 *       }
 *   ]
 *}
 *
 */
charityRouter.get('/pending/claims', function(req, res, next) {
  var logsObj = req.logsObj;
  charityService.getAllClaims({}, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {

      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });
});
 
 charityRouter.get('/approved/claims',function(req, res, next){
        var logsObj =req.logsObj;
        charityService.getAllApprovedClaims({}, function(err, result){
            if(err) {
              utility.newAppErrorHandler(err, logsObj, res);
            } else {
              var obj={};
              obj.data =result;
              utility.dataHandler(obj,res);
            }
          });
         });


/**
 * @api {post} /charity/category/list Add categories
 * @apiName Add categories
 * @apiGroup Charity
 * @apiParamExample {json} Request-Example:
 *     {
 *      "charity_id": 1500337
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *   {
 *
 *}
 */

charityRouter.post('/category/list', function(req, res, next) {
  var logsObj = req.logsObj;
  var addCategorys = req.body;

  async.series({
    validation: function(callback) {
      validationController.validatePostCategorys(addCategorys, callback);
    },
    data: function(callback) {
      charityService.addSelectCategorys(addCategorys, callback);
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
 * @api {put} /charity/profile/pic/upload/:orgId Update charity profile pic
 * @apiName Update charity profile pic
 * @apiGroup Charity
 * @apiParamExample  Request-Example:
 *
 *       "profile_pic_url": "ram",
 *       "profile_pic_thumb_url": "krish"
 *
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *    "status": "success",
 *    "data": {
 *        "profile_pic_url": "ram",
 *        "profile_pic_thumb_url": "krish",
 *        "orgId": "1145324",
 *        "affectedRows": 1
 *    }
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *{
 *   "status": "error",
 *   "error": {
 *       "profile_pic_url": [
 *           "Profile pic url can't be blank"
 *       ],
 *       "flag": 400
 *   }
 *}
 */

charityRouter.put('/profile/pic/upload/:orgId', function(req, res, next) {
  var uploadProfileObj = req.body;
  var orgId = req.params.orgId;
  uploadProfileObj.orgId = orgId;
  var logsObj = req.logsObj;

  async.series({
    validation: function(callback) {
      validationController.validateUploadProfileObj(uploadProfileObj, callback);
    },
    data: function(callback) {
      charityService.profilePicUpload(uploadProfileObj, callback);
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

charityRouter.post('/user/claim/approval', function(req, res, next) {
  var logsObj = req.logsObj;
  var charityName = req.body.id;

  var userObject = {
    id: req.body.id
  };

  userObject.original_ip = req.ip;
  userObject.original_device = req.hostname;
  userObject.approval_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  userObject.admin_user_id = req.body.user_id;

  validationController.wepayUserRegister(userObject, function(err, errorResult) {
    if (err) {
      utility.log('error', "wepayUserRegister in validationController from charity route - " + req.cookies.logindonorid);
      utility.newAppErrorHandler(err, logsObj, res);
    } else {

      async.parallel({
        update_claim: function(updateCallback) {

          charityService.updateClaim(userObject, updateCallback);
        },
        wepay_account: function(wepayCallback) {

          donationServices.wepayUserRegister(userObject, wepayCallback);
        }
      }, function(err, asyncResult) {
        if (err) {
          utility.newAppErrorHandler(err, logsObj, res);
        } else {
          utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "user claim approval, done, In charity route"]);
          var obj = {};
          obj.data = userObject;
          utility.dataHandler(obj, res);
        }
      });
    }
  });
});

//Deny Clamied User



charityRouter.delete('/user/claim/deny', function(req, res, next) {
  var logsObj = req.logsObj;
  var obj = {
    claimId: req.body.id,
    userId: req.body.user_id,
    charityId: req.body.charity_id,
    fname: req.body.fname,
    email: req.body.email
  };

  charityService.denyClaimedUser(obj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });

});

  charityRouter.post('/appfee/updatedclaims', function(req, res, next) {
   var logsObj = req.logsObj;
     var charityObj ={};
    
    charityObj.app_fee = req.body.appfee;
    charityObj.id = req.body.charityid;

      //console.log(charityObj.app_fee);
      //console.log(charityObj.id);
    charityService.updateCharityAppFee(charityObj, function(err, result) {
      //console.log("charityObjfffffff :" + charityObj);
          
          if(err) {
              utility.newAppErrorHandler(err, logsObj, res);
            } else {
              var obj={};
              obj.data =result;
              utility.dataHandler(obj,res);
            }
        });
     });

/**
 * @api {get} /charity/states/list Get states list
 * @apiName Update Get states
 * @apiGroup Charity

 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "name": "Alabama",
 *           "abbreviation": "AL"
 *       },
 *       {
 *           "name": "Alaska",
 *           "abbreviation": "AK"
 *       },
 *       {
 *           "name": "American Samoa",
 *           "abbreviation": "AS"
 *       }
 *   ]
 *}
 */

charityRouter.get('/country/:id/states', function(req, res, next) {
  var logsObj = req.logsObj;
  var countryId = req.params.id;

  charityService.getStates(countryId, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;

      utility.dataHandler(resObject, res);
    }
  });
});


charityRouter.get('/countries/list', function(req, res, next) {
  var logsObj = req.logsObj;
  charityService.getCountries({}, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;

      utility.dataHandler(resObject, res);
    }
  });
});


//donation/countries/list

charityRouter.get('/donation/countries/list', function(req, res, next) {
  var logsObj = req.logsObj;
  charityService.getDonationCountries({}, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});


/**
 * @api {get} /charity/getcharitydetails/:userId Get charity details for user
 * @apiName Get charity details for user
 * @apiGroup Charity
 * @apiParamExample  Request-Example:
 *
 *  {
 *   "userId" : 21
 * }
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *
 * {
 *   "status": "success",
 *   "data": [
 *       {
 *           "id": 8,
 *           "can_post": "no",
 *           "can_update_financial": "yes",
 *           "can_request_withdrawal": null,
 *           "can_view_reports": "no",
 *           "can_code": "no",
 *           "can_manage_followers": "no",
 *           "can_admin": "yes",
 *           "organization_id": 1145324,
 *           "title": "E3KIDS INTERNATIONAL ",
 *           "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/2b22e952-98c8-437e-b83d-cc1d9f4105e4-ekidsjpg.jpg",
 *           "entity_id": 3806692,
 *           "charityId": 1500432
 *       }
 *   ]
 *}
 *
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *{
 *   "status": "error",
 *   "error": {
 *       "userId": [
 *           "User id is not a number"
 *       ],
 *       "flag": 400,
 *       "location": "paramUserExistsAndNumber....validator.js ,"
 *   }
 *
 */

charityRouter.get('/getcharitydetails/:userId', function(req, res, next) {
  var logsObj = req.logsObj;
  var userId = req.params.userId;
  console.log('in get charity details userid');
  async.series({
    validation: function(callback) {
      validationController.paramUserExistsAndNumber({
        userId: parseInt(userId)
      }, callback);
    },
    data: function(callback) {
      console.log(userId);
      charityService.getCharityData(userId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      utility.dataHandler(result, res);
    }
  });
});

charityRouter.get('/:id/count/stats', function(req, res, next) {
  var logsObj = req.logsObj;
  var id = req.params.id;
  async.series({
    validation: function(callback) {
      validationController.paramExistsAndNumber({
        charityId: parseInt(req.params.id)
      }, callback);
    },
    data: function(callback) {
      charityService.getCharityCountStats({
        charity_id: id
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


/**
 * @api {get} /charity/browse/all Get all charities
 * @apiName Get all charities
 * @apiGroup Charity
 * @apiParamExample  Request-Example:
 *
 *  {
 *   "userId" : 21
 * }
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *
 * {
 *   "status": "success",
 *   "data": [
 *       {
 *           "id": 1500334,
 *           "organization_id": 1145226,
 *           "name_tmp": "MAINE PARENT TEACHER ASSOCIATION INC",
 *           "date_approved": null,
 *           "reach": null,
 *           "ein": null,
 *            "in_care_of": "% VIRGINIA MOTT",
 *           "address_1": "5803 TIPPERARY TRL",
 *          "address_2": "hydjl",
 *           "city": "FREDERICKSBRG",
 *           "state": "VL",
 *           "postal_code": "22407-4397",
 *           "payment_address": null,
 *           "payment_city": null,
 *           "payment_state": null,
 *           "payment_postal_code": null,
 *           "payment_phone": null,
 *           "notify_follower": null,
 *           "notify_mention": null,
 *           "notify_donation": null,
 *           "notify_check_sent": null,
 *           "notify_withdrawal_request": null,
 *           "notify_favorite": null,
 *           "notify_facebook": null,
 *           "notify_twitter": null,
 *           "notify_reply": null,
 *           "notify_25_percent_spend": null,
 *           "notify_50_percent_spend": null,
 *           "notify_75_percent_spend": null,
 *           "notify_90_percent_spend": null,
 *           "notify_administrator_change": null,
 *           "tax_exempt_doc_url": null,
 *           "bank_document": null,
 *           "irs_form_990": null,
 *           "organization_description": null,
 *           "phone": "9885933281",
 *           "email": "srinugo@gmail.com",
 *           "sort_name": "PTA-ME",
 *           "group_exemption_number": null,
 *           "deductibility_code": 1,
 *           "foundation_code": 0,
 *           "organization_code": 1,
 *           "exempt_status_code": 1,
 *           "asset_code": 0,
 *           "income_code": 0,
 *           "subsection_code": null,
 *           "affiliation_code": null,
 *           "approval_status": null,
 *           "classification_code": null,
 *           "activity_code": "59035000",
 *           "ntee_code": null,
 *           "account_id": null,
 *           "access_token": null,
 *           "short_name": "MAINE PARENT TEACH"
 *       }
 *   ]
 *}
 *
 *
 */


charityRouter.get('/browse/all', function(req, res, next) {
  var logsObj = req.logsObj;
  charityService.getAllCharitys(function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });

});

charityRouter.get('/browse/org/:name', function(req, res, next) {
  var logsObj = req.logsObj;
  var charityName = req.params.name;
  charityService.searchCharitys(req, charityName, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler(result, res);
    }
  });

});

charityRouter.post('/donor/preferences', function(req, res, next) {
  var logsObj = req.logsObj;
  var preferenceObj = req.body;
  if (preferenceObj.code_id) {
    charityService.fundraisePreferences(preferenceObj, function(err, result) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        utility.dataHandler(result, res);
      }
    });
  } else {
    charityService.donorPreferences(preferenceObj, function(err, result) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {

        utility.dataHandler(result, res);
      }
    });
  }
});

// Maybe we can remove this soon when we get the new wwCategories working
charityRouter.get('/fetch/donor/:userid/preferences', function(req, res, next) {
  var logsObj = req.logsObj;
  var userId = req.params.userid;
  var obj = {};
  obj.userid = userId;
  // obj.campType="fundraiseCamp"
  if (req.query.campType) obj.campType = req.query.campType;
  charityService.getDonorPreferences(obj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var data = {};
      data.data = result;
      utility.dataHandler(data, res);
    }
  });
});

charityRouter.get('/ein/:charityid', function(req, res, next) {
  var logsObj = req.logsObj;
  var charityId = req.params.charityid;
  charityService.getcharityein(charityId, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var data = {};
      data.data = result;
      utility.dataHandler(data, res);
    }
  });
});


/*charityRouter.get('/resend/charity/approval/email', function(req, res) {

  var Obj = {
      flag: 'exists',
      yourname: 'Vicki Timiney',
      charity_id: 1500956,
      invite_id: 831,
      email: 'vtiminey@ccharities.com'
    }
    //vtiminey@ccharities.com

  charityService.sendEmailToApproveCharityAdmin(Obj, function(err, result) {
    res.send({
      msg: 'Done well..'
    });
  });
});
*/
module.exports = charityRouter;
