var express = require('express');
var donorRoute = express.Router();
var donorService = require('../services/donors');
var request = require('request');
var emoji = require('emojione');


donorRoute.use('/*', function(req, res, next) {
  var logsObj = req.logsObj;
  utility.log('info', 'In Donors Router');
  utility.tokenAuth(req, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      if (result) {
        next();
      } else {
        utility.appErrorHandler({
          "errors": ["token problem"]
        }, res);
      }
    }
  });

});
/**
 * @api {post} /donors/dates Donation date creation
 * @apiName  Donation date
 * @apiGroup Donors
 * @apiParamExample  Request-Example:
 *
 *     "charityId":1500579,
 *     "fromDate":"2014-01-01",
 *     "toDate":"2014-12-31"
 *
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "Total_Donors_Filter": 3
 *       }
 *   ]
 *}
 *
 */
donorRoute.post('/dates', function(req, res, next) {
  var logsObj = req.logsObj;
  var data = req.body;
  async.series({
    validation: function(callback) {
      validationController.transInfoOfDates(data, callback);
    },
    data: function(callback) {
      donorService.getDonorsByDates(data, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get donors by dates, done, In donors route"]);
      utility.dataHandler(result, res);
    }

  });


});
/**
 * @api {post} /donors/year Donation year creation
 * @apiName Donation year
 * @apiGroup Donors
 * @apiParamExample Request-Example:
 *     "charityId" : 1500432,
 *     "year" : 2014
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "Year": 2014,
 *           "Total_Donors_Yearly": 2
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *     {
 *      "error": "Unexpected token s"
 *     }
 */
donorRoute.post('/year', function(req, res, next) {
  var logsObj = req.logsObj;
  var data = req.body;
  async.series({
    validation: function(callback) {
      validationController.transYearInfo(data, callback);
    },
    data: function(callback) {
      donorService.getDonorsByYear(data, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.NewAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.dataHandler(result, res);
    }

  });

});

donorRoute.get('/getstatistics/:statvalue', function(req, res, next) {
  var logsObj = req.logsObj;
  var obj = {};
  console.log("in routes....");
  console.log(obj);
  obj.statValue = req.params.statvalue;
  donorService.getCampaignStatistics(obj, function(err, result) {
    if (err) {
      utility.NewAppErrorHandler(err, logsObj, res);
    } else {
      var obj={};
      obj.data=result;
      //Send 200 Status With Real Data
      utility.dataHandler(obj, res);
    }

  })
});
/**
 * @api {post} /donors/month Donation month creation
 * @apiName  Donation month
 * @apiGroup Donors
 * @apiParamExample Request-Example:
 *
 *    "charityId" : 1500432,
 *    "year" : 2014
 *
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "Monthly": 12,
 *           "Total_Donors_Monthly": 1
 *       },
 *       {
 *           "Monthly": 11,
 *           "Total_Donors_Monthly": 1
 *       },
 *       {
 *           "Monthly": 10,
 *           "Total_Donors_Monthly": 1
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *     {
 *      "error": "Unexpected token g"
 *    }
 */
donorRoute.post('/month', function(req, res, next) {
  var logsObj = req.logsObj;
  var data = req.body;
  async.series({
    validation: function(callback) {
      validationController.transYearInfo(data, callback);
    },
    data: function(callback) {
      donorService.getDonorsByMonth(data, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.NewAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.dataHandler(result, res);
    }

  });

});
/**
 * @api {post} /donors/week  Donation week creation
 * @apiName Donation week
 * @apiGroup Donors
 * @apiParamExample Request-Example:
 *
 *    "charityId" : 1500432,
 *    "year" : 2014
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "Week": 48,
 *           "Total_Donors_Week": 1
 *       },
 *       {
 *           "Week": 43,
 *           "Total_Donors_Week": 1
 *       },
 *       {
 *           "Week": 42,
 *           "Total_Donors_Week": 1
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *      {
 *        "error": "Unexpected token g"
 *    }
 */
donorRoute.post('/week', function(req, res, next) {
  var logsObj = req.logsObj;
  var data = req.body;
  async.series({
    validation: function(callback) {
      validationController.transYearInfo(data, callback);
    },
    data: function(callback) {
      donorService.getDonorsByWeek(data, callback);
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
 * @api {post} /donors/today Current date for donation
 * @apiName Update current date for donation
 * @apiGroup Donors
 * @apiParamExample {json} Request-Example:
 *     "charityId" : 1500432,
 *     "year" : 2014
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *   "status": "success",
 *   "data": [
 *       {
 *           "tt_Date": "2014-10-24T18:56:36.000Z",
 *           "Day": 25,
 *           "Total_Donors_day": 1
 *       },
 *       {
 *           "tt_Date": "2014-12-01T18:35:59.000Z",
 *           "Day": 2,
 *           "Total_Donors_day": 1
 *       },
 *       {
 *           "tt_Date": "2014-11-01T15:50:20.000Z",
 *           "Day": 1,
 *           "Total_Donors_day": 1
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *      {
 *        "error": "Unexpected token g"
 *   }
 */
donorRoute.post('/today', function(req, res, next) {
  var logsObj = req.logsObj;
  var data = req.body;
  async.series({
    validation: function(callback) {
      validationController.transYearInfo(data, callback);
    },
    data: function(callback) {
      donorService.getDonorsByToday(data, callback);
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
 * @api {get} /donors/dashboard/:userId Dashboard data
 * @apiName Dashboard data
 * @apiGroup Donors
 * @apiParamExample Request-Example:
 *{
 *
 *   userId : 23
 * }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "id": 1056,
 *   "parent_code_id": null,
 *   "charity_id": 1500624,
 *   "category_id": 1879,
 *   "user_id": null,
 *   "date_created": "2014-08-21T12:43:04.000Z",
 *   "date_deleted": null,
 *   "code_text": "4-ELPCI",
 *   "type": "event",
 *   "start_date": "2014-03-21T16:17:57.000Z",
 *   "end_date": "2013-11-24T09:14:25.000Z",
 *   "suggested_donation": 124.03,
 *   "title": "4-E LEARNING & PREVENTION CENTER INC",
 *   "description": "Morbi non lectus. Aliquam sit amet diam in magna bibendum imperdiet.",
 *   "goal": 26070.32,
 *   "goal_notified": "2014-06-24T15:09:14.000Z",
 *   "match_amount": null,
 *   "match_name": null,
 *   "city": "LEESBURG",
 *   "state": "GA",
 *   "campaign_zip": null,
 *   "address_2": null,
 *   "address_1": null,
 *   "code_picture_url": null,
 *   "code_slug": null
 *}
 *
 * @apiErrorExample {json} Error-Response:
 *     {
 *"status": "error",
 *"error": {
 *"code": "ER_BAD_FIELD_ERROR",
 *"errno": 1054,
 *"sqlState": "42S22",
 *"index": 0,
 *"location": "donorDashboard....1..routes/donors.js ,"
 *}
 *}
 */
//Get Donor Dashboard Data
donorRoute.get('/dashboard/:userId', function(req, res, next) { // For the top left stats card in donor dashboard
  var userId = parseInt(req.params.userId);
  var logsObj = req.logsObj;
  async.parallel({
    /*validation:function(callback){
       validationController.userIdValidations(userId,callback);
     },*/
    numberOfPosts: function(callback) {
      donorService.numberOfDonorPosts(userId, callback);
    },
    numberOfFollowers: function(callback) {
      donorService.numberOfFollowers(userId, callback);
    },
    numberOfFollowing: function(callback) {
      donorService.numberOfFollowing(userId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get dashboard, done, In donors route"]);
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });
});
/**
 * @api {get} /donors/trending/campains Trending campains
 * @apiName Trending campains
 * @apiGroup Donors
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "id": 1201,
 *           "name": "E3KIDS INTERNATIONAL",
 *           "entity_type": "code",
 *           "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/6797ab43-5c86-4ca6-8a8d-3267b0bcff33-screenshot-from-2015-04-17-193026png.png",
 *           "entityid": 3809394,
 *           "charity_name": "E3KIDS INTERNATIONAL"
 *       },
 *       {
 *           "id": 1056,
 *           "name": "4-E LEARNING & PREVENTION CENTER INC",
 *           "entity_type": "code",
 *           "profile_pic_url": null,
 *           "entityid": 3809345,
 *           "charity_name": "4-E LEARNING & PREVENTION CENTER INC"
 *       }
 *   ]
 *}
 *
 */
//For Trending Campains
donorRoute.get('/trending/campains/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var logsObj = req.logsObj;
  donorService.curentTrendingCampains(userId, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});
/**
 * @apiName Follow suggestions
 * @apiGroup Donors
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *   "status": "success",
 *   "data": [
 *       {
 *           "id": 3,
 *           "name": "Dominic Ismert",
 *           "entity_type": "user",
 *           "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/6ecc0e13-b879-4096-aade-0d7317e59364.jpeg",
 *           "entityid": 3807107
 *       },
 *       {
 *           "id": 11,
 *           "name": "Andrew Rademacher",
 *           "entity_type": "user",
 *           "profile_pic_url": null,
 *           "entityid": 3807115
 *       }
 *   ]
 *}
 */

//For baner settings

donorRoute.get('/follow/suggestions/Orgs/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var skip = req.query.skip;
  var entityId = req.query.sessionuserid;
  var logsObj = req.logsObj;
  donorService.getDonorFollowingOrganizations(entityId, userId, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Follow suggestions, Orgs done, In donors route"]);
      if (data.length > 0) {
        var obj = {};
        obj.data = data;
        obj.flag = "orgs";
        utility.dataHandler(obj, res);
      } else {
        donorService.followRecommendationsOrgs(userId, skip, function(err, data) {
          if (err) {
            utility.newAppErrorHandler(err, logsObj, res);
          } else {
            utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Follow suggestions, Orgs done, In donors route"]);
            var resObject = {};
            resObject.data = data;
            utility.dataHandler(resObject, res);
          }
        });
      }
    }
  });

});

//For Who To Follow Suggestions
donorRoute.get('/follow/suggestions/:userId/:type', function(req, res, next) {
  console.log("dbhbhdbashdbahsdbashd..........")
  var userId = req.params.userId;
  var flag = req.query.flag;
  var skip = req.query.skip;
  var type = req.params.type;
  var logsObj = req.logsObj;
  if (type == "user") {
    donorService.followRecommendationsUser(userId, flag, skip, function(err, data) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Follow suggestions, done, In donors route user"]);
        var resObject = {};
        resObject.data = data;
        utility.dataHandler(resObject, res);
      }
    });
  } else if (type == "charity") {
    donorService.followRecommendationsOrg(userId, flag, skip, function(err, data) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Follow suggestions, done, In donors route user"]);
        var resObject = {};
        resObject.data = data;
        utility.dataHandler(resObject, res);
      }
    });

  } else {
    donorService.followRecommendations(userId, flag, skip, function(err, data) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Follow suggestions, done, In donors route"]);
        var resObject = {};
        resObject.data = data;
        utility.dataHandler(resObject, res);
      }
    });
  }

});

//Adding API when user click on close in who to follow (user close)

donorRoute.get('/follow/suggestuser/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var flag = req.query.flag;
  var skip = req.query.skip;
  var logsObj = req.logsObj;
  donorService.followRecommendationsUser(userId, flag, skip, function(err, data) {
    if (err) {
      utility.log('error', "followRecommendations in donor services from donor route user - " + req.cookies.logindonorid);
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Follow suggestions, done, In donors route user"]);
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

//Adding API when user click on close in who to follow (charity close)

donorRoute.get('/follow/suggestorg/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var flag = req.query.flag;
  var skip = req.query.skip;
  var logsObj = req.logsObj;
  donorService.followRecommendationsOrg(userId, flag, skip, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Follow suggestions, done, In donors route org"]);
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

/**
 * @api {get} /user/profile/:userId Get donor profile
 * @apiName Get donor profile
 * @apiGroup Donors
 *@apiParamExample {json} Request-Example:
 *     {
 *       "user_id": 3
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *
 * {
 *   "status": "success",
 *   "data": {
 *       "numberOfPosts": {
 *           "noofposts": 10
 *       },
 *       "userPosts": [
 *           {
 *               "id": 2015,
 *               "in_reply_id": null,
 *               "original_entity_id": null,
 *               "entity_id": 3810646,
 *               "date_posted": "2015-03-05T16:12:11.000Z",
 *               "date_deleted": null,
 *               "deleted_by": null,
 *               "ip_address": null,
 *               "hostname": null,
 *               "city": null,
 *               "state": null,
 *               "headline": null,
 *               "content": "I want to be heard.",
 *               "status_type": "post",
 *               "image_url": null,
 *               "image_url_470": null,
 *               "retweets": null,
 *               "reply_count": null,
 *               "user_name": "Matt Cole",
 *               "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/75378703-896b-41af-9e8d-a1de5843569a.jpeg"
 *           }
 *       ]
 *   }
 *}
 *
 *
 */
//For Donor Profile
donorRoute.get('/user/profile/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var entityId = req.query.entityId;
  var logsObj = req.logsObj;
  async.parallel({
    /*validation:function(callback){
      validationController.userIdValidations(userId,callback);
    },*/
    userDetails: function(callback) {
      donorService.userFullDetails(userId, entityId, callback);
    },
    numberOfPosts: function(callback) {
      donorService.numberOfDonorPosts(userId, callback);
    },
    numberOfFollowers: function(callback) {
      donorService.numberOfFollowers(userId, callback);
    },
    numberOfFollowing: function(callback) {
      donorService.numberOfFollowing(userId, callback);
    },
    numberOfPeopleFollowing: function(callback) {
      donorService.numberOfPeopleFollowing(userId, callback);
    },
    numberOfOrgsFollowing: function(callback) {
      donorService.numberOfOrgsFollowing(userId, callback);
    },
    numberOfCamFollowing: function(callback) {
      donorService.numberOfCamFollowing(userId, callback);
    },
    followingOrgs: function(callback) {
      donorService.getDonorFollowingOrganizations(entityId, userId, callback);
    },
    followingCampaigns: function(callback) {
      donorService.getUserFollowingCampaigns(entityId, userId, callback);
    },
    followingPeoples: function(callback) {
      donorService.getUserFollowingPeoples(entityId, userId, callback);
    },
    followerPeoples: function(callback) {
      donorService.getUserFollowerPeoples(userId, entityId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get user profile, done, In donors route"]);
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });
});

//Get Organization Profile
/**
 * @api {get} /user/profile/:userId Get organization profile
 * @apiName  Get organization profile
 * @apiGroup Donors
 * @apiParamExample {json} Request-Example:
 *     {
 *       "charity_id": 1500334
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *
 *{
 *   "status": "success",
 *   "data": {
 *        "charityData": {
 *            "id": 3806594,
 *            "organization_id": 1145226,
 *            "name_tmp": "MAINE PARENT TEACHER ASSOCIATION INC",
 *            "date_approved": null,
 *           "reach": null,
 *           "ein": null,
 *           "in_care_of": "% VIRGINIA MOTT",
 *           "address_1": "5803 TIPPERARY TRL",
 *           "address_2": "hydjl",
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
 *            "notify_check_sent": null,
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
 *            "phone": "9885933281",
 *           "email": "srinugo@gmail.com",
 *            "sort_name": "PTA-ME",
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
 *            "access_token": null,
 *           "short_name": "Maine PTA",
 *            "date_created": "2014-09-15T07:55:09.000Z",
 *           "title": "Maine PTA",
 *           "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/5100d273-a580-44ae-aa80-e71297312700-kitten_a4swuc_scaledjpg.jpg",
 *           "profile_pic_thumb_url": null,
 *           "brief_description": "charity discription",
 *           "full_description": "To support and speak on behalf of children and youth in the schools, in the community, and before governmental bodies and other organizations that make decisions affecting children; To assist parents in developing the skills they need to raise and protect their children; To encourage parent and public involvement in the public schools of this nation.",
 *           "web_url": "http://www.google.co.in",
 *           "date_disabled": null,
 *           "date_metadata_updated": "2014-11-30T17:24:24.000Z",
 *           "report_url": "http://www.guidestar.org/organizations/01-0221136/maine-pta.aspx",
 *           "entity_type": "charity",
 *           "entity_id": 1500334,
 *           "nooffollowers": 0,
 *           "noofposts": 0,
 *           "following_users": 0,
 *            "following_charities": 0,
 *           "following_codes": 0,
 *           "noof_donations": 0,
 *           "noof_donors": 0
 *       },
 *        "numberOfCampaigns": {
 *           "count": 5
 *       },
 *       "charityPosts": [
 *           {
 *               "post_id": 1042,
 *               "date_post": "2014-09-17T11:06:21.000Z",
 *               "entity_id": 3806594,
 *               "charity_id": 1500334,
 *               "charity_name": "MAINE PARENT TEACHER ASSOCIATION INC",
 *                "profile_pic": "https://wonderwe.s3.amazonaws.com/profile/5100d273-a580-44ae-aa80-e71297312700-kitten_a4swuc_scaledjpg.jpg",
 *                "charity_feed": "Nullam sit amet turpis elementum ligula vehicula consequat. Morbi a ipsum. Integer a nibh. In quis justo. Maecenas rhoncus aliquam lacus.",
 *               "image": null
 *           }
 *       ],
 *       "charityManaged": [
 *           {
 *               "noofadmins": 0
 *           }
 *       ],
 *       "numberOfFollowers": {
 *           "count": 0
 *       },
 *       "charityFollowers": [],
 *       "charityCampaigns": [
 *           {
 *               "id": 157,
 *               "parent_code_id": null,
 *               "charity_id": 1500334,
 *               "category_id": null,
 *               "user_id": null,
 *               "date_created": "2014-01-23T15:46:28.000Z",
 *               "date_deleted": null,
 *               "code_text": "in",
 *               "type": "ongoing",
 *               "start_date": "2014-05-14T10:00:06.000Z",
 *               "end_date": "2014-06-06T00:09:36.000Z",
 *               "suggested_donation": 67.73,
 *               "title": "libero non",
 *               "description": "Suspendisse ornare consequat lectus. In est risus, auctor sed, tristique in, tempus sit amet, sem. Fusce consequat. Nulla nisl. Nunc nisl. Duis bibendum, felis sed interdum venenatis, turpis enim blandit mi, in porttitor pede justo eu massa. Donec dapibus. Duis at velit eu est congue elementum. In hac habitasse platea dictumst. Morbi vestibulum, velit id pretium iaculis, diam erat fermentum justo, nec condimentum neque sapien placerat ante.",
 *               "goal": 492580.1,
 *               "goal_notified": "2014-05-28T15:17:51.000Z",
 *               "match_amount": null,
 *               "match_name": null,
 *               "city": "Sonoma",
 *               "state": "FL",
 *               "campaign_zip": null,
 *               "address_2": null,
 *               "address_1": null,
 *               "code_picture_url": null,
 *               "code_slug": null,
 *               "charity_default": "no",
 *               "short_name": "libero non"
 *           }
 *       ],
 *       "numberOfPosts": {
 *           "count": 5
 *         }
 *   }
 *}
 *
 */



donorRoute.get('/organization/profile/:charityId', function(req, res, next) {
  var charityId = req.params.charityId;
  var user_id = req.query.user_id;
  var logsObj = req.logsObj;
  async.parallel({
    /*validation:function(callback){
     validationController.userIdValidations(userId,callback);
     },*/
    charityData: function(callback) {
      donorService.charityInfo(charityId, user_id, callback);
    },
    numberOfPosts: function(callback) {
      donorService.numberOfCharityPosts(charityId, callback);
    },
    numberOfFollowers: function(callback) {
      donorService.numberOfCharityFollowers(charityId, callback);
    },
    numberOfCampaigns: function(callback) {
      donorService.numberOfCampaigns(charityId, callback);
    },
    charityPosts: function(callback) {
      donorService.charityPosts(charityId, callback);
    },
    charityCampaigns: function(callback) {
      donorService.charityCampaigns(charityId, user_id, callback);
    },
    charityFollowers: function(callback) {
      donorService.charityFollowers(charityId, user_id, callback);
    },
    charityManaged: function(callback) {
      donorService.isItManaged(charityId, callback);
    },
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get organization profile, done, In donors route"]);
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });
});
//For Gallery User Images



/**
 * @api {get} /donors/gallery/:userId  Get gallery for users
 * @apiName  Get gallery for users
 * @apiGroup Donors
 * @apiParamExample {json} Request-Example:
 *     {
 *       "user_id": 3
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *   "status": "success",
 *   "data": [
 *       {
 *           "image_url": "https://wonderwe.s3.amazonaws.com/post/f9d7c320-3b1f-4d83-b288-2129bc952330.jpeg"
 *       },
 *       {
 *           "image_url": "https://wonderwe.s3.amazonaws.com/post/4ac7011d-6a8e-40ee-8f8d-d153f41c1dfc.png"
 *       },
 *       {
 *           "image_url": "https://wonderwe.s3.amazonaws.com/post/0d04d5d7-ccac-43d5-9d2c-0baa601322e9.png"
 *        },
 *       {
 *           "image_url": "https://wonderwe.s3.amazonaws.com/post/dc8a2efa-3496-451d-8b2a-b5b9f19d8bd2.png"
 *       },
 *        {
 *           "image_url": "https://wonderwe.s3.amazonaws.com/post/ad0a8f2c-ee3e-4507-b8a3-ec7e5dd682e7.png"
 *       }
 *   ]
 *}
 *
 */




donorRoute.get('/gallery/:entityId', function(req, res, next) {

  var entityId = req.params.entityId;
  var entityType = req.query.entity_type;
  var logsObj = req.logsObj;
  async.series({
    /*validation:function(callback){
      validationController.userIdValidations(userId,callback);
    },*/
    data: function(callback) {
      donorService.getEntityImages(entityId, entityType, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get gallery, done, In donors route"]);
      var obj = {};
      obj.data = result;
      utility.dataHandler(result, res);
    }

  });

});

//For Campaign Page

/**
 * @api {get} /donors/campaign/page/:codeId  Get campaign data
 * @apiName  Get campaign data
 * @apiGroup Donors
 * @apiParamExample {json} Request-Example:
 *     {
 *       "code_id": 56
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *
 * {
 *   "status": "success",
 *    "data": {
 *        "campainData": {
 *           "id": 56,
 *           "parent_code_id": null,
 *           "charity_id": 1500452,
 *            "category_id": 2210,
 *           "user_id": null,
 *           "date_created": "2014-03-16T06:11:55.000Z",
 *           "date_deleted": null,
 *           "code_text": "eget",
 *           "type": "event",
 *           "start_date": "2013-09-16T04:14:39.000Z",
 *           "end_date": "2014-01-27T05:51:51.000Z",
 *           "suggested_donation": 89.03,
 *           "title": "orci",
 *           "description": "Morbi a ipsum. Integer a nibh. In quis justo. Maecenas rhoncus aliquam lacus. Morbi quis tortor id nulla ultrices aliquet. Maecenas leo odio, condimentum id, luctus nec, molestie sed, justo. Pellentesque viverra pede ac diam. Cras pellentesque volutpat dui.",
 *           "goal": 287388.91,
 *           "goal_notified": "2013-12-10T02:46:42.000Z",
 *           "match_amount": null,
 *           "match_name": null,
 *           "city": "Arroyo Grande",
 *           "state": "WY",
 *           "campaign_zip": null,
 *           "address_2": null,
 *           "address_1": null,
 *           "code_picture_url": null,
 *           "code_slug": null,
 *           "charity_default": "no",
 *            "short_name": "orci"
 *        },
 *       "campainCharityData": {
 *           "charity_id": 1500452,
 *           "title": "Discovery Home Care, Inc.",
 *           "profile_pic_url": "http://www.guidestar.org/ViewEdoc.aspx?eDocId=1148912&approved=true",
 *           "entity_id": 3809024
 *       },
 *       "numberOfDonors": [],
 *       "numOfFollowers": {
 *           "count": 0
 *       },
 *       "mentionsOfCampaign": [
 *           {
 *               "mention_id": 56,
 *               "mention_name": "orci",
 *               "code_picture_url": null,
 *               "post_id": 2313,
 *               "entity_id": 3807107,
 *               "content": " Test pic @user"
 *           }
 *       ],
 *       "campaignFollowers": []
 *   }
 *}
 *
 **/


donorRoute.get('/campaign/page/:codeId', function(req, res, next) {

  var codeId = req.params.codeId;
  var user_id = req.query.user_id;
  var logsObj = req.logsObj;
  async.parallel({
    /*validation:function(callback){
     validationController.userIdValidations(userId,callback);
     },*/
    campainData: function(callback) {
      donorService.campaignDetails(codeId, user_id, callback);
    },
    campainCharityData: function(callback) {
      donorService.campaignCharityDetails(codeId, user_id, callback);
    },
    campaignDonors: function(callback) {
      donorService.campaignDonorsData(codeId, callback);
    },
    amountCollected: function(callback) {
      donorService.collectedAmount(codeId, callback);
    },
    mentionsOfCampaign: function(callback) {
      donorService.campaignMentions(codeId, callback);
    },
    numOfFollowers: function(callback) {
      donorService.numOfCampaignFollowers(codeId, callback);
    },
    campaignFollowers: function(callback) {
      donorService.campaignFollowersData(codeId, user_id, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get campaign page, done, In donors route"]);
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });

});


donorRoute.post('/new/card', function(req, res, next) {

  var cardObj = req.body;
  var logsObj = req.logsObj;
  donorService.addNewCard(cardObj, function(err, result) {

    if (err) {
      utility.log('error', "addNewCard  in donor service from donor route - " + req.cookies.logindonorid);
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get new card, done, In donors route"]);
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }

  });

});

donorRoute.delete('/card/:id/delete', function(req, res, next) {
  var id = req.params.id;
  var logsObj = req.logsObj;
  donorService.deleteDonorCard({
    id: id
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "delete card, done, In donors route"]);
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }

  });

});

donorRoute.get('/hashtag/images/:hashtag', function(req, res, next) {
  var hashtag = req.params.hashtag;
  var logsObj = req.logsObj;
  donorService.hashtagImages(hashtag, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });

});
/**
 * Used to get the Donors by Campaign ID.
 * 
 * @param  Campaign ID
 * @param  Skip is the No of Donors to Skip
 * 
 * @return Donros with limit to the skip size.
 */
donorRoute.get('/giving/levels/:codeId/:skip', function(req,res,next){
  var obj = {};
  obj.codeId = req.params.codeId;
  obj.skip = req.params.skip;
  var logsObj = req.logsObj;
  donorService.givingLevels(obj, function(err,result){
    if(err){
      utility.newAppErrorHandler(err, logsObj, res);
    } else{
      var obj = {};
      obj.data = result;
        utility.dataHandler(obj, res);
    }
  });
});
donorRoute.get('/campaign/:codeId/:skip/', function(req, res, next) {
  var obj = {};
  obj.codeId = req.params.codeId;
  obj.skip = req.params.skip;
  obj.fundraiser = req.query.fundraiser;
  var logsObj = req.logsObj;
  donorService.campaignDonors(obj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = result;
      for (var i in obj.data) {
        obj.data[i].transaction_date = moment(obj.data[i].transaction_date).fromNow();
        obj.data[i].created_date=moment(obj.data[i].created_date).fromNow();
        obj.data[i].amount = numeral(obj.data[i].amount).format('0,0.00');
        if (obj.data[i].hide_amount != 'no') {
          obj.data[i].amount = '';
          obj.data[i].hide_amount_class = 'hidden';
        }
        if (obj.data[i].anonymous != 'no') {
          obj.data[i].name = 'Anonymous';
          obj.data[i].profile_pic_url = 'https://wonderwe.s3.amazonaws.com/profile/002640b0-1680-4988-b67e-ed7f727e27f6-default-userpng.png';
        }
        if(obj.data[i].donor_comment){
          obj.data[i].donor_comment = emoji.shortnameToUnicode(obj.data[i].donor_comment);
        }
      }
      utility.dataHandler(obj, res);
    }
  });
});

donorRoute.get('/details/steps/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var logsObj = req.logsObj;
  donorService.getDonorDetailsData(userId, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

donorRoute.post('/address/save', function(req, res, next) {
  var obj = req.body;
  donorService.updateDonorDetails(obj, function(err, result) {
    if (err) {

    } else {
      var object = {};
      object.data = result;
      object.data.updatedField = "address_1";
      object.data.address_1 = obj.address_1;
      utility.dataHandler(object, res);
    }

  });

});

donorRoute.get('/city/save/:city/:userId/', function(req, res, next) {
  var obj = {};
  obj.userId = req.params.userId;
  obj.city = req.params.city;
  var logsObj = req.logsObj;
  donorService.updateDonorCity(obj, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.data = data;
      resObject.data.updatedField = "city";
      resObject.data.city = obj.city;
      utility.dataHandler(resObject, res);
    }
  });
});

donorRoute.get('/relationship/save/:relationship/:userId/', function(req, res, next) {
  var obj = {};
  obj.userId = req.params.userId;
  obj.relationship = req.params.relationship;
  var logsObj = req.logsObj;
  donorService.updateDonorRelationship(obj, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.data = data;
      resObject.data.updatedField = "relationship";
      resObject.data.relationship = obj.relationship;
      utility.dataHandler(resObject, res);
    }
  });
});

donorRoute.get('/religious/save/:religious_affiliation/:userId/', function(req, res, next) {
  var obj = {};
  var logsObj = req.logsObj;
  obj.userId = req.params.userId;
  obj.religious_affiliation = req.params.religious_affiliation;
  donorService.updateDonorReligious(obj, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.data = data;
      resObject.data.updatedField = "religious_affiliation";
      resObject.data.religious_affiliation = obj.religious_affiliation;
      utility.dataHandler(resObject, res);
    }
  });
});


donorRoute.get('/zipcode/save/:postal_code/:userId/', function(req, res, next) {
  var obj = {};
  var logsObj = req.logsObj;
  obj.userId = req.params.userId;
  obj.postal_code = req.params.postal_code;
  donorService.updateDonorZipcode(obj, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.data = data;
      resObject.data.updatedField = "postal_code";
      resObject.data.postal_code = obj.postal_code;
      utility.dataHandler(resObject, res);
    }
  });
});

donorRoute.get('/desc/save/:about_me/:userId/', function(req, res, next) {
  var obj = {};
  var logsObj = req.logsObj;
  obj.userId = req.params.userId;
  obj.about_me = req.params.about_me;
  donorService.updateDonorDesc(obj, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.data = data;
      resObject.data.updatedField = "about_me";
      resObject.data.about_me = obj.about_me;
      utility.dataHandler(resObject, res);
    }
  });
});

donorRoute.get('/phone/save/:home_phone/:userId/', function(req, res, next) {
  var obj = {};
  var logsObj = req.logsObj;
  obj.userId = req.params.userId;
  obj.home_phone = req.params.home_phone;
  donorService.updateDonorPhone(obj, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.data = data;
      resObject.data.updatedField = "home_phone";
      resObject.data.home_phone = obj.home_phone;
      utility.dataHandler(resObject, res);
    }
  });
});

donorRoute.get('/country/save/:country/:userId/', function(req, res, next) {
  var obj = {};
  var logsObj = req.logsObj;
  obj.userId = req.params.userId;
  obj.country = req.params.country;
  donorService.updateDonorCountry(obj, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.data = data;
      resObject.data.updatedField = "country";
      resObject.data.country = obj.country;
      utility.dataHandler(resObject, res);
    }
  });
});

