var props = require('config').props;
/*var devmetrics = require('devmetrics-core')({
  'app_id': props.devmetrics_app_id
});*/
var pathmodule = require('path');
var base64 = require('node-base64-image');
var charityService = require('../services/charity');

/**
 * [escapeQoutes Removes qoutes in the string which causes parsing error ]
 * @return {[type]} [description]
 */
String.prototype.escapeQoutes = function() {
  return this.replace(/["']/g, '');
}


var checkEmailNotificationEnabled = function(mandrillData, callback) {
  excuteQuery.queryForAll(sqlQueryMap['checkEmailEnabledOrNot'], [mandrillData.email, mandrillData.template_name],
    function(err, result) {
      if (err) {
        callback(err, null)
      } else {
        if (!result.length || result[0].enable) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      }
    });
};

exports.tokenAuth = function(req, callback) {
  var token = (req.body && req.body.token) || (req.query && req.query.token) || req.headers['x-access-token'];
  if (token) {

    try {
      redisClient.get(token, function(err, userData) {
        if (err) {
          callback(err, null);
        } else if (userData) {

          req.user = JSON.parse(userData);
          callback(null, req.user);
        } else {
          callback({
            "errors": ["token authentication failed!"]
          }, null);

        }
      });

    } catch (err) {
      callback(err, null);

    }
  } else {
    callback({
      "errors": ["authentication token not recived"]
    }, null);

  }

};
exports.tokenAuthVerify = function(req, callback) {

  var token = (req.body && req.body.token) || (req.query && req.query.token) || req.headers['x-access-token'];
  if (token) {
    // try {

    redisClient.get(token, function(err, userData) {
      if (err) {
        callback(err, null);
      } else {
        req.user = JSON.parse(userData);

        callback(null, req.user);
      }
    });

  } else {
    utility.log("error", "authentication token not received");
    callback({
      "error": "authentication token not received"
    }, null);

  }

};

/**
 *I have added try catch exception, Might be, any broken use case occurs, it will work
 */

exports.appErrorHandler = function(err, res) {

  try {

    var responseObject = {};
    if (err && err.error) {
      utility.log('error', err.error);
    } else if (err && err.flag) {

      var data = "";

      for (var key in err) {
        var str = err[key];
        if (str[0] == undefined) {

        } else {
          var errinfo = str[0];
          data = data + " " + errinfo;
        }
      }
      //  utility.log('error', data);
    }

    var logsObj = {};
    logsObj.error = err;
    logsObj.msg = 'Tracked an error in appErrorHandler';
    // logsObj.stack = new Error().stack;
    this.nodeLogs('ERROR', logsObj)

    responseObject.status = 'error';
    responseObject.error = err;

    if (err && err.flag) {
      res.status(400);
    } else if (err) {
      res.status(500);
    }
    res.send(responseObject);

  } catch (e) {

    var logsObj = {};

    logsObj.error = err;
    logsObj.msg = 'Tracked an error in appErrorHandler';
    //logsObj.data = logsObj2;
    logsObj.stack = err.stack;
    this.nodeLogs('ERROR', logsObj);

    try {
      console.log('This is in try block...');
      var resObj = JSON.parse(err.message);
    } catch (e) {
      console.log('This is in catch block...');
      var resObj = { errors: [err.message] };
    }

    if (resObj.status) {
      res.status(resObj.status);
    } else {
      res.status(500);
    }
    resObj.status = 'error';
    res.send(resObj);

  }
};


exports.newAppErrorHandler = function(err, logsObj2, res) {

  var logsObj = {};
  var me = this;

  

  logsObj.error = err;
  logsObj.msg = 'Tracked an error in appErrorHandler';  
  logsObj.data = logsObj2;
  logsObj.stack = err.stack;
  if(logsObj2.module){
    logsObj.module = logsObj2.module;
    me.sendSlackAlarm(logsObj);
  }
  delete logsObj2.module;
  this.nodeLogs('ERROR', logsObj);

  try {
    console.log('This is in try block...');
    var resObj = JSON.parse(err.message);
  } catch (e) {
    console.log('This is in catch block...');
    var resObj = { errors: [err.message] };
  }

  if (resObj.status) {
    res.status(resObj.status);
  } else {
    res.status(500);
  }
  resObj.status = 'error';
  res.send(resObj);
};

exports.dataHandler = function(result, res) {
  var responseObject = {};
  responseObject.status = 'success';
  if (result && result.data) {
    responseObject.data = result.data;
  }
  res.set('Cache-Control', 'no-cache');
  res.json(responseObject);
};
exports.log = function(level, message) {
  var log4js = require('log4js'); //note the need to call the function
  var logger = log4js.getLogger('js-frontend');
  if (level.name === 'DEBUG') {
    logger.debug(message);
  } else if (level.name === 'TRACE') {
    logger.trace(message);
  } else if (level.name === 'INFO') {
    logger.info(message);
  } else if (level.name === 'WARN') {
    logger.warn(message);
  } else if (level.name === 'ERROR') {
    logger.error(message);
  } else if (level.name === 'FATAL') {
    logger.fatal(message);
  }
};

exports.nodeLogs = function(level, message) {
  var log4js = require('log4js'); //note the need to call the function
  var logger = log4js.getLogger('js-backend');
  message = JSON.stringify(message);

  if (level === 'DEBUG') {
    logger.debug(message);
  } else if (level === 'TRACE') {
    logger.trace(message);
  } else if (level === 'INFO') {
    logger.info(message);
  } else if (level === 'WARN') {
    logger.warn(message);
  } else if (level === 'ERROR') {
    logger.error(message);
  } else if (level === 'FATAL') {
    logger.fatal(message);
  }
};


exports.nodeJobLogs = function(level, message) {
  var log4js = require('log4js'); //note the need to call the function
  var logger = log4js.getLogger('js-nodejobs');
  message = JSON.stringify(message);
  if (level === 'DEBUG') {
    logger.debug(message);
  } else if (level === 'TRACE') {
    logger.trace(message);
  } else if (level === 'INFO') {
    logger.info(message);
  } else if (level === 'WARN') {
    logger.warn(message);
  } else if (level === 'ERROR') {
    logger.error(message);
  } else if (level === 'FATAL') {
    logger.fatal(message);
  }
};


exports.logException = function(error) {
  // require('devmetrics')().exception(error);
};
exports.devMetrics = function(event_name, userid, tags) {
  // devmetrics.userEvent(event_name, userid, tags);
}

exports.printCampaignCode = function(req, res) {

  var jsreport = require('jsreport');
  var fs = require('fs');
  var obj = {};
  obj.layout = 'print-layout';
  obj.domain = props.domain;
  codeId = req.params.codeid;
  excuteQuery.queryForAll(sqlQueryMap['charityCodeData'], [codeId], function(err, rows) {
    if (err) {
      callback(err);
    } else {
      obj.description = rows[0].description;
      obj.image = rows[0].code_picture_url;
      obj.title = rows[0].title;
      obj.codetext = rows[0].code_text;
      app.render('./pages/print', obj, function(err, html) {
        jsreport.render(html).then(function(out) {
          out.stream.pipe(res);
        }).catch(function(e) {
          res.end(e.message);
        });
      });
    }
  });
};


exports.mandrillTemplate = function(finalobjectmandril, callback) {
  //Checks user enabled email notification or not
  checkEmailNotificationEnabled(finalobjectmandril, function(err, enabled) {
    if (err || !enabled) {
      utility.nodeLogs('INFO', { message: 'User not enabled this' });
      callback(null, {
        message: 'User not enabled this email notification',
        email: finalobjectmandril.email,
        template: finalobjectmandril.template_name
      });
      return;
    }
    mandrill_client = new mandrill.Mandrill(props.mandrilkey);
    mandrill_client.templates.render({
      "template_name": finalobjectmandril.template_name,
      "template_content": finalobjectmandril.template_content,
      "merge_vars": finalobjectmandril.merge_vars
    }, function(result) {
      var mailOptions = {
        from: finalobjectmandril.from, // sender address
        to: finalobjectmandril.email,
        headers: {
          "Reply-To": finalobjectmandril.reply
        }, // list of receivers
        subject: finalobjectmandril.subject, // Subject line
        text: finalobjectmandril.text, // plaintext body
        html: result.html // html body
      };
      mail.sendEmail(mailOptions, function(err, data) {
        if (err) {
          utility.nodeLogs('ERROR', { error: err });
          callback(new Error(JSON.stringify({ errors: [err.message], status: 500 })), null);
        } else {
          callback(null, data);
        }
      });
    }, function(e) {
      callback(new Error(JSON.stringify({ errors: [e.message], status: 500 })), null);

      // Mandrill returns the error as an object with name and message keys
      // A mandrill error occurred: Invalid_Key - Invalid API key
    });
  });
};

exports.manualTemplateMailSend = function(mailOptions, callback) {


  mail.sendEmail(mailOptions, function(err, data) {
    if (err) {
      utility.nodeLogs('ERROR', { error: err });
      callback(new Error(JSON.stringify({ errors: [err.message], status: 500 })), null);
    } else {
      callback(null, data);
    }
  });

}

var config = {
  provider: props.cloudProvide,
  key: props.cloudSecretKey, // secret key
  keyId: props.cloudAccessKey, // access key id
  region: 'us-east-1' // region
};
exports.picUpload = function(req, res) {

  fs = require('fs');
  var path = '',
    name = '';
  if (req.body.imgtype) {
    var filename = 'profile/' + uuid.v4() + '-' + uslug(req.body.fileUrl);

    var ext = req.body.ext;
    var readStream = request.get({
      url: req.body.imgDta,
    })
    name = filename + ext;
    storeInAmazon(readStream, name, function(err, url) {
      var jsonRes = {};
      jsonRes.success = true;
      jsonRes.url = url;
      var resize = req.body.resizeto;

      var type = req.body.pic_type;
      if (resize !== 'none') {
        if (type == 'campaign_pic') {

          if (req.body.modeOfType == "edit") {
            jsonRes.url = props.thumbor + "369x275/" + url;
            jsonRes.originalUrl = url;
          } else {
            jsonRes.url = props.thumbor + "299x150/" + url;
            jsonRes.originalUrl = url;
          }

        } else if (type == 'org_banner') {
          jsonRes.url = props.thumbor + "275x275/" + url;
          jsonRes.originalUrl = url;
        } else if (type == 'org_logo') {
          jsonRes.url = props.thumbor + "283x283/" + url;
          jsonRes.originalUrl = url;
        } else if (type == 'profile_pic') {
          jsonRes.url = props.thumbor + "283x283/" + url;
          jsonRes.originalUrl = url;
        } else {
          jsonRes.url = url;
        }
      } else {
        jsonRes.url = props.thumbor + "477x477/" + url;
        jsonRes.originalUrl = url;
      }
      urlStoreInRackspace(url, filename, ext, type);
      res.send(JSON.stringify(jsonRes));
      var urlsData = {};
      urlsData.url = url;
      urlsData.filename = filename;
      urlsData.ext = ext;
      urlsData.type = type;
      //agenda.now('pic upload', urlsData);

    })
  } else {
    path = __dirname + "/../" + req.files.qqfile.path;
    var filename = 'profile/' + uuid.v4() + '-' + uslug(req.files.qqfile.originalname);
    var ext = pathmodule.extname(req.files.qqfile.originalname);
    name = filename + ext;
    var readStream = fs.createReadStream(path);

    storeInAmazon(readStream, name, function(err, url) {
      var jsonRes = {};
      jsonRes.success = true;
      jsonRes.url = url;
      var resize = req.body.resizeto;

      var type = req.body.pic_type;
      if (resize !== 'none') {
        if (type == 'campaign_pic') {

          if (req.body.modeOfType == "edit") {
            jsonRes.url = props.thumbor + "369x275/" + url;
            jsonRes.originalUrl = url;
          } else {
            jsonRes.url = props.thumbor + "299x150/" + url;
            jsonRes.originalUrl = url;
          }

        } else if (type == 'org_banner') {
          jsonRes.url = props.thumbor + "275x275/" + url;
          jsonRes.originalUrl = url;
        } else if (type == 'org_logo') {
          jsonRes.url = props.thumbor + "283x283/" + url;
          jsonRes.originalUrl = url;
        } else if (type == 'profile_pic') {
          jsonRes.url = props.thumbor + "283x283/" + url;
          jsonRes.originalUrl = url;
        } else {
          jsonRes.url = url;
        }
      } else {
        jsonRes.url = props.thumbor + "477x477/" + url;
        jsonRes.originalUrl = url;
      }
      urlStoreInRackspace(url, filename, ext, type);
      res.send(JSON.stringify(jsonRes));
      var urlsData = {};
      urlsData.url = url;
      urlsData.filename = filename;
      urlsData.ext = ext;
      urlsData.type = type;
      //agenda.now('pic upload', urlsData);

    })
  }


};

function urlStoreInRackspace(path, name, ext, type) {
  var client = require('pkgcloud').storage.createClient(config);
  if (process.env.NODE_ENV == 'production') {
    var container = "wonderwe-prod";
  } else {
    var container = "wonderwe";
  }
  for (var i in imgDimension) {
    if (i == type) {
      async.each(imgDimension[i].dimensions, function(eachDimension, dimesionCallback) {
        var writeStream = client.upload({
          container: container,
          remote: name + '-size' + eachDimension + ext
        });
        request.get({
          url: props.thumbor + eachDimension + '/' + path,
        }).pipe(writeStream);
        dimesionCallback(null);
      }, function(err) {

      });
    } else {

    }
  }
}

function storeInAmazon(readStream, name, callback) {
  var client = require('pkgcloud').storage.createClient(config);
  if (process.env.NODE_ENV == 'production') {
    var amazonContainer = "wonderwe-prod";
  } else {
    var amazonContainer = "wonderwe";
  }
  var writeStream = client.upload({
    container: amazonContainer,
    remote: name
  });
  readStream.pipe(writeStream);
  writeStream.on('error', function(err) {
    // handle your error case
    callback(err, null);
  });
  writeStream.on('success', function(file) {
    // success, file will be a File model
    var cdnurl = props.cloudurl;
    callback(null, cdnurl + name);
  });
}

// Here we can add the properties what we want in the front end
exports.utilProperties = function(req, res) {
  var resObj = {
    environment_type: props.environment_type,
    client_id: props.client_id,
    domain: props.domain,
    agendadomin: props.agendadomin,
    stripe_client_id: props.stripe_client_id,
    stripe_publishable_key: props.stripe_publishable_key,
    videoToken: props.videoToken,
    intercomAppId: props.intercomAppId,
    facebook_app_id:props.facebook_client_id
  };
  res.send(resObj);
};

exports.passwordEncrypt = function(password, salt) {
  var obj = {};
  var bcrypt = require('bcrypt');
  if (salt) {
    obj.password_salt = salt;
  } else {
    var salt = bcrypt.genSaltSync(20);
    obj.password_salt = salt;
  }
  var crypto = require('crypto'),
    hash = function(pass, salt) {
      var h = crypto.createHash('sha512');
      h.update(pass);
      h.update(salt);
      return h.digest('hex');
    };
  var pass = hash(password, salt);
  obj.password = pass;

  console.log(obj);
  return obj;

};

exports.passwordsaltEncrypt = function(password) {
  var obj = {};
  var bcrypt = require('bcrypt');
  var salt = bcrypt.genSaltSync(20);
  obj.password_salt = salt;
  var crypto = require('crypto'),
    hash = function(pass, salt) {
      var h = crypto.createHash('sha512');
      h.update(pass);
      h.update(salt);
      return h.digest('hex');
    };
  var pass = hash(password, salt);
  obj.password = pass;
  return obj;
};

exports.socketioNotifications = function(notifyObj, callback) {
  if (notifyObj.type == 'mention') {
    pool.query('select * from entity_tbl where entity_id =?', [notifyObj.user_id], function(err, result) {
      if (err) {
        callback(err, null);
        //utility.appErrorHandler(err, res);
      } else {
        notifyObj.entity_id = result[0].id;
        var time = require('time');
        var t = new Date();
        var tz = new time.Date(0, 'UTC');
        notifyObj.date_notification = moment(t).add('minutes', t.getTimezoneOffset() - tz.getTimezoneOffset()).toDate();
        excuteQuery.insertAndReturnKey(sqlQueryMap['insertFollowNotification'], [notifyObj.entity_id, notifyObj.type, notifyObj.link_id, 0, notifyObj.date_notification, notifyObj.user_id], function(err, rows) {
          if (err) {
            callback(err, null);
            //utility.appErrorHandler(err, res);
          } else {
            excuteQuery.update(sqlQueryMap['updateNotificationCount'], [notifyObj.entity_id], function(err, resultObj) {
              if (err) {
                callback(err, null);
                //utility.appErrorHandler(err, res);
              } else {
                callback(null, notifyObj);
                notifications(notifyObj.entity_id);
              }
            });
          }
        });
      }
    });
  } else {
    var time = require('time');
    var t = new Date();
    var tz = new time.Date(0, 'UTC');
    notifyObj.date_notification = moment(t).add('minutes', t.getTimezoneOffset() - tz.getTimezoneOffset()).toDate();
    excuteQuery.insertAndReturnKey(sqlQueryMap['insertFollowNotification'], [notifyObj.entity_id, notifyObj.type, notifyObj.link_id, 0, notifyObj.date_notification, notifyObj.user_id], function(err, rows) {
      if (err) {
        callback(err, null);
      } else {
        excuteQuery.update(sqlQueryMap['updateNotificationCount'], [notifyObj.entity_id], function(err, resultObj) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, notifyObj);
            notifications(notifyObj.entity_id);
          }
        });
      }
    });
  }
}

