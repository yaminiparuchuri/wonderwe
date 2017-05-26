var donorService = require('../services/donors');
var feedServices = require('../services/feed');
var charityService = require('../services/charity');
var codeService = require('../services/code');
var followerService = require('../services/follower');
var settingsService = require('../services/settings');
var authService = require('../services/auth');
var elasticService = require('../services/elastic');


exports.getSeedData = function(senddata) {
  console.time('Time takes...');
  //"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOjIxNjZ9.IsCEEBiZNMH9h-v77yKheLaWYZ163Y9i26vkJad6XQk"
  var me = this;
  async.parallel({
      categories: function(callback) {
        excuteQuery.queryForAll(sqlQueryMap['selectCategories'], [], function(err, rows) {
          callback(null, rows);
        });

      },
      props: function(callback) {
        var propsObj = {
          environment_type: props.environment_type,
          client_id: props.client_id,
          domain: props.domain,
          agendadomin: props.agendadomin,
          stripe_client_id: props.stripe_client_id,
          stripe_publishable_key: props.stripe_publishable_key,
          videoToken: props.videoToken,
          intercomAppId: props.intercomAppId,
          analyticsid: props.analyticsid,
          facebookclientid:props.facebook_client_id,
          blog:props.blog,
          team_pic_url:props.default_team_profile_pic_url
        };
        callback(null, propsObj);
      },
      countries: function(callback) {
        excuteQuery.queryForAll(sqlQueryMap['selectCountries'], [], function(err, rows) {
          callback(null, rows);
        });
      },
      zones: function(callback) {
        excuteQuery.queryForAll(sqlQueryMap['selectZones'], [], function(err, rows) {
          callback(null, rows);
        });
      }
    },
    function(err, result) {
      if (err) {
        //Log the Error
        console.log(err);
        senddata(new Error(err), null);
      } else {
        console.timeEnd('Time takes...');
        senddata(null, result);
      }
    });
}

exports.charitySignUp = function(charityData, callback) {
  //TODO object format
  //  {
  //     "first_name": "xxxxxx",
  //     "last_name": "xxxxxx",
  //     "email": "xxxxxxxx@gmail.com",
  //     "charity_name": "xxxxxxxx",
  //     "title": "new charity",
  //     "ein": "567854328",
  //     "city": "hyd",
  //     "state": "TG",
  //     "zip": "66223",
  //     "phone": "8977282914",
  //     "gender":"male",
  //     "web_url":"xxxxx.org"
  // }

  //TODO I am not able find out these  properties in our DB

  console.log(charityData);

  var me = this;
  var charityInfo = {};
  charityInfo.ein = charityData.ein;
  if (charityData.address) {
    charityInfo.city = charityData.address.city;
    charityInfo.state = charityData.address.state_id;
    charityInfo.country = charityData.address.country_id;
    charityInfo.postal_code = charityData.address.postal_code;
  } else {
    charityInfo.city = charityData.city;
    charityInfo.state = charityData.state;
    charityInfo.country = charityData.country;
    charityInfo.postal_code = charityData.zip;
  }
  //charityInfo.foundation_code = data.irs_foundation_code;
  //charityInfo.subsection_code = data.irs_subsection;
  //charityInfo.organization_id = data.organization_id;
  charityInfo.name_tmp = charityData.charity_name;
  //charityInfo.short_name = data.organization_name_aka;
  charityInfo.short_name = charityInfo.name_tmp.slice(0, 18);
  charityInfo.charity_from = 'self';
  //TODO Store in charity_nteecode table
  //charityInfo.ntee_code = data.nteecode;
  if (!charityData.last_name) {
    charityData.last_name = charityData.first_name;
  }

  var orgInfo = {};
  orgInfo.title = charityInfo.name_tmp; //data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
  //orgInfo.id = data.organization_id;
  if (charityData.logo_url) {

    console.log('In org url');
    orgInfo.profile_pic_url = charityData.logo_url;
  }
  orgInfo.web_url = charityData.web_url;
  orgInfo.short_name = charityInfo.name_tmp.slice(0, 18);
  orgInfo.timezone_id = charityData.timezone;
  orgInfo.date_created = moment.utc().toDate();
  //orgInfo.full_description = charityData.mission;
  var arr = charityData.charity_name.split(" ");
  var obj = {};
  var string = arr[0];
  for (var i = 1; i < arr.length; i++) {
    string = string + arr[i].charAt('0');
  }
  //data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
  //codeObject.description = data.mission;
  //TODO need to check the unique ness of a code_text field.

  async.waterfall([
      function(callback) {
        excuteQuery.insertAndReturnKey(sqlQueryMap['newOrganization'], [orgInfo], function(err, orgId) {
          if (err) {
            console.log('In organization error');
            callback(new Error(err), null);
          } else {
            callback(null, orgId);
          }
        });
      },
      function(orgId, callback) {
        charityInfo.organization_id = orgId;
        excuteQuery.insertAndReturnKey(sqlQueryMap['newCharity'], [charityInfo], function(err, charityId) {
          if (err) {
            console.log('In new charity error');
            callback(new Error(err), null);
          } else {
            callback(null, charityId);
          }
        });
      },
      function(charityId, callback) {
        excuteQuery.insertAndReturnKey(sqlQueryMap['charity_claim_insert'], [charityId, charityData.first_name, charityData.last_name, charityData.charity_name, charityData.email, charityData.phone, charityData.ein, new Date(), charityData.weEmailId], function(err, rows) {
          if (err) {
            console.log('In charity claim insert error');
            callback(new Error(err), null);
          } else {
            charityData.id = rows;
            callback(null, charityId);
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

            callback(err, null);
          } else {
            callback(null, charityId);
            charityEntity.id = rows;
            agenda.now('create campaign/donor/charity in elasticsearch', charityEntity);
          }
        });
      }
    ],
    function(err, results) {
      if (err) {

        callback(new Error(err), null);
      } else {
        charityData.charity_id = results;
        me.storeCharityToElasticSearch(charityData.charity_id, function(err, result) {
          callback(null, charityData);
        });
        me.sendClaimRequestEmailToAdmin(charityData, function(err, result) {});
        agenda.now('sendClaimsignupRequestEmail', charityData);
      }
    });
};

exports.sendClaimsignupRequestEmail = function(charityData, callback) {
  charityData.title = charityData.charity_name;
  charityData.date_created = moment().toDate();
  charityData.email_address = charityData.email;
  charityData.phone_number = charityData.phone;
  var me = this;
  me.sendClaimsignup(charityData, function(err, result) {
    if (err) {
      var errObj = {
        status: 400,
        errors: [responseObj.error_description]
      };
      callback(new Error(JSON.stringify(errObj)), null);
    } else {
      callback(null, result);
    }
  });

}

exports.sendClaimsignup = function(claimObj, callback) {
  //TODO: Check the Updated Rows and See InsertID is Valid Value.
  var newClaimObj = {};
  if (claimObj && claimObj.charity_name) {
    newClaimObj.charity_name = claimObj.charity_name;
  } else {
    newClaimObj.charity_name = '';
  }
  if (claimObj && claimObj.first_name) {
    newClaimObj.first_name = claimObj.first_name;
  } else {
    newClaimObj.first_name = '';
  }
  var finalobjectmandril = {};
  finalobjectmandril.from = props.fromemail;
  finalobjectmandril.email = claimObj.email_address;
  finalobjectmandril.text = "";
  finalobjectmandril.subject = "Your request to create " + newClaimObj.charity_name + " is pending";
  finalobjectmandril.template_name = "New Organization User Response";
  finalobjectmandril.template_content = [{
    "name": "title",
    "content": "*|TITLE|*"
  }, {
    "name": "fname",
    "content": "*|FNAME|*"
  }];
  finalobjectmandril.merge_vars = [{
    "name": "TITLE",
    "content": newClaimObj.charity_name
  }, {
    "name": "FNAME",
    "content": newClaimObj.first_name
  }];
  utility.mandrillTemplate(finalobjectmandril, callback);
}

