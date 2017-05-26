var express = require('express');
var analyticsRouter = express.Router();
var analyticsService = require('../services/analytics');

analyticsRouter.use('/*', function(req, res, next) {
  utility.tokenAuth(req, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
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
 * @api {post} /analytics/transactions Transactions
 * @apiName Transactions
 * @apiGroup analytics
 * @apiParamExample {json} Request-Example:
 *     "charityId" : 1500432,
 *     "startDate" : "2014-01-01",
 *     "endDate"   : "2015-04-04"
 *
 * @apiVersion 0.0.1
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *    "status": "success",
 *    "data": [
 *        {
 *            "transaction_id": 81,
 *            "transaction_date": 1428072658,
 *            "amount": 20,
 *            "code_id": 2563,
 *            "source": "website",
 *            "user_id": 66,
 *            "transaction_type": "code",
 *            "processing_fee": null,
 *            "wonderwe_fee": 1,
 *            "refunded_date": null,
 *            "refunded_amount": null,
 *            "name": "Lakshman"
 *        }
 *    ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *       {
 *    "status": "error",
 *    "error": {
 *        "charityId": [
 *           "Charityidisnotanumber"
 *        ],
 *        "flag": 400
 *    }
 *}
 */
analyticsRouter.post('/transactions', function(req, res, next) {
  var tranceObject = req.body;

  async.series({
    validation: function(callback) {
      validationController.validateTransactions(tranceObject, callback);
    },
    data: function(callback) {
      analyticsService.charityTransactions(tranceObject, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "validateTransactions in validationController from analytics route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "charityTransactions in analyticsService from analytics route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "charityTransactions, done, In analytics route"]);
      utility.dataHandler(result, res);
    }

  });
});

/**
 * @api {get} /analytics/statistics/:year Statistics for year
 * @apiName Statistics for year
 * @apiGroup analytics
 * @apiParamExample  Request-Example:
 *
 *       year=2014
 *
 *
 *
 * @apiVersion 0.0.1
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *    "status": "success",
 *    "data": [
 *        {
 *            "Month": "October",
 *            "Total": 132950,
 *            "Date": "2014-10-19T12:12:36.000Z",
 *            "Count": 15
 *        },
 *        {
 *            "Month": "November",
 *            "Total": 700,
 *            "Date": "2014-11-01T15:17:53.000Z",
 *            "Count": 5
 *        },
 *        {
 *            "Month": "December",
 *            "Total": 200,
 *            "Date": "2014-12-01T18:35:47.000Z",
 *            "Count": 2
 *        }
 *    ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *   {
 *    "status": "error",
 *    "error": {
 *        "statsYear": [
 *            "Stats year is not a number"
 *        ],
 *        "flag": 400
 *    }
 *}
 */
analyticsRouter.get('/statistics/:charityId', function(req, res, next) {
  var charityId = req.params.charityId;

  async.series({
    validation: function(callback) {
      validationController.validateStatistics({
        charityId: charityId
      }, callback);
    },
    data: function(callback) {
      analyticsService.charityStatistics(charityId, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "validateStatistics in validationController from analytics route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "charityStatistics in analyticsService from analytics route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "charityStatistics, done, In analytics route"]);
      utility.dataHandler(result, res);
    }

  });
});

/**
 * @api {get} /analytics/activity/list/:charityId/:year Activity list for yearwise
 * @apiName Activity list for yearwise
 * @apiGroup analytics
 * @apiParamExample {json} Request-Example:
 *     {
 *    "userId": 53042,
 *    "charityId": 4711
 *}
 *
 * @apiVersion 0.0.1
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *    "data": {
 *        "day": "day",
 *        "data": [
 *            [
 *                {
 *                    "as_donations_day": 1000,
 *                    "as_donors_day": 1
 *                }
 *            ],
 *            {
 *                "AS_New_Followers_Day": 2
 *            }
 *        ]
 *    }
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *     {
 *       "error": "Charity Id is not a number"
 *     }
 */
analyticsRouter.get('/activity/list/:charityId/:year', function(req, res, next) {
  var activityObject = {};
  activityObject.charityId = req.params.charityId;
  //req.params.charityId;
  //activityObject.year = req.params.year;
  //req.params.year;
  async.series({
    validation: function(callback) {
      validationController.validateYear(activityObject, callback);
    },
    data: function(callback) {
      analyticsService.getCharityCounts(activityObject, callback);
      //analyticsService.getAllActivityList(activityObject, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "validateYear in validationController from analytics route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "getAllActivityList in analyticsService from analytics route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "getAllActivityList, done, In analytics route"]);
      utility.dataHandler(result, res);
    }

  });
});
module.exports = analyticsRouter;