exports.getAllChampaigns = function(callback) {
  excuteQuery.queryForAll(sqlQueryMap['champaigns-list'], [], function(err, data) {
    if (!err) {
      callback(null, data);
    } else {
      callback(err, null);
    }

  });
};

// eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI4MzE1In0.0AzDvIrteyWV4JOoYV7zy6J7FFSSTrBqG7Y5HuNWyx0
exports.getRedisCodeData = function(req, res) {

  var token = req.body.stateToken; //"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI4MzE1In0.0AzDvIrteyWV4JOoYV7zy6J7FFSSTrBqG7Y5HuNWyx0"

  redisClient.get(token, function(err, result) {

    if (err) {
      res.send({
        error: err
      });
    } else {
      if (result) {
        var successObj = JSON.parse(result);
        excuteQuery.queryForAll(sqlQueryMap['getFundCampStatus'], [successObj.code_id], function(err, campaignResult) {
          if (err) {
            res.send({
              error: err
            });
          } else {
            res.send(campaignResult);
          }
        });
      } else {
        res.send({
          "error": 'Redis data has been expired'
        });
      }
    }
  });
};


exports.createRedisCodeData = function(data, callback) {

  var token = jwt.encode({
    iss: data.code_id
  }, app.get('jwtTokenSecret'));

  redisClient.set(token, JSON.stringify(data), function(err, result) {

    if (err) {
      callback(err, null);
    } else {
      if (result) {
        callback(null, {
          token: token,
        });
      } else {
        callback({
          "error": 'Token not set in redis'
        }, null);
      }
    }
  });
};

