var donationServices = require('../services/donations');
var charityService = require('../services/charity');
var elasticService = require('../services/elastic')
var codeService = require('../services/code')
var wepayService = require('./wepay');
// Used by settingsRouter for donor settings /settings/:userId
exports.accountDetails = function(userId, callback) {

  excuteQuery.queryForAll(sqlQueryMap['profileinfo'], [userId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });

};

exports.emailnotificationsUserId = function(userId, callback) {

  excuteQuery.queryForAll(sqlQueryMap['mailid'], [userId], function(err, rows) {

    if (err) {
      callback(new Error(err), null);

    } else {

      callback(null, rows);
    }
  });

};
exports.getAdditionalFeatures = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getAdditionalFeatures'], [obj.user_id], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  })
};
exports.saveAdditonalFeatures = function(data, callback) {
  data.date_created = moment.utc().toDate();
  if (data.checked == "yes") {
    excuteQuery.queryForAll(sqlQueryMap['saveAdditonalFeatures'], [data.user_id, data.feature_id, data.date_created], function(err, result) {
      if (err) {
        console.log(err);
        callback(err, null);
      } else {
        callback(null, result);
      }
    });
  } else {
    excuteQuery.queryForAll(sqlQueryMap['deleteAdditonalFeatures'], [data.user_id, data.feature_id], function(err, result) {
      if (err) {
        console.log(err);
        callback(err, null);
      } else {
        callback(null, result);
      }
    });
  }
};
exports.emailnotificationsUserIdput = function(emailid, userId, callback) {

  excuteQuery.update(sqlQueryMap['updatemail'], [emailid, userId], function(err, rows) {

    if (err) {
      callback(new Error(err), null);

    } else {

      callback(null, rows);
    }
  });

};

exports.organizationsServices = function(orgName, callback) {

  excuteQuery.queryForAll(sqlQueryMap['orgname'], [orgName], function(err, rows) {

    if (err) {
      callback(new Error(err), null);

    } else {

      callback(null, rows);
    }
  });

};

exports.getWwCategories = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getWwCategories'], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.getDonorWwCategories = function(obj, callback) {
  var userid = obj.userid;
  pool.query("select * from ww_user_category_tbl where user_id=?", [parseInt(userid)], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {

      var prefObj = {};

      if (rows && rows.length > 0) {
        prefObj.preferences = underscore.pluck(rows, 'category_id');
      } else {
        prefObj.preferences = [];
      }
      prefObj.userid = userid;
      callback(null, prefObj);
    }
  });
};
exports.saveFundraisePreferences = function(preferencesObj, callback) {
  pool.query("DELETE FROM ww_code_category_tbl WHERE code_id = ?", [preferencesObj.code_id], function(err, removedResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      var sql = "INSERT INTO ww_code_category_tbl (category_id, code_id) VALUES (?, ?)";
      pool.query(sql, [preferencesObj.preferences, preferencesObj.code_id], function(err, removedResult) {
        if (err) {
          callback(new Error(err), null);
        } else {
          callback(null, preferencesObj);
        }
      });
    }
  });
};

exports.saveDonorPreferences = function(preferencesObj, callback) {
  //TODO remove all records of a donor and insert the new preferences for a donor
  var data = [];
  underscore.map(preferencesObj.preferences, function(num) {
    if (num && num.length > 1) {
      var newArray = num.split(',');
      underscore.map(newArray, function(newNum) {
        data.unshift([newNum, preferencesObj.userid]);
      });
      return null;
    } else {
      data.unshift([num, preferencesObj.userid]);
      return null;
    }
  });
  pool.query("DELETE FROM ww_user_category_tbl WHERE user_id = ?", [preferencesObj.userid], function(err, removedResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (preferencesObj.preferences && preferencesObj.preferences.length > 0) {
        var sql = "INSERT INTO ww_user_category_tbl (category_id, user_id) VALUES ?";
        pool.query(sql, [underscore.compact(data)], function(err, removedResult) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(null, preferencesObj);
          }
        });
      } else {
        callback(null, preferencesObj);
      }
    }
  });
};


