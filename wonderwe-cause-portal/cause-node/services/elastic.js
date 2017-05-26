var q = require('q');
var countdown = require('countdown');
var momentCountdown = require('moment-countdown');


exports.publicSearch = function(obj, callback) {

  var query = obj;
  var type = 'phrase_prefix';

  if (query.q.split(' ').length > 1) {
    type = 'best_fields';
  }

  var elasticSeachQuery = {
    size: query.limit || 50,
    query: {
      multi_match: {
        query: "\"" + query.q + "\"",
        type: type,
        operator: "and",
        fields: query.fields || ['text', 'username', 'fullname', 'wecode']
          //   "minimum_should_match": "70%"

      }
    }
  };
  if (query.skip) {
    elasticSeachQuery.from = parseInt(query.skip);
  }

  elasticClient.search({
    index: props.elastic_index,
    type: 'entity',
    body: elasticSeachQuery
  }, function(err, result) {
    if (err) {
      callback(err, null);
    } else {

      if (result && result.hits && result.hits.hits.length > 0) {

        if (query.users) {

          var realMentions = [];
          async.each(result.hits.hits, function(singleObj, eachCallback) {

            if (singleObj._source.type === 'user') {
              var obj = {};
              obj.slug = singleObj._source.username;
              obj.image = singleObj._source.profilepic;
              obj.suggestedname = singleObj._source.fullname;
              obj.suggestid = singleObj._source.id;
              obj.entityId = singleObj._source.entityid;
              obj.type = 'user';
              realMentions.push(obj);
            } else if (singleObj._source.type === 'charity') {

              var obj = {};
              obj.slug = singleObj._source.username;
              obj.image = singleObj._source.profilepic;
              obj.suggestedname = singleObj._source.fullname;
              obj.suggestid = singleObj._source.id;
              obj.entityId = singleObj._source.entityid;
              obj.type = 'charity';
              realMentions.push(obj);
            }

            eachCallback(null);
          }, function(err) {
            callback(null, realMentions);
          });

        } else if (query.wecode) {
          /* var campigns = underscore.filter(result.hits.hits, function(doc) {
             return doc._source.type === 'code';
           });*/

          var realMentions = [];
          async.each(result.hits.hits, function(singleObj, eachCallback) {
            if (singleObj._source.type === 'code' && singleObj._source.status === 'published') {
              var obj = {};

              obj.slug = singleObj._source.username;
              obj.image = singleObj._source.profilepic;
              obj.title = singleObj._source.fullname;
              obj.suggestedname = singleObj._source.wecode;
              obj.suggestid = singleObj._source.id;
              obj.entityId = singleObj._source.entityid;
              obj.type = 'code';
              realMentions.push(obj);
            }

            eachCallback(null);
          }, function(err) {

            callback(null, realMentions);
          });

        } else {
          var realMentions = [];
          async.each(result.hits.hits, function(singleObj, eachCallback) {
            var obj = {};
            obj.text = singleObj._source.text;
            realMentions.push(obj);
            eachCallback(null);
          }, function(err) {
            callback(null, realMentions);
          });
        }
      } else {
        fuzzySearch(query, callback);
      }
    }
  });
};

