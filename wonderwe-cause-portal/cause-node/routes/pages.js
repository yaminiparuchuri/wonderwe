var express = require('express');
var pagesRouter = express.Router();
var json2csv = require('nice-json2csv');
var fs = require('fs');
var mime = require('mime');
var donorService = require('../services/donors');
var feedServices = require('../services/feed');
var charityService = require('../services/charity');
var codeService = require('../services/code');
var followerService = require('../services/follower');
var settingsService = require('../services/settings');
var authRouter = require('../services/auth');
var pagesService = require('../services/pages');
var elasticService = require('../services/elastic');
var feedServices = require('../services/feed');
var countdown = require('countdown');
var teamService = require('../services/team');
var emoji = require('emojione');
var settingsService = require('../services/settings');



var slugController = require('../services/slug-controller');
var q = require('q');
var elasticService = require('../services/elastic');
var authService = require('../services/auth');
passport = require('passport');
FacebookStrategy = require('passport-facebook').Strategy;

pagesRouter.get('/activation', function(req, res, next) {
  res.set('Cache-Control', 'no-cache');
  res.render("./pages/activationpage", {});
});

//TODO: Reduce below two API's as one(As per need)
// Temprary fix for forgot password of donor
pagesRouter.get('/invitedonor/resetpassword/:id/:charityid/:charityName/:from', function(req, res, next) {
  res.set('Cache-Control', 'no-cache');
  res.render("./pages/resetpassword", {
    "id": req.params.id,
    "charityid": req.params.charityid,
    "charityName": req.params.charityName,
    "from": req.params.from,
    "layout": 'pages'
  });
});


pagesRouter.post('/visited/user/data', function(req, res, next) {

  var redisObj = req.body;
  // console.log("asjddjsdj");
  var token = (req.body && req.body.visitedUser) || (req.query && req.query.visitedUser) || req.headers['visiteduser'];
  redisClient.get(token, function(err, dataResult) {
    if (err) {
      res.send({ error: err });
    } else {

      var data = {};
      if (dataResult) {
        data = JSON.parse(dataResult);
      }

      if (Object.keys(redisObj).length > 0) {
        for (var i in redisObj) {
          data[i] = redisObj[i];
        }
        data = JSON.stringify(data);
      } else {
        data = '';
      }

      redisClient.set(token, data, function(err, redisTokenResult) {
        if (err) {
          callback(err, null);
        } else {
          if (redisTokenResult) {
            /* callback(null, {
               token: token
             });*/
            res.send({ token: token })

          } else {
            /* callback({
               "error": 'Token not set in redis'
             }, null);*/
            res.send({
              "error": 'Token not set in redis'
            })

          }
        }
      });
    }
  });
});

pagesRouter.get('/getstateid/:statecode', function(req, res, next) {
  var logsObj = req.logsObj;
  var stateCode = req.params.statecode;
  var obj = req.body;
  //  var limit=req.params.limit;

  codeService.updateStateId(stateCode, function(err, result) {
    if (err) {
      res.send(err);
    } else {
      console.log(result);
      var obj = {};
      obj.result = result;
      res.send(obj);
    }
  });
});

pagesRouter.get('/loadseeddata', function(req, res, next) {

  //req.headers['x-access-token'] = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOjIxNjZ9.IsCEEBiZNMH9h-v77yKheLaWYZ163Y9i26vkJad6XQk";
  var token = (req.body && req.body.token) || (req.query && req.query.token) || req.headers['x-access-token'];

  async.parallel({
      seedData: function(callback) {
        pagesService.getSeedData(callback);
      },
      user: function(callback) {
        if (token) {
          console.log("token.....");
          console.log(token);
          utility.tokenAuthVerify(req, function(err, result) {
            if (err) {
              callback(err, null);
            } else {
              var me = this;
              console.log("resuly in servicb");
              console.log(result);
              if (result) {
                console.log("service call");
                console.log(result);
                var obj = result;
                utility.getUserData(obj, callback);
                /* charityService.getCharityData(obj.id, function(err, charityResult) {
                   if (err) {
                     callback(err, null);
                   } else {
                     obj.charities = charityResult;
                     callback(null, obj);
                   }
                 });*/
              } else {
                callback(null, null);
              }
            }
          });
        } else {
          callback(null, null);
        }
      },
      geoData: function(callback) {
        var geoip2ws = require('geoip2ws')(props.geoserviceid, props.geoservicekey);
        var ipAddress = req.ip;
        //TODO:We will put some Kansas IP for the Localhost
        if (ipAddress === '127.0.0.1') {
          ipAddress = "104.250.146.37";
        }
        //If the IP is the Same Please Cache it in Redis and Get this Back.
        // redisClient.set(token, user, callback);
        try {
          redisClient.get(ipAddress, function(err, geoData) {
            if (err) {
              callback(err, null);
            } else if (geoData) {
              callback(null, JSON.parse(geoData));
            } else {
              geoip2ws(ipAddress, function(err, result) {
                if (err) {
                  //Making it Successful As we might not have Data for IP Address.
                  callback(null, null);
                } else {
                  redisClient.set(ipAddress, JSON.stringify(result), function(err, rediReturnVal) {
                    callback(null, result);
                  });
                }
              });
            }
          });
        } catch (err) {
          console.error(err);
          callback(null, null);
        }

      }
    },
    function(err, result) {
      if (err) {
        //Need to Send the Error Back
        console.error(err);
        res.send({
          status: "error",
          "message": "Some Issue Occured - Users can not continue."
        })
      } else {
        // console.log(result.user);
        //console.log("loadseeddatacall....")
        //console.log(result);
        res.send(result);
      }
    });
});



pagesRouter.get('/approve/charity/resetpassword/:id/:charityid/:charityName/:from', function(req, res, next) {
  res.set('Cache-Control', 'no-cache');
  res.render('./pages/resetPasswordApproveCharity', {
    "id": req.params.id,
    "charityid": req.params.charityid,
    "charityName": req.params.charityName,
    "from": req.params.from
  });
});

pagesRouter.get('/resetpassword/:id', function(req, res, next) {
  res.set('Cache-Control', 'no-cache');
  var logsObj = req.logsObj;
  var obj = {};
  obj.id = req.params.id
  obj.layout = "pages"
  if (req.query.admin) {
    obj.from = "admin"
  } else if (req.query.team) {
    obj.from = "team"
  }
  if (req.query.teamfundraise) {
    obj.from = "teamfundraise"
    obj.teamid = req.query.teamid;
  }
  if (obj && obj.from == 'team') {
    obj.maincampaignslug = req.query.mainCampaignSlug;
    obj.teamid = req.query.teamid;
  }
  if (obj && obj.from == 'team' || obj.from == 'teamfundraise') {
    excuteQuery.queryForAll(sqlQueryMap['gettingTeamDetails'], obj.teamid, function(err, teamResult) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        if (teamResult && teamResult[0]) {
          excuteQuery.queryForAll(sqlQueryMap['checkTeamInvitee'], [obj.id, obj.teamid, obj.id], function(err, result) {
            if (err) {
              utility.newAppErrorHandler(err, logsObj, res);
            } else {
              if (result && result[0]) {
                if (result[0].deleted_by) {
                  var denyObj = {};
                  denyObj.denied = "yes";
                  denyObj.layout = "pages";
                  res.render("./pages/teamInviteeDeny", denyObj)
                } else if (result[0].created == "yes") {
                  var denyObj = {};
                  denyObj.created = "created";
                  denyObj.layout = "pages";
                  res.render("./pages/teamInviteeDeny", denyObj);
                } else {
                  if (result[0].password_salt) {
                    if (obj.from == "team") {
                      res.redirect(props.domain + '/' + obj.maincampaignslug + '?teamid=' + obj.teamid + '&userid=' + obj.id + '&teamMember=yes');
                    } else {
                      res.redirect(props.domain + '/login?teamid=' + obj.teamid + '&userid=' + obj.id);
                    }
                  } else {
                    res.render("./pages/resetpassword", obj);
                  }
                }
              } else {
                var teamDeny = {};
                teamDeny.noInvite = "yes";
                teamDeny.layout = "pages";
                res.render("./pages/teamInviteeDeny", teamDeny)
              }
            }
          });
        } else {
          var teamObj = {};
          teamObj.noTeam = "yes";
          teamObj.layout = "pages";
          res.render("./pages/teamInviteeDeny", teamObj)
        }
      }
    });
  } else {
    res.render("./pages/resetpassword", obj);
  }
});

pagesRouter.post('/forgotpassword/update', function(req, res, next) {
  var obj = req.body;
  console.log(obj);
  var logsObj = req.logsObj;
  excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [obj.id], function(err, saltpass) {
    if (err) {
      console.log(err);
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      if (saltpass && saltpass.length > 0 && saltpass[0].password_salt) {
        var salt = saltpass[0].password_salt;
        var pass = utility.passwordEncrypt(obj.password, salt);
        excuteQuery.update(sqlQueryMap['forgotPasswordUpdate'], [pass.password, pass.password_salt, 'Wonderwe', obj.id], function(err, data) {
          if (err) {
            utility.newAppErrorHandler(err, logsObj, res);
          } else {
            //TODO send a valid response json format
            console.log('Password updated');
            utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "forgotpassword update, done, In pages route"]);
            res.send({
              'msg': 'success'
            });
          }
        });
      } else {
        console.log('in the else');
        var pass = utility.passwordsaltEncrypt(obj.password);
        var logsObj = req.logsObj;
        excuteQuery.update(sqlQueryMap['passwordUpdateNow'], [pass.password, pass.password_salt, 'yes','Wonderwe', obj.id], function(err, data) {
          if (err) {
            console.log(err);
            utility.newAppErrorHandler(err, logsObj, res);
          } else {
            console.log(data);
            //TODO send a valid response json format
            // if (props.environment_type === "development") {

            authRouter.defaultFollowUser(obj.id, function(err, result) {});
            authRouter.defaultFollowCharity(obj.id, function(err, result) {});
            // }
            utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "forgotpassword update, done, In pages route"]);
            console.log('success');
            res.send({
              'msg': 'success'
            });
            excuteQuery.queryForAll(sqlQueryMap['getEntity'], [obj.id, 'user'], function(err, entityInfo) {
              if (err) {
                callback(err, null);
              } else {
                var entityObj = {};
                entityObj.entity_id = obj.id;
                entityObj.entity_type = 'user';
                if (entityInfo && entityInfo.length > 0) {
                  entityObj.id = entityInfo[0].id;
                  entityObj.slug = entityInfo[0].slug;
                }
                agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
              }
            });
          }
        });
      }

    }
  });

});

pagesRouter.post('/forgotpassword/update/login', function(req, res, next) {
  var obj = req.body;
  var resObj = {};
  var logsObj = req.logsObj;
  console.log(obj);
  excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [obj.id], function(err, saltpass) {
    if (err) {
      console.log(err);
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      if (saltpass && saltpass.length > 0 && saltpass[0].password_salt) {
        utility.appErrorHandler({
          error: 'Password already taken',
          flag: true
        }, res);
      } else {
        console.log('in the else');
        var pass = utility.passwordsaltEncrypt(obj.password);
        console.log('in password update')
        excuteQuery.update(sqlQueryMap['passwordUpdateNow'], [pass.password, pass.password_salt, 'yes','Wonderwe', obj.id], function(err, data) {
          if (err) {
            console.log(err);
            utility.newAppErrorHandler(err, logsObj, res);
          } else {
            console.log(data);
            //TODO send a valid response json format
            if (props.environment_type === "production") {
              authRouter.defaultFoll0wUser(obj.id, function(err, result) {});
              authRouter.defaultFoll0wCharity(obj.id, function(err, result) {});
            }
            utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "forgotpassword update, done, In pages route"]);
            console.log('success');
            authService.donorDefaultLogin({
              userid: obj.id
            }, function(err, result) {
              if (err) {
                utility.newAppErrorHandler(err, logsObj, res);
              } else {
                resObj.data = {
                  token: result.token,
                  msg: 'success'
                };
                utility.dataHandler(resObj, res);
              }
            });
            excuteQuery.queryForAll(sqlQueryMap['getEntity'], [obj.id, 'user'], function(err, entityInfo) {
              if (err) {
                callback(err, null);
              } else {
                var entityObj = {};
                entityObj.entity_id = obj.id;
                entityObj.entity_type = 'user';
                if (entityInfo && entityInfo.length > 0) {
                  entityObj.id = entityInfo[0].id;
                  entityObj.slug = entityInfo[0].slug;
                }
                agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
              }
            });
          }
        });
      }

    }
  });
});

pagesRouter.get('/password/success', function(req, res, next) {

  var flag = req.query.flag;
  res.set('Cache-Control', 'no-cache');
  res.render("./pages/passupdate", {});
});

pagesRouter.get('/campians', function(req, res, next) {
  res.set('Cache-Control', 'no-cache');
  res.render("./pages/campaignpage", {});
});
//For Campaign Page


pagesRouter.get('/unique/campaign/:code', function(req, res, next) {
  var wecode = req.params.code;
  var logsObj = req.logsObj;
  donorService.codeSerach(wecode, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {

      if (data && data.length > 0) {

        res.send(data[0]);

      } else {

        res.send({
          error: 'not found',
          suggestions: data,
          code: req.params.code
        });

        /* elasticService.getSuggestions(wecode)
           .then(function(data) {
             res.send({
               error: 'not found',
               suggestions: data,
               code: req.params.code
             });
           }).fail(function(err) {

             res.send({
               error: err
             });

           });*/
      }
    }
  });
});


pagesRouter.get('/campaign/suggestions/:keycode', function(req, res) {

  elasticService.getSuggestions(req.params.keycode)
    .then(function(data) {
      res.set('Cache-Control', 'no-cache');
      res.render('./pages/campaignSuggestions', {
        suggestions: data
      });
    }).fail(function(err) {
      res.send({
        error: err
      });

    });


});

//follow donor from email

pagesRouter.get('/follow/donor/:userId/:followID', function(req, res, next) {
  var followobj = {};
  var logsObj = req.logsObj;
  followobj.user_id = req.params.userId;
  followobj.following_id = req.params.followID;
  followobj.followeduser_id = req.params.followID;
  followobj.date_followed = moment().toDate();
  var type = req.query.type;
  if (type === 'user') {
    followerService.createFollowUser(followobj, function(err, data) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        res.redirect(props.domain + '/' + data.slug);

      }
    });
  } else if (type === 'code') {
    followerService.createFollowCode(followobj, function(err, data) {
      if (err) {

      } else {

      }
    });
  } else if (type === 'charity') {
    followerService.createFollowCharity(followobj, function(err, data) {
      if (err) {

      } else {

      }
    });
  }







});



pagesRouter.get('/campaign/:codeId', function(req, res, next) {
  slugController.publicCampaignProfile(req, res);
});

pagesRouter.get('/organization/:charityId', function(req, res, next) {
  slugController.publicCharityProfile(req, res);
});

pagesRouter.get('/user/profile/:userId', function(req, res, next) {
  slugController.publicUserProfile(req, res);
});
pagesRouter.get('/trending/campains', function(req, res, next) {
  var logsObj = req.logsObj;
  donorService.curentTrendingCampains("", function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get trending campains, done, In pages route"]);
      utility.dataHandler(resObject, res);
    }
  });
});
pagesRouter.get('/follow/suggestions', function(req, res, next) {
  var skip = req.query.skip;
  var flag = req.query.flag;
  var logsObj = req.logsObj;
  /*  donorService.followRecommendations(" ", flag, skip, function(err, data) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        var resObject = {};
        resObject.data = data;
        utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get whotofollow data, done, In pages route"]);
        utility.dataHandler(resObject, res);
      }
    });
  */
  var type = req.query.type;
  if (!type || type === 'undefined') {
    donorService.followRecommendations(" ", flag, skip, function(err, data) {
      if (err) {
        utility.log('error', "followRecommendations in donorService from page route - " + req.cookies.logindonorid);
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        var resObject = {};
        resObject.data = data;
        utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get whotofollow data, done, In pages route"]);
        utility.dataHandler(resObject, res);
      }
    });
  } else {
    donorService.outSideFollowRecommendations(" ", flag, skip, type, function(err, data) {
      if (err) {
        utility.log('error', "followRecommendations in donorService from page route - " + req.cookies.logindonorid);
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        var resObject = {};
        resObject.data = data;
        utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get whotofollow data, done, In pages route"]);
        utility.dataHandler(resObject, res);
      }
    });
  }
});
pagesRouter.get('/gallery/:entityId', function(req, res, next) {
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
      var obj = {};
      obj.data = result;
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get gallery, done, In pages route"]);
      utility.dataHandler(result, res);
    }

  });
});
pagesRouter.get('/postandreplies/:entityId/:skip/:followers', function(req, res, next) {
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
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get postandreplies, done, In pages route"]);
      var obj = {};
      obj = result;
      utility.dataHandler(obj, res);
    }
  });
});
pagesRouter.get('/mentions/:entityId/:skip/:followers', function(req, res, next) {
  var entityId = req.params.entityId;
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
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get entity mentions, done, In pages route"]);
      utility.dataHandler(result, res);
    }
  });
});