exports.validationEmail = function(Obj, callback) {
console.log(Obj);
  var email = Obj.email;


  excuteQuery.queryForAll(sqlQueryMap['checkemail'], [email], function(err, objResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      // create code validation condition
      if (Obj.typeOfMode == 'create') {
        if (objResult && objResult.length > 0) {
          callback(null, {
            msg: 'exists'
          });
        } else {
          callback(null, {
            msg: 'success'
          });
        }
      } else if (Obj.admin) {
        console.log("admin");
        console.log(objResult)
        if (objResult && objResult.length && objResult[0].date_deleted != null) {
          callback(null, {
            msg: 'cancelled'
          });
        } else {
          callback(null, {
            msg: 'success'
          });
        }

      } else {
        // Update Code validation condition

        if (objResult && objResult.length > 0) {

          if (email == Obj.orgiginal) {
            callback(null, {
              msg: 'success'
            });
          } else {
            callback(null, {
              msg: 'exists'
            });
          }
        } else {
          callback(null, {
            msg: 'success'
          });
        }
      }
    }
  });
};


// exports.accountDetailsUpdate = function(obj, callback) {

//   excuteQuery.update(sqlQueryMap['updateUserProfileInfo'], [obj.about_me, obj.address_1, obj.address_2, obj.phone, obj.city, obj.state, obj.postal_code, obj.gender, obj.relationship, obj.religious_affiliation, obj.profile_pic_url, obj.id], function(err, rows) {

//     if (err) {
//       callback(err);
//     } else {
//       excuteQuery.update(sqlQueryMap['updateUserInfo'], [obj.name, obj.email, 1, obj.id], function(err, rowsData) {
//         if (err) {
//           callback(err);
//         } else {
//           callback(null, obj);
//         }
//       });
//     }
//   });
// };

exports.changePassword = function(obj, callback) {
  var password = obj.currentPassword;
  var newpassword = obj.newPassword;

  excuteQuery.queryForAll(sqlQueryMap['password'], [obj.id], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (rows.length > 0) {
        var passwordSalt = rows[0].password_salt;
        var pass = utility.passwordEncrypt(password, passwordSalt);
        if (pass.password === rows[0].password) {
          var newpass = utility.passwordEncrypt(newpassword, passwordSalt);
          excuteQuery.update(sqlQueryMap['updatePassword'], [newpass.password, obj.id], function(err, rowsData) {
            if (err) {
              callback(new Error(err), null);
            } else {
              callback(null, rowsData);
            }
          });
        } else {
          callback(new Error(JSON.stringify({
            "errors": ["Invalid current password"],
            status: 400
          })), null);
        }
      } else {
        callback(new Error(JSON.stringify({
          "errors": ["invalid  id"],
          status: 400
        })), null);
      }
    }
  });

}

