var express = require('express');
var followerRouter = express.Router();
var followerService = require('../services/follower');

followerRouter.use('/*', function(req, res, next) {
  var logsObj = req.logsObj;
  utility.log('info', 'In Follower Router');
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

followerRouter.put('/:id', function(req, res, next) {
  var userObject = req.body;
});

followerRouter.delete('/:id', function(req, res, next) {
  var userObject = req.body;
});

followerRouter.get('/:id', function(req, res, next) {
  var userObject = req.body;
});


/**
 * @api {post} /follower/charity/:id Add follower for charity
 * @apiName  Add follower for charity
 * @apiGroup follower
 * @apiParamExample Request-Example:
 *      "charity_id" : 1500432,
         "user_id" : 56
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *   "status": "success",
 *   "data": {
 *        "charity_id": "1500432",
 *       "user_id": 56,
 *       "date_followed": "2015-05-13T14:31:35.776Z",
 *       "entity_id": 3806692,
 *       "entity_type": "charity"
 *   }
 *}
 *
 *@apiErrorExample {json} Error-Response:
 *
 *{
 *   "status": "error",
 *   "error": {
 *       "error": "Your already following",
 *       "location": "createFollow Charity - 1 - routes/follower.js ,"
 *   }
 *}
 */


followerRouter.post('/charity/:id', function(req, res, next) {
  //If we get the Charity ID and Get the Entity ID Based on Charity and Insert into Follow Table.
  //TODO: Add the Validation
  var followObj = req.body;
  var logsObj = req.logsObj;
  followObj.charity_id = req.params.id;
  followObj.date_followed = moment().toDate();
  followerService.createFollowCharity(followObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data

      if (result) {
        var responseData = {};
        responseData.data = result;
      } else {
        var responseData = result;
      }
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "create follow charity, done, In follower route"]);
      utility.dataHandler(responseData, res);
    }
  });

});

followerRouter.post('/unfollow/charity/:id', function(req, res, next) {
  //If we get the Charity ID and Get the Entity ID Based on Charity and Insert into Follow Table.
  //TODO: Add the Validation
  var followObj = req.body;
  var logsObj = req.logsObj;
  followObj.charity_id = req.params.id;
  followObj.date_followed = moment().toDate();
  followerService.unFollowCharity(followObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data

      if (result) {
        var responseData = {};
        responseData.data = result;
      } else {
        var responseData = result;
      }
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "unfollow charity, done, In follower route"]);
      utility.dataHandler(responseData, res);
    }
  });

});
/**
 * @api {post} /follower/charity/:id Create Follow code
 * @apiName  Create Follow code
 * @apiGroup follower
 * @apiParamExample Request-Example:
 *      "code_id" : 1500432,
         "user_id" : 56
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *   "status": "success",
 *   "data": {
 *       "code_id": "56",
 *       "code_id": "56",
 *        "user_id": 3,
 *       "date_followed": "2015-05-13T14:41:54.798Z",
 *       "entity_id": 3809024,
 *       "entity_type": "code"
 *   }
 *}
 *
 *@apiErrorExample {json} Error-Response:
 *
 *{
 *   "status": "error",
 *   "error": {
 *       "error": "something went wrong",
 *       "location": "createFollow Code- 1 - routes/follower.js ,"
 *   }
 *}
 */



followerRouter.post('/code/:id', function(req, res, next) {
  //TODO: Add the Validation
  var followObj = req.body;
  var logsObj = req.logsObj;
  followObj.code_id = req.params.id;
  followObj.date_followed = moment().toDate();
  followerService.createFollowCode(followObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      if (result) {
        var responseData = {};
        responseData.data = result;
      } else {
        var responseData = result;
      }
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "create follow code, done, In follower route"]);
      utility.dataHandler(responseData, res);
    }
  });

});

followerRouter.post('/unfollow/code/:id', function(req, res, next) {
  //TODO: Add the Validation
  var followObj = req.body;
  var logsObj = req.logsObj;
  followObj.code_id = req.params.id;
  followObj.date_followed = moment().toDate();
  followerService.unFollowCode(followObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      if (result) {
        var responseData = {};
        responseData.data = result;
      } else {
        var responseData = result;
      }
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "unfollow code, done, In follower route"]);
      utility.dataHandler(responseData, res);
    }
  });

});

followerRouter.post('/user/:id', function(req, res, next) {
  //TODO: Add the Validation
  var followObj = req.body;
  var logsObj = req.logsObj;
  followObj.followeduser_id = req.params.id;
  followObj.date_followed = moment().toDate();
  followerService.createFollowUser(followObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      if (result) {
        var responseData = {};
        responseData.data = result;
      } else {
        var responseData = result;
      }
      utility.dataHandler(responseData, res);
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "follow user, done, In follower route"]);
    }
  });

});