exports.generateRedisTokenForLogin = function(userid, visitedUserToken, callback) {

  var me = this;

  excuteQuery.queryForAll(sqlQueryMap['charityIds'], [userid], function(err, data) {
    if (err) {
      callback(err, null);
    } else {

      var userObj = {
        id: userid
      };

      if (data && data.length > 0) {
        var charityIds = underscore.compact(underscore.pluck(data, 'charity_id'));
        userObj.charityIds = charityIds;
      }

      me.setRedisToken(userObj, visitedUserToken, callback);
    }
  });
};

exports.setRedisToken = function(userObj, visitedUserToken, callback) {
  var token = jwt.encode({
    iss: userObj.id + uuid.v4()
  }, app.get('jwtTokenSecret'));

  //Making visitedUserToken as null coz as it is getting some default value from redis so not able to login or register
  if (!visitedUserToken) {
    visitedUserToken = null;
  }


  redisClient.get(visitedUserToken, function(err, redisData) {
    if (err) {
      callback(err, null);
    } else {
      if (redisData) {
        console.log("redisdata")
        console.log(redisData);
        var data = JSON.parse(redisData);
        for (var i in data) {
          userObj[i] = data[i];
        }
      }
      redisClient.set(token, JSON.stringify(userObj), function(err, redisTokenResult) {
        if (err) {
          callback(err, null);
        } else {

          if (redisTokenResult) {
            callback(null, {
              token: token
            });
          } else {
            callback({
              "error": 'Token not set in redis'
            }, null);
          }
        }
      });

    }
  });
};


