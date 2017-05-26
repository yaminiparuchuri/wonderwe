var request = require('request');
//TODO Require modules
var uuid = require('node-uuid');
var moment = require('moment');
var async = require('async');
var count = 0;
var path = "/home/scriptbees/Downloads/EO1_501c3Only.csv";
var data1 = [];
var csv = require("fast-csv");
var fs = require('fs');

//TODO Mysql connection
var mysql = require('mysql');
var pool = mysql.createPool({
  host: '104.236.69.222',
  user: 'root',
  password: 'scriptbees1$',
  database: "wonderwe_development"
});
//TODO GuideStar Search API

/*
organization_id
organization_name
ein
mission
city
state
zip
nteecode
participation
public_report
irs_subsection
msa
logo_url*/

//TODO GuideStar Detail API

/*
GuideStar Organization ID
EIN
Organization Name
Address Line 1
Address Line 2
City
State
Zip + 4
Affiliation Code and Description
AKA Name
Total Assets
Contact Fax
Contact Phone
Deductibility Code and Description
Total Expenses
Foundation Code and Description
Group Exemption
Total Income
IRS Subsection Code and Description
National Headquarters Indicator
Total Liabilities
Mission Statement
Geographic Areas Served (list)
Telephone
Link to organization's public report on GuideStar's website
Ruling Year
Tax Year
Website url
Year Founded
NTEE Codes (list)
Total Revenue
CEO and Co-Ceo
Programs (list)*/

//TODO Create Table of org_csv_tbl
/*
async.series({
org_csv_tbl : function(callback) {
pool.getConnection(function(err, connection) {
var sql = "CREATE TABLE org_csv_tbl (EIN INT(50), NAME_GD VARCHAR(150), ICO VARCHAR(50), STREET VARCHAR(50), CITY VARCHAR(50), STATE VARCHAR(50), ZIP VARCHAR(50), GROUP_GD VARCHAR(50), SUBSECTION VARCHAR(50),AFFILIATION VARCHAR(50), CLASSIFICATION VARCHAR(50), RULING VARCHAR(50), DEDUCTIBILITY VARCHAR(50), FOUNDATION VARCHAR(50), ACTIVITY VARCHAR(50), ORGANIZATION VARCHAR(50), STATUS_GD VARCHAR(50), TAX_PERIOD VARCHAR(50), ASSET_CD VARCHAR(50), INCOME_CD VARCHAR(50), FILING_REQ_CD VARCHAR(50), PF_FILING_REQ_CD VARCHAR(50), ACCT_PD VARCHAR(50), ASSET_AMT VARCHAR(50), INCOME_AMT VARCHAR(50), REVENUE_AMT VARCHAR(50), NTEE_CD VARCHAR(50), SORT_NAME VARCHAR(50))";
connection.query(sql, function(err) {
if (err) {
console.log(err);
callback(err);
} else {
callback(null);
}
connection.release();
});
});
},

charity_nteecode : function(callback) {
pool.getConnection(function(err, connection) {
var sql = "CREATE TABLE charity_nteecode (charity_id INT(100), nteecode VARCHAR(150))";
connection.query(sql, function(err) {
if (err) {
console.log(err);
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
console.log(err);
} else {
console.log("success");
}

});*/

