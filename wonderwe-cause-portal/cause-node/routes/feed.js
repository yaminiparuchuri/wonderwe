var express = require('express');
var feedRouter = express.Router();
var feedServices = require('../services/feed');
var os = require("os");

feedRouter.use('/*', function(req, res, next) {
  utility.log('info', 'In Feed Router');
  var logsObj = req.logsObj;
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
 * @api {post} /feed/ Post Feed
 * @apiName  Post feed
 * @apiGroup feed
 * @apiParamExample  Request-Example:
 *
 *    "entity_id":3806638 ,
 *    "city" : "Cansas",
 *    "state":"FL",
 *    "content":"jchcmkw",
 *    "status_type":"post",
 *    "image_url"  : null
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *   "status": "success",
 *   "data": {
 *       "entity_id": 3806638,
 *       "city": "Cansas",
 *       "state": "FL",
 *       "content": "jchcmkw",
 *       "status_type": "post",
 *       "image_url": null,
 *       "ip_address": "127.0.0.1",
 *       "hostname": "scriptbees",
 *       "date_deleted": null,
 *       "deleted_by": null,
 *       "date_posted": "2015-04-23 09:04:07"
 *   }
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *    "status": "error",
 *    "error": {
 *        "code": "ER_TRUNCATED_WRONG_VALUE",
 *        "errno": 1292,
 *        "sqlState": "22007",
 *        "index": 0
 *    }
 *}
 */

feedRouter.post('/', function(req, res, next) {
  var feedObject = req.body;
  feedObject.ip_address = req.ip;
  feedObject.hostname = req.hostname;
  feedObject.date_deleted = null;
  feedObject.deleted_by = null;
  var time = require('time');
  var t = new Date();
  var tz = new time.Date(0, 'UTC');
  var logsObj = req.logsObj;
  feedObject.date_posted = moment(t).add('minutes', t.getTimezoneOffset() - tz.getTimezoneOffset()).toDate();

  async.series({
    /*validation : function(callback) {
     validationController.postFeed(feedObject, callback);
     },*/
    data: function(callback) {
      feedServices.postFeed(feedObject, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Post feed, done, In feed route"]);
      utility.dataHandler(result, res);
    }

  });
});
/**
 * [description]
 * @param  {[type]} req           [description]
 * @param  {[type]} res           [description]
 * @param  {[type]} next)         {               async.series({                 data: function(callback) {                                        feedServices.getPostData(req.params.postId, callback);                        }     } [description]
 * @param  {[type]} function(err, result)       {                   if (err) {                               loggermessage(req, "error", err, "");                                                           appErrorHandler(err, res);                   } else {      dataHandler(result, res);    }  });} [description]
 * @return {[type]}               [description]
 */
feedRouter.get('/:postId', function(req, res, next) {
  async.series({
    /*getEntity : function(callback) {

    },*/
    data: function(callback) {
      feedServices.getPostData(req.params.postId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get post data, done, In feed route"]);
      utility.dataHandler(result, res);
    }
  });
});

/**
 * @api {get} /feed/list/:userId Get Feed data
 * @apiName  Get Feed
 * @apiGroup feed
 * @apiParamExample {json} Request-Example:
 *     {
 *       "user_id": 122
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "entity_id": 3806597,
 *           "entity_type": "charity",
 *          "poster_id": 1500337,
 *           "update_id": 2439,
 *           "in_reply_id": null,
 *           "original_entity_id": null,
 *           "date_posted": "2015-04-23T02:34:05.000Z",
 *           "content": "just posting post from header and trying to check with an image",
 *           "image": "https://wonderwe.s3.amazonaws.com/profile/ff228467-0572-4a17-8ba7-375d7a5e0f95-screenshot_2015-04-16-22-24-32png.png",
 *           "status_type": "post"
 *       },
 *       {
 *           "entity_id": 3806597,
 *           "entity_type": "charity",
 *           "poster_id": 1500337,
 *           "update_id": 2438,
 *           "in_reply_id": null,
 *           "original_entity_id": null,
 *           "date_posted": "2015-04-23T00:34:38.000Z",
 *           "content": "#childlabour",
 *           "image": null,
 *           "status_type": "post"
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *   "status": "error",
 *   "error": {
 *       "code": "ER_SP_UNDECLARED_VAR",
 *       "errno": 1327,
 *       "sqlState": "42000",
 *       "index": 0
 *   }
 *}
 */
//view feed
feedRouter.get('/list/:userId/:skip', function(req, res, next) {
  var obj = {};
  var logsObj = req.logsObj;
  obj.userId = req.params.userId;
  obj.skip = req.params.skip;
  async.series({
    /*validation : function(callback) {
     validationController.commonParamExistsAndNumber(obj, callback);
     },*/
    data: function(callback) {
      feedServices.viewFeed(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get View Feed, done, In feed route"]);
      utility.dataHandler(result, res);
    }

  });
});

/**
 * @api {delete} /feed/:feedId Delete Feed
 * @apiName  Delete Feed
 * @apiGroup feed
 * @apiParamExample {json} Request-Example:
 *     {
 *       "feed_id": 122
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": {
 *       "fieldCount": 0,
 *       "affectedRows": 1,
 *       "insertId": 0,
 *       "serverStatus": 2,
 *       "warningCount": 0,
 *       "message": "",
 *       "protocol41": true,
 *       "changedRows": 0
 *   }
 *}
 *
 * @apiErrorExample {json} Error-Response:
 *
 *     {
 *    "status": "error",
 *   "error": {
 *       "id": [
 *           "Id is not a number"
 *       ],
 *       "flag": 400
 *   }
 *}
 */

feedRouter.delete('/:feedId', function(req, res, next) {

  var feedId = req.params.feedId;
  var entityid = req.query.entityId;
  var replyId = req.query.ReplyId;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.commonParamExistsAndNumber(feedId, callback);
    },
    data: function(callback) {
      feedServices.deleteFeed(feedId, replyId, entityid, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "delete feed, done, In feed route"]);
      utility.dataHandler(result, res);
    }

  });
});

