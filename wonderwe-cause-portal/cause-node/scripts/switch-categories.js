var mysql = require('mysql');
var async = require('async');
var props = require('config').props;

var pool = mysql.createPool({

  host: props.host,
  user: props.username,
  password: props.password,
  database: props.database,
  acquireTimeout: 100000
});
// ww_categories_tbl_tmp

// Tables which we are going to modifiy.
// user_category_tbl , code_fund_category_tbl, category_charity_tbl
var userCategoriesQuery = "select distinct uc.category_id, uc.user_id, cc.ww_category_id from user_category_tbl uc inner join ww_categories_tbl_tmp cc on cc.group_code = uc.category_id";
var charityCategoriesQuery = "select cct.*, cc.ww_category_id from category_charity_tbl cct inner join ww_categories_tbl_tmp cc on cc.id = cct.category_id";

async.parallel({
  userCategories: function(callback) {
    // category_id -- p, A, need to update with category id
    pool.query(userCategoriesQuery, function(err, result) {
      if (err) {
        console.log('Error..');
        console.log(err);
        callback(err, null);
      } else {
        var array = [];
        async.each(result, function(sineleObj, eachCallback) {
          array.push([sineleObj.user_id, sineleObj.ww_category_id]);
          eachCallback(null);
        }, function(err) {
          console.log(array);
          var sql = "INSERT INTO ww_user_category_tbl (user_id, category_id) VALUES ?";
          pool.query(sql, [array], callback);
        });
      }
    });
  },
  codeCategories: function(callback) {
    //code_fund_category_tbl   -- code_group

    var codesQuery = "select distinct code_id from code_fund_category_tbl";

    pool.query(codesQuery, function(err, uniqCampaigns) {
      if (err) {
        callback(err, null);
      } else {
        async.each(uniqCampaigns, function(singleCode, eachCallback) {
          var fundQuery = "select uc.code_id, cc.ww_category_id from code_fund_category_tbl uc inner join ww_categories_tbl_tmp cc on cc.group_code = uc.code_group where code_id =?";
          pool.query(fundQuery, [singleCode.code_id], function(err, fundResults) {
            if (err) {
              console.log(err);
              eachCallback(err);
            } else {
              pool.query('insert into ww_code_category_tbl (code_id, category_id) values(?,?)', [fundResults[0].code_id, fundResults[0].ww_category_id], function(err, codeFinalResults) {
                if (err) {
                  eachCallback(err);
                } else {
                  eachCallback(null);
                }
              });
            }
          });
        }, function(err) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, 'Done well...');
          }
        });
      }
    });
  },  
  charityCategories: function(callback) {

    pool.query(charityCategoriesQuery, function(err, result) {
      if (err) {
        console.log('Error..');
        console.log(err);
        callback(err, null);
      } else {
        var array2 = [];
        async.each(result, function(sineleObj, eachCallback) {
          array2.push([sineleObj.ww_category_id, sineleObj.charity_id]);
          eachCallback(null);
        }, function(err) {
          console.log(array2);
          var sql = "INSERT INTO ww_charity_category_tbl (category_id, charity_id) VALUES ?";
          pool.query(sql, [array2], callback);
        });
      }
    });
  }
}, function(err, result) {
  if (err) {
    console.log('Failed due to error..');
    console.log(err);
  } else {
    console.log('Perfect Done well..');
  }
});
