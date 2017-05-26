var uslug = require('uslug');

var mysql = require('mysql');
var pool = mysql.createPool({
  host: '104.236.69.222',
  user: 'root',
  password: 'scriptbees1$',
  database: "wonderwe_development"
});

var async = require('async');


pool.query("select * from entity_tbl", function(err, entityResult) {
  if (entityResult && entityResult.length > 0) {

    async.eachSeries(entityResult, function(singleObject, callback) {
      //console.log(singleObject);

      if (singleObject.entity_type == 'user') {
        // pool.query("select * from user_tbl where id=?", [singleObject.entity_id], function(err, userResult) {
        //   //console.log(userResult);
        //   if (userResult && userResult.length > 0) {
        //     var usrSlug = uslug(userResult[0].name);
        //     console.log(usrSlug);
        //     pool.query("update entity_tbl set slug =? where id=?", [usrSlug, singleObject.id], function(err, userUpdate) {
        //       console.log(err);
        //       callback(null);
        //     });
        //   } else {
        //     callback(null);
        //   }
        // });


        pool.query("select * from user_tbl where id=?", [singleObject.entity_id], function(err, userResult) {
          // console.log(err);
          if (userResult && userResult.length > 0) {
            var usrSlug = uslug(userResult[0].name);
            console.log(usrSlug);
            var originlSlug = uslug(userResult[0].name);
            var count = 1;

            charitySlugCreation(singleObject, usrSlug, count, originlSlug, function(err, result) {
              callback(null);
            });

          } else {
            callback(null);
          }
        });

        // pool.query("select * from entity_tbl where slug =?", [usrSlug], function(err, entitySlugResult) {

        //   if (entitySlugResult && entitySlugResult.length > 0) {
        //     var count = 1;
        //     var originlSlug = usrSlug;
        //     charitySlugCreation(singleObject, usrSlug, count, originlSlug, function(err, result) {
        //       callback(null);
        //     });
        //   } else {
        //     console.log('Updating data...');
        //     console.log(usrSlug);
        //     pool.query("update entity_tbl set slug =? where id=?", [usrSlug, singleObject.id], function(err, charityUpdate) {
        //       callback(null);
        //     });
        //   }
        // });

        // callback(null);
      } else if (singleObject.entity_type == 'charity') {
        // console.log('Coming up ...');
        pool.query("select * from charity_tbl where id=?", [singleObject.entity_id], function(err, charityResult) {
          // console.log(err);
          if (charityResult && charityResult.length > 0) {
            var usrSlug = uslug(charityResult[0].name_tmp);
            var count = 1;
            var originlSlug = usrSlug;

            charitySlugCreation(singleObject, usrSlug, count, originlSlug, function(err, result2) {
              callback(null);
            });


            // pool.query("select * from entity_tbl where slug =?", [usrSlug], function(err, entitySlugResult) {
            //   console.log(err);

            //   if (entitySlugResult && entitySlugResult.length > 0) {
            //     var count = 1;
            //     var originlSlug = usrSlug;
            //     charitySlugCreation(singleObject, usrSlug, count, originlSlug, function(err, result) {
            //       callback(null);
            //     });
            //   } else {
            //     console.log('Updating data...');
            //     console.log(usrSlug);
            //     pool.query("update entity_tbl set slug =? where id=?", [usrSlug, singleObject.id], function(err, charityUpdate) {
            //       callback(null);
            //     });
            //   }
            // });


          } else {
            callback(null);
          }
        });


        // callback(null);
      } else if (singleObject.entity_type == 'code') {

        pool.query("select * from code_tbl where id=?", [singleObject.entity_id], function(err, codeResult) {
          if (codeResult && codeResult.length > 0) {
            var usrSlug = uslug(codeResult[0].code_text);
            var originlSlug = uslug(codeResult[0].code_text);
            var count = 1;

            charitySlugCreation(singleObject, usrSlug, count, originlSlug, function(err, codeUpdate) {
              callback(null);
            });
            // pool.query("update entity_tbl set slug =? where id=?", [usrSlug, singleObject.id], function(err, codeUpdate) {
            //   callback(null);
            // });

          } else {
            callback(null);
          }
        });
        // callback(null);
      } else {
        callback(null);
      }
    }, function(err) {
      console.log('Done well...');
    });
  } else {
    console.log('SOmething went wrong');
  }
});



function charitySlugCreation(entityObject, usrSlug, count, originlSlug, callback) {
  var me = this;
  usrSlug = usrSlug.split('-').join('');
  originlSlug = originlSlug.split('-').join('');


  pool.query("select * from entity_tbl where slug =?", [usrSlug], function(err, entitySlugResult) {

    if (entitySlugResult && entitySlugResult.length > 0) {
      console.log(usrSlug);
      usrSlug = originlSlug + count;
      count = count + 1;
      charitySlugCreation(entityObject, usrSlug, count, originlSlug, callback);
    } else {
      console.log('New slug changes');
      entityObject.slug = usrSlug;
      console.log(usrSlug);
      //  excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], [entityObject], callback);
      pool.query("update entity_tbl set slug =? where id=?", [usrSlug, entityObject.id], callback);
      // pool.query("update entity_tbl set slug =? where id=?", [usrSlug, singleObject.id], callback);
    }
  });
}


// function charitySlugCreation(singleObject, usrSlug, count, originlSlug, callback) {

//   usrSlug = originlSlug + count;

//   pool.query("select * from entity_tbl where slug =?", [usrSlug], function(err, entitySlugResult) {

//     if (entitySlugResult && entitySlugResult.length > 0) {

//       console.log('Again');
//       console.log(usrSlug);
//       count = count + 1;
//       charitySlugCreation(singleObject, usrSlug, count, originlSlug, callback);
//     } else {
//       console.log('New slug');
//       console.log(usrSlug);
//       pool.query("update entity_tbl set slug =? where id=?", [usrSlug, singleObject.id], callback);
//     }
//   });

// }
