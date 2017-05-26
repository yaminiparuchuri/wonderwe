var elasticsearch = require('elasticsearch');
var props = require('config').props;
var mysql = require('mysql');
var async = require('async');
var q = require('q');
var underscore = require('underscore');
var geocoder = require('geocoder');

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


var client = new elasticsearch.Client({
  host: props.elasticServer,
  // log: 'trace'
});

var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database,
  connectionLimit: 1500,
  debug: props.dbdebug,
  acquireTimeout: 500000,
  connectTimeout: props.connectTimeout
});


/*********************** Creating index with settings and mappings ********************/

var createIndex = function() {
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
          },
          "loc": {
            "type": "geo_point",
            "store": true

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

/***************** Inserting the records *********************/
var updateRecords = function() {

        var sqlQuery2 = "select c.id,c.postal_code,c.ein,c.payment_gateway,o.title as name,o.background_pic_url,code.suggested_donation as suggested_donation,cbt.code_text as code,cbt.id as code_id, o.full_description as description, c.city, c.address_1, c.address_2, st.name as state, o.profile_pic_url,cct.currency_code,cct.currency_symbol from charity_tbl c inner join organization_tbl o on o.id = c.organization_id left outer join states_tbl st on st.id = c.state left outer join code_tbl cbt on cbt.charity_id=? left outer join code_tbl code on code.charity_id=? left outer join countries_currency cct on cct.country_id = c.country where c.id = ? and c.charity_from='approved'";

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
              charityObject.payment_gateway = userResult2[0].payment_gateway;
              charityObject.currency_symbol = userResult2[0].currency_symbol;
              charityObject.currency_code = userResult2[0].currency_code;

              pool.query('select cc.* from charity_category_tbl  cc inner join category_charity_tbl cct on cct.category_id = cc.id where cct.charity_id =? group by cc.group_code', [singleObj.entity_id], function(err, charityCategory) {

                if (charityCategory && charityCategory.length > 0) {
                  var categories = underscore.uniq(underscore.pluck(charityCategory, 'group_title'));
                  charityObject.categories = categories;
                } else {
                  charityObject.categories = [];
                }


                geocoder.geocode(object2.postal_code, function(err, data) {
                  if (data && data.results.length > 0) {
                    charityObject.loc = [];
                    charityObject.loc.push(data.results[0].geometry.location.lat);
                    charityObject.loc.push(data.results[0].geometry.location.lng);
                  }
                  charityObject.ein = object2.ein;
                  console.log(charityObject);


// if you want to insert charity approved data in elastic for specific charity

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


                    // if you want to update charity approved data in elastic for specific charity, please enable

                                    /*  client.update({
                                          index: props.elastic_index,
                                          type: 'entity',
                                          id: singleObj.id,
                                          body: {doc:charityObject}
                                        },
                                        function(err, result2) {
                                          if (err) {

                                          } else {
                                            records.charities += 1;
                                            logger.log(records);
                                          }
                                          callback(null);
                                        });*/
                });
              });
            } else {
              callback(null);
            }
          } else {
            console.log(err);
            callback(null);
          }
        });



};

client.ping({
    requestTimeout: 1000,
    // undocumented params are appended to the query string
    hello: "elasticsearch!"
  })
  //.then(removeIndex)
  //.then(createIndex)
  //.then(hashTags)
  .then(updateRecords)
  .error(function(err) {
    console.log('in the error');
    console.log(err);
  });