/*<<<<<<< HEAD
exports.sendClaimRequestEmailToAdmin = function(claimObj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['charityAdminEmails'], function(err, result) {
=======
exports.sendClaimRequestEmailToAdmin = function(claimObj,callback){
  excuteQuery.queryForAll(sqlQueryMap['charityAdminEmails'],function(err,result){
      if (err) {
            console.log('error');
          } else {
            console.log(result);
  console.log(claimObj);
  var newClaimObj = {};
  if (claimObj && claimObj.charity_name) {
    newClaimObj.charity_name = claimObj.charity_name;
  } else {
    newClaimObj.charity_name = '';
  }
  if (claimObj && claimObj.first_name) {
    newClaimObj.first_name = claimObj.first_name;
  } else {
    newClaimObj.first_name = '';
  }
  newClaimObj.email_address= underscore.pluck(result,'email');

  async.each(newClaimObj.email_address,function(ele,eachCallback){
  var claimRequestInfo ={};
  var current_year = moment.utc().format('YYYY');

  claimRequestInfo.from = props.fromemail;
  claimRequestInfo.text = "";
  claimRequestInfo.email = ele;
  claimRequestInfo.phone=claimObj.phone;
  claimRequestInfo.ein=claimObj.ein;
  claimRequestInfo.subject = "Request from new charity " + newClaimObj.charity_name + " is pending, please accept";
  claimRequestInfo.template_name = "Claim Request Info";
  claimRequestInfo.template_content = [{
    "name":"firstname",
    "content": "*|FNAME|*"
  }, {
    "name" : "lastname",
    "content": "*|LNAME|*"
  }, {
    "name" : "email",
    "content": "*|EMAIL|*"
  }, {
    "name" : "Phone_Number",
    "content": "*|PHONE|*"
  }, {
    "name" : "ein",
    "content": "*|EIN|*"
  }, {
    "name" : "title",
    "content": "*|TITLE|*"
  }, {
    "name" : "current_year",
    "content": "*|CURRENT_YEAR|*"
  }]
  claimRequestInfo.merge_vars = [{
    "name": "FNAME",
    "content": claimObj.first_name
  }, {
    "name": "LNAME",
    "content": claimObj.last_name
  }, {
    "name": "EMAIL",
    "content": claimObj.email_address || claimObj.email
  }, {
    "name": "PHONE",
    "content": claimObj.Phone || 'N/A'
  }, {
    "name": "EIN",
    "content":claimObj.ein || 'N/A'
  }, {
    "name": "TITLE",
    "content": claimObj.charity_name
  },{
    "name": "CURRENT_YEAR",
    "content": current_year
  }];
    utility.mandrillTemplate(claimRequestInfo, function(err,result){
>>>>>>> 63055420d3fdffb2efb5472190571b6c4e704b46*/
/*if (err) {
      console.log('error');
    } else {
      var newClaimObj = {};
      if (claimObj && claimObj.charity_name) {
        newClaimObj.charity_name = claimObj.charity_name;
      } else {
        newClaimObj.charity_name = '';
      }
      if (claimObj && claimObj.first_name) {
        newClaimObj.first_name = claimObj.first_name;
      } else {
        newClaimObj.first_name = '';
      }
      newClaimObj.email_address = underscore.pluck(result, 'email');

      async.each(newClaimObj.email_address, function(ele, eachCallback) {
        var claimRequestInfo = {};
        var current_year = moment.utc().format('YYYY');

        claimRequestInfo.from = props.fromemail;
        claimRequestInfo.text = "";
        claimRequestInfo.email = ele;
        claimRequestInfo.phone = claimObj.phone;
        claimRequestInfo.ein = claimObj.ein;
        claimRequestInfo.subject = "Request from new chairty " + newClaimObj.charity_name + " is pending, please accept";
        claimRequestInfo.template_name = "Claim Request Info";
        claimRequestInfo.template_content = [{
          "name": "firstname",
          "content": "*|FNAME|*"
        }, {
          "name": "lastname",
          "content": "*|LNAME|*"
        }, {
          "name": "email",
          "content": "*|EMAIL|*"
        }, {
          "name": "Phone_Number",
          "content": "*|PHONE|*"
        }, {
          "name": "ein",
          "content": "*|EIN|*"
        }, {
          "name": "title",
          "content": "*|TITLE|*"
        }, {
          "name": "current_year",
          "content": "*|CURRENT_YEAR|*"
        }]
        claimRequestInfo.merge_vars = [{
          "name": "FNAME",
          "content": claimObj.first_name
        }, {
          "name": "LNAME",
          "content": claimObj.last_name
        }, {
          "name": "EMAIL",
          "content": claimObj.email_address || claimObj.email
        }, {
          "name": "PHONE",
          "content": claimObj.Phone || 'N/A'
        }, {
          "name": "EIN",
          "content": claimObj.ein || 'N/A'
        }, {
          "name": "TITLE",
          "content": claimObj.charity_name
        }, {
          "name": "CURRENT_YEAR",
          "content": current_year
        }];
        utility.mandrillTemplate(claimRequestInfo, function(err, result) {
          if (err) {
            utility.nodeLogs({ message: 'Error in sending cliam request info to admin', email: ele });
            eachCallback(null);
          } else {
            utility.nodeLogs({ message: 'Claim organization request to admin sent successfully', email: ele });
            eachCallback(null);
          }

        });

      }, function(ele) {
        callback(err, true);
      });

    }
  });
}*/
exports.sendClaimRequestEmailToAdmin = function(claimObj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['charityAdminEmails'], function(err, result) {
    if (err) {
      console.log('error');
    } else {
      console.log(result);
      console.log(claimObj);
      var newClaimObj = {};
      if (claimObj && claimObj.charity_name) {
        newClaimObj.charity_name = claimObj.charity_name;
      } else {
        newClaimObj.charity_name = '';
      }
      if (claimObj && claimObj.first_name) {
        newClaimObj.first_name = claimObj.first_name;
      } else {
        newClaimObj.first_name = '';
      }
      newClaimObj.email_address = underscore.pluck(result, 'email');

      async.each(newClaimObj.email_address, function(ele, eachCallback) {
        var claimRequestInfo = {};
        var current_year = moment.utc().format('YYYY');

        claimRequestInfo.from = props.fromemail;
        claimRequestInfo.text = "";
        claimRequestInfo.email = ele;
        claimRequestInfo.phone = claimObj.phone;
        claimRequestInfo.ein = claimObj.ein;
        claimRequestInfo.subject = "Request from new charity " + newClaimObj.charity_name + " is pending, please accept";
        claimRequestInfo.template_name = "Claim Request Info";
        claimRequestInfo.template_content = [{
          "name": "firstname",
          "content": "*|FNAME|*"
        }, {
          "name": "lastname",
          "content": "*|LNAME|*"
        }, {
          "name": "email",
          "content": "*|EMAIL|*"
        }, {
          "name": "Phone_Number",
          "content": "*|PHONE|*"
        }, {
          "name": "ein",
          "content": "*|EIN|*"
        }, {
          "name": "title",
          "content": "*|TITLE|*"
        }, {
          "name": "current_year",
          "content": "*|CURRENT_YEAR|*"
        }]
        claimRequestInfo.merge_vars = [{
          "name": "FNAME",
          "content": claimObj.first_name
        }, {
          "name": "LNAME",
          "content": claimObj.last_name
        }, {
          "name": "EMAIL",
          "content": claimObj.email_address || claimObj.email
        }, {
          "name": "PHONE",
          "content": claimObj.Phone || 'N/A'
        }, {
          "name": "EIN",
          "content": claimObj.ein || 'N/A'
        }, {
          "name": "TITLE",
          "content": claimObj.charity_name
        }, {
          "name": "CURRENT_YEAR",
          "content": current_year
        }];
        utility.mandrillTemplate(claimRequestInfo, function(err, result) {
          if (err) {
            utility.nodeLogs({ message: 'Error in sending cliam request info to admin', email: ele });
            eachCallback(null);
          } else {
            utility.nodeLogs({ message: 'Claim organization request to admin sent successfully', email: ele });
            eachCallback(null);
          }

        });

      }, function(ele) {
        callback(err, true);
      });

    }
  });
}


function userDataStore(charityData, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['checkemail'], [charityData.email], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (rows && rows.length > 0) {
        utility.log('info', "user already exists");
        callback(null, "user already exists");
      } else {
        var userInfo = {};
        userInfo.name = charityData.first_name + ' ' + charityData.last_name;
        userInfo.email = charityData.email;
        userInfo.verification_key = uuid.v4() + "-" + uslug(userInfo.name);
        userInfo.date_created = moment.utc().toDate();
        userInfo.date_verified = moment.utc().toDate();

        var userProfileInfo = {};
        userProfileInfo.state = charityData.state;
        userProfileInfo.city = charityData.city;
        userProfileInfo.home_phone = charityData.phone;
        userProfileInfo.postal_code = charityData.zip;
        userProfileInfo.gender = charityData.gender;

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
              excuteQuery.insertAndReturnKey(sqlQueryMap['newProfile'], [userProfileInfo], function(err, userProfile) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  callback(null, userId);
                }
              });
            },
            /* function(userId, callback) {
               sendEmailToInviteCharityAdmin(userInfo.email, userId, userInfo.name, charityData.charity_id, function(err, data) {
                 if (err) {
                   callback(err, null);
                 } else {
                   callback(null, userId);
                 }
               });
             },*/
            function(userId, callback) {
              var userEntity = {};
              userEntity.entity_id = userId;
              userEntity.entity_type = "user";

              var count = 1;
              var usrSlug = uslug(userInfo.name);
              var originlSlug = uslug(userInfo.name);

              var userDetailsObject = {
                count: 1,
                name: userInfo.name
              };

              charityService.entitySlugCreation(userEntity, usrSlug, userDetailsObject, originlSlug, function(err, userEntityId) {
                if (err) {
                  var errObj = {
                    status: 400,
                    errors: [responseObj.error_description]
                  };
                  callback(new Error(JSON.stringify(errObj)), null);
                } else {
                  userEntity.id = userEntityId;
                  callback(null, userEntity);
                }
              });

              // excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], [userEntity], function(err, userEntityId) {
              //   if (err) {
              //     callback(err);
              //   } else {
              //     callback(null, userEntityId);
              //   }
              // });

            }
          ],
          function(err, results) {
            if (err) {
              var errObj = {
                status: 400,
                errors: [responseObj.error_description]
              };
              callback(new Error(JSON.stringify(errObj)), null);
            } else {
              callback(null, results);
              //agenda.now('create campaign/donor/charity in elasticsearch', results);
            }
          });
      }
    }
  });
}

exports.getusercategories = function(userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getUsercategories'], [userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
}

