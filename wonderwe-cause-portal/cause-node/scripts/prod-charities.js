var request = require('request');
//TODO Require modules
var uuid = require('node-uuid');
var moment = require('moment');
var async = require('async');
var count = 0;
var path = "/home/sbees/Desktop/organizations.csv";
var data1 = [];
var csv = require("fast-csv");
var fs = require('fs');

//TODO Mysql connection
// var mysql = require('mysql');
// var pool = mysql.createPool({
//   host: '104.131.114.107',
//   user: 'root',
//   password: 'wonderwe1$',
//   database: "wonderwe_prod1"
// });
//TODO GuideStar Search API

var guideFnalData = [];
var count = 0;
var stream = fs.createReadStream(path);
var guideStarEins = [];
var stream = fs.createReadStream(path).pipe(csv({
  headers: true,
  ignoreEmpty: true
})).on('error', function(err) {
  console.log(err);
}).on("data", function(data) {
  guideStarEins.push(data);
}).on("end", function() {


  console.log(guideStarEins);
  //var sql = 'select * from org_csv_tbl order by REVENUE_AMT desc limit 2500';


  async.eachSeries(guideStarEins, function(singleObj, callback) {

    //TODO  EIN used in request call
    //var ein = "54-1774039";
    var einString = singleObj.EIN.toString();

    if (einString.length < 9) {
      for (i = einString.length; i < 9; i++) {
        einString = '0' + einString;
      }
    }
    var ein = einString.substring(0, 2) + '-' + einString.substring(2, 9);
    console.log(ein);
    //callback(null);
    //TODO Guidestar api call
    //https://bb99565233c34ae3861ccb394a054d47@data.guidestar.org/v1/advancedsearch.json?q=ein:13-4045142
    //'https://11beb512206d4dd28b42bc51696c16ee@sandboxdata.guidestar.org/v1/advancedsearch.json?q=ein:54-1774039'

    request('https://bb99565233c34ae3861ccb394a054d47@data.guidestar.org/v1/advancedsearch.json?q=ein:' + ein, function(err, response, body) {
      if (err) {
        callback(err);
      } else {
        console.log(".........body");
        console.log(response.statusCode);
        if (response.statusCode === 200) {
          var data = JSON.parse(body);
          data = data.hits[0];
          console.log('data...............');
          console.log(data);
          guideFnalData.push(data);
          //TODO I am not able find out these  properties in our DB
          var charityInfo = {};
          charityInfo.ein = singleObj.EIN;
          charityInfo.city = data.city;
          charityInfo.state = data.state;
          charityInfo.postal_code = data.zip;
          charityInfo.foundation_code = data.irs_foundation_code;
          charityInfo.subsection_code = data.irs_subsection;
          charityInfo.organization_id = data.organization_id;
          charityInfo.name_tmp = data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function(txt) {
            return txt.toUpperCase();
          });
          //								charityInfo.short_name = data.organization_name_aka;
          charityInfo.short_name = charityInfo.name_tmp.slice(0, 18);

          //TODO Store in charity_nteecode table
          //charityInfo.ntee_code = data.nteecode;

          var orgInfo = {};
          orgInfo.title = charityInfo.name_tmp; //data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
          orgInfo.id = data.organization_id;
          orgInfo.profile_pic_url = data.logo_url;
          orgInfo.web_url = data.website;
          orgInfo.short_name = charityInfo.name_tmp.slice(0, 18);
          orgInfo.full_description = data.mission;

          var codeObject = {};
          codeObject.date_created = moment.utc().toDate();
          codeObject.start_date = moment.utc().toDate();
          codeObject.end_date = "2099-12-31 23:59:59";
          var arr = data.organization_name.split(" ");
          var obj = {};
          var string = arr[0];
          for (var i = 1; i < arr.length; i++) {
            string = string + arr[i].charAt('0');
          }
          codeObject.code_text = string;
          codeObject.suggested_donation = 10;
          codeObject.title = charityInfo.name_tmp; //data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
          codeObject.description = data.mission;
          codeObject.state = data.state;
          codeObject.city = data.city;
          codeObject.goal = 10000;
          codeObject.campaign_zip = data.zip;
          codeObject.code_picture_url = data.logo_url;
          codeObject.type = "ongoing";
          codeObject.short_name = charityInfo.name_tmp.slice(0, 18);
          codeObject.charity_default = "yes";

          async.parallel({
            charity: function(userCallback) {
              pool.getConnection(function(err, connection) {
                connection.query('INSERT INTO charity_tbl SET ?', charityInfo, function(err, data1) {
                  if (err) {
                    userCallback(err, null);
                  } else {
                    userCallback(null, data1);
                  }

                  connection.release();
                });

              });
            },
            organization: function(orgCallback) {
              pool.getConnection(function(err, connection) {
                connection.query('INSERT INTO organization_tbl SET ?', orgInfo, function(err, data2) {
                  if (err) {
                    orgCallback(err, null);
                  } else {
                    orgCallback(null, data2);
                  }

                  connection.release();
                });

              });
            }
          }, function(err, parallelResult) {
            if (err) {
              callback(err);
            } else {

              //console.log(parallelResult);
              if (parallelResult.charity) {
                pool.getConnection(function(err, connection) {
                  codeObject.charity_id = parallelResult.charity.insertId;
                  connection.query('INSERT INTO code_tbl SET ?', codeObject, function(err, codeId) {
                    if (err) {
                      callback(err);
                    } else {
                      async.parallel({
                        codeEntity: function(callback) {
                          pool.getConnection(function(err, connection) {
                            connection.query('INSERT INTO entity_tbl(entity_id,entity_type) values (?,?)', [codeId.insertId, "code"], function(err, rows) {
                              if (err) {
                                callback(err);
                              } else {
                                callback(null);
                              }
                              connection.release();
                            });
                          });
                        },
                        charityEntity: function(callback) {
                          pool.getConnection(function(err, connection) {
                            connection.query('INSERT INTO entity_tbl(entity_id,entity_type) values (?,?)', [parallelResult.charity.insertId, "charity"], function(err, rows) {
                              if (err) {
                                callback(err);
                              } else {
                                callback(null);
                              }
                              connection.release();
                            });

                          });
                        },
                        charityNteeCode: function(callback) {
                          pool.getConnection(function(err, connection) {
                            connection.query('INSERT INTO charity_nteecode(charity_id,nteecode) values (?,?)', [parallelResult.charity.insertId, data.nteecode], function(err, rows) {
                              if (err) {
                                callback(err);
                              } else {
                                callback(null);
                              }
                              connection.release();
                            });

                          });
                        },
                        guideStarData: function(callback) {
                          pool.getConnection(function(err, connection) {
                            connection.query('INSERT INTO guide_star(ein,response_json) values (?,?)', [singleObj.EIN, JSON.stringify(data)], function(err, rows) {
                              if (err) {
                                callback(err);
                              } else {
                                callback(null);
                              }
                              connection.release();
                            });

                          });
                        }
                      }, function(err) {
                        if (err) {
                          callback(err);
                        } else {
                          callback(null);
                        }

                      });

                    }
                    connection.release();
                  });

                });

              }
            }

          });
        } else {
          callback(null);
        }
      }
    });

  }, function(err) {
    if (err) {
      console.log(err);
    } else {


      // Need to backup the data into file

      var fs = require('fs');
      fs.writeFile("charities-jun-01-201s.json", JSON.stringify(guideFnalData) + "\n\n", function(err) {
        if (err) {
          console.log(err);
        } else {
         
        }
      });

      console.log('updated successfully...');
    }

  });


});
