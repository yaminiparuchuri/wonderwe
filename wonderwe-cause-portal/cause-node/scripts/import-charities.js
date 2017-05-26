var csv = require("fast-csv");
var fs = require('fs');
var async = require('async');
var mysql = require('mysql');
var moment = require('moment');
var uslug = require('uslug');
var q = require('q');
var charityService = require('../services/charity');
var props = require('config').props;

var elasticsearch = require('elasticsearch');

pool = mysql.createPool({

  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database,
  acquireTimeout: 100000
});
console.time('Time taken......');
var recurringShift = 0;
//recurringMethod();

var client = new elasticsearch.Client({
  host: props.elasticServer,
  // log: 'trace'
});

//index: 'we_prod_np',
//type: 'charity_for_fundraiser',

var createIndexType = function() {
  var deferred = q.defer();
  client.indices.putMapping({
    "index": props.elastic_index+'_np',
    "type": "charity_for_fundraiser",
    update_all_types: "all",
    "body": {
      "charity_for_fundraiser": {

        "properties": {
          "username": {
            "type": "string",
            "index": "analyzed",
            "search_analyzer": "standard",
            "analyzer": "default"
          },
          "fullname": {
            "type": "string",
            "index": "analyzed",
            "search_analyzer": "standard",
            "analyzer": "default"
          },
          "state": {
            "type": "string",
            "index": "analyzed",
            "search_analyzer": "standard",
            "analyzer": "default"
          },
          "city": {
            "type": "string",
            "index": "analyzed",
            "search_analyzer": "standard",
            "analyzer": "default"
          },
          "profilepic": {
            "type": "string",
            "index": "analyzed",
            "search_analyzer": "standard",
            "analyzer": "default"
          },
          "description": {
            "type": "string",
            "index": "analyzed",
            "search_analyzer": "standard",
            "analyzer": "default"
          },
          "categories": {
            "type": "string",
            "index": "analyzed",
            "search_analyzer": "standard",
            "analyzer": "default"
          },
          "status":{
            "type":"string",
            "index":"analyzed",
            "search_analyzer":"standard",
            "analyzer":"default"
          },
          "text": {
            "type": "string",
            "index": "analyzed",
            "search_analyzer": "standard",
            "analyzer": "default"
          },
          "wecode": {
            "type": "string",
            "index": "analyzed",
            "search_analyzer": "standard",
            "analyzer": "default"
          },
          "ein":{
            "type": "string",
            "index": "analyzed",
            "search_analyzer": "standard",
            "analyzer": "default"
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
  return deferred.promise;
};


var me = this;
var count = 0;

function recurringMethod() {

  pool.query('select * from ww_fundraiser_charities_temp_tbl where status=? limit 1 offset 0', ['np'], function(err, array) {

    if (array.length === 0) {
      process.exit(0);
    }

    async.eachSeries(array, function(charityData, eachCallback) {

      if (count === 1) {
        console.timeEnd('Time taken......');
        process.exit(0);
      }

      me.countryCodes(charityData, function(err, countryResult) {

        charityData.country = countryResult.country;
        charityData.state = countryResult.state;
        console.log(charityData);
        var charityInfo = {};
        charityInfo.ein = charityData.ein;
        charityInfo.city = charityData.city;
        charityInfo.state = charityData.state;
        charityInfo.country = charityData.country;
        charityInfo.postal_code = charityData.zip;
        charityInfo.name_tmp = charityData.charity_name;
        charityInfo.short_name = charityInfo.name_tmp.slice(0, 18);
        charityInfo.charity_from = 'system';

        var orgInfo = {};
        orgInfo.title = charityInfo.name_tmp; //data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
        orgInfo.web_url = charityData.web_url;
        orgInfo.short_name = charityInfo.name_tmp.slice(0, 18);
        orgInfo.timezone_id = charityData.timezone;
        orgInfo.date_created = moment().toDate();

        var codeObject = {};
        codeObject.date_created = moment().toDate();
        codeObject.start_date = moment().toDate();
        codeObject.end_date = "2099-12-31 23:59:59";
        var arr = charityData.charity_name.split(" ");
        var obj = {};
        var string = arr[0];
        for (var i = 1; i < arr.length; i++) {
          string = string + arr[i].charAt('0');
        }
        codeObject.code_text = string;
        codeObject.suggested_donation = 10;
        codeObject.title = charityInfo.name_tmp; //data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
        //codeObject.description = data.mission;
        //TODO need to check the unique ness of a code_text field.
        codeObject.code_slug = uslug(codeObject.code_text);
        codeObject.state = charityData.state;
        codeObject.country = charityData.country;
        codeObject.city = charityData.city;
        codeObject.goal = 10000;
        codeObject.campaign_zip = charityData.zip;
        codeObject.type = "ongoing";
        codeObject.short_name = charityInfo.name_tmp.slice(0, 18);
        codeObject.charity_default = "yes";
        codeObject.status = 'inactive';

        pool.query('insert into organization_tbl set ?', orgInfo, function(err, orgResult) {
          //console.log(err);
          if (err) {
            eachCallback(err);
          } else {

            var orgid = orgResult.insertId;
            charityInfo.organization_id = orgid;
            pool.query('insert into charity_tbl set ?', charityInfo, function(err, charityResult) {
              //console.log(err);
              if (err) {
                eachCallback(err);
              } else {

                var charityId = charityResult.insertId;
                codeObject.charity_id = charityId;

                pool.query('insert into code_tbl set ?', codeObject, function(err, codeResult) {
                  //console.log(err);
                  if (err) {
                    eachCallback(err);
                  } else {
                    var codeId = codeResult.insertId;

                    async.parallel({
                      charitySlug: function(charityCallback) {
                        var charityEntity = {};
                        charityEntity.entity_id = charityId;
                        charityEntity.entity_type = "charity";
                        var usrSlug = uslug(orgInfo.title);
                        var originlSlug = uslug(orgInfo.title);
                        var userDetailsObject = {
                          count: 1,
                          name: orgInfo.title
                        };

                        me.entitySlugCreation(charityEntity, usrSlug, userDetailsObject, originlSlug, function(err, rows) {
                          if (err) {
                            charityCallback(err, null);
                          } else {
                            charityEntity.id = rows.entity_id;
                            charityEntity.mainentity_id = rows.entity_id;
                            charityInfo.entity_id = rows.entity_id;
                            charityInfo.slug = rows.slug;
                            charityCallback(null, charityId);
                            // me.createRecords(charityEntity, charity_id, function(err, elasticResult) {
                            //
                            // });
                            //    agenda.now('create campaign/donor/charity in elasticsearch', charityEntity);
                          }
                        });
                      },
                      codeSlug: function(codeCallback) {
                        var codeEntity = {};
                        codeEntity.entity_id = codeId;
                        codeEntity.entity_type = "code";
                        var usrSlug = uslug(codeObject.code_text);
                        var originlSlug = uslug(codeObject.code_text);

                        var userDetailsObject2 = {
                          count: 1,
                          name: codeObject.code_text
                        };

                        me.entitySlugCreation(codeEntity, usrSlug, userDetailsObject2, originlSlug, function(err, rows2) {
                          if (err) {
                            codeCallback(err, null);
                          } else {
                            codeCallback(null, codeId);
                            codeEntity.id = rows2.entity_id;
                            //  agenda.now('create campaign/donor/charity in elasticsearch', codeEntity);
                          }
                        });
                      }
                    }, function(err, slugResult) {
                      console.log('Completed count..: ', count);
                      count = count + 1;

                      var charityDataEntity = {};
                      charityDataEntity.entity_id = charityId;
                      charityDataEntity.entity_type = "charity";
                      charityDataEntity.id = charityInfo.entity_id;
                      charityDataEntity.slug = charityInfo.slug;

                      pool.query('update ww_fundraiser_charities_temp_tbl set status=? where id=?', ['done', charityData.id], function(err, updatesRestsss) {

                      });

                      me.createRecords(charityDataEntity, charityDataEntity.entity_id, function(err, elasticResult) {
                        eachCallback(null);
                      });
                    });
                  }
                });
              }
            });
          }
        });
      });
    }, function(err) {
      console.log('Recurring shift done well....' + recurringShift);
      recurringShift = recurringShift + 1;
      console.timeEnd('Time taken......');
      recurringMethod();
    });
  });
}

exports.countryCodes = function(obj, callback) {
  var stateQuery = "select ss.* from state_tbl st inner join states_tbl ss on ss.name = st.name where st.abbreviation =?";
  pool.query(stateQuery, [obj.state], function(err, stateResult4) {
    var resObj = {};
    resObj.country = 223;
    if (stateResult4 && stateResult4.length > 0) {
      resObj.state = stateResult4[0].id;
    } else {
      resObj.state = 3454;
    }
    callback(null, resObj);
  });
};



exports.entitySlugCreation = function(entityObject, usrSlug, userDetailsObject, originlSlug, callback) {
  var me = this;
  usrSlug = usrSlug.split('-').join('');
  originlSlug = originlSlug.split('-').join('');
  pool.query("select * from slug_manager_tbl where previous_slug =? OR updated_slug=?", [usrSlug, usrSlug], function(err, entitySlugResult) {

    if (entitySlugResult && entitySlugResult.length > 0) {

      pool.query("select * from user_tbl where name =?", [userDetailsObject.name], function(err, userResult) {
        if (userResult && userResult.length > 0) {
          //userDetailsObject.count = userResult.length + userDetailsObject.count;
          usrSlug = originlSlug + (userResult.length + userDetailsObject.count);
          userDetailsObject.count = userDetailsObject.count + 1;
          me.entitySlugCreation(entityObject, usrSlug, userDetailsObject, originlSlug, callback);

        } else {
          usrSlug = originlSlug + userDetailsObject.count;
          userDetailsObject.count = userDetailsObject.count + 1;
          me.entitySlugCreation(entityObject, usrSlug, userDetailsObject, originlSlug, callback);
        }
      });

    } else {
      entityObject.slug = usrSlug;
      pool.query('INSERT INTO entity_tbl SET ?', [entityObject], function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          // pool.query("update entity_tbl set slug =? where id=?", [usrSlug, singleObject.id], callback);
          var userObj = {};
          userObj.originalslug = usrSlug;
          userObj.slug = usrSlug;
          userObj.entity_id = result.insertId;
          me.storeUserNames(userObj, callback);
        }
      });
    }
  });
};

exports.storeUserNames = function(userObj, callback) {
  var obj = {};

  obj.previous_slug = userObj.originalslug;
  obj.updated_slug = userObj.slug;
  obj.created_date = moment.utc().toDate();
  obj.entity_id = userObj.entity_id;
  pool.query('select * from slug_manager_tbl where entity_id=?', [obj.entity_id], function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      if (data && data.length > 0) {

        pool.query('insert into slug_manager_tbl set ?', obj, function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, obj);
          }
        });
      } else {
        pool.query('insert into slug_manager_tbl set ?', obj, function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, obj);
          }
        });
      }
    }
  })
};