exports.followOnboardingRecommendations = function(categories, userId, skip, callback) {
  var categoryString = "";
  for (var i in categories) {
    if (categoryString && categoryString.length > 0) {
      categoryString = categoryString + ",'" + categories[i] + "'"
    } else {
      categoryString = categoryString + "'" + categories[i] + "'"
    }
  }
  excuteQuery.queryForAll(sqlQueryMap['followerscategoryRecommendations'].replace('{SQL_IN}', categoryString).replace('{SQL_IN}', categoryString), [skip, parseInt(userId), skip], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
}

exports.counts = function(callback) {

  excuteQuery.queryForAll(sqlQueryMap['getAccCount'], function(err, result) {
    if (err) {} else {
      callback(null, result);
    }
  });
}
exports.sendEmailToImportDonors = function(importData, importDonors, callback) {

  var array = [];
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [importData.userId], function(err, userObj) {
    if (err) {
      callback(err);
    } else {
      async.each(importDonors, function(data, callback1) {
        var obj = {};
        if (importData.charityname && importData.charity_id) {
          obj.importFrom = "charity";
          obj.charityname = importData.charityname;
          obj.charity_id = importData.charity_id;
        } else if (importData.userId) {
          obj.importFrom = 'donor';
          obj.charityname = "";
          obj.userId = importData.userId;
        }
        obj.email = data.email;
        obj.fullname = data.fullname;
        obj.userObj = userObj[0];
        array.push(obj);
        callback1(null);
      }, function(err) {
        if (err) {
          callback(err);
        } else {
          var obj = {};
          obj.status = "success";
          callback(null, obj);

          var me = this;
          async.eachSeries(array, function(data, callback) {
            excuteQuery.queryForAll(sqlQueryMap['checkemail'], [data.email.toLowerCase().trim()], function(err, rows) {
              if (err) {
                callback(new Error(err), null);
              } else {
                var verification_key = uuid.v4() + "-" + uslug(data.name);
                var date = moment.utc().toDate();

                var inviteUserInfo = {};
                inviteUserInfo.email = data.email;
                inviteUserInfo.name = data.fullname;
                inviteUserInfo.userObj = data.userObj;
                inviteUserInfo.importFrom = data.importFrom;

                if (data.importFrom === "charity") {
                  inviteUserInfo.charity_id = data.charity_id;
                  inviteUserInfo.charityName = data.charityname;
                } else {
                  inviteUserInfo.charity_id = data.userId;
                }

                if (rows && rows.length > 0 && rows[0].active) {
                  inviteUserInfo.rows = rows;
                  agenda.now('sendInviteEmailToImportDonors', inviteUserInfo);
                  callback(null);

                } else if (rows && rows.length > 0) {
                  excuteQuery.insertAndReturnKey(sqlQueryMap['referral'], [data.charity_id, userObj.id, rows[0].id, date, data.importFrom], function(err, referral_id) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      excuteQuery.update(sqlQueryMap['checkemailatimporttime'], [data.fullname, data.email.toLowerCase().trim(), verification_key, date, rows[0].id], function(err, updatedata) {
                        if (err) {
                          callback(new Error(err), null);
                        } else {
                          var id = rows[0].id;
                          inviteUserInfo.id = id;
                          inviteUserInfo.referral_id = referral_id;
                          agenda.now('sendInviteEmailToImportDonors', inviteUserInfo);

                          callback(null);
                        }
                      });
                    }
                  });

                } else {

                  excuteQuery.insertAndReturnKey(sqlQueryMap['importdata'], [data.fullname, data.email.toLowerCase().trim(), verification_key, date], function(err, id) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      excuteQuery.insertAndReturnKey(sqlQueryMap['referral'], [data.charity_id, userObj.id, id, date, data.importFrom], function(err, referral_id) {
                        if (err) {
                          callback(new Error(err), null);
                        } else {
                          var userEntityObject = {};
                          userEntityObject.entity_id = id;
                          userEntityObject.entity_type = 'user';

                          var userDetailsObject = {
                            name: data.fullname,
                            count: 1
                          };
                          var usrSlug = uslug(data.fullname);
                          var originlSlug = uslug(data.fullname);

                          charityService.entitySlugCreation(userEntityObject, usrSlug, userDetailsObject, originlSlug, function(err, userResult) {
                            if (err) {
                              callback(err, null);
                            } else {
                              var timezone_id = 381;
                              excuteQuery.queryForAll(sqlQueryMap['useIdAddToUserProfile'], [id, timezone_id], function(err, userResult1) {
                                if (err) {
                                  callback(new Error(err), null);
                                } else {
                                  inviteUserInfo.id = id;
                                  inviteUserInfo.referral_id = referral_id;
                                  inviteUserInfo.rows = '';
                                  agenda.now('sendInviteEmailToImportDonors', inviteUserInfo);

                                  userEntityObject.id = userResult;
                                  agenda.now('create campaign/donor/charity in elasticsearch', userEntityObject);
                                  callback(null);
                                }
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                }
              }
            });
          }, function(err) {
            if (err) {
              callback(err);
            } else {
              //utility.devMetrics('userEvent', req.cookies.logindonorid, [req.originalUrl, "csvfile import data, done, In pages route"]);
            }
          });
        }
      });
    }
  });
}

exports.sendInviteEmailToImportDonors = function(email, name, charityName, userObj, charity_id, importFrom, rows, id, referral_id, callback) {
  //Added Mandril Admin Template
  var org_fullname = userObj.name;
  var org_firstname = org_fullname.substr(0, org_fullname.indexOf(' '));
  if (rows && rows.length > 0 && rows[0].active) {
    if (importFrom == 'charity') {
      // var charityName = charityName;
      var finalobjectmandril = {};
      finalobjectmandril.from = props.fromemail;
      finalobjectmandril.email = email;
      finalobjectmandril.text = "Hello world ✔";
      finalobjectmandril.subject = charityName + " is now on WonderWe ";
      finalobjectmandril.template_name = "Organization Invitation To Existing Donor";
      finalobjectmandril.template_content = [{
        "name": "charityName",
        "content": "*|ORGANIZATION|*"
      }, {
        "name": "org_fullname",
        "content": "*|ORGANIZATION_FULLNAME|*"
      }, {
        "name": "followorganization",
        "content": "*|FOLLOWORGANIZATION|*"
      }];
      finalobjectmandril.merge_vars = [{
        "name": "ORGANIZATION",
        "content": charityName
      }, {
        "name": "ORGANIZATION_FULLNAME",
        "content": org_fullname
      }, {
        "name": "FOLLOWORGANIZATION",
        "content": props.domain + "/pages/invited/follow/charity/" + rows[0].id + "/" + charity_id + "/" + charityName + '/charity'
      }];
      utility.mandrillTemplate(finalobjectmandril, function(err, data) {
        if (err) {
          callback(err);
        } else {
          callback(null, "mail send");
        }
      });
    } else if (importFrom == 'donor') {
      //var charityName = charityName;
      var notifiObj = {};
      notifiObj.link_id = userObj.id;
      notifiObj.entity_id = rows[0].id;
      notifiObj.type = 'invite';
      notifiObj.user_id = userObj.id;
      //utility.socketioNotifications(notifiObj);
      agenda.now('socket io notifications', notifiObj);
      var finalobjectmandril = {};
      finalobjectmandril.from = props.fromemail;
      finalobjectmandril.email = email;
      finalobjectmandril.text = "Hello world ✔";
      finalobjectmandril.subject = org_fullname + " is now on WonderWe";
      finalobjectmandril.template_name = "Donor Invitation To Existing Donor";
      finalobjectmandril.template_content = [{
        "name": "name",
        "content": "*|NAME|*"
      }, {
        "name": "charityName",
        "content": "*|CHARITYNAME|*"
      }, {
        "name": "followdonor",
        "content": "*|FOLLOWDONOR|*"
      }];
      finalobjectmandril.merge_vars = [{
        "name": "NAME",
        "content": org_fullname
      }, {
        "name": "CHARITYNAME",
        "content": charityName
      }, {
        "name": "FOLLOWDONOR",
        "content": props.domain + "/pages/invited/follow/charity/" + rows[0].id + "/" + charity_id + "/" + org_fullname + '/donor'
      }];
      utility.mandrillTemplate(finalobjectmandril, function(err, data) {
        if (err) {
          callback(err);
        } else {
          callback(null, "mail send");
        }
      });
    }
  } else {
    if (importFrom == 'charity') {
      //var charityName = charityName;
      var finalobjectmandril = {};
      finalobjectmandril.from = props.fromemail;
      finalobjectmandril.email = email;
      finalobjectmandril.text = "Hello world ✔";
      finalobjectmandril.subject = "Join " + charityName + " on WonderWe";
      finalobjectmandril.template_name = "Organization Invitation To New Donor";
      finalobjectmandril.template_content = [{
        "name": "charityName",
        "content": "*|ORGANIZATION|*"
      }, {
        "name": "org_fullname",
        "content": "*|ORGANIZATION_FULLNAME|*"
      }, {
        "name": "org_firstname",
        "content": "*|ORGANIZATION_FIRSTNAME|*"
      }, {
        "name": "registernewuserfollowdonor",
        "content": "*|REGISTERNEWUSERFOLLOWORG|*"
      }];
      finalobjectmandril.merge_vars = [{
        "name": "ORGANIZATION",
        "content": charityName
      }, {
        "name": "ORGANIZATION_FULLNAME",
        "content": org_fullname
      }, {
        "name": "ORGANIZATION_FIRSTNAME",
        "content": org_firstname
      }, {
        "name": "REGISTERNEWUSERFOLLOWORG",
        "content": props.domain + "/pages/signup/donor/" + id + "?followed_id=" + charity_id + "&type=charity" + "&referral_id=" + referral_id
      }];
      utility.mandrillTemplate(finalobjectmandril, function(err, data) {
        if (err) {
          callback(err);
        } else {
          callback(null, "mail send");
          //agenda.now('create campaign/donor/charity in elasticsearch', userEntityObject);
        }
      });
    } else if (importFrom == 'donor') {
      //var charityName = "";
      var finalobjectmandril = {};
      finalobjectmandril.from = props.fromemail;
      finalobjectmandril.email = email;
      finalobjectmandril.text = "Hello world ✔";
      finalobjectmandril.subject = "Please accept my invitation to WonderWe";
      finalobjectmandril.template_name = "Donor Invitation To New Donor";
      finalobjectmandril.template_content = [{
        "name": "name",
        "content": "*|NAME|*"
      }, {
        "name": "charityname",
        "content": "*|CHARITYNAME|*"
      }, {
        "name": "registernewuserfollowdonor",
        "content": "*|REGISTERNEWUSERFOLLOWDONOR|*"
      }];
      finalobjectmandril.merge_vars = [{
        "name": "NAME",
        "content": org_fullname
      }, {
        "name": "CHARITYNAME",
        "content": charityName
      }, {
        "name": "REGISTERNEWUSERFOLLOWDONOR",
        "content": props.domain + "/pages/signup/donor/" + id + "?followed_id=" + userObj.id + "&type=user" + "&referral_id=" + referral_id
      }];
      utility.mandrillTemplate(finalobjectmandril, function(err, data) {
        if (err) {
          callback(err);
        } else {
          callback(null, "mail send");
          //agenda.now('create campaign/donor/charity in elasticsearch', userEntityObject);
        }
      });
    }
  }
}
exports.staffCampaignCreation = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['findCampaign'], [obj.slug], function(err, campaignResult) {
    if (err) {
      callback(new Error(err), null);
    } else {

      if (campaignResult && campaignResult.length > 0) {
        var campaignObj = {
          code_id: campaignResult[0].campaignid,
          promotion_type: obj.promotionType,
          created_date: moment().toDate()
        };

        excuteQuery.queryForAll(sqlQueryMap['checkPromotionCampaign'], [campaignObj.code_id, campaignObj.promotion_type], function(err, promotionResult) {
          if (err) {
            callback(new Error(err), null);
          } else {
            if (promotionResult && promotionResult.length > 0) {
              callback('Campaign already in promotion list', null);
            } else {
              excuteQuery.queryForAll(sqlQueryMap['staffCampaignCreation'], campaignObj, function(err, staffCampaignResult) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  callback(null, staffCampaignResult);
                }
              });
            }
          }
        });
      } else {
        callback('Please check the campaign slug', null);
      }
    }
  });
};
exports.getPromotionCampaigns = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap["promotionCampaignsData"], ['null'], function(err, charityCampaigns) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, charityCampaigns);
    }
  });

};
exports.countryCodes = function(obj, callback) {

  async.parallel({
    country: function(countryCallback) {
      pool.query('select * from countries_tbl where country_code=?', [obj.country], function(err, countryResult4) {
        countryCallback(null, countryResult4);
      });
    },
    state: function(stateCallback) {
      pool.query('select * from states_tbl where name=?', [obj.state], function(err, stateResult4) {
        stateCallback(null, stateResult4);
      });
    }
  }, function(err, result) {
    var resObj = {};

    if (result.country && result.country.length > 0) {
      resObj.country = result.country[0].id;
    } else {
      resObj.country = 223;
    }
    if (result.state && result.state.length > 0) {
      resObj.state = result.state[0].id;
    } else {
      resObj.state = 3454;
    }
    callback(null, resObj);
  });
};

