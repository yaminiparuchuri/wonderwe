var mysql = require('mysql');
var async = require('async');
props = require('config').props;
db_template = require('db-template');
var moment = require('moment');

var fs = require('fs');
var parser = require('xml2json')

var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database
});

excuteQuery = db_template(pool);

var content = fs.readFileSync(__dirname + '/../sql-queries.xml');

var json = parser.toJson(content, {
    sanitize: false
  })
  // returns a string containing the JSON structure by default
var sqlQueries = JSON.parse(json)['sql-queries']['sql-query']
sqlQueryMap = {}
for (var i = 0; i < sqlQueries.length; i++) {
  sqlQueryMap[sqlQueries[i]['id']] = sqlQueries[i]['$t']
}

var botId = props.botId;


async.parallel({
  users: function(userCallback) {
    pool.query('select * from user_tbl where email is not null', function(err, userresult) {
      userCallback(null, userresult);
    });
  },
  botEntity: function(botCallback) {
    pool.query('select * from entity_tbl where entity_id=? and entity_type=?', [botId, 'user'], function(err, entityCallback) {
      botCallback(null, entityCallback);
    });
  }
}, function(err, result) {
  if (err) {
    console.log('First error message');
    console.log(err);
  } else {

    console.log(result.users);


    if (result.botEntity && result.botEntity.length > 0) {

      var entityid = result.botEntity[0].id;

      async.eachSeries(result.users, function(singleUser, callback) {
        var followobj = {};
        console.log(singleUser);
        followobj.user_id = singleUser.id;
        followobj.entity_id = entityid;
        followobj.date_followed = moment.utc().toDate();
        followobj.entity_type = 'user';

        excuteQuery.queryForObject(sqlQueryMap['verifyFollowStatus'], [followobj.user_id, followobj.entity_id], function(err, existingresponse) {
          if (err) {
            console.log('Second One...');
            console.log(err);
            callback(null);
          } else {
            if (existingresponse && existingresponse.length > 0) {
              if (followobj && followobj.checkcharityfollowornot) {
                callback(null);
              } else {
                console.log('Alreay following');
                callback(null);
              }
            } else {
              excuteQuery.insertAndReturnKey(sqlQueryMap['follow_insert'], [followobj.user_id, followobj.entity_id, followobj.date_followed], function(err, insertResult) {
                if (err) {
                  console.log('Third One...');
                  console.log(err);
                  callback(null);
                } else {

                  followUserCharityCode(followobj, function(err, followResult) {
                    if (err) {
                      console.log('Fouth One One...');
                      console.log(err);
                      callback(null);
                    } else {
                      console.log('Evenry one..');
                      callback(null);
                    }
                  });
                }
              });
            }
          }
        });
      }, function(err) {
        console.log('DOne well...');
      });
    } else {
      console.log('Something wrng with botId');
    }
  }
});


function followUserCharityCode(followobj, callback) {

  console.log(followobj);

  async.parallel({
    userFollwing: function(userFollwingCallback) {
      // my user_id condition
      excuteQuery.queryForAll(sqlQueryMap['getEntityUser'], [followobj.user_id, 'user'], function(err, entityResult) {
        if (err) {
          console.log(err);
          callback(new Error(err), null);
        } else {
          if (entityResult && entityResult.length > 0) {
            var id = entityResult[0].id;

            if (followobj.entity_type == 'charity') {
              // following_charities +1
              excuteQuery.update(sqlQueryMap['updateUserCharityFollowingCount'], [parseInt(entityResult[0].following_charities) + 1, id], userFollwingCallback);

            } else if (followobj.entity_type == 'code') {
              // follwing_codes +1
              excuteQuery.update(sqlQueryMap['updateUserCodeFollowingCount'], [parseInt(entityResult[0].following_codes) + 1, id], userFollwingCallback);

            } else if (followobj.entity_type == 'user') {
              excuteQuery.update(sqlQueryMap['updateUserFollowingCount'], [parseInt(entityResult[0].following_users) + 1, id], userFollwingCallback);
            }
          } else {
            userFollwingCallback({
              'error': 'something went wrong'
            }, null);
          }
        }
      });
    },
    userFollowers: function(userFollowerCallback) {
      // just update the entity_tbl with reative counts
      var id2 = followobj.entity_id;

      excuteQuery.update(sqlQueryMap['updateUserFollowersCount'], [id2], userFollowerCallback);
    }
  }, function(err, asyncResult) {
    if (err) {

      console.log(err);

      callback(new Error(err), null);
    } else {
      callback(err, followobj);
    }
  });
};