/**
 * @api {get} /feed/charity/:urlslug/followers Get Charity Followers
 * @apiName  Get charity followers
 * @apiGroup feed
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
 *           "charity_id": 3806692,
 *           "entity_id": 3806692,
 *           "url": 3,
 *           "display_name": "Dominic Ismert",
 *           "user_id": 3,
 *           "profile_pic_thumb_url": "https://wonderwe.s3.amazonaws.com/150x150/profile/6ecc0e13-b879-4096-aade-0d7317e59364.jpeg",
 *           "city": "Kansas City",
 *           "state": "MO",
 *           "description": "I am a person. As a person, I have skin and bones and eyes and stuff. These things hold me together while I walk and pretend that I know what I am doing. "
 *       },
 *       {
 *           "charity_id": 3806692,
 *           "entity_id": 3806692,
 *           "url": 5,
 *           "display_name": "Dominic Ismert",
 *           "user_id": 5,
 *           "profile_pic_thumb_url": null,
 *           "city": "Kansas City",
 *           "state": "MO",
 *           "description": "Integer id orci faucibus, finibus erat sed, dignissim diam."
 *       }
 *   ]
 *}
 */

feedRouter.get('/charity/:urlslug/followers', function(req, res, next) {
  var urlSlug = req.params.urlslug;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.commonParamExistsAndString(urlSlug, callback);
    },
    data: function(callback) {
      feedServices.retrieveCharityFollowers(urlSlug, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get charity followers, done, In feed route"]);
      utility.dataHandler(result, res);
    }

  });
});

feedRouter.post('/update', function(req, res, next) {
  var obj = req.body;
  async.series({
    validation: function(callback) {
      validationController.updatePostValidation(obj, callback);
    },
    data: function(callback) {
      feedServices.updatePost(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "update post feed, done, In feed route"]);
      utility.dataHandler(result, res);
    }
  });
});



