var followerService = require('../services/follower');
var charityService = require('./charity');


exports.registerUserOnly = function(obj, visitedUserToken, callback) {
  var me = this;
  var user = obj;
  user.email = user.email.toLowerCase().trim();
  user.name = user.firstname + " " + user.lastname;
  var pass = utility.passwordsaltEncrypt(user.password);
  var defaultUser_id = props.defaultUser_id;
  var defaultCharity_id = props.defaultCharity_id;
  user.fromCampaign = 'yes';

  excuteQuery.queryForAll(sqlQueryMap['checkemail'], [user.email.toLowerCase().trim()], function(err, userResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (userResult && userResult.length > 0) {
        //Need to see what Should Happen Here.
        var error = {};
        error.errors = ['An account already exists for this email address.  If you forgot your password, please go to the login page to reset your password.'];
        error.status = 400;
        callback(new Error(JSON.stringify(error)), null);
        //user.id = userResult[0].id;
        //  me.activationOfAccount(userResult, user, userResult[0].id, pass,visitedUserToken, callback);
      } else {
        user.verification_key = uuid.v4() + "-" + uslug(user.name);
        user.password = pass.password;
        excuteQuery.insertAndReturnKey(sqlQueryMap['registration'], [moment.utc().toDate(), user.name, user.email.toLowerCase().trim(), pass.password, pass.password_salt, user.verification_key], function(err, userid) {
          if (err) {
            callback(new Error(err), null);
          } else {
            user.user_id = userid;
            user.id = userid;
            me.activationOfAccount(userResult, user, userid, pass, visitedUserToken, callback);
          }
        });
      }
    }

  });
};
exports.userRegistration = function(obj, visitedUserToken, callback) {
  var me = this;
  var user = obj;
  user.email = user.email.toLowerCase().trim();
  user.name = user.firstname + " " + user.lastname;
  var pass = utility.passwordsaltEncrypt(user.password);
  var defaultUser_id = props.defaultUser_id;
  var defaultCharity_id = props.defaultCharity_id;
  excuteQuery.queryForAll(sqlQueryMap['checkemail'], [user.email.toLowerCase().trim()], function(err, userResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      // if donor try to claim the charity from out and admin denies it and if try to sign up need to send activation mail
      if (userResult && userResult.length > 0 && userResult[0].date_deleted === null) {
        if (obj.flag) {
          excuteQuery.update(sqlQueryMap['passwordUpdate'], [pass.password, pass.password_salt, 'yes', user.name, user.id], function(err, data) {
            if (err) {
              callback(new Error(err), null);
            } else {
              excuteQuery.queryForAll(sqlQueryMap['getEntity'], [user.id, 'user'], function(err, entityInfo) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  var entityObj = {};
                  entityObj.entity_id = user.id;
                  entityObj.entity_type = 'user';
                  if (entityInfo && entityInfo.length > 0) {
                    entityObj.id = entityInfo[0].id;
                    entityObj.slug = entityInfo[0].slug;
                  }
                  agenda.now('create campaign/donor/charity in elasticsearch', entityObj);

                  if (user && user.referral_id) {
                    excuteQuery.update(sqlQueryMap['referral_update'], [moment().toDate(), user.referral_id], function(err, referralData) {
                      if (err) {
                        callback(new Error(err), null)
                      } else {

                      }
                    });
                  }
                  //TODO send a valid response json format
                  if (obj.type && obj.type === "user") {
                    var followUserObj = {};
                    followUserObj.followeduser_id = obj.followed_id;
                    followUserObj.user_id = user.id;
                    followUserObj.date_followed = moment().toDate();
                    followerService.createFollowUser(followUserObj, function(err, data) {
                      if (err) {
                        callback(err, null);
                      } else {
                        callback(null, followUserObj);
                      }
                    });
                    if (props.environment_type === "production") {
                      if (props.defaultUser_id != obj.followed_id) {
                        me.defaultFollowUser(user.id, function(err, result) {});
                      }
                      me.defaultFollowCharity(user.id, function(err, result) {});
                    }
                  } else if (obj.type && obj.type === "charity") {
                    var followCharityObj = {};
                    followCharityObj.charity_id = obj.followed_id;
                    followCharityObj.user_id = user.id;
                    followCharityObj.following_id = obj.followed_id;
                    followCharityObj.date_followed = moment().toDate();
                    followerService.createFollowCharity(followCharityObj, function(err) {
                      if (err) {
                        callback(err, null);
                      } else {
                        callback(null, followCharityObj);
                      }
                    });
                    if (props.environment_type === "production") {
                      if (props.defaultCharity_id != obj.followed_id) {
                        me.defaultFollowCharity(user.id, function(err, result) {});
                      }
                      me.defaultFollowUser(user.id, function(err, result) {});
                    }
                  }
                }
              });
            }
          });
        } else if (userResult[0] && userResult[0].active == 'yes') {
          if(!userResult[0].password_salt){
         user.verification_key = uuid.v4() + "-" + uslug(user.name);
          user.password = pass.password;
          // Need to update the existing user details with new user details and send an sctivation email to new user
          excuteQuery.update(sqlQueryMap['updateDonorDetails'], [user.name, pass.password, pass.password_salt, user.verification_key, userResult[0].id], function(err, userResult3) {
            if (err) {
              callback(new Error(err), null);
            } else {
              var userid = userResult[0].id;
              me.updateInElasticsearch(userid, function(err, elastciUpdateResult) {});
              utility.setRedisToken({ id: userid }, visitedUserToken, callback);
            }
          });

          }else{
          var errObj = {};
          errObj.errors = ['An account already exists for this email address.  If you forgot your password, please go to the login page to reset your password.'];
          errObj.status = 400;
          callback(new Error(JSON.stringify(errObj)), null);
       }
        } else {


          user.verification_key = uuid.v4() + "-" + uslug(user.name);
          user.password = pass.password;
          // Existing and Not activated user
          // Need to update the existing user details with new user details and send an sctivation email to new user
          excuteQuery.update(sqlQueryMap['updateDonorDetails'], [user.name, pass.password, pass.password_salt, user.verification_key, userResult[0].id], function(err, userResult3) {
            if (err) {
              callback(new Error(err), null);
            } else {
              var userid = userResult[0].id;
              // var userArray = JSON.stringify([user]);

              me.updateInElasticsearch(userid, function(err, elastciUpdateResult) {});

              utility.setRedisToken({ id: userid }, visitedUserToken, callback);

            }
          });
        }
      } else {
        user.verification_key = uuid.v4() + "-" + uslug(user.name);
        user.password = pass.password;

        excuteQuery.insertAndReturnKey(sqlQueryMap['registration'], [moment.utc().toDate(), user.name, user.email.toLowerCase().trim(), pass.password, pass.password_salt, user.verification_key], function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {
            user.id = rows;
            me.activationOfAccount(userResult, user, rows, pass, visitedUserToken, callback);
          }
        });
      }
    }
  });
};

