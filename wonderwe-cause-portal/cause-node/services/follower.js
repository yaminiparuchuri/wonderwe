var feedBotService = require('./feedBot');

exports.getFollowerByCharity = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['followerByCharityNoStatus'], [obj.charityId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      // var servicesData = [];
      // if (rows && rows.length > 0) {
      //   async.each(rows, function(singleObject, eachCallback) {

      //     excuteQuery.queryForObject(sqlQueryMap['charityFollwerStatisticCounts'], [singleObject.user_id, singleObject.user_id, singleObject.user_id], function(err, singleRow) {
      //       if (singleRow) {
      //         if (singleRow && singleRow.length > 0) {
      //           singleObject.no_posts = singleRow[0].posts;
      //           singleObject.no_followers = singleRow[0].followers;
      //           singleObject.no_following = singleRow[0].following;
      //         } else {
      //           singleObject.no_posts = 0;
      //           singleObject.no_followers = 0;
      //           singleObject.no_following = 0;
      //         }
      //         servicesData.push(singleObject);
      //         eachCallback(null);
      //       } else {
      //         servicesData.push(singleObject);
      //         eachCallback(null);
      //       }
      //     });
      //   }, function(err) {
      //     if (err) {
      //       callback(err, null);
      //     } else {
      //       servicesData = underscore.sortBy(servicesData, function(num) {
      //         return num.display_name.toLowerCase();
      //       });
      //       callback(null, servicesData);
      //     }
      //   });
      // } else {
      callback(null, rows);
      // }
    }
  });
};

exports.createFollowerCategory = function(categoryObj, callback) {

  var query = excuteQuery.insertAndReturnKey(sqlQueryMap['followerInsert'], [categoryObj.charityId, categoryObj.title], function(err, rows) {

    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO: Check the Updated Rows and See InsertID is Valid Value.
      categoryObj.id = rows.insertId;
      callback(null, categoryObj);
    }
  });

};
// following charity after made a donation
exports.charityFollow=function(followobj,callback){
  var me = this;
  excuteQuery.queryForObject(sqlQueryMap['getEntity'], [followobj.charity_id, 'charity'], function(err, entity) {
    if (err) {
      callback(new Error(err), null);
    } else {
      followobj.entity_id = entity[0].id;
      followobj.entity_type = entity[0].entity_type;
      followobj.slug = entity[0].slug;
      excuteQuery.queryForObject(sqlQueryMap['verifyFollowStatus'], [followobj.user_id, followobj.entity_id], function(err, existingresponse) {
    if (err) {
      callback(new Error(err), null);
    } else {
   if (existingresponse && existingresponse.length) {
    utility.nodeLogs('info', "User already followed this charity");
          callback(null, followobj);
    }else{
     excuteQuery.insertAndReturnKey(sqlQueryMap['follow_insert'], [followobj.user_id, followobj.entity_id, followobj.date_followed], function(err, insertResult) {
            if (err) {
              utility.nodeLogs('ERROR', "Error occured while following the charity");
              callback(new Error(err), null);
            } else {
               callback(null, followobj);
              checkingFollowEmail(followobj, function(err, result) {
            if (err) {
              callback(new Error(err),null);
            utility.nodeLogs('ERROR', "Error occured while checkig the user following the charity or not");
            } else {
            utility.nodeLogs('INFO', "successfully checked the user following the charity or not");
            }
          });
              utility.nodeLogs('INFO', "User followed charity successfully");
            // callback(null, followobj);
            followobj.entity_type="charity";
             me.followUserCharityCode(followobj, function(err, followResult) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  utility.nodeLogs('INFO', "User followed charity successfully");
                }
              });
            }
          });
         }
       }
     });
    }
  });
}
exports.createFollow = function(followobj, callback) {
  var me = this;
  excuteQuery.queryForObject(sqlQueryMap['verifyFollowStatus'], [followobj.user_id, followobj.entity_id], function(err, existingresponse) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (existingresponse && existingresponse.length > 0) {
        if (followobj && followobj.checkcharityfollowornot) {
          callback(null, followobj);
        } else {
          callback({
            error: 'You are already following'
          }, null);
          checkingFollowEmail(followobj, function(err, result) {
            if (err) {

            } else {

            }
          });
        }
      } else {
        if (followobj && followobj.pages) {
          callback(null, null);
        } else {
          excuteQuery.insertAndReturnKey(sqlQueryMap['follow_insert'], [followobj.user_id, followobj.entity_id, followobj.date_followed], function(err, insertResult) {
            if (err) {
              callback(new Error(err), null);
            } else {
              checkingFollowEmail(followobj, function(err, result) {
                if (err) {

                } else {
                  //agenda.now('follow', followobj);
                }
              });
              me.followUserCharityCode(followobj, function(err, followResult) {
                if (err) {
                  callback(err, null);
                } else {
                  callback(null, followobj);
                }
              });
            }
          });
        }
      }
    }
  });
};

