var elasticsearch = require('elasticsearch');
var props = require('config').props;
var mysql = require('mysql');
var async = require('async');
var q = require('q');
var underscore = require('underscore');
var express = require('express');
var scriptsRouter = express.Router();

var client = new elasticsearch.Client({
  host: props.elasticServer,
  // log: 'trace'
});

var pool = mysql.createPool({
  host: props.host,
  port:props.port,
  user: props.username,
  password: props.password,
  database: props.database,
  connectionLimit: 1500,
  debug: props.dbdebug,
  acquireTimeout: 500000,
  connectTimeout: props.connectTimeout
});


/*********************** Creating index with settings and mappings ********************/

scriptsRouter.get('/create/index', function(req, res, next) {

  var deferred = q.defer();
  client.indices.create({
    "index": props.elastic_index,
    "settings": {
      "number_of_shards": 1,
      "analysis": {
        "filter": {
          "autocomplete_filter": {
            "type": "ngram",
            "min_gram": 1,
            "max_gram": 20
          }
        },
        "analyzer": {
          "autocomplete": {
            "type": "custom",
            "tokenizer": "standard",
            "filter": [
              "lowercase",
              "autocomplete_filter"
            ]
          }
        }
      }
    },
    "mappings": {
      "entity": {
        "properties": {
          "username": {
            "type": "string",
            "index_analyzer": "autocomplete",
            "search_analyzer": "standard",
            "term_vector": "with_positions_offsets"
          },
          "fullname": {
            "type": "string",
            "index_analyzer": "autocomplete",
            "search_analyzer": "standard",
            "term_vector": "with_positions_offsets"
          },
          "state": {
            "type": "string",
            "index_analyzer": "autocomplete",
            "search_analyzer": "standard"
          },
          "city": {
            "type": "string",
            "index_analyzer": "autocomplete",
            "search_analyzer": "standard"
          },
          "profilepic": {
            "type": "string",
            "index_analyzer": "autocomplete",
            "search_analyzer": "standard"
          },
          "description": {
            "type": "string",
            "index_analyzer": "autocomplete",
            "search_analyzer": "standard"
          },
          "categories": {
            "type": "string",
            "index_analyzer": "autocomplete",
            "search_analyzer": "standard"
          },
          "text": {
            "type": "string",
            "index_analyzer": "autocomplete",
            "search_analyzer": "standard"
          },
          "wecode": {
            "type": "string",
            "index_analyzer": "autocomplete",
            "search_analyzer": "standard"
          }
        }
      }
    }
  }, function(err, result) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(result);
    }
  });
});

/***************** Inserting the records *********************/