//common function for user activation
exports.activationOfAccount = function(userResult, user, rows, pass, visitedUserToken, callback) {
  var me = this;
  var logsObject = {};
  async.parallel({
    entity: function(entityCallback) {
      var entityObject = {};
      entityObject.entity_id = rows;
      entityObject.entity_type = "user";
      //var count = 1;
      var usrSlug = uslug(user.name);
      var originlSlug = uslug(user.name);

      var userDetailsObject = {
        count: 1,
        name: user.name
      };

      charityService.entitySlugCreation(entityObject, usrSlug, userDetailsObject, originlSlug, function(err, data) {
        if (err) {
          entityCallback(err, null);
        } else {
          console.log('Entity slug creation:');
          entityObject.id = data;
          entityCallback(null, entityObject);
        }
      });
    },
    userProfile: function(profileCallback) {
        var userProfileObj = {};
        userProfileObj.user_id = rows;
        userProfileObj.timezone_id = user.timezone;
        if (user.about_me) {
          userProfileObj.about_me = user.about_me;
        }

        if (user.profile_pic_url) {
          console.log('Profile pic url', user.profile_pic_url);
          userProfileObj.profile_pic_url = user.profile_pic_url;
        }

        if (user.about_me) {
          console.log('About me', user.about_me);
          userProfileObj.about_me = user.about_me;
        }

        excuteQuery.queryForAll(sqlQueryMap['userIdAndUserProfile'], [userProfileObj], profileCallback)
      }
      //  token:function(callback){
      //    callback(null,token);
      //  }
  }, function(err, userResult) {
    if (err) {
      callback(err, null);
    } else {
      //for updating the user profile address
      if (user.address && user.address.state_name && user.address.country_id) {
        me.updateProfileAddress(user, function(err, result) {
          if (err) {
            logsObject.message = "Error in updating the user address";
            utility.nodeLogs('ERROR', logsObject);
          } else {
            utility.nodeLogs('INFO', 'Successfully updated user address')
          }
        })
      }

      user.id = rows;
      var userid = rows;
      userResult.user_id = userid;

      me.updateInElasticsearch(userid, function(err, elastciUpdateResult) {});

      var followUserObj = {};
      followUserObj.followeduser_id = props.botId;
      followUserObj.user_id = rows;
      followUserObj.date_followed = moment.utc().toDate();
      followerService.createFollowUser(followUserObj, function(err, data) {});

      utility.generateRedisTokenForLogin(userid, visitedUserToken, function(err, result1) {
        //utility.setRedisToken({ id: userid }, function(err, result1) {
        if (err) {
          callback(err, null);
        } else {

          if (user.fromCampaign === 'yes') {
            userResult.token = result1;
          } else {
            userResult.token = result1.token;
          }

          if (user.invited_id) {
            var date = moment.utc().toDate();
            excuteQuery.insertAndReturnKey(sqlQueryMap['referral'], [null, user.invited_id, rows, date, null], function(err, referral_id) {
              if (err) {
                callback(err, null);
              } else {
                callback(null, userResult);
              }
            });
          } else {
            callback(null, userResult);
          }
        }
      });
    }
  });

};

