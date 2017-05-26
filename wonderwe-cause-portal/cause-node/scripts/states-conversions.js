var uslug = require('uslug');


// var mysql = require('mysql');
// var pool = mysql.createPool({
//   host: '104.236.69.222',
//   user: 'root',
//   password: 'scriptbees1$',
//   database: "wonderwe_qa"
// });
// var async = require('async');


async.parallel({
  charity: function(callback) {
    pool.query('select * from charity_tbl where state IS NOT NULL', function(err, charityResult) {
      console.log(charityResult.length);
      if (charityResult && charityResult.length > 0) {

        async.each(charityResult, function(singleObejct, eachCallback) {

          if (singleObejct && singleObejct.state) {

            var abbreviation = singleObejct.state;

            pool.query('select * from state_tbl where abbreviation=?', [abbreviation], function(err, abbreviationResult) {

              if (abbreviationResult && abbreviationResult.length > 0) {


                var name = abbreviationResult[0].name;
                console.log(name)
                pool.query('select * from states_tbl where name=? and country_id=223', [name], function(err, stateResult) {

                  if (stateResult && stateResult.length > 0) {
                    var id = stateResult[0].id.toString();
                    console.log(stateResult);
                    console.log(stateResult[0].id);
                    var country = stateResult[0].country_id;
                    console.log(stateResult[0].country_id);
                    console.log(singleObejct.id);
                    pool.query('update charity_tbl set state=?,country=? where id=?', [id, country, singleObejct.id], function(err, stateUpdateResult) {
                      console.log(err);
                      eachCallback(null);

                    });
                    // eachCallback(null);
                  } else {
                    eachCallback(null);
                  }
                });
              } else {
                eachCallback(null);
              }

            });
          } else {
            eachCallback(null);
          }
        }, function(err) {
          callback(null, {});
        });
      } else {
        callback(null, {});
      }
    });

    // callback(null, {});
  },
  code: function(callback) {
    //select * from code_tbl where state IS NOT NULL AND id=?
    pool.query('select * from code_tbl where state IS NOT NULL', function(err, codeResult) {
      console.log(codeResult.length);
      if (codeResult && codeResult.length > 0) {

        async.each(codeResult, function(singleObejct, eachCallback) {

          if (singleObejct && singleObejct.state) {

            var abbreviation = singleObejct.state;

            pool.query('select * from state_tbl where abbreviation=?', [abbreviation], function(err, abbreviationResult) {

              if (abbreviationResult && abbreviationResult.length > 0) {


                var name = abbreviationResult[0].name;
                console.log(name)
                pool.query('select * from states_tbl where name=? and country_id=223', [name], function(err, stateResult) {

                  if (stateResult && stateResult.length > 0) {
                    var id = stateResult[0].id.toString();
                    console.log(stateResult);
                    console.log(stateResult[0].id);
                    var country = stateResult[0].country_id;
                    console.log(stateResult[0].country_id);
                    console.log(singleObejct.id);
                    pool.query('update code_tbl set state=?,country=? where id=?', [id, country, singleObejct.id], function(err, stateUpdateResult) {
                      console.log(err);
                      eachCallback(null);

                    });
                    // eachCallback(null);
                  } else {
                    eachCallback(null);
                  }
                });
              } else {
                eachCallback(null);
              }

            });
          } else {
            eachCallback(null);
          }
        }, function(err) {
          callback(null, {});
        });
      } else {
        callback(null, {});
      }
    });

  },
  user_profile_tbl: function(callback) {

    pool.query('select * from user_profile_tbl where state IS NOT NULL', function(err, userResult) {
      console.log(userResult.length);
      if (userResult && userResult.length > 0) {

        async.each(userResult, function(singleObejct, eachCallback) {

          if (singleObejct && singleObejct.state) {

            var abbreviation = singleObejct.state;

            pool.query('select * from state_tbl where abbreviation=?', [abbreviation], function(err, abbreviationResult) {

              if (abbreviationResult && abbreviationResult.length > 0) {


                var name = abbreviationResult[0].name;
                console.log(name)
                pool.query('select * from states_tbl where name=? and country_id=223', [name], function(err, stateResult) {

                  if (stateResult && stateResult.length > 0) {
                    var id = stateResult[0].id.toString();
                    console.log(stateResult);
                    console.log(stateResult[0].id);
                    var country = stateResult[0].country_id;
                    console.log(stateResult[0].country_id);
                    console.log(singleObejct.id);
                    pool.query('update user_profile_tbl set state=?,country=? where id=?', [id, country, singleObejct.id], function(err, stateUpdateResult) {
                      console.log(err);
                      eachCallback(null);

                    });
                    // eachCallback(null);
                  } else {
                    eachCallback(null);
                  }
                });
              } else {
                eachCallback(null);
              }

            });
          } else {
            eachCallback(null);
          }
        }, function(err) {
          callback(null, {});
        });
      } else {
        callback(null, {});
      }
    });


    //callback(null, {});

  }
}, function(err, result) {
  console.log('Done well');
});