//UNfollow user
followerRouter.post('/unfollow/user/:id', function(req, res, next) {
  //TODO: Add the Validation
  var followObj = req.body;
  var logsObj = req.logsObj;
  followObj.followeduser_id = req.params.id;
  followObj.date_followed = moment().toDate();

  followerService.unFollowUser(followObj, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data

      if (result) {
        var responseData = {};
        responseData.data = result;
      } else {
        var responseData = result;
      }
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "unfollow user, done, In follower route"]);
      utility.dataHandler(responseData, res);
    }
  });

});


followerRouter.post('/charity/entity/:id', function(req, res, next) {
  //TODO: Add the Validation
  //user_id,date_followed
  var followObj = req.body;
  var logsObj = req.logsObj;
  followObj.entity_id = req.params.id;
  followObj.date_followed = moment().toDate();
  followerService.createFollow(followObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "charity entity, done, In follower route"]);
      utility.dataHandler(result, res);
    }
  });
});

followerRouter.post('/code/entity/:id', function(req, res, next) {
  //TODO: Add the Validation
  var followObj = req.body;
  var logsObj = req.logsObj;
  followObj.entity_id = req.params.id;
  followObj.date_followed = moment().toDate();
  followerService.createFollow(followObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "code entity, done, In follower route"]);
      utility.dataHandler(result, res);
    }
  });
});

followerRouter.post('/user/entity/:id', function(req, res, next) {
  //TODO: Add the Validation
  var followObj = req.body;
  var logsObj = req.logsObj;
  followObj.entity_id = req.params.id;
  followObj.date_followed = moment().toDate();
  followerService.createFollow(followObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "user entity, done, In follower route"]);
      utility.dataHandler(result, res);
    }
  });
});

followerRouter.post('/category', function(req, res, next) {
  var categoryObj = req.body;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.validateCategory(categoryObj, callback);
    },
    data: function(callback) {
      followerService.createFollowerCategory(categoryObj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "code category, done, In follower route"]);
      utility.dataHandler(result, res);
    }

  });
});
followerRouter.put('/category/:id', function(req, res, next) {

});
followerRouter.get('/category/:id', function(req, res, next) {

});
followerRouter.delete('/category/:id', function(req, res, next) {

});

/**
 * @api {get} /follower/charity/:userslug Get follower by charity
 * @apiName  Get follower by charity
 * @apiGroup follower
 * @apiParamExample {json} Request-Example:
 *     {
 *       "user_id": 413
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *    "status": "success",
 *   "data": [
 *       {
 *           "charity_id": 3806692,
 *           "entity_id": 3806692,
 *           "url": 3,
 *           "user_id": 3,
 *           "display_name": "Dominic Ismert",
 *           "profile_pic_thumb_url": "https://wonderwe.s3.amazonaws.com/150x150/profile/6ecc0e13-b879-4096-aade-0d7317e59364.jpeg",
 *           "city": "Kansas City",
 *           "state": "MO",
 *           "description": "I am a person. As a person, I have skin and bones and eyes and stuff. These things hold me together while I walk and pretend that I know what I am doing. ",
 *           "no_posts": 159,
 *           "no_followers": 11,
 *           "no_following": 7
 *       },
 *       {
 *           "charity_id": 3806692,
 *           "entity_id": 3806692,
 *           "url": 5,
 *           "user_id": 5,
 *           "display_name": "Dominic Ismert",
 *           "profile_pic_thumb_url": null,
 *           "city": "Kansas City",
 *           "state": "MO",
 *           "description": "Integer id orci faucibus, finibus erat sed, dignissim diam.",
 *           "no_posts": 59,
 *           "no_followers": 6,
 *           "no_following": 4
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 *
 */

followerRouter.get('/charity/:charityId', function(req, res, next) {
  //TODO:Validation of Parameter Charity ID
  var obj = {};
  var logsObj = req.logsObj;
  obj.charityId = req.params.charityId;
  async.series({
    /*validation : function(callback) {
     validationController.paramExistsAndNumber({
     charityId : charityId
     }, callback);
     },*/
    data: function(callback) {
      followerService.getFollowerByCharity(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get Followers by charity, done, In follower route"]);
      utility.dataHandler(result, res);
    }

  });
  //TODO:Get the Data Based on Charity ID
  //Send the Response - With Status Code Appropriately - 200 (OK), 400 (Validation Error of Inputs),
  //500 (Errors You Do not Know Like DB Connections), 402 (Business Validations Failed), 401 (Bad Auth)

});



/**
 * @api {post} /follower/charity/:id Get new followers by Charity
 * @apiName  Get new followers by Charity
 * @apiGroup follower
 * @apiParamExample Request-Example:
 *      "charityId": 1500337,
 *   "fromDate": "2014-09-1700: 32: 55",
 *   "toDate": "2014-09-2000: 32: 50"
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *   "status": "success",
 *   "data": []
 *}
 *
 *@apiErrorExample {json} Error-Response:
 *
 *{
 *   "status": "error",
 *   "error": {
 *       "charityId": [
 *           "Charity id is not a number"
 *       ],
 *       "flag": 400
 *   }
 *}
 */


followerRouter.post('/new/dates', function(req, res, next) {
  var obj = req.body;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.transInfoOfDates(obj, callback);
    },
    data: function(callback) {
      followerService.getNewFollowersByCharity(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get new Followers by charity, done, In follower route"]);
      utility.dataHandler(result, res);
    }

  });

});