exports.followUserCharityCode = function(followobj, callback) {
  async.parallel({
    userFollwing: function(userFollwingCallback) {
      // my user_id condition
      excuteQuery.queryForAll(sqlQueryMap['getEntityUser'], [followobj.user_id, 'user'], function(err, entityResult) {
        if (err) {
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
      callback(new Error(err), null);
    } else {
      callback(err, followobj);
    }
  });
};

exports.charityFollowers = function(term, userId, skip, callback) {
  excuteQuery.queryForAll(sqlQueryMap['followerByCharityStatus'], [userId, term, skip], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.createFollowCharity = function(followobj, callback) {
  //Get the Entity ID Based on CharityID
  //id,user_id,entity_id,date_followed
  var me = this;
  excuteQuery.queryForObject(sqlQueryMap['getEntity'], [followobj.charity_id, 'charity'], function(err, entity) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO:Need to fix the queryForObject Method in db-template module.
      followobj.entity_id = entity[0].id;
      followobj.entity_type = entity[0].entity_type;
      followobj.slug = entity[0].slug;
      me.createFollow(followobj, callback);
    }

  });

};

exports.createFollowCode = function(followobj, callback) {
  //Get the Entity ID Based on CodeID
  var me = this;
  excuteQuery.queryForObject(sqlQueryMap['getEntity'], [followobj.code_id, 'code'], function(err, entity) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (entity && entity.length > 0) {
        followobj.entity_id = entity[0].id;
        followobj.entity_type = entity[0].entity_type;
        followobj.slug = entity[0].slug;
      }
      if (followobj.charity_id) {

        me.createFollow(followobj, function(err, result) {
          if (err) {
            callback(err, null);
          } else {

            excuteQuery.queryForObject(sqlQueryMap['getEntity'], [followobj.charity_id, 'charity'], function(err, entitycharity) {
              if (err) {
                callback(new Error(err), null);
              } else {
                if (entitycharity && entitycharity.length > 0) {
                  followobj.entity_id = entitycharity[0].id;
                  followobj.entity_type = entitycharity[0].entity_type;
                  followobj.slug = entitycharity[0].slug;
                  followobj.checkcharityfollowornot = "charity";
                  me.createFollow(followobj, callback);
                } else {
                  callback(null, result);
                }
              }
            });

          }
        });
      } else {
        me.createFollow(followobj, function(err, result2) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, result2);
          }
        });
      }
    }
  });
};