exports.resendDonorActivationEmail = function(obj, callback) {
  var value = "";
  var sqlQuery = "";

  if (obj.userid) {
    sqlQuery = "select * from user_tbl where id =?";
    value = obj.userid;
  } else {
    sqlQuery = "select * from user_tbl where email =?";
    value = obj.email;
  }
  var me = this;
  pool.query(sqlQuery, [value], function(err, userResult) {
    if (err) {
      res.send(err);
    } else {
      //  var userObj = userResult[0];
      //   var user_id = userResult[0].id;
      me.sendActivationEmail(userResult[0], userResult[0].id, "", function(err, result) {
        callback(null, {
          'msg': 'Email send successfully...'
        });
      });
    }
  });
};

exports.sendActivationEmail = function(user, userid, referral_id, callback) {

  //var userArray = JSON.stringify([user]);
  // tokenGenerate(userArray, userid, function(err, result1) {
  //   if (err) {
  //     callback(err, null);
  //   } else {
  //Added Mandrill Actount activation Template
  var finalobjectmandril = {};
  finalobjectmandril.from = props.fromemail;
  finalobjectmandril.email = user.email;
  finalobjectmandril.text = "";
  finalobjectmandril.subject = "Activate your WonderWe account";
  finalobjectmandril.template_name = "Sign Up Confirmation";
  finalobjectmandril.template_content = [{
    "name": "email",
    "content": "*|EMAIL|*"
  }, {
    "name": "confirmationlink",
    "content": "*|CONFIRMLINK|*"
  }];
  finalobjectmandril.merge_vars = [{
    "name": "EMAIL",
    "content": user.name
  }, {
    "name": "CONFIRMLINK",
    "content": props.domain + "/auth/account/activation/" + user.verification_key + '?referral_id=' + referral_id + '&user_mobile_login=true'
  }];

  utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, reuslt);
    }
  });
  //}
  //});
}
exports.userAutoLogin = function(userId, visitedUserToken, callback) {
  excuteQuery.queryForAll(sqlQueryMap['password'], [userId], function(err, resultUser) {
    if (err) {
      utility.logException(err);
      callback(err, null);
    } else if (resultUser.length > 0) {
      var user = resultUser[0];
      if (resultUser[0].active === "yes") {
        excuteQuery.queryForAll(sqlQueryMap['autoLoginSql'], [userId], function(err, result) {
          if (err) {
            callback(new Error(err), null);
          } else if (result.length > 0) {
            var userid = result[0].user_id;
            var userData = JSON.stringify(result);


            utility.generateRedisTokenForLogin(userid, visitedUserToken, function(err, resultToken) {

              //utility.setRedisToken({ id: userid }, function(err, resultToken) {

              //tokenGenerate(userData, userid, function(err, resultToken) {
              if (err) {
                utility.logException(err);
                callback(err, null);
              } else {
                callback(null, resultToken);
              }

            });
          } else {

            callback(new Error(JSON.stringify({
              'errors': ['Username and Password mismatch.'],
              status: 400
            })), null);
          }
        });

      } else {
        utility.log('error', "You have not activated your account yet, please activate your account" + user.email);
        callback(new Error(JSON.stringify({
          'errors': ['You have not activated your account yet, please activate your account.'],
          status: 400
        })), null);
      }
    } else {
      if (user && user.email) {
        utility.log('error', "Email does not exist, please provide a valid email" + user.email);
      }
      callback(new Error(JSON.stringify({
        'errors': ['Email does not exist, please provide a valid email'],
        status: 400
      })), null);
    }
  });
}

