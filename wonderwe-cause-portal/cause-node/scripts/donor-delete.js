var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var elasticsearch = require('elasticsearch');

var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: props.username,
  port:props.port,
  password: props.password,
  database: props.database,
  acquireTimeout:30000
}); 

elasticClient = new elasticsearch.Client({
  host: props.elasticServer,
  log: props.elasticSearchlog
})

elasticClient.ping({
  // ping usually has a 3000ms timeout 
  requestTimeout: Infinity,
  hello: "elasticsearch!"
}, function(error) {
  if (error) {
    console.trace('elasticsearch cluster is down!');
  } else {
    console.log('Elastic server is up..');
    console.log('All is well');
  }
});


var count = 0;

//#,unt.*,tt.*,ctt.*,uu.*,uct.*//                #left outer join follow_tbl ft on ft.user_id = e.entity_id
//#left outer join status_update_link_tbl sut2 on sut2.linked_id =u.id and sut2.linked_type='user'


var entityQuery = "select * from entity_tbl where entity_id in (select id from user_tbl where email like 'andrew.stanley@wonderwe.com') and entity_type ='user'";

var requestQuery = "select * from user_tbl where email like 'andrew.stanley@wonderwe.com'";

var deleteQuery = "delete e.*,f.*,u.*,upt.*,sut.*,unt.*,tt.*,ctt.*,uu.*,uct.* from entity_tbl e inner join user_tbl u on u.id = e.entity_id inner join user_profile_tbl upt on upt.user_id = u.id left outer join follow_tbl f on f.entity_id = e.id or f.user_id = e.entity_id left outer join status_update_tbl sut on sut.entity_id = e.id or sut.original_entity_id = e.id left outer join status_update_link_tbl sult on sult.post_id = sut.id or sult.linked_id = u.id left outer join user_notifications_tbl unt on unt.user_id = u.id or unt.entity_id = e.id left outer join transaction_tbl tt on tt.user_id = u.id left outer join credit_card_tbl ctt on ctt.user_id = u.id left outer join slug_manager_tbl uu on uu.entity_id = e.id left outer join user_category_tbl uct on uct.user_id = u.id where e.entity_id = ? and e.entity_type = ?";

//var deleteQuery2 = "delete u.*,e.*,up.* from user_tbl u left outer join user_profile_tbl up on up.user_id = u.id left outer join entity_tbl e on e.entity_id = u.id and e.entity_type = 'user' where u.id = ?"

// We need to change the query based on the deletion requirement  

pool.query(entityQuery, [], function(err, entityResult) {
  if (err) {
    console.error(err);
  } else {

    async.each(entityResult, function(entityObj, entityCallback) {
      console.log(entityObj);

      elasticClient.delete({
        index: props.elastic_index,
        type: 'entity',
        id: entityObj.id
      }, function(error, response) {

        // ...
        console.error(error);
        console.log(response);
        entityCallback(null);

      });
      //  entityCallback(null);
    }, function(err) {

      console.log('Elastic Data deleted successfully...');

      pool.query(requestQuery, [], function(err, result) {
        if (err) {
          console.error(err);
        } else {
          console.log(result);
          async.each(result, function(singleObj, callback) {

            pool.query(deleteQuery, [singleObj.id, 'user'], function(err, userResult) {
              console.log(err);
              if (err) {
                console.error(err);
              } else {
                console.log(userResult);
              }
              callback(null);
            });
            //  callback(null);
          }, function(err) {
            console.log('Done well...');
          });
        }
      });
    });
  }
});


/*var deleteQuery = "delete e.*,f.*,u.id,upt.*,sut.*,unt.*,tt.*,ctt.*,uu.*,uct.* from entity_tbl e
inner join user_tbl u on u.id = e.entity_id
inner join user_profile_tbl upt on upt.user_id = u.id
left outer join follow_tbl f on f.entity_id = e.id or f.user_id = e.entity_id
left outer join status_update_tbl sut on sut.entity_id = e.id or sut.original_entity_id = e.id
left outer join status_update_link_tbl sult on sult.post_id = sut.id or sult.linked_id = u.id
left outer join user_notifications_tbl unt on unt.user_id = u.id or unt.entity_id = e.id
left outer join transaction_tbl tt on tt.user_id = u.id
left outer join credit_card_tbl ctt on ctt.user_id = u.id
left outer join slug_manager_tbl uu on uu.entity_id = e.id
left outer join user_category_tbl uct on uct.user_id = u.id
where e.entity_id = ? and e.entity_type = ?";*/




