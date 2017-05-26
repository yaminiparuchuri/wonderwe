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
console.log('This is workin finwnwn');
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
    "index": props.elastic_index + '_np',
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
      "charity_for_fundraiser": {
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
var createRecords = function() {

  console.log('Thsi is d cjsdcjsd cjsdchjsdc');
  pool.query('select * from entity_tbl where entity_type=? and slug is not NULL', ['charity'], function(err, result) {
    console.log(err);
    console.log(result);
    console.log(result.length);
    async.eachSeries(result, function(singleObj, callback) {

      var type = singleObj.entity_type;

      if (type === 'charity') {
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
              //    charityObject.payment_gateway = userResult2[0].payment_gateway;
              charityObject.currency_symbol = userResult2[0].currency_symbol;
              charityObject.currency_code = userResult2[0].currency_code;
              charityObject.ein = userResult2[0].ein;

              pool.query("SELECT ww.name FROM ww_charity_category_tbl cw inner join ww_categories_tbl ww on ww.id = cw.category_id where cw.charity_id =? group by cw.category_id", [singleObj.entity_id], function(err, charityCategory) {

                if (charityCategory && charityCategory.length > 0) {
                  var categories = underscore.uniq(underscore.pluck(charityCategory, 'name'));
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
                  console.log(charityObject.id);

                  client.create({
                      index: props.elastic_index + '_np',
                      type: 'charity_for_fundraiser',
                      id: singleObj.id,
                      body: charityObject
                    },
                    function(err, result2) {
                      if (err) {
                        console.log('Charity errorrrr');
                        console.log(err);
                      } else {
                        records.charities += 1;
                        logger.log(records);
                      }
                      callback(null);
                    });
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
      } else {
        console.log('May be changexx');
        callback(null);
      }
    }, function(err) {
      if (!err) {
        records.null += 1;
        logger.log(records);

      }
      console.timeEnd('This is elasticsearch time taken ---->>>>>: ');
    });
  });
};


var removeIndex = function() {
  var deferred = require('q');
  client.indices.delete({
      index: props.elastic_index + '_np'
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
}



console.time('This is elasticsearch time taken ---->>>>>: ');
client.ping({
    requestTimeout: 5000,
    // undocumented params are appended to the query string
    hello: "elasticsearch!"
  })
  //.then(removeIndex)
  .then(createIndex)
  .then(createRecords)
  .error(function(err) {
    console.log('in the error');
    console.log(err);
  });