exports.userLogin = function(obj, visitedUserToken, callback) {
  var user = obj;
  user.email = user.email.toLowerCase();
  user.password = user.password;
  excuteQuery.queryForAll(sqlQueryMap['login_sqlcheck'], [user.email], function(err, resultUser) {
    if (err) {
      utility.logException(err);
      callback(new Error(err), null);
    } else if (resultUser.length > 0 && (resultUser[0].password_salt || resultUser[resultUser.length-1].provider != 'Wonderwe')) {
      if (resultUser[resultUser.length-1].date_deleted !== null) {
        utility.log('error', "This account has already been deleted.Please contact support@wonderwe.com to get back your account" + user.email);
        callback(new Error(JSON.stringify({
          'errors': ['This account has already been deleted'],
          status: 400
        })), null);
      } else {
        if (resultUser[resultUser.length-1].provider != 'Wonderwe') {
          utility.log('error', " You have tried login with " + resultUser[resultUser.length-1].provider + " already in previous with " + user.email);
          callback(new Error(JSON.stringify({
            'errors': ['Please use ' + resultUser[resultUser.length-1].provider + ' to log in.'],
            status: 400
          })), null);
        } else if (resultUser[resultUser.length-1].active === "yes") {
          var pass = utility.passwordEncrypt(user.password, resultUser[resultUser.length-1].password_salt);

          excuteQuery.queryForAll(sqlQueryMap['login_sql'], [user.email, pass.password], function(err, result) {
            if (err) {
              callback(new Error(err), null);
            } else if (result.length > 0) {
              var userid = result[result.length-1].user_id;
              console.log('user data length:', result.length);
              var userData = JSON.stringify(result);

              //utility.setRedisToken({ id: userid }, callback);

              utility.generateRedisTokenForLogin(userid, visitedUserToken, callback);

              /*tokenGenerate(userData, userid, function(err, resultToken) {
                if (err) {
                  utility.logException(err);
                  callback(err, null);
                } else {
                  callback(null, resultToken);
                }

              });*/
            } else {
              utility.log('error', "Username and Password mismatch" + user.email);
              callback(new Error(JSON.stringify({
                'errors': ['Username and Password mismatch.'],
                status: 400
              })), null);
            }
          });
        } else {
          utility.log('error', "You have not activated your account yet, please activate your account" + user.email);
          callback(new Error(JSON.stringify({
            'errors': ['You have not activated your account yet, please activate your account.<a id="resendactivationlink">Click here to resend activation email</a>'],
            status: 400
          })), null);
        }
      }
    } else {
      if(resultUser[0]){
         utility.log('error', "Email exist,We have sent an email to your Email" + user.email);
      callback(new Error(JSON.stringify({
        'errors': ['You already have an account ,<a id="js-setPassword">Click here </a> to reset the password'],
        status: 400
      })), null);

      }else{
      utility.log('error', "Email does not exist, please provide a valid email" + user.email);
      callback(new Error(JSON.stringify({
        'errors': ['Email does not exist, please provide a valid email'],
        status: 400
      })), null);
    }
    }
  });
};
exports.getOrganizations = function(userid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCharitiesByUser'], [userid], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, data);
    }
  });

};