/*
pool.query("select * from user_tbl where id=?", [4554], function(err, userResult) {
  if (err) {
    console.log(err);
  } else {
    async.each(userResult, function(singleObj, eachCallback) {
        async.series({
            follow_tbl: function(callback) {
              connection.query("select * from entity_tbl where entity_id=? and entity_type=?", [singleObj.id, 'user'], function(err, entityData) {
                if (err) {
                  callback(err);
                } else {
                  if (entityData && entityData.length) {
                    connection.query("DELETE FROM follow_tbl WHERE entity_id = ?", [entityData[0].id], function(err, removefollow) {
                      if (err) {
                        console.error(err);
                        callback(err);
                      } else {
                        connection.query("DELETE FROM follow_tbl WHERE user_id = ?", [singleObj.id], function(err, removefollow) {
                          if (err) {
                            console.error(err);
                            callback(err);
                          } else {
                            callback(null);
                          }
                        });
                      }
                    });
                  } else {
                    callback(null);
                  }
                }
              });

            },
            status_update_tbl: function(callback) {
              connection.query("select * from entity_tbl where entity_id=? and entity_type=?", [singleObj.id, 'user'], function(err, entityData) {
                if (err) {
                  callback(err);
                } else {
                  if (entityData && entityData.length > 0) {
                    connection.query("select * from status_update_tbl where entity_id=?", [entityData[0].id], function(err, statusData) {
                      if (err) {
                        callback(err);
                      } else {
                        async.each(statusData, function(object, callbackEach) {
                          connection.query("delete from status_update_link_tbl where post_id=?", [object.id], function(err, statusData) {
                            if (err) {
                              callbackEach(err);
                            } else {
                              callbackEach(null);
                            }
                          });
                        }, function(err) {
                          if (err) {
                            callback(err);
                          } else {
                            connection.query("delete from status_update_tbl where entity_id=?", [entityData[0].id], function(err, statusData) {
                              if (err) {
                                callback(err);
                              } else {
                                connection.query("delete from entity_tbl where entity_id=? and entity_type=?", [singleObj.id, 'user'], function(err, statusData) {
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
                    });
                  } else {
                    callback(null);
                  }
                }
              });
            },
            transaction_tbl: function(callback) {
              connection.query("DELETE FROM transaction_tbl WHERE user_id = ?", [singleObj.id], function(err, guideStarEins) {
                if (err) {
                  console.error(err);
                  callback(err);
                } else {
                  callback(null);
                }
              });
            },
            user_notifications_tbl: function(callback) {
              connection.query("DELETE FROM user_notifications_tbl WHERE user_id = ?", [singleObj.id], function(err, guideStarEins) {
                if (err) {
                  console.error(err);
                  callback(err);
                } else {
                  callback(null);
                }
              });
            },
            credit_card_tbl: function(callback) {
              connection.query("DELETE FROM credit_card_tbl WHERE user_id = ?", [singleObj.id], function(err, guideStarEins) {
                if (err) {
                  console.error(err);
                  callback(err);
                } else {
                  callback(null);
                }
              });
            },
            user_profile_tbl: function(callback) {
              connection.query("DELETE FROM user_profile_tbl WHERE user_id = ?", [singleObj.id], function(err, guideStarEins) {
                if (err) {
                  console.error(err);
                  callback(err);
                } else {
                  callback(null);
                }
              });
            },
            user_tbl: function(callback) {
              connection.query("DELETE FROM user_tbl WHERE id = ?", [singleObj.id], function(err, guideStarEins) {
                if (err) {
                  console.error(err);
                  callback(err);
                } else {
                  callback(null);
                }
              });
            },
          },
          function(err, results) {
            if (err) {
              eachCallback(err);
            } else {
              eachCallback(null);
            }
          });
      },
      function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('done well');
        }

      });
  }
});
*/