exports.updateRedisData = function(req, res) {
  var token = (req.body && req.body.token) || (req.query && req.query.token) || req.headers['x-access-token'];
  var userObj = req.body;
  if (token) {
    redisClient.set(token, JSON.stringify(userObj), function(err, redisTokenResult) {
      if (err) {
        res.send({
          error: err
        });
      } else {

        if (redisTokenResult) {
          res.send(userObj);
        } else {
          res.send({
            "error": 'Token data not updated in redis'
          });
        }
      }
    });
  }

};


exports.getUserData = function(obj, callback) {
  async.parallel({
    user: function(usercallback) {

      excuteQuery.queryForAll(sqlQueryMap['fundraiserUserRegister'], [obj.id], usercallback);
    },
    charities: function(charitiesCallback) {
      if (obj.charityIds) {
        charityService.getCharityData(obj.id, charitiesCallback);
      } else {
        charitiesCallback(null, null);
      }
    },
    featureslist:function(featureslistcallback){
        excuteQuery.queryForAll(sqlQueryMap['userFeatures'],[obj.id],featureslistcallback);
    }
  }, function(err, asyncResult) {
    if (err) {
      callback(err, null);
    } else {
      var userObj = {};

      userObj = asyncResult.user[0];
      for (var i in obj) {
        userObj[i] = obj[i];
      }
      if (asyncResult.charities && asyncResult.charities.length > 0) {
        userObj.charities = asyncResult.charities;
        console.log('selectedcharity:',obj.selectedcharity);
        console.log(userObj.charities);
        userObj.selectedcharity = underscore.findWhere(userObj.charities, { charityId: obj.selectedcharity });
        console.log('selectedcharity:',userObj.selectedcharity);
      }
      if(asyncResult.featureslist && asyncResult.featureslist.length > 0){
        userObj.featureslist = asyncResult.featureslist;

      }
      callback(null, userObj);
    }
  });
};