exports.accountActivation = function(verification_key, referral_id, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['verification'], [verification_key], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (data && data.length > 0) {
        var userObj = data[0];
        userObj.user_id = userObj.id;
        if (data[0].active == 'yes') {
          //  userObj.user_id = userObj.id;

          if (props.environment_type === "production") {
            me.defaultFollowUser(userObj.user_id, function(err, result) {});
            me.defaultFollowCharity(userObj.user_id, function(err, result) {});
          }
          callback(null, userObj);
          //res.redirect(props.domainname);
          //res.send("Your account has already been activated, Please login");
        } else {
          if (referral_id) {
            excuteQuery.update(sqlQueryMap['referral_update'], [moment().toDate(), referral_id], function(err, referralData) {
              if (err) {
                callback(new Error(err), null);
              } else {

              }
            });
          }
          data.active = 'yes';
          excuteQuery.queryForAll(sqlQueryMap['activationUpdate'], [moment.utc().toDate(), 'yes', verification_key], function(err, data2) {
            if (err) {
              callback(new Error(err), null);
            } else {
              userObj.user_id = userObj.id;
              callback(null, userObj);

              excuteQuery.queryForAll(sqlQueryMap['getEntity'], [userObj.id, 'user'], function(err, entityInfo) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  var entityObj = {};
                  entityObj.entity_id = userObj.id;
                  entityObj.entity_type = 'user';
                  if (entityInfo && entityInfo.length > 0) {
                    entityObj.id = entityInfo[0].id;
                    entityObj.slug = entityInfo[0].slug;
                  }
                  agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
                }
              });
            }
          });
          if (props.environment_type === "production") {
            me.defaultFollowUser(userObj.user_id, function(err, result) {});
            me.defaultFollowCharity(userObj.user_id, function(err, result) {});
          }

        }

      } else {
        callback(new Error(JSON.stringify({
          "errors": ["Link has been expired already, please activate by contacting us."],
          status: 400
        })), null);
      }
    }
  });
};

exports.defaultFollowUser = function(user_id) {
  // if (props.environment_type === "development") {
    var followObj = {};
    followObj.user_id = user_id;
    followObj.following_id = props.defaultUser_id;
    followObj.followeduser_id = props.defaultUser_id;
    followObj.date_followed = moment().toDate();
    followerService.createFollowUser(followObj, function(err, result) {
      if (err) {

      } else {

      }
    });
  // }
};

exports.defaultFollowCharity = function(user_id) {
  // if (props.environment_type === "development") {
    var followObj = {};
    followObj.user_id = user_id;
    followObj.following_id = props.defaultCharity_id;
    followObj.charity_id = props.defaultCharity_id;
    followObj.date_followed = moment().toDate();
    followerService.createFollowCharity(followObj, function(err, result) {
      if (err) {

      } else {

      }
    });
  // }
};

function tokenGenerate(user, userid, callback) {

  //var expires = moment().add(7, 'days').valueOf();
  var token = jwt.encode({
    iss: userid,
    //exp: expires
  }, app.get('jwtTokenSecret'));

  async.series({
    setToken: function(callback) {
      redisClient.set(token, user, callback);
    },
    /*    expireToken: function(callback) {
          redisClient.expire(token, expires, callback);
        }*/
  }, function(err, result) {
    if (err) {

      callback(new Error(err), null);
    } else {
      if (result.setToken) {
        // if (result.expireToken) {
        callback(null, {
          token: token,
          //expires: result.expireToken
          //user : user
        });
        /*    } else {
              utility.log('error', "Your token has expired with redis" + user.email);
              callback({
                "error": "Your token has expired with redis"
              }, null);
            }*/
      } else {
        utility.log('error', "Token not set in redis" + user.email);
        callback(new Error(JSON.stringify({
          "errors": ['Token not set in redis'],
          status: 400
        })), null);
      }
    }
  });

}


function sendConfirmEmailToUser(user, callback) {
  var tempdata = {};
  tempdata.name = user.name;
  tempdata.verification_key = props.domain + "/auth/account/activation/" + user.verification_key;
  app.render("./emails/activation", tempdata, function(err, html) {
    if (err) {
      callback(err, null);
    } else {
      var mailOptions = {
        from: props.fromemail, // sender address
        to: user.email, // list of receivers
        subject: "Activate Your Account", // Subject line
        text: "Hello world ✔", // plaintext body
        html: html // html body
      };
      mail.sendEmail(mailOptions, function(err, data) {
        if (err) {
          callback(err, null);

        } else {
          callback(null, data);
        }
      });
    }

  });

}

exports.verifyemailExists = function(email, callback) {
  excuteQuery.queryForAll(sqlQueryMap['checkemail'], [email], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (data.length > 0) {
        if (data[0].date_deleted != null) {
          callback(new Error(JSON.stringify({
            "errors": ['This user account has been already deleted.Please enter valid Email'],
            status: 400
          })), null);
        } else {
          callback(null, data);
        }
      } else {
        callback(new Error(JSON.stringify({
          "errors": ['We cannot find a user account for the email address you entered.  Please try a different email address or register for a new account.'],
          status: 400
        })), null);
      }
    }
  });
};

exports.getUserByEmail = function(email, callback) {
  excuteQuery.queryForAll(sqlQueryMap['checkemail'], [email], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, data);
    }
  });
}