exports.accountDetailsUpdate = function(obj, callback) {
  var slug;
  async.parallel({
    userProfile: function(profileCallback) {

      if (obj.state === 'select') {
        obj.state = null;
      }
      if (obj.country === 'select') {
        obj.country = null;
      }

      if (obj.timezone && obj.timezone != '') {
        obj.timezone = parseInt(obj.timezone);
      }
      // calculate new profile completion and save that too
      var completetionCount = calculateProfileCompletion(obj);
      excuteQuery.update(sqlQueryMap['updateUserProfileInfo'], [obj.about_me, obj.address_1, obj.address_2, obj.phone, obj.city, obj.state, obj.postal_code, obj.gender, obj.relationship, obj.religious_affiliation, obj.profile_pic_url, obj.timezone, obj.country, completetionCount, obj.background_pic_url, obj.id], profileCallback);

    },
    user: function(userCallback) {
      excuteQuery.update(sqlQueryMap['updateUserInfo'], [obj.name, obj.email, 1, obj.id], userCallback);
    },
    entityUpdate: function(entityCallback) {
      if (obj.slug) {
        slug = uslug(obj.slug);
        excuteQuery.update(sqlQueryMap['updateEntitySlug'], [slug, obj.id, 'user'], entityCallback);
      } else {
        entityCallback(null, {});
      }
    }
  }, function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      excuteQuery.queryForAll(sqlQueryMap['user_country_code'], [obj.id], function(err, userCountry) {
        if (err) {
          callback(new Error(err), null);
        } else {
          if (userCountry && userCountry.length > 0) {
            obj.country_code = userCountry[0].country_code;
            obj.currency_symbol = userCountry[0].currency_symbol;
            obj.currency_code = userCountry[0].country_code;
          }

          callback(null, obj);
          excuteQuery.queryForAll(sqlQueryMap['getEntity'], [obj.id, 'user'], function(err, rows) {
            var entityObj = {};
            entityObj.entity_id = obj.id;
            entityObj.entity_type = 'user';
            entityObj.slug = slug;
            entityObj.id = rows[0].id;
            entityObj.update = 'update';

            if (obj.slug != obj.originalslug) {
              obj.slug = uslug(obj.slug)
              obj.entity_id = rows[0].id;
              charityService.storeUserNames(obj, function(err, result3) {});
            }

            agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
          });
        }
      });
    }
  });
  // excuteQuery.update(sqlQueryMap['updateUserProfileInfo'], [obj.about_me, obj.address_1, obj.address_2, obj.phone, obj.city, obj.state, obj.postal_code, obj.gender, obj.relationship, obj.religious_affiliation, obj.profile_pic_url, obj.id], function(err, rows) {

  //   if (err) {
  //     callback(err);
  //   } else {
  //     excuteQuery.update(sqlQueryMap['updateUserInfo'], [obj.name, obj.email, 1, obj.id], function(err, rowsData) {
  //       if (err) {
  //         callback(err);
  //       } else {
  //         callback(null, obj);
  //       }
  //     });
  //   }
  // });

};

//For Mobile to update donor profile data
exports.donorProfileDetailsUpdate = function(obj, callback) {
  var slug;
  async.parallel({
    userProfile: function(profileCallback) {

      if (obj.state === 'select') {
        obj.state = null;
      }
      if (obj.country === 'select') {
        obj.country = null;
      }

      if (obj.timezone && obj.timezone != '') {
        obj.timezone = parseInt(obj.timezone);
      }
      // calculate new profile completion and save that too
      var completetionCount = calculateProfileCompletion(obj);
      excuteQuery.update(sqlQueryMap['updateUserProfileInfo'], [obj.about_me, obj.address_1, obj.address_2, obj.phone, obj.city, obj.state, obj.postal_code, obj.gender, obj.relationship, obj.religious_affiliation, obj.profile_pic_url, obj.timezone, obj.country, completetionCount, obj.background_pic_url, obj.id], profileCallback);

    }
  }, function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, obj);
      excuteQuery.queryForAll(sqlQueryMap['getEntity'], [obj.id, 'user'], function(err, rows) {
        var entityObj = {};
        entityObj.entity_id = obj.id;
        entityObj.entity_type = 'user';
        entityObj.slug = slug;
        entityObj.id = rows[0].id;
        entityObj.update = 'update';

        if (obj.slug != obj.originalslug) {
          obj.slug = uslug(obj.slug)
          obj.entity_id = rows[0].id;
          charityService.storeUserNames(obj, function(err, result3) {});
        }

        agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
      });
    }
  });


};

function calculateProfileCompletion(userProfile) {
  var completionCount = 0;
  if (!userProfile) {
    return 0;
  }
  if (userProfile.about_me && userProfile.about_me.length > 0) {
    completionCount++;
  }
  if (userProfile.address_1 && userProfile.address_1.length > 0) {
    completionCount++;
  }
  if (userProfile.phone && userProfile.phone.length > 0) {
    completionCount++;
  }
  if (userProfile.city && userProfile.city.length > 0) {
    completionCount++;
  }
  if (userProfile.gender && userProfile.gender.length > 0) {
    completionCount++;
  }
  if (userProfile.relationship && userProfile.relationship.length > 0) {
    completionCount++;
  }
  if (userProfile.religious_affiliation && userProfile.religious_affiliation.length > 0) {
    completionCount++;
  }
  if (userProfile.profile_pic_url && userProfile.profile_pic_url.length > 0) {
    completionCount++;
  }
  return completionCount;
}

