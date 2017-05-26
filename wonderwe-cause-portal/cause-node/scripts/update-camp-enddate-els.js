var elasticsearch = require('elasticsearch');
var props = require('config').props;
var mysql = require('mysql');
var async = require('async');
var q = require('q');
var underscore = require('underscore');
var geocoder = require('geocoder');

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


client.ping({
  requestTimeout: 1000,
  // undocumented params are appended to the query string
  hello: "elasticsearch!"
}, function(err) {
  console.log(err);
});


pool.query('select * from entity_tbl where slug is not NULL and entity_type=?', ['code'], function(err, result) {
  //console.log(result);
  console.log(result.length);
  async.eachSeries(result, function(singleObj, callback) {

      var type = singleObj.entity_type;

      if (type === 'user') {
        // console.log('user');
        callback(null);

      } else if (type === 'charity') {
        callback(null);

      } else if (type === 'code') {

console.log('Code block is working well....');
        var sqlQuery3 = "select ot.title as charity_name,c.id,c.code_text as wecode,c.end_date,c.status,c.title as name,cht.id as charity_id,cht.payment_gateway, c.description, c.city, c.address_1, c.address_2, st.name as state, c.code_picture_url,c.suggested_donation,c.goal,cct.currency_symbol,cct.currency_code from code_tbl c left outer join states_tbl st on st.id = c.state left outer join charity_tbl cht on cht.id=c.charity_id inner join organization_tbl ot on ot.id= cht.organization_id left outer join countries_currency cct on cct.country_id = cht.country where c.id = ?";
        pool.query(sqlQuery3, [singleObj.entity_id], function(err, userResult3) {

          if (err) {
            console.log('No cancjssc hbdcs0qddeihwehwediwehdi');
            callback(null);
          } else {
            if (userResult3 && userResult3.length > 0) {
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
                codeObject.currency_symbol = userResult3[0].currency_symbol;
                codeObject.currency_code = userResult3[0].currency_code;
                codeObject.payment_gateway = userResult3[0].payment_gateway;
                codeObject.end_date = userResult3[0].end_date;

                client.update({
                    index: props.elastic_index,
                    type: 'entity',
                    id: singleObj.id,
                    body: {
                      doc: codeObject
                    }
                  },
                  function(err, result3) {
                    if (err) {
                      console.log('Code slugggg');
                      console.log(err);
                      callback(null);
                    } else {
                      callback(null);
                    }
                  });
              } else {
                callback(null);
              }
            } else {
              pool.query('select * from code_tbl where id=?', [singleObj.entity_id], function(err, codeData) {
                if (err) {
                  console.log('Fundnnnnnd d ndndndn');
                  callback(null);
                } else {
                  if (codeData && codeData.length > 0) {
                    var codeObject = {};
                    codeObject.entityid = singleObj.id;
                    codeObject.id = singleObj.entity_id;
                    //codeObject.state = userResult3[0].state;
                    //codeObject.city = userResult3[0].city;
                    codeObject.profilepic = codeData[0].code_picture_url;
                    codeObject.username = singleObj.slug;
                    codeObject.fullname = codeData[0].title;
                    codeObject.type = 'code';
                    codeObject.description = codeData[0].description;
                    codeObject.location = "";
                    codeObject.categories = [];
                    //codeObject.charity_name = userResult3[0].charity_name;
                    //codeObject.charity_id = userResult3[0].charity_id;
                    codeObject.wecode = codeData[0].code_text;
                    codeObject.suggested_donation = codeData[0].suggested_donation;
                    codeObject.goal = codeData[0].goal;
                    codeObject.status = codeData[0].status;
                    codeObject.fundraiser = "fundraiser";
                    codeObject.fundraiser_userid = codeData[0].user_id;
                    codeObject.end_date = codeData[0].end_date;
                    var sqlQuery4 = "SELECT cc.*,upt.* from user_profile_tbl up inner join countries_currency cc on cc.country_id=up.country inner join user_tbl u on u.id=up.user_id left outer join user_payment_tbl upt on upt.user_id=up.user_id where up.user_id=?";
                    pool.query(sqlQuery4, [codeData[0].user_id], function(err, userResult4) {
                      if (err) {
                        console.log('Fund gateway erroooo');
  callback(null);
                      } else {
                        if (userResult4 && userResult4.length > 0) {
                          if (userResult4[0].payment_gateway) {
                            codeObject.payment_gateway = userResult4[0].payment_gateway;
                          }
                          codeObject.currency_symbol = userResult4[0].currency_symbol;
                          codeObject.currency_code = userResult4[0].currency_code;
                        }

                        client.update({
                            index: props.elastic_index,
                            type: 'entity',
                            id: singleObj.id,
                            body: {
                              doc: codeObject
                            }
                          },
                          function(err, result3) {
                            if (err) {
                              console.log('FUnd missing user case');
                              console.log(err);
                              callback(null);
                            } else {

                              callback(null);
                            }

                          });

                      }
                    });
                  } else {
                      console.log('No such type of campaign');
                    callback(null);
                  }

                }

              })
            }
          }
        });
      } else {
        console.log('No type');
        callback(null);
      }
    },
    function(err) {

      console.log('This is elasticsearch time taken ---->>>>>: ');
    });
});
