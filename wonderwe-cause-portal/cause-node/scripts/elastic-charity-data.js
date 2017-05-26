var elasticsearch = require('elasticsearch');
var props = require('config').props;
var mysql = require('mysql');
var async = require('async');
var q = require('q');
var underscore = require('underscore');


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
  host: "localhost:9200",
  // log: 'trace'
});

var pool = mysql.createPool({
  host: props.host,
  port:props.port,
  user: props.username,
  password: props.password,
  database: props.database,
  connectionLimit: 1500,
  debug: false,
  acquireTimeout: 500000,
  connectTimeout: 50000
});


/*********************** Creating index with settings and mappings ********************/

var createIndexType = function() {
  var deferred = q.defer();
  client.indices.putMapping({
    "index": 'we_dev',
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


  pool.query('select e.* from entity_tbl e inner join charity_tbl c on c.id= e.entity_id and e.entity_type=? where c.charity_from=?', ['charity', 'system'], function(err, result) {
    console.log(result);

    async.eachSeries(result, function(singleObj, callback) {

      var type = singleObj.entity_type;

      if (type === 'charity') {
        var sqlQuery2 = "select c.id,c.payment_gateway,o.title as name,o.background_pic_url,code.suggested_donation as suggested_donation,cbt.code_text as code,cbt.id as code_id, o.full_description as description, c.city, c.address_1, c.address_2, st.name as state, o.profile_pic_url,cct.currency_code,cct.currency_symbol from charity_tbl c inner join organization_tbl o on o.id = c.organization_id left outer join states_tbl st on st.id = c.state left outer join code_tbl cbt on cbt.charity_id=? left outer join code_tbl code on code.charity_id=? left outer join countries_currency cct on cct.country_id = c.country where c.id = ?";

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
                console.log(charityObject);
                client.create({
                    index: 'we_dev',
                    type: 'charity_for_fundraiser',
                    id: singleObj.id,
                    body: charityObject
                  },
                  function(err, result2) {
                    console.log(err);
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

};

client.ping({
    requestTimeout: 1000,
    // undocumented params are appended to the query string
    hello: "elasticsearch!"
  })
  .then(createIndexType)
  .then(createRecords)
  .error(function(err) {
    console.log('in the error');
    console.log(err);
  });