exports.checkEmail = function(charityAdminObj, callback) {
  if (charityAdminObj.email) {
    excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [charityAdminObj.email], function(err, userResult) {
      if (err) {
        callback(new Error(err), null);
      } else {
        if (userResult.length > 0) {
          if (userResult[userResult.length-1].date_deleted != null) {
          //  callback(new Error('This Email account has been cancelled'), null);
          callback(null, {
            "alert": "This Email account has been cancelled."
          });
          } else {
            callback(null, userResult);
          }
        } else {
          callback(null, {
            "msg": " Does not have a WonderWe acccount, please fill the following details."
          });
        }
      }
    });
  }
};

exports.defaultusrupdate = function(userid, id, charityid, callback) {

  excuteQuery.queryForAll(sqlQueryMap['getCharitydefault'], [charityid, 1], function(err, userResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      excuteQuery.update(sqlQueryMap['updatedefaultusermain'], [userResult[0].user_id], function(err, userResult1) {
        if (err) {
          callback(new Error(err), null);
        } else {
          excuteQuery.update(sqlQueryMap['updatedefaultuserset'], [userid], function(err, userResult2) {
            if (err) {
              callback(new Error(err), null);
            } else {
              callback(null, "Updated successfully.");
            }
          });
        }
      });
    }
  });
}

exports.getCharityStatus = function(id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['selectedCharityDetails'], [id], function(err, userResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, userResult);
    }
  });
}

exports.getPaymentGatewayCharityStatus = function(object, callback) {
  if (object.type === 'charity') {
    var query = 'getCharityPaymentGateWays';
  } else {
    var query = 'getUserPaymentGateWays';
  }
  console.log('The query:',query);
  excuteQuery.queryForAll(sqlQueryMap[query], [object.id], function(err, userResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, userResult);
    }
  });
}