//TODO Retrive CSV data from Excel
/*

var count = 0;
var stream = fs.createReadStream(path);
var array1 = [];
var stream = fs.createReadStream(path).pipe(csv({
headers : true,
ignoreEmpty : true
})).on('error', function(err) {
console.log(err);
}).on("data", function(data) {
if (data && data.EIN) {
data1.push(data);
}
}).on("end", function() {
async.each(data1, function(obj, callback) {
var array = [];
if (obj.EIN) {
array.push(parseInt(obj.EIN));
}
array.push(obj.NAME);
array.push(obj.ICO);
array.push(obj.STREET);
array.push(obj.CITY);
array.push(obj.STATE);
array.push(obj.ZIP);
array.push(obj.GROUP);
array.push(obj.SUBSECTION);
if (obj.AFFILIATION) {
array.push(obj.AFFILIATION);
}
array.push(obj.CLASSIFICATION);
array.push(obj.RULING);
array.push(obj.DEDUCTIBILITY);
array.push(obj.FOUNDATION);
array.push(obj.ACTIVITY);
array.push(obj.ORGANIZATION);
array.push(obj.STATUS);
array.push(obj.TAX_PERIOD);
array.push(obj.ASSET_CD);
array.push(obj.INCOME_CD);
array.push(obj.FILING_REQ_CD);
array.push(obj.PF_FILING_REQ_CD);
array.push(obj.ACCT_PD);
array.push(obj.ASSET_AMT);
array.push(obj.INCOME_AMT);
array.push(obj.REVENUE_AMT);
array.push(obj.NTEE_CD);
array.push(obj.SORT_NAME);
array1.push(array);
callback(null);
}, function(err) {
var array = [];
console.log(array1.length);
for (var i in array1) {
array.push(array1[i]);
count++;
if (count === 10000) {
console.log("10000");
storeData(array);
array = [];
} else if (count === 20000) {
console.log("20000");
storeData(array);
array = [];
} else if (count === 30000) {
console.log("30000");
storeData(array);
array = [];
} else if (count === 40000) {
console.log("40000");
storeData(array);
array = [];
} else if (count === 50000) {
console.log("50000");
storeData(array);
array = [];
} else if (count === 60000) {
console.log("60000");
storeData(array);
array = [];
} else if (count === 70000) {
console.log("70000");
storeData(array);
array = [];
} else if (count === 80000) {
console.log("80000");
storeData(array);
array = [];
} else if (count === 90000) {
console.log("90000");
storeData(array);
array = [];
} else if (count === 100000) {
console.log("100000");
storeData(array);
array = [];
} else if (count === 110000) {
console.log("110000");
storeData(array);
array = [];
} else if (count === 120000) {
console.log("120000");
storeData(array);
array = [];
} else if (count === 130000) {
console.log("130000");
storeData(array);
array = [];
} else if (count === 140000) {
console.log("140000");
storeData(array);
array = [];
} else if (count === 150000) {
console.log("150000");
storeData(array);
array = [];
} else if (count === 160000) {
console.log("160000");
storeData(array);
array = [];
} else if (count === 166606) {
console.log("166606");
storeData(array);
array = [];
}
}
function storeData(array1) {
pool.getConnection(function(err, connection) {
var sql = "INSERT INTO org_csv_tbl (EIN, NAME_GD,ICO,STREET,CITY,STATE,ZIP,GROUP_GD,SUBSECTION,AFFILIATION,CLASSIFICATION,RULING,DEDUCTIBILITY,FOUNDATION,ACTIVITY,ORGANIZATION,STATUS_GD,TAX_PERIOD,ASSET_CD,INCOME_CD,FILING_REQ_CD,PF_FILING_REQ_CD,ACCT_PD,ASSET_AMT,INCOME_AMT,REVENUE_AMT,NTEE_CD,SORT_NAME) VALUES ?";
var values = [array1];
connection.query(sql, values, function(err) {
if (err) {
console.log(err);
} else {
console.log("success");
}
connection.release();
});

});

}

});

});
*/

//var sql = 'select * from org_csv_tbl order by REVENUE_AMT desc limit 2500';