scriptsRouter.get('/data/store/elastic/:slug', function(req, res, next) {

  var slug = req.params.slug;

  var records = {
    users: 0,
    charities: 0,
    champiagns: 0,
    hashcodes: 0,
    null: 0
  };

  var logger = {
    log: function(d) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write("users:" + d.users + " | charities:" + d.charities + " | champiagns:" + d.champiagns + " | hashcode:" + d.hashcodes + " |  null:" + d.null);
    }
  }

  pool.query('select * from entity_tbl where slug=?', [slug], function(err, result) {
    async.eachSeries(result, function(singleObj, callback) {

      var type = singleObj.entity_type;

      if (type === 'user') {
        // console.log('user');
        //callback(null);

        var sqlQuery = "select u.id,u.name, up.about_me as description, up.city, up.background_pic_url, up.address_1, up.address_2, st.name as state, up.profile_pic_url from user_tbl u inner join user_profile_tbl up on up.user_id = u.id left outer join states_tbl st on st.id = up.state where u.id = ?";
        pool.query(sqlQuery, [singleObj.entity_id], function(err, userResult) {
          if (userResult) {
            var object = userResult[0];
            if (object) {
              var userObject = {};

              userObject.entityid = singleObj.id;
              userObject.id = userResult[0].id;
              userObject.state = userResult[0].state;
              userObject.city = userResult[0].city;
              userObject.background_pic = userResult[0].background_pic_url;
              userObject.profilepic = userResult[0].profile_pic_url;
              userObject.username = singleObj.slug;
              userObject.fullname = userResult[0].name;
              userObject.type = 'user';
              userObject.description = userResult[0].description;
              userObject.location = "";

              pool.query('select ct.* from user_category_tbl uc inner join charity_category_tbl ct on ct.group_code = uc.category_id where uc.user_id=? group by uc.category_id', [singleObj.entity_id], function(err, categoryResult) {

                if (categoryResult && categoryResult.length > 0) {
                  var categories = underscore.uniq(underscore.pluck(categoryResult, 'group_title'));
                  userObject.categories = categories;
                } else {
                  userObject.categories = [];
                }

                client.create({
                    index: props.elastic_index,
                    type: 'entity',
                    id: singleObj.id,
                    body: userObject
                  },
                  function(err, result4) {
                    if (err) {

                    } else {
                      records.users += 1;
                      logger.log(records);
                    }
                    callback(null);
                  });
              });

            } else {
              callback(null);
            }
          } else {
            callback(null);
          }
        });

      } else if (type === 'charity') {
        var sqlQuery2 = "select c.id,o.title as name,o.background_pic_url,code.suggested_donation as suggested_donation,cbt.code_text as code,cbt.id as code_id, o.full_description as description, c.city, c.address_1, c.address_2, st.name as state, o.profile_pic_url from charity_tbl c inner join organization_tbl o on o.id = c.organization_id left outer join states_tbl st on st.id = c.state left outer join code_tbl cbt on cbt.charity_id=? left outer join code_tbl code on code.charity_id=?  where c.id = ?";

        pool.query(sqlQuery2, [singleObj.entity_id, singleObj.entity_id, singleObj.entity_id], function(err, userResult2) {
          if (userResult2) {
            var object2 = userResult2[0];
            if (object2) {
              var charityObject = {};

              charityObject.entityid = singleObj.id;
              charityObject.id = userResult2[0].id;
              charityObject.state = userResult2[0].state;
              charityObject.city = userResult2[0].city;
              charityObject.profilepic = userResult2[0].profile_pic_url;
              charityObject.username = singleObj.slug;
              charityObject.fullname = userResult2[0].name;
              charityObject.type = 'charity';
              charityObject.description = userResult2[0].description;
              charityObject.location = "";
              charityObject.background_pic_url = userResult2[0].background_pic_url;
              charityObject.code = userResult2[0].code;
              charityObject.code_id = userResult2[0].code_id;
              charityObject.suggested_donation = userResult2[0].suggested_donation;

              pool.query('select cc.* from charity_category_tbl  cc inner join category_charity_tbl cct on cct.category_id = cc.id where cct.charity_id =? group by cc.group_code', [singleObj.entity_id], function(err, charityCategory) {

                if (charityCategory && charityCategory.length > 0) {
                  var categories = underscore.uniq(underscore.pluck(charityCategory, 'group_title'));
                  charityObject.categories = categories;
                } else {
                  charityObject.categories = [];
                }

                client.create({
                    index: props.elastic_index,
                    type: 'entity',
                    id: singleObj.id,
                    body: charityObject
                  },
                  function(err, result2) {
                    if (err) {

                    } else {
                      records.charities += 1;
                      logger.log(records);
                    }
                    callback(null);
                  });

              });

              // callback(null);
            } else {
              callback(null);
            }
          } else {
            console.log(err);
            callback(null);
          }
        });


      } else if (type === 'code') {

        var sqlQuery3 = "select ot.title as charity_name,c.id,c.code_text as wecode,c.status,c.title as name,cht.id as charity_id, c.description, c.city, c.address_1, c.address_2, st.name as state, c.code_picture_url,c.suggested_donation,c.goal from code_tbl c left outer join states_tbl st on st.id = c.state left outer join charity_tbl cht on cht.id=c.charity_id inner join organization_tbl ot on ot.id= cht.organization_id  where c.id = ?";

        pool.query(sqlQuery3, [singleObj.entity_id], function(err, userResult3) {
          //      console.log(err);
          //console.log(userResult3.length);
          if (userResult3) {
            var object3 = userResult3[0];
            if (object3) {
              var codeObject = {};

              codeObject.entityid = singleObj.id;
              codeObject.id = userResult3[0].id;
              codeObject.state = userResult3[0].state;
              codeObject.city = userResult3[0].city;
              codeObject.profilepic = userResult3[0].code_picture_url;
              codeObject.username = singleObj.slug;
              codeObject.fullname = userResult3[0].name;
              codeObject.type = 'code';
              codeObject.description = userResult3[0].description;
              codeObject.location = "";
              codeObject.categories = [];
              codeObject.charity_name = userResult3[0].charity_name;
              codeObject.charity_id = userResult3[0].charity_id;
              codeObject.wecode = userResult3[0].wecode;
              codeObject.suggested_donation = userResult3[0].suggested_donation;
              codeObject.goal = userResult3[0].goal;
              codeObject.status = userResult3[0].status;
              console.log(codeObject);
              client.create({
                  index: props.elastic_index,
                  type: 'entity',
                  id: singleObj.id,
                  body: codeObject
                },
                function(err, result3) {
                  if (err) {

                  } else {
                    records.champiagns += 1;
                    logger.log(records);
                  }
                  callback(null);
                });

            } else {
              callback(null);
            }
          } else {
            console.log(err);
            callback(null);
          }
        });

      } else {
        console.log('May be changexx');
        callback(null);
      }
    }, function(err) {
      if (!err) {
        records.null += 1;
        logger.log(records);
      }
    });
  });

});

/************ hash tags ****************/
scriptsRouter.get('/hashcode/create', function(req, res, next) {
  var deferred = q.defer();
  var sql_query = 'select id as entity_id, link_type as type,text as name from status_update_link_tbl WHERE link_type=? group by text';

  pool.query(sql_query, ['hashcode'], function(err, result) {
    if (!err) {
      var hashcode_object = {};
      var success = 0;
      for (var i = 0; i < result.length; i++) {

        hashcode_object.id = result[i].entity_id;
        hashcode_object.entity_id = result[i].entity_id;
        hashcode_object.link_type = result[i].type;
        hashcode_object.text = result[i].name;
        client.create({
          index: props.elastic_index,
          type: 'entity',
          id: result[i].id,
          body: hashcode_object
        }, function(err, ela_result) {
          if (err) {
            console.log(err);
          } else {
            console.log(JSON.stringify(ela_result))
            success += 1;
            records.hashcodes += 1;

            logger.log(records);
            if (success === result.length) {
              deferred.resolve(true);
            }
          }
        });
      }
    } else {
      deferred.reject(err);
    }
  });
  return deferred.promise;
});


scriptsRouter.get('/remove/index', function(req, res, next) {
  var deferred = require('q');
  client.indices.delete({
      index: props.index || props.elastic_index
    }).then(function(result) {
      console.log(result);
      console.info('Deleted previous history');
      deferred.resolve(result);
    })
    .error(function(err) {
      console.log(err);
      deferred.reject(err);
    });
  return deferred.promise;
})

module.exports = scriptsRouter;