exports.importCharities = function(obj, callback) {

  var csv = require("fast-csv");
  var fs = require('fs');
  var filePath = "/Users/Trinesh/Desktop/importclaim.csv";
  var array = [];

  var me = this;
  fs.createReadStream(filePath)
    .pipe(csv({
      headers: true,
      ignoreEmpty: true
    }))
    .on("data", function(data) {
      array.push(data);
    }).on('error', function(err) {

    })
    .on("end", function() {

      async.eachSeries(array, function(charityData, eachCallback) {

        me.countryCodes(charityData, function(err, countryResult) {
          charityData.country = countryResult.country;
          charityData.state = countryResult.state;

          var charityInfo = {};
          charityInfo.ein = charityData.ein;
          charityInfo.city = charityData.city;
          charityInfo.state = charityData.state;
          charityInfo.country = charityData.country;
          charityInfo.postal_code = charityData.zip;
          charityInfo.name_tmp = charityData.charity_name;
          charityInfo.short_name = charityInfo.name_tmp.slice(0, 18);
          charityInfo.charity_from = 'self';

          var orgInfo = {};
          orgInfo.title = charityInfo.name_tmp; //data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
          orgInfo.web_url = charityData.web_url;
          orgInfo.short_name = charityInfo.name_tmp.slice(0, 18);
          orgInfo.timezone_id = charityData.timezone;
          orgInfo.date_created = moment().toDate();

          var codeObject = {};
          codeObject.date_created = moment().toDate();
          codeObject.start_date = moment().toDate();
          codeObject.end_date = "2099-12-31 23:59:59";
          var arr = charityData.charity_name.split(" ");
          var obj = {};
          var string = arr[0];
          for (var i = 1; i < arr.length; i++) {
            string = string + arr[i].charAt('0');
          }
          codeObject.code_text = string;
          codeObject.suggested_donation = 10;
          codeObject.title = charityInfo.name_tmp; //data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
          //codeObject.description = data.mission;
          //TODO need to check the unique ness of a code_text field.
          codeObject.code_slug = uslug(codeObject.code_text);
          codeObject.state = charityData.state;
          codeObject.country = charityData.country;
          codeObject.city = charityData.city;
          codeObject.goal = 10000;
          codeObject.campaign_zip = charityData.zip;
          codeObject.type = "ongoing";
          codeObject.short_name = charityInfo.name_tmp.slice(0, 18);
          codeObject.charity_default = "yes";
          codeObject.status = 'published';

          pool.query('insert into organization_tbl set ?', orgInfo, function(err, orgResult) {
            if (err) {
              callback(new Error(err), null);
            } else {

              var orgid = orgResult.insertId;
              charityInfo.organization_id = orgid;
              pool.query('insert into charity_tbl set ?', charityInfo, function(err, charityResult) {
                if (err) {
                  callback(new Error(err), null);
                } else {

                  var charityId = charityResult.insertId;
                  codeObject.charity_id = charityId;

                  pool.query('insert into code_tbl set ?', codeObject, function(err, codeResult) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      var codeId = codeResult.insertId;

                      async.parallel({
                        charitySlug: function(charityCallback) {
                          var charityEntity = {};
                          charityEntity.entity_id = charityId;
                          charityEntity.entity_type = "charity";
                          var usrSlug = uslug(orgInfo.title);
                          var originlSlug = uslug(orgInfo.title);
                          var userDetailsObject = {
                            count: 1,
                            name: orgInfo.title
                          };

                          charityService.entitySlugCreation(charityEntity, usrSlug, userDetailsObject, originlSlug, function(err, rows) {
                            if (err) {
                              charityCallback(err, null);
                            } else {
                              charityCallback(null, charityId);
                              charityEntity.id = rows.entity_id;
                              agenda.now('create campaign/donor/charity in elasticsearch', charityEntity);
                            }
                          });
                        },
                        codeSlug: function(codeCallback) {
                          var codeEntity = {};
                          codeEntity.entity_id = codeId;
                          codeEntity.entity_type = "code";
                          var usrSlug = uslug(codeObject.code_text);
                          var originlSlug = uslug(codeObject.code_text);

                          var userDetailsObject2 = {
                            count: 1,
                            name: codeObject.code_text
                          };

                          charityService.entitySlugCreation(codeEntity, usrSlug, userDetailsObject2, originlSlug, function(err, rows2) {
                            if (err) {
                              codeCallback(err, null);
                            } else {
                              codeCallback(null, codeId);
                              codeEntity.id = rows2.entity_id;
                              agenda.now('create campaign/donor/charity in elasticsearch', codeEntity);
                            }
                          });
                        }
                      }, function(err, slugResult) {
                        eachCallback(null);
                      });
                    }
                  });
                }
              });
            }
          });
        });
      }, function(err) {
        callback(null, {
          msg: 'Done well...'
        });
      });
    });
};


exports.importCurrencyData = function(obj, callback) {

  request('https://openexchangerates.org/api/latest.json?app_id=8add80ce29444f838bc8526e38b43fe3', function(error, response, body) {

    if (!error && response.statusCode == 200) {
      var rates = JSON.parse(body).rates;

      var sql = "INSERT INTO currency_conversion (country_currency, currency_conversion) VALUES ?";
      var finalArray = [];
      for (var i in rates) {
        var sampArray = [];
        sampArray.push(i);
        sampArray.push(rates[i]);
        finalArray.push(sampArray);
      }
      pool.query(sql, [finalArray], function(err, result) {
        if (err) {
          callback(new Error(err), null);
        } else {
          callback(null, 'Done well..');
        }
      });
    } else {
      callback(null, 'Not done well...');
    }
  });
};


//updateCurrencyData
exports.updateCurrencyData = function(obj, callback) {

  request('https://openexchangerates.org/api/latest.json?app_id=8add80ce29444f838bc8526e38b43fe3', function(error, response, body) {

    if (!error && response.statusCode == 200) {
      var rates = JSON.parse(body).rates;
      var finalArray = [];
      for (var i in rates) {
        var sampObj = {};
        sampObj.country = i;
        sampObj.currency_value = rates[i];
        finalArray.push(sampObj);
      }

      async.each(finalArray, function(singleObj, eachCallback) {
        pool.query('update currency_conversion set currency_conversion=? where country_currency=?', [singleObj.currency_value, singleObj.country], function(err, updatedResult) {
          eachCallback(null);
        });
      }, function(err) {
        callback(null, 'Updated Well...');
      });
    } else {
      callback(null, 'Not done well...');
    }
  });
};
exports.revertCountryCurrency = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['currencyConversionData'], [obj.campaignCountry, obj.country], function(err, currencyresult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (currencyresult && currencyresult.length > 0) {
        var cunObj = currencyresult[0];
        // kr  --  sek/--- US)* uk
        var convertedValue = (obj.amount * cunObj.campaignCurrency) / cunObj.currency_conversion;
        callback(null, {
          convertedValue: convertedValue
        });

      } else {
        callback({
          error: 'Something wrong'
        }, null)
      }
    }
  });
};

exports.fetchCountryCurrency = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['currencyConversionData'], [obj.campaignCountry, obj.country], function(err, currencyresult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (currencyresult && currencyresult.length > 0) {

        var cunObj = currencyresult[0];
        // {country_currency: 'EUR',
        //     currency_conversion: 0.90652,
        //     campaignCurrency: 1}

        // kr  --  sek/--- US)* uk
        var convertedValue = (obj.amount / cunObj.campaignCurrency) * cunObj.currency_conversion;

        callback(null, {
          convertedValue: convertedValue
        });

        //500/from cuntry == US  === * Contry selected

      } else {
        callback({
          error: 'Something wrong'
        }, null)
      }
    }
  });
};