pagesRouter.get('/search/campaign', function(req, res, next) {

  /* var data = req.query.codeid;
   var obj = {};
   obj.wecode = data;
   utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "load 404/campain, done, In pages route"]);
   res.render('./pages/campaign-404', obj);*/
  var userDevice = device(req.headers['user-agent']);
  var isPhone = userDevice.is('phone');
  var claim=req.query.flag;
  if (req.query.codeid) {
    var query = {
      q: req.query.codeid,
      user_id: '',
      skip: '0',
      limit: '50',
      fields: [
        'wecode'
      ]
    };
    query.flag = 'wecodesearch';
  } else {
    var chname = req.query.charity.split("'").join('');
    var query = {
      q: chname.split('-').join(''),
      user_id: req.query.user_id,
      skip: '0',
      limit: '50',
      fields: ['username',
        'fullname',
        'state',
        'text',
        'city',
        'description',
        'tags',
        'wecode',
        'ein'
      ]
    }
    query.flag = 'fundraise';
  }

  if (query && (query.q.indexOf('#') + 1)) {
    query.fields = ['wecode'];
    query.q = query.q.split('#')[1];
  }

  var records = [];
  var query_fields = query.fields
  var type = 'phrase_prefix';

  if (query.q.split(' ').length > 1) {
    type = 'cross_fields';
  }
  if (req.query.search != "undefined" && req.query.charity) {
    var elasticSeachQuery = {
      "size": 10,
      "from": 0,
      "query": {
        "filtered": {
          "filter": {}
        },
      }
    }
  } else if (query.flag === "fundraise") {
    var npSearchQuery;
    if (isPhone) {
      npSearchQuery = {
        "filtered": {
          "filter": { "term": { "status": "approved" } },
          "query": {
            "multi_match": {
              "query": query.q,
              "type": type,
              "fields": query_fields || ["fullname", "username", "text", "state", "city", "description", "wecode", "ein"]
            }
          }
        }
      };
    }else if(claim&&claim=='claim'){
      npSearchQuery = {
        "filtered": {
          "filter": { "term": { "status": "not_claimed" } },
          "query": {
            "multi_match": {
              "query": query.q,
              "type": type,
              "fields": query_fields || ["fullname", "username", "text", "state", "city", "description", "wecode", "ein"]
            }
          }
        }
      };
    }
    else {
      npSearchQuery = {
        bool: {
          should: [{
              multi_match: {
                query: query.q,
                type: 'phrase_prefix',
                //  operator: "and",
                fields: query_fields || ['text', 'username', 'fullname', 'wecode', 'ein', 'status'],
                minimum_should_match: "95%"
              }
            }, {
              multi_match: {
                query: query.q,
                type: type,
                //  operator: "and",
                fields: query_fields || ['text', 'username', 'fullname', 'wecode', 'ein', 'status'],
              }
            }

          ]
        }
      };

    }
    var elasticSeachQuery = {
      size: parseInt(req.query.limit) || 50,
      query: npSearchQuery,
      highlight: {
        "pre_tags": ['<b>'],
        "post_tags": ['</b>'],
        fields: {
          'username': {},
          'fullname': {},
          'state': {},
          'city': {},
          'description': {},
          'wecode': {},
          'approved': {},
          'id': {},
          'status': {}
        }
      }
    };
  } else {
    var elasticSeachQuery = {
      size: parseInt(req.query.limit) || 50,
      query: {
        multi_match: {
          query: query.q,
          type: type,
          //  operator: "and",
          fields: query_fields || ['text', 'username', 'fullname', 'wecode', 'ein'],
        }
      }
    };
    if (query.skip) {
      elasticSeachQuery.from = parseInt(req.skip);
    }
  }

  //console.log(elasticSeachQuery.query);
  var serachQuery = {
    index: props.elastic_index,
    type: 'entity',
    body: elasticSeachQuery
  };

  if (req.query.charity) {
    utility.nodeLogs('Info', 'In the non profit search');
    serachQuery.index = props.elastic_index + '_np';
    serachQuery.type = 'charity_for_fundraiser';
  } else {
    utility.nodeLogs('info', 'In the entity');
    serachQuery.index = props.elastic_index;
    serachQuery.type = 'entity';
  }

  // console.log(serachQuery);
  elasticClient.search(serachQuery, function(err, result) {
    if (err) {
      res.status(500);
      res.send(err);
    } else {

      if (result.hits.hits.length > 0) {
        //     console.log('We found the data...');
        res.status(200);
        if (query && query.fields) {

          if (req.query.wecode_complete) {
            // Only wecodes Autocomplete condition (we#)
            elasticService.maintainCampaignStatus(result.hits.hits, query, req, res);
          } else {
            // Seach results use case
            elasticService.elasticFollowStatus(result.hits.hits, query, req, res);
          }
        } else {
          // Autocomplete on username, fullname, wecode and text
          elasticService.maintainCampaignStatus(result.hits.hits, query, req, res);
        }
      } else {
        utility.nodeLogs('INFO', 'In the fuzzy search codee');
        elasticService.fuzzySearchWecode(query, query_fields, req.query.limit, isPhone, claim)
          .then(function(data) {
            res.status(200);

            if (data && data.length > 0) {

              if (query && query.fields) {
                if (req.query.wecode_complete) {
                  // Only wecodes Autocomplete condition (we#)
                  elasticService.maintainCampaignStatus(data, query, req, res);
                } else {
                  // Seach results use case
                  elasticService.elasticFollowStatus(data, query, req, res);
                }
              } else {
                // Autocomplete on username, fullname, wecode and text
                elasticService.maintainCampaignStatus(data, query, req, res);
              }
            } else {
              res.send(data);
            }
            //   elasticFollowStatus(data, query, req, res)
          })
          .fail(function(err) {
            res.send(err);
          });
      }
    }
  });
});

//Start: Sitelink Search Box
pagesRouter.get('/search-results', function(req, res, next) {
  redisClient.get(req.cookies.token, function(err, redisResult) {
    if (redisResult) {
      redisResult = JSON.parse(redisResult);
      req.query.logindonorid = redisResult.id
    }
    var query = req.query;
    query.searchQuery = toSearchQueryString(req.query.q);
    if (query && (query.q.indexOf('#') + 1)) {
      query.fields = ['wecode'];
      query.q = query.q.split('#')[1];
    }

    var records = [];
    var query_fields = query.fields
    var type = 'phrase_prefix';

    if (req.query.q.split(' ').length > 1) {
      type = 'cross_fields';
    }
    var elasticSeachQuery = {
      size: parseInt(req.query.limit) || 50,
      query: {
        bool: {
          should: [{
              multi_match: {
                query: query.q,
                type: 'phrase_prefix',
                //  operator: "and",
                fields: query_fields || ['text', 'username', 'fullname', 'wecode', 'ein', 'status'],
                minimum_should_match: "95%"
              }
            }, {
              multi_match: {
                query: query.q,
                type: type,
                //  operator: "and",
                fields: query_fields || ['text', 'username', 'fullname', 'wecode', 'ein', 'status'],
              }
            }

          ]
        }
      },
      highlight: {
        "pre_tags": ['<b>'],
        "post_tags": ['</b>'],
        fields: {
          'username': {},
          'fullname': {},
          'state': {},
          'city': {},
          'description': {},
          'wecode': {}
        }
      }
    };

    if (req.query.skip) {
      elasticSeachQuery.from = parseInt(req.query.skip);
    }

    elasticClient.search({
      index: props.elastic_index,
      type: 'entity',
      body: elasticSeachQuery
    }, function(err, result) {
      if (err) {
        res.status(500);
        res.send(err);
      } else {
        if (result.hits.hits.length) {
          res.status(200);
          //utility.nodeLogs('INFO', result.hits.hits);
          elasticService.elasticFollowStatusSLSearch(result.hits.hits, query, req, res);
        } else {
          console.log('In not found');
          //   TODO: Added this Let's check why we need this?
          //  query.campaignFor ='charity';
          utility.nodeLogs('INFO', 'In fuzzy search code');
          elasticService.fuzzySearchWecode(query, query_fields, req.query.limit, null)
            .then(function(data) {
              res.status(200);
              elasticService.elasticFollowStatusSLSearch(data, query, req, res);
            })
            .fail(function(err) {
              res.send(err);
            });
        }
        //Need to ask trinesh


        // if (result.hits.hits.length) {
        //   res.status(200);
        //   elasticService.elasticFollowStatusSLSearch(result.hits.hits, query, req, res);
        // } else {
        //   //   TODO: Added this Let's check why we need this?
        //   //  query.campaignFor ='charity';
        //   elasticService.fuzzySearchWecode(query, query_fields, req.query.limit)
        //     .then(function(data) {
        //       res.status(200);
        //       elasticService.elasticFollowStatusSLSearch(data, query, req, res);
        //     })
        //     .fail(function(err) {
        //       res.send(err);
        //     });
        // }

      }
    });
  })
});
//End: Sitelink Search Box

//Start: Sitelink Search Box mobile
pagesRouter.get('/mobile/search-results', function(req, res, next) {
  var query = req.query;
  query.searchQuery = toSearchQueryString(req.query.q);
  if (query && (query.q.indexOf('#') + 1)) {
    query.fields = ['wecode'];
    query.q = query.q.split('#')[1];
  }

  var records = [];
  var query_fields = query.fields
  var type = 'phrase_prefix';

  if (req.query.q.split(' ').length > 1) {
    type = 'cross_fields';
  }
  var elasticSeachQuery = {
    size: parseInt(req.query.limit) || 50,
    query: {
      multi_match: {
        query: query.q,
        type: type,
        //  operator: "and",
        fields: query_fields || ['text', 'username', 'fullname', 'wecode'],
      }
    },
    highlight: {
      "pre_tags": ['<b>'],
      "post_tags": ['</b>'],
      fields: {
        'username': {},
        'fullname': {},
        'state': {},
        'city': {},
        'description': {},
        'wecode': {}
      }
    }
  };

  if (req.query.skip) {
    elasticSeachQuery.from = parseInt(req.query.skip);
  }

  elasticClient.search({
    index: props.elastic_index,
    type: 'entity',
    body: elasticSeachQuery
  }, function(err, result) {
    if (err) {
      res.status(500);
      res.send(err);
    } else {
      if (result.hits.hits.length) {
        res.status(200);
        elasticService.elasticFollowStatusSLSearchMobile(result.hits.hits, query, req, res);
      } else {
        //   TODO: Added this Let's check why we need this?
        //  query.campaignFor ='charity';
        elasticService.fuzzySearchWecode(query, query_fields, req.query.limit, null)
          .then(function(data) {
            res.status(200);
            elasticService.elasticFollowStatusSLSearchMobile(data, query, req, res);
          })
          .fail(function(err) {
            res.send(err);
          });
      }

    }
  });

});
//End: Sitelink Search Box Mobile

//organization onboarding process
pagesRouter.get('/onboarding/organization/stepone/:name/:id/:userid', function(req, res, next) {
  res.redirect('/pages/onboarding/organization/stepone/' + req.params.id + '/' + req.params.userid);
});

pagesRouter.get('/onboarding/organization/stepone/:id/:userid', function(req, res, next) {

  var object = {};
  object.id = req.params.id;
  object.userid = req.params.userid;
  object.layout = 'onboarding';

  excuteQuery.queryForAll(sqlQueryMap['selectedCharityDetails'], [object.id], function(err, userResult) {
    if (err) {
      utility.log('error', "onboarding/stepone from page route - " + req.cookies.logindonorid);
      callback(err);
    } else {
      if (userResult && userResult.length > 0) {
        if (userResult[0].charityonboarding === 1) {
          utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "onboarding stepone, done, In pages route"]);
          res.redirect('/login');
        } else {
          object.title = userResult[0].title;
          utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "onboarding stepone, done, In pages route"]);
          res.set('Cache-Control', 'no-cache');
          res.render('./pages/orgOnboardingStepOne', object);
        }
      }
    }
  });

});
pagesRouter.get('/onboarding/organization/steptwo/:id/:userid', function(req, res, next) {
  var charityId = req.params.id;
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
      if (result.data && result.data[0] && result.data[0].organization_id) {
        var object = {};
        object = result.data[0];
        object.id = req.params.id;
        object.userid = req.params.userid;
        if (result.data[0] && result.data[0].category && result.data[0].category.length > 0) {
          object.category = JSON.stringify(result.data[0].category);
        }
        if (object.brief_description) {
          object.description = object.brief_description
        } else {
          object.description = object.charity_discription
        }
        object.domain = props.domain;
        object.layout = 'onboarding';
        utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "onboarding steptwo, done, In pages route"]);
        res.set('Cache-Control', 'no-cache');
        res.render('./pages/orgonboardingsteptwo', object);
      } else {
        var object = {};
        object.domain = props.domain;
        object.title = req.query.name;
        object.id = req.query.id;
        object.userid = req.query.userid;
        object.brief_description = '';
        object.profile_pic_url = '';
        object.web_url = '';
        object.layout = 'onboarding';
        utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "onboarding steptwo, done, In pages route"]);
        res.set('Cache-Control', 'no-cache');
        res.render('./pages/orgonboardingsteptwo', object);
      }
    }
  });
});

pagesRouter.get('/onboarding/organization/stepthree/:id/:userid/:name', function(req, res, next) {

  res.redirect('/pages/onboarding/organization/stepthree/' + req.params.id + '/' + req.params.userid);
});


pagesRouter.get('/onboarding/organization/stepthree/:id/:userid', function(req, res, next) {

  excuteQuery.queryForAll(sqlQueryMap['getDefaultCharityData'], [req.params.id], function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else if (result) {
      var object = {};
      if (result && result.length > 0) {
        object = result[0]
      }

      //  var object = {};
      object.charityId = req.params.id;
      object.id = req.params.id;
      object.userid = req.params.userid;
      //object.title = req.params.name;
      object.layout = 'onboarding';
      object.domain = props.domain;
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "onboarding stepthree, done, In pages route"]);
      res.set('Cache-Control', 'no-cache');
      res.render('./pages/orgonboardingstepthree', object)
    }
  });
});

pagesRouter.get('/onboarding/organization/stepfour/:id/:userid', function(req, res, next) {


  excuteQuery.queryForAll(sqlQueryMap['getDefaultCharityData'], [req.params.id], function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else if (result) {
      var object = {};
      if (result && result.length > 0) {
        object = result[0]
      }
      //    var object = {};

      object.charityId = req.params.id;
      object.userid = req.params.userid;
      object.layout = 'onboarding';
      object.domain = props.domain;

      //object.id = req.params.id;
      //          object.userid = req.params.userid;
      //           object.layout = 'onboarding';
      //            object.domain = props.domain;
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "onboarding stepthree, done, In pages route"]);
      res.set('Cache-Control', 'no-cache');
      res.render('./pages/orgonboardingstepfour', object);
    }
  });

});

pagesRouter.get('/onboarding/organization/stepfive/:id/:userid', function(req, res, next) {

  excuteQuery.queryForAll(sqlQueryMap['getCharityUserDetails'], [req.params.userid, req.params.id], function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else if (result) {
      var object = {};
      if (result && result.length > 0) {
        object = result[0]
      }
      //    var object = {};
      object.charityId = req.params.id;
      object.userid = req.params.userid;
      object.layout = 'onboarding';
      object.domain = props.domain;
      object.client_id = props.client_id;
      object.stepfive = "step5";
      object.redirect_uri = props.domain + '/stripe/oauth/callback';

      object.stripe_state = object.charityId + '-' + object.userid + '-' + 'onboarding';
      object.stripe_client_id = props.stripe_client_id;
      object.country_code = object.country_code;

      if (props.environment_type == 'production') {
        object.environment_type = "production";
      } else {
        object.environment_type = "stage";
      }

      if (!object.account_id) {
        delete object.account_id;
      }

      if (object.country_code === 'US' || object.country_code === 'CA') {
        object.payment_method = 'WePay';
      }
      //object.id = req.params.id;
      //          object.userid = req.params.userid;
      //           object.layout = 'onboarding';
      //            object.domain = props.domain;
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "onboarding stepfive, done, In pages route"]);
      res.set('Cache-Control', 'no-cache');
      res.render('./pages/org-onboarding-step5', object);
    }
  });

});