exports.createFollowUser = function(followobj, callback) {
  //Get the Entity ID Based on UserID
  var me = this;
  excuteQuery.queryForObject(sqlQueryMap['getEntity'], [followobj.followeduser_id, 'user'], function(err, entity) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO: Check the Updated Rows and See InsertID is Valid Value.
      if (entity && entity.length > 0) {
        followobj.entity_id = entity[0].id;
        followobj.entity_type = entity[0].entity_type;
        followobj.slug = entity[0].slug;
      }
      if (followobj.user_id == entity[0].entity_id) {
        callback(err);
      } else {
        me.createFollow(followobj, callback);
        //Added push notification code for follow
        excuteQuery.queryForObject(sqlQueryMap['GetFollowedUserDetails'], [followobj.user_id], function(err, userDetails) {
          if (err) {
            callback(new Error(err), null);
          } else {
            excuteQuery.queryForAll(sqlQueryMap['checkuserId'], [followobj.following_id], function(err, deviceResult) {
              if (err) {
                callback(err);
              } else {
                if (deviceResult && deviceResult.length > 0) {
                  if (deviceResult[0].device_type === 'android') {
                    sendAndroidPushNotification(userDetails[0].name + "(@" + userDetails[0].slug + ") is now following you on WonderWe!", deviceResult[0].device_token, props.domain + '/' + userDetails[0].slug);
                  } else if (deviceResult[0].device_type === 'ios') {
                    sendIosPushNotification(deviceResult[0].device_token, userDetails[0].name + "(@" + userDetails[0].slug + ") is now following you on WonderWe!", props.domain + '/' + userDetails[0].slug);
                  }
                }
              }
            });
          }
        });
        var notifiObj = {};
        notifiObj.entity_id = followobj.entity_id;
        notifiObj.link_id = followobj.user_id;
        if (followobj.notify_type == 'accept') {
          notifiObj.type = 'accept';
        } else {
          notifiObj.type = 'follow';
        }
        notifiObj.user_id = followobj.user_id;
        //utility.socketioNotifications(notifiObj);
        if (followobj && followobj.pages) {

        } else {
          agenda.now('socket io notifications', notifiObj);

        }

      }
    }

  });

};

function checkingFollowEmail(obj, callback) {
  if ((obj.entity_type && obj.entity_type === 'charity') || (obj.entity_type && obj.entity_type === 'code')) {
    excuteQuery.queryForObject(sqlQueryMap['GetAdminEmail'], [obj.charity_id], function(err, adminEmail) {
      if (err) {
        callback(new Error(err), null);
      } else {
        if (adminEmail && adminEmail.length > 0) {
          obj.followUserEmail = adminEmail[0].email;
          //sendingEmail(obj, callback);
          callback(null, obj);
          agenda.now('sendfollowmail', obj);
        } else {
          callback(null, obj);
        }
      }
    });
  } else if (obj.entity_type && obj.entity_type === 'user') {
    excuteQuery.queryForObject(sqlQueryMap['GettingUsermail'], [obj.followeduser_id], function(err, userEmail) {
      if (err) {
        callback(new Error(err), null);
      } else {
        obj.followUserEmail = userEmail[0].email;
        excuteQuery.queryForObject(sqlQueryMap['CheckFollowStatus'], [obj.user_id, obj.followeduser_id], function(err, status) {
          if (err) {
            callback(new Error(err), null);
          } else {
            if (status.length === 0) {
              obj.flag = 'follow';
            }
            //sendingEmail(obj, callback);
            callback(null, obj);
            agenda.now('sendfollowmail', obj);
          }
        });
      }
    });
  }
};

exports.sendingEmail = function(obj, callback) {
  excuteQuery.queryForObject(sqlQueryMap['GetFollowedUserDetails'], [obj.user_id], function(err, userDetails) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (obj && obj.flag === 'follow') {
        obj.buttonText = 'Follow';
        obj.pathUrl = props.domain + "/pages/follow/" + obj.user_id + "/" + obj.followeduser_id + "/" + userDetails[0].name
      } else {
        obj.buttonText = 'View Profile';
        obj.pathUrl = props.domain + "/" + userDetails[0].slug
      }
      if (userDetails && userDetails[0].about_me) {
        var description = userDetails[0].about_me;
      } else {
        var description = '';
      }
      var finalobjectmandril = {};
      finalobjectmandril.email = obj.followUserEmail;
      finalobjectmandril.from = props.fromemail;
      finalobjectmandril.text = "Hai/Hello";
      finalobjectmandril.template_name = "You have a new follower";
      finalobjectmandril.subject = userDetails[0].name + "(@" + userDetails[0].slug + ")" + "is now following you on WonderWe!";
      finalobjectmandril.template_content = [{
        "name": "name",
        "content": "*|FOLLOW_USER_NAME|*"
      }, {
        "name": "username",
        "content": "*|FOLLOW_USER_USERNAME|*"
      }, {
        "name": "description",
        "content": "*|FOLLOW_USER_DESCRIPTION|*"
      }, {
        "name": "description",
        "content": "*|FOLLOW_USER_IMG|*"
      }, {
        "name": "description",
        "content": "*|FOLLOW_USER_URL|*"
      }, {
        "name": "buttontype",
        "content": "*|FOLLOW_STATUS|*"
      }];
      finalobjectmandril.merge_vars = [{
        "name": "FOLLOW_USER_NAME",
        "content": userDetails[0].name
      }, {
        "name": "FOLLOW_USER_USERNAME",
        "content": userDetails[0].slug
      }, {
        "name": "FOLLOW_USER_DESCRIPTION",
        "content": description
      }, {
        "name": "FOLLOW_USER_IMG",
        "content": userDetails[0].profile_pic_url
      }, {
        "name": "FOLLOW_USER_URL",
        "content": obj.pathUrl
      }, {
        "name": "FOLLOW_STATUS",
        "content": obj.buttonText
      }];
      utility.mandrillTemplate(finalobjectmandril, function(err, data) {
        if (err) {
          callback(err);
        } else {
          //utility.log('info', "mail send successfully");
          callback(null, data);
        }
      });
    }
  });
};