donorRoute.get('/state/save/:state/:userId/', function(req, res, next) {
  var obj = {};
  obj.userId = req.params.userId;
  obj.state = req.params.state;
  donorService.updateDonorState(obj, function(err, data) {
    if (err) {
      /*utility.log('error', "curentTrendingCampains in donor services from donor route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);*/
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.data = data;
      resObject.data.updatedField = "state";
      resObject.data.state = obj.state;
      utility.dataHandler(resObject, res);
    }
  });
});

donorRoute.get('/gender/save/:gender/:userId/', function(req, res, next) {
  var obj = {};
  obj.userId = req.params.userId;
  obj.gender = req.params.gender;
  donorService.updateDonorGender(obj, function(err, data) {
    if (err) {
      /*utility.log('error', "curentTrendingCampains in donor services from donor route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);*/
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.data = data;
      resObject.data.updatedField = "gender";
      resObject.data.gender = obj.gender;
      utility.dataHandler(resObject, res);
    }
  });
});

//      url: '/donors/addGivingLevels/save',
donorRoute.post('/addGivingLevels/save/', function(req, res, next) {
  var obj = req.body;
  donorService.addGivingLevels(obj, function(err, result) {
    res.send(result);
  });

});
donorRoute.post('/updateGivingLevels/save/', function(req, res, next) {
  var obj = req.body;
  donorService.addGivingLevels(obj, function(err, result) {
    res.send(result);
  });

});
donorRoute.get('/getgivinglevel/:codeId/', function(req, res, next) {
  var obj = {}
  obj.codeId = req.params.codeId;
  donorService.getGivingLevel(obj, function(err, result) {
    res.send(result);

  });


});
donorRoute.get('/getsinglegivinglevel/:givingLevelId/', function(req, res, next) {
    var obj = {};
    obj.givinglevelId = req.params.givingLevelId;
    donorService.getGivingLevel(obj, function(err, result) {
      res.send(result);

    });


  })
  //givingleveldelete
