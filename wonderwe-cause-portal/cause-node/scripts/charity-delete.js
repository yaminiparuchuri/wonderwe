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


/*
1. remove from elasticsearch
2. campaigns removal
3. charity removal
*/


var charityId = 2648674;

var elasticQuery = "select * from entity_tbl where entity_id in (select id from code_tbl where charity_id = ?) and entity_type = 'code' union all select * from entity_tbl where entity_id = ? and entity_type = 'charity'";

var campaignsDelete = "delete e.*,c.*,t.*,f.*,stu.*,sult.*,uu.*,unt.* from entity_tbl e inner join code_tbl c on c.id = e.entity_id and e.entity_type = 'code' left outer join transaction_tbl t on t.code_id = c.id left outer join follow_tbl f on f.entity_id = e.id left outer join slug_manager_tbl uu on uu.entity_id = e.id left outer join status_update_tbl stu on stu.entity_id = e.id or stu.original_entity_id = e.id left outer join status_update_link_tbl sult on sult.post_id = stu.id or sult.linked_id = c.id left outer join user_notifications_tbl unt on unt.entity_id = e.id where e.entity_id in (select temp.id from (select id from code_tbl where charity_id = ?) as temp) and e.entity_type = 'code'";

var charityDelete = "delete c.*,e.*,t.*,f.*,stu.*,sult.*,uu.*,cnt.*,cct.*,cat.*,ccl.*,unt.*,o.* from charity_tbl c inner join entity_tbl e on e.entity_id = c.id and e.entity_type = 'charity' inner join organization_tbl o on o.id = c.organization_id left outer join transaction_tbl t on t.charity_id = c.id left outer join follow_tbl f on f.entity_id = e.id left outer join slug_manager_tbl uu on uu.entity_id = e.id left outer join status_update_tbl stu on stu.entity_id = e.id or stu.original_entity_id = e.id left outer join status_update_link_tbl sult on sult.post_id = stu.id or sult.linked_id = c.id left outer join charity_nteecode cnt on cnt.charity_id = c.id left outer join category_charity_tbl cct on cnt.charity_id = c.id left outer join charity_admin_tbl cat on cat.charity_id = c.id left outer join charity_claim_tbl ccl on ccl.charity_id = c.id left outer join user_notifications_tbl unt on unt.entity_id = e.id where c.id = ?";



var count = 0;

var connection = pool;

pool.query(elasticQuery, [charityId, charityId], function(err, elasticResult) {
  if (err) {
    console.error(err);
  } else {
    console.log('.....elasticResult');
    console.log(elasticResult);
    console.log('.....elasticResult');
    async.each(elasticResult, function(entityObj, elasticCallback) {


      elasticClient.delete({
        index: props.elastic_index + '_np',
        type: 'charity_for_fundraiser',
        id: entityObj.id
      }, function(error, response2) {
        console.log('fundraiser charity removal response.');
        console.log(error);
        console.log(response2);

      });


      elasticClient.delete({
        index: props.elastic_index,
        type: 'entity',
        id: entityObj.id
      }, function(error, response) {


        if (error) {
          console.error(error);
        } else {
          console.log(response);
        }
        elasticCallback(null);
      });

    }, function(err) {
      if (err) {
        console.error(err);
      } else {

        async.series({
            campaigns: function(codeCallback) {
              console.log('.............aaa');
              pool.query(campaignsDelete, [charityId], codeCallback);
            },
            charity: function(charityCallback) {
              console.log('.............bbb');
              pool.query(charityDelete, [charityId], charityCallback);
            },
          },
          function(err, results) {
            // results is now equal to: {one: {}, two: {}}
            if (err) {
              console.error(err);
            } else {
              console.log(results);
            }
            console.log('Done well...');
          });
      }
    });
  }
});



// To get the data from codes and charity

/*"select * from entity_tbl 
where entity_id in (select id from code_tbl where charity_id = ?) and entity_type = 'code'
union all
select * from entity_tbl where entity_id = ? and entity_type = 'charity'
";*/


//Campaign delete query

/*"delete  c.*, e.*,t.*,f.*,stu.*,sult.*,uu.*,unt.* from entity_tbl e
inner join code_tbl c on c.id =e.entity_id and e.entity_type = 'code'
left outer join transaction_tbl t on t.code_id = c.id
left outer join follow_tbl f on f.entity_id = e.id
left outer join slug_manager_tbl uu on uu.entity_id = e.id
left outer join status_update_tbl stu on stu.entity_id = e.id or stu.original_entity_id = e.id
left outer join status_update_link_tbl sult on sult.post_id = stu.id or sult.linked_id = c.id
left outer join user_notifications_tbl unt on unt.entity_id = e.id
where e.entity_id in (select temp.id from (select id from code_tbl where charity_id = ?) as temp ) and e.entity_type = 'code'
";*/


//Charity delete query

/* "delete  c.*, e.*,t.*,f.*,stu.*,sult.*,uu.*,cnt.*,cct.*,cat.*,ccl.*,unt.*,o.* from charity_tbl c
inner join entity_tbl e on e.entity_id = c.id and e.entity_type = 'charity'
inner join organization_tbl o on o.id = c.organization_id
left outer join transaction_tbl t on t.charity_id = c.id
left outer join follow_tbl f on f.entity_id = e.id
left outer join slug_manager_tbl uu on uu.entity_id = e.id
left outer join status_update_tbl stu on stu.entity_id = e.id or stu.original_entity_id = e.id
left outer join status_update_link_tbl sult on sult.post_id = stu.id or sult.linked_id = c.id
left outer join charity_nteecode cnt on cnt.charity_id = c.id
left outer join category_charity_tbl cct on cnt.charity_id = c.id
left outer join charity_admin_tbl cat on cat.charity_id = c.id
left outer join charity_claim_tbl ccl on ccl.charity_id = c.id
left outer join user_notifications_tbl unt on unt.entity_id = e.id
where c.id = ? ";*/