//Donor onboarding process
pagesRouter.get('/takeatour/donor/stepone/:userid/:name', function(req, res, next) {
  var object = {};
  var logsObj = req.logsObj;
  object.name = req.params.name;
  object.userid = req.params.userid;
  object.layout = 'onboarding';
  excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [object.userid], function(err, userResult) {
    if (err) {
      utility.log('error', "takeatour/stepone from page route - " + req.cookies.logindonorid);
      callback(new Error(err), null);
    } else {
      if (userResult && userResult.length > 0) {
        if (userResult[0].donoronboarding == 1) {
          utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "takeatour stepone, done, In pages route"]);
          authRouter.userAutoLogin(userResult[0].id, function(err, resultToken) {
            if (err) {
              utility.newAppErrorHandler(err, logsObj, res);
            } else {
              //res.cookie('donortoken', resultToken.token);
              res.cookie('token', resultToken.token);
              res.redirect('/login');
            }
          });
        } else {
          utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "takeatour stepone, done, In pages route"]);
          res.set('Cache-Control', 'no-cache');
          res.render('./pages/donoronboardingstepone', object);
        }
      }
    }
  });
});

pagesRouter.get('/passionate/about/donor/onboarding/:userid', function(req, res, next) {
  var object = {};
  var logsObj = req.logsObj;
  object.userid = req.params.userid;
  object.layout = 'onboarding';
  utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "passionate about donor, done, In pages route"]);
  res.set('Cache-Control', 'no-cache');
  res.render('./pages/donoronboardingsteptwo', object);
});

pagesRouter.get('/suggestions/for/donor/onboarding/:userid', function(req, res, next) {
  var userid = req.params.userid;
  pagesService.getusercategories(userid, function(err, categories) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      if (categories && categories.length) {
        var categories = underscore.pluck(categories, 'category_id');
        var skip = 0;
        pagesService.followOnboardingRecommendations(categories, req.params.userid, skip, function(err, recomendation) {
          if (err) {
            utility.newAppErrorHandler(err, logsObj, res);
          } else {
            if (recomendation && recomendation.length > 0) {
              var object = {};
              object.userid = req.params.userid;
              object.users = underscore.where(recomendation, {
                entity_type: 'user'
              });
              object.charity = underscore.where(recomendation, {
                entity_type: 'charity'
              });
              object.layout = 'onboarding';
              utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "suggestions for donor onboarding, done, In pages route"]);
              res.set('Cache-Control', 'no-cache');
              res.render('./pages/donoronboardingstepthree', object);
            } else {
              donorService.followRecommendations(req.params.userid, "pages", "", function(err, data) {
                if (err) {
                  utility.newAppErrorHandler(err, logsObj, res);
                } else {
                  var object = {};
                  object.userid = req.params.userid;
                  object.users = underscore.where(data, {
                    entity_type: 'user'
                  });
                  object.charity = underscore.where(data, {
                    entity_type: 'charity'
                  });
                  object.code = underscore.where(data, {
                    entity_type: 'code'
                  });
                  object.layout = 'onboarding';
                  utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "suggestions for donor onboarding, done, In pages route"]);
                  res.set('Cache-Control', 'no-cache');
                  res.render('./pages/donoronboardingstepthree', object);
                }
              });
            }
          }
        });
      } else {
        donorService.followRecommendations(userid, "pages", "", function(err, data) {
          if (err) {
            utility.newAppErrorHandler(err, logsObj, res);
          } else {
            var object = {};
            object.userid = req.params.userid;
            object.users = underscore.where(data, {
              entity_type: 'user'
            });
            object.charity = underscore.where(data, {
              entity_type: 'charity'
            });
            object.code = underscore.where(data, {
              entity_type: 'code'
            });
            object.layout = 'onboarding';
            utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "suggestions for donor onboarding, done, In pages route"]);
            res.set('Cache-Control', 'no-cache');
            res.render('./pages/donoronboardingstepthree', object);
          }
        });
      }
    }
  });
});

pagesRouter.post('/public/follow/charity/:id', function(req, res, next) {
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
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "public follow charity, done, In pages route"]);
      utility.dataHandler(responseData, res);
    }
  });

});

pagesRouter.get('/invited/follow/charity/:id/:charityId/:charityName/:from', function(req, res, next) {
  //If we get the Charity ID and Get the Entity ID Based on Charity and Insert into Follow Table.
  //TODO: Add the Validation
  var followObj = {};
  followObj.user_id = req.params.id;
  followObj.charity_id = req.params.charityId;
  followObj.charityName = req.params.charityName;
  followObj.date_followed = moment().toDate();
  var from = req.params.from;
  if (from == 'charity') {
    followerService.createFollowCharity(followObj, function(err, result) {
      if (err) {
        utility.log('error', "createFollowCharity in followerService from page route - " + req.cookies.logindonorid);
        var resObject = {};
        resObject = followObj;
        resObject.layout = 'onboarding';
        res.set('Cache-Control', 'no-cache');
        res.render('./pages/alreadyfollowing', resObject);
        // loggermessage(req, "error", err, "createFollow Charity - 1 - routes/follower.js ");
        //appErrorHandler(err, res);
      } else {
        //Send 200 Status With Real Data
        var resObject = {};
        resObject = followObj;
        resObject.layout = 'onboarding';
        res.set('Cache-Control', 'no-cache');
        res.render('./pages/followsuccess', resObject);
      }
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "create follow charity, done, In pages route"]);
    });
  } else if (from == 'donor') {
    var followObj = {};
    followObj.user_id = req.params.id;
    followObj.followeduser_id = req.params.charityId;
    followObj.charityName = req.params.charityName;
    followObj.date_followed = moment().toDate();
    followObj.notify_type = 'accept';
    followerService.createFollowUser(followObj, function(err, result) {
      if (err) {
        utility.log('error', "createFollowUser in followerService from page route - " + req.cookies.logindonorid);
        var resObject = {};
        resObject = followObj;
        resObject.layout = 'onboarding';
        res.set('Cache-Control', 'no-cache');
        res.render('./pages/alreadyfollowing', resObject);
        //loggermessage(req, "error", err, "createFollow Charity - 1 - routes/follower.js ");
        //appErrorHandler(err, res);
      } else {
        //Send 200 Status With Real Data
        var resObject = {};
        resObject = followObj;
        resObject.layout = 'onboarding';
        res.set('Cache-Control', 'no-cache');
        res.render('./pages/followsuccess', resObject);
      }
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "create follow user, done, In pages route"]);
    });
  }

});


pagesRouter.get('/follow/:id/:fuserId/:userName', function(req, res, next) {
  var followObj = {};
  followObj.user_id = req.params.fuserId;
  followObj.followeduser_id = req.params.id;
  followObj.charityName = req.params.userName;
  followObj.date_followed = moment().toDate();
  followerService.createFollowUser(followObj, function(err, result) {
    if (err) {
      var resObject = {};
      resObject = followObj;
      resObject.layout = 'onboarding';
      res.set('Cache-Control', 'no-cache');
      res.render('./pages/alreadyfollowing', resObject);
    } else {
      var resObject = {};
      resObject = followObj;
      resObject.layout = 'onboarding';
      res.set('Cache-Control', 'no-cache');
      res.render('./pages/followsuccess', resObject);
    }
  });
});
pagesRouter.get('/invited/follow/charity/:id/:charityId/:charityName', function(req, res, next) {
  //If we get the Charity ID and Get the Entity ID Based on Charity and Insert into Follow Table.
  //TODO: Add the Validation
  var followObj = {};
  var logsObj = req.logsObj;
  followObj.user_id = req.params.id;
  followObj.charity_id = req.params.charityId;
  followObj.charityName = req.params.charityName;
  followObj.date_followed = moment().toDate();
  followerService.createFollowCharity(followObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var resObject = {};
      resObject = followObj;
      resObject.layout = 'onboarding';
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get invited follow charity and charityname, done, In pages route"]);
      res.set('Cache-Control', 'no-cache');
      res.render('./pages/followsuccess', resObject);
    }
  });

});

pagesRouter.post('/code/:id', function(req, res, next) {
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
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "follow code, done, In pages route"]);
      utility.dataHandler(responseData, res);
    }
  });

});

pagesRouter.post('/follow/user/:id', function(req, res, next) {
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
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "follow user, done, In pages route"]);
      utility.dataHandler(responseData, res);
    }
  });

});

pagesRouter.get('/import/donors/onboarding/:id', function(req, res, next) {
  var object = {};
  var logsObj = req.logsObj;
  object.userid = req.params.id;
  object.layout = 'onboarding';
  utility.devMetrics('userEvent', req.cookies.logindonorid, ["import donors onboarding, done, In pages route"]);
  res.set('Cache-Control', 'no-cache');
  res.render('./pages/donoronboardingstepfour', object);
});
pagesRouter.get('/profile/of/donor/onboarding/:id', function(req, res, next) {
  var userid = req.params.id;
  settingsService.accountDetails(userid, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject = data[0];
      resObject.layout = 'onboarding';
      resObject.domain = props.domain;
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get account details, done, In pages route"]);
      res.set('Cache-Control', 'no-cache');
      res.render('./pages/donoronboardingstepfive', resObject);
    }
  });
});

//Method For Saving Charity Details From Organization Onboarding
pagesRouter.put('/profile/charity/org/:charityId', function(req, res, next) {
  //TODO:Validation of Parameter Charity ID
  var updateAdminObject = req.body;
  var logsObj = req.logsObj;
  updateAdminObject.charityId = req.params.charityId;
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
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "update profile charity, done, In pages route"]);
      utility.dataHandler(result, res);
    }

  });
});

pagesRouter.get('/public/states/list', function(req, res, next) {
  charityService.getCountries({}, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "public states list, done, In pages route"]);
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

pagesRouter.get('/public/country/:id/states/list', function(req, res, next) {
  var countryid = req.params.id;
  var logsObj = req.logsObj;
  charityService.getStates(countryid, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get public country and states, done, In pages route"]);
      utility.dataHandler(resObject, res);
    }
  });
});

pagesRouter.get('/userstateid/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var logsObj = req.logsObj;
  charityService.getCountryStates(userId, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

pagesRouter.get('/category/list', function(req, res, next) {
  var responseObject = {};
  var logsObj = req.logsObj;
  // Add stuff here
  charityService.getAllCategorys({}, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get category list, done, In pages route"]);
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });
});

pagesRouter.get('/check/user/:userid', function(req, res, next) {
  var userid = req.params.userid;
  var logsObj = req.logsObj;
  charityService.checkuserexistornot(userid, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "check user exist or not, done, In pages route"]);
      var obj = {};
      obj.data = result;
      if (result.password_salt) {
        utility.dataHandler(obj, res);
      } else {
        res.set('Cache-Control', 'no-cache');
        res.render('./pages/resetpassword', result);
      }
    }
  });
});

pagesRouter.get('/verify/charity/prasence/:ein', function(req, res, next) {
  var ein = req.params.ein;
  var ein2 = ein.split('-').join('');
  var logsObj = req.logsObj;
  charityService.checkCharityPresence(ein, ein2, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      if (result.length > 0) {
        charityService.checkCharityClimeOrNot(ein, ein2, function(err, result1) {
          if (err) {
            utility.newAppErrorHandler(err, logsObj, res);
          } else {
            var obj = {};
            if (result1.length > 0) {
              obj.data = {
                'msg': "exist climed",
                'details': result1[0]
              };
              utility.dataHandler(obj, res);
            } else {
              obj.data = {
                'msg': "exist not climed",
                'details': result[0]
              };
              utility.dataHandler(obj, res);
            }
          }
        });
      } else {
        obj.data = {
          'msg': "new"
        };
        utility.dataHandler(obj, res);
      }
    }
  });
});

pagesRouter.post('/:id/claim/', function(req, res, next) {
  var claimObj = req.body;
  var logsObj = req.logsObj;
  claimObj.charity_id = req.params.id;
  claimObj.date_created = moment().toDate();
  charityService.sendClaim(claimObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "send claim, done, In pages route"]);
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });
});
pagesRouter.get('/email/presence/:email/:name', function(req, res, next) {
  var userEmail = req.params.email;
  var userName = req.params.name;
  var logsObj = req.logsObj;
  console.log("in pages services");
  charityService.checkUserEmailExistOrNot(userEmail, userName, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      console.log("cam here ...changing ");
      console.log(result)
        // utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "check email exist or not, done, In pages route"]);
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);

    }
  });
});
pagesRouter.post('/feed', function(req, res, next) {
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
pagesRouter.options('/csvfile/upload', function(req, res, next) {
  res.send(200);
});
pagesRouter.post('/csvfile/upload', function(req, res, next) {
  var path = '',
    name = '';
  //cdnUrl
  /*for (var key in req.files) {
    path = req.files[key].path;
  }*/
  // console.log(path)
  var readData = [];
  var errors = [];
  var csv = require("fast-csv");
  var fs = require('fs');
  var readStream = request.get({
    url: req.body.cdnUrl
  })
  var stream = readStream.pipe(csv({
    headers: true,
    ignoreEmpty: true
  })).on('error', function(err) {
    console.log(err);
    var errObj = {};
    errObj.error = err.toString();
    errors.push(errObj);
  }).on("data", function(data) {
    if (data && data.fullname) {
      readData.push(data);
    } else {
      if (!data.fullname) {
        errors.push({
          "errors": "You are missing the Full Name for " + data.email
        });
      }
    }
  }).on("end", function() {
    var obj = {};
    obj.userContacts = [];
    obj.userContacts = readData;
    if (req.query.userid) {
      obj.user_id = req.query.userid;
    }
    if (obj.user_id) {

    } else {
      if (req.query.userId) {
        obj.user_id = req.query.userId;
      }
    }
    pagesService.storeGmailAndCsvContacts(readData, function(err, data) {});
    if (readData && readData.length > 0 && readData[0].fullname && readData[0].email) {
      var csvobj = {};
      csvobj.success = true;
      csvobj.data = readData;
      //csvobj.errors = underscore.flatten(errors);
      //dataHandler(csvobj, res);
      res.json(csvobj);
    } else {
      var errobj = {};
      var err = "The data columns do not match what we expected.  Please download our sample csv file, and follow the exact same format for column headers.";
      errobj.success = err;
      utility.dataHandler(errobj, res);
      //res.send();
    }
  });
});

pagesRouter.post('/csvfile/import/data', function(req, res, next) {
  var importData = req.body;
  var importDonors = importData.invitedusers;
  var time = require('time');
  var t = new Date();
  var tz = new time.Date(0, 'UTC');
  var datePosted = moment(t).add('minutes', t.getTimezoneOffset() - tz.getTimezoneOffset()).toDate();
  importData.date_posted = moment(datePosted).format("YYYY-MM-DD HH:mm:ss");
  var array = [];
  var me = this;
  if (importData.videourl) {
    utility.videoUrl(importData, function(err, data) {
      if (err) {

      } else {
        importData.videourl = data.url;
        if (importData.charityname && importData.charity_id) {
          importData.entity_type = "charity";
        } else if (importData.userId) {
          importData.entity_type = 'user';
        }
        if (importData.videourl) {
          excuteQuery.insertAndReturnKey(sqlQueryMap['insertImport'], [importData.entity_id, importData.entity_type, importData.videourl, importData.date_posted], function(err, insertVideo) {});
          importDonorData(req, res, importData, importDonors, function(err, data) {
            if (err) {

            } else {
              callback(null, data);
            }
          });
        }
      }
    });
  } else {
    importData.videourl = "";
    importDonorData(req, res, importData, importDonors, function(err, data) {
      if (err) {

      } else {
        callback(null, data);
      }
    });
  }
});

function importDonorData(req, res, importData, importDonors, callback) {
  var array = [];
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [importData.userId], function(err, userObj) {

    async.each(importDonors, function(data, callback) {
      var obj = {};
      if (importData.charityname && importData.charity_id) {
        obj.importFrom = "charity";
        obj.charityname = importData.charityname;
        obj.charity_id = importData.charity_id;
      } else if (importData.userId) {
        obj.importFrom = 'donor';
        obj.charityname = "";
        obj.userId = importData.userId;
      }
      obj.email = data.email;
      obj.fullname = data.fullname;
      obj.userObj = userObj[0];
      array.push(obj);
      callback(null);
    }, function(err) {
      if (err) {
        utility.log('errors', "import csv file-1 from page route - " + importReq.cookies.logindonorid);
        res.send(err);
      } else {
        var obj = {};
        obj.status = "success";
        res.send(obj);
        var me = this;
        async.eachSeries(array, function(data, callback) {
          if (data.importFrom === "charity") {
            sendInviteEmailToImportDonors(data.email, data.fullname, data.charityname, data.userObj, data.charity_id, data.importFrom, importData.videourl, importData.token, importData.messagebody, importData.slug, function(err, data) {
              if (err) {
                callback(err);
              } else {
                callback(null);
              }
            });
          } else {
            // var me = this;
            sendInviteEmailToImportDonors(data.email, data.fullname, "", data.userObj, data.userId, data.importFrom, importData.videourl, importData.token, importData.messagebody, importData.slug, function(err, data) {
              if (err) {
                callback(err);
              } else {
                callback(null);
              }
            });
          }
        }, function(err) {
          if (err) {
            utility.log('errors', "import csv file-2 from page route - " + req.cookies.logindonorid);
          } else {
            utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "csvfile import data, done, In pages route"]);
          }
        });
      }
    });
  });
};