var fuzzySearch = function(query, callback) {

  elasticClient.search({
    index: props.elastic_index,
    type: 'entity',
    body: {
      size: query.limit || 50,
      query: {
        multi_match: {
          query: query.q,
          fuzziness: 2,
          //        type:'cross_fields',
          fields: query.fields || ['text', 'username', 'fullname', 'wecode'],
          "minimum_should_match": "100%"
        }
      }
    }
  }, function(err, result) {

    if (err) {
      callback(err, null);
    } else {

      if (result && result.hits && result.hits.hits.length > 0) {

        if (query.users) {
          var realMentions = [];
          async.each(result.hits.hits, function(singleObj, eachCallback) {


            if (singleObj._source.type === 'user') {
              var obj = {};
              obj.slug = singleObj._source.username;
              obj.image = singleObj._source.profilepic;
              obj.suggestedname = singleObj._source.fullname;
              obj.suggestid = singleObj._source.id;
              obj.entityId = singleObj._source.entityid;
              obj.type = 'user';
              realMentions.push(obj);
            } else if (singleObj._source.type === 'charity') {

              var obj = {};
              obj.slug = singleObj._source.username;
              obj.image = singleObj._source.profilepic;
              obj.suggestedname = singleObj._source.fullname;
              obj.suggestid = singleObj._source.id;
              obj.entityId = singleObj._source.entityid;
              obj.type = 'charity';
              realMentions.push(obj);
            }

            eachCallback(null);
          }, function(err) {
            callback(null, realMentions);
          });

        } else if (query.wecode) {
          /* var campigns = underscore.filter(result.hits.hits, function(doc) {
             return doc._source.type === 'code';
           });*/

          var realMentions = [];
          async.each(result.hits.hits, function(singleObj, eachCallback) {

            if (singleObj._source.type === 'code' && singleObj._source.status === 'published') {
              var obj = {};
              /*
              { image: ' https://wonderwe.s3.amazonaws.com/profile/c5bfa833-ff85-4842-84d1-cf0ffa94f378-default-campaignpng.png',
                  suggestedname: 'trinesh-yadla3',
                  suggestid: 3616,
                  type: 'code',
                  slug: 'trineshyadla31',
                  entityId: 3815006 }*/

              obj.slug = singleObj._source.username;
              obj.image = singleObj._source.profilepic;
              obj.title = singleObj._source.fullname;
              obj.suggestedname = singleObj._source.wecode;
              obj.suggestid = singleObj._source.id;
              obj.entityId = singleObj._source.entityid;
              obj.type = 'code';
              realMentions.push(obj);
            }

            eachCallback(null);
          }, function(err) {

            callback(null, realMentions);
          });

        } else {
          var realMentions = [];
          async.each(result.hits.hits, function(singleObj, eachCallback) {
            var obj = {};
            obj.text = singleObj._source.text;
            realMentions.push(obj);
            eachCallback(null);
          }, function(err) {
            callback(null, realMentions);
          });
        }
      } else {
        callback(null, [])
      }

    }
  });
};

exports.updateDocument = function(data, callback) {
console.log("Finally in elastic seacrh upadte document hurray ")
  elasticClient.update({
      index: data.index || 'dev',
      type: data.type || 'entity',
      id: data.id,
      body: {
        doc: data.doc
      }
    }).then(function(result) {
      callback(null, result);
    })
    .error(function(error) {
      callback(error, null);
    });
};


exports.removeDocument = function(data, callback) {

  elasticClient.delete({
      index: props.elastic_index,
      type: 'entity',
      id: data.id
    }).then(function(result) {
      callback(null, result);
    })
    .error(function(error) {
      callback(error, null);
    });
};

exports.getSuggestions = function(query) {
  var deferred = q.defer();
  elasticClient.suggest({
    index: props.elastic_index,
    type: 'entity',
    body: {
      my_suggestor: {
        text: query,
        term: {
          field: 'wecode'
        }
      }
    }
  }, function(err, response) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(response.my_suggestor[0].options);
    }
  });

  return deferred.promise;
}