/*


pool.query("select * from charity_tbl where id=?", [1500895], function(err, charityData) {
  if (err) {
    console.log(err);
  } else {
    console.log(charityData);
    async.each(charityData, function(singleObj, eachCallback) {

        async.series({
            organization_tbl: function(callback) {
              connection.query("DELETE FROM organization_tbl WHERE id = ?", [singleObj.organization_id], function(err, guideStarEins) {
                if (err) {
                  console.error(err);
                  callback(err);
                } else {
                  callback(null);
                }
              });
            },
            code_tbl: function(callback) {
              connection.query("SELECT * FROM code_tbl WHERE charity_id = ?", [singleObj.id], function(err, codeObjects) {
                if (err) {
                  callback(err);
                  console.error(err);
                } else {
                  async.each(codeObjects, function(codeobject, codecallback) {
                    async.series({
                      entity_tbl: function(callback) {
                        connection.query("select * FROM entity_tbl WHERE entity_id = ? and entity_type=?", [codeobject.id, 'code'], function(err, codeEntityData) {
                          if (err) {
                            callback(err);
                            console.error(err);
                          } else {
                            if (codeEntityData && codeEntityData.length > 0) {
                              connection.query("DELETE FROM follow_tbl WHERE entity_id = ?", [codeEntityData[0].id], function(err, guideStarEins) {
                                if (err) {
                                  callback(err);
                                  console.error(err);
                                } else {
                                  client.create({
                                      index: elastic_index,
                                      type: 'entity',
                                      id: codeEntityData[0].id
                                    },
                                    function(err, result4) {
                                      if (err) {
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
                      entity_tbl: function(callback) {
                        connection.query("DELETE FROM entity_tbl WHERE entity_id = ? and entity_type=?", [codeobject.id, 'code'], function(err, guideStarEins) {
                          if (err) {
                            callback(err);
                            console.error(err);
                          } else {
                            callback(null);
                          }
                        });
                      },
                      code_tbl: function(callback) {
                        connection.query("DELETE FROM code_tbl WHERE id = ?", [codeobject.id], function(err, guideStarEins) {
                          if (err) {
                            callback(err);
                            console.error(err);
                          } else {
                            callback(null);
                          }
                        });
                      }
                    }, function(err) {
                      if (err) {
                        codecallback(err);
                      } else {
                        codecallback(null);
                      }
                    });
                  }, function(err) {
                    if (err) {
                      callback(err);
                    } else {
                      callback(null);
                    }
                  });
                }
              });
            },
            status_update_tbl: function(callback) {
              connection.query("select * from entity_tbl where entity_id=? and entity_type=?", [singleObj.id, 'charity'], function(err, entityData) {
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
                                callback(err);
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
              connection.query("DELETE FROM transaction_tbl WHERE charity_id = ?", [singleObj.id], function(err, guideStarEins) {
                if (err) {
                  console.error(err);
                  callback(err);
                } else {
                  callback(null);
                }
              });
            },
            charity_tbl: function(callback) {
              connection.query("SELECT * FROM entity_tbl WHERE entity_id = ? and entity_type=?", [singleObj.id, 'charity'], function(err, charityEntityId) {
                if (err) {
                  console.error(err);
                  callback(err);
                } else {
                  async.parallel({
                    entity_tbl: function(callback) {
                      connection.query("select * FROM entity_tbl WHERE entity_id = ? and entity_type=?", [singleObj.id, 'charity'], function(err, entityInfo) {
                        if (err) {
                          callback(err);
                          console.error(err);
                        } else {
                          if (entityInfo && entityInfo.length > 0) {
                            connection.query("delete  FROM follow_tbl WHERE entity_id = ?", [entityInfo[0].id], function(err, guideStarEins) {
                              if (err) {
                                callback(err);
                                console.error(err);
                              } else {
                                client.create({
                                    index: elastic_index,
                                    type: 'entity',
                                    id: entityInfo[0].id
                                  },
                                  function(err, result4) {
                                    if (err) {
                                      callback(err);
                                    } else {
                                      connection.query("delete  FROM entity_tbl WHERE entity_id = ? and entity_type=?", [singleObj.id, 'charity'], function(err, guideStarEins) {
                                        if (err) {
                                          callback(err);
                                          console.error(err);
                                        } else {
                                          callback(null);
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
                    charity_tbl: function(callback) {
                      connection.query("DELETE FROM charity_tbl WHERE id = ?", [singleObj.id], function(err, guideStarEins) {
                        if (err) {
                          callback(err);
                          console.error(err);
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
            },
            charity_nteecode: function(callback) {
              connection.query("DELETE FROM charity_nteecode WHERE charity_id = ?", [singleObj.id], function(err, guideStarEins) {
                if (err) {
                  console.error(err);
                  callback(err);
                } else {
                  callback(null);
                }
              });
            },
            category_charity_tbl: function(callback) {
              connection.query("DELETE FROM category_charity_tbl WHERE charity_id = ?", [singleObj.id], function(err, guideStarEins) {
                if (err) {
                  console.error(err);
                  callback(err);
                } else {
                  callback(null);
                }
              });
            },
            charity_admin_tbl: function(callback) {
              connection.query("DELETE FROM charity_admin_tbl WHERE charity_id = ?", [singleObj.id], function(err, guideStarEins) {
                if (err) {
                  console.error(err);
                  callback(err);
                } else {
                  callback(null);
                }
              });
            },
            charity_claim_tbl: function(callback) {
              connection.query("DELETE FROM charity_claim_tbl WHERE charity_id = ?", [singleObj.id], function(err, guideStarEins) {
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