function sendInviteEmailToImportDonors(email, name, charityName, userObj, charity_id, importFrom, videoUrl, token, messagebody, slug, callback) {
  //Added Mandril Admin Template
  if (userObj.name) {
    var org_fullname = userObj.name;
  }
  if (org_fullname) {
    var org_firstname = org_fullname;
  }
  excuteQuery.queryForAll(sqlQueryMap['checkemail'], [email.toLowerCase().trim()], function(err, rows) {
    if (err) {
      utility.log('errors', "sendInviteEmailToImportDonors from page route - ");
      callback(err, null);
    } else {
      if (rows && rows.length > 0 && rows[0].active) {
        if (importFrom == 'charity') {
          // var charityName = charityName;
          var finalobjectmandril = {};
          finalobjectmandril.from = props.fromemail;
          finalobjectmandril.email = email;
          finalobjectmandril.text = "Hello world ✔";
          finalobjectmandril.subject = charityName + " is now on WonderWe ";
          finalobjectmandril.template_name = "Organization Invitation To Existing Donor";
          finalobjectmandril.template_content = [{
            "name": "charityName",
            "content": "*|ORGANIZATION|*"
          }, {
            "name": "org_fullname",
            "content": "*|ORGANIZATION_FULLNAME|*"
          }, {
            "name": "followorganization",
            "content": "*|FOLLOWORGANIZATION|*"
          }, {
            "name": "videourl",
            "content": "*|VIDEOURL|*"
          }, {
            "name": "messagebody",
            "content": "*|MESSAGE_BODY|*"
          }, {
            "name": "watchvideo",
            "content": "*|WATCH_VIDEO|*"
          }];
          finalobjectmandril.merge_vars = [{
            "name": "ORGANIZATION",
            "content": charityName
          }, {
            "name": "ORGANIZATION_FULLNAME",
            "content": org_fullname
          }, {
            "name": "FOLLOWORGANIZATION",
            "content": props.domain + "/pages/invited/follow/charity/" + rows[0].id + "/" + charity_id + "/" + charityName + '/charity'
          }, {
            "name": "VIDEOURL",
            "content": videoUrl
          }, {
            "name": "MESSAGE_BODY",
            "content": messagebody
          }, {
            "name": "WATCH_VIDEO",
            "content": props.domain + "/" + slug + "?openVideo=" + token
          }];
          utility.mandrillTemplate(finalobjectmandril, function(err, data) {
            if (err) {
              //utility.log('ERROR', "sendInviteEmailToImportDonors-2 from page route - ");
              callback(err);
            } else {
              callback(null, data);
            }
          });
        } else if (importFrom == 'donor') {
          //var charityName = charityName;
          var notifiObj = {};
          notifiObj.link_id = userObj.id;
          notifiObj.entity_id = rows[0].id;
          notifiObj.type = 'invite';
          notifiObj.user_id = userObj.id;
          //utility.socketioNotifications(notifiObj);
          agenda.now('socket io notifications', notifiObj);
          var finalobjectmandril = {};
          finalobjectmandril.from = props.fromemail;
          finalobjectmandril.email = email;
          finalobjectmandril.text = "Hello world ✔";
          finalobjectmandril.subject = org_fullname + " is now on WonderWe";
          finalobjectmandril.template_name = "Donor Invitation To Existing Donor";
          finalobjectmandril.template_content = [{
            "name": "name",
            "content": "*|NAME|*"
          }, {
            "name": "charityName",
            "content": "*|CHARITYNAME|*"
          }, {
            "name": "followdonor",
            "content": "*|FOLLOWDONOR|*"
          }, {
            "name": "videourl",
            "content": "*|VIDEOURL|*"
          }, {
            "name": "messagebody",
            "content": "*|MESSAGE_BODY|*"
          }, {
            "name": "watchvideo",
            "content": "*|WATCH_VIDEO|*"
          }];
          finalobjectmandril.merge_vars = [{
            "name": "NAME",
            "content": org_fullname
          }, {
            "name": "CHARITYNAME",
            "content": charityName
          }, {
            "name": "FOLLOWDONOR",
            "content": props.domain + "/pages/invited/follow/charity/" + rows[0].id + "/" + charity_id + "/" + org_fullname + '/donor'
          }, {
            "name": "VIDEOURL",
            "content": videoUrl
          }, {
            "name": "MESSAGE_BODY",
            "content": messagebody
          }, {
            "name": "WATCH_VIDEO",
            "content": props.domain + "/" + slug + "?openVideo=" + token
          }];
          utility.mandrillTemplate(finalobjectmandril, function(err, data) {
            if (err) {
              utility.log('errors', "sendInviteEmailToImportDonors-3 from page route - ")
              callback(err);
            } else {
              callback(null, data);
            }
          });
        }
      } else {
        var verification_key = uuid.v4() + "-" + uslug(name);
        var date = moment.utc().toDate();
        if (importFrom == 'charity') {

        } else {
          charity_id = null;
        }


        if (rows && rows.length > 0) {
          var userEntityObject = {};
          userEntityObject.entity_id = rows[0].id;
          userEntityObject.entity_type = 'user';

          excuteQuery.insertAndReturnKey(sqlQueryMap['referral'], [charity_id, userObj.id, rows[0].id, date, importFrom], function(err, referral_id) {
            if (err) {
              callback(err);
            } else {
              excuteQuery.update(sqlQueryMap['checkemailatimporttime'], [name, email.toLowerCase().trim(), verification_key, date, rows[0].id], function(err, updatedata) {
                if (err) {
                  callback(err);
                } else {
                  var id = rows[0].id;
                  if (importFrom == 'charity') {
                    //var charityName = charityName;
                    var finalobjectmandril = {};
                    finalobjectmandril.from = props.fromemail;
                    finalobjectmandril.email = email;
                    finalobjectmandril.text = "Hello world ✔";
                    finalobjectmandril.subject = "Join " + charityName + " on WonderWe";
                    finalobjectmandril.template_name = "Organization Invitation To New Donor";
                    finalobjectmandril.template_content = [{
                      "name": "charityName",
                      "content": "*|ORGANIZATION|*"
                    }, {
                      "name": "org_fullname",
                      "content": "*|ORGANIZATION_FULLNAME|*"
                    }, {
                      "name": "org_firstname",
                      "content": "*|ORGANIZATION_FIRSTNAME|*"
                    }, {
                      "name": "registernewuserfollowdonor",
                      "content": "*|REGISTERNEWUSERFOLLOWORG|*"
                    }, {
                      "name": "videourl",
                      "content": "*|VIDEOURL|*"
                    }, {
                      "name": "messagebody",
                      "content": "*|MESSAGE_BODY|*"
                    }, {
                      "name": "watchvideo",
                      "content": "*|WATCH_VIDEO|*"
                    }];
                    finalobjectmandril.merge_vars = [{
                      "name": "ORGANIZATION",
                      "content": charityName
                    }, {
                      "name": "ORGANIZATION_FULLNAME",
                      "content": org_fullname
                    }, {
                      "name": "ORGANIZATION_FIRSTNAME",
                      "content": org_firstname
                    }, {
                      "name": "REGISTERNEWUSERFOLLOWORG",
                      "content": props.domain + "/pages/signup/donor/" + id + "?followed_id=" + charity_id + "&type=charity" + "&referral_id=" + referral_id
                    }, {
                      "name": "VIDEOURL",
                      "content": videoUrl
                    }, {
                      "name": "MESSAGE_BODY",
                      "content": messagebody
                    }, {
                      "name": "WATCH_VIDEO",
                      "content": props.domain + "/" + slug + "?openVideo=" + token
                    }];
                    utility.mandrillTemplate(finalobjectmandril, function(err, data) {
                      if (err) {
                        callback(err);
                      } else {
                        callback(null, data);
                        //agenda.now('create campaign/donor/charity in elasticsearch', userEntityObject);
                      }
                    });
                  } else if (importFrom == 'donor') {
                    //var charityName = "";
                    var finalobjectmandril = {};
                    finalobjectmandril.from = props.fromemail;
                    finalobjectmandril.email = email;
                    finalobjectmandril.text = "Hello world ✔";
                    finalobjectmandril.subject = "Please accept my invitation to WonderWe";
                    finalobjectmandril.template_name = "Donor Invitation To New Donor";
                    finalobjectmandril.template_content = [{
                      "name": "name",
                      "content": "*|NAME|*"
                    }, {
                      "name": "charityname",
                      "content": "*|CHARITYNAME|*"
                    }, {
                      "name": "registernewuserfollowdonor",
                      "content": "*|REGISTERNEWUSERFOLLOWDONOR|*"
                    }, {
                      "name": "videourl",
                      "content": "*|VIDEOURL|*"
                    }, {
                      "name": "messagebody",
                      "content": "*|MESSAGE_BODY|*"
                    }, {
                      "name": "watchvideo",
                      "content": "*|WATCH_VIDEO|*"
                    }];
                    finalobjectmandril.merge_vars = [{
                      "name": "NAME",
                      "content": org_fullname
                    }, {
                      "name": "CHARITYNAME",
                      "content": charityName
                    }, {
                      "name": "REGISTERNEWUSERFOLLOWDONOR",
                      "content": props.domain + "/pages/signup/donor/" + id + "?followed_id=" + userObj.id + "&type=user" + "&referral_id=" + referral_id
                    }, {
                      "name": "VIDEOURL",
                      "content": videoUrl
                    }, {
                      "name": "MESSAGE_BODY",
                      "content": messagebody
                    }, {
                      "name": "WATCH_VIDEO",
                      "content": props.domain + "/" + slug + "?openVideo=" + token
                    }];
                    utility.mandrillTemplate(finalobjectmandril, function(err, data) {
                      if (err) {
                        utility.log('errors', "sendInviteEmailToImportDonors-4 from page route - ");
                        callback(err);

                      } else {
                        callback(null, data);
                        //agenda.now('create campaign/donor/charity in elasticsearch', userEntityObject);
                      }
                    });
                  }
                }
              });

            }
          });
        } else {
          excuteQuery.insertAndReturnKey(sqlQueryMap['importdata'], [name, email.toLowerCase().trim(), verification_key, date], function(err, id) {
            if (err) {
              callback(err);
            } else {
              excuteQuery.insertAndReturnKey(sqlQueryMap['referral'], [charity_id, userObj.id, id, date, importFrom], function(err, referral_id) {
                if (err) {
                  callback(err);
                } else {

                  var userEntityObject = {};
                  userEntityObject.entity_id = id;
                  userEntityObject.entity_type = 'user';

                  var userDetailsObject = {
                    name: name,
                    count: 1
                  };
                  var usrSlug = uslug(name);
                  var originlSlug = uslug(name);

                  charityService.entitySlugCreation(userEntityObject, usrSlug, userDetailsObject, originlSlug, function(err, userResult) {
                    userEntityObject.id = userResult;
                    // });
                    //excuteQuery.queryForAll(sqlQueryMap['userIdStoreInEntity'], [id, 'user'], function(err, userResult) {
                    if (err) {
                      callback(err, null);
                    } else {
                      var timezone_id = 381;
                      excuteQuery.queryForAll(sqlQueryMap['useIdAddToUserProfile'], [id, timezone_id], function(err, userResult) {
                        if (err) {
                          callback(err, null);
                        } else {
                          if (importFrom == 'charity') {
                            //var charityName = charityName;
                            var finalobjectmandril = {};
                            finalobjectmandril.from = props.fromemail;
                            finalobjectmandril.email = email;
                            finalobjectmandril.text = "Hello world ✔";
                            finalobjectmandril.subject = "Join " + charityName + " on WonderWe";
                            finalobjectmandril.template_name = "Organization Invitation To New Donor";
                            finalobjectmandril.template_content = [{
                              "name": "charityName",
                              "content": "*|ORGANIZATION|*"
                            }, {
                              "name": "org_fullname",
                              "content": "*|ORGANIZATION_FULLNAME|*"
                            }, {
                              "name": "org_firstname",
                              "content": "*|ORGANIZATION_FIRSTNAME|*"
                            }, {
                              "name": "registernewuserfollowdonor",
                              "content": "*|REGISTERNEWUSERFOLLOWORG|*"
                            }, {
                              "name": "videourl",
                              "content": "*|VIDEOURL|*"
                            }, {
                              "name": "messagebody",
                              "content": "*|MESSAGE_BODY|*"
                            }, {
                              "name": "watchvideo",
                              "content": "*|WATCH_VIDEO|*"
                            }];
                            finalobjectmandril.merge_vars = [{
                              "name": "ORGANIZATION",
                              "content": charityName
                            }, {
                              "name": "ORGANIZATION_FULLNAME",
                              "content": org_fullname
                            }, {
                              "name": "ORGANIZATION_FIRSTNAME",
                              "content": org_firstname
                            }, {
                              "name": "REGISTERNEWUSERFOLLOWORG",
                              "content": props.domain + "/pages/signup/donor/" + id + "?followed_id=" + charity_id + "&type=charity" + "&referral_id=" + referral_id
                            }, {
                              "name": "VIDEOURL",
                              "content": videoUrl
                            }, {
                              "name": "MESSAGE_BODY",
                              "content": messagebody
                            }, {
                              "name": "WATCH_VIDEO",
                              "content": props.domain + "/" + slug + "?openVideo=" + token
                            }];
                            utility.mandrillTemplate(finalobjectmandril, function(err, data) {
                              if (err) {
                                callback(err);
                              } else {
                                callback(null, data);
                                //agenda.now('create campaign/donor/charity in elasticsearch', userEntityObject);
                              }
                            });
                          } else if (importFrom == 'donor') {
                            //var charityName = "";
                            var finalobjectmandril = {};
                            finalobjectmandril.from = props.fromemail;
                            finalobjectmandril.email = email;
                            finalobjectmandril.text = "Hello world ✔";
                            finalobjectmandril.subject = "Please accept my invitation to WonderWe";
                            finalobjectmandril.template_name = "Donor Invitation To New Donor";
                            finalobjectmandril.template_content = [{
                              "name": "name",
                              "content": "*|NAME|*"
                            }, {
                              "name": "charityname",
                              "content": "*|CHARITYNAME|*"
                            }, {
                              "name": "registernewuserfollowdonor",
                              "content": "*|REGISTERNEWUSERFOLLOWDONOR|*"
                            }, {
                              "name": "videourl",
                              "content": "*|VIDEOURL|*"
                            }, {
                              "name": "messagebody",
                              "content": "*|MESSAGE_BODY|*"
                            }, {
                              "name": "watchvideo",
                              "content": "*|WATCH_VIDEO|*"
                            }];
                            finalobjectmandril.merge_vars = [{
                              "name": "NAME",
                              "content": org_fullname
                            }, {
                              "name": "CHARITYNAME",
                              "content": charityName
                            }, {
                              "name": "REGISTERNEWUSERFOLLOWDONOR",
                              "content": props.domain + "/pages/signup/donor/" + id + "?followed_id=" + userObj.id + "&type=user" + "&referral_id=" + referral_id
                            }, {
                              "name": "VIDEOURL",
                              "content": videoUrl
                            }, {
                              "name": "MESSAGE_BODY",
                              "content": messagebody
                            }, {
                              "name": "WATCH_VIDEO",
                              "content": props.domain + "/" + slug + "?openVideo=" + token
                            }];
                            utility.mandrillTemplate(finalobjectmandril, function(err, data) {
                              if (err) {
                                utility.log('errors', "sendInviteEmailToImportDonors-4 from page route - ")
                                callback(err);
                              } else {
                                callback(null, data);
                                //agenda.now('create campaign/donor/charity in elasticsearch', userEntityObject);
                              }
                            });
                          }
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      }
    }
  });
}

pagesRouter.get('/charitystatecity/:charityid', function(req, res, next) {
  console.log(req.params.charityid);
  var charityId = req.params.charityid;
  excuteQuery.queryForAll(sqlQueryMap['getCharityStateCountry'], [charityId], function(err, result) {
    console.log("dxcfgvhb");
    console.log(result);
    if (err) {
      console.log(err)
      callback(new Error(err), null);
    } else {
      console.log(result);
      res.send(result);
    }
  });

})

pagesRouter.get('/signup/donor/:userid', function(req, res, next) {
  var userid = req.params.userid;
  excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [userid], function(err, userData) {
    if (err) {
      res.send(err);
    } else {
      var obj = {};
      if (userData && userData.length > 0 && userData[0].name) {
        var name = userData[0].name;
        obj.firstname = name.substr(0, name.indexOf(' '));
        if (obj.firstname) {
          obj.lastname = name.substr(name.indexOf(' ') + 1);
        } else {
          obj.firstname = name
        }
      }
      if (req.query.followed_id) {
        obj.followed_id = req.query.followed_id;
      } else {
        obj.followed_id = "";
      }
      if (req.query.type) {
        obj.type = req.query.type;
      } else {
        obj.type = "";
      }
      if (req.query.referral_id) {
        obj.referralid = req.query.referral_id;
      } else {
        obj.referralid = "";
      }
      if (obj.type || obj.followed_id || obj.referralid) {
        obj.flag = "active";
      } else {
        obj.flag = "";
      }
      if (obj.type && obj.type === "user") {
        var followUserObj = {};
        followUserObj.followeduser_id = obj.followed_id;
        followUserObj.user_id = userid;
        followUserObj.date_followed = moment().toDate();
        followUserObj.pages = 'checkfollowornot';
        followerService.createFollowUser(followUserObj, function(err, data) {
          if (err) {
            if (err && err.error == 'You are already following') {
              err.error = 'You are already accept the Invitation'
            }
            obj.email = userData[0].email;
            obj.layout = 'onboarding';
            res.set('Cache-Control', 'no-cache');
            res.render('./pages/donorinvitation', obj);
          } else {
            obj.email = userData[0].email;
            obj.userId = userData[0].id;
            obj.layout = 'pages';
            utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "signup donor, done, In pages route"]);
            res.set('Cache-Control', 'no-cache');
            res.render('./pages/donorsignuppage', obj);
          }
        })
      } else if (obj.type && obj.type === "charity") {
        var followCharityObj = {};
        followCharityObj.charity_id = obj.followed_id;
        followCharityObj.user_id = userid;
        followCharityObj.following_id = obj.followed_id;
        followCharityObj.date_followed = moment().toDate();
        followCharityObj.pages = 'checkfollowornot';
        followerService.createFollowCharity(followCharityObj, function(err) {
          if (err) {
            if (err && err.error == 'You are already following') {
              err.error = 'You are already accept the Invitation'
            }
            obj.email = userData[0].email;
            obj.layout = 'onboarding';
            res.set('Cache-Control', 'no-cache');
            res.render('./pages/donorinvitation', obj);
          } else {
            obj.email = userData[0].email;
            obj.userId = userData[0].id;
            obj.layout = 'pages';
            utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "signup donor, done, In pages route"]);
            res.set('Cache-Control', 'no-cache');
            res.render('./pages/donorsignuppage', obj);
          }
        });
      } else {

        excuteQuery.queryForAll(sqlQueryMap['profileinfo'], [userid], function(err, userData) {
          console.log(userData)
          var address = {}
            //TODO Added temporary fix for donor signup from thankyou page after donate, Need to check and fix @Srinivas
          obj.email = userData[0].email;
          obj.userId = userData[0].user_id;
          address.city = userData[0].city;
          address.state = userData[0].state;
          address.country = userData[0].country;
          obj.address = address;
          obj.layout = 'pages';
          utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "signup donor, done, In pages route"]);
          res.set('Cache-Control', 'no-cache');
          res.render('./pages/donorsignuppage', obj);
        })
      }
    }
  });

});



pagesRouter.get('/donor/referral', function(req, res, next) {
  var referral_id = req.query.referer;
  var obj = {};
  obj.type = 'referral';
  obj.userId = referral_id;
  obj.layout = 'pages';
  utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "donor referral, done, In pages route"]);
  res.set('Cache-Control', 'no-cache');
  res.render('./pages/donorreferral', obj);


});
/* Nonprofit Signup */

pagesRouter.post('/charity/signup/claim', function(req, res, next) {
  var me = this;
  var charityData = req.body;
  var logsObj = req.logsObj;
  try {
    excuteQuery.queryForAll(sqlQueryMap['getStateCode'], [charityData.address.state_name, charityData.address.country_id], function(err, result) {
      if (err) {
        utility.newAppErrorHandler(err, logsObj, res);
      } else {
        if (result[0] && result[0].id) {
          charityData.address.state_id = result[0].id;
        } else {
          charityData.address.state_id = null;
        }
        if (charityData.wePayEmailData) {
          charityData.from = "charity";
          codeService.addWePayEmail(charityData, function(err, charityInfo) {
            if (err) {
              utility.newAppErrorHandler(err, logsObj, res);
            } else {
              var obj = {};
              if (charityInfo.insertIntoClaim) {
                obj.data = charityInfo.insertIntoClaim;
              } else {
                obj.data = charityInfo;
              }
              //obj.data = charityInfo.insertIntoClaim;
              console.log("charityinfkkm...");
              console.log(charityInfo);
              utility.dataHandler(obj, res);
            }
          })

          /* console.log("he  dsnds in paymmenyh email")
           excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [charityData.paymentEmail.email], function(err, userRecord) {
             if (err) {
               console.log(err);
               callback1(err);
             } else {
               //for existing user
               if (userRecord && userRecord.length > 0) {
                 //checking while edit
                 charityData.weEmailId = userRecord[0].id;
                 //console.log(codeObject.weEmailId);
                 pagesService.charitySignUp(charityData, function(err, charityInfo) {
                   if (err) {
                     utility.newAppErrorHandler(err, logsObj, res);
                   } else {
                     var obj = {};
                     obj.data = charityInfo;
                     utility.dataHandler(obj, res);
                   }
                 });
               } else {
                 var senderEmailName = charityData.paymentEmail.firstname + '' + charityData.paymentEmail.lastname;
                 var verification_key = uuid.v4() + "-" + uslug(senderEmailName);
                 var date = moment.utc().toDate();
                 excuteQuery.insertAndReturnKey(sqlQueryMap['importdata'], [senderEmailName, charityData.paymentEmail.email, verification_key, date], function(err, userId) {
                   if (err) {
                     callback1(err);
                   } else {
                     charityData.weEmailId = userId;
                     async.parallel({
                       enitycreation: function(callback) {
                         var userEntity = {};
                         userEntity.entity_id = userId;
                         userEntity.entity_type = "user";

                         var count = 1;
                         var usrSlug = uslug(senderEmailName);
                         var originlSlug = uslug(senderEmailName);
                         var userDetailsObject = {
                           count: 1,
                           name: senderEmailName
                         };
                         charityService.entitySlugCreation(userEntity, usrSlug, userDetailsObject, originlSlug, function(err, userEntityId) {
                           if (err) {
                             callback(err, null);
                           } else {
                             userEntity.id = userEntityId;
                             callback(null, userId);
                           }
                         });
                       },
                       updateUserprofile: function(callback) {
                         var timezone_id = 381;
                         excuteQuery.queryForAll(sqlQueryMap['useIdAddToUserProfile'], [userId, timezone_id], function(err, userResult) {
                           if (err) {
                             callback(err, null);
                           } else {
                             console.log("updateuserprofile")
                             callback(null, userId);
                           }
                         });
                       }

                     }, function(err, results) {
                       if (err) {
                         utility.log('error', "userDataStore from page route - ");
                         utility.newAppErrorHandler(err, logsObj, res);
                       } else {
                         pagesService.charitySignUp(charityData, function(err, charityInfo) {
                           if (err) {
                             utility.newAppErrorHandler(err, logsObj, res);
                           } else {
                             var obj = {};
                             obj.data = charityInfo;
                             utility.dataHandler(obj, res);
                           }
                         });
                       }
                     });
                   }
                 })
               }
             }
           })*/
        } else {
          pagesService.charitySignUp(charityData, function(err, charityInfo) {
            if (err) {
              utility.newAppErrorHandler(err, logsObj, res);
            } else {
              var obj = {};
              obj.data = charityInfo;
              utility.dataHandler(obj, res);
            }
          });
        }

      }
    });
  } catch (err) {
    console.log(err);
    res.statusCode = 500;
    res.send(err);
  }
});



pagesRouter.post('/charity/signup/claim/approve', function(req, res, next) {
  var charityData = req.body;
  var obj = {};
  var errors = ['EMAIL_ALREADY_EXISTS_NP_OWNER', 'EMAIL_ALREADY_EXISTS_NP_EXISTS', 'CHARITY_ALREADY_CLAIMED'];
  charityData.original_ip = req.ip;
  charityData.original_device = req.hostname;
  async.waterfall([
    function(callback) {
      pagesService.validateCharityData(charityData, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          console.log('validation passed');
          callback(null, result);
        }
      });
    },
    function(result, callback) {
      if (result.message == 'success') {
        charityData.firstname = charityData.first_name;
        charityData.lastname = charityData.last_name;
        authService.userRegistrationWithoutPassword(charityData, function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, result);
          }
        });
      } else if (result.message == 'EMAIL_ALREADY_EXISTS') {
        console.log('in email already exists');
        authService.userLogin(charityData, function(err, result) {
          if (err) {
            if (err.error == 'Username and Password mismatch.') {
              callback({
                error: 'EMAIL_PASSWORD_MISMATCH'
              }, null);
            } else {
              callback(err.error, null);
            }
          } else {
            callback(null, result);
          }
        });
      } else {
        console.log(err);
        callback('INTERNAL_SERVER_ERROR', null);
      }
    },
    function(result, callback) {
      console.log(result);
      charityData.token = result.token;
      authService.getProfileAndCharitiesByEmail(charityData.email, function(err, userProfile) {
        if (err) {
          callback(err, null);
        } else {
          charityData.token = result.token;
          callback(null, userProfile);
        }
      });
    }
  ], function(err, userProfile) {
    if (err) {
      if (errors.indexOf(err.error) > -1) {
        pagesService.npSignupErrorHandler(err, charityData, function(err, result) {
          if (err) {
            if (err.error = 'Username and Password mismatch.') {
              utility.appErrorHandler({
                data: {
                  error: 'EMAIL_PASSWORD_MISMATCH'
                }
              }, res);
            } else {
              utility.appErrorHandler(err, res);
            }

          } else {
            utility.dataHandler({
              data: result
            }, res);
          }
        });
      } else {
        if (err.error == 'EMAIL_PASSWORD_MISMATCH') {
          utility.dataHandler({
            data: {
              error: 'EMAIL_PASSWORD_MISMATCH'
            }
          }, res);
        } else {
          utility.appErrorHandler({
            error: err,
            flag: true
          }, res);
        }

      }
    } else {
      console.log(charityData);
      charityData.user = userProfile;

      //  if (charityData.ein) {
      //User Logins and adds as admin based on ein number
      //    console.log('before login user and add as admin');
      pagesService.loginUserAndAddAsAdmin(charityData, function(err, result) {
        if (err) {
          utility.appErrorHandler(err, res);
        } else {
          obj.data = result;
          console.log('in the complete');
          utility.dataHandler(obj, res);
        }
      });
      //  } else {
      //User logins and creates new charity
      //    pagesService.loginUserAndCreateCharity(charityData, function(err, result) {
      //      if (err) {
      //        console.log(err);
      //        utility.appErrorHandler(err, res);
      //      } else {
      //        obj.data = result;
      //        utility.dataHandler(obj, res);
      //      }
      //    });
      //      }
    }
  });


  /*    } else {
        //Mostly we will have the EIN Always
        if (charityData.ein) {
          //User signup and assigns as an admin baded on ein
          pagesService.signupUserAndAddAsAdmin(charityData, function(err, result) {
            if (err) {
              utility.appErrorHandler(err, res);
            } else {
              obj.data = result;
              utility.dataHandler(obj, res);
            }
          });
        } else {
          //User signup and creates new charity and adds as admin
          pagesService.charitySignupClaim(charityData, function(err, result) {
            if (err) {
              console.error(err);
              utility.appErrorHandler(err, res);
            } else {
              obj.data = result;
              utility.dataHandler(obj, res);
            }
          });
        }
      } */

});