exports.fuzzySearchWecode = function(query, query_fields, limit, isPhone,claim) {
  var deferred = q.defer();
  var fuzzyQuery = {
    index: props.elastic_index,
    type: 'entity',
    body: {
      size: limit || 50,
      query: {
        multi_match: {
          query: query.q,
          fuzziness: 2,
          //        type:'cross_fields',
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
    }
  };


  if (query.campaignFor) {
    fuzzyQuery.index = props.elastic_index + '_np';
    fuzzyQuery.type = 'charity_for_fundraiser';
  } else {
    fuzzyQuery.type = 'entity';
  }

  if (isPhone) {
    fuzzyQuery.body.query = {
      "filtered": {
        "filter": {
          "term": {
            "status": "approved"
          }
        },
        "query": {
          "multi_match": {
            "query": query.q,
            "fuzziness": 2,
            "fields": query_fields || ['text', 'username', 'fullname', 'wecode']
          }
        }
      }
    };
  }
  if(claim){
    fuzzyQuery.body.query = {
      "filtered": {
        "filter": {
          "term": {
            "status": "not_claimed"
          }
        },
        "query": {
          "multi_match": {
            "query": query.q,
            "fuzziness": 2,
            "fields": query_fields || ['text', 'username', 'fullname', 'wecode']
          }
        }
      }
    };
  }

  elasticClient.search(fuzzyQuery, function(err, result) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(result.hits.hits);
    }
  });
  return deferred.promise;
};

exports.maintainCampaignStatus = function(dataArray, query, req, res) {
  var suggestionsArray = [];
  async.each(dataArray, function(singleObj, eachCallback) {

    if (singleObj._source.type === 'code' && singleObj._source.status === 'published' && moment.utc(singleObj._source.end_date).toDate() > moment.utc().toDate()) {
      suggestionsArray.push(singleObj);
    } else if (singleObj._source.type === 'user' || singleObj._source.type === 'charity') {
      suggestionsArray.push(singleObj);
    }
    eachCallback(null);

  }, function(err) {
    res.send(suggestionsArray);

  });

};