exports.createRecords = function(singleObj, charity_id, callback) {

  var type = 'charity';

  var sqlQuery2 = "select eee.id as entity_id,eee.slug, c.id,c.payment_gateway,o.title as name,o.background_pic_url,code.suggested_donation as suggested_donation,cbt.code_text as code,cbt.id as code_id, o.full_description as description, c.city, c.address_1, c.address_2,c.ein, st.name as state, o.profile_pic_url,cct.currency_code,cct.currency_symbol from charity_tbl c inner join organization_tbl o on o.id = c.organization_id left outer join states_tbl st on st.id = c.state left outer join code_tbl cbt on cbt.charity_id=? left outer join code_tbl code on code.charity_id=? left outer join countries_currency cct on cct.country_id = c.country left outer join entity_tbl eee on eee.entity_id=c.id and eee.entity_type='charity' where c.id = ?";

  pool.query(sqlQuery2, [charity_id, charity_id, charity_id], function(err, userResult2) {

    if (userResult2 && userResult2.length > 0) {
      var object2 = userResult2[0];
      if (object2) {
        var charityObject = {};

        charityObject.entityid = userResult2[0].entity_id;
        charityObject.id = userResult2[0].id;
        charityObject.state = userResult2[0].state;
        charityObject.city = userResult2[0].city;
        charityObject.profilepic = userResult2[0].profile_pic_url;
        charityObject.username = userResult2[0].slug;
        charityObject.fullname = userResult2[0].name;
        charityObject.type = 'charity';
        charityObject.description = userResult2[0].description;
        charityObject.location = "";
        charityObject.background_pic_url = userResult2[0].background_pic_url;
        charityObject.code = userResult2[0].code;
        charityObject.code_id = userResult2[0].code_id;
        charityObject.suggested_donation = userResult2[0].suggested_donation;
        charityObject.payment_gateway = userResult2[0].payment_gateway;
        charityObject.currency_symbol = userResult2[0].currency_symbol;
        charityObject.currency_code = userResult2[0].currency_code;
        //Added EIN
        charityObject.ein = userResult2[0].ein;

        pool.query('select cc.* from charity_category_tbl  cc inner join category_charity_tbl cct on cct.category_id = cc.id where cct.charity_id =? group by cc.group_code', [charity_id], function(err, charityCategory) {

          if (charityCategory && charityCategory.length > 0) {
            var categories = underscore.uniq(underscore.pluck(charityCategory, 'group_title'));
            charityObject.categories = categories;
          } else {
            charityObject.categories = [];
          }
          console.log(charityObject);
          client.create({
              index: props.elastic_index+'_np',
              type: 'charity_for_fundraiser',
              id: userResult2[0].entity_id,
              body: charityObject
            },
            function(err, result2) {
              console.log(err);
              if (err) {
                callback(err, null);
              } else {
                callback(null, null);
              }
            });
        });
        // callback(null);
      } else {
        callback(null, null);
      }
    } else {
      console.log(err);
      callback(null, null);
    }
  });
};

client.ping({
    requestTimeout: 1000,
    // undocumented params are appended to the query string
    hello: "elasticsearch!"
  })
//  .then(createIndexType)
  .then(recurringMethod)
  .error(function(err) {
    console.log('in the error');
    console.log(err);
  });