pagesRouter.post('/systemcharity/logoupdate', function(req, res, next) {
  var charityData = req.body;
  pagesService.systemcharitylogoupdate(charityData, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, res);
    } else {
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });
});

pagesRouter.post('/charity/assign/user', function(req, res, next) {
  var charityData = req.body;
  var logsObj = req.logsObj;
  var ein = charityData.ein;
  var ein2 = charityData.ein.split('-').join('');
  async.parallel({
    checkUserEmail: authRouter.getUserByEmail.bind(null, req.body.email),
    checkCharityExists: charityService.checkCharityPresence.bind(null, ein, ein2)
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      if (result.checkUserEmail.length) {
        utility.newAppErrorHandler(new Error(JSON.stringify({
          errors: ['USER_ALREADY_EXISTS'],
          status: 400
        })), res);
      } else if (result.checkCharityExists.length == 0 || result.checkCharityExists[0].charity_from != 'system') {
        utility.newAppErrorHandler(new Error(JSON.stringify({
          errors: ['CHARITY_NOT_EXISTS'],
          status: 400
        })), res);
      } else {
        pagesService.assignSystemCharityToUser(charityData, function(err, result) {
          if (err) {
            utility.newAppErrorHandler(err, res);
          } else {
            var obj = {};
            obj.data = result;
            utility.dataHandler(obj, res);
          }
        });
      }
    }
  });

});


function sendEmailToInviteCharityAdmin(email, id, name, charity_id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCharityName'], [charity_id], function(err, userResult1) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //Added Mandril Admin Template
      if (userResult1[0] && userResult1[0].name_tmp) {
        var charityName = userResult1[0].name_tmp;
      } else {
        var charityName = '';
      }
      var finalobjectmandril = {};
      finalobjectmandril.from = props.fromemail;
      finalobjectmandril.email = email;
      finalobjectmandril.text = "Hello world ✔";
      finalobjectmandril.subject = "You have been invited to manage " + charityName + " charity with WonderWe. ";

      finalobjectmandril.template_name = "Admin Invitation New User";
      finalobjectmandril.template_content = [{
        "name": "name",
        "content": "*|NAME|*"
      }, {
        "name": "charityname",
        "content": "*|CHARITYNAME|*"
      }, {
        "name": "createpassword",
        "content": "*|CREATEPASSWORD|*"
      }];
      finalobjectmandril.merge_vars = [{
        "name": "NAME",
        "content": name
      }, {
        "name": "CHARITYNAME",
        "content": charityName
      }, {
        "name": "CREATEPASSWORD",
        "content": props.domain + "/pages/invitedonor/resetpassword/" + id + "/" + charity_id + "/" + charityName + '/charity'
      }];


      utility.mandrillTemplate(finalobjectmandril, function(err, data) {
        if (err) {
          utility.log('errors', "sendEmailToInviteCharityAdmin1 from page route - " + req.cookies.logindonorid);
          callback(err);
        } else {
          callback(null, "mail send successfully");
        }
      });
    }
  });

}

//This method creates campaign for the charity
pagesRouter.post('/campaign/:id', function(req, res, next) {
  var codeObject = req.body;
  var codeId = req.params.id;
  var logsObj = req.logsObj;
  async.series({
    validation: function(callback) {
      validationController.updateCharityCategoryCode(codeObject, callback);
    },
    data: function(callback) {
      codeObject.flag = 'onboarding';
      codeService.updateCharityCode(codeObject, codeId, {}, callback);
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "update code info, done, In code route"]);
      utility.dataHandler(result, res);
    }

  });
});
pagesRouter.post('/user/category', function(req, res, next) {
  var userCategory = req.body;
  var logsObj = req.logsObj;
  async.each(userCategory.causes, function(group, callback) {
    excuteQuery.queryForAll(sqlQueryMap['userCategory'], [userCategory.user_id, group], function(err, result) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, result);
      }
    });
  }, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = userCategory;
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "user category, done, In pages route"]);
      utility.dataHandler(obj, res);
    }
  })
});

pagesRouter.post('/update/account/details', function(req, res, next) {

  var accountDetails = req.body;
  var logsObj = req.logsObj;
  charityService.checkuserexistornot(accountDetails.id, function(err, result) {
    if (err) {
      utility.log('error', "/update/account from page route - " + req.cookies.logindonorid);
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = result;
      accountDetails.email = result.email;
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
          utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "update account details, done, In pages route"]);
          utility.dataHandler(result, res);
        }

      });
    }
  });

});

pagesRouter.get('/comments/:postId', function(req, res, next) {
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
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get all previous replys, done, In pages route"]);
      utility.dataHandler(result, res);
    }
  });
});

pagesRouter.get('/share/:postId', function(req, res, next) {
  var logsObj = req.logsObj;
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
      utility.dataHandler(result, res);
    }
  });
});

pagesRouter.get('/reposts/:postId', function(req, res, next) {
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
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "reposts, done, In pages route"]);
      utility.dataHandler(result, res);
    }
  });
});

