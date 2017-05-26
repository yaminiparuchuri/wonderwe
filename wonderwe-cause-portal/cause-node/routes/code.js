var express = require('express');
var codeRouter = express.Router();
var codeService = require('../services/code');
var charityService = require('../services/charity');
var donorService = require('../services/donors');
var settingService = require('../services/settings');
var teamService = require('../services/team');
var pagesService=require('../services/pages');
var authServices = require('../services/auth');

codeRouter.use('/*', function(req, res, next) {
  var logsObj = req.logsObj;
  utility.log('info', 'In Code Router');
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
 * @api {post} /code/ Create code
 * @apiName  create code
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "user_id": 413
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "firstname": "John",
 *       "lastname": "Doe"
 *     }
 *
 * @apiErrorExample {json} Error-Response:
 *     {
 *    "status": "error",
 *    "error": {
 *        "charity_id": [
 *            "Charity id can't be blank"
 *        ],
 *        "user_id": [
 *            "User id can't be blank"
 *        ],
 *        "code_text": [
 *            "Code text can't be blank"
 *        ],
 *        "type": [
 *            "Type can't be blank"
 *        ],
 *        "suggested_donation": [
 *            "Suggested donation can't be blank"
 *        ],
 *        "title": [
 *            "Title can't be blank"
 *        ],
 *        "description": [
 *            "Description can't be blank"
 *        ],
 *        "goal": [
 *            "Goal can't be blank"
 *        ]
 *        "flag": 400
 *    }
 *}
 */
//route for claim  of system charity

codeRouter.post('/approve/forcharity',function(req,res,next){
  var codeObject=req.body.data;
  var logsObj=req.logsObj;
  async.parallel({
    addCharityClaim:function(callback){
   charityService.addCharityClaim(codeObject, function(err,result){
    if(err){
      callback(err,null);
    }else{
      callback(null,result);
    }
  });
    },
    updateCharityEin:function(callback){
      pagesService.updateCharityEin(codeObject,function(err,result){
        if(err){
         callback(err,null);
        }else{
        callback(null,result);
        }
      });
    },
    updateCharityData:function(callback){
     pagesService.systemcharitylogoupdate(codeObject,function(err,result){
     if(err){
      callback(err,null);
     }else{
      callback(null,result);
     }
     });
    }
  },function(err,result){
      var object={};
      object.data=codeObject;
      utility.dataHandler(object,res);
  });
});

codeRouter.post('/', function(req, res, next) {
  var codeObject = req.body;
  var logsObj = req.logsObj;

  var addClaim;
  console.log(req.body);
  codeObject.original_ip = req.ip;
  codeObject.original_device = req.hostname;

  utility.nodeLogs('INFO', 'Before validation');
  async.series({
    validation: function(callback) {
      validationController.validateCreateCode(codeObject, callback);
    },
    getCodeStatus: function(callback) {
      //codeObject.individual null indicates campaign for organization (charity or Non profit)
      utility.log('INFO', 'Before getting the status of code');
      if (codeObject.individual === null || codeObject.individual === 'no') {
        codeService.getCodeStatusFromCharity(codeObject.charity_id, function(err, result) {
          if (err) {
            callback(new Error(JSON.stringify({ errors: ['Validation failed in setting status of the campaign'], status: 400 })), null);
          } else {
            codeObject.status = result.code_status;
            if (result.charity_status === 'NOT_CLAIMED' && codeObject.addClaim) {
              codeObject.charity_status = 'PENDING';
              addClaim = true;
            }
            utility.nodeLogs('INFO', 'Code status:' + result.status);
            callback(null, true);
          }
        });
      } else {
        codeObject.status = 'published';
        callback(null, true);
      }
    },
    addCharityClaim: function(callback) {
      //Checking that is the campaign for non profit or for a person based on individual
      //codeObject.addClaim is true indicates whether we need to claim to charity or not

      if ((codeObject.individual === null) && codeObject.addClaim) {
        utility.nodeLogs('INFO', 'In creating claim');
        codeObject.charity_status = 'PENDING';
        if (codeObject.wePayEmailData) {
          console.log(codeObject.wePayEmailData);
          codeObject.from = "person"
          codeService.addWePayEmail(codeObject, callback);
        } else {
          charityService.addCharityClaim(codeObject, callback);
        }
      } else {
        callback(null, true);
      }
    },
    data: function(callback) {
      delete codeObject.user_email;
      delete codeObject.addClaim;
      utility.nodeLogs('INFO', 'In creating code');
      codeService.createCode(codeObject, logsObj, callback);
    }
  }, function(err, result) {
    if (err) {
      console.log('In the error');
      console.log(err);
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      console.log('Add claim', addClaim);
      if (addClaim) {
        utility.log('INFO', 'In add claim true');
        result.data.addClaim = true;
      }
      utility.dataHandler(result, res);
      logsObj.message = "Campaign created successfully.";
      logsObj.action = "Campaign Created successflly -- code Router : 96";
      utility.nodeLogs('INFO', logsObj);
    }
  });
});

/**
 * @api {get} /code/get/:id Get codedata
 * @apiName  Get codedata
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "id": 56
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *
 *   "status": "success",
 *   "data": [
 *       {
 *           "id": 56,
 *           "parent_code_id": null,
 *           "charity_id": 1500452,
 *           "category_id": 2210,
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
 *           "code_picture_url": null
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *     {
 *   "status": "error",
 *   "error": {
 *       "codeId": [
 *           "Code id is not a number"
 *       ],
 *       "flag": 400
 *   }
 *}
 */

codeRouter.post('/getcampaignmacrostats', function(req, res, next) {
  var logsObj = req.logsObj;
  var obj = {}
  obj.campaignMacro = req.body.filter;
  if (req.body.customDateObj) {
    obj.customDateObj = req.body.customDateObj;
  }

  console.log(req.body);
  //console.log(campaignMacro);
  codeService.getCampaignMacro(obj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      console.log("resuly");
      console.log(result);
      var resData = {};
      resData.data = result;
      res.send(resData);
    }
  });
});
codeRouter.get('/getcharitydata/:charityId', function(req, res, next) {
  var logsObj = req.logsObj;
  var charityId = req.params.charityId;
  codeService.getCharityData(charityId, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      var resData = {};
      resData.data = result;
      res.send(resData);
    }
  });
});
codeRouter.get('/event/:eventId', function(req, res, next) {
  var logsObj = req.logsObj;
  var eventId = req.params.eventId;
  codeService.getEventData(eventId, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);

    } else {
      var resData = {};
      resData.data = result;
      res.send(resData);
    }
  });


});
codeRouter.get('/getallusercampaigns/:userid', function(req, res, next) {
  var user_id = req.params.userid;
  codeService.getallusercampaigns(user_id, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);

    } else {
      console.log("result");
      console.log(result);
      var resData = {};
      resData.data = result;
      res.send(resData);
    }
  });
})
codeRouter.get('/deletedata/:userid', function(req, res, next) {
  var userid = req.params.userid;
  excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [userid], function(err, userRecord) {
    if (err) {
      utility.appErrorHandler(err, res);

    } else {
      if (userRecord && userRecord.length > 0) {
        console.log("userrecoergg....")
        console.log(userRecord)
        async.parallel({
          userDataDelete:function(userDataDeleteCallbak){
            codeService.userDataDelete(userid,userDataDeleteCallbak);
         },
          userMonthlyDonationDelete:function(userMonthlyDonationDeleteCallback){
            codeService.userMonthlyDonationDelete(userid,userMonthlyDonationDeleteCallback);
        },
        userStripeSubscriptonDelete:function(userStripeSubscriptonDeleteCallback){
          codeService.userStripeSubscriptonDelete(userid,userStripeSubscriptonDeleteCallback);
        }
      },function(err,result){
           if(err){
             utility.appErrorHandler(err, res);
           }else{
             console.log("result");
             console.log(result);
             var resData = {};
             resData.data = result;
             res.send(resData);
             if (userRecord[userRecord.length-1].provider == "facebook") {
               codeService.deAuthoriseFacebook(userRecord[userRecord.length-1], function(err, res) {
                 if (err) {
                   console.log(err)
                 } else {
                   console.log(res)
                 }
               });
             }

             authServices.moveDeletedUser(req.params.userid,function(err,result){
              if(err){
                utility.nodeLogs('ERROR',{
                  message:'Error in moving deleted user',
                  error:err,
                  user_id:userid
                });
              }else{
                utility.nodeLogs('INFO',{
                  message:'successfully moved to deleted user',
                  user_id:userid
                });
              }
             });
           }
        });
      }
    }
  });
});
codeRouter.get('/delete/:eventticketId', function(req, res, next) {
  var data = {};
  var logsObj = req.logsObj;
  data.id = req.params.eventticketId;
  if (req.query.type == "tickets") {
    data.type = "tickets";
  } else {
    data.type = "attendee";
  }
  codeService.deleteTicketData(data, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);

    } else {
      var resData = {};
      resData.data = result;
      utility.dataHandler(resData, res);
    }
  });



});
codeRouter.post('/savecustomsettings', function(req, res, next) {
  var settingsdata = req.body;
  var logsObj = req.logsObj;
  codeService.saveCustomSettingsData(settingsdata, function(err, result) {
    if (err) {} else {}

  });
});
codeRouter.post('/updatecustomsettings', function(req, res, next) {
  var settingsdata = req.body;
  var logsObj = req.logsObj;
  codeService.updateCustomSettingsData(settingsdata, function(err, result) {
    if (err) {} else {}

  });
});
//updateCustomSettings
codeRouter.get('/get/:id', function(req, res, next) {
  var codeId = req.params.id;
  var logsObj = req.logsObj;

  async.series({
    validation: function(callback) {
      validationController.validateCodeId({
        codeId: codeId
      }, callback);
    },
    data: function(callback) {
      codeService.charityCodeData(codeId, callback);
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

// list of donations
codeRouter.get('/data/donations/:codeid', function(req, res, next) {
  var codeobj = {};
  var logsObj = req.logsObj;
  codeobj.codeid = req.params.codeid;
  console.log(codeobj.codeid);
  // codeobj.codeid=req.body.codeid;
  codeService.trackingCampaignDonations(codeobj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var object = {};
      console.log(result);
      object.data = result;
      utility.dataHandler(object, res);
    }
  })
});

/**
 * @api {put} /code/:id Update charity code
 * @apiName  Update charithy code
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "user_id": 413
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *   "firstname": "John",
 *   "lastname": "Doe"
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *     {
 *       "error": "UserAlrea"
 *     }
 */
codeRouter.post('/addcustomfield', function(req, res, next) {

  codeService.addCustomField(req.body, function(err, result) {
    if (err) {

    } else {
      res.send(result);
    }
  })

})
codeRouter.post('/updateevent', function(req, res, next) {
  if (req.body.id) {
    codeService.updateEvent(req.body, function(err, result) {
      res.send(result)
    })
  }

});
codeRouter.get('/getallattendees/:eventId', function(req, res, next) {
  var obj = {};
  obj.eventId = req.params.eventId;
  codeService.getAttendees(obj, function(err, result) {
    res.send(result)
  })
})

codeRouter.get('/getallvolunteers/:eventId', function(req, res, next) {
    var obj = {};
    obj.eventId = req.params.eventId;
    codeService.getVolunteers(obj, function(err, result) {
      res.send(result)
    })
  })
  ///code/getAllAttendees/'+attrs.id
codeRouter.put('/:id', function(req, res, next) {
  var codeObject = req.body;
  var logsObj = req.logsObj;
  var codeId = req.params.id;
  if(!codeObject.suggested_donation){
    codeObject.suggested_donation=null;
  }
  async.series({
    validation: function(callback) {
      if (codeObject.flag == 'fundraise') {
        validationController.fundraiseCodeUpdate(codeObject, callback);
      } else {
        validationController.updateCharityCategoryCode(codeObject, callback);
      }
    },
    data: function(callback) {
      codeService.updateCharityCode(codeObject, codeId, logsObj, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      //      logsObj.message = "Campaign Updated successfully.";
      utility.dataHandler(result, res);
      logsObj.action = "Campaign Updated successflly -- code Router : 359";
      utility.nodeLogs('INFO', logsObj);
    }
  });
});

/**
 * @api {delete} /code/:id Delete charity code
 * @apiName  Delete charithy code
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "user_id": 413
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "firstname": "John",
 *       "lastname": "Doe"
 *     }
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "UserAlready Exists"
 *     }
 */

codeRouter.delete('/:id', function(req, res, next) {
  var userObject = req.body;
});

/**
 * @api {get} /code/:charityId Get all codes for charity
 * @apiName  Get all codes for charithy
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "charity_id": 1500452
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "id": null,
 *           "parent_code_id": null,
 *           "charity_id": null,
 *           "category_id": 2210,
 *           "user_id": null,
 *           "date_created": "2014-03-16T06:11:55.000Z",
 *           "date_deleted": null,
 *           "code_text": "eget",
 *           "type": null,
 *           "start_date": "2013-09-16T04:14:39.000Z",
 *           "end_date": "2014-01-27T05:51:51.000Z",
 *           "suggested_donation": 89.03,
 *           "title": "orci",
 *           "description": null,
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
 *           "group_donation_id": null,
 *           "transaction_date": null,
 *           "code_id": null,
 *           "amount": null,
 *           "refunded_date": null,
 *           "refunded_amount": null,
 *           "refund_transaction_id": null,
 *           "processing_fee": null,
 *           "wonderwe_fee": null,
 *           "source": null,
 *           "card_id": null,
 *           "user_ip_address": null,
 *           "withdrawal_process_date": null,
 *           "transaction_key": null,
 *           "account_id": null,
 *           "access_token": null,
 *           "charity_code_id": 56,
 *           "code_type": "event",
 *           "code_charity_id": 1500452,
 *           "donation": 0,
 *           "donation_progress": 0
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
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
codeRouter.get('/deleteadminemail/:userid/:codeid', function(req, res, next) {
  var obj = {};
  obj.userid = req.params.userid;
  obj.codeid = req.params.codeid;
  var logsObj = req.logsObj;

  codeService.deleteAdminEmail(obj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      res.send(result)
    }

  })
})
codeRouter.post('/resendAdminEmail', function(req, res, next) {
  var logsObj = req.logsObj;

  codeService.resendAdminEmail(req.body, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      console.log(result);
      var data = {};
      data.data = "success"
      res.send(data);
    }
  })
})
codeRouter.get('/editupdates/:codeid', function(req, res, next) {
  var obj = {};
  obj.codeid = req.params.codeid;
  console.log("routes")
  console.log(obj);
  var logsObj = req.logsObj;

  codeService.editCampaignUpdates(obj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      console.log(result);
      res.send(result);
    }

  })
});

codeRouter.get('/:id/currency/symbol', function(req, res) {
  var id = req.params.id;
  codeService.getCurrencySymbol(id, function(err, result) {
    if (err) {
      var logsObj = req.logsObj;
      logsObj.error = err;
      utility.appErrorHandler(err, logsObj, res);
    } else {
      utility.dataHandler({ data: result }, res);
    }
  });
});

codeRouter.get('/:charityId', function(req, res, next) {
  var charityId = req.params.charityId;
  var eventType = req.query.eventtype;
  var logsObj = req.logsObj;

  async.series({
    validation: function(callback) {
      validationController.paramExistsAndNumber({
        charityId: charityId
      }, callback);
    },
    data: function(callback) {
      codeService.getCarityCodes(charityId, eventType, callback);
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
 * @api {post} /code/category Create code category
 * @apiName  Create code category
 * @apiGroup code
 * @apiParamExample  Request-Example:
 *      "categoryObj.charityId" : 1500444,
 *      "categoryObj.title" : "SCRIPTBEES"
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": {
 *       "categoryObj.charityId": 1500444,
 *       "categoryObj.title": "SCRIPTBEES",
 *       "id": 15
 *   }
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 *     {
 *       "error": "Charity Id is not a number"
 *     }
 */

codeRouter.post('/category', function(req, res, next) {
  var categoryObj = req.body;
  var logsObj = req.logsObj;

  async.series({
    validation: function(callback) {
      validationController.validateCategory(categoryObj, callback);
    },
    data: function(callback) {
      codeService.createCodeCategory(categoryObj, callback);
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
codeRouter.put('/category/:id', function(req, res, next) {

});
codeRouter.get('/category/:id', function(req, res, next) {

});

/**
 * @api {delete} /code/category/:id Delete category
 * @apiName  Delete category
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 * {
 *   "category_id": 413
 * }
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
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
 * {
 *   "status": "error",
 *   "error": {
 *       "categoryId": [
 *           "Category id is not a number"
 *       ],
 *       "flag": 400
 *   }
 *}
 */

codeRouter.delete('/category/:id', function(req, res, next) {
  var categoryId = req.params.id;
  var logsObj = req.logsObj;

  async.series({
    validation: function(callback) {
      validationController.existsCategoryAndNumber({
        categoryId: categoryId
      }, callback);
    },
    data: function(callback) {
      codeService.deleteCategory(categoryId, callback);
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
 * @api {get} /code/category/charity/:charityId Get category by using charityId
 * @apiName  Get category by using charityId
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "charity_id": 1500720
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *  "status": "success",
 *  "data": [ ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 *
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

codeRouter.get('/category/charity/:charityId', function(req, res, next) {
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
      codeService.getCategoriesByCharity(charityId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data

      utility.dataHandler(result, res);
    }

  });
  //TODO:Get the Data Based on Charity ID
  //Send the Response - With Status Code Appropriately - 200 (OK), 400 (Validation Error of Inputs),
  //500 (Errors You Do not Know Like DB Connections), 402 (Business Validations Failed), 401 (Bad Auth)

});

/**
 * @api {get} /code/list/charity/:charityId Get codes by using charity
 * @apiName  Get codes by using charity
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "charity_id": 1500720
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "status": "success",
 *      "data": [
 *        {
 *          "id": 1663,
 *            "code_text": "congue"
 *          },
 *        {
 *          "id": 681,
 *            "code_text": "donec"
 *          },
 *        {
 *          "id": 58,
 *            "code_text": "eget"
 *          },
 *        {
 *          "id": 1226,
 *            "code_text": "FOURPPAI"
 *          },
 *        {
 *          "id": 2485,
 *            "code_text": "penatibus"
 *          },
 *        {
 *          "id": 2038,
 *            "code_text": "ut"
 *          }
 *          ]
 *        }
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
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

codeRouter.get('/list/charity/:charityId', function(req, res, next) {
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
      codeService.getCodesByCharity(charityId, callback);
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
 * @api {get} /code/assest/:codeId Get code url
 * @apiName  Get code url
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "code_id": 413
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *   "status": "success",
 *   "data": [
 *       {
 *           "code_text": "eget"
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 * {
 *   "status": "error",
 *   "error": {
 *       "codeId": [
 *           "Code id is not a number"
 *       ],
 *       "flag": 400
 *   }
 *}
 */

codeRouter.get('/assest/:codeId', function(req, res, next) {
  //TODO:Validation of Parameter Charity ID
  var codeId = req.params.codeId;
  var logsObj = req.logsObj;

  var obj = {};
  obj.codeId = codeId;
  async.series({
    validation: function(callback) {
      validationController.paramCodeId(obj, callback);
    },
    data: function(callback) {
      codeService.getCodeUrlsByCode(codeId, callback);
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

codeRouter.post('/validate/campaign', function(req, res, next) {
  //TODO:Validation of Parameter Charity ID
  var codeId = req.body.code;
  var typeOfMode = req.body.type;
  var logsObj = req.logsObj;

  var Obj = {
    code_text: req.body.code,
    typeOfMode: req.body.type,
    orgiginal: req.body.orgiginal
  };

  async.series({
    validation: function(callback) {
      validationController.commonParamExistsAndString(Obj, callback);
    },
    data: function(callback) {
      codeService.validationCampaignCode(Obj, callback);
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
 * @api {get} /code/unique/:codeid/fetch Fetch code from code ID
 * @apiName  Fetch code from code ID
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "code_id": 413
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *  {
 *   "status": "success",
 *   "data": [
 *       {
 *           "code_id": 413,
 *           "code_type": "campaign",
 *           "code_title": "congue",
 *           "code_text": "venenatis",
 *           "code_picture_url": null,
 *            "suggested_donation": 23.8,
 *           "charity_id": 1500435,
 *           "charity_title": "VETERANS ON DECK",
 *           "donation": 0,
 *           "donation_progress": 0
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 * {
 *   "status": "error",
 *   "error": {
 *       "code": "ER_BAD_FIELD_ERROR",
 *       "errno": 1054,
 *       "sqlState": "42S22",
 *       "index": 0,
 *       "location": "createCode....routes/code.js ,"
 *   }
 *}
 */



codeRouter.get('/unique/:codeid/fetch', function(req, res, next) {
  var code_id = req.params.codeid;
  var user_id = req.query.user_id;
  var logsObj = req.logsObj;
  async.series({
    // validation : function(callback) {
    //  validationController.validateCreateCode(codeObject, callback);
    // },
    data: function(callback) {
      codeService.getcampaignUnique(code_id, user_id, callback);
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
 * @api {get} /code/charity/:id/default Get default code for Charity
 * @apiName  Get default code for Charity
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "charity_id": 1500337
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *  {
 *   "status": "success",
 *   "data": [
 *       {
 *           "code_id": 215,
 *           "code_type": "campaign",
 *           "code_title": "sapien a libero",
 *           "code_text": "faucibus",
 *           "code_picture_url": null,
 *           "suggested_donation": 58.73,
 *           "charity_id": 1500337,
 *           "charity_title": "PHYSICIANS FOR SOCIAL RESPONSIBILITY INC",
 *           "donation": 3351,
 *           "donation_progress": 3.02
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 * {
 *   "status": "error",
 *   "error": {
 *       "code": "ER_BAD_FIELD_ERROR",
 *       "errno": 1054,
 *       "sqlState": "42S22",
 *       "index": 0,
 *       "location": "createCode....routes/code.js ,"
 *   }
 *}
 */



codeRouter.get('/charity/:id/default', function(req, res, next) { // campaigns shown for campaigns page in organization dashboard
  var charity_id = req.params.id;
  var logsObj = req.logsObj;

  async.series({
    // validation : function(callback) {
    //  validationController.validateCreateCode(codeObject, callback);
    // },
    data: function(callback) {
      codeService.getCharityDefaultcampaign(charity_id, callback);
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
 * @api {get} /code/charity/:id/default Campaigns for charity
 * @apiName  Campaigns for charity
 * @apiGroup code
 * @apiParamExample {json} Request-Example:
 *     {
 *       "charity_id": 1500337
 *     }
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *{
 *   "status": "success",
 *   "data": [
 *       {
 *           "code_id": 509,
 *           "code_type": "ongoing",
 *           "code_title": "ac",
 *           "code_text": "duis",
 *           "code_picture_url": null,
 *           "suggested_donation": 56.36,
 *           "charity_id": 1500337,
 *           "charity_title": "PHYSICIANS FOR SOCIAL RESPONSIBILITY INC",
 *           "donation": 0,
 *           "donation_progress": 0
 *       },
 *       {
 *           "code_id": 2605,
 *           "code_type": "ongoing",
 *           "code_title": "Child Labour",
 *           "code_text": "Poverty",
 *           "code_picture_url": "https://wonderwe.s3.amazonaws.com/profile/ec2f2125-bff1-4159-ba16-e0b21a740f6e-lvpeijpg.jpg",
 *           "suggested_donation": 200000,
 *           "charity_id": 1500337,
 *           "charity_title": "PHYSICIANS FOR SOCIAL RESPONSIBILITY INC",
 *            "donation": 0,
 *           "donation_progress": 0
 *       }
 *   ]
 *}
 * @apiError User Already Exists.
 * @apiErrorExample {json} Error-Response:
 * {
 *   "status": "error",
 *   "error": {
 *       "code": "ER_BAD_FIELD_ERROR",
 *       "errno": 1054,
 *       "sqlState": "42S22",
 *       "index": 0,
 *       "location": "createCode....routes/code.js ,"
 *   }
 *}
 */


codeRouter.get('/charity/:charityid/campaigns', function(req, res, next) {
  var charity_id = req.params.charityid;
  var logsObj = req.logsObj;

  async.series({
    // validation : function(callback) {
    //  validationController.validateCreateCode(codeObject, callback);
    // },
    data: function(callback) {
      codeService.getCharityDonationCampaigns(charity_id, callback);
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

codeRouter.post('/validate/entity/slug', function(req, res, next) {
  var slugObject = req.body;
  var logsObj = req.logsObj;
  slugObject.slug = uslug(req.body.name);
  async.series({
    // validation : function(callback) {
    //  validationController.validateCreateCode(codeObject, callback);
    // },
    data: function(callback) {
      codeService.validateEntitySlug(slugObject, callback);
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

codeRouter.put('/status/:codeId', function(req, res, next) {
  var codeId = req.params.codeId;
  var logsObj = req.logsObj;
  var codeInfo;
  async.series({
    getCode: function(callback) {
      codeService.getCodeById(codeId, function(err, code) {
        if (err) {
          callback(new Error(err), null);
        } else {
          codeInfo = code;
          callback(null, true);
        }
      })
    },
    checkCharityApproved: function(callback) {
      if (codeInfo.individual != 'yes') {
        utility.nodeLogs('INFO', 'In check charity approval');
        charityService.checkCharityApproved(codeId, function(err, approved) {
          if (approved) {
            callback(null, true);
          } else {
            utility.nodeLogs('INFO', 'Charity not approved');
            callback(new Error(JSON.stringify({ errors: ['You can not publish the campaign until the charity has been approved'], status: 400, type: 'codepublish' })), null);
          }
        });
      } else {
        callback(null, true);
      }
    },
    checkApproval: function(callback) {
      if (codeInfo.team_campaign == "yes") {
        codeService.checkP2pApproval(codeId, function(err, result) {
          if (result.approvedby) {
            callback(null, true);
          } else {
            utility.nodeLogs('INFO', 'Peer to peer campaign not approved');
            callback(new Error(JSON.stringify({ errors: ['You can not publish the campaign until the campaign has been approved by your campaign admin'], status: 400, type: 'codepublish' })), null);
          }
        });
      } else {
        callback(null, true);
      }
    },
    data: function(callback) {
      codeService.updateCodeStatus(codeId, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "validate entity slug, done, In code route"]);
      var urlshortener = google.urlshortener('v1');
      urlshortener.url.insert({
        auth: props.shortultapikey,
        resource: {
          longUrl: props.domain + '/' + req.query.slug + '?utm_userid=' + req.query.userid + '&utm_codeid=' + req.params.codeId + '&utm_fundraise=fundraise&utm_source=facebook'
        }
      }, function(err, result) {
        if (err) {
          utility.newAppErrorHandler(err, logsObj, res);
        } else {
          var obj = {};
          obj.data = result.id;
          utility.dataHandler(obj, res);
        }
      });
    }
  });
});
codeRouter.put('/unpublished/status/:codeId/:flag', function(req, res, next) {
  var codeId = req.params.codeId;
  var logsObj = req.logsObj;
  var flag = req.params.flag;
  async.series({
    // validation : function(callback) {
    //  validationController.validateCreateCode(codeObject, callback);
    // },
    data: function(callback) {
      codeService.updateCodeUnpublishedStatus(codeId, flag, callback);
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
codeRouter.post('/sendemailbeforedelete', function(req, res, next) {
  var codeid = req.body.code_id;
  var codeSlug = req.body.codeSlug;
  var logsobj = req.logsObj;
  excuteQuery.queryForAll(sqlQueryMap['getEntityUser'], [codeid, 'code'], function(err, codeRecord) {
    async.parallel({
      deletecampaign: function(callback) {
        console.log("xdcfvgbhn");

        if (req.body.defaultCampaign) {
          var defaultCodeId = req.body.defaultCodeId;
          codeService.deleteDefaultCampaign(codeSlug, defaultCodeId, callback);

        } else {
          console.log("dcfvgbhn")
          codeService.deleteCampaign(codeSlug, callback);
        }
      },
      sendFinalDeleteEmail: function(callback) {
        console.log(codeRecord);
        codeService.sendFinalDeleteEmail(codeRecord, req.body.message_body, callback)
      }
    }, function(err, result) {
      console.log("succesjdjsdn...");
      console.log(result);
      if (err) {
        if (err.flag) {
          utility.appErrorHandler(err, res)
        } else {
          utility.appErrorHandler(err, res)
        }
      } else {
        var obj = {};
        console.log(result);
        obj.data = "success";
        utility.dataHandler(obj, res);
      }
    })

    /*  codeService.sendFinalDeleteEmail(codeRecord, function(err, result) {
        if (err) {
          utility.newAppErrorHandler(err, logsObj, res);
        } else {
          var obj = {};
          obj.data = "success";
          utility.dataHandler(obj, res);
        }

      })*/

  })


})
codeRouter.delete('/delete/:codeSlug', function(req, res, next) {
  var codeSlug = req.params.codeSlug;
  var logsObj = req.logsObj;
  async.series({
    // validation : function(callback) {
    //  validationController.validateCreateCode(codeObject, callback);
    // },
    data: function(callback) {
      codeService.deleteCampaign(codeSlug, callback);
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

codeRouter.post('/default/delete/:codeSlug/:defaultCodeId', function(req, res, next) {
  var codeSlug = req.params.codeSlug;
  var logsObj = req.logsObj;
  var defaultCodeId = req.params.defaultCodeId;
  async.series({
    // validation : function(callback) {
    //  validationController.validateCreateCode(codeObject, callback);
    // },
    data: function(callback) {
      codeService.deleteDefaultCampaign(codeSlug, defaultCodeId, callback);
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

codeRouter.post('/emails', function(req, res, next) {
  var obj = req.body;
  var logsObj = req.logsObj;
  async.series({
    // validation : function(callback) {
    //  validationController.validateCreateCode(codeObject, callback);
    // },
    data: function(callback) {
      codeService.sendCampaignDetails(obj, callback);
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

codeRouter.post('/default/unpublish/:codeSlug/:defaultCodeId/:codeId', function(req, res, next) {
  var codeSlug = req.params.codeSlug;
  var logsObj = req.logsObj;
  var defaultCodeId = req.params.defaultCodeId;
  var codeId = req.params.codeId;
  async.series({
    // validation : function(callback) {
    //  validationController.validateCreateCode(codeObject, callback);
    // },
    data: function(callback) {
      codeService.unpublishDefaultCampaign(codeSlug, defaultCodeId, codeId, callback);
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
codeRouter.put('/update/desc', function(req, res, next) {
  var obj = req.body;
  var logsObj = req.logsObj;
  if (req.query.viralcamp) {
    obj.flag = req.query.viralcamp;

  }

  codeService.updateCampaignDetails(obj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var object = {};
      object.data = obj;
      utility.dataHandler(object, res);
    }
  });

});
codeRouter.post('/invite/contacts', function(req, res, next) {
  var invitelist = req.body;
  var logsObj = req.logsObj;
  if (invitelist && invitelist.flag) {
    var fundraiser = invitelist.flag;
  } else {
    var fundraiser = 'fundraise';
  }
  if (req.body.skip == 'skip') {
    var urlshortener = google.urlshortener('v1');
    urlshortener.url.insert({
      auth: props.shortultapikey,
      resource: {
        longUrl: props.domain + '/' + req.body.slug + '?utm_userid=' + req.body.userid + '&utm_codeid=' + req.body.codeid + '&utm_fundraise=' + fundraiser + '&utm_source=twitter'
      }
    }, function(err, result) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        var obj = {};
        invitelist.url = result.id;
        obj.data = invitelist;
        utility.dataHandler(obj, res);
      }
    });
  } else {
    codeService.sendEmailForFundraise(invitelist, function(err, result) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        //Send 200 Status With Real Data
        var urlshortener = google.urlshortener('v1');
        urlshortener.url.insert({
          auth: props.shortultapikey,
          resource: {
            longUrl: props.domain + '/' + req.body.slug + '?utm_userid=' + req.body.userid + '&utm_codeid=' + req.body.codeid + '&utm_fundraise=' + fundraiser + '&utm_source=twitter'
          }
        }, function(err, result) {
          if (err) {
            utility.newAppErrorHandler(err, logsObj, res);
          } else {
            var obj = {};
            obj.data = result.id;
            utility.dataHandler(obj, res);
          }
        });
      }
    })
  }
});
codeRouter.get('/fundraisers/:userid/:skip/:limit', function(req, res, next) {
  var userid = req.params.userid;
  var logsObj = req.logsObj;
  var skip = req.params.skip;
  var limit = req.params.limit;

  codeService.getFundraisers(userid, skip, limit, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var requestLogObj = {};
      requestLogObj.token = (req.query && req.query.token) || req.headers['x-access-token'];
      requestLogObj.message = "Clicked on Manage under team campaigns"
      utility.nodeLogs('INFO', requestLogObj);


      var object = {};
      object.data = result;
      res.send(object)
    }
  })
});
codeRouter.post('/share/facebook/twitter', function(req, res, next) {
  var sharedata = req.body;
  var logsObj = req.logsObj;
  codeService.saveShareInfo(sharedata, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  })
});
codeRouter.get('/data/track/:codeid/:userid/fundraisers', function(req, res, next) {
  var codeobj = {};
  var logsObj = req.logsObj;
  codeobj.codeid = req.params.codeid;
  codeobj.userid = req.params.userid;
  codeService.trackingCampaignData(codeobj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  })
});




//Event creation
codeRouter.post('/event/save', function(req, res, next) {
  var eventData = req.body;
  var logsObj = req.logsObj;
  codeService.saveEvent(eventData, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  })
});

codeRouter.get('/events/list/:creater_id/:limit', function(req, res, next) {
  var creater_d = req.params.creater_id;
  var logsObj = req.logsObj;
  var limit = req.params.limit;
  codeService.getEventsList(creater_d, limit, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  });
});

//Event ticket or shift signup
codeRouter.post('/signup', function(req, res, next) {
  var ticketObj = req.body;
  var logsObj = req.logsObj;
  codeService.ticketOrShiftSignupsAsUser(ticketObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  });
});

//Event Ticket and Shift Signups
codeRouter.post('/volunteer/signup', function(req, res, next) {
  var signupObj = req.body;
  var logsObj = req.logsObj;
  codeService.eventSigunup(signupObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  });
});

codeRouter.get('/volunteers/:shiftId', function(req, res, next) {
  var shiftId = req.params.shiftId;
  var logsObj = req.logsObj;
  codeService.getShiftVolunteers(shiftId, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  });
});

codeRouter.post('/team/campaign', function(req, res, next) {
  var campaignObj = req.body;
  var logsObj = req.logsObj;
  codeService.teamCampaignCreation(campaignObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  });
});


//for peer to peer
codeRouter.get('/teams/:userid/:skip/:limit', function(req, res, next) {
  var logsObj = req.logsObj;
  var userid = req.params.userid;
  var skip = req.params.skip;
  var limit = req.params.limit;

  codeService.getDonorTeams(userid, skip, limit, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var object = {};
      object.data = result;
      res.send(object)
    }
  })
});
//for teams
codeRouter.get('/getteams/:userid/:skip/:limit', function(req, res, next) {
  var logsObj = req.logsObj;
  var userid = req.params.userid;
  var skip = req.params.skip;
  var limit = req.params.limit;

  teamService.getMyTeams(userid, skip, limit, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var object = {};
      object.data = result;
      res.send(object)
    }
  })
});

codeRouter.get('/team/:codeid/details/:userid', function(req, res, next) {
  var logsObj = req.logsObj;
  var userid = req.params.userid;
  var codeid = req.params.codeid;
  //  var limit=req.params.limit;

  codeService.getDonorTeamDetails(codeid, userid, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var object = {};
      object.data = result;
      res.send(object)
    }
  })
});


codeRouter.get('/type/check/:codeid', function(req, res, next) {
  var logsObj = req.logsObj;
  var codeid = req.params.codeid;

  codeService.checkIfTeamCampaign(codeid, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var object = {};
      object.data = result;
      res.send(object)
    }
  })
});


codeRouter.post('/update/team/:codeid/campaign', function(req, res, next) {
  var logsObj = req.logsObj;
  var codeid = req.params.codeid;
  var obj = req.body;
  //  var limit=req.params.limit;

  codeService.updateDonorTeam(obj, codeid, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      res.send(obj)
    }
  })
});

codeRouter.post('/teamFundraiserCreate', function(req, res, next) {
  var campaignObj = req.body;
  var logsObj = req.logsObj;
  console.log("in routes");

  codeService.teamFundriserCreation(campaignObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  });
});

codeRouter.post('/addadmin', function(req, res, next) {
  console.log("sdjsjfjsfj...in routes")
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.validateEmailLength(req.body.adminEmail, callback);
    },
    data: function(callback) {
      codeService.updateCampaignAdminData(req.body, callback)
    }
  }, function(err, result) {
    console.log(result);
    console.log("result" + result);
    if (err) {
      console.log(err);
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      res.send(result.data)
    }
  })
})
codeRouter.post('/addp2pinvitees', function(req, res, next) {
  console.log("sdjsjfjsfj...in routes")
  var logsObj = req.logsObj;

  codeService.addPeerInvitees(req.body, function(err, result) {

    if (err) {
      console.log(err);
      utility.newAppErrorHandler(err, logsObj, res);

    } else {
      console.log("in routes...");
      console.log(result);
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  })
})

codeRouter.post('/addUpdates', function(req, res, next) {
  var logsObj = req.logsObj;

  //  var limit=req.params.limit;
  console.log("dsdsds")
  console.log(req.body);
  codeService.addCampaignUpdates(req.body, function(err, result) {
    if (err) {
      console.log(err);
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  })
});

codeRouter.get('/deleteupdates/:updateid', function(req, res, next) {
  // var logsObj = req.logsObj;

  //  var limit=req.params.limit;
  console.log("sjsjsjjnsnjdsnjdnjsjn")
  codeService.deleteCampaignUpdates(req.params.updateid, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      console.log(result);
      res.send(result)
    }
  })
});
codeRouter.get('/team/:codeid/track/:userid', function(req, res, next) {
  var logsObj = req.logsObj;
  var codeobj = {};
  codeobj.codeid = req.params.codeid;
  codeobj.userid = req.params.userid;
  codeService.teamCampaignTrackingData(codeobj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  })
});

codeRouter.get('/analytics/:codeid', function(req, res, next) {
  var logsObj = req.logsObj;
  var codeobj = {};
  codeobj.codeid = req.params.codeid;
  codeService.campaignAnalyticsData(codeobj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  })
});

codeRouter.get('/charity/campaign/:charityid', function(req, res, next) {
  var charityid = req.params.charityid;
  codeService.campaignCharityClaim(charityid, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      //Send 200 Status With Real Data
      var resObject = {};
      resObject.data = result;
      utility.dataHandler(resObject, res);
    }
  })
});

codeRouter.get('/getUserCampaigns/:userId', function(req, res, next) {
  var userId = req.params.userId;
  codeService.getUserCampaigns(userId, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      var resObject = {};
      resObject.data = result;
      console.log(resObject);
      utility.dataHandler(resObject, res);
    }

  })
});
codeRouter.post('/update/settings', function(req, res, next) {
  var campaign_data = req.body;
  console.log(campaign_data);
  codeService.updateCampaignAdditional(campaign_data, function(err, result) {
    if (err) {
      var logsObj = req.logsObj;
      utility.appErrorHandler(err, logsObj, res)
    } else {
      utility.dataHandler({ data: result }, res)
    }

  })

});
codeRouter.get('/getCampaignsCount/:charityid', function(req, res, next) {
  console.log("fcgv");
  var charityId = req.params.charityid;
  donorService.numberOfCharityCampaigns(charityId, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      var resObject = {};
      resObject.data = result;
      console.log(resObject);
      if (result.campcount === 0) {
        pool.query("UPDATE code_tbl SET charity_default='no', status='draft' WHERE id=?", [result.charitydefault], function(err, result) {
          if (err) {
            callback(new Error(err), null);
          } else {
            utility.dataHandler(resObject, res);
          }
        })
      } else {
        utility.dataHandler(resObject, res);

      }
    }

  })
});

codeRouter.get('/campaigns/paymentId/:Id', function(req, res, next) {
  var object = {};
  object.id = req.params.Id;
  object.type = req.query.type;
  async.parallel({
    data: function(callback) {
      codeService.getCharityCodesWithPaymentId(object, callback);

    },
    paymentGateways: function(callback) {
      settingService.getPaymentGatewayCharityStatus(object, callback);
    }
  }, function(err, results) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      var resObject = {};
      resObject.data = results;
      utility.dataHandler(resObject, res);
    }
  });
});


module.exports = codeRouter;