/**
 * @api {post} /follower/charity/:id Get new followers by Year
 * @apiName  Get new followers by Year
 * @apiGroup follower
 * @apiParamExample Request-Example:
 *      "charityId": 1500337,
 *      "year"  : 2014
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *   "status": "success",
 *    "data": [
 *        {
 *            "AS_New_Followers_Yearly": 14
 *        },
 *        {
 *            "AS_New_Followers_Yearly": 2
 *        }
 *    ]
 *}
 *
 *@apiErrorExample {json} Error-Response:
 *
 *{
 *   "status": "error",
 *   "error": {
 *       "charityId": [
 *           "Charity id is not a number"
 *       ],
 *       "flag": 400
 *   }
 *}
 */

followerRouter.post('/new/year', function(req, res, next) {
  var obj = req.body;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.transYearInfo(obj, callback);
    },
    data: function(callback) {
      followerService.getNewFollowersByYear(obj, callback);
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
 * @api {post} /follower/charity/:id Get new followers by Month
 * @apiName  Get new followers by Month
 * @apiGroup follower
 * @apiParamExample Request-Example:
 *      "charityId": 1500337,
 *      "year"  : 2014
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *   "status": "success",
 *    "data": [
 *        {
 *            "AS New Followers Monthly": 6
 *        },
 *        {
 *            "AS New Followers Monthly": 5
 *        }
 *    ]
 *}
 *
 *@apiErrorExample {json} Error-Response:
 *
 *{
 *   "status": "error",
 *    "error": {
 *        "year": [
 *            "Year can't be blank"
 *        ],
 *        "flag": 400
 *    }
 *}
 */





followerRouter.post('/new/month', function(req, res, next) {
  var obj = req.body;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.transYearInfo(obj, callback);
    },
    data: function(callback) {
      followerService.getNewFollowersByMonth(obj, callback);
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
 * @api {post} /follower/charity/:id Get new followers by Weekly
 * @apiName  Get new followers by Weekly
 * @apiGroup follower
 * @apiParamExample Request-Example:
 *      "charityId": 1500337,
 *      "year"  : 2014
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *   "status": "success",
 *    "data": [
 *       {
 *           "AS_New_Followers_Weekly": 3
 *       },
 *       {
 *           "AS_New_Followers_Weekly": 1
 *       },
 *       {
 *           "AS_New_Followers_Weekly": 1
 *       }
 *   ]
 *}
 *@apiErrorExample {json} Error-Response:
 *
 *{
 *   "status": "error",
 *    "error": {
 *        "year": [
 *            "Year can't be blank"
 *        ],
 *        "flag": 400
 *    }
 *}
 */




followerRouter.post('/new/week', function(req, res, next) {
  var obj = req.body;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.transYearInfo(obj, callback);
    },
    data: function(callback) {
      followerService.getNewFollowersByWeek(obj, callback);
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
 * @api {post} /follower/charity/:id Get new followers for a day
 * @apiName  Get new followers for a day
 * @apiGroup follower
 * @apiParamExample Request-Example:
 *      "charityId": 1500337,
 *      "year"  : 2014
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *   "status": "success",
 *   "data": [
 *       {
 *           "AS_New_Followers_Day": 1
 *       }
 *   ]
 *}
 *@apiErrorExample {json} Error-Response:
 *
 *{
 *   "status": "error",
 *    "error": {
 *        "year": [
 *            "Year can't be blank"
 *        ],
 *        "flag": 400
 *    }
 *}
 */



followerRouter.post('/new/today', function(req, res, next) {
  var obj = req.body;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.transYearInfo(obj, callback);
    },
    data: function(callback) {
      followerService.getNewFollowersToday(obj, callback);
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



followerRouter.get('/total/post/followers/following/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.validateUserId({
        userId: userId
      }, callback);
    },
    data: function(callback) {
      followerService.getAllPostFollowingFollowers(userId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "total post Followers, done, In follower route"]);
      utility.dataHandler(result, res);
    }

  });

});

followerRouter.get('/following/user/:following_id/:user_id', function(req, res, next) {
  var user_id = req.params.user_id;
  var logsObj = req.logsObj;
  var following_id = req.params.following_id;
  async.series({
    validation: function(callback) {
      validationController.validateUserId({
        userId: user_id
      }, callback);
    },
    data: function(callback) {
      followerService.getfollowingUserData(following_id, user_id, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "total post Followers, done, In follower route"]);
      utility.dataHandler(result, res);
    }

  });
});
module.exports = followerRouter;