pagesRouter.get('/unique/:codeid/fetch', function(req, res, next) {
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
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get campain unique, done, In pages route"]);
      utility.dataHandler(result, res);
    }

  });
});


pagesRouter.post('/validate/entity/slug', function(req, res, next) {
  var slugObject = req.body;
  slugObject.slug = uslug(req.body.name);
  if (!slugObject.originalslug) {
    slugObject.originalslug = slugObject.slug;
  }
  slugObject.originalslug = uslug(slugObject.originalslug);

  charityService.validateEntitySlug(slugObject, function(result) {

    res.send(result);
  });

  // pool.query('select * from entity_tbl where slug =?', [slugObject.slug], function(err, slugResult) {
  //   if (err) {
  //     utility.appErrorHandler(err, res);
  //   } else {

  //     if (slugObject.type == 'code') {
  //       if (slugResult && slugResult.length > 0) {
  //         res.send({
  //           status: 'success'
  //         });
  //       } else {
  //         res.send({
  //           status: 'success',
  //           data: true
  //         });
  //       }
  //     } else {

  //       if (slugResult && slugResult.length > 0) {

  //         if (slugObject.originalslug == slugResult[0].slug) {
  //           res.send({
  //             status: 'success',
  //             data: true
  //           });
  //         } else {
  //           res.send({
  //             status: 'success'
  //           });
  //         }
  //       } else {
  //         res.send({
  //           status: 'success',
  //           data: true
  //         });
  //       }
  //     }
  //   }
  // });


});


pagesRouter.post('/validate/campaign', function(req, res, next) {

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
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "validate campain, done, In pages route"]);
      utility.dataHandler(result, res);
    }
  });

});

// function slugCreation(entityObject, usrSlug, count, originlSlug, callback) {

//   pool.query("select * from entity_tbl where slug =?", [usrSlug], function(err, entitySlugResult) {

//     if (entitySlugResult && entitySlugResult.length > 0) {

//       usrSlug = originlSlug + count;
//       count = count + 1;
//       slugCreation(entityObject, usrSlug, count, originlSlug, callback);
//     } else {
//       entityObject.slug = usrSlug;
//       excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], [entityObject], callback);

//       // pool.query("update entity_tbl set slug =? where id=?", [usrSlug, singleObject.id], callback);
//     }
//   });
// }

pagesRouter.get('/fetch/state/name/:stateId', function(req, res, next) {
  var stateId = req.params.stateId;
  var logsObj = req.logsObj;
  donorService.getStateName(stateId, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "fetch state name, done, In pages route"]);
      if (data && data.length > 0) {
        res.send(data[0]);
      } else {
        res.send({});
      }
    }
  });
});

pagesRouter.get('/:slug/posts/:postId', function(req, res, next) {
  var obj = {};
  obj.type = req.query.type;
  obj.slug = req.params.slug;
  obj.postId = req.params.postId;
  /* if (req.cookies.loadFrom != 'charity' && req.cookies.token) {
     obj.donornav = "donor";
   } else if (req.cookies.loadFrom == 'charity' && req.cookies.token) {
     obj.charitynav = "a";
   } else {
     obj.nav = "";
   }*/
  obj.layout = 'pages';

  var userDevice = device(req.headers['user-agent']);
  var userDeviceIsPhone = userDevice.is('phone');
  if (userDeviceIsPhone) {
    res.redirect(props.mobileredirect + '/pages/' + obj.slug + '/posts/' + obj.postId);
  } else {
    res.set('Cache-Control', 'no-cache');
    res.render("./pages/postpage", obj);
  }
});

pagesRouter.get('/post/:postId', function(req, res, next) {
  var postId = req.params.postId;
  var logsObj = req.logsObj;
  async.series({
    data: function(callback) {
      feedServices.getPostPageFeed(postId, callback);
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

pagesRouter.get('/auto/login/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var logsObj = req.logsObj;
  var address = req.query;
  var userObject = {};
  userObject.id = userId;
  if (address && address.state_name != 'undefined') {
    userObject.address = address;
  }

  var token = (req.body && req.body.visitedUser) || (req.query && req.query.visitedUser) || req.headers['visiteduser'];

  excuteQuery.queryForAll(sqlQueryMap['password'], [userId], function(err, resultUser) {
    if (err) {
      //utility.log('error', "getStateName in donorService from page route - " + req.cookies.logindonorid);
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      if (resultUser && resultUser.length > 0) {
        excuteQuery.queryForAll(sqlQueryMap['updateActivation'], ['yes', userId], function(err, activation) {
          if (err) {
            //utility.log('error', "getStateName in donorService from page route - " + req.cookies.logindonorid);
            utility.newAppErrorHandler(err, logsObj, res);
          } else {
            if (userObject.address && userObject.address.state_name != 'undefined') {

              authService.updateProfileAddress(userObject, function(err, profileAddressResult) {
                if (err) {
                  utility.newAppErrorHandler(new Error(JSON.stringify({ errors: ['USER_PROFILE_ADDRESS_ERROR'], status: 400 })), logsObj, res);
                } else {
                  console.log("updated user details");
                }
              });
            }
            authRouter.userAutoLogin(userId, token, function(err, resultToken) {
              if (err) {
                //utility.log('error', "getStateName in donorService from page route - " + req.cookies.logindonorid);
                utility.newAppErrorHandler(err, logsObj, res);
              } else {
                //Send 200 Status With Real Data
                utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "fetch state name, done, In pages route"]);
                res.cookie('token', resultToken, {
                  path: '/'
                });
                res.send(resultToken);
              }
            });
          }
        });
      } else {
        authRouter.userAutoLogin(userId, function(err, resultToken) {
          if (err) {
            utility.newAppErrorHandler(err, logsObj, res);
          } else {
            //Send 200 Status With Real Data
            utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "fetch state name, done, In pages route"]);
            res.cookie('token', resultToken, {
              path: '/'
            });
            res.send(resultToken);
          }
        });
      }
    }
  });
});
pagesRouter.get('/donation/countries', function(req, res, next) {
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
pagesRouter.get('/charity/countries/list', function(req, res, next) {
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
/**
 * Returns the Donors for Campaign Based on Skip Value.
 *
 * @param  Campaign ID
 * @param  Skip
 *
 * @return No of donors to return based on campaign page and skip value.
 */
pagesRouter.get('/giving/levels/:codeId/:skip', function(req, res, next) {
  var obj = {};
  obj.codeId = req.params.codeId;
  obj.skip = req.params.skip;
  if (req.query.fundraiser) {
    obj.fundraiser = req.query.fundraiser;
  }
  donorService.givingLevels(obj, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  })
});
pagesRouter.get('/campaign/:codeId/:skip/', function(req, res, next) {
  var obj = {};
  obj.codeId = req.params.codeId;
  obj.skip = req.params.skip;
  if (req.query.fundraiser) {
    obj.fundraiser = req.query.fundraiser;
  }
  if(req.query.flag){
    obj.flag=req.query.flag;
  }

  donorService.campaignDonors(obj, function(err, result) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      var obj = {};
      obj.data = result;
      for (var i in obj.data) {
        obj.data[i].transaction_date = moment(obj.data[i].transaction_date).fromNow();
        obj.data[i].amount = numeral(obj.data[i].amount).format('0,0.00');
        obj.data[i].created_date = moment(obj.data[i].created_date).fromNow();

        if (obj.data[i].hide_amount != 'no') {
          obj.data[i].amount = '';
          obj.data[i].hide_amount_class = 'hidden';
        }
        if (obj.data[i].anonymous != 'no') {
          obj.data[i].name = 'Anonymous';
          obj.data[i].profile_pic_url = 'https://wonderwe.s3.amazonaws.com/profile/002640b0-1680-4988-b67e-ed7f727e27f6-default-userpng.png';
        }

        if (obj.data[i].donor_comment) {
          obj.data[i].donor_comment = emoji.shortnameToUnicode(obj.data[i].donor_comment);
        }
      }
      utility.dataHandler(obj, res);
    }
  });
});

pagesRouter.get('/admin/account/:email', function(req, res, next) {
  var email = req.params.email;
  var logsObj = req.logsObj;
  donorService.setAsAdminUser(email, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "fetch state name, done, In pages route"]);
      var obj = {
        success: "success"
      };
      res.send(obj);
    }
  });
});

pagesRouter.get('/counts', function(req, res, next) {
  pagesService.counts(function(err, data) {
    if (err) {

    } else {
      res.send(data);
    }
  })
});
pagesRouter.post('/public/share/facebook/twitter', function(req, res, next) {
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

pagesRouter.post('/create/share/urls', function(req, res, next) {
  var object = req.body;
  if (object && object.flag === "charity") {
    var type = "charity";
  } else {
    var type = "fundraise";
  }
  excuteQuery.queryForAll(sqlQueryMap['numOfCampaignFollowers'], [object.fundraiser_codeid], function(err, codeData) {
    if (err) {
      callback(err);
    } else {
      if (codeData && codeData.length > 0) {
        object.slug = codeData[0].slug;
      }

      var urlshortener = google.urlshortener('v1');
      urlshortener.url.insert({
        auth: props.shortultapikey,
        resource: {
          longUrl: props.domain + '/' + object.slug + '?utm_userid=' + object.fundraiser_userid + '&utm_reference_userid=' + object.referenceuserid + '&utm_codeid=' + object.fundraiser_codeid + '&utm_fundraise=' + type + '&utm_source=twitter'
        }
      }, function(err, result) {
        if (err) {
          utility.appErrorHandler(err, res);
        } else {
          var obj = {};
          obj.turl = result.id;
          urlshortener.url.insert({
            auth: props.shortultapikey,
            resource: {
              longUrl: props.domain + '/' + object.slug + '?utm_userid=' + object.fundraiser_userid + '&utm_reference_userid=' + object.referenceuserid + '&utm_codeid=' + object.fundraiser_codeid + '&utm_fundraise=' + type + '&utm_source=facebook'
            }
          }, function(err, result1) {
            if (err) {
              utility.appErrorHandler(err, res);
            } else {
              obj.furl = result1.id;
              if (codeData && codeData.length > 0) {
                obj.name = codeData[0].title;
              }
              res.send(obj);
            }
          });
        }
      });
    }
  });
});

pagesRouter.get('/charity/symbols/fundraisers/:charityid', function(req, res, next) {
  var charityid = req.params.charityid;
  excuteQuery.queryForAll(sqlQueryMap['getCharitySymbol'], [charityid], function(err, charitySymbolData) {
    if (err) {
      callback(err);
    } else {
      res.send(charitySymbolData[0]);
    }
  });
});


pagesRouter.post('/save/donor/country/state', function(req, res, next) {
  var obj = req.body;
  excuteQuery.update(sqlQueryMap['saveCountryDetails'], [obj.country, obj.state, obj.address_1, obj.address_2, obj.city, obj.postal_code, obj.id], function(err, charitySymbolData) {
    if (err) {
      callback(err);
    } else {
      excuteQuery.queryForAll(sqlQueryMap['countryInfo'], [obj.country], function(err, countryInfo) {
        if (err) {
          callback(err);
        } else {
          res.send(countryInfo[0]);
        }
      });
    }
  });
});
pagesRouter.get('/check/stripe/wepay/account/available/not/:userid', function(req, res, next) {
  var userid = req.params.userid;
  var logsObj = req.logsObj;
  excuteQuery.queryForAll(sqlQueryMap['accountInfo'], [userid], function(err, accountInfo) {
    if (err) {
      callback(err);
    } else {
      res.send(accountInfo);
    }
  });
});

pagesRouter.get('/donation/countries/list', function(req, res, next) {
  var logsObj = req.logsObj;

  charityService.getDonationCountries({}, function(err, data) {
    if (err) {
      utility.log('error', "getCountries in charityService from charity route - " + req.cookies.logindonorid);
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get country list, done, In charity route"]);
      utility.dataHandler(resObject, res);
    }
  });
});


pagesRouter.get('/wwcategories/list', function(req, res, next) {
  var logsObj = req.logsObj;
  settingsService.getWwCategories({}, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get ww categories list, done, In pages route"]);
      utility.dataHandler(resObject, res);
    }
  });
});