exports.donorCurrencyConversion = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['donorCurrencyConversion'], [obj.campaignCurrency, obj.userCurrency], function(err, currencyresult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (currencyresult && currencyresult.length > 0) {

        var cunObj = currencyresult[0];
        var convertedval = (obj.amount / cunObj.campaignCurrencyVal) * cunObj.userCurrencyVal;
        cunObj.convertedval = convertedval;
        cunObj.campaignCurrency = obj.campaignCurrency;
        cunObj.userCurrency = obj.userCurrency;
        callback(null, cunObj);
        //var convertedValue = (obj.amount/cunObj.campaignCurrency)*cunObj.currency_conversion;
        //500/from cuntry == US  === * Contry selected
      } else {
        callback({
          error: 'Something wrong'
        }, null)
      }
    }
  });
};
exports.getFbData = function(accessToken, apiPath, callback) {
  var options = {
    host: 'graph.facebook.com',
    port: 443,
    path: apiPath + '?access_token=' + accessToken, //apiPath example: '/me/friends'
    method: 'GET'
  };

  var buffer = ''; //this buffer will be populated with the chunks of the data received from facebook
  var request = https.get(options, function(result) {
    result.setEncoding('utf8');
    result.on('data', function(chunk) {
      buffer += chunk;
    });

    result.on('end', function() {
      callback(buffer);
    });
  });

  request.on('error', function(e) {

  });

  request.end();
}

exports.charityRaisedDonations = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['charityRaisedDonations'], [obj.charitySlug], function(err, charityResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (charityResult && charityResult.length > 0) {

        var donationsObj = {};
        donationsObj.charity_id = charityResult[0].charity_id;
        donationsObj.raisedDonations = underscore.reduce(underscore.compact(underscore.pluck(charityResult, 'donations')), function(memo, num) {
          return memo + parseFloat(num);
        }, 0);
        donationsObj.charityGoal = underscore.reduce(underscore.compact(underscore.pluck(charityResult, 'goal')), function(memo, num) {
          return memo + parseFloat(num);
        }, 0);
        donationsObj.charity_name = charityResult[0].title;
        donationsObj.slug = charityResult[0].slug;
        donationsObj.country_name = charityResult[0].name;
        donationsObj.currency_code = charityResult[0].currency_code;
        donationsObj.currency_symbol = charityResult[0].currency_symbol;
        callback(null, donationsObj);
      } else {
        callback('Please check the organization slug', null);
      }
    }
  });
};
exports.storeGmailAndCsvContacts = function(data, callback) {
  excuteQuery.insertAndReturnKey(sqlQueryMap['userContacts'], [data.user_id, JSON.stringify(data.userContacts)], function(err, id) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(id);
    }
  });
}


exports.assignSystemCharity = function(data, callback) {
  executeQuery.queryForAll(sqlQueryMap['assignSystemCharity'], [], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, result);
    }
  });
};


var getCharityAdminObj = function(charityData) {
  var charityAdminObj = {};
  charityAdminObj.email = charityData.email;
  charityAdminObj.yourname = charityData.first_name + ' ' + charityData.last_name;
  charityAdminObj.can_post = 'yes';
  charityAdminObj.can_update_financial = 'yes';
  charityAdminObj.can_request_withdrawal = 'yes';
  charityAdminObj.can_view_reports = 'yes';
  charityAdminObj.can_code = 'yes';
  charityAdminObj.can_manage_followers = 'yes';
  charityAdminObj.can_admin = 'yes';
  charityAdminObj.date_deleted = 'yes';
  charityAdminObj.defaultuser = 1;
  return charityAdminObj;
};