exports.donorDefaultLogin = function(obj, visitedUserToken, callback) {
  excuteQuery.queryForAll(sqlQueryMap['donor_default_login'], [obj.userid], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result && result.length > 0) {
      var userid = result[0].user_id;
      var user = JSON.stringify(result);

      utility.generateRedisTokenForLogin(userid, visitedUserToken, function(err, resultToken) {
        // utility.setRedisToken({ id: userid }, function(err, resultToken) {
        // tokenGenerate(user, userid, function(err, resultToken) {
        if (err) {
          callback(new Error(err), null);
        } else {
          callback(null, resultToken);
        }

      });
    } else {
      callback(new Error(JSON.stringify({
        'errors': ['Username and Password mismatch.'],
        status: 400
      })), null);
    }
  });
};
exports.makuUserSuperAdmin = function(email, callback) {
  excuteQuery.update(sqlQueryMap['update_default_super_admin'], [email], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, result);
    }
  });
};
exports.resendActivationEmail = function(email, callback) {
  excuteQuery.queryForAll(sqlQueryMap['checkemail'], [email], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, result[0]);
      var object = {};
      object.user = result[0];
      object.userId = result[0].id;
      object.pass = '';
      agenda.now('sendActivationEmail', object);
    }
  });
};

exports.insertUserDeviceToken = function(token, userid, type, callback) {
  excuteQuery.queryForAll(sqlQueryMap['checkuserId'], [userid], function(err, userResult) {
    if (err) {
      callback(new Error(err), null);
    } else {

      if (userResult && userResult.length > 0) {
        excuteQuery.update(sqlQueryMap['userDeviceTokenUpdate'], [token, type, userid], function(err, data) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(null, userResult);
          }
        });
      } else {
        excuteQuery.insertAndReturnKey(sqlQueryMap['userDeviceTokenInsert'], [userid, token, type], function(err, data) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(null, userResult);
          }
        });
      }
    }
  });
};

exports.deleteDeviceToken = function(userid, token, callback) {
  excuteQuery.queryForAll(sqlQueryMap['deleteDeviceToken'], [userid, token], function(err, userResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, userResult);
    }
  });
};

exports.userRegistrationWithoutPassword = function(data, callback) {
  var user = data;
  var me = this;
  user.name = data.first_name + ' ' + data.last_name;
  user.active = 'yes';
  user.verification_key = uuid.v4() + "-" + uslug(user.name);
  var pass = utility.passwordsaltEncrypt(user.password);
  me.getUserByEmail(data.email, function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      if (result[0]) {
        callback({ error: 'EMAIL_ALREADY_EXISTS', flag: true }, null);
      } else {
        excuteQuery.insertAndReturnKey(sqlQueryMap['userRegistrationWithoutPassword'], [moment.utc().toDate(), user.name, user.email.toLowerCase().trim(), user.active, user.verification_key, pass.password, pass.password_salt], function(err, rows) {
          if (err) {
            callback(err, null);
          } else {
            //callback(null,result);
            async.parallel({
              entity: function(entityCallback) {
                var entityObject = {};
                entityObject.entity_id = rows;
                entityObject.entity_type = "user";
                //var count = 1;
                var usrSlug = uslug(user.name);
                var originlSlug = uslug(user.name);

                var userDetailsObject = {
                  count: 1,
                  name: user.name
                };

                charityService.entitySlugCreation(entityObject, usrSlug, userDetailsObject, originlSlug, function(err, data) {
                  if (err) {
                    console.log('Error in entity slug creation');
                    entityCallback(err, null);
                  } else {
                    entityObject.id = data;
                    entityCallback(null, entityObject);
                  }
                });
              },
              userProfile: function(profileCallback) {
                var userProfileObj = {};
                userProfileObj.user_id = rows;
                userProfileObj.timezone_id = user.timezone;
                userProfileObj.city = data.address.city;
                userProfileObj.country = data.address.country_id;
                userProfileObj.postal_code = data.address.postal_code;
                excuteQuery.queryForAll(sqlQueryMap['getStateCode'], [data.address.state_name, data.address.country_id], function(err, result) {
                  if (err) {
                    profileCallback(err, null);
                  } else {
                    if (result[0]) {
                      userProfileObj.state = result[0];
                    } else {
                      userProfileObj.state = null;
                    }
                    console.log('userProfileObj');
                    excuteQuery.queryForAll(sqlQueryMap['userProfileAndAddress'], [userProfileObj.user_id, userProfileObj.timezone_id, userProfileObj.postal_code, userProfileObj.country, userProfileObj.state, userProfileObj.city], profileCallback);
                  }
                });
              }
            }, function(err, userResult) {
              if (err) {
                console.log(err);
                callback('Error in creating entity to user', null);
              } else {
                me.donorDefaultLogin({
                  userid: rows
                }, function(err, result) {
                  if (err) {
                    callback(err, null);
                  } else {
                    callback(null, { user_id: rows, token: result.token });
                  }
                });

              }
            });
          }
        });
      }
    }
  });
}


