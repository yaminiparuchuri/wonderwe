var express = require('express');
var transRoute = express.Router();
var transService = require('../services/transaction');

transRoute.use('/*', function(req, res, next) {
  utility.log('info', "In Transaction Router");
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
 * @api {post} /transaction/filter/dates Filter transaction dates
 * @apiName  Transaction date
 * @apiGroup Transaction
 * @apiParamExample {json} Request-Example:
 *
 *    "charityId":1500579,
 *    "fromDate":"2014-01-01",
 *    "toDate":"2014-12-31"
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "transaction_date": "2014-10-19T18:27:21.000Z",
 *           "Total_Filter_AS": 20250
 *       }
 *   ]
 *}
 *
 */
transRoute.post('/filter/dates', function(req, res, next) {

  var data = req.body;

  async.series({
    validation: function(callback) {
      validationController.transInfoOfDates(data, callback);
    },
    data: function(callback) {
      transService.transObject(data, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      utility.dataHandler(result, res);
    }

  });

});


/**
 * @api {post} /transaction/filter/year Filter transaction for year
 * @apiName  Transaction for year
 * @apiGroup Transaction
 * @apiParamExample  Request-Example:
 *
 *   "charityId":1500337,
 *   "year":2014
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "as_donations_yearly": 3351,
 *           "as_donors_yearly": 4
 *       },
 *       {
 *           "as_donations_yearly": 120450,
 *           "as_donors_yearly": 4
 *       }
 *  ]
 *}
 *
 */


transRoute.post('/filter/year', function(req, res, next) {

  var data = req.body;
  async.series({
    validation: function(callback) {
      validationController.transYearInfo(data, callback);
    },
    data: function(callback) {
      transService.transObjectOfYear(data, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      utility.dataHandler(result, res);
    }

  });

});

/* @api {post} /transaction/filter/year Filter transaction for month
 * @apiName  Transaction for month
 * @apiGroup Transaction
 * @apiParamExample  Request-Example:
 *
 *   "charityId":1500337,
 *   "year":2014
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   {
 *   "status": "success",
 *    "data": [
 *        {
 *            "as_donations_montly": 1351,
 *            "as_donors_montly": 3
 *        },
 *        {
 *            "as_donations_montly": 1000,
 *            "as_donors_montly": 1
 *        }
 *    ]
 *}
 *@apiErrorExample {json} Error-Response:
 *
 *     {
 *   "status": "error",
 *   "error": {
 *       "year": [
 *           "Year can't be blank"
 *       ],
 *       "flag": 400
 *   }
 *}
 *
 */



transRoute.post('/filter/month', function(req, res, next) {

  var data = req.body;
  async.series({
    validation: function(callback) {
      validationController.transYearInfo(data, callback);
    },
    data: function(callback) {
      transService.transObjectOfMonth(data, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      utility.dataHandler(result, res);
    }

  });

});



transRoute.post('/filter/week', function(req, res, next) {

  var data = req.body;
  async.series({
    validation: function(callback) {
      validationController.transYearInfo(data, callback);
    },
    data: function(callback) {
      transService.transObjectOfWeek(data, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      utility.dataHandler(result, res);
    }

  });

});


transRoute.post('/filter/today', function(req, res, next) {

  var data = req.body;
  async.series({
    validation: function(callback) {
      validationController.transYearInfo(data, callback);
    },
    data: function(callback) {
      transService.transObjectOfToday(data, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      utility.dataHandler(result, res);
    }

  });

});

/**
 * @api {get} /transaction/activesummary/year/:charityId/:year Get activesummary details
 * @apiName  Get activesummary details
 * @apiGroup Transaction
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
 *    "data": [
 *       {
 *           "AS_Donations_Yearly": 1290,
 *           "AS_Donors_Yearly": 6,
 *           "AS_New_Followers_Yearly": 12
 *       }
 *   ]
 *}
 */

transRoute.get('/activesummary/year/:charityId/:year', function(req, res, next) {
  var charityId = req.params.charityId;
  var year = req.params.year;
  var obj = {};
  obj.charityId = charityId;
  obj.year = year;
  async.series({
    validation: function(callback) {
      validationController.activeYearSummary(obj, callback);
    },
    data: function(callback) {
      transService.activeSummaryYearly(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      utility.dataHandler(result, res);
    }
  });
});

/**
 * @api {get} /transaction/campains/breakdown/:charityId Get campains breakdown
 * @apiName  Get campains breakdown
 * @apiGroup Transaction
 * @apiParamExample {json} Request-Example:
 *     {
 *       "charity_id": 1500432
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "event_pie": 1225,
 *           "ongoing_pie": 65,
 *           "campaign_pie": null
 *       }
 *   ]
 *}
 */




transRoute.get('/campains/breakdown/:charityId', function(req, res, next) {
  var charityId = req.params.charityId;
  async.series({
    /*validation : function(callback) {
     validationController.activeYearSummary(charityId, callback);
     },*/
    data: function(callback) {
      transService.campainsBreakdownYearly(charityId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.log('error', "campainsBreakdownYearly in transaction services from transaction route - " + req.cookies.logindonorid);
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get campains breakdown, done, In transaction route"]);
      utility.dataHandler(result, res);
    }
  });
});

/**
 * @api {get} /transaction/summary/breakdown/:charityId/:year Get summary breakdown details
 * @apiName  Get summary breakdown details
 * @apiGroup Transaction
 * @apiParamExample {json} Request-Example:
 *     {
 *       "user_id": 413
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *   "status": "success",
 *   "data": [
 *       {
 *           "Month": 1,
 *           "Donations": 1,
 *           "Count_of_Codes": 1
 *       },
 *       {
 *           "Month": 2,
 *           "Donations": 2,
 *           "Count_of_Codes": 1
 *       },
 *       {
 *           "Month": 3,
 *           "Donations": 5,
 *           "Count_of_Codes": 4
 *       },
 *       {
 *           "Month": 4,
 *           "Donations": 8,
 *           "Count_of_Codes": 6
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *    {
 *   "status": "error",
 *   "error": {
 *       "charityId": [
 *           "Charity id is not a number"
 *       ],
 *       "flag": 400
 *   }
 *}
 */

transRoute.get('/summary/breakdown/:charityId/:year', function(req, res, next) {
  var obj = {};
  obj.charityId = req.params.charityId;
  obj.year = req.params.year;
  async.series({
    validation: function(callback) {
      validationController.activeYearSummary(obj, callback);
    },
    data: function(callback) {
      transService.summaryBreakdownYearly(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "validateUserId in validationController from transaction route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "summaryBreakdownYearly in transaction services from transaction route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get summary breakdown, done, In transaction route"]);
      utility.dataHandler(result, res);
    }
  });
});

/**
 * @api {get} /transaction/totals/:charityId Get yearly breakdown details for charity
 * @apiName  Get summary breakdown details
 * @apiGroup Transaction
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
 *           "Total_Donations": 1740,
 *           "Total_Donors": 7,
 *           "Total_Avg": 249
 *       }
 *   ]
 *  }
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

transRoute.post('/offline/donation/adding', function(req, res, next) {
  var donationObject = req.body;
  var createdDate = moment().toDate()
  donationObject.created_date = moment(createdDate).format('YYYY-MM-DD HH:mm:ss');
  async.series({
    /*validation: function(callback) {
      validationController.paramExistsAndNumber({
        charityId: charityId
      }, callback);
    },*/
    data: function(callback) {
      transService.addOfflineTransactions(donationObject, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "paramExistsAndNumber in validationController from transaction route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "totalsBreakdownYearly in transaction services from transaction route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get totals breakdown, done, In transaction route"]);
      utility.dataHandler(result, res);
    }
  });
});

transRoute.get('/totals/:charityId', function(req, res, next) {
  var charityId = req.params.charityId;
  async.series({
    validation: function(callback) {
      validationController.paramExistsAndNumber({
        charityId: charityId
      }, callback);
    },
    data: function(callback) {
      transService.totalsBreakdownYearly(charityId, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "paramExistsAndNumber in validationController from transaction route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "totalsBreakdownYearly in transaction services from transaction route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get totals breakdown, done, In transaction route"]);
      utility.dataHandler(result, res);
    }
  });
});

transRoute.get('/offline/donations/:Id', function(req, res, next) {
  var obj={};
  obj.Id = req.params.Id;
  obj.type=req.query.type;
  async.series({
    /*validation: function(callback) {
      validationController.paramExistsAndNumber({
        charityId: charityId
      }, callback);
    },*/
    data: function(callback) {
      transService.getOfflineDonations(obj, callback);
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        utility.log('error', "paramExistsAndNumber in validationController from transaction route - " + req.cookies.logindonorid);
      } else {
        utility.log('error', "totalsBreakdownYearly in transaction services from transaction route - " + req.cookies.logindonorid);
      }
      utility.appErrorHandler(err, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get totals breakdown, done, In transaction route"]);
      utility.dataHandler(result, res);
    }
  });
});

module.exports = transRoute;