pagesRouter.get('/campaign/:slug/promotion/:promotiontype', function(req, res) {
  var slug = req.params.slug;
  var logsObj = req.logsObj;
  pagesService.staffCampaignCreation({
    slug: slug,
    promotionType: req.params.promotiontype
  }, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

pagesRouter.get('/promotion/campaigns', function(req, res) {
  var slug = req.params.slug;
  var logsObj = req.logsObj;
  pagesService.getPromotionCampaigns({}, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});


pagesRouter.get('/import/charities', function(req, res) {
  var slug = req.params.slug;
  var logsObj = req.logsObj;
  pagesService.importCharities({}, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});


pagesRouter.post('/video/save', function(req, res, next) {
  var importData = req.body;
  var importDonors = importData.invitedusers;
  var time = require('time');
  var t = new Date();
  var tz = new time.Date(0, 'UTC');
  var datePosted = moment(t).add('minutes', t.getTimezoneOffset() - tz.getTimezoneOffset()).toDate();
  importData.date_posted = moment(datePosted).format("YYYY-MM-DD HH:mm:ss");
  var array = [];
  var me = this;
  if (importData.videourl) {
    /* utility.videoUrl(importData, function(err, data) {
       if (err) {

       } else {*/
    //importData.videourl = data.url;
    if (importData.charityname && importData.charity_id) {
      importData.entity_type = "charity";
      excuteQuery.queryForAll(sqlQueryMap['getCharityEntity'], [importData.charity_id], function(err, result) {
        if (result[0].id) {
          importData.entity_id = result[0].id;
          if (importData.videourl) {
            excuteQuery.insertAndReturnKey(sqlQueryMap['insertImport'], [importData.entity_id, importData.entity_type, importData.videourl, importData.date_posted, importData.token, importData.image], function(err, insertVideo) {
              if (err) {} else {
                res.send({
                  'msg': 'success',
                  'videoUrl': importData.videourl,
                  'videotoken': importData.token,
                  'videoId': insertVideo
                });
              }
            });
          }
        }
      });
    } else if (importData.userId) {
      importData.entity_type = 'user';
      excuteQuery.queryForAll(sqlQueryMap['getUserEntity'], [importData.userId], function(err, result) {
        if (result[0].id) {
          importData.entity_id = result[0].id;
          if (importData.videourl) {
            excuteQuery.insertAndReturnKey(sqlQueryMap['insertImport'], [importData.entity_id, importData.entity_type, importData.videourl, importData.date_posted, importData.token, importData.image], function(err, insertVideo) {
              if (err) {} else {
                res.send({
                  'msg': 'success',
                  'videoUrl': importData.videourl,
                  'videotoken': importData.token,
                  'videoId': insertVideo
                });
              }
            });
          }
        }
      });
    }
    // }
    // });
  }
});

pagesRouter.post('/send/import/email', function(req, res, next) {
  console.log("error while u")
  var importData = req.body;
  var importDonors = importData.invitedusers;
  console.log(importData);
  var array = [];
  var me = this;
  if (importData && importData.loadFrom === 'charity') {
    excuteQuery.queryForAll(sqlQueryMap['GetAdminEmail'], [importData.adminCharity_id], function(err, userObj) {
      var userobj = userObj[0];
      console.log('success get admin email');
      checkingImportEmail(req, res, importData, importDonors, userobj, function(err, data) {
        if (err) {} else {
          console.log("data first time");
          console.log(data);
          res.send({
            'data': data
          });
        }
      });
    });
  } else if (importData && importData.loadFrom === 'donor') {
    excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [importData.userId], function(err, userObj) {
      var userobj = userObj[0];
      checkingImportEmail(req, res, importData, importDonors, userobj, function(err, data) {
        if (err) {} else {
          res.send({
            'data': data
          });
        }
      });
    });
  }
});


function checkingImportEmail(req, res, importData, importDonors, userobj, callback) {
  console.log("printing");
  var array = [];
  var me = this;
  async.each(importDonors, function(data, callback) {
    var obj = {};
    obj.email = data.email;
    array.push(obj);
    callback(null);
  }, function(err) {
    if (err) {
      utility.log('error', "import csv file-1 from page route - " + importReq.cookies.logindonorid);
      res.send(err);
    } else {
      var obj = {};
      var me = this;
      async.eachSeries(array, function(data, callback) {
        var email = data.email;
        console.log(callback);
        if (importData.loadFrom === "charity") {
          var campaignData = {};
          if (importData.type === "charity") {
            excuteQuery.queryForAll(sqlQueryMap['getCharityDefaultCampaign'], [importData.slug], function(err, codeObj) {
              console.log(err);
              var campaignObj = codeObj[0];
              console.log(codeObj);
              sendMailForinvite(email, importData.messagebody, campaignObj.title, campaignObj.slug, campaignObj.id, importData.profile_pic_url, userobj.email, importData.charityname, importData.videourl, importData.token, importData.slug, importData.image, function(err, data) {
                if (err) {
                  console.log(err);
                  callback(err);
                } else {
                  callback(null);
                }
              });
            });
          } else if (importData.type === "campaign") {
            campaignData.campaignName = importData.campaignName;
            campaignData.campaignSlug = importData.campaignSlug;
            campaignData.campaignId = importData.campaignId;
            sendMailForinvite(email, importData.messagebody, campaignData.campaignName, campaignData.campaignSlug, campaignData.campaignId, importData.profile_pic_url, userobj.email, importData.charityname, importData.videourl, importData.token, importData.slug, importData.image, function(err, data) {
              if (err) {
                callback(err);
              } else {
                callback(null);
              }
            });
          } else if (importData.type === "user") {
            sendInviteEmailToImportDonors(email, importData.userName, importData.charityname, userobj, importData.charity_id, importData.loadFrom, importData.videourl, importData.token, importData.messagebody, importData.slug, function(err, data) {
              if (err) {
                callback(err);
              } else {
                callback(null);
              }
            });
          }
        } else if (importData.loadFrom === "donor") {
          var campaignData = {};
          var senderEmail = importData.senderemail;
          if (importData.type === "user") {
            var user_id = importData.userId;
            sendInviteEmailToImportDonors(email, importData.userName, "", userobj, importData.userId, importData.loadFrom, importData.videourl, importData.token, importData.messagebody, importData.slug, function(err, data) {
              if (err) {
                callback(err);
              } else {
                callback(null);
              }
            });
          } else if (importData.type === "campaign") {
            campaignData.campaignName = importData.campaignName;
            campaignData.campaignSlug = importData.campaignSlug;
            campaignData.campaignId = importData.campaignId;
            sendMailForinvite(email, importData.messagebody, campaignData.campaignName, campaignData.campaignSlug, campaignData.campaignId, importData.profile_pic_url, userobj.email, importData.userName, importData.videourl, importData.token, importData.slug, importData.image, function(err, data) {
              if (err) {
                callback(err);
              } else {
                callback(null);
              }
            });
          } else if (importData.type === "charity") {
            excuteQuery.queryForAll(sqlQueryMap['getCharityDefaultCampaign'], [importData.slug], function(err, codeObj) {
              var campaignObj = codeObj[0];
              sendMailForinvite(email, importData.messagebody, campaignObj.title, campaignObj.slug, campaignObj.id, importData.profile_pic_url, userobj.email, importData.userName, importData.videourl, importData.token, importData.slug, importData.image, function(err, data) {
                if (err) {
                  callback(err);
                } else {
                  callback(null);
                }
              });
            });
          }
        }
      }, function(err) {
        if (err) {
          callback(err);
          utility.log('error', "import csv file-2 from page route - " + req.cookies.logindonorid);
        } else {
          callback(null, array);
          utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "csvfile import data, done, In pages route"]);
        }
      });
    }
  });
};


pagesRouter.get('/watch/video', function(req, res, next) {
  var resObject = {};
  var logsObj = req.logsObj;
  resObject.url = req.query.videourl;
  resObject.layout = 'pages';
  res.set('Cache-Control', 'no-cache');
  res.render('./pages/video', resObject);
});
pagesRouter.post('/signup/public', function(req, res, next) {
  var ticketObj = req.body;
  codeService.ticketOrShiftSignupsAsGuest(ticketObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  });
});

pagesRouter.get('/import/currency/code', function(req, res) {
  var slug = req.params.slug;
  var logsObj = req.logsObj;
  pagesService.importCurrencyData({}, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

pagesRouter.post('/country/currency/conversion', function(req, res) {
  var currencyObj = req.body;
  var logsObj = req.logsObj;
  pagesService.fetchCountryCurrency(currencyObj, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

pagesRouter.post('/revert/country/currency/conversion', function(req, res) {
  var currencyObj = req.body;
  var logsObj = req.logsObj;
  pagesService.revertCountryCurrency(currencyObj, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

pagesRouter.post('/donor/currency/conversion', function(req, res) {
  var currencyObj = req.body;
  var logsObj = req.logsObj;
  pagesService.donorCurrencyConversion(currencyObj, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

pagesRouter.post('/invite/contacts/challenge', function(req, res, next) {
  var invitelist = req.body;
  var logsObj = req.logsObj;
  if (invitelist && invitelist.flag) {
    var fundraiser = "charity";
  } else {
    var fundraiser = "fundraise";
  }
  codeService.sendEmailForChallenge(invitelist, function(err, result) {
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
});
pagesRouter.get('/event/signup/:event_id', function(req, res) {
  var eventId = req.params.event_id;
  var logsObj = req.logsObj;
  codeService.eventShiftsAndTickets(eventId, function(err, data) {
    if (err) {
      utility.log('error', "getCountries in charityService from charity route - " + req.cookies.logindonorid);

      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

pagesRouter.get('/charity/:charityslug/donations', function(req, res) {
  var charityslug = req.params.charityslug;
  var logsObj = req.logsObj;
  pagesService.charityRaisedDonations({
    charitySlug: charityslug
  }, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = data;
      utility.dataHandler(resObject, res);
    }
  });
});

pagesRouter.post('/volunteer/signup/public', function(req, res, next) {
  var signupObj = req.body;
  var logsObj = req.logsObj;
  codeService.eventSigunupAsGuest(signupObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  });
});
pagesRouter.post('/user/contacts', function(req, res, next) {
  var gmailContacts = req.body;
  pagesService.storeGmailAndCsvContacts(gmailContacts, function(err, data) {
    if (err) {

    } else {

    }
  });


});


function sendMailForinvite(email, emailBody, campaignName, campaignSlug, codeid, profilePicUrl, senderEmail, senderName, videourl, token, slug, image, callback) {
  var finalobjectmandril = {};
  finalobjectmandril.from = props.fromemail;
  finalobjectmandril.email = email;
  finalobjectmandril.text = "";
  finalobjectmandril.subject = "Help " + campaignName;
  //TODO new means if user don't have account
  finalobjectmandril.template_name = "invite-fundraise-contacts";
  finalobjectmandril.template_content = [{
    "name": "userfullname",
    "content": "*|USER_FULL_NAME|*"
  }, {
    "name": "campaignname",
    "content": "*|CAMPAIGN_NAME|*"
  }, {
    "name": "emailBody",
    "content": "*|EMAIL_MESSAGE|*"
  }, {
    "name": "userName",
    "content": "*|USER_FULL_NAME|*"
  }, {
    "name": "profilePicUrl",
    "content": "*|USER_PROFILE_IMG|*"
  }, {
    "name": "useremail",
    "content": "*|USER_EMAIL_ADDRESS|*"
  }, {
    "name": "campaignname",
    "content": "*|CAMPAIGN_NAME|*"
  }, {
    "name": "campaignurl",
    "content": "*|CAMPAIGN_URL_DONATE|*"
  }, {
    "name": "campaignurlfacebook",
    "content": "*|CAMPAIGN_URL|*"
  }, {
    "name": "campaignurlfbshare",
    "content": "*|CAMPAIGN_URL|*"
  }, {
    "name": "campaignurltweet",
    "content": "*|CAMPAIGN_URL|*"
  }, {
    "name": "campaignurltweetshare",
    "content": "*|CAMPAIGN_URL|*"
  }, {
    "name": "donate_url",
    "content": "*|DONATE_URL|*"
  }, {
    "name": "emailbody",
    "content": "*|EMAIL_MESSAGE|*"
  }, {
    "name": "videoimage",
    "content": "*|FACE_POSITION|*"
  }, {
    "name": "watchvideo",
    "content": "*|WATCH_VIDEO|*"
  }, {
    "name": "videourl",
    "content": "*|VIDEOURL|*"
  }];
  finalobjectmandril.merge_vars = [{
    "name": "USER_FULL_NAME",
    "content": senderName
  }, {
    "name": "USER_PROFILE_IMG",
    "content": profilePicUrl
  }, {
    "name": "CAMPAIGN_NAME",
    "content": campaignName
  }, {
    "name": "EMAIL_MESSAGE",
    "content": emailBody
  }, {
    "name": "USER_FULL_NAME",
    "content": senderName
  }, {
    "name": "USER_EMAIL_ADDRESS",
    "content": senderEmail
  }, {
    "name": "CAMPAIGN_NAME",
    "content": campaignName
  }, {
    "name": "CAMPAIGN_URL_DONATE",
    "content": props.domain + "/" + campaignSlug
  }, {
    "name": "CAMPAIGN_URL",
    "content": props.domain + "/" + campaignSlug
  }, {
    "name": "CAMPAIGN_URL",
    "content": props.domain + "/" + campaignSlug
  }, {
    "name": "CAMPAIGN_URL",
    "content": props.domain + "/" + campaignSlug
  }, {
    "name": "CAMPAIGN_URL",
    "content": props.domain + "/" + campaignSlug
  }, {
    "name": "DONATE_URL",
    "content": props.domain + "/" + campaignSlug + '?donate=true'
  }, {
    "name": "EMAIL_MESSAGE",
    "content": emailBody
  }, {
    "name": "FACE_POSITION",
    "content": image
  }, {
    "name": "WATCH_VIDEO",
    "content": props.domain + "/" + slug + "?openVideo=" + token
  }, {
    "name": "VIDEOURL",
    "content": videourl
  }];
  //TODO exists means if user already have a account


  utility.mandrillTemplate(finalobjectmandril, function(err, data) {
    if (err) {
      callback(err);
    } else {
      utility.log('info', 'mail send successfully');
      callback(null, data);
    }
  });
};
pagesRouter.get('/hashtag/images/:hashtag', function(req, res, next) {
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


pagesRouter.post('/videotoken/mobile/:token', function(req, res, next) {
  var token = req.params.token;
  var logsObj = req.logsObj;
  donorService.getCampaignVideo(token, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }

  });
});

pagesRouter.get('/followers/code/:codeId', function(req, res, next) {
  var codeId = req.params.codeId;
  var logsObj = req.logsObj;
  if (req.query.user_id || req.cookies.logindonorid) {
    var user_id = req.query.user_id || req.cookies.logindonorid;
  } else {
    var user_id = '';
  }
  donorService.campaignFollowersData(codeId, user_id, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = result;
      //console.log(result);
      utility.dataHandler(obj, res);
    }
  });
});
pagesRouter.get('/fundraiseUserList/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var logsObj = req.logsObj;
  console.log(userId)
  if (req.query.user_id || req.cookies.logindonorid) {
    var user_id = req.query.user_id || req.cookies.logindonorid;
  } else {
    var user_id = '';
  }
  console.log(user_id);
  donorService.getFundraiseCampaigns(user_id, userId, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = result;
      console.log("obj");
      console.log(obj)
        //console.log(result);
      utility.dataHandler(obj, res);
    }
  });
});

pagesRouter.get('/followers/user/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var logsObj = req.logsObj;
  var entityId = req.cookies.logindonorid;
  donorService.getUserFollowerPeoples(userId, entityId, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = result;
      //console.log(result);
      utility.dataHandler(obj, res);
    }
  });
});

pagesRouter.get('/followers/charity/:charityId', function(req, res, next) {
  var charityId = req.params.charityId;
  var logsObj = req.logsObj;
  if (req.query.user_id || req.cookies.logindonorid) {
    var user_id = req.query.user_id || req.cookies.logindonorid;
  } else {
    var user_id = '';
  }
  donorService.charityFollowers(charityId, user_id, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });
});

pagesRouter.get('/status/follow/:entity_id/:user_id', function(req, res, next) {
  var entity_id = req.params.entity_id;
  var userId = req.params.user_id;
  var logsObj = req.logsObj;
  followerService.getfollowerstatus(entity_id, userId, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var obj = {};
      obj.data = result;
      console.log(obj);
      utility.dataHandler(obj, res);
    }
  });

});

pagesRouter.get('/following/user/:userId', function(req, res, next) {
  var userId = req.params.userId;
  var logsObj = req.logsObj;
  console.log("camehere", req.query.userId);
  var entityId = req.query.userId;
  async.parallel({
    followingOrgs: function(callback) {
      donorService.getDonorFollowingOrganizations(entityId, userId, callback)
    },
    followingCampaigns: function(callback) {
      donorService.getUserFollowingCampaigns(entityId, userId, function(err, campaignResult) {
        if (err) {
          callback(err, null);
        } else {
          async.each(campaignResult, function(singleObj, eachCallback2) {
            donorService.getCharityCategories(singleObj, function(err, categoryresult) {
              singleObj.group_title = categoryresult;
              if (singleObj.code_type != 'ongoing') {
                singleObj.daysRemaining = moment().countdown(singleObj.end_date, countdown.DAYS, 2).toString(); // '301 days'
                singleObj.daysRemaining = singleObj.daysRemaining.replace("days", "");
              }
              eachCallback2(null);

            });
          }, function(err) {
            callback(null, campaignResult);
          });
        }
      })
    },
    followingPeoples: function(callback) {
      donorService.getUserFollowingPeoples(entityId, userId, callback)
    }
  }, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res)
    } else {
      var obj = {};
      obj.data = result;
      utility.dataHandler(obj, res);
    }
  });
});

var toSearchQueryString = function(str) {
  str = str.replace(/We%23/g, 'We#').replace(/we%23/g, 'we#');
  return str;
}

pagesRouter.get('/:type/:id/download/list', function(req, res, next) {
  var paramArray = [];
  var obj = req.params;
  if (obj.type === 'charity') {
    var query = "charityDonorsList";
    paramArray.push(obj.id);
    paramArray.push(obj.id);
  } else {
    var query = "donorsList";
     paramArray.push(obj.id);
  }
  excuteQuery.queryForAll(sqlQueryMap[query],paramArray, function(err, result) {
    if (err) {
      res.send('Something went wrong while download donor list');
    } else if (result) {

      var data = [];
      async.each(result, function(singleObj, callback) {
        var newObj = {};
        newObj.Date = moment.utc(singleObj.transaction_date).format('MMM Do YYYY');
        newObj.Beneficiary = singleObj.beneficiary;
        newObj.Campaign = singleObj.codeTitle;
        newObj.Amount = singleObj.currency_symbol + (singleObj.amount + singleObj.wonderwe_fee);
        newObj.ProcessingFee = "";
        newObj.WonderWefee = "";

        if (singleObj.processing_fee) {
          newObj.ProcessingFee = '$' + singleObj.processing_fee;
        }

        newObj.NetDonation = singleObj.currency_symbol + ((singleObj.amount) - (singleObj.processing_fee));
        if (singleObj.wonderwe_fee) {
          newObj.WonderWefee = singleObj.currency_symbol + singleObj.wonderwe_fee;
        }
        newObj.Donor = singleObj.name;
        newObj.Email = singleObj.email;
        if (singleObj.address_1 || singleObj.address_2) {
          newObj.Address = singleObj.address_1 + ', ' + singleObj.address_2;
        }
        newObj.City = singleObj.city;
        newObj.State = singleObj.state;
        newObj.Country = singleObj.country;
        newObj.Zipcode = singleObj.postal_code;
        if (singleObj.code_level_id != '') {
          excuteQuery.queryForAll(sqlQueryMap['getSingleGivingLevel'], [singleObj.code_level_id], function(err, getGivingLevel) {
            if (getGivingLevel && getGivingLevel.length > 0) {
              newObj.GivingLevelTitle = getGivingLevel[0].title;
              newObj.GivingLevelDescription = getGivingLevel[0].description;
              newObj.GivingLevelAmount = singleObj.currency_symbol + getGivingLevel[0].amount;
              if(getGivingLevel[0].quantity==0 && getGivingLevel[0].quantity<=getGivingLevel[0].quantity_left){
                newObj.Quantity='';
                newObj.QuantityLeft='';
              }else{
              newObj.Quantity = getGivingLevel[0].quantity;
              newObj.QuantityLeft =  getGivingLevel[0].quantity-getGivingLevel[0].quantity_left;
              }
            } else {
              newObj.GivingLevelTitle = '';
              newObj.GivingLevelDescription = '';
              newObj.Quantity = '';
              newObj.GivingLevelAmount = '';
              newObj.QuantityLeft = '';
            }
            data.push(newObj);
            callback(null);
          })
        } else {
          newObj.GivingLevelTitle = '';
          newObj.GivingLevelDescription = '';
          newObj.Quantity = '';
          newObj.GivingLevelAmount = '';
          newObj.QuantityLeft = '';
          data.push(newObj);
          callback(null);
        }

      }, function(err) {
        var justFirstNames = json2csv.convert(data);
        fs.writeFile('exportdonors.csv', justFirstNames, function(err, result2) {
          var mimetype = mime.lookup('exportdonors.csv');
          res.setHeader('Content-disposition', 'attachment;' + 'filename=exportdonors.csv');
          res.setHeader('Content-type', mimetype);
          var readStream = fs.createReadStream('exportdonors.csv');
          readStream.pipe(res);
        });
      });
    } else {
      if (obj.type === 'charity') {
        res.redirect('/a/#!campaigns/donors');
      } else {
        res.redirect('/member/#!manage/donors');
      }
    }
  });
});

//Report Download
pagesRouter.get('/report/download/:type', function(req, res) {
  var type = req.params.type;
  console.log("type" + type);
  var value;
  if (type === 'nearcomplete') {
    value = "nearCompleteStatistics";
  } else if (type === 'live') {
    value = "liveCampaignStatistics";
  } else {
    value = "dailyCampaignStatistics";
  }
  excuteQuery.queryForAll(sqlQueryMap[value], function(err, result) {
    if (err) {
      console.log(err);
    } else if (result) {
      var data = [];
      async.each(result, function(singleObj, callback) {
        var newObj = {};
        newObj.Name = singleObj.title;
        newObj.Category = singleObj.name;
        newObj.Email = singleObj.email;
        newObj.City = singleObj.city;
        newObj.Goal = singleObj.goal;
        newObj.$Raised = singleObj.donation;
        newObj['%Raised'] = singleObj.donation_progress;
        newObj.TimeRemaining = singleObj.days_togo;
        newObj['%left'] = singleObj.donation_progressleft;
        newObj.Noofp2p = singleObj.p2pcreated;
        newObj.WWShare = singleObj.wonderwefee;


        data.push(newObj);
        callback(null);
      }, function(err) {
        var justFirstNames = json2csv.convert(data);
        console.log(result.length);
        fs.writeFile(value + '.csv', justFirstNames, function(err, result2) {
          var mimetype = mime.lookup(value + '.csv');
          res.setHeader('Content-disposition', 'attachment;' + 'filename=' + value + '.csv');
          res.setHeader('Content-type', mimetype);
          var readStream = fs.createReadStream(value + '.csv');
          readStream.pipe(res);
        });
      });
    }
  })
});



//getting country id based on country id
pagesRouter.get('/countryCode/:country', function(req, res) {
  var country = req.params.country;
  excuteQuery.queryForAll(sqlQueryMap['getCountryId'], [country], function(err, result) {
    if (err) {
      res.send("something going wrong while getting the country code")
    } else {
      console.log(result);
      res.send(result);
    }
  });
});

//updateing user address based on canamailiing required from donation as a guest
pagesRouter.post('/updateUser', function(req, res) {
  var address = req.body;
  var logsObj = req.logsObj;
  charityService.checkingCanMailing(address, function(err, result) {
    if (err) {
      res.send("something wrong while updateing the user data")
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var resObject = {};
      resObject.data = result;
      utility.dataHandler(resObject, res)
    }
  });

});

pagesRouter.get('/peertopeer/approval/:userId', function(req, res, next) {
  console.log('err');
  var obj = {};
  obj.userId = req.params.userId;
  obj.code_id = req.query.cid;
  obj.type = req.query.type;
  codeService.addApprovalTeamCampaign(obj, function(err, result) {
    if (err) {
      console.log(err);
      res.status(500);
      res.send(err);
    } else {
      result.layout = "pages";
      res.render("./pages/p2pactivation", result);
    }
  })
});
pagesRouter.get('/team/approval/:userId', function(req, res, next) {
  console.log('err');
  var obj = {};
  obj.userId = req.params.userId;
  obj.teamid = req.query.teamid;
  teamService.addApproveTeam(obj, function(err, result) {
    if (err) {
      console.log("error in accept")
      console.log(err);
      result.layout = "pages";
    } else {
      result.layout = "pages";
      if (result.flag == "Accepted_already") {
        var approveObj = {};
        approveObj.Accepted_already = "yes";
        approveObj.name = result.name;
        approveObj.team_name = result.team_name;
        approveObj.layout = "pages";
        res.render("./pages/teamactivation", approveObj);
      }
      if (result.flag == "approved") {
        var approveObj = {};
        approveObj.approved = "yes";
        approveObj.layout = "pages";
        res.render("./pages/teamactivation", approveObj);
      }
      if (result.flag == "nodata") {
        var approveObj = {};
        approveObj.nodata = "yes";
        approveObj.layout = "pages";
        res.render("./pages/teamactivation", approveObj);
      }
    }
  });
});

pagesRouter.get('/team/deny/:userId', function(req, res, next) {
  console.log('err');
  var obj = {};
  obj.deny_user_id = req.params.userId;
  obj.teamid = req.query.teamid;
  teamService.addDenyTeams(obj, function(err, result) {
    result.layout = 'pages';
    if (err) {
      console.log("error occured");
      console.log(err);
    } else {
      result.layout = 'pages';
      var denyObj = {};
      denyObj.layout = "pages";
      if (result.flag == "deniedinvitaion") {
        denyObj.layout = "pages";
        denyObj.deniedinvitaion = 'yes';
        res.render('./pages/teamInviteeDeny', denyObj);
      }
      if (result.flag == "deniedinvitaionalready") {
        denyObj.layout = "pages";
        denyObj.deniedinvitaionalready = 'yes';
        res.render('./pages/teamInviteeDeny', denyObj);
      }
      if (result.flag == "approved") {
        denyObj.layout = "pages";
        console.log("team invites");
        console.log(result.flag);
        denyObj.approved = "approved";
        res.render('./pages/teamInviteeDeny', denyObj);
      }
    }
  })

});
/**
*@api {get} /pages/inviteedelete/:userid To deny team invitation
* @apiName To dany team invitation
* @apiGroup Teams
* @apiDescription  Used to deny the team invitation
*  @apiParam {Number}   teamid                 Team id.
*  @apiParam {Number}   userid                 invitee user id.
* @apiParamExample {json} Request-Example:
* Body for team deny:
*{
*"teamid":68,
*"userid":2491
*}
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*{
*"status":"success",
*"denyObj":
*{
*"denynow":"now"
* }
*  }
*/
pagesRouter.get('/inviteedelete/:userid', function(req, res, next) {
  var obj = {};
  obj.userid = req.params.userid;
  obj.teamid = req.query.teamid;
  codeService.teamInviteesDelete(obj, function(err, result) {
    if (err) {
      res.status(500)
      res.send(err)
    } else {
      result.layout = 'pages';
      console.log("in page routes");
      console.log(result);
      res.render('./pages/teamInviteeDeny', result);
    }
  });
});

pagesRouter.get('/reportcampaign', function(req, res, next) {
  var obj = {};
  var countries=[];
  obj.codeid = req.query.codeid;
  obj.userid = req.query.userid;
  obj.slug = req.query.slug;
  obj.url = props.domain + '/' + obj.slug;
  obj.layout = 'pages';
   excuteQuery.queryForAll(sqlQueryMap['getDonationCountries'], [], function(err, result) {
      if (err) {
        //callback(err, null);
      console.log("error");

      } else {
        console.log("object to second");
        // callback(null, result);
        obj.countries=result;
        console.log(obj);
          if (obj.userid) {
    codeService.getUserDataWithId(obj.userid, function(err, result) {
      if (err) {
        // res.send("something wrong while getting the user data")
        utility.newAppErrorHandler(err, res);
      } else {
        obj.email = result[0].email;
        obj.name = result[0].name;
        obj.phone = result[0].home_phone;
        obj.country = result[0].country;
        res.render("./pages/reportcampaign", obj);
      }
    });
  } else {
    res.render("./pages/reportcampaign", obj);
  }

      }
    });
  console.log("object to first");
  console.log(obj.countries);
});


pagesRouter.post('/report/campaign', function(req, res, next) {
  var campaignObj = req.body;
  var logsObj = req.logsObj;
  codeService.reportCampaign(campaignObj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  });
});

pagesRouter.post('/send/email', function(req, res, next) {
  var obj = req.body;
  var logsObj = req.logsObj;
  codeService.sendMail(obj, function(err, result) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
  });
});

pagesRouter.get('/getcodecategories/:skip', function(req, res, next) {
  var obj = {};
  console.log(req.query.category_id);
  obj.skip = req.params.skip;
  if (req.query.category_id) {
    obj.categoryId = req.query.category_id;
  }
  pagesService.getAllCampaignsBasedOnCategory(obj, function(err, result) {
    console.log(err);
    console.log(result);
    var obj = {};
    obj.layout = "pages";
    obj.campaigns = result;
    res.render('./pages/offers', obj);
  })

});


pagesRouter.get('/campaigns/list/:category', function(req, res) {
  var flag=req.query.flag;
  var obj = {};
  async.parallel({
    campaigns: function(callback) {
      var category = {}
      if (req.query.teamid) {
        category.teamid = req.query.teamid;
      }
      if (req.query.userid) {
        category.userid = req.query.userid;
      }
      if (req.params.category != 'all') {
        category.categoryId = req.params.category
      }
      pagesService.getAllCampaignsBasedOnCategory(category, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result);
        }
      });
    },
    categories: function(callback) {

      settingsService.getWwCategories({}, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result);
        }
      });
    },
    campaignsCount: function(callback) {
      var category = {}
      if (req.params.category != 'all') {
        category.categoryId = req.params.category
      }
      if (req.query.teamid) {
        category.teamid = req.query.teamid;
      }
      pagesService.getCampaignsCount(category, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result);
        }
      });
    },
    getCampaignsForUser: function(callback) {
      var cat = {}
      if (req.query.teamid) {
        cat.teamid = req.query.teamid;
      }
      if (req.query.userid) {
        cat.userid = req.query.userid;
      }
      pagesService.getCampaignUser(cat, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result);
        }
      });
    },
    getTeamName:function(callback){
      if(req.query.teamid){
        var teamid=req.query.teamid;
      teamService.getTeamName(teamid,function(err,result){
        if(err){
         callback(err,null);
       }else{
        callback(null,result);
       }
      });
      }else{
        callback(null,null);
      }
    }
  }, function(err, result) {
    if (err) {
      res.send(err);
    } else {
      result.selected_category = req.params.category;
      res.set('Cache-Control', 'no-cache');
      result.layout = 'pages';
      result.domain = props.domain;
      result.team_id = req.query.teamid;
      result.count = result.campaignsCount[0].count;
      if(result.count>12){
      var showmore=true
      }else{
        var showmore=false;
      }

      result.showmore=showmore;
      var teams = underscore.pluck(result.getCampaignsForUser, 'parent_id');
      result.teamcampuserid = teams;
      var now = moment().toDate();
      for (var i = 0; i < result.campaigns.length; i++) {
        var campaignNotExpired = moment(result.campaigns[i].end_date).isAfter(now); // will return true if the campaign's end date is in the future
        var campaignExpiredToday = moment(result.campaigns[i].end_date).isSame(now, 'day');
        if (campaignNotExpired || campaignExpiredToday) {
          if(campaignExpiredToday){
            result.campaigns[i].time_left = 1; //regex to strip out the text and only show the number
          } else {
            daysRemaining = moment().countdown(result.campaigns[i].end_date, countdown.DAYS, 2).toString(); // '301 days'
            result.campaigns[i].time_left = daysRemaining.match(/\d+/g); //regex to strip out the text and only show the number
            result.campaigns[i].time_left = parseInt(result.campaigns[i].time_left);
          }

        } else {
          result.campaigns[i].time_left = 0;
        }
      }
      if(req.query.teamid){
        result.team_name=result.getTeamName[0].team_name;
      }
      result.analyticsid = props.analyticsid;
      if(flag=="mobilepubliccharity"){
        var object = {};
      object.data = result;
      utility.dataHandler(object, res);
      }else{
      res.render('./pages/campaigns-list', result);
    }
    }
  });
});