/**
 * @api {get} /feed/mentions/:charityId Get Mentions for Charity
 * @apiName  Get Mentions for Charity
 * @apiGroup feed
 * @apiParamExample {json} Request-Example:
 *
 * {
 *  "Charity_id" : 1500432
 * }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *   "status": "success",
 *   "data": [
 *       {
 *           "mention_id": 3,
 *           "mention_name": "Dominic Ismert",
 *           "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/6ecc0e13-b879-4096-aade-0d7317e59364.jpeg",
 *           "post_id": 2313,
 *           "entity_id": 3807107,
 *           "entity_type": "user",
 *           "content": " Test pic @user"
 *       }
 *   ]
 *}
 *
 *
 *
 */
//For Getting All Mentions
feedRouter.get('/mentions/:entityId/:skip/:followers', function(req, res, next) {
  var obj = {};
  var logsObj = req.logsObj;
  obj.entityId = req.params.entityId;
  obj.skip = req.params.skip;
  obj.followers = req.params.followers;

  async.series({
    /*getEntity : function(callback) {

    },*/
    data: function(callback) {
      feedServices.getEntityMentions(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get entity mentions, done, In feed route"]);
      utility.dataHandler(result, res);
    }
  });
});




/**
 * @api {get} /feed/mentions/:charityId Get Mentions for Charity
 * @apiName  Get Mentions for Charity
 * @apiGroup feed
 * @apiParamExample {json} Request-Example:
 *
 * {
 *  "Postid" = 2313
 * }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *   "status": "success",
 *   "data": [
 *       {
 *           "mention_id": 1500432,
 *           "mention_name": "E3KIDS INTERNATIONAL ",
 *           "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/b23843e6-1d75-4c4f-a0b8-5d160a3ab7b9-e3_logojpg.jpg",
 *           "post_id": 2554,
 *           "entity_id": 3806692,
 *           "entity_type": "charity",
 *           "content": "replu to the rwtweet",
 *           "image_url": ""
 *       },
 *       {
 *           "mention_id": 1500432,
 *           "mention_name": "E3KIDS INTERNATIONAL ",
 *           "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/b23843e6-1d75-4c4f-a0b8-5d160a3ab7b9-e3_logojpg.jpg",
 *           "post_id": 2555,
 *           "entity_id": 3806692,
 *           "entity_type": "charity",
 *           "content": "replu to the rwtweet once a gain",
 *           "image_url": ""
 *       }
 *   ]
 *}
 *
 */


//ree

//For Getting Retweets For The Post
feedRouter.get('/mentions/prev/retweets/:postId', function(req, res, next) {
  var postId = req.params.postId;
  var logsObj = req.logsObj;
  async.series({
    /*validation:function(callback){
      validationController.mentionsPostId(postId,callback);
    },*/
    data: function(callback) {
      feedServices.getAllPreviousReTweets(postId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get all previous retweets mentions, done, In feed route"]);
      utility.dataHandler(result, res);
    }
  });
});

/**
 * @api {get} /feed/mentions/prev/replys/:postId Get replys for Mentions
 * @apiName  Get replys for Mentions
 * @apiGroup feed
 * @apiParamExample {json} Request-Example:
 *
 * {
 *  "Postid" : 2313
 * }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *   "status": "success",
 *   "data": [
 *       {
 *           "mention_id": 1500432,
 *           "mention_name": "E3KIDS INTERNATIONAL ",
 *           "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/b23843e6-1d75-4c4f-a0b8-5d160a3ab7b9-e3_logojpg.jpg",
 *           "post_id": 2565,
 *           "entity_id": 3806692,
 *           "entity_type": "charity",
 *           "content": "reply for the Post One",
 *           "image_url": ""
 *       },
 *       {
 *           "mention_id": 1500432,
 *           "mention_name": "E3KIDS INTERNATIONAL ",
 *           "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/b23843e6-1d75-4c4f-a0b8-5d160a3ab7b9-e3_logojpg.jpg",
 *           "post_id": 2566,
 *           "entity_id": 3806692,
 *           "entity_type": "charity",
 *           "content": "",
 *           "image_url": ""
 *       },
 *       {
 *           "mention_id": 1500432,
 *           "mention_name": "E3KIDS INTERNATIONAL ",
 *           "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/b23843e6-1d75-4c4f-a0b8-5d160a3ab7b9-e3_logojpg.jpg",
 *           "post_id": 2567,
 *           "entity_id": 3806692,
 *           "entity_type": "charity",
 *           "content": "reply to the post",
 *           "image_url": ""
 *       }
 *   ]
 *}
 *
 */
feedRouter.get('/comments/:postId', function(req, res, next) {
  var postId = req.params.postId;
  var logsObj = req.logsObj;
  async.series({
    /*validation:function(callback){
     validationController.mentionsPostId(postId,callback);
     },*/
    data: function(callback) {
      feedServices.getAllPreviousReplys(postId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get all previous replys, done, In feed route"]);
      utility.dataHandler(result, res);
    }
  });
});
//Will take the Logged In UserID as well and check
feedRouter.get('/reposts/:postId', function(req, res, next) {
  var postId = req.params.postId;
  var logsObj = req.logsObj;
  async.series({
    /*validation:function(callback){
     validationController.mentionsPostId(postId,callback);
     },*/
    data: function(callback) {
      feedServices.getAllPreviousReTweets(postId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get all previous retweets, done, In feed route"]);
      utility.dataHandler(result, res);
    }
  });
});

//

//For Getting Replys For The Post
feedRouter.get('/mentions/prev/replys/:postId', function(req, res, next) {
  var postId = req.params.postId;
  var logsObj = req.logsObj;
  async.series({
    /*validation:function(callback){
     validationController.mentionsPostId(postId,callback);
     },*/
    data: function(callback) {
      feedServices.getAllPreviousReplys(postId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get all previous replys mentions, done, In feed route"]);
      utility.dataHandler(result, res);
    }
  });
});



/**
 * @api {post} /feed/mentions/insert/retweet Get Mentions for Charity
 * @apiName  Get Mentions for Charity
 * @apiGroup feed
 * @apiParamExample Request-Example:
 *
 *
 *   "in_reply_id": "188",
 *   "entity_id": null,
 *   "date_posted": "2015-04-27 04:39:34",
 *   "ip_address": null,
 *   "hostname": null,
 *   "city": "hyd",
 *   "state": "TS",
 *   "content": "Hai naren",
 *   "status_type": "post",
 *   "image_url": null
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *   "status": "success",
 *   "data": {
 *       "in_reply_id": "188",
 *       "entity_id": null,
 *       "date_posted": "2015-04-27 16:50:35",
 *       "ip_address": "127.0.0.1",
 *       "hostname": "scriptbees",
 *       "city": "hyd",
 *       "state": "TS",
 *       "content": "Hai naren",
 *       "status_type": "post",
 *       "image_url": null,
 *       "date_deleted": null,
 *       "deleted_by": null
 *   }
 *}
 * @apiErrorExample {json} Error-Response:
 *{
 *   "status": "error",
 *   "error": {
 *       "code": "ER_BAD_NULL_ERROR",
 *       "errno": 1048,
 *       "sqlState": "23000",
 *       "index": 0,
 *       "location": "insertRetweet....1..routes/feed.js ,"
 *   }
 *}
 */



//For Inserting New Retweet For The Post
feedRouter.post('/mentions/insert/retweet', function(req, res, next) {
  var obj = req.body;
  obj.ip_address = req.ip;
  obj.hostname = os.hostname();
  obj.date_deleted = null;
  obj.deleted_by = null;
  var time = require('time');
  var t = new Date();
  var tz = new time.Date(0, 'UTC');
  var logsObj = req.logsObj;
  obj.date_posted = moment(t).add('minutes', t.getTimezoneOffset() - tz.getTimezoneOffset()).toDate();
  async.series({
    /*validation:function(callback){
      validationController.validateRetweetPost(obj,callback);
    },*/
    data: function(callback) {
      feedServices.insertRetweetPost(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "insert retweet post, done, In feed route"]);
      utility.dataHandler(result, res);
    }
  });
});




/**
 * @api {post} /feed/mentions/inset/reply Get Mentions for Charity
 * @apiName  Get Mentions for Charity
 * @apiGroup feed
 * @apiParamExample  Request-Example:
 *
 *
 *  "in_reply_id": "188",
 *  "entity_id": null,
 *  "date_posted": "2015-04-27 04:39:34",
 *  "ip_address": null,
 *  "hostname": null,
 *  "city": "hyd",
 *  "state": "TS",
 *  "content": "Hai naren",
 *  "status_type": "post",
 *  "image_url": null
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *   "status": "success",
 *   "data": {
 *       "in_reply_id": "188",
 *       "entity_id": null,
 *       "date_posted": "2015-04-27 16:54:24",
 *       "ip_address": "127.0.0.1",
 *       "hostname": "scriptbees",
 *       "city": "hyd",
 *       "state": "TS",
 *       "content": "Hai naren",
 *       "status_type": "post",
 *       "image_url": null,
 *       "date_deleted": null,
 *       "deleted_by": null,
 *       "parentPostId": "188",
 *       "post_id": 2700
 *   }
 *}
 *
 *@apiErrorExample {json} Error-Response:
 *
 *{
 *"status": "error",
 *"error": {
 *"code": "ER_BAD_NULL_ERROR",
 *"errno": 1048,
 *"sqlState": "23000",
 *"index": 0,
 *"location": "Inser Reply For the Post....1..routes/feed.js ,"
 *}
 *}
 */



//For Inserting Reply For The Post
feedRouter.post('/mentions/inset/reply', function(req, res, next) {
  var obj = req.body;
  obj.ip_address = req.ip;
  obj.hostname = os.hostname();
  obj.date_deleted = null;
  obj.deleted_by = null;
  var time = require('time');
  var t = new Date();
  var tz = new time.Date(0, 'UTC');
  var logsObj = req.logsObj;
  obj.date_posted = moment(t).add('minutes', t.getTimezoneOffset() - tz.getTimezoneOffset()).toDate();
  async.series({
    /*validation:function(callback){
      validationController.validateReplyPost(obj,callback);
    },*/
    data: function(callback) {
      feedServices.insertReplyPost(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Insert reply post, done, In feed route"]);
      utility.dataHandler(result, res);
    }
  });
});

//For @Tag Data List


/**
 * @api {get} /feed/users/list Get users list
 * @apiName  Get users list
 * @apiGroup feed
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *   "status": "success",
 *   "data": [
 *       {
 *           "image": null,
 *           "suggestedname": "Venkat Dulipalli",
 *           "suggestid": 65,
 *           "type": "user"
 *       },
 *       {
 *           "image": "http://www.guidestar.org/ViewEdoc.aspx?eDocId=1786664&approved=true",
 *           "suggestedname": "NEWCOVENANT EVANGELISTIC MINISTRIES ",
 *           "suggestid": 1145429,
 *           "type": "charity"
 *       }
 *   ]
 *}
 *
 *
 *
 */

feedRouter.get('/users/list', function(req, res, next) {
  feedServices.getUsersForMentions(function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get users for mentions, done, In feed route"]);
      utility.dataHandler(resObject, res);
    }
  });
});

feedRouter.get('/postandreplies/:entityId/:skip/:followers', function(req, res, next) {

  var obj = {};
  obj.entityId = req.params.entityId;
  obj.skip = req.params.skip;
  obj.followers = req.params.followers;
  var logsObj = req.logsObj;
  async.series({
    /*validation : function(callback) {
    validationController.commonParamExistsAndNumber(obj, callback);
    },*/
    data: function(callback) {
      //feedServices.postAndReplies(obj, callback);
      feedServices.commonFeed(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {


      /*async.each(result.data, function(item, eachCallback) {

        var re = /(((http|https|ftp|ftps)\:\/\/)|www\.)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?/g;
        var m;
        m = re.exec(item.content);
        var options = {
          'url': m[0]
        };
        if (m[0].indexOf(props.domain) > -1) {
          var firstIndex = props.domain.length + 1;
          var lastIndex = m[0].indexOf('>');
          var mentionedSlug = m[0].substring(firstIndex, lastIndex);
          pool.query('select * from entity_tbl where slug =?', [mentionedSlug], function(err, result) {
            if (err) {
              eachCallback(null);
            } else {
              if (result && result.length > 0) {
                var type = result[0].entity_type;
                if (type === 'code') {
                  pool.query('select * from code_tbl where id =?', [result[0].entity_id], function(err, result1) {
                    item.content = item.content + '<a class="col-sm-6 col-md-12 js-viewCampaign" style="padding-left:0px;color: white" data-slug="' + result[0].slug + '"><div data-slug="' + result[0].slug + '" class="profile-card new-campaign-card"><div class="campaign-bg" data-slug="' + result[0].slug + '" style="background-image:url(' + result1[0].code_picture_url + ')"></div><div class="card-container" data-slug="' + result[0].slug + '"><div class="campaign-info" data-slug="' + result[0].slug + '"><div class="top-card" data-slug="' + result[0].slug + '"><h4 style="color:white">' + result1[0].title + ' (We#' + result1[0].code_text + ')</h4><a class="btn btn-subtle col-sm-1 js-campaignMentionDonation"  data-slug="' + result[0].slug + '" data-loading-text="Loading..." style="float:right;margin-top: -20px;">Donate</a></div></div></div></div></a>';
                    eachCallback(null);
                  });
                } else {
                  eachCallback(null);
                }
              } else {
                eachCallback(null);
              }
            }
          });
        } else {
          var contentFinal = item.content.replace(re, function(url) {
            var url1 = url;
            var a = url;
            if (a.indexOf(props.domain) > -1) {
              //return true;
              return re
                //return '<div class="js-viewCampaign profile-card new-campaign-card" data-slug="' + mentionObj.slug + '"><div class="campaign-bg" data-slug="' + mentionObj.slug + '" style="background-image:url(' + mentionObj.image + ')"></div><div class="card-container"><div class="campaign-info"><div class="campaignText"><a href="' + href + '"><h4>' + mentionObj.title + '</h4><p>We#' + mentionObj.suggestedname + '</p></a></div><div class="campaignAction"><button class="btn btn-subtle js-campaignMentionDonation"  data-slug="' + mentionObj.slug + '" data-loading-text="Loading..." data-codeid="' + mentionObj.suggestid + '" href="#">Donate</button></div></div></div></div>'
            } else {
              if (!/^(f|ht)tps?:\/\//i.test(url1)) {
                url1 = "http://" + url1;
              }
              if (url1) {
                return '<a href="' + url1 + '">' + url + '</a>';
              } else {
                return '<a href="' + url + '">' + url + '</a>';
              }
            }
          });
          item.content = contentFinal;
          var list = ogs(options, function(err, results1) {
            item.urlsobj = [];
            item.urlsobj.push(results1);

            eachCallback(null);
          });
        }
      }, function(err) {*/

      utility.dataHandler(result, res);
      //});

      //Send 200 Status With Real Data

    }
  });
});




/**
 * @api {get} /feed/mentionsandreplies/:charityId/:skip Get mensitions and replys
 * @apiName  Get mensions and replies
 * @apiGroup feed
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *   "status": "success",
 *   "data": [
 *       {
 *           "mention_name": "vvchuong",
 *           "profilepic": null,
 *           "mention_id": 1,
 *           "post_id": 919,
 *           "entity_id": 3807105,
 *           "entity_type": "user",
 *           "content": "Morbi odio odio, elementum eu, interdum eu, tincidunt in, leo. We#49W",
 *           "date_post": "2014-09-26T11:06:21.000Z",
 *           "retweets": 6,
 *           "replies": [
 *               {
 *                   "mention_id": 1500337,
 *                   "mention_name": "PHYSICIANS FOR SOCIAL RESPONSIBILITY INC",
 *                   "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/35d42bf9-34f5-42d7-aee5-9163f0f84f5e-smilejpg.jpg",
 *                   "post_id": 2627,
 *                   "entity_id": 3806597,
 *                   "entity_type": "charity",
 *                   "content": "po",
 *                   "image_url": null
 *              }
 *           ]
 *       },
 *       {
 *            "mention_name": "Rick O\\'Shea",
 *           "profilepic": null,
 *           "mention_id": 2,
 *           "post_id": 798,
 *           "entity_id": 3807106,
 *            "entity_type": "user",
 *           "content": "Nam congue, risus semper porta volutpat, quam pede lobortis ligula, sit amet eleifend pede libero quis orci. Nullam molestie nibh in lectus. #hashtag",
 *           "date_post": "2014-09-26T11:06:21.000Z",
 *           "retweets": 0,
 *           "replies": [
 *               {
 *                   "mention_id": 1500337,
 *                   "mention_name": "PHYSICIANS FOR SOCIAL RESPONSIBILITY INC",
 *                   "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/35d42bf9-34f5-42d7-aee5-9163f0f84f5e-smilejpg.jpg",
 *                   "post_id": 2557,
 *                   "entity_id": 3806597,
 *                   "entity_type": "charity",
 *                   "content": "I can reply?",
 *                   "image_url": ""
 *               }
 *           ]
 *       }
 *   ]
 *}
 *
 *
 */



feedRouter.get('/mentionsandreplies/:charityId/:skip', function(req, res, next) {

  var obj = {};
  var logsObj = req.logsObj;
  obj.charityId = req.params.charityId;
  obj.skip = req.params.skip;

  async.series({
    data: function(callback) {
      feedServices.getCharityMentionsandReply(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get charity mentionsandreplies, done, In feed route"]);
      utility.dataHandler(result, res);
    }
  });
});


/**
 * @api {get} /feed/mentionsandreplies/:charityId/:skip Get mensitions and replys
 * @apiName  Get mensions and replies
 * @apiGroup feed
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *
 *   "status": "success",
 *   "data": [
 *       {
 *           "mention_id": 56,
 *           "mention_name": "orci",
 *           "code_picture_url": null,
 *           "post_id": 2313,
 *           "entity_id": 3807107,
 *           "content": " Test pic @user",
 *           "replies": [
 *               {
 *                   "mention_id": 1500432,
 *                   "mention_name": "E3KIDS INTERNATIONAL ",
 *                   "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/054179e0-8594-4cde-ba9f-3265aca67c93-ekidsjpg.jpg",
 *                   "post_id": 2565,
 *                   "entity_id": 3806692,
 *                   "entity_type": "charity",
 *                   "content": "reply for the Post One",
 *                   "image_url": ""
 *               },
 *               {
 *                   "mention_id": 1500432,
 *                   "mention_name": "E3KIDS INTERNATIONAL ",
 *                   "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/054179e0-8594-4cde-ba9f-3265aca67c93-ekidsjpg.jpg",
 *                   "post_id": 2566,
 *                   "entity_id": 3806692,
 *                   "entity_type": "charity",
 *                   "content": "",
 *                   "image_url": ""
 *               }
 *           ]
 *       }
 *   ]
 *}
 */

feedRouter.get('/code/mentionsandreplies/:codeid/:skip', function(req, res, next) {

  var obj = {};
  var logsObj = req.logsObj;
  obj.codeid = req.params.codeid;
  obj.skip = req.params.skip;

  async.series({
    data: function(callback) {
      feedServices.getCodeMentionsandReply(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get code mentionsandreplies, done, In feed route"]);
      utility.dataHandler(result, res);
    }
  });
});


feedRouter.get('/fetch/donor/mentions/:userid', function(req, res, next) {

  var userId = req.params.userid;
  var logsObj = req.logsObj;
  async.series({
    data: function(callback) {
      feedServices.getDonorMentions(userId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      utility.dataHandler(result, res);
    }
  });
});

module.exports = feedRouter;