exports.unFollow = function(followobj, callback) {
  var me = this;
  excuteQuery.queryForObject(sqlQueryMap['unfollow'], [followobj.entity_id, followobj.user_id], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      /*      excuteQuery.queryForObject(sqlQueryMap['deleteunfollow'], [followobj.entity_id, followobj.user_id], function(err, data) {
              if (err) {
                callback(err, null);
              } else {
                callback(null, followobj);
                agenda.now('unfollowUserCharityCode', followobj);
              }
            });*/
      //callback(null, followobj);

      //agenda.now('unfollowUserCharityCode', followobj);

      me.unfollowUserCharityCodeHandler(followobj, function(err, resultr) {
        if (err) {
          callback(err, null);
        } else {
          excuteQuery.queryForObject(sqlQueryMap['deleteunfollow'], [followobj.entity_id, followobj.user_id, 'follow'], function(err, data) {
            if (err) {
              callback(new Error(err), null);
            } else {
              callback(null, followobj);
            }
          });
        }
      });
    }
  });
};
exports.unfollowUserCharityCodeHandler = function(followobj, callback) {
  async.parallel({
      update_entity: function(userUnFollwingCallback) {
        // my user_id condition
        excuteQuery.queryForAll(sqlQueryMap['getEntityUser'], [followobj.user_id, 'user'], function(err, entityResult) {

          if (err) {
            userUnFollwingCallback(new Error(err), null);
          } else {
            if (entityResult && entityResult.length > 0) {

              var id = entityResult[0].id;

              if (followobj.entity_type == 'charity') {
                var following_charities = parseInt(entityResult[0].following_charities) - 1;
                if (following_charities < 0)
                  following_charities = 0;
                excuteQuery.update(sqlQueryMap['updateUserCharityFollowingCount'], [following_charities, id], userUnFollwingCallback);

              } else if (followobj.entity_type == 'code') {
                var following_code = parseInt(entityResult[0].following_codes) - 1;
                if (following_code < 0)
                  following_code = 0;
                excuteQuery.update(sqlQueryMap['updateUserCodeFollowingCount'], [following_code, id], userUnFollwingCallback);

              } else if (followobj.entity_type == 'user') {
                var following_user = parseInt(entityResult[0].following_users) - 1;
                if (following_user < 0)
                  following_user = 0;
                excuteQuery.update(sqlQueryMap['updateUserFollowingCount'], [following_user, id], userUnFollwingCallback);
              }
            } else {
              userUnFollwingCallback({
                'error': 'something went wrong'
              }, null);
            }
          }

        });
      },
      userUnFollowers: function(userUnFollowerCallback) {

        var id2 = followobj.entity_id;
        excuteQuery.update(sqlQueryMap['updateUserUnFollowersCount'], [id2], userUnFollowerCallback);
      }
    },
    function(err, asyncResult) {
      if (err) {
        callback(err);
      } else {
        callback(err, followobj);
      }
    });
};