//Start: Sitelink Search Box
exports.elasticFollowStatusSLSearch = function(dataArray, query, req, res) {
  var finalResultArray = [];

  //If User is Logged In
  var logindonorid = req.query.logindonorid;
  if (logindonorid !== undefined) {
    query.user_id = logindonorid;
  }
  async.each(dataArray, function(singleObj, eachCallback) {
    console.log(singleObj._source.username + ':' + singleObj._source.type + ':' + singleObj._source.type);
    if (singleObj._source.type === 'code' && singleObj._source.status === 'published' && moment.utc(singleObj._source.end_date).toDate() > moment.utc().toDate()) {
      pool.query(sqlQueryMap['elastic-code-followstatus'], [query.user_id, singleObj._source.id], function(err, codeResult) {
        if (codeResult && codeResult.length > 0) {
          singleObj._source.is_following = codeResult[0].is_following;
          singleObj._source.donation = numeral(codeResult[0].donation).format('0,0');
          singleObj._source.goal = numeral(singleObj._source.goal).format('0,0');
          singleObj._source.donation_progress = codeResult[0].donation_progress;
          singleObj._source.beneficiary = codeResult[0].beneficiary;
          singleObj._source.donors = codeResult[0].donors;
          singleObj._source.donation = codeResult[0].donation;
          singleObj._source.campaigntype = codeResult[0].campaigntype;
          singleObj._source.teamid = codeResult[0].teamid;
          singleObj._source.teamname = codeResult[0].teamname;
          var now = moment().toDate();
          var campaignNotExpired = moment(singleObj._source.end_date).isAfter(now); // will return true if the campaign's end date is in the future
          var campaignExpiredToday = moment(singleObj._source.end_date).isSame(now, 'day');

          if (campaignNotExpired || campaignExpiredToday) {
            daysRemaining = moment().countdown(singleObj._source.end_date, countdown.DAYS, 2).toString(); // '301 days'
            if (daysRemaining) {
              singleObj._source.time_left = daysRemaining.match(/\d+/g); // regex to strip out the text and only show the number
            } else {
              singleObj._source.time_left = 0; // regex to strip out the text and only show the number
            }
          } else {
            singleObj._source.time_left = -1;
          }
        }
        finalResultArray.push(singleObj);
        eachCallback(null);
      });
      //suggestionsArray.push(singleObj);
    } else if (singleObj._source.type === 'charity') {

      pool.query(sqlQueryMap['elastic-charity-followstatus'], [query.user_id, singleObj._source.id], function(err, codeResult) {
        //singleObj._source.is_following = codeResult[0].is_following;
        if (codeResult && codeResult.length > 0) {
          singleObj._source.is_following = codeResult[0].is_following;
          singleObj._source.noofposts = codeResult[0].posts;
          singleObj._source.nooffollowers = codeResult[0].followers;
          singleObj._source.campaigns = codeResult[0].noof_campaigns;
        }
        finalResultArray.push(singleObj);
        eachCallback(null);
      });
      // suggestionsArray.push(singleObj);
      //  eachCallback(null);
    } else if (singleObj._source.type === 'user') {
      pool.query(sqlQueryMap['elastic-donor-followstatus'], [query.user_id, singleObj._source.id], function(err, codeResult) {
           if(codeResult&&codeResult[0]>0){
          singleObj._source.is_following = codeResult[0].is_following;
          singleObj._source.following = codeResult[0].following;
          singleObj._source.nooffollowers = codeResult[0].followers;
          singleObj._source.campaigns = codeResult[0].campaigns;
        }

        finalResultArray.push(singleObj);
        eachCallback(null);
      });
    } else if (singleObj._source.type == 'team') {
      pool.query(sqlQueryMap['elastic-team-details'], [singleObj._source.id], function(err, teamResult) {
        if (teamResult && teamResult.length > 0) {
          singleObj._source.camp_name=teamResult[0].camp_name;
          singleObj._source.team_pic_url = teamResult[0].team_logo;
          singleObj._source.noOfDonors = teamResult[0].noOfDonors;
          singleObj._source.noOfFundraisers = teamResult[0].noOfFundraisers;
          singleObj._source.noOfDonations = teamResult[0].noOfDonations;
          singleObj._source.charity_name=teamResult[0].charity_name;
          singleObj._source.beneficiary=teamResult[0].beneficiary;
          finalResultArray.push(singleObj);
        }
        eachCallback(null);
      });
    } else {
      eachCallback(null);
    }

  }, function(err) {
    var obj = {};
    var pageSeoData = {};
    pageSeoData.seoTitle = "Site Search";
    obj.metadata = pageSeoData;
    obj.layout = 'pages';
    //obj.searchQuery = req.query.q;
    obj.searchQuery = req.query.searchQuery;
    obj.analyticsid = props.analyticsid;

    var donortoken = req.cookies.token;
    if (donortoken !== undefined) {
      obj.donornav = "donor";
    }

    if (finalResultArray && finalResultArray.length > 0) {
      finalResultArray = underscore.sortBy(finalResultArray, '_score').reverse();
      console.log(finalResultArray[0]._score);
      obj.charities = underscore.filter(finalResultArray, function(doc) {
        return doc._source.type === 'charity'
      });
      obj.campaigns = underscore.filter(finalResultArray, function(doc) {
        return doc._source.type === 'code'
      });
      obj.users = underscore.filter(finalResultArray, function(doc) {
        return doc._source.type === 'user'
      });
      obj.teams = underscore.filter(finalResultArray, function(doc) {
        return doc._source.type === 'team'
      });
      obj.activetab = finalResultArray[0]._source.type;
      obj.googleSLSearch = "googleSLSearch";
      obj.sessionid = req.query.logindonorid;
      console.log("xdvfgbhnjghdajsdjasdjasgdjagsdjasb")
      console.log(finalResultArray)
      res.render('./pages/sitelinksearch', obj);
    } else {
      obj.activetab = 'code';
      obj.empty = "empty";
      obj.googleSLSearch = "googleSLSearch";
      res.render('./pages/sitelinksearch', obj);
    }

  });

};
//End: Sitelink Search Box

