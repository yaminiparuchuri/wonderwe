var mysql = require('mysql');
var async = require('async');

var pool = mysql.createPool({
  /* host: '104.131.114.107',
   user: 'root',
   password: 'wonderwe1$',
   database: "wonderwe_prod"*/

  /*host: '104.236.69.222',
  user: 'root',
  password: 'scriptbees1$',
  database: "prodtest"*/

});
var count = 0;

var connection = pool;


pool.query("select * from charity_tbl where charity_from=?", ['guidestar'], function(err, guideStarEins) {
  if (err) {
    console.log(err);
  } else {
    console.log(guideStarEins);
    async.each(guideStarEins, function(singleObj, eachCallback) {
        connection.query("select * from charity_claim_tbl where charity_id=?", [singleObj.id], function(err, claimCharity) {

          if (err) {
            eachCallback(err);
          } else {
            if (claimCharity && claimCharity.length > 0) {
              console.log(".............." + singleObj.id + "...claimed....." + count++);
              eachCallback(null);
            } else {
              console.log(".............." + singleObj.id + "...unclaimed....." + count++);
              async.parallel({
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
                        async.parallel({
                          entity_tbl: function(callback) {
                            connection.query("DELETE FROM entity_tbl WHERE entity_id = ? and entity_type=?", [codeObjects[0].id, 'code'], function(err, guideStarEins) {
                              if (err) {
                                callback(err);
                                console.error(err);
                              } else {
                                callback(null);
                              }
                            });
                          },
                          code_tbl: function(callback) {
                            connection.query("DELETE FROM code_tbl WHERE id = ?", [codeObjects[0].id], function(err, guideStarEins) {
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
                  charity_tbl: function(callback) {
                    connection.query("SELECT * FROM entity_tbl WHERE entity_id = ? and entity_type=?", [singleObj.id, 'charity'], function(err, charityEntityId) {
                      if (err) {
                        console.error(err);
                        callback(err);
                      } else {

                        async.parallel({
                          entity_tbl: function(callback) {
                            connection.query("DELETE FROM entity_tbl WHERE entity_id = ? and entity_type=?", [singleObj.id, 'charity'], function(err, guideStarEins) {
                              if (err) {
                                callback(err);
                                console.error(err);
                              } else {
                                callback(null);
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
                },
                function(err, results) {
                  if (err) {
                    eachCallback(err);
                  } else {
                    eachCallback(null);
                  }
                });
            }
          }
        });
      },
      function(err) {
        console.log('done well');
      });
  }
});