var sql = "SELECT EIN,REVENUE_AMT FROM org_csv_tbl ORDER BY CAST(REVENUE_AMT as SIGNED INTEGER) desc limit 1";
pool.query(sql, function(err, guideStarEins) {
  if (err) {
    callback(err);
  } else {
    console.log(guideStarEins);
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
            //                charityInfo.short_name = data.organization_name_aka;
            charityInfo.short_name = charityInfo.name_tmp.slice(0, 18);
            charityInfo.charity_from = "guidestar";
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
            codeObject.status = "published";

            console.log("charity....................");
            //console.log(charityInfo);
            console.log("orginfo....................");
            //console.log(orgInfo);
            console.log("codeObject....................");
            //  console.log(codeObject);
            console.log(count++);
            //callback(null);

            async.parallel({
              charity: function(userCallback) {
                pool.query('INSERT INTO charity_tbl SET ?', charityInfo, function(err, data1) {
                  if (err) {
                    userCallback(err, null);
                  } else {
                    userCallback(null, data1);
                  }
                });
              },
              organization: function(orgCallback) {
                pool.query('INSERT INTO organization_tbl SET ?', orgInfo, function(err, data2) {
                  if (err) {
                    orgCallback(err, null);
                  } else {
                    orgCallback(null, data2);
                  }
                });
              }
            }, function(err, parallelResult) {
              if (err) {
                callback(err);
              } else {

                //console.log(parallelResult);
                if (parallelResult.charity) {
                  codeObject.charity_id = parallelResult.charity.insertId;
                  pool.query('INSERT INTO code_tbl SET ?', codeObject, function(err, codeId) {
                    if (err) {
                      callback(err);
                    } else {
                      async.parallel({
                        codeEntity: function(callback) {
                          pool.query('INSERT INTO entity_tbl(entity_id,entity_type) values (?,?)', [codeId.insertId, "code"], function(err, rows) {
                            if (err) {
                              callback(err);
                            } else {
                              callback(null);
                            }
                          });
                        },
                        charityEntity: function(callback) {
                          pool.query('INSERT INTO entity_tbl(entity_id,entity_type) values (?,?)', [parallelResult.charity.insertId, "charity"], function(err, rows) {
                            if (err) {
                              callback(err);
                            } else {
                              callback(null);
                            }
                          });
                        },
                        charityNteeCode: function(callback) {
                          if (data.nteecode) {
                            var nteeid = data.nteecode.substr(0, data.nteecode.indexOf(' ')); //data.nteecode.slice(0, 4);
                            if (nteeid) {

                            } else {
                              var nteeid = data.nteecode;
                            }
                            pool.query('SELECT * FROM charity_category_tbl where ntee_code=?', [nteeid], function(err, categoryId) {
                              if (err) {
                                console.log(err);
                                callback(err);
                              } else {

                                if (categoryId && categoryId.length > 0) {
                                  console.log("exist........");
                                  pool.query('INSERT INTO category_charity_tbl (category_id,charity_id) VALUES (?,?)', [categoryId[0].id, parallelResult.charity.insertId], function(err, rows) {
                                    if (err) {
                                      callback(err);
                                    } else {
                                      console.log(rows);
                                      pool.query('INSERT INTO charity_nteecode(charity_id,nteecode) values (?,?)', [parallelResult.charity.insertId, data.nteecode], function(err, rows) {
                                        if (err) {
                                          callback(err);
                                        } else {
                                          callback(null);
                                        }
                                      });
                                    }
                                  });

                                } else {
                                  console.log("not exist........");
                                  var ntee_code = data.nteecode.substr(0, data.nteecode.indexOf(' ')); //data.nteecode.slice(0, 4);
                                  if (ntee_code) {
                                    var title = data.nteecode.substr(data.nteecode.indexOf(' ') + 1); //data.nteecode.slice(4, 100);
                                    re = /\((.*)\)/;
                                    title = title.match(re)[1];
                                  } else {
                                    ntee_code = data.nteecode;
                                    var title = " ";
                                  }

                                  var group_code = nteeid.slice(0, 1);
                                  var category_code = nteeid.slice(1, 3);

                                  pool.query('INSERT INTO charity_category_tbl (ntee_code,title,group_code,category_code) VALUES (?,?,?,?)', [ntee_code, title, group_code, category_code], function(err, rows1) {
                                    if (err) {
                                      console.log(err);
                                      callback(err);
                                    } else {
                                      console.log(rows1);
                                      pool.query('INSERT INTO category_charity_tbl (category_id,charity_id) VALUES (?,?)', [rows1.insertId, parallelResult.charity.insertId], function(err, rows) {
                                        if (err) {
                                          callback(err);
                                        } else {
                                          console.log(rows);
                                          pool.query('INSERT INTO charity_nteecode(charity_id,nteecode) values (?,?)', [parallelResult.charity.insertId, data.nteecode], function(err, rows) {
                                            if (err) {
                                              callback(err);
                                            } else {
                                              callback(null);
                                            }
                                          });
                                        }
                                      });
                                    }
                                  });
                                }
                              }
                            });
                          } else {
                            callback(null);
                          }
                        },
                        guideStarData: function(callback) {
                          pool.query('INSERT INTO guide_star(ein,response_json) values (?,?)', [singleObj.EIN, JSON.stringify(data)], function(err, rows) {
                            if (err) {
                              callback(err);
                            } else {
                              callback(null);
                            }
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
        console.log('updated successfully...');
      }

    });

  }

});

//TODO  NteeCode store in correct format for Exist Charity's

/*
pool.query('SELECT * from  charity_nteecode', function(err, data) {
  if (err) {
    console.log(err);
  } else {
    async.eachSeries(data, function(nteeObj, callback) {
        if (nteeObj && nteeObj.nteecode) {
          var nteeid = nteeObj.nteecode.substr(0, nteeObj.nteecode.indexOf(' '));; //nteeObj.nteecode.slice(0, 4);
          pool.query('SELECT * FROM charity_category_tbl where ntee_code=?', [nteeid], function(err, categoryId) {
            if (err) {
              console.log(err);
              callback(err);
            } else {
              if (categoryId && categoryId.length > 0) {
                console.log("exist........");
                pool.query('INSERT INTO category_charity_tbl (category_id,charity_id) VALUES (?,?)', [categoryId[0].id, nteeObj.charity_id], function(err, rows) {
                  if (err) {
                    callback(err);
                  } else {
                    console.log("rows....");
                    console.log(rows);
                    callback(null);
                  }
                });
              } else {
                console.log("not exist........");

                var ntee_code = nteeObj.nteecode.substr(0, nteeObj.nteecode.indexOf(' ')); //data.nteecode.slice(0, 4);
                if (ntee_code) {
                  var title = nteeObj.nteecode.substr(nteeObj.nteecode.indexOf(' ') + 1); //data.nteecode.slice(4, 100);
                  re = /\((.*)\)/;
                  title = title.match(re)[1];
                } else {
                  ntee_code = nteeObj.nteecode;
                  var title = " ";
                }

                //var ntee_code = nteeObj.nteecode.substr(0, nteeObj.nteecode.indexOf(' ')); //data.nteecode.slice(0, 4);
                //var title = nteeObj.nteecode.substr(nteeObj.nteecode.indexOf(' ') + 1);; //data.nteecode.slice(4, 100);

                //re = /\((.*)\)/;
                //title = title.match(re)[1];
                var group_code = nteeid.slice(0, 1);
                var category_code = nteeid.slice(1, 3);

                pool.query('INSERT INTO charity_category_tbl (ntee_code,title,group_code,category_code) VALUES (?,?,?,?)', [ntee_code, title, group_code, category_code], function(err, rows1) {
                  if (err) {
                    console.log(err);
                    callback(err);
                  } else {
                    pool.query('INSERT INTO category_charity_tbl (category_id,charity_id) VALUES (?,?)', [rows1.insertId, parallelResult.charity.insertId], function(err, rows) {
                      if (err) {
                        callback(err);
                      } else {
                        callback(null);
                      }
                    });
                  }
                });
              }
            }
          });
        } else {
          callback(null);
        }
      },
      function(err) {
        console.log("completed");
      });
  }
});
*/


//   Script For to differenciate guidestar or self

//……guidestar update field “charity_from”=“approved” 
/*
pool.query('SELECT * from  charity_tbl where charity_from IS NULL', function(err, data) {
  if (err) {
    console.log(err);
  } else {
    async.eachSeries(data, function(nteeObj, callback) {
        console.log(nteeObj.id);
        pool.query('UPDATE charity_tbl SET charity_from=? WHERE id=?', ['approved', nteeObj.id], function(err, rows) {
          if (err) {
            callback(err);
          } else {
            callback(null);
          }
        });
      },
      function(err) {
        console.log("completed");
      });
  }
});
*/

//………guidestar update field “charity_from”=“guidestar”

/*
pool.query('SELECT * from  charity_nteecode', function(err, data) {
  if (err) {
    console.log(err);
  } else {
    async.eachSeries(data, function(nteeObj, callback) {
      console.log(nteeObj.charity_id);
        pool.query('UPDATE charity_tbl SET charity_from=? WHERE id=?', ['guidestar', nteeObj.charity_id], function(err, rows) {
          if (err) {
            callback(err);
          } else {
            callback(null);
          }
        });
      },
      function(err) {
        console.log("completed");
      });
  }
});
*/