exports.createCharity = function(charityData, callback) {
  var charityInfo = {};

  charityInfo.ein = charityData.ein.split('-').join('');
  charityInfo.postal_code = charityData.zip;
  charityInfo.name_tmp = charityData.charity_name;
  charityInfo.short_name = charityInfo.name_tmp.slice(0, 18);
  charityInfo.charity_from = 'approved';
  charityInfo.city = charityData.address.city;
  charityInfo.country = charityData.address.country_id;


  //TODO Store in charity_nteecode table
  //charityInfo.ntee_code = data.nteecode;

  var orgInfo = {};
  orgInfo.title = charityInfo.name_tmp; //data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
  //orgInfo.id = data.organization_id;
  //orgInfo.profile_pic_url = data.logo_url;
  orgInfo.web_url = charityData.web_url;
  orgInfo.short_name = charityInfo.name_tmp.slice(0, 18);
  orgInfo.timezone_id = charityData.timezone;
  orgInfo.date_created = moment.utc().toDate();
  //orgInfo.full_description = charityData.mission;


  var codeObject = {};
  codeObject.date_created = moment.utc().toDate();
  codeObject.start_date = moment.utc().toDate();
  codeObject.end_date = "2099-12-31 23:59:59";
  var arr = charityData.charity_name.split(" ");
  var obj = {};
  var string = arr[0];
  for (var i = 1; i < arr.length; i++) {
    string = string + arr[i].charAt('0');
  }
  codeObject.code_text = string;
  codeObject.suggested_donation = 10;
  codeObject.title = charityInfo.name_tmp; //data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
  //codeObject.description = data.mission;
  //TODO need to check the unique ness of a code_text field.
  codeObject.code_slug = uslug(codeObject.code_text);
  codeObject.state = charityData.state;
  codeObject.country = charityData.address.country_id;
  codeObject.city = charityData.address.city;
  codeObject.goal = 10000;
  codeObject.campaign_zip = charityData.address.postal_code;
  //codeObject.code_picture_url = charityData.logo_url

  codeObject.type = "ongoing";
  codeObject.short_name = charityInfo.name_tmp.slice(0, 18);
  codeObject.charity_default = "yes";
  codeObject.status = 'published';
  codeObject.user_id = charityData.user.id;
  async.waterfall([
      function(callback) {
        excuteQuery.insertAndReturnKey(sqlQueryMap['newOrganization'], [orgInfo], function(err, orgId) {
          if (err) {
            callback(new Error(err), null);
          } else {
            console.log('new organization done');
            charityInfo.organization_id = orgId;
            callback(null, orgId);
          }
        });
      },
      function(orgId, callback) {
        var country_code = charityData.address.country_id;
        var state_name = charityData.address.state_name;
        excuteQuery.queryForAll(sqlQueryMap['getStateCode'], [state_name, country_code], function(err, result) {
          if (err) {
            callback(new Error(err), null);
          } else {
            if (result && result.length > 0) {
              charityInfo.state = result[0].id;
              callback(null, result);
            } else {
              callback('No state found', null);
            }
          }
        });
      },
      function(orgId, callback) {
        excuteQuery.insertAndReturnKey(sqlQueryMap['newCharity'], [charityInfo], function(err, charityId) {
          if (err) {
            console.error('In new charity query error:');
            console.log(err);
            callback(new Error(err), null);
          } else {
            console.log('new charity done');
            //console.log(charityId);
            charityData.charity_id = charityId;
            callback(null, charityId);
          }
        });
      },
      function(charityId, callback) {
        codeObject.charity_id = charityId;
        excuteQuery.insertAndReturnKey(sqlQueryMap['newCode'], [codeObject], function(err, codeId) {
          if (err) {
            console.log(err);
            callback(new Error(err), null);
          } else {
            charityInfo.approval_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
            charityInfo.approved_by = props.adminUserId;

            excuteQuery.insertAndReturnKey(sqlQueryMap['charity_claim_insert_signup'], [charityId, charityData.first_name, charityData.last_name, charityData.title, charityData.email, charityData.phone_number, charityData.ein, new Date(), charityInfo.approval_date, charityInfo.approved_by], function(err, result) {
              if (err) {
                callback(new Error(err), null);
              } else {
                console.log('Done in charity claim insert data');
                callback(null, codeId, charityId);
              }
            });

          }
        });
      },
      function(codeId, charityId, callback) {
        var data = {};
        data.id = codeId;
        data.charity_id = charityId;
        data.individual = null;
        data.original_ip = charityData.original_ip;
        data.original_device = charityData.original_device;
        data.user_id = charityData.user.id;
        data.country_code = charityData.address.country_code;
        data.email_address = charityData.email;
        codeService.checkPaymentGateways(data, function(err, result) {
          if (err) {
            console.log('Error in err:');
            var errObj = {
              status: 400,
              errors: [responseObj.error_description]
            };
            callback(new Error(JSON.stringify(errObj)), null);
          } else {
            console.log('We pay created successfully:' + JSON.stringify(result));
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
        var originlSlug = uslug(codeObject.code_text);

        charityService.slugCreation(codeEntity, usrSlug, count, originlSlug, function(err, rows) {
          if (err) {
            callback(err, null);
          } else {
            console.log('new slug done')
            callback(null, charityId);
            codeEntity.id = rows;
            //agenda.now('create campaign/donor/charity in elasticsearch', codeEntity);
          }
        });
        // excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], [codeEntity], function(err, rows) {
        //   if (err) {
        //     callback(err, null);
        //   } else {
        //     callback(null, charityId);
        //   }
        // });

      },
      function(charityId, callback) {
        var charityEntity = {};
        charityEntity.entity_id = charityId;
        charityEntity.entity_type = "charity";

        var count = 1;
        var usrSlug = uslug(orgInfo.title);
        var originlSlug = uslug(orgInfo.title);;

        charityService.slugCreation(charityEntity, usrSlug, count, originlSlug, function(err, rows, slug) {
          if (err) {
            callback(err, null);
          } else {
            charityData.slug = slug;
            callback(null, charityId);
            charityEntity.id = rows;
            //agenda.now('create campaign/donor/charity in elasticsearch', charityEntity);
          }
        });
      }
    ],
    function(err, results) {
      if (err) {
        callback(err, null);
      } else {
        console.log('After create charity data');
        callback(null, charityData);
      }
    });
}


exports.charitySignupClaim = function(charityData, callback) {
  var me = this;
  var charityAdminObj = {};
  var responseData = {};

  charityAdminObj = getCharityAdminObj(charityData);
  charityData.type = 'user';
  charityData.acitve = 'yes';
  authService.userRegistrationWithoutPassword(charityData, function(err, result) {
    if (err) {
      callback('Error in User Registration', null);
    } else {
      charityData.user_id = result.user_id;
      charityData.token = result.token;
      me.createCharity(charityData, function(err, results) {
        if (err) {
          callback(err, null);
        } else {
          charityData.charity_id = results.charity_id;
          charityData.slug = results.slug;
          var singleEntity = {};
          charityAdminObj.charity_id = results.charity_id;
          singleEntity.entity_id = results.charity_id;
          singleEntity.entity_type = 'charity';
          singleEntity.slug = charityData.slug;
          charityAdminObj.charityApproval = true;
          //charityData.firstname = charityData.first_name;
          //charityData.lastname = charityData.last_name;
          charityAdminObj.charityApproval = "newApproval";
          charityService.addCharityAdmin(charityAdminObj, function(err, result) {
            if (err) {
              console.log(err);
              callback('Charity created successfully.Error in creating charity admin', null);
            } else {
              console.log('charity Admin added successfully');
              charityService.getCharityData(charityData.user_id, function(err, result) {
                if (err) {
                  callback('All Done.Error in getting charity information from user', null);
                } else {
                  responseData.user = {
                    email: charityData.email,
                    first_name: charityData.first_name,
                    last_name: charityData.last_name,
                    phone_number: charityData.phone_number,
                    charities: result,
                    token: charityData.token
                  };
                  responseData.token = charityData.token;
                  console.log('before sending response data');
                  callback(null, responseData);
                  console.log('Before save postal code');
                  agenda.now('create campaign/donor/charity in elasticsearch', singleEntity);
                  //          agenda.now('Save postal code user and charity', charityData);
                }
              });
            }
          });
        }
      }); //End of create charity
    }
  });
};

exports.loginUserAndCreateCharity = function(charityData, callback) {
  var userObj = {};
  var me = this;
  var charityData;
  var charityAdminObj = {};
  var singleEntity = {}; //For sending to elastic search
  charityAdminObj = getCharityAdminObj(charityData);
  userObj.email = charityData.email;
  userObj.password = charityData.password;
  async.series({
      userLogin: function(callback) {
        authService.userLogin(userObj, function(err, userResult) {
          if (err) {
            callback(err, null);
          } else {
            charityData.token = userResult.token;
            excuteQuery.queryForAll(sqlQueryMap['userProfileByEmail'], [charityData.email], function(err, result) {
              if (err) {
                callback(err, null);
              } else {
                charityAdminObj.yourname = result[0].name;
                charityData.user_id = result[0].id;
                userObj = result[0]
                callback(null, userResult);
              }
            });
          }
        });
      },
      createCharity: function(callback) {
        me.createCharity(charityData, function(err, results) {
          if (err) {
            callback(err, null);
          } else {
            charityData.charity_id = results.charity_id;
            charityAdminObj.charity_id = results.charity_id;
            singleEntity.entity_id = results.charity_id;
            singleEntity.entity_type = 'charity';
            singleEntity.slug = results.slug;
            charityData.slug = results.slug;
            //charityAdminObj.charityApproval = true;
            //charityData.firstname = charityData.first_name;
            //charityData.lastname = charityData.last_name;
            charityAdminObj.charityApproval = "exists"; //exists means user already exists in the database
            callback(null, results);
          }
        });
      },
      addCharityAdmin: function(callback) {
        charityService.addCharityAdmin(charityAdminObj, function(err, result) {
          if (err) {
            console.log(err);
            callback('Charity created successfully.Error in creating charity admin', null);
          } else {
            console.log('charity admin added successfully');
            callback(null, charityData);
            agenda.now('create campaign/donor/charity in elasticsearch', singleEntity);
            //      agenda.now('Save postal code user and charity', charityData);
          }
        });
      }
    },
    function(err, result) {
      if (err) {
        callback(err, null)
      } else {
        charityService.getCharityData(userObj.id, function(err, charities) {
          if (err) {
            callback('User and charity created .Error in getting user charities', null);
          } else {
            console.log('charities:' + JSON.stringify(charities));
            userObj.charities = charities;
            //  userObj.token = charityData.token;
            callback(null, {
              user: userObj,
              token: charityData.token
            });
          }
        });
        //callback(null,charityData);
      }
    });
};

exports.loginUserAndAddAsAdmin = function(charityData, callback) {
  var singleEntity = {};
  var charityAdminObj = {};
  var me = this;
  var user = charityData.user;

  charityAdminObj = getCharityAdminObj(charityData);
  async.waterfall([
    function(callback) {
      if (charityData.ein) {
        var ein = charityData.ein;
        var ein2 = charityData.ein.split('-').join('');
        user = charityData.user;
        charityData.user_id = user.id;
        excuteQuery.queryForAll(sqlQueryMap['checkCharityByein'], [ein, ein2], function(err, result) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(null, result);
          }
        });
      } else {
        callback(null, []);
      }
    },
    function(result, callback) {
      if (result[0]) {
        if (result[0].charity_from != 'approved') {
          charityData.system = true;
          callback(null, result[0]);
        } else {
          callback('CHARITY_APPROVED_ALREADY', result[0]);
        }

      } else {
        me.createCharity(charityData, function(err, charity) {
          if (err) {
            callback(err, null);
          } else {
            charity.id = charity.charity_id;
            charityData.charity_id = charity.charity_id;
            callback(null, charity);
          }
        });
      }
    }
  ], function(err, charityInfo) {
    if (err) {
      //  callback(err, null);
      if (err == 'CHARITY_APPROVED_ALREADY') {
        console.log('in charity approved already error');
        charityService.getCharityData(user.id, function(err, result) {
          var responseData;
          user.charities = result;
          responseData.user = user;
          responseData.charity = charityInfo;
          responseData.token = charityData.token;
          if (err) {
            var errObj = {
              status: 400,
              errors: [responseObj.error_description]
            };
            callback(new Error(JSON.stringify(errObj)), null);
          } else {
            callback(null, responseData);
          }
        });
      } else {
        callback(err, null);
      }
    } else {
      charityAdminObj.charity_id = charityInfo.id;
      charityAdminObj.charityApproval = "exists";
      charityAdminObj.name = user.name;
      charityAdminObj.yourname = user.name;
      charityAdminObj.noEmail = true;
      singleEntity.entity_id = charityInfo.id;
      singleEntity.slug = charityInfo.slug;
      singleEntity.entity_type = 'charity';
      async.parallel({
        claimInsert: function(callback) {
          charityInfo.approval_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
          charityInfo.approved_by = props.adminUserId;
          user.first_name = user.name.split(' ')[0];
          user.last_name = user.name.split(' ')[1];
          user.email_address = user.email;
          console.log('in claim insert');
          if (charityData.system) {
            excuteQuery.insertAndReturnKey(sqlQueryMap['charity_claim_insert_signup'], [charityInfo.id, user.first_name, user.last_name, charityInfo.title, user.email_address, user.phone_number, charityInfo.ein, new Date(), charityInfo.approval_date, charityInfo.approved_by], function(err, result) {
              if (err) {
                callback(new Error(err), null);
              } else {
                console.log('Done in charity claim insert data');
                excuteQuery.queryForAll(sqlQueryMap['npupdateCharityStatus'], [result], function(err, result) {
                  if (err) {
                    callback(new Error(err), null);
                  } else {
                    console.log('charity status updated');
                    callback(null, result);
                  }
                });
              }
            });
          } else {
            callback(null, true);
          }
        },
        createPaymentGateway: function(callback) {
          var data = {};
          console.log(charityInfo);
          if (charityData.system) {
            var data = {};
            data.charity_id = charityInfo.id;
            data.individual = null;
            data.original_ip = charityData.original_ip;
            data.original_device = charityData.original_device;
            data.user_id = charityData.user_id;
            data.country_code = charityData.address.country_code;
            excuteQuery.queryForAll(sqlQueryMap['getCodeOnCharity'], [charityInfo.id], function(err, result) {
              if (err) {
                console.log('Error in getting code for system charity:');
                callback(new Error(err), null);
              } else {
                if (result[0]) {
                  data.id = result[0].id;
                  console.log('in payemnt gateway:' + JSON.stringify(data));
                  codeService.checkPaymentGateways(data, function(err, result) {
                    if (err) {
                      callback(err, null);
                    } else {
                      console.log('payement account created successfull');
                      //  console.log(result);
                      callback(null, result);
                    }
                  });
                } else {
                  callback('No code found for system charity:', null);
                }
              }
            });
          } else {
            callback(null, true);
          }

        },
        addCharityAdmin: function(callback) {
          charityService.addCharityAdmin(charityAdminObj, function(err, result) {
            if (err) {
              callback(err, null);
            } else {
              console.log('Add charityAdmin done');
              callback(null, result);
            }
          });
        }
      }, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          charityService.getCharityData(user.id, function(err, charities) {
            if (err) {
              callback('Error in getting charities information for user', null);
            } else {
              console.log('charities:' + JSON.stringify(charities));
              user.charities = charities;
              excuteQuery.queryForAll(sqlQueryMap['getCharityName'], [charityInfo.id], function(err, result) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  console.log(result);
                  callback(null, {
                    user: user,
                    token: charityInfo.token,
                    charity: result[0]
                  });
                }
              });
              agenda.now('create campaign/donor/charity in elasticsearch', singleEntity);
              //            agenda.now('Save postal code user and charity', charityData);
            }
          });

        }
      });
    }
  });
};

