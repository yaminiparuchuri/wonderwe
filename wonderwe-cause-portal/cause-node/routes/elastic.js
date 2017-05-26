var express = require('express');
var elasticRouter = express.Router();
var elasticService = require('../services/elastic.js');
var q = require('q');
var _ = require('underscore');

elasticRouter.get('/search', function(req, res) {
  redisClient.get(req.cookies.token, function(err, redisResult) {
    if (redisResult) {
      redisResult = JSON.parse(redisResult);
      req.query.logindonorid = redisResult.id
    } 
    var query = req.query;
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

          if (req.query && req.query.fields) {

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
          //query.campaignFor = 'charity';
          elasticService.fuzzySearchWecode(query, query_fields, req.query.limit,null)
            .then(function(data) {
              res.status(200);

              if (req.query && req.query.fields) {

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
              //   elasticFollowStatus(data, query, req, res)

            })
            .fail(function(err) {
              res.send(err);
            });
        }
      }
    });
  })
});

exports.maintainCampaignStatus = function(dataArray, query, req, res) {

  var suggestionsArray = [];
  async.each(dataArray, function(singleObj, eachCallback) {

    if (singleObj._source.type === 'code' && singleObj._source.status === 'published') {
      suggestionsArray.push(singleObj);
    } else if (singleObj._source.type === 'user' || singleObj._source.type === 'charity') {
      suggestionsArray.push(singleObj);
    }
    eachCallback(null);

  }, function(err) {
    res.send(suggestionsArray);
  });

};


exports.elasticFollowStatu = function(dataArray, query, req, res) {

  var finalresultArray = [];
  async.each(dataArray, function(singleObj, callback) {

    if (singleObj._source.type === 'code' && singleObj._source.status === 'published' && moment.utc(singleObj._source.end_date).toDate() > moment.utc().toDate()) {
      pool.query(sqlQueryMap['elastic-code-followstatus'], [query.user_id, singleObj._source.id], function(err, codeResult) {
        if (codeResult && codeResult.length > 0) {
          singleObj._source.is_following = codeResult[0].is_following;
        }
        singleObj._source.donation = numeral(codeResult[0].donation).format('$0,0');
        singleObj._source.goal = numeral(singleObj._source.goal).format('$0,0');
        singleObj._source.donation_progress = codeResult[0].donation_progress;
        finalresultArray.push(singleObj);
        callback(null);
      });

    } else if (singleObj._source.type === 'charity') {

      pool.query(sqlQueryMap['elastic-charity-followstatus'], [query.user_id, singleObj._source.id], function(err, codeResult) {
        //singleObj._source.is_following = codeResult[0].is_following;
        if (codeResult && codeResult.length > 0) {
          singleObj._source.is_following = codeResult[0].is_following;
        }
        finalresultArray.push(singleObj);
        callback(null);
      });
    } else if (singleObj._source.type === 'user') {

      pool.query(sqlQueryMap['elastic-donor-followstatus'], [query.user_id, singleObj._source.id], function(err, codeResult) {
        if (codeResult && codeResult.length > 0) {
          singleObj._source.is_following = codeResult[0].is_following;
        }
        singleObj._source.is_following = '';
        finalresultArray.push(singleObj);
        callback(null);
      });
    } else {
      callback(null);
    }
  }, function(err) {
    //res.send(finalresultArray);
    if (finalresultArray && finalresultArray.length > 0) {
      if (query.flag) {
        var obj = {};
        obj.campaigns = underscore.filter(finalresultArray, function(doc) {
          return doc._source.type === 'code'
        });
        obj.layout = 'pages';
        res.set('Cache-Control', 'no-cache');
        res.render('./pages/elastic-search-wecode', obj);
      } else {
        res.send(finalresultArray);
      }
    } else {
      var data = req.query.codeid;
      var obj = {};
      obj.wecode = data;
      res.set('Cache-Control', 'no-cache');
      res.render('./pages/campaign-404', obj)
    }
  });
};


/***
 *  Getting an individual document
 *
 ***/

elasticRouter.get('/get', function(req, res) {
  var id = req.query.id;

  elasticClient.get({
      index: props.elastic_index,
      "type": 'entity',
      "id": id
    }).then(function(result) {
      res.status(200);
      res.send(result);
    })
    .error(function(err) {
      res.status(500);
      res.send(err);
    });
});

elasticRouter.post('/update', function(req, res) {
  var data = {
    id: req.body.id,
  }
  delete req.body.id;
  data.doc = req.body;

  elasticService.update(data, function(err, result) {
    if (err) {
      res.status(500);
      res.send(err);
    } else {
      res.status(200);
      res.send(result);
    }
  });
});


elasticRouter.post('/delete', function(req, res) {
  var data = {
    id: req.body.id
  };
  delete req.body.id;

  elasticService.remove(data, function(err, result) {
    if (err) {
      res.status(500);
      res.send(err);
    } else {
      res.status(200);
      res.send(result);
    }
  });
});

elasticRouter.get('/suggest', function(req, res) {

  elasticService.getSuggestions(req.query.q)
    .then(function(data) {
      res.status(200);
      res.send(data);
    }).fail(function(err) {
      res.status(500);
      res.send(err);
    });


});

elasticRouter.get('/mentions/search', function(req, res) {
  var logsObj = req.logsObj;
  var query = req.query;
  var type = 'phrase_prefix';

  elasticService.publicSearch(query, function(err, result) {

    if (err) {
      utility.newAppErrorHandler(err, logsObj, res);
    } else {
      res.send(result);
    }
  });
});

elasticRouter.get('/:entity_type/suggestions',function(req,res){
  var logsObj = req.logsObj;
  var query = req.query;
  var type = 'phrase_prefix';

  if (req.query.q.split(' ').length > 1) {
      type = 'cross_fields';
    }
  query.entity_type = req.params.entity_type;
  query.limit = req.query.limit;
  query.type = type

  elasticService.getPublishedCampaigns(query,function(err,result){
    if(err){
      res.statusCode = 500;
      res.send(err);
    }else{
      res.statusCode = 200;
      res.send(result);
    }
  });
});

module.exports = elasticRouter;