exports.addingCharity = function(charityObj, serviceCallback) {
  var charityInfo = {};
  charityInfo.ein = charityObj.ein;
  charityInfo.city = charityObj.city;
  charityInfo.state = charityObj.state;
  charityInfo.country = charityObj.country;
  charityInfo.postal_code = charityObj.zip;
  charityInfo.name_tmp = charityObj.charity_name;
  charityInfo.short_name = charityInfo.name_tmp.slice(0, 18);
  charityInfo.charity_from = 'approved';
  charityInfo.parent_id = charityObj.parentid;
  //TODO Store in charity_nteecode table

  var orgInfo = {};
  orgInfo.title = charityInfo.name_tmp; //data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
  orgInfo.web_url = charityObj.web_url;
  orgInfo.short_name = charityInfo.name_tmp.slice(0, 18);
  orgInfo.timezone_id = charityObj.timezone;

  var codeObject = {};
  codeObject.date_created = moment.utc().toDate();
  codeObject.start_date = moment.utc().toDate();
  codeObject.user_id = charityObj.user_id;
  codeObject.end_date = "2099-12-31 23:59:59";
  var arr = charityObj.charity_name.split(" ");
  var obj = {};
  var string = arr[0];
  for (var i = 1; i < arr.length; i++) {
    string = string + arr[i].charAt('0');
  }
  codeObject.code_text = string;
  codeObject.code_slug = uslug(codeObject.code_text);
  codeObject.suggested_donation = 10;
  codeObject.title = charityInfo.name_tmp; //data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
  codeObject.state = charityObj.state;
  codeObject.country = charityObj.country;
  codeObject.city = charityObj.city;
  codeObject.goal = 10000;
  codeObject.campaign_zip = charityObj.zip;
  codeObject.type = "ongoing";
  codeObject.short_name = charityInfo.name_tmp.slice(0, 18);
  codeObject.charity_default = "yes";
  codeObject.status = "published";
  async.waterfall([
      function(callback) {
        excuteQuery.insertAndReturnKey(sqlQueryMap['newOrganization'], [orgInfo], function(err, orgId) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(null, orgId);
          }
        });
      },
      function(orgId, callback) {
        charityInfo.organization_id = orgId;
        charityInfo.charity_from = "approved";
        excuteQuery.insertAndReturnKey(sqlQueryMap['newCharity'], [charityInfo], function(err, charityId) {
          if (err) {
            callback(new Error(err), null);
          } else {

            callback(null, charityId);
          }
        });
      },
      function(charityId, callback) {
        codeObject.charity_id = charityId;
        excuteQuery.insertAndReturnKey(sqlQueryMap['newCode'], [codeObject], function(err, codeId) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(null, codeId, charityId);
          }
        });
      },
      function(codeId, charityId, callback) {
        var codeEntity = {};
        codeEntity.entity_id = codeId;
        codeEntity.entity_type = "code";
        var count = 1;
        var usrSlug = uslug(codeObject.code_text);
        var originlSlug = uslug(codeObject.code_text);;

        charityService.slugCreation(codeEntity, usrSlug, count, originlSlug, function(err, rows) {
          if (err) {
            var errObj = {
              status: 400,
              errors: [responseObj.error_description]
            };
            callback(new Error(JSON.stringify(errObj)), null);
          } else {
            callback(null, charityId);
            codeEntity.id = rows;
            agenda.now('create campaign/donor/charity in elasticsearch', codeEntity);
          }
        });
      },
      function(charityId, callback) {
        var charityEntity = {};
        charityEntity.entity_id = charityId;
        charityEntity.entity_type = "charity";
        var count = 1;
        var usrSlug = uslug(orgInfo.title);
        var originlSlug = uslug(orgInfo.title);
        charityService.slugCreation(charityEntity, usrSlug, count, originlSlug, function(err, rows) {
          if (err) {
            var errObj = {
              status: 400,
              errors: [responseObj.error_description]
            };
            callback(new Error(JSON.stringify(errObj)), null);
          } else {
            charityEntity.id = rows;
            callback(null, charityEntity);
            agenda.now('create campaign/donor/charity in elasticsearch', charityEntity);
          }
        });
      },
    ],
    function(err, results) {
      if (err) {
        serviceCallback(null, err);
      } else {
        var obj = {};
        obj.data = results.charityId;
        if (props.environment_type == 'production') {
          obj.profile_pic_url = "https://wonderwe-prod.s3.amazonaws.com/profile/38ef71cb-2ed4-4e7f-8f6d-37a198f1517a-default-charitypng.png";
        } else {
          obj.profile_pic_url = "https://wonderwe.s3.amazonaws.com/profile/10344a9c-068d-4bf5-9454-be11815a51af-default-charitypng.png";
        }
        serviceCallback(null, obj);
        var object = {};
        object.charityId = codeObject.charity_id;
        object.charityObj = charityObj;
        object.orgInfo = orgInfo;
        agenda.now('addNewOrganization', object);

      }
    });

}
exports.addNewCharity = function(charityId, charityObj, orgInfo, callback) {
  excuteQuery.queryForAll(sqlQueryMap['profileinfoWithEmail'], [charityObj.email], function(err, existingUserInfo) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (existingUserInfo && existingUserInfo.length > 0) {
        var nameArray = existingUserInfo[0].name.split(' ');
        var claimObj = {};
        claimObj.charity_id = charityId;
        claimObj.first_name = nameArray[0];
        claimObj.last_name = nameArray[1];
        claimObj.title = charityObj.charity_name;
        claimObj.ein = charityObj.ein;
        claimObj.phone_number = existingUserInfo[0].home_phone;
        claimObj.date_created = moment.utc().toDate();
        claimObj.approval_date = moment.utc().toDate();
        claimObj.email_address = existingUserInfo[0].email;
        claimObj.approved_by = props.adminId;
        var userId = existingUserInfo[0].user_id;
      } else {
        var claimObj = {};
        claimObj.charity_id = charityId;
        claimObj.first_name = charityObj.first_name;
        claimObj.last_name = charityObj.last_name;
        claimObj.title = charityObj.charity_name;
        claimObj.ein = charityObj.ein;
        claimObj.phone_number = charityObj.phone_number;
        claimObj.date_created = moment.utc().toDate();
        claimObj.approval_date = moment.utc().toDate();
        claimObj.email_address = charityObj.email;
        claimObj.approved_by = props.adminId;
        var userId = null;
      }
      excuteQuery.insertAndReturnKey(sqlQueryMap['charityClaimInsert'], [claimObj], function(err, userEntityId) {
        if (err) {
          callback(new Error(err), null);
        } else {
          if (charityObj.yourname) {
            var userInfo = {};
            userInfo.name = charityObj.first_name + ' ' + charityObj.last_name;
            userInfo.email = charityObj.email;
            userInfo.verification_key = uuid.v4() + "-" + uslug(userInfo.yourname);
            var userProfileInfo = {};
            async.waterfall([
                function(callback) {
                  excuteQuery.insertAndReturnKey(sqlQueryMap['newUser'], [userInfo], function(err, userId) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      callback(null, userId);
                    }
                  });
                },
                function(userId, callback) {
                  userProfileInfo.user_id = userId;
                  userProfileInfo.home_phone = charityObj.phone;
                  userProfileInfo.timezone_id = charityObj.timezone;
                  excuteQuery.insertAndReturnKey(sqlQueryMap['newProfile'], [userProfileInfo], function(err, userProfile) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      callback(null, userId);
                    }
                  });
                },
                function(userId, callback) {
                  var userEntity = {};
                  userEntity.entity_id = userId;
                  userEntity.entity_type = "user";
                  var userDetailsObject = {
                    count: 1,
                    name: userInfo.name
                  };
                  var usrSlug = uslug(orgInfo.title);
                  var originlSlug = uslug(orgInfo.title);

                  charityService.entitySlugCreation(userEntity, usrSlug, userDetailsObject, originlSlug, function(err, userEntityId) {


                    //excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], [userEntity], function(err, userEntityId) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      userEntity.id = userEntityId;
                      callback(null, charityId, userEntityId);
                      //agenda.now('create campaign/donor/charity in elasticsearch', userEntity);
                    }
                  });
                },
                function(charityId, userId, callback) {
                  excuteQuery.queryForAll(sqlQueryMap['getClaimId'], [charityId], function(err, rows) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      var userObject = {};
                      userObject.id = rows[0].id;
                      userObject.original_ip = charityObj.original_ip;
                      userObject.original_device = charityObj.original_device;
                      userObject.approval_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
                      userObject.admin_user_id = userId;
                      donationServices.wepayUserRegister(userObject, callback);
                    }
                  });

                }
              ],
              function(err, results) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  callback(null, results);
                }
              });
          } else {
            excuteQuery.queryForAll(sqlQueryMap['getClaimId'], [charityId], function(err, rows) {
              if (err) {
                callback(new Error(err), null);
              } else {
                var userObject = {};
                userObject.id = rows[0].id;
                userObject.original_ip = charityObj.original_ip;
                userObject.original_device = charityObj.original_device;
                userObject.approval_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
                userObject.admin_user_id = userId;
                donationServices.wepayUserRegister(userObject, callback);
              }
            });
          }
        }
      });
    }
  });

}
exports.getCharityList = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCharityAddedOrgs'], [charityId], function(err, userResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, userResult);
    }
  });
}