exports.unFollowUser = function(followobj, callback) {
  //Get the Entity ID Based on UserID

  var me = this;
  excuteQuery.queryForObject(sqlQueryMap['getEntity'], [followobj.followeduser_id, 'user'], function(err, entity) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO: Check the Updated Rows and See InsertID is Valid Value.
      followobj.entity_id = entity[0].id;
      followobj.entity_type = entity[0].entity_type;
      followobj.slug = entity[0].slug;
      me.unFollow(followobj, callback);
    }
  });
};

exports.unFollowCharity = function(followobj, callback) {
  //Get the Entity ID Based on CharityID
  //id,user_id,entity_id,date_followed
  var me = this;
  excuteQuery.queryForObject(sqlQueryMap['getEntity'], [followobj.charity_id, 'charity'], function(err, entity) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO:Need to fix the queryForObject Method in db-template module.
      followobj.entity_id = entity[0].id;
      followobj.entity_type = entity[0].entity_type;
      followobj.slug = entity[0].slug;
      me.unFollow(followobj, callback);
    }
  });
};

exports.unFollowCode = function(followobj, callback) {
  //Get the Entity ID Based on CodeID
  var me = this;
  excuteQuery.queryForObject(sqlQueryMap['getEntity'], [followobj.code_id, 'code'], function(err, entity) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO: Check the Updated Rows and See InsertID is Valid Value.
      followobj.entity_id = entity[0].id;
      followobj.entity_type = entity[0].entity_type;
      followobj.slug = entity[0].slug;
      me.unFollow(followobj, callback);
    }

  });

};


exports.getNewFollowersByCharity = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['getNewFollowersByDates'], [obj.charityId, obj.fromDate, obj.toDate], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.getNewFollowersByYear = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['getNewFollowersByYear'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.getNewFollowersByMonth = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['getNewFollowersByMonth'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.getNewFollowersByWeek = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['getNewFollowersByWeek'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.getNewFollowersToday = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['getNewFollowersToday'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.getAllPostFollowingFollowers = function(userId, callback) {

  excuteQuery.queryForAll(sqlQueryMap['getFollowersPostFollowing'], [userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.discoverResults = function(term, userId, skip, callback) {
  excuteQuery.queryForAll(sqlQueryMap['discoverQuery'], [userId, term, skip, userId, term, skip, userId, term, skip], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.discoverUsers = function(term, userId, skip, callback) { // shows the data for discover users
  excuteQuery.queryForAll(sqlQueryMap['discoverUsers'], [userId, term, skip], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.discoverCharities = function(term, userId, skip, callback) {
  excuteQuery.queryForAll(sqlQueryMap['discoverCharities'], [userId, term, skip], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.discoverCodes = function(term, userId, skip, callback) {
  excuteQuery.queryForAll(sqlQueryMap['newdiscoverCodes'], [userId, term, skip], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
      // excuteQuery.queryForAll(sqlQueryMap['discoverFundCodes'], [userId, term, skip], function(err, result1) {
      //   if (err) {
      //     callback(err, null);
      //   } else if (result1) {
      //     //callback(null, result1);
      //     async.each(result1, function(object, callback) {
      //       object.fundraiser_userid = object.user_id;
      //       object.fundraiser_codeid = object.id;
      //       object.fundraiser = 'fundraiser';
      //       result.push(object);
      //       callback(null);
      //     }, function(err) {
      //       callback(null, result);
      //     });
      //   }
      // });
    }
  });
};

exports.onlyCampaigns = function(term, userId, skip, callback) {
  excuteQuery.queryForAll(sqlQueryMap['onlyCampaigns'], [userId, term, skip], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
      }
  });
};

exports.getfollowerstatus = function(entity_id, user_id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getfollowerstatus'], [user_id, entity_id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
}

exports.getfollowingUserData = function(following_id, userId, callback) { // The data for when there is a new follower on public profiles
  excuteQuery.queryForAll(sqlQueryMap['getfollowingUserData'], [userId, following_id, userId, following_id, userId, following_id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