exports.fileUpload = function(imgUrl, type, callback) {

  fs = require('fs');
  var path = '',
    name = '';
  var ext = '.jpg';

  var filename = 'profile/' + uuid.v4() + '-' + uuid.v4();

  var readStream = request.get({
    url: imgUrl,
  });

  name = filename + ext;
  storeInAmazon(readStream, name, function(err, url) {
    var jsonRes = {};
    jsonRes.success = true;
    jsonRes.url = url;

    var type = 'profile_pic';
    //jsonRes.url = props.thumbor + "283x283/" + url;
    jsonRes.originalUrl = url;

    urlStoreInRackspace(url, filename, ext, type);
    callback(null, jsonRes);
    var urlsData = {};
    urlsData.url = url;
    urlsData.filename = filename;
    urlsData.ext = ext;
    urlsData.type = type;
    //agenda.now('pic upload', urlsData);

  });
};

exports.generateUniqueSlug = function(req, res) {
  var me = this
  console.log('In generateUniqueSlug');
  charityService.generateRandomString(function(err, result) {
    if (err) {
      console.log(err);
      res.statusCode = 400;
      res.send({
        error: ['Error in generating slug']
      });
    } else {
      console.log('In the result');
      res.send({
        success: true,
        data: {
          slug: result.data.slug
        }
      });
    }
  });
}

exports.sendSlackAlarm = function(logMessage){

  var request = require('request');
  if(props.environment_type === 'demo' || props.environment_type === 'production'){
    request({
      url:'https://hooks.slack.com/services/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',
      method:'POST',
      json:{
        text:'New error in '+ logMessage.module +' module in host: '+props.domain +'\n ```'+JSON.stringify(logMessage,null,'\t')+'```',
        channel:'#graylog',
        username:props.domain
      }
    },function (error, response, body) {
      //console.log(error);
      //console.log(response);
      console.log(body);
    });
  }
}


exports.sendGivingSeasonEmail = function(req,res){
  app.render('./pages/giving-season-email-signup',function(err,html){
    var mailOptions = {
      from: props.fromemail, // sender address
      to: "amar@wonderwe.com", // list of receivers obj.admins.toString
      
      subject: 'Register your organization in Giving season', // Subject line
      text: '', // plaintext body
      html: html // html body
    };
    mail.sendEmail(mailOptions, function(err, result) {
      if (err) {
        callback(err, null);
      } else {
        console.log('7days campaign stats email sent successfully');
        callback(null, result);
        res.send('successfully registered');
      }
    });
  });
}