donorRoute.post('/givingleveldelete/:givingleveid/', function(req, res, next) {
  var obj = {};
  obj.givinglevelId = req.params.givingleveid;
  obj.fundCampDelete = true;
  donorService.getGivingLevel(obj, function(err, result) {
    res.send(result);

  });
});





donorRoute.get('/team/:codeid', function(req, res, next) {

  var codeid = req.params.codeid;

  donorService.getDonorUniqueTeam(codeid, function(err, data) {
    if (err) {
      /*utility.log('error', "curentTrendingCampains in donor services from donor route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);*/
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});



donorRoute.get('/country/name/', function(req, res, next) {

  donorService.getCountryNames(function(err, data) {
    if (err) {
      /*utility.log('error', "curentTrendingCampains in donor services from donor route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);*/
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

donorRoute.get('/location/save/:postal_code/:userId', function(req, res, next) {
  request('http://maps.googleapis.com/maps/api/geocode/json?address=' + req.params.postal_code, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var array = JSON.parse(body);
      var locationDetails = {};
      locationDetails.userId = req.params.userId;
      locationDetails.postal_code = req.params.postal_code;
      if (array && array.results[0] && array.results[0].address_components) {
        async.each(array.results[0].address_components, function(data, callback) {
          if (data.types[0] === "administrative_area_level_1") {
            locationDetails.state = data.long_name;
          }
          if (data.types[0] === "country") {
            locationDetails.country = data.short_name;
          }
          if (data.types[0] === "locality") {
            locationDetails.city = data.long_name;
          }
          callback(null);
        }, function(err) {
          if (err) {} else {
            donorService.saveDonorLocation(locationDetails, function(err, data) {
              if (err) {} else {
                var resObject = {};
                resObject.data = data;
                resObject.status = 'success';
                utility.dataHandler(resObject, res);
              }
            });
          }
        });
      } else {
        var resObject = {};
        resObject.status = 'fail';
        utility.dataHandler(resObject, res);
      }
    } else {}
  });
});
//getSingleGivingLevel/'+attrs.givingId



donorRoute.get('/fundraiser/:codeid/details', function(req, res, next) {

  donorService.getFundraiserCampaignDetails(req.params.codeid, function(err, data) {
    console.log(err);
    if (err) {
      /*utility.log('error', "curentTrendingCampains in donor services from donor route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);*/
    } else {
      /*utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campaigns, done, In donors route"]);*/
      var resObject = {};
      resObject.campaignInfo = data[0];
      res.send(resObject);
    }
  });
});

donorRoute.get('/:type/:id/list', function(req, res, next) {

  var obj = req.params;
  var logsObj = req.logsObj;
  donorService.donorsList(obj, function(err, data) {
    console.log(err);
    if (err) {
      logsObj.error = err;
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});


module.exports = donorRoute;
