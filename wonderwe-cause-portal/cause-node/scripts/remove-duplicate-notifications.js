var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var elasticsearch = require('elasticsearch');

var pool = mysql.createPool({

  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database
});


var count = 0;

pool.query('select * from user_tbl where id=?', [1694], function(err, elasticResult) {
  if (err) {
    console.log(err);
  } else {
    if (elasticResult && elasticResult.length > 0) {
      async.each(elasticResult, function(userdata, callback) {
        pool.query('select * from entity_tbl where entity_id=? and entity_type=?', [userdata.id, 'user'], function(err, entityInfo) {
          if (err) {
            callback(err);
          } else {
            if (entityInfo && entityInfo.length > 0) {
              pool.query('select * from user_notifications_tbl where entity_id=? and notication_type=?', [entityInfo[0].id, 'follow'], function(err, userNotifications) {
                if (err) {
                  callback(err);
                } else {
                  if (userNotifications && userNotifications.length > 1) {
                    async.each(userNotifications, function(singleNotification, callback1) {

                      pool.query('select * from user_notifications_tbl where entity_id=? and notication_type=? and user_id', [entityInfo[0].id, 'follow', singleNotification.user_id], function(err, followInfo) {
                        if (err) {
                          callback(err);
                        } else {
                          if (followInfo && followInfo.length === 1) {
                            callback1(null);
                          } else {
                            async.each(followInfo, function(deleteobj, callback2) {
                              count++;
                              if (count === 1) {
                                callback2(null);
                              } else {
                                callback2(null);
                                /*                               pool.query('delete * from user_notifications_tbl where id=?', [deleteobj.id], function(err, entityInfo2) {
                                                                 if (err) {
                                                                   callback2(err);
                                                                 } else {
                                                                   callback2(null);
                                                                 }
                                                               });*/
                              }
                            }, function(err) {
                              if (err) {
                                callback1(err);
                              } else {
                                callback1(null);
                              }
                            })
                          }
                        }
                      });
                    }, function(err) {
                      if (err) {
                        callback(err);
                      } else {
                        callback(null);
                      }
                    });
                  } else {
                    callback(null);
                  }
                }
              });
            }
          }
        })
      }, function(err) {
        console.log('................done');
      })
    }
  }

});