exports.getCharityInformantion = function(charityInfo, callback) {
  excuteQuery.queryForAll(sqlQueryMap['charityInfoUpdate'], [charityInfo.email, charityInfo.address_1, charityInfo.address_2, charityInfo.city, charityInfo.country, charityInfo.state, charityInfo.postal_code, charityInfo.phone, charityInfo.charityid], function(err, userResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, charityInfo);
      excuteQuery.queryForAll(sqlQueryMap['gettingCountryStateNames'], [charityInfo.state, charityInfo.country], function(err, result) {
        if (err) {
          utility.nodeLogs('ERROR', 'Error occured while getting the country and state names');
        } else {
          if (result[0]) {
            var charity_data = {
              index: props.elastic_index + '_np',
              type: 'charity_for_fundraiser',
              doc: {
                country: result[0].country,
                state: result[0].state,
                city: charityInfo.city
              }
            }
            excuteQuery.queryForAll(sqlQueryMap['getCharityEntity'], [charityInfo.charityid], function(err, result) {
              if (err) {
                callback(new Error(err), null);
              } else {
                charity_data.id = result[0].id;
                elasticService.updateDocument(charity_data, function(err, result) {
                  if (err) {
                    utility.nodeLogs('ERROR', 'error occured while updating country,state and city of charity in elasticsearch')
                  } else {
                    utility.nodeLogs('INFO', 'country,state and city of charity successfully updated in elasticSearch');
                  }
                });
                var singleObject = {};
                singleObject.entity_id = charityInfo.charityid;
                singleObject.id = result[0].id;
                singleObject.entity_type = result[0].entity_type;
                singleObject.update = true;
                agenda.now('create campaign/donor/charity in elasticsearch', singleObject);
              }
            });
          }
        }
      });
    }
  });
}
exports.getCharityStatusFundraise = function(id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['selectedDonorDetails'], [id], function(err, userResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, userResult);
    }
  });
}
exports.getPaymentGateways = function(obj, callback) {

  if (!obj.charityId) {
    var id = obj.userId;
    var query = 'userPaymentAccounts';
  } else {
    var id = obj.charityId;
    var query = 'charityPaymentAccounts';
  }
  excuteQuery.queryForAll(sqlQueryMap[query], [id], function(err, userResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, userResult);
    }
  });
}