exports.getPostalInformation = function(postal_code, callback) {
  console.log(postal_code);
  request('http://maps.googleapis.com/maps/api/geocode/json?address=' + postal_code, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var array = JSON.parse(body);
      var locationDetails = {};
      locationDetails.postal_code = postal_code;
      if (array && array.results[0] && array.results[0].address_components) {
        async.each(array.results[0].address_components, function(data, callback) {
          if (data.types[0] === "administrative_area_level_1") {
            locationDetails.state = data.long_name;
          }
          if (data.types[0] === "country") {
            locationDetails.country = data.short_name;
          }
          if (data.types[0] === "locality") {
            locationDetails.city = data.long_name;
          }
          callback(null);
        }, function(err) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, locationDetails);
          }
        });
      } else {
        callback(null, null);
      }
    } else {
      callback('Details failed', null);
    }
  });
};

exports.getProfileAndCharitiesByEmail = function(email, callback) {
  var user;
  excuteQuery.queryForAll(sqlQueryMap['userProfileByEmail'], [email], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      if (result[0]) {
        user = result[0];
        charityService.getCharityData(user.id, function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            user.charities = result;
            callback(null, user);
          }
        });
        //  callback(null,result[0]);
      } else {
        callback('NO_USER_FOUND', null);
      }

    }
  });
}

exports.updateProfileAddress = function(data, callback) {

  var state;

  excuteQuery.queryForAll(sqlQueryMap['getStateCode'], [data.address.state_name, data.address.country_id], function(err, result) {
    if (err) {
      callback({ error: 'USER_PROFILE_ADDRESS_ERROR' }, null);
    } else {
      if (result[0]) {
        state = result[0].id;
      } else {
        state = null;
      }
      //UPDATE user_profile_tbl SET state=?,country=?,city=?,postal_code =? WHERE user_id=?
      excuteQuery.queryForAll(sqlQueryMap['userProfileUpdate'], [state, data.address.country_id, data.address.city, data.address.postal_code, data.id], function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result);
        }
      })

    }
  })
}
exports.updateInElasticsearch = function(userid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getEntity'], [userid, 'user'], function(err, entityInfo) {
    if (err) {
      callback(err, null);
    } else {
      var entityObj = {};
      entityObj.entity_id = userid;
      entityObj.entity_type = 'user';
      if (entityInfo && entityInfo.length > 0) {
        entityObj.id = entityInfo[0].id;
        entityObj.slug = entityInfo[0].slug;
      }
      agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
      callback(null, 'done');
    }
  });
}

exports.checkUserByEmail = function(email, callback) {
  excuteQuery.queryForAll(sqlQueryMap['checkemail'], [email], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (result.length && result[0] && result[0].date_deleted === null) {
        callback(null, result[0]);
      } else {
        callback(null, null);
      }
    }
  });
};


/**
 * saveProviderToken  This is using to updating provider access token like facebook .
 * This function will saves profile picture and description if the user profile table
 * does not contains .
 * @param  {[type]}   user             [description]
 * @param  {[type]}   fbUser           [description]
 * @param  {[type]}   visitedUserToken [description]
 * @param  {Function} callback         [description]
 * @return {[type]}                    [description]
 */