pagesRouter.get('/getMoreCampaigns/:category', function(req, res, next) {
  var obj = {};
  if (req.params.category != 'all') {
    obj.categoryId = req.params.category
  }
  obj.offset = req.query.offset;
  if(req.query.teamid){
    obj.teamid=req.query.teamid;
  }
  async.parallel({
    getMoreCampaigns: function(callback) {
      pagesService.getMoreCampaigns(obj, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          var object = {};
          object.data = result;
          var now = moment().toDate();
          for (var i = 0; i < result.length; i++) {
            var campaignNotExpired = moment(result[i].end_date).isAfter(now); // will return true if the campaign's end date is in the future
            var campaignExpiredToday = moment(result[i].end_date).isSame(now, 'day');
            if (campaignNotExpired || campaignExpiredToday) {
              if (campaignExpiredToday) {
                result[i].time_left = 1; //regex to strip out the text and only show the number

              } else {
                daysRemaining = moment().countdown(result[i].end_date, countdown.DAYS, 2).toString(); // '301 days'
                result[i].time_left = daysRemaining.match(/\d+/g); //regex to strip out the text and only show the number
                result[i].time_left = parseInt(result[i].time_left);
              }

            } else {
              result[i].time_left = 0;
            }
          }
        }
        callback(null,result);
      })
    },
    getCampaignsForUser: function(callback) {
      var cat = {}

      if (req.query.userid) {
        cat.userid = req.query.userid;
      }
      pagesService.getCampaignUser(cat, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result);
        }
      });
    }
  }, function(err, result) {

    var object = {};
    object.data = result.getMoreCampaigns;
    var teams = underscore.pluck(result.getCampaignsForUser, 'parent_id');
    object.teamcampuserid = teams;
    res.send(object);


  });
});


pagesRouter.post('/sendmail', function(req,res,next) {
    var obj = req.body;
    var logsObj = req.logsObj;
    pagesService.sendMailToCreator(obj, function(err,result) {
       if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else{
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
    });
});

pagesRouter.get('/country/:code', function(req,res,next) {
    var obj={};
    obj.countryCode=req.params.code;
    var logsObj = req.logsObj;
    pagesService.getCountryId(obj, function(err,result) {
       if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else{
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
    });
});
pagesRouter.get('/country/state/:statename/:countryname', function(req,res,next) {
    var obj={};
    obj.statename=req.params.statename;
    obj.Countryid = req.params.countryname;
    var logsObj = req.logsObj;
    pagesService.getStateId(obj, function(err,result) {
       if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else{
      var object = {};
      object.data = result;
      utility.dataHandler(object, res);
    }
    });
});

/**
*@api {get} /pages/getcampaign/mentions/:codeid/:skip Campaign Mentions
* @apiName Campaign Mentions
* @apiGroup Campaign 
* @apiDescription  Used to get the campaign mentions       
*  @apiParam {Number}   codeid                  campaign id.
*  @apiParam {Number}   skip                    Number to skip the result
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
* {
*  "status": "success",
* "data": [
*    {
*     "creator_name": "venkata narendra",
*     "creator_pic": "https://wonderwe.s3.amazonaws.com/profile/a1b782ec-ed0c-4201-b1e0-0d71e3ffb4a2-12360208_870950456356589_7867136047850718139_n.jpg",
*     "creator_id": 3519,
*      "id": 7305,
*      "entity_id": 3980234,
*      "entity_type": "user",
*      "content": "<a href=https://dev.wonderwe.com/boss10>We#boss10</a> ten",
*      "date_posted": "2017-02-08T00:53:11.000Z",
*      "in_reply_id": null,
*      "original_entity_id": null,
*      "status_type": "post",
*      "retweets": 0,
*      "reply_count": 0,
*      "image_url": null,
*      "headline": null,
*      "commonSlug": "venkatanarendra5",
*      "parentSlug": null,
*      "parent_creator_name": null,
*      "parent_creator_pic": null,
*      "parent_creator_id": null,
*      "parent_type": null,
*      "metadata": null,
*      "code_tmpl": "{\"id\":3985840,\"entity_type\":\"code\",\"entity_id\":89165,\"nooffollowers\":4,\"noofposts\":0,\"following_users\":0,\"following_charities\":0,\"following_codes\":0,\"noof_donations\":1073,\"noof_donors\":15,\"slug\":\"boss10\",\"notifications_count\":0,\"volunteers_required\":0,\"volunteers_filled\":0,\"date_deleted\":null,\"facebook_shares\":null,\"tweets\":null,\"linkedin\":null,\"google_plus\":null,\"pinterest\":null,\"title\":\"Test campaign for testng\",\"code_text\":\"boss10\",\"code_picture_url\":\"https://wonderwe.s3.amazonaws.com/profile/07729b68-2a4d-4597-8d06-2d3b42075094-bestnaturewallpapershd_1_bemt8np.jpg\"}"
*   }]
*   }
*/
pagesRouter.get('/getcampaign/mentions/:codeid/:skip', function(req, res, next) {
var obj={};
obj.codeid=req.params.codeid;
obj.skip=req.params.skip;
  var logsObj = req.logsObj;
  pagesService.campaignComments(obj, function(err, data) {
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

module.exports = pagesRouter;
