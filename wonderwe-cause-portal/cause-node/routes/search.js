var express = require('express');
var searchRouter = express.Router();
var codeService = require('../services/code');
var feedServices = require('../services/feed');
var charityService = require('../services/charity');
var followerService = require('../services/follower');
var utilService = require('../services/weutil');

searchRouter.get('/zones', function(req, res, next) {
  var logsObj = req.logsObj;
  utilService.getZones(function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get zones, done, In search route"]);
      res.json(data);
    }

  });

});
searchRouter.get('/zones/:id', function(req, res, next) {

  utilService.getZoneById(req.params.id, function(err, data) {
    if (err) {
    utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get zone by id, done, In search route"]);
      res.json(data);
    }

  });

});

searchRouter.get('/codes', function(req, res, next) {
  if (!req.query.q) {
    req.query.q = "";
  }
  var searchTerm = req.query.q;
  var logsObj = req.logsObj;
  codeService.searchByText('%' + searchTerm + '%', function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get codes, done, In search route"]);
      res.json(data);
    }

  });

});
searchRouter.get('/followers', function(req, res, next) {
  var searchTerm = req.query.q;
  var logsObj = req.logsObj;
  followerService.charityFollowers('%' + searchTerm + '%', req.query.user_id, parseInt(req.query.skip), function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get followers, done, In search route"]);
      res.json(data);
    }

  });

});
searchRouter.get('/donors', function(req, res, next) { // Shows all users on the discover page
  if (!req.query.q) {
    req.query.q = "";
  }
  var searchTerm = req.query.q;
  var logsObj = req.logsObj;
  followerService.discoverUsers('%' + searchTerm + '%', req.query.user_id, parseInt(req.query.skip), function(err, data) {
    if (err) {
      utility.log('error', "discoverUsers in followerService from search route - " + req.cookies.logindonorid);
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get donors, done, In search route"]);
      res.json(data);
    }

  });

});
searchRouter.get('/campaigns', function(req, res, next) {
  if (!req.query.q) {
    req.query.q = "";
  }
  var searchTerm = req.query.q;
  var logsObj = req.logsObj;
  followerService.discoverCodes('%' + searchTerm + '%', req.query.user_id, parseInt(req.query.skip), function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get campaigns, done, In search route"]);
      res.json(data);
    }

  });

});
searchRouter.get('/onlyCampaigns', function(req, res, next) {
  if (!req.query.q) {
    req.query.q = "";
  }
  var searchTerm = req.query.q;
  var logsObj = req.logsObj;
  followerService.onlyCampaigns('%' + searchTerm + '%', req.query.user_id, parseInt(req.query.skip), function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get campaigns, done, In search route"]);
      res.json(data);
    }

  });

});
searchRouter.get('/charities', function(req, res, next) {
  if (!req.query.q) {
    req.query.q = "";
  }
  var searchTerm = req.query.q;
  var logsObj = req.logsObj;
  followerService.discoverCharities('%' + searchTerm + '%', req.query.user_id, parseInt(req.query.skip), function(err, data) {
    if (err) {
      utility.log('error', "discoverCharities in followerService from search route - " + req.cookies.logindonorid);
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get charity, done, In search route"]);
      res.json(data);
    }

  });

});
searchRouter.get('/mentions', function(req, res, next) {
  var searchTerm = req.query.q;
  var logsObj = req.logsObj;
  charityService.searchByName('%' + searchTerm + '%', function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get mentions, done, In search route"]);
      res.json(data);
    }
  });
});

searchRouter.get('/hashtags', function(req, res, next) {
  var searchTerm = req.query.q;
  var logsObj = req.logsObj;
  codeService.searchByHashTag('%' + searchTerm + '%', function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get hashtags, done, In search route"]);
      res.json(data);
    }
  });
});
searchRouter.get('/all', function(req, res, next) {

  followerService.discoverResults('%' + req.query.q + '%', req.query.user_id, parseInt(req.query.skip), function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "Get all search, done, In search route"]);
      res.json(data);
    }
  });
});

searchRouter.get('/hash/:hashtag', function(req, res, next) {
  var hashtag = req.params.hashtag;
  var logsObj = req.logsObj;
  excuteQuery.queryForAll(sqlQueryMap['gethashtagdata'], [hashtag, hashtag], function(err, userResult) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      if (userResult && userResult.length > 0) {
        var object = {};
        object.hashtag = hashtag;
        /*if (req.cookies.loadFrom != 'charity' && req.cookies.token) {
          object.donornav = "donor";
        } else if (req.cookies.loadFrom == 'charity' && req.cookies.token) {
          object.charitynav = "a";
        } else {
          object.nav = "";
        }*/
        object.stripe_publishable_key = props.stripe_publishable_key
        object.layout = 'pages';
        object.data = userResult;
        res.set('Cache-Control','no-cache');
        res.render('./pages/hashtagpage', object);
      }
    }
  });

});

searchRouter.get('/hashtag/data/:hashtag', function(req, res, next) {
  var hashtag = req.params.hashtag;
  var logsObj = req.logsObj;
  feedServices.getHashtagData(hashtag, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var obj = {};
      obj.data = data;
      res.json(obj);
    }
  });
});

searchRouter.get('/accounts/hashtag/:hashtag/:userId', function(req, res, next) {
  var hashtag = req.params.hashtag;
  var logsObj = req.logsObj;
  var userId = req.params.userId;
  feedServices.getHashtagAccounts(hashtag, userId, function(err, data) {
    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      //Send 200 Status With Real Data
      var obj = {};
      obj.data = data;
      res.json(obj);
    }
  });
});

module.exports = searchRouter;