exports.getUserEmailNotificationSettings = function(data, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getUserEmailNotificationSettings'], [data.user_id], function(err, result) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      callback(null, result);
    }
  });

};

exports.setUserEmailNotificationSettings = function(data, callback) {
  console.log(data);
  async.each(data.email_template_settings, function(setting, eachCallback) {
    var query;
    var queryData;
    if (setting.email_setting_id) {
      query = 'updateEmailNotificationSetting';
      queryData = [setting.enable, setting.email_setting_id];
    } else {
      query = 'insertEmailNotificationSetting';
      queryData = [data.user_id, setting.template_id, setting.enable];
    }

    excuteQuery.queryForAll(sqlQueryMap[query], queryData, function(err, result) {
      if (err) {
        eachCallback(err);
      } else {
        eachCallback(null);
      }
    });

  }, function(err) {
    console.log(err);
    callback(err, true);
  });
};

// exports.updateGatewayStatus = function(obj, callback) {
//   excuteQuery.queryForAll(sqlQueryMap['checkGatewayStatus'], [obj.accountid,obj.charityid], function(err, result) {
//     if (err) {
//       callback(err, null);
//     } else {
//       if(result && result.length>0){
//          pool.query('update user_payment_gateways_tbl set status=? where account_id =? and charity_id=?' ,['active',obj.accountid,obj.charityid], function(err, result1) {
//          if (err) {
//            callback(err, null);
//          }else{
//           pool.query('update user_payment_gateways_tbl set status=? where account_id =? and charity_id=?' ,['draft',obj.oldaccountid,obj.charityid], function(err, result2) {
//           if (err) {
//            callback(err, null);
//           }else{
//             excuteQuery.queryForAll(sqlQueryMap['updateCampaignPaymentgateway'],[result[0].payment_gateway_id,obj.charityid],callback);
//            }
//          });
//         }
//        });
//       }else{
//         pool.query('select * from payment_gateways_tbl where charity_id=? and account_id=?',[obj.charityid,obj.accountid],function(err,result4){
//           var object=result4[0];
//           object.payment_gateway_id = result4[0].id;
//           wepayService.insertUserPaymentGateway(object,callback);
//         });
//       }
//     }
//   });

//};