//Start: Sitelink Search Box Mobile
exports.elasticFollowStatusSLSearchMobile = function(dataArray, query, req, res) {
  var finalResultArray = [];

  //If User is Logged In
  var logindonorid = req.cookies.logindonorid;
  if (logindonorid !== undefined) {
    query.user_id = logindonorid;
  }

  async.each(dataArray, function(singleObj, eachCallback) {

    if (singleObj._source.type === 'code' && singleObj._source.status === 'published' && moment.utc(singleObj._source.end_date).toDate() > moment.utc().toDate()) {
      pool.query(sqlQueryMap['elastic-code-followstatus'], [query.user_id, singleObj._source.id], function(err, codeResult) {
        if (codeResult && codeResult.length > 0) {
          singleObj._source.is_following = codeResult[0].is_following;
          singleObj._source.donation = numeral(codeResult[0].donation).format('0,0');
          singleObj._source.goal = numeral(singleObj._source.goal).format('0,0');
          singleObj._source.donation_progress = codeResult[0].donation_progress;
        }
        finalResultArray.push(singleObj);
        eachCallback(null);
      });
      //suggestionsArray.push(singleObj);
    } else if (singleObj._source.type === 'charity') {

      pool.query(sqlQueryMap['elastic-charity-followstatus'], [query.user_id, singleObj._source.id], function(err, codeResult) {
        //singleObj._source.is_following = codeResult[0].is_following;
        if (codeResult && codeResult.length > 0) {
          singleObj._source.is_following = codeResult[0].is_following;
        }
        finalResultArray.push(singleObj);
        eachCallback(null);
      });
      // suggestionsArray.push(singleObj);
      //  eachCallback(null);
    } else if (singleObj._source.type === 'user') {
      pool.query(sqlQueryMap['elastic-donor-followstatus'], [query.user_id, singleObj._source.id], function(err, codeResult) {
        if (codeResult && codeResult.length > 0) {
          singleObj._source.is_following = codeResult[0].is_following;
        }
        finalResultArray.push(singleObj);
        eachCallback(null);
      });
    } else {
      eachCallback(null);
    }

  }, function(err) {

    var obj = {};
    var pageSeoData = {};
    pageSeoData.seoTitle = "Site Search";
    obj.metadata = pageSeoData;
    obj.layout = 'pages';
    //obj.searchQuery = req.query.q;
    obj.searchQuery = req.query.searchQuery;
    obj.analyticsid = props.analyticsid;

    var donortoken = req.cookies.token;
    if (donortoken !== undefined) {
      obj.donornav = "donor";
    }

    if (finalResultArray && finalResultArray.length > 0) {
      obj.charities = underscore.filter(finalResultArray, function(doc) {
        return doc._source.type === 'charity'
      });
      obj.campaigns = underscore.filter(finalResultArray, function(doc) {
        return doc._source.type === 'code'
      });
      obj.users = underscore.filter(finalResultArray, function(doc) {
        return doc._source.type === 'user'
      });
      obj.googleSLSearch = "googleSLSearch";
      obj.sessionid = req.cookies.logindonorid;
      res.send(obj);
    } else {
      obj.empty = "empty";
      obj.googleSLSearch = "googleSLSearch";
      res.send(obj);
    }

  });

};
//End: Sitelink Search Box Mobile