exports.signupUserAndAddAsAdmin = function(charityData, callback) {
  var charityAdminObj = getCharityAdminObj(charityData);
  var singleEntity = {};
  var charityInfo = {};
  var user = {
    first_name: charityData.first_name,
    last_name: charityData.last_name,
    email: charityData.email
  };
  var me = this;
  var ein = charityData.ein;
  var ein2 = ein.split('-').join('');
  async.waterfall([
    function(callback) {
      authService.userRegistrationWithoutPassword(charityData, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          user.userId = result.user_id;
          user.token = result.token;
          charityInfo.user_id = result.user_id;
          charityInfo.token = result.token;
          charityData.user_id = result.user_id;
          callback(null, result);
        }
      });
    },
    function(userId, callback) {
      excuteQuery.queryForAll(sqlQueryMap['checkCharityByein'], [ein, ein2], function(err, result) {
        if (err) {
          console.log(err);
          callback(new Error(err), null);
        } else {
          if (result[0]) {
            charityInfo.system = true;
            console.log("charity info:" + JSON.stringify(result[0]));
            callback(null, result[0]);
          } else {
            me.createCharity(charityData, function(err, charity) {
              if (err) {
                callback(err, null)
              } else {
                charity.id = charity.charity_id;
                charityInfo.system = false;
                callback(null, charity);
              }
            });
          }
        }
      });
    },
    function(charity, callback) {
      if (charityInfo.system) {
        charityInfo = charity;
        charityInfo.system = true;
      }
      charityInfo = charity;
      //      callback(null,charity);
      if (charityInfo.system) {
        charityInfo.approval_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
        charityInfo.approved_by = props.adminUserId; //charityInfo.id,user.first_name,user.last_name,charityInfo.title,user.email_address,user.phone_number,charityInfo.ein,new Date(),charityInfo.approval_date,charityInfo.approved_by
        excuteQuery.insertAndReturnKey(sqlQueryMap['charity_claim_insert_signup'], [charityInfo.id, charityData.first_name, charityData.last_name, charityInfo.title, charityData.email, charityData.phone_number, charityInfo.ein, new Date(), charityInfo.approval_date, charityInfo.approved_by], function(err, result) {
          if (err) {
            callback(new Error(err), null);
          } else {
            console.log('Done charity insert info');
            callback(null, result);
          }
        });
      } else {
        callback(null, true);
      }
    },
    function(result, callback) {
      if (charityInfo.system) {
        excuteQuery.queryForAll(sqlQueryMap['npupdateCharityStatus'], [result], function(err, result) {
          if (err) {
            callback(new Error(err), null);
          } else {
            console.log('charity status updated');
            callback(null, result);
          }
        })
      } else {
        callback(null, true);
      }
    },
    function(result, callback) {
      var data = {};
      console.log(charityInfo);
      if (charityInfo.system) {
        var data = {};
        data.charity_id = charityInfo.id;
        data.individual = null;
        data.original_ip = charityData.original_ip;
        data.original_device = charityData.original_device;
        data.user_id = charityData.user_id;
        data.country_code = charityData.address.country_code;
        excuteQuery.queryForAll(sqlQueryMap['getCodeOnCharity'], [charityInfo.id], function(err, result) {
          if (err) {
            console.log('Error in getting code for system charity:');
            callback(err, null);
          } else {
            if (result[0]) {
              data.id = result[0].id;
              codeService.checkPaymentGateways(data, function(err, result) {
                if (err) {
                  callback(err, null);
                } else {
                  console.log('payement account created successfull');
                  console.log(result);
                  callback(null, result);
                }
              });
            } else {
              callback('No code found for system charity:', null);
            }
          }
        });
      } else {
        callback(null, true);
      }

    }
  ], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      singleEntity.entity_id = charityInfo.id;
      singleEntity.slug = charityInfo.slug;
      singleEntity.entity_type = "charity";
      charityAdminObj.charityApproval = "newApproval";
      charityAdminObj.charity_id = charityInfo.id;
      charityInfo.charity_id = charityInfo.id;
      charityService.addCharityAdmin(charityAdminObj, function(err, result) {
        if (err) {
          callback(err, null);
        } else {

          charityService.getCharityData(user.userId, function(err, charities) {
            if (err) {
              callbakc('Charity claimed . Failed in getting user details', null);
            } else {
              user.charities = charities;
              callback(null, {
                user: user,
                token: charityInfo.token
              });
            }
          });
          charityInfo.postal_code = charityData.postal_code;
          //  agenda.now('Save postal code user and charity', charityInfo);
          agenda.now('create campaign/donor/charity in elasticsearch', singleEntity);
        }
      });
    }
  });
};


exports.updateAddressByPostalcode = function(charityData, callback) {
  var country_id;
  var state_id;
  authService.getPostalInformation(charityData.postal_code, function(err, info) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      console.log(info);
      async.waterfall([
        function(callback) {
          console.log('in check of country status');
          excuteQuery.queryForAll(sqlQueryMap['checkCountryStatus'], [info.country], function(err, result) {
            if (err) {
              console.log(err);
              callback(new Error(err), null);
            } else {
              if (result && result.length) {
                callback(null, result);
              } else {
                console.log('country status not allowed');
                callback('COUNTRY_STATUS_NOT_ALLOWED', null);
              }

            }
          });
        },
        function(status, callback) {
          excuteQuery.queryForAll(sqlQueryMap['getCountryCode'], [info.country], function(err, result) {
            if (err) {
              consoe.log(err);
              callback(new Error(err), null);
            } else {
              if (result && result.length > 0) {
                console.log('country code error');
                country_code = result[0].id;
                callback(null, country_code);
              } else {
                callback('COUNTRY_CODE_ERROR', null);
              }
            }
          });
        },
        function(country_code, callback) {
          excuteQuery.queryForAll(sqlQueryMap['getStateCode'], [info.state, country_code], function(err, result) {
            if (err) {
              callback(new Error(err), null);
            } else {
              console.log('in state code');
              if (result && result.length > 0) {
                console.log('get state code');
                state_code = result[0].id;
                callback(null, result);
              } else {
                callback('No state found', null);
              }
            }
          });
        }
      ], function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          excuteQuery.queryForAll(sqlQueryMap['saveDonorLocation'], [country_code, state_code, info.city, info.postal_code, charityData.user_id], function(err, result) {
            if (err) {
              callback(new Error(err), null);
            } else {
              excuteQuery.queryForAll(sqlQueryMap['updateCharityZipLocation'], [country_code, state_code, info.city, info.postal_code, charityData.charity_id], function(err, result) {
                if (err) {
                  callback(err, null);
                } else {
                  console.log('done with save donar locaiton and save update charity zip');
                  callback(result, null);
                }
              });
            }
          });
        }
      }); // End of waterfall method
    }
  });
};


exports.npSignupErrorHandler = function(err, charityData, callback) {
  var methods = [];
  var data = charityData;
  var responseData = {};

  if (!charityData.password) {
    callback(err, null);
  } else {
    if (err.error == 'CHARITY_ALREADY_CLAIMED') {
      data.firstname = charityData.first_name;
      data.lastname = charityData.last_name;
      async.series({
        signup: function(callback) {
          authService.userRegistrationWithoutPassword(charityData, function(err, result) {
            if (err) {
              callback(err, null);
            } else {
              responseData.token = result.token.token;
              excuteQuery.queryForAll(sqlQueryMap['userProfileByEmail'], [charityData.email], function(err, userProfile) {
                if (err) {
                  callback(err);
                } else {
                  responseData.user = userProfile[0];
                  responseData.error = 'CHARITY_ALREADY_CLAIMED';
                  callback(null, responseData);
                }
              });
            }
          });
        },
        charity: function(callback) {
          excuteQuery.queryForAll(sqlQueryMap['checkCharityByein'], [charityData.ein, charityData.ein.split('-').join('')], function(err, result) {
            if (err) {
              callback(new Error(err), null);
            } else {
              callback(null, result[0]);
            }
          });
        }
      }, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          responseData.charity = result.charity;
          callback(null, responseData);
        }
      });
    } else {
      async.series({
        token: function(callback) {
          authService.userLogin(charityData, function(err, result) {
            if (err) {
              callback(err, result);
            } else {
              if (result) {
                callback(null, result.token);
              }
            }
          });
        },
        user: function(callback) {
          var userInfoData;
          excuteQuery.queryForAll(sqlQueryMap['userProfileByEmail'], [charityData.email], function(err, result) {
            if (err) {
              callback(new Error(err), null);
            } else {
              userInfoData = result[0];
              charityService.getCharityData(userInfoData.id, function(err, result) {
                if (err) {
                  callback(err, null);
                } else {
                  userInfoData.charities = result;
                  callback(null, userInfoData);
                }
              });
            }
          });
        },
        charity: function(callback) {

          excuteQuery.queryForAll(sqlQueryMap['checkCharityByein'], [charityData.ein, charityData.ein], function(err, result) {
            if (err) {
              callback(new Error(err), null);
            } else {
              callback(null, result[0]);
            }
          });
        }
      }, function(error, result) {
        var responseData = {};
        if (error) {
          console.log('in the rror');
          console.log(error);
          callback(error, null);
        } else {
          responseData = result;
          if (!responseData.charity) {
            delete responseData.charity;
          }
          responseData.error = err.error;
          callback(null, responseData);
        }
      }); //End of async series
    }
  }
};

exports.validateCharityData = function(charityData, callback) {
  var ein = charityData.ein;
  async.series({
    checkEmail: function(callback) {
      authService.getUserByEmail(charityData.email, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          console.log(result);
          callback(null, result);
        }
      });

    },
    checkCharityClaim: function(callback) {
      if (!charityData.ein) {
        callback(null, true);
      } else {
        var ein2 = ein.split('-').join('');
        charityService.checkCharityClimeOrNot(ein, ein2, function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, result);
          }
        });
      }
    }
  }, function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      if (result.checkEmail[0] && result.checkCharityClaim[0]) {
        if (result.checkCharityClaim[0].email_address == charityData.email) {
          callback({
            error: 'EMAIL_ALREADY_EXISTS_NP_OWNER',
            flag: true
          }, null);
        } else {
          callback({
            error: 'EMAIL_ALREADY_EXISTS_NP_EXISTS',
            flag: true
          }, null);
        }
      } else if (result.checkEmail[0]) {
        callback(null, { message: 'EMAIL_ALREADY_EXISTS' });
      } else if (result.checkCharityClaim[0]) {
        callback({
          error: 'CHARITY_ALREADY_CLAIMED',
          flag: true
        }, null);
      } else {
        callback(null, { message: 'success' });
      }
    }
  });
};