exports.saveProviderToken = function(user, fbUser, visitedUserToken, callback) {
 
  var me = this;
  var logsObject = {
    user: user
  };

  async.parallel({
    updateAboutMe: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['getProfileByUserId'], [user.id], function(err, result) {
        if (err) {
          logsObject.message = 'Error in getting profile picture by user id in the process of updating facebook profile pic and description'
          utility.nodeLogs('ERROR', logsObject);
          //Just skipping this method if there is error because we can not stop the process because of this failure
          callback(null, true);
        } else {
          result = result[0];
          if (!result.about_me) {
            result.about_me = fbUser.bio;
          }

          //updating userprofile address
          if ((!result.country) && (!result.state) && (!result.country)) {
            if (user.address && user.address.state_name && user.address.country_id) {
              me.updateProfileAddress(user, function(err, result) {
                if (err) {
                  logsObject.message = "Error in updating the user profile address";
                  utility.nodeLogs('ERROR', logsObject);
                } else {
                  utility.nodeLogs('INFO', 'Successfully updated User address fields');
                }
              });
            }
          }

          if (result.profile_pic_url == props.default_profile_pic_url) {
            result.profile_pic_url = fbUser.picture.data.url;
            utility.fileUpload(result.profile_pic_url, 'profile_pic', function(err, profilePicResult) {
              if (err) {
                logsObject.message = 'Error in updating profic picture for facebook existing account users';
                utility.nodeLogs('ERROR', logsObject);
                callback(null, true);
              } else {
                result.profile_pic_url = profilePicResult.url;
                excuteQuery.queryForAll(sqlQueryMap['updateAboutMeAndProfiePic'], [result.profile_pic_url, result.about_me, result.id], function(err, result) {
                  if (err) {
                    logsObject.message = 'Error in updating profile picture and description into database in login with facebook';
                    utility.nodeLogs('ERROR', logsObject);
                    callback(null, true);
                  } else {
                    utility.nodeLogs('INFO', 'Successfully updated profile pic and description');
                    callback(null, result);
                  }
                });
              }
            });
          } else {
            excuteQuery.queryForAll(sqlQueryMap['updateAboutMeAndProfiePic'], [result.profile_pic_url, result.about_me, result.id], function(err, result) {
              if (err) {
                logsObject.message = 'Error in updating profile picture and description into database in login with facebook';
                utility.nodeLogs('ERROR', logsObject);
                callback(null, true);
              } else {
                callback(null, result);
              }
            });
          }
        }
      });
    },
    updateProviderToken: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['updateProviderToken'], [user.access_token, user.provider, user.id], function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result);
        }
      });
    },
    socialLogin: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['social_login_sql'], [user.email], function(err, userDataResult) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, userDataResult);
        }
      });
    }
  }, function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      utility.generateRedisTokenForLogin(user.id, visitedUserToken, function(err, redisResult) {
        if (err) {
          callback(err, null);
        } else {
          if (result.socialLogin[0].charity_id) {
            redisResult.switch = true;
          }
          callback(null, redisResult);
        }
      });
    }
  });
};


exports.createSocialUser = function(user, visitedUserToken, callback) {
  var me = this;
  user.name = user.first_name + " " + user.last_name;
  excuteQuery.insertAndReturnKey(sqlQueryMap['social_user_registration'], [moment.utc().toDate(), user.name, user.email.toLowerCase().trim(), user.provider, user.provider_access_token,user.id], function(err, userid) {
    if (err) {
      callback(err, null);
    } else {
      user.user_id = userid;
      user.id = userid;
      if (user.bio) {
        user.about_me = user.bio;
      }
      if (user.picture.data.url) {
        utility.fileUpload(user.picture.data.url, 'profile_pic', function(err, result) {
          if (err) {
            utility.nodeLogs('INFO', 'Error in getting user profile');
            utility.nodeLogs('ERROR', { error: err });
            callback(err, null);
          } else {
            user.profile_pic_url = result.url;
            me.activationOfAccount(null, user, userid, null, visitedUserToken, callback);
          }
        });
      } else {
        me.activationOfAccount(null, user, userid, null, visitedUserToken, callback);
      }

    }
  });
};

/**
 * Used to move the entire user record to cancel_user_tbl
 * @param  {[type]}   user_id  [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
exports.moveDeletedUser = function(user_id,callback){
  excuteQuery.queryForAll(sqlQueryMap['checkemailact'],[user_id],function(err,result){
    if(err){
      callback(err,null);
    }else{
      excuteQuery.insertAndReturnKey(sqlQueryMap['moveDeletedUser'],result[0],function(err,row){
        if(err){
          callback(err,null);
        }else{          
          excuteQuery.queryForAll(sqlQueryMap['deleteUser'],result[0].id,function(err,result){
            if(err){
              utility.nodeLogs('ERROR',{
                message:'deletedUser Record'
              });
              callback(err,null);
            }else{
              callback(null,{success:true})
            }          
          });
        }
      });
    }
  });
}
exports.tokenGenerate = tokenGenerate;