exports.elasticFollowStatus = function(dataArray, query, req, res) {
  var finalresultArray = [];
  async.each(dataArray, function(singleObj, callback) {

    if (singleObj._source.type === 'code' && singleObj._source.status === 'published' && moment.utc(singleObj._source.end_date) > moment.utc().toDate()) {
      pool.query(sqlQueryMap['elastic-code-followstatus'], [query.user_id, singleObj._source.id], function(err, codeResult) {
        if (codeResult && codeResult.length > 0) {
          singleObj._source.is_following = codeResult[0].is_following;


          singleObj._source.donation = numeral(codeResult[0].donation).format('0,0');
          singleObj._source.goal = numeral(singleObj._source.goal).format('0,0');

          singleObj._source.donation_progress = codeResult[0].donation_progress;
        }
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
    if (finalresultArray && finalresultArray.length > 0) {
      if (query.flag == 'wecodesearch') {
        var obj = {};
        obj.campaigns = underscore.filter(finalresultArray, function(doc) {
          return doc._source.type === 'code'
        });
        obj.layout = 'pages';
        obj.stripe_publishable_key = props.stripe_publishable_key;
        res.render('./pages/elastic-search-wecode', obj);
      } else if (query.flag == 'fundraise') {
        //TODO: We have to see what is going on Here. - Anyway this Query has to be Changed.
        var obj = {};
        obj.charities = underscore.filter(finalresultArray, function(doc) {
          return doc._source.type === 'charity'
        });
        res.send(obj);
      } else {
        res.send(finalresultArray);
      }
    } else {
      if (query.flag) {
        var data = req.query.codeid;
        var obj = {};
        obj.wecode = data;
        res.render('./pages/campaign-404', obj)
      } else {
        res.send(finalresultArray);
      }

    }
  });
};

exports.updateNonProfitStatus = function(charity_id, status, profilepic, callback) {
  var charity_data = {};
  var me = this;
  if(profilepic){
  charity_data = {
    index: props.elastic_index + '_np',
    type: 'charity_for_fundraiser',
    doc: {
      status: status,
      profilepic:profilepic
    }
  };
}else{
  charity_data = {
    index: props.elastic_index + '_np',
    type: 'charity_for_fundraiser',
    doc: {
      status: status
    }
  };
}

  excuteQuery.queryForAll(sqlQueryMap['getCharityEntity'], [charity_id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      charity_data.id = result[0].id;
      utility.log('INFO', charity);
      me.updateDocument(charity_data, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result);
        }
      });
    }
  });
};

exports.addDocument = function(data, callback) {

  elasticClient.create({
      index: data.index || props.elastic_index,
      type: data.type || props.elastic_type,
      id: data.charityData.entityid,
      body: data.charityData
    },
    function(err, result) {
      console.log(err);
      if (err) {
        callback(err, null);
      } else {
        console.log(result);
        callback(null, null);
      }
    });

};

exports.getPublishedCampaigns = function(query, callback) {

  try {
    var query = query;
    var searchQuery = {};
    var campaigns = [];
    if (query && (query.q.indexOf('#') + 1)) {
      query.fields = ['wecode'];
      query.q = query.q.split('#')[1];
    }

    var records = [];
    var query_fields = query.fields
    var type = query.type || 'phrase_prefix';

    if (query.q.split(' ').length > 1) {
      type = 'cross_fields';
    }

    npSearchQuery = {
      "filtered": {
        "filter": {
          "term": {
            "type": "code"
          }
        },
        "query": {
          "multi_match": {
            "query": query.q,
            "type": type,
            "fields": query_fields || ["fullname", "username", "text", "state", "city", "description", "wecode", "ein"]
          }
        }
      }
    };

    var elasticSeachQuery = {
      size: parseInt(query.limit) || 10,
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

    var searchQuery = {
      index: props.elastic_index,
      type: 'entity',
      body: elasticSeachQuery
    };

    elasticClient.search(searchQuery, function(err, result) {
      if (err) {
        console.log(err);
        callback(err, null);
      } else {
        if (result.hits.hits.length) {
          console.log(result.hits.hits.length);
          async.each(result.hits.hits, function(singleObj, eachCallback) {
            if (singleObj._source.status === 'published' && moment.utc(singleObj._source.end_date).toDate() > moment.utc().toDate()) {
              campaigns.push(singleObj);
            }
            eachCallback(null);
          }, function(err) {
            if (err) {
              callback(null, []);
            } else {
              callback(null, campaigns);
            }
          });
        } else {
          callback(null, []);
        }
      }
    });
  } catch (err) {
    console.log(err);
    callback(err, null);
  }

};
/*
module.exports = {
  update: updateDocument,
  remove: removeDocument,
  getSuggestions: getSuggestions,
  publicSearch: publicSearch
};*/