//update charity ein
exports.updateCharityEin=function(data,callback){
  excuteQuery.queryForAll(sqlQueryMap['updateCharityEin'],[data.ein,data.id],function(err,result){
    if(err){
      callback(new Error(err),null);
    }else{
     callback(null,result);
    }
  });
}
exports.systemcharitylogoupdate = function(charityData, callback) {

  if(!charityData.logo_url){
    charityData.logo_url = props.default_org_profile_pic_url;
  }
  excuteQuery.queryForAll(sqlQueryMap['systemcharitylogoupdate'], [charityData.logo_url, charityData.web_url, charityData.id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
      var elasticSearch_data = {
        index: props.elastic_index + '_np',
        type: 'charity_for_fundraiser',
        doc: {
          profilepic: charityData.logo_url
        }
      }
      console.log("in systemcharity method....");
      console.log(charityData.id);
      excuteQuery.queryForAll(sqlQueryMap['getCharityEntity'], [charityData.id], function(err, result) {
        if (err) {
          callback(new Error(err), null);
        } else {
          elasticSearch_data.id = result[0].id;
          elasticService.updateDocument(elasticSearch_data, function(err, result) {
            if (err) {
              utility.nodeLogs('ERROR', 'error occured while updating the profilepic_url in elasticsearch')
            } else {
              utility.nodeLogs('INFO', 'profilepic_url successfully updated in elasticSearch');
            }
          });
          singleObject = {};
          singleObject.entity_id = charityData.id;
          singleObject.id = result[0].id;
          singleObject.entity_type = result[0].entity_type;
          singleObject.update = true;
          agenda.now('create campaign/donor/charity in elasticsearch', singleObject);
        }
      });
    }
  });
}

exports.storeCharityToElasticSearch = function(charity_id, callback) {
  var charityObject = {

  };
  console.log(charity_id);
  console.log('getEntityOfCharity', sqlQueryMap['getEntityOfCharity']);
  var elasticData = {
    index: props.elastic_index + '_np',
    type: 'charity_for_fundraiser'
  }
  excuteQuery.queryForAll(sqlQueryMap['getEntityOfCharity'], [charity_id, charity_id, charity_id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
      utility.nodeLogs('ERROR', 'Error in adding charity to elastic search');
    } else {

      if (result[0]) {
        charityObject.entityid = result[0].entity_id;
        charityObject.id = result[0].id;
        charityObject.state = result[0].state;
        charityObject.city = result[0].city;
        charityObject.profilepic = result[0].profile_pic_url;
        charityObject.username = result[0].slug;
        charityObject.fullname = result[0].name;
        charityObject.type = 'charity';
        charityObject.ein = result[0].ein;
        charityObject.description = result[0].description;
        charityObject.location = "";
        charityObject.background_pic_url = result[0].background_pic_url;
        charityObject.code = result[0].code;
        charityObject.code_id = result[0].code_id;
        charityObject.suggested_donation = result[0].suggested_donation;
        charityObject.payment_gateway = result[0].payment_gateway;
        charityObject.currency_symbol = result[0].currency_symbol;
        charityObject.currency_code = result[0].currency_code;
        charityObject.status = 'PENDING';
        elasticData.charityData = charityObject;
        elasticService.addDocument(elasticData, function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', err);
          } else {
            utility.nodeLogs('info', result);
            utility.nodeLogs('INFO', 'Charity added to elastic search successfully with pending state');
          }
          callback(null, { success: true });
        });

      } else {
        utility.nodeLogs('ERROR', 'Some thing went wrong in adding elastic search the charity :' + charity_id);
      }

    }
  });

};
exports.getAllCampaignsBasedOnCategory = function(obj, callback) {
  var value = sqlQueryMap["campaignBasedOnCategory"];
  if(!obj.limit){
   obj.limit=12;
  }
  if (obj.categoryId) {
    if(obj.teamid){
    value += ' and c.team_campaign="no" and c.donotallow_p2p_campaigns="no" and c.team_id is null and category_id=' + "'" + obj.categoryId + "'" + 'group by c.id order by c.id desc, e.nooffollowers desc limit '+ obj.limit  ;
    }else{
    value += ' and category_id=' + "'" + obj.categoryId + "'" + 'group by c.id order by c.id desc, e.nooffollowers desc limit '+ obj.limit ;
  }
  } else {
    if(obj.teamid){
    value += ' and c.team_campaign="no" and c.donotallow_p2p_campaigns="no" and c.team_id is null group by c.id order by c.id desc, e.nooffollowers desc limit '+ obj.limit;
  }else{
    value += ' group by c.id order by c.id desc, e.nooffollowers desc limit '+ obj.limit;
  }
  }
  excuteQuery.queryForAll(value, [value], function(err, rows) {
    if (err) {
      console.log(err);
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
}

exports.getCampaignUser=function(obj,callback){
  excuteQuery.queryForAll(sqlQueryMap["getP2pCampaignDetails"], [obj.userid], function(err, rows) {
    if (err) {
      console.log(err);
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
}
exports.getCampaignsCount = function(obj, callback) {
  var value = sqlQueryMap["campaignsCountBasedOnCategory"];
  if(!obj.limit){
   obj.limit=12;
  }
  if (obj.categoryId) {
    if(obj.teamid){
    value += ' and c.team_campaign="no" and c.team_id is null and category_id=' + obj.categoryId ;
    }else{
    value += ' and category_id= '+ obj.categoryId ;
  }
  } else {
    if(obj.teamid){
    value += ' and c.team_campaign="no" and c.team_id is null';
  }else{
    value += ' ';
  }
  }
  excuteQuery.queryForAll(value, [value], function(err, rows) {
    if (err) {
      console.log(err);
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
}

exports.getMoreCampaigns=function(obj, callback) {
  var value = sqlQueryMap["campaignBasedOnCategory"];
  if(!obj.limit){
   obj.limit=12;
  }
  if (obj.categoryId) {
    if(obj && obj.teamid){
      value += ' and c.donotallow_p2p_campaigns="no" '
    }
    value += ' and c.team_campaign="no" and c.team_id is null and c.category_id=' + obj.categoryId +' order by c.id desc limit ' +obj.limit+' offset '+ obj.offset;
  } else {
    if(obj && obj.teamid){
      value += ' and c.donotallow_p2p_campaigns="no" '
    }
    value += ' and c.team_campaign="no" and c.team_id is null'+' limit ' +obj.limit+' offset '+ obj.offset;;
  }

  excuteQuery.queryForAll(value, [value], function(err, rows) {
    if (err) {
      console.log(err);
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
}

exports.sendMailToCreator = function(obj, callback) {
    var me = this;
    me.sendMailToCreator(obj, function(err, result) {
      if (err) {
        console.log("error");
      } else {
        callback(null, { 'status':'success' });
      }
    });
  }

  exports.sendMailToCreator = function(codeObjects, callback) {
    console.log(codeObjects);
    var mandrilObject = {};
    mandrilObject.from = props.fromemail;
    mandrilObject.text = "";
    mandrilObject.subject = "Mail from WonderWe";
    mandrilObject.reply = codeObjects.email;
    mandrilObject.email = codeObjects.owneremail;
    mandrilObject.template_name = "Send Mail To Campaign Creator";
    mandrilObject.template_content = [{
      "name": "inviteename",
      "content": "*|INVITEE_NAME|*"
    }, {
      "name": "name",
      "content": "*|NAME|*"
    }, {
      "name": "email",
      "content": "*|EMAIL|*"
    }, {
      "name": "message",
      "content": "*|MESSAGE|*"
    }, {
      "name": "linktohome",
      "content": "*|HOMEPAGE|*"
    }];
    mandrilObject.merge_vars = [{
      "name": "INVITEE_NAME",
      "content": codeObjects.name
    }, {
      "name": "NAME",
      "content": codeObjects.creatorname
    }, {
      "name": "EMAIL",
      "content": codeObjects.email
    }, {
      "name": "MESSAGE",
      "content": codeObjects.message
    }, {
      "name": "HOMEPAGE",
      "content": props.domain
    }];
    utility.mandrillTemplate(mandrilObject, function(err, result) {
      if (err) {
        utility.nodeLogs('ERROR', {
          message: 'Error inviteename send mail to creator',
          error: err
        });
        callback(null,{'status':'success'});
      } else {
        utility.nodeLogs('INFO', {
          message: 'Successfully sent mail to creator',
          result: result
        });
        callback(null,{'status':'success'});
      }
    });
};
//get country id based on country code
exports.getCountryId=function(obj,callback){
  excuteQuery.queryForAll(sqlQueryMap["getCountryid"], [obj.countryCode], function(err, rows) {
    if (err) {
      console.log(err);
      callback(new Error(err), null);
    } else {
      if(rows.length){
 excuteQuery.queryForAll(sqlQueryMap["getStatesBasedOnCountryid"], [rows[0].id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
    callback(null, result);
    }
  });
      }else{
        callback(null,{status:'success'})

      }
    }
  });
}
exports.getStateId = function(obj,callback){
  excuteQuery.queryForAll(sqlQueryMap["getStateCode"],[obj.statename,obj.Countryid],function(err,results){
    if(err){
      console.log(err);
      callback(new Error(err),null);
    }else{
      callback(null,results);
    }
  });
}

//for mobile mentions
exports.campaignComments = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['campaignComments'], [obj.codeid,parseInt(obj.skip),obj.codeid,parseInt(obj.skip)], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      console.log("result",result)
      callback(null, result);
    }
  });
};