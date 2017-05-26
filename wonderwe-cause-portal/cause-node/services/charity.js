var uslug = require('uslug');
var elasticService = require('./elastic');
var pageService = require('./pages');
var codeService = require('./code');
var followerService = require('../services/follower');


exports.getCharityAdmin = function(userId, charityId, callback) {
  //Connection Code
  excuteQuery.queryForAll(sqlQueryMap['getCharityAdminUserPermissions'], [charityId, userId], function(err, charityrows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      var arr = [];
      if (charityrows.length > 0) {
        var obj = {};
        obj.name = charityrows[0].name;
        obj.admin_id = charityrows[0].admin_id;
        arr.push(obj);
      }
      arr.push(charityrows[0]);
      callback(null, arr);
    }
  });
};

exports.removeAdminUserByCharity = function(charityObj, callback) {
  //Connection Code
  excuteQuery.update(sqlQueryMap['removeAdminUserByCharity'], [moment.utc().toDate(), charityObj.charityAdminId, charityObj.charityId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, charityObj.charityAdminId);
    }
  });
};
exports.getAllAdminUsersByCharity = function(charityId, userId, callback) {
  //Connection Code
  excuteQuery.queryForAll(sqlQueryMap['adminUsersByCharity'], [charityId, userId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.addCharityAdmin = function(charityAdminObj, callback) {
  var me = this;
  console.log(charityAdminObj);
  if (charityAdminObj.email) {
    excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [charityAdminObj.email], function(err, userResult) {
      if (err) {
        callback(new Error(err), null);
      } else {
        console.log("userResultuserResultuserResult")
        console.log(userResult)
        console.log(userResult.length - 1)
        console.log(userResult[userResult.length - 1]);
        if (userResult.length && userResult[userResult.length - 1].date_deleted != null) {
          callback(null, {
            "msg": "This Email account has been cancelled"
          });
        } else {
          //TODO When approve the charityClaimRequest then send the CharityApproval email based on this Condition
          if (charityAdminObj.charityApproval) {
            excuteQuery.queryForAll(sqlQueryMap['checkAdminEmailInCharity'], [charityAdminObj.charity_id, userResult[userResult.length - 1].id], function(err, adminResult) {
              if (err) {
                callback(new Error(err), null);
              } else {
                if (adminResult && adminResult.length > 0) {
                  callback(null, {
                    "msg": "user already exists in this charity as a admin, please choose another emailid"
                  });
                } else {
                  console.log('before admin send ');
                  insertAdminDetails(charityAdminObj, userResult[userResult.length - 1].id, userResult[userResult.length - 1].name, callback);
                  charityAdminObj.invite_id = userResult[userResult.length - 1].id;
                  if (!charityAdminObj.noEmail) {
                    me.sendEmailToApproveCharityAdmin(charityAdminObj, function() {

                    });
                    //agenda.now('sendEmailToApproveCharityAdmin', charityAdminObj);
                  }
                  //sendEmailToApproveCharityAdmin(charityAdminObj, callback);
                }
              }
            });
          } else {
            if (userResult && userResult.length > 0) {
              excuteQuery.queryForAll(sqlQueryMap['checkAdminEmailInCharity'], [charityAdminObj.charity_id, userResult[userResult.length - 1].id], function(err, adminResult) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  if (adminResult && adminResult.length > 0) {
                    callback(null, {
                      "msg": "user already exists in this charity as a admin, please choose another email"
                    });
                  } else {
                    insertAdminDetails(charityAdminObj, userResult[userResult.length - 1].id, userResult[userResult.length - 1].name, callback);
                    //sendEmailToInviteCharityAdmin(charityAdminObj.email, userResult[0].id, userResult[0].name, charityAdminObj.charity_id, "exists", callback);
                    var obj = {};
                    obj.email = charityAdminObj.email;
                    obj.userid = userResult[userResult.length - 1].id;
                    obj.name = userResult[userResult.length - 1].name;
                    obj.charity_id = charityAdminObj.charity_id;
                    obj.flag = 'exists';
                    agenda.now('sendEmailToInviteCharityAdmin', obj);
                  }
                }
              });
            } else {
              //TODO when do adduser with new user then yourname is mandatory
              if (charityAdminObj.yourname) {
                excuteQuery.insertAndReturnKey(sqlQueryMap['addNewAdmin'], [charityAdminObj.email, charityAdminObj.yourname, uuid.v4() + "-" + uslug(charityAdminObj.yourname)], function(err, userResult) {
                  if (err) {
                    callback(new Error(err), null);
                  } else {

                    var userEntityObject = {};
                    userEntityObject.entity_id = userResult;
                    userEntityObject.entity_type = 'user';

                    var count = 1;
                    var usrSlug = uslug(charityAdminObj.yourname);
                    var originlSlug = uslug(charityAdminObj.yourname);

                    me.slugCreation(userEntityObject, usrSlug, count, originlSlug, function(err, entityData) {
                      //   });
                      //    excuteQuery.insertAndReturnKey(sqlQueryMap['userIdStoreInEntity'], [userResult, 'user'], function(err, entityData) {
                      if (err) {
                        callback(err, null);
                      } else {
                        excuteQuery.insertAndReturnKey(sqlQueryMap['addProfilePic'], [userResult], function(err, profileData) {
                          if (err) {
                            callback(new Error(err), null);
                          } else {
                            insertAdminDetails(charityAdminObj, userResult, charityAdminObj.yourname, callback);
                            //sendEmailToInviteCharityAdmin(charityAdminObj.email, userResult, charityAdminObj.yourname, charityAdminObj.charity_id, "new", callback);
                            var obj = {};
                            obj.email = charityAdminObj.email;
                            obj.userid = userResult;
                            obj.name = charityAdminObj.yourname;
                            obj.charity_id = charityAdminObj.charity_id;
                            obj.flag = 'new';
                            agenda.now('sendEmailToInviteCharityAdmin', obj);
                          }
                        });
                      }

                    });
                  }
                });
              } else {
                callback(null, {
                  "namevalidation": "please enter the name"
                });
              }
            }
          }
        }
      }
    });
  } else {
    callback(null, {
      "msg": "please enter the email"
    });

  }

};

exports.sendEmailToInviteCharityAdmin = function(email, id, name, charity_id, flag, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCharityName'], [charity_id], function(err, userResult1) {
    if (err) {
      callback(err, null);
    } else {
      //Added Mandril Admin Template
      var charityName = {};
      if (userResult1[0] && userResult1[0].name_tmp) {
        charityName = userResult1[0].name_tmp;
      } else {
        charityName = '';
      }
      var finalobjectmandril = {};
      finalobjectmandril.from = props.fromemail;
      finalobjectmandril.email = email;
      finalobjectmandril.text = "";
      finalobjectmandril.subject = charityName + " added you as an admin on WonderWe.";
      //TODO new means if user don't have account
      if (flag == "new") {
        finalobjectmandril.template_name = "Admin Invitation New User";
        finalobjectmandril.template_content = [{
          "name": "name",
          "content": "*|NAME|*"
        }, {
          "name": "charityname",
          "content": "*|CHARITYNAME|*"
        }, {
          "name": "createpassword",
          "content": "*|CREATEPASSWORD|*"
        }];
        finalobjectmandril.merge_vars = [{
          "name": "NAME",
          "content": name
        }, {
          "name": "CHARITYNAME",
          "content": charityName
        }, {
          "name": "CREATEPASSWORD",
          "content": props.domain + "/pages/invitedonor/resetpassword/" + id + "/" + charity_id + "/" + charityName + "/" + "charity"
        }];
        //TODO exists means if user already have a account
      } else if (flag == "exists") {
        finalobjectmandril.subject = charityName + " added you as an admin on WonderWe.";
        finalobjectmandril.template_name = "Admin Invitation - existing user";
        finalobjectmandril.template_content = [{
          "name": "name",
          "content": "*|NAME|*"
        }, {
          "name": "charityname",
          "content": "*|CHARITYNAME|*"
        }, {
          "name": "loginpage",
          "content": "*|LOGINPAGE|*"
        }];
        finalobjectmandril.merge_vars = [{
          "name": "NAME",
          "content": name
        }, {
          "name": "CHARITYNAME",
          "content": charityName
        }, {
          "name": "LOGINPAGE",
          "content": props.domain + "/login"
        }];
      }

      utility.mandrillTemplate(finalobjectmandril, function(err, data) {
        if (err) {
          callback(err);
        } else {
          utility.log('info', 'mail send successfully');
          callback(null, data);
        }
      });
    }
  });

}

exports.sendEmailToApproveCharityAdmin = function(charityAdminObj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCharityNameSlug'], [charityAdminObj.charity_id], function(err, userResult1) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      //Added Mandril Admin Template
      console.log(userResult1);
      var charityName = {};
      if (userResult1[0] && userResult1[0].name_tmp) {
        charityName = userResult1[0].name_tmp;
      } else {
        charityName = '';
      }
      var finalobjectmandril = {};
      finalobjectmandril.from = props.fromemail;
      finalobjectmandril.email = charityAdminObj.email;
      finalobjectmandril.text = "";
      finalobjectmandril.subject = charityName + " is approved!";
      //TODO new means user don't have account
      console.log(charityAdminObj);
      if (charityAdminObj.charityApproval == "new") {
        finalobjectmandril.template_name = "New organization approval - no account";
        finalobjectmandril.template_content = [{
          "name": "name",
          "content": "*|NAME|*"
        }, {
          "name": "charityname",
          "content": "*|CHARITYNAME|*"
        }, {
          "name": "createpassword",
          "content": "*|CREATEPASSWORD|*"
        }];
        finalobjectmandril.merge_vars = [{
          "name": "NAME",
          "content": charityAdminObj.yourname
        }, {
          "name": "CHARITYNAME",
          "content": charityName
        }, {
          "name": "CREATEPASSWORD",
          "content": props.domain + "/" + userResult1[0].slug
        }];
        //TODO exists user aready have a account
      } else if (charityAdminObj.charityApproval == 'exists') {
        finalobjectmandril.subject = charityName + " is approved!";
        finalobjectmandril.template_name = "New Organization approved";
        finalobjectmandril.template_content = [{
          "name": "name",
          "content": "*|NAME|*"
        }, {
          "name": "charityname",
          "content": "*|CHARITYNAME|*"
        }, {
          "name": "loginpage",
          "content": "*|CAMPAIGN_URL|*"
        }];
        console.log('slug url in email:', props.domain + "/" + userResult1[0].slug);
        finalobjectmandril.merge_vars = [{
          "name": "NAME",
          "content": charityAdminObj.yourname
        }, {
          "name": "CHARITYNAME",
          "content": charityName
        }, {
          "name": "CAMPAIGN_URL",
          "content": props.domain + "/login"
        }];
      } else if (charityAdminObj.charityApproval == 'newApproval') {
        console.log('in new approval');
        finalobjectmandril.template_name = "New organization approval - no account";
        finalobjectmandril.template_content = [{
          "name": "name",
          "content": "*|NAME|*"
        }, {
          "name": "charityname",
          "content": "*|CHARITYNAME|*"
        }, {
          "name": "createpassword",
          "content": "*|CREATEPASSWORD|*"
        }];
        finalobjectmandril.merge_vars = [{
          "name": "NAME",
          "content": charityAdminObj.yourname
        }, {
          "name": "CHARITYNAME",
          "content": charityName
        }, {
          "name": "CREATEPASSWORD",
          "content": props.domain + "/pages/approve/charity/resetpassword/" + charityAdminObj.invite_id + "/" + charityAdminObj.charity_id + "/" + charityName + "/" + "charity"
        }];
      } else if (charityAdmin.charityApproval == 'existsApproval') {
        //Todo have to exists approval
      }
      console.log(finalobjectmandril);
      utility.mandrillTemplate(finalobjectmandril, function(err, data) {
        if (err) {
          callback(err);
        } else {
          utility.log('info', 'mail send successfully');
          callback(null, 'Done well');
        }
      });
    }
  });
}

function insertAdminDetails(charityAdminObj, id, name, callback) {
  charityAdminObj.user_id = id;
  var query = excuteQuery.insertAndReturnKey(sqlQueryMap['addCharityAdmin'], [charityAdminObj.charity_id, id, charityAdminObj.can_post, charityAdminObj.can_update_financial, charityAdminObj.can_request_withdrawal, charityAdminObj.can_view_reports, charityAdminObj.can_code, charityAdminObj.can_manage_followers, charityAdminObj.can_admin, charityAdminObj.defaultuser], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO: Check the Updated Rows and See InsertID is Valid Value.
      charityAdminObj.id = rows;
      charityAdminObj.name = name;
      charityAdminObj.mailUserId = id;

      if (props.environment_type == 'production') {
        charityAdminObj.profile_pic_url = "https://wonderwe-prod.s3.amazonaws.com/profile/92cc3195-8136-4f4f-8f5e-f859263d34f5-default-userpng.png";
      } else {
        charityAdminObj.profile_pic_url = "https://wonderwe.s3.amazonaws.com/profile/2637709f-214d-4dbb-a551-a17f2f783a37-default-userpng.png";
      }
      callback(null, charityAdminObj);
    }
  });
}

exports.sendClaim = function(claimObj, callback) {
  excuteQuery.insertAndReturnKey(sqlQueryMap['charity_claim_insert'], [claimObj.charity_id, claimObj.first_name, claimObj.last_name, claimObj.title, claimObj.email_address, claimObj.phone_number, claimObj.ein, claimObj.date_created], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO: Check the Updated Rows and See InsertID is Valid Value.
      claimObj.id = rows;
      var newClaimObj = {};
      if (claimObj && claimObj.charity_title) {
        newClaimObj.charity_title = claimObj.charity_title;
      } else {
        newClaimObj.charity_title = '';
      }
      if (claimObj && claimObj.first_name) {
        newClaimObj.first_name = claimObj.first_name;
      } else {
        newClaimObj.first_name = '';
      }
      if (claimObj && claimObj.last_name) {
        newClaimObj.last_name = claimObj.last_name;
      } else {
        newClaimObj.last_name = '';
      }
      if (claimObj && claimObj.email_address) {
        newClaimObj.email_address = claimObj.email_address;
      } else {
        newClaimObj.email_address = '';
      }
      if (claimObj && claimObj.phone_number) {
        newClaimObj.phone_number = claimObj.phone_number;
      } else {
        newClaimObj.phone_number = '';
      }
      if (claimObj && claimObj.ein) {
        newClaimObj.ein = claimObj.ein;
      } else {
        newClaimObj.ein = '';
      }
      async.series({
          usercharity: function(callback) {
            var finalobjectmandril = {};
            finalobjectmandril.from = props.fromemail;
            finalobjectmandril.email = claimObj.email_address;
            finalobjectmandril.text = "";
            finalobjectmandril.subject = "Your request to claim " + newClaimObj.charity_title + " is pending";
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
              "content": newClaimObj.charity_title
            }, {
              "name": "FNAME",
              "content": newClaimObj.first_name
            }];
            utility.mandrillTemplate(finalobjectmandril, callback);
          },

          admincharity: function(callback) {
            var finalobjectmandril = {};
            finalobjectmandril.from = props.fromemail;
            finalobjectmandril.email = "admin@wonderwe.com";
            finalobjectmandril.text = "";
            finalobjectmandril.subject = "You received a new claim request on WonderWe";
            finalobjectmandril.template_name = "Claim Request Info";
            finalobjectmandril.template_content = [{
              "name": "fName",
              "content": "*|FNAME|*"
            }, {
              "name": "lName",
              "content": "*|LNAME|*"
            }, {
              "name": "Email",
              "content": "*|EMAIL|*"

            }, {
              "name": "Phone Number",
              "content": "*|PHONE|*"

            }, {
              "name": "Charity Tax ID",
              "content": "*|EIN|*"

            }, {
              "name": "Charity name",
              "content": "*|TITLE|*"
            }];
            finalobjectmandril.merge_vars = [{
              "name": "FNAME",
              "content": newClaimObj.first_name
            }, {
              "name": "LNAME",
              "content": newClaimObj.last_name
            }, {
              "name": "EMAIL",
              "content": newClaimObj.email_address
            }, {
              "name": "PHONE",
              "content": newClaimObj.phone_number
            }, {
              "name": "EIN",
              "content": newClaimObj.ein
            }, {
              "name": "TITLE",
              "content": newClaimObj.charity_title

            }];
            utility.mandrillTemplate(finalobjectmandril, callback);

          }
        },
        function(err, results) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, claimObj);
          }


        });
    }
  });
};

exports.getAllClaims = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getAllClaims'], [], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.getAllApprovedClaims = function(obj,callback) {

  excuteQuery.queryForAll(sqlQueryMap['getAllApprovedClaims'], [], function(err,rows) {
    if(err){
      callback(new Error(err), null);
    } else{
      callback(null, rows);
      console.log(rows);
    }
  });
};


exports.updateCharityAppFee = function(appfeeobj, userCallback)
{
  //console.log("app-feeeeeee" + appfeeobj);
  async.parallel({
    charityUpdate:function(callback){
      excuteQuery.queryForAll(sqlQueryMap['updateCharityAppFee'],[appfeeobj.app_fee, appfeeobj.id], function(err, rows) {
    if(err) {
      callback(new Error(err), null);
    } else{
      callback(null, rows);
    }});
    },
    charityCodeUpdates:function(callback){
      excuteQuery.queryForAll(sqlQueryMap['updateCharityAppFeeForCodes'],[appfeeobj.app_fee, appfeeobj.id], function(err, rows) {
    if(err) {
      callback(new Error(err), null);
    } else{
      callback(null, rows);
    }
  });
    }
  },function(err,result){
    if(err){
      userCallback(err, null)
    }else{
      userCallback(null, result);
    }

  })
};


exports.updateClaim = function(claimObj, callback) {

  excuteQuery.update(sqlQueryMap['updateClaim'], [claimObj.approval_date, claimObj.admin_user_id, claimObj.id], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO: Check the Updated Rows and See InsertID is Valid Value.
      excuteQuery.update(sqlQueryMap['updateCharityStatus'], [claimObj.id], function(err, rows) {
        if (err) {
          callback(new Error(err), null);
        } else {
          claimObj.affectedRows = rows;
          excuteQuery.queryForAll(sqlQueryMap['getclaimdata'], [claimObj.id], function(err, charityInfo) {
            /*  async.parallel({
                charityInfoStoreInElastic: function(callback) {*/
            if (charityInfo && charityInfo.length > 0) {
              excuteQuery.queryForAll(sqlQueryMap['getEntity'], [charityInfo[0].charity_id, 'charity'], function(err, entityInfo) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  var entityObj = {};
                  entityObj.entity_id = charityInfo[0].charity_id;
                  entityObj.entity_type = 'charity';
                  //entityObj.update = "update";
                  if (entityInfo && entityInfo.length > 0) {
                    entityObj.id = entityInfo[0].id;
                    entityObj.slug = entityInfo[0].slug;
                  }
                  callback(null, entityObj);
                  agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
                }
              });
            } else {
              callback(null, claimObj);
            }

            /* },
              codeInfoStoreInElastic: function(callback) {
                if (charityInfo && charityInfo.length > 0) {
                  excuteQuery.queryForAll(sqlQueryMap['getdefaultcodedata'], [charityInfo[0].charity_id], function(err, codeInfo) {
                    if (codeInfo && codeInfo.length > 0) {
                      excuteQuery.queryForAll(sqlQueryMap['getEntity'], [codeInfo[0].id, 'code'], function(err, entityInfo) {
                        if (err) {
                          callback(new Error(err), null);
                        } else {
                          var entityObj = {};
                          entityObj.entity_id = codeInfo[0].id;
                          entityObj.entity_type = 'code';
                          //entityObj.update = "update";
                          if (entityInfo && entityInfo.length > 0) {
                            entityObj.id = entityInfo[0].id;
                            entityObj.slug = entityInfo[0].slug;
                          }
                          callback(null, entityObj);
                          agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
                        }
                      });
                    } else {
                      callback(null, claimObj);
                    }
                  });
                }
              },
            }, function(err, result) {
              if (err) {
                callback(err, null);
              } else {
                callback(null, claimObj);
              }
            }); */
          });
        }
      });
    }
  });

};


exports.denyClaimedUser = function(obj, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['denyClaim'], [obj.claimId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO: Check the Updated Rows and See InsertID is Valid Value.

      console.log(obj);
      excuteQuery.queryForAll(sqlQueryMap['selectedCharityName'], [obj.charityId], function(err, rows) {
        if (err) {
          callback(new Error(err), null);
        } else {
          var dataObj = {};
          if (rows[0] && rows[0].name_tmp) {
            dataObj.name_tmp = rows[0].name_tmp;
          } else {
            dataObj.name_tmp = '';
          }
          elasticService.updateNonProfitStatus(obj.charityId, 'NOT_CLAIMED', props.default_org_profile_pic_url, function(err, result) {
            if (err) {
              utility.nodeLogs('ERROR', err);
            } else {
              utility.nodeLogs('info', result);
              utility.nodeLogs('INFO', 'Charity updated to elastic search successfully with new state');
            }
          });
          var finalobjectmandril = {};
          finalobjectmandril.from = props.fromsupport;
          finalobjectmandril.email = obj.email;
          finalobjectmandril.text = "";
          finalobjectmandril.subject = "Your Charity Claim Request has not been Approved";
          finalobjectmandril.template_name = "Claim Rejection Response";
          finalobjectmandril.template_content = [{
            "name": "title",
            "content": "*|TITLE|*"
          }, {
            "name": "fname",
            "content": "*|FNAME|*"
          }];
          finalobjectmandril.merge_vars = [{
            "name": "TITLE",
            "content": dataObj.name_tmp
          }, {
            "name": "FNAME",
            "content": obj.fname
          }];
          utility.mandrillTemplate(finalobjectmandril, callback);
        }
      });

      //Getting campaigns claim request
      var charityAdminObj = {
        charityAdminId: obj.userId,
        charityId: obj.charityId
      };
      /* me.removeAdminUserByCharity(charityAdminObj,function(err,result){
         if(err){
           utility.nodeLogs('ERROR',{
             message:'Error in getting errors',
             error:err
           });
         }else{
           utility.nodeLogs('INFO',{
             message:'Charity admin delted successfully',
             error:err
           });
         }
       }); */
      //TODO :Need to write a agenda job to do this

      excuteQuery.queryForAll(sqlQueryMap['getCharityDefaultCampaignWithEntityid'], [obj.charityId], function(err, result) {
        if (err) {
          console.log(err);
          utility.nodeLogs('ERROR', {
            message: 'Error in gettting charity default campaign in deny claim request',
            error: err
          });
        } else {
          console.log('In the not error');
          if (result[0] && result[0].id) {
            excuteQuery.queryForAll(sqlQueryMap['getEntity'], [result[0].id, 'code'], function(err, result) {
              if (err) {
                utility.nodeLogs('ERROR', {
                  message: 'Error in getting slug to delete campaign after claim rejection',
                  error: err
                });
              } else {
                if (result[0]) {
                  codeService.deleteCampaign(result[0].slug, function(err, result) {
                    if (err) {
                      utility.nodeLogs('ERROR', {
                        message: 'Error in deleting code when charity claim deny',
                        error: err,
                        data: {
                          codeSlug: slug
                        }
                      });
                    } else {
                      utility.nodeLogs('INFO', {
                        message: 'successfully deleted campaign after rejection of campaign rejection',
                        result: result
                      });
                    }
                  });
                } else {
                  utility.nodeLogs({
                    message: 'Campaign slug not found in entity table to delete after deny request',
                    charityId: obj.charityId
                  });
                }
              }
            }); //End of getting entity query
          }
        }
      }); //End of getting charity default campaign query
    }
  });
};
exports.updateCharityAdmin = function(charityAdminUpdateObj, callback) {
  var query = excuteQuery.update(sqlQueryMap['updateCharityAdmin'], [charityAdminUpdateObj.can_post, charityAdminUpdateObj.can_update_financial, charityAdminUpdateObj.can_request_withdrawal, charityAdminUpdateObj.can_view_reports, charityAdminUpdateObj.can_code, charityAdminUpdateObj.can_manage_followers, charityAdminUpdateObj.can_admin, charityAdminUpdateObj.charity_id, charityAdminUpdateObj.user_id], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO: Check the Updated Rows and See InsertID is Valid Value.
      charityAdminUpdateObj.affectedRows = rows;
      callback(null, charityAdminUpdateObj);
    }
  });

};

exports.getProfileByCharity = function(charityId, callback) {
  //Connection Code
  excuteQuery.queryForAll(sqlQueryMap['profileByCharity'], [charityId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      excuteQuery.queryForAll(sqlQueryMap['selectCharityCategories'], [charityId], function(err, categoryIds) {
        if (err) {
          callback(new Error(err), null);
        } else {
          var category = [];
          if (categoryIds && categoryIds.length > 0) {
            async.each(categoryIds, function(obj, callback) {
              category.push(obj.category_id);
              callback(null);
            }, function(err) {
              if (err) {
                callback(err);
              } else {
                rows[0].category = category;
                callback(null, rows);
              }
            });
          } else {
            rows[0].category = [];
            callback(null, rows);
          }
        }
      });
    }
  });
};

exports.updateCharityProfile = function(charityProfileObj, callback) {
  console.log("BLUEGRASS");
  console.log(charityProfileObj);
  var me = this;
  charityProfileObj.slug = uslug(charityProfileObj.slug);
  charityProfileObj.type = 'update';
  me.validateEntitySlug(charityProfileObj, function(result) {
    if (result.data) {
      if (!charityProfileObj.background_pic_url) {
        if (process.env.NODE_ENV == 'production') {
          charityProfileObj.background_pic_url = "https://wonderwe-prod.s3.amazonaws.com/profile/073cab00-86ab-48ea-92db-a71fe3a9a790-default-charity-backgroundjpg.jpg";
        } else {
          charityProfileObj.background_pic_url = "https://wonderwe.s3.amazonaws.com/profile/bf65c8c0-1296-4e96-87e6-0ef346ec2424-default-charity-backgroundjpg.jpg";
        }
      }

      excuteQuery.update(sqlQueryMap['updateCharityProfileInOrg'], [charityProfileObj.title, charityProfileObj.full_description, charityProfileObj.web_url, charityProfileObj.profile_pic_url, charityProfileObj.background_pic_url, charityProfileObj.timezone, charityProfileObj.organization_id], function(err, results) {
        if (err) {
          callback(new Error(err), null);
        } else {
          charityProfileObj.affectedRows = results.affectedRows;
          me.updateCharityProfileAgenda(charityProfileObj);
          callback(null, charityProfileObj);
          // TODO:  Get Agenda to work!
          // agenda.now('updateCharityProfileAgenda', charityProfileObj);
        }
      });
    } else {
      callback(new Error(JSON.stringify({
        'errors': ['User name already in use, choose different one'],
        status: 400
      })), null);
    }
  });
  //   }
  // });
};
exports.updateCharityProfileAgenda = function(charityProfileObj, callback) {
  var me = this;
  var slug;
  async.parallel({
    orgCategories: function(categoriesCallback) {

      excuteQuery.queryForAll(sqlQueryMap['updateCategorys'], [charityProfileObj.charityId], function(err, charityrows1) {
        if (err) {
          categoriesCallback(err);
        } else {
          if (Array.isArray(charityProfileObj.category) && charityProfileObj.category.length > 0) {
            async.each(charityProfileObj.category, function(obj, eachCallback) {
              excuteQuery.insertAndReturnKey(sqlQueryMap['addSelectCategorys'], [obj, charityProfileObj.charityId], function(err, rowsInsert) {
                if (err) {
                  eachCallback(err);
                } else {
                  eachCallback(null);
                }
              });
            }, function(err) {
              if (err) {
                categoriesCallback(err, null);
              } else {
                //TODO: Check the Updated Rows and See InsertID is Valid Value.
                //  charityProfileObj.affectedRows = rowsOrg.affectedRows;
                categoriesCallback(null, charityProfileObj);
              }
            });

          } else {

            excuteQuery.insertAndReturnKey(sqlQueryMap['addSelectCategorys'], [charityProfileObj.category, charityProfileObj.charityId], function(err, rowsInsert) {
              if (err) {
                categoriesCallback(err, null);
              } else {
                //callback(null);
                // charityProfileObj.affectedRows = rowsOrg.affectedRows;
                categoriesCallback(null, charityProfileObj);
              }

            });

          }
        }
      });
    },
    updateSlug: function(slugCallback) {
      if (charityProfileObj.slug) {
        slug = uslug(charityProfileObj.slug);
        excuteQuery.update(sqlQueryMap['updateEntitySlug'], [slug, charityProfileObj.charityId, 'charity'], slugCallback);
      } else {
        slugCallback(null, {});
      }

    },
    updateCharity: function(charityUpdateCallback) {
      excuteQuery.update(sqlQueryMap['updateCharityName'], [charityProfileObj.title, charityProfileObj.charityId], charityUpdateCallback);
    }
  }, function(err, results) {

    excuteQuery.queryForAll(sqlQueryMap['getEntity'], [charityProfileObj.charityId, 'charity'], function(err, rows) {
      var entityObj = {};
      entityObj.entity_id = charityProfileObj.charityId;
      entityObj.entity_type = 'charity';
      entityObj.id = rows[0].id;
      entityObj.slug = rows[0].slug;
      entityObj.update = 'update';
      console.log(entityObj);
      //      codeService.createCampaignUserCharityInElasticSearch(entityObj, function(err, result4) {});
      agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
    });


    // TODO: This doesn't work and I don't know what it's trying to do.  Andrew
    // if (err) {
    //   callback(err);
    // } else {
    //   excuteQuery.queryForAll(sqlQueryMap['getEntity'], [charityProfileObj.charityId, 'charity'], function(err, rows) {
    //     if (err) {
    //       callback(err);
    //     } else {
    //       callback(null, rows);
    //     }
    //   });
    //   callback(null, results)
    // }
  });
};
// excuteQuery.update(sqlQueryMap['updateCharityProfileInOrg'], [charityProfileObj.brief_description, charityProfileObj.web_url, charityProfileObj.profile_pic_url, charityProfileObj.background_pic_url, charityrows[0].organization_id], function(err, rowsOrg) {
//   if (err) {
//     callback(err);
//   } else {
//     excuteQuery.queryForAll(sqlQueryMap['updateCategorys'], [charityProfileObj.charityId], function(err, charityrows1) {
//       if (err) {
//         callback(err);
//       } else {
//         if (Array.isArray(charityProfileObj.category) && charityProfileObj.category.length > 0) {
//           async.each(charityProfileObj.category, function(obj, callback) {
//             excuteQuery.insertAndReturnKey(sqlQueryMap['addSelectCategorys'], [obj, charityProfileObj.charityId], function(err, rowsInsert) {
//               if (err) {
//                 callback(err);
//               } else {
//                 //callback(null);
//               }
//               callback(null);
//             });
//           }, function(err) {
//             if (err) {
//               callback(err);
//             } else {
//               //TODO: Check the Updated Rows and See InsertID is Valid Value.
//               charityProfileObj.affectedRows = rowsOrg.affectedRows;

//               callback(null, charityProfileObj);
//             }

//           });

//         } else {

//           excuteQuery.insertAndReturnKey(sqlQueryMap['addSelectCategorys'], [charityProfileObj.category, charityProfileObj.charityId], function(err, rowsInsert) {
//             if (err) {
//               callback(err);
//             } else {
//               //callback(null);
//               charityProfileObj.affectedRows = rowsOrg.affectedRows;

//               callback(null, charityProfileObj);
//             }

//           });

//         }
//       }
//     });

//   }

// });


exports.profilePicUpload = function(uploadProfileObj, callback) {

  var query = excuteQuery.update(sqlQueryMap['profilePicUrlUpdate'], [uploadProfileObj.profile_pic_url, uploadProfileObj.profile_pic_thumb_url, uploadProfileObj.orgId], function(err, rowsOrgPic) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO: Check the Updated Rows and See InsertID is Valid Value.
      uploadProfileObj.affectedRows = rowsOrgPic;
      callback(null, uploadProfileObj);
    }
  });

};
exports.getAllCategories = function(obj, callback) {
  //Connection Code
  excuteQuery.queryForAll(sqlQueryMap['allCategorys'], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });

};
exports.addSelectCategorys = function(obj, callback1) {
  //Connection Code

  async.each(obj, function(object, callback) {

    excuteQuery.insertAndReturnKey(sqlQueryMap['addSelectCategorys'], [object.category_id, object.charity_id], function(err, rows) {
      if (err) {
        callback(new Error(err), null);
      } else {
        callback(rows);
      }

    });
  }, function(err) {
    if (err) {
      callback1(err);
    } else {
      callback1(rows);

    }

  });

};
exports.getCharityInformation = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['charity_details'], [charityId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.getStates = function(countryId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getStates'], [countryId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.getCountryStates = function(userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCountryStates'], [userId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.getCountries = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCountries'], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.getDonationCountries = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getDonationCountries'], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};
exports.getCharityData = function(userId, callback) {
  var userId = userId;
  excuteQuery.queryForAll(sqlQueryMap['charity_count'], [userId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      var array = [];
      console.log("charity data:" + JSON.stringify(rows));
      async.each(rows, function(obj, callback) {
        excuteQuery.queryForAll(sqlQueryMap['getCharityAdminUserPermissions'], [obj.id, userId], function(err, rows1) {
          if (err) {
            callback(new Error(err), null);
          } else {
            if (rows1 && rows1.length > 0) {
              rows1[0].charityId = obj.id;
              array.push(rows1[0]);
            }
            callback(null);
          }

        });
      }, function(err) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, array);
        }
      });
    }
  });
};
exports.getAllCharitys = function(callback) {
  excuteQuery.queryForAll(sqlQueryMap['browseCharitys'], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.searchCharitys = function(name, callback) {
  excuteQuery.queryForAll(sqlQueryMap['charitySearch'], [name], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};
exports.searchByName = function(term, callback) {

  excuteQuery.queryForAll(sqlQueryMap['mentionsuggestions'], [term, term], function(err, rows) {
    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
};
exports.getCharityCountStats = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['charityCountStats'], [obj.charity_id, obj.charity_id], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.checkuserexistornot = function(userid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['checkUser'], [userid], function(err, rows) {
    if (err) {
      callback(err);
    } else {
      var result = rows[0];
      result.id = userid;
      callback(null, rows[0]);
    }
  });
};

exports.checkCharityPresence = function(ein, ein2, callback) {
  excuteQuery.queryForAll(sqlQueryMap['checkCharityPresence'], [ein, ein2], function(err, rows) {
    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
};

exports.checkCharityClimeOrNot = function(ein, ein2, callback) {
  excuteQuery.queryForAll(sqlQueryMap['checkCharityClimeOrNot'], [ein, ein2], function(err, rows) {
    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
};

exports.checkUserEmailExistOrNot = function(email, name, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['checkUserEmailPresence'], [email], function(err, rows) {
    if (err) {
      callback(err);
    } else {
      if (rows && rows.length > 0 && rows[rows.length - 1].date_deleted === null) {
        callback(null, rows[rows.length - 1]);
      } else {
        //verification_key,date_created
        var verification_key = uuid.v4() + "-" + uslug(name);
        var date = moment.utc().toDate();
        excuteQuery.insertAndReturnKey(sqlQueryMap['importdata'], [name, email, verification_key, date], function(err, id) {
          if (err) {
            callback(err);
          } else {
            var obj = {};
            obj.id = id;
            obj.msg = 'new';
            obj.name = name;
            callback(null, obj);


            var object = {};
            object.name = name;
            object.id = id;
            object.email = email;
            me.checkUserEmail(object.email, object.name, object.id, function(err, userDataRegister) {
            });
            // agenda.now('checkUserEmailExistOrNot', object);
          }
        });
      }
    }
  });
};
exports.getUserInfo = function(userid, callback) {
  console.log(userid);
  excuteQuery.queryForAll(sqlQueryMap['getUserInformation'], [userid], function(err, userResult) {
    if (err) {
      callback(err, null);
    } else {
      console.log(userResult);
      callback(null, userResult);

    }
  });
}
exports.checkUserEmail = function(email, name, id, callback) {
  var me = this;
  var entityObject = {};
  entityObject.entity_id = id;
  entityObject.entity_type = "user";
  //var count = 1;
  var usrSlug = uslug(name);
  var originlSlug = uslug(name);

  var userDetailsObject = {
    count: 1,
    name: name
  };

  me.entitySlugCreation(entityObject, usrSlug, userDetailsObject, originlSlug, function(err, userResult) {
    // excuteQuery.queryForAll(sqlQueryMap['userIdStoreInEntity'], [id, 'user'], function(err, userResult) {
    if (err) {
      callback(err, null);
    } else {
      var timezone_id = 381;
      excuteQuery.queryForAll(sqlQueryMap['useIdAddToUserProfile'], [id, timezone_id], function(err, userResult) {
        if (err) {
          callback(err, null);
        } else {
          var obj = {};
          obj.id = id;
          obj.msg = 'new';
          callback(null, obj);
            var followUserObj = {};
            followUserObj.followeduser_id = props.botId;
            followUserObj.user_id = id;
            followUserObj.date_followed = moment.utc().toDate();
            followerService.createFollowUser(followUserObj, function(err, data) {});//For following the WonderWe bot
        }
      });
    }
  });
}
exports.getDonorPreferences = function(obj, callback) {
  var userid = obj.userid;
  //5554

  if (obj.campType == 'fundraiseCamp') {
    pool.query("select * from code_fund_category_tbl where code_id=?", [parseInt(userid)], function(err, fundCamp) {
      if (err) {
        callback(err);
      } else {
        var fundCampPreferences = {}
        if (fundCamp && fundCamp.length > 0) {
          fundCampPreferences.preferences = underscore.pluck(fundCamp, 'code_group');
        } else {
          fundCampPreferences.preferences = [];
        }
        callback(null, fundCampPreferences);

      }

    })

  } else if (obj.campType == 'eventCamp') {
    //uesrid is nothing but event_id
    pool.query("select * from event_categories_tbl where event_id=?", [userid], function(err, eventCamp) {
      if (err) {
        callback(err);
      } else {
        var eventPreferences = {}
        if (eventCamp && eventCamp.length > 0) {
          eventPreferences.preferences = underscore.pluck(eventCamp, 'category_group');
        } else {
          eventPreferences.preferences = [];
        }
        callback(null, eventPreferences);

      }

    })
  } else {
    pool.query("select * from user_category_tbl where user_id=?", [parseInt(userid)], function(err, rows) {
      if (err) {
        callback(err);
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
  }
}



exports.donorPreferences = function(preferncesObj, callback) {
  //TODO remove all records of a donor and insert the new preferences for a donor

  var data = [];

  underscore.map(preferncesObj.preferences, function(num) {
    if (num && num.length > 1) {
      var newArray = num.split(',');
      underscore.map(newArray, function(newNum) {
        data.unshift([newNum, preferncesObj.userid]);
      });
      return null;
    } else {
      data.unshift([num, preferncesObj.userid]);
      return null;
    }
  });

  pool.query("DELETE FROM user_category_tbl WHERE user_id = ?", [preferncesObj.userid], function(err, removedResult) {
    if (err) {
      callback(err, null);
    } else {
      if (preferncesObj.preferences && preferncesObj.preferences.length > 0) {
        var sql = "INSERT INTO user_category_tbl (category_id, user_id) VALUES ?";
        pool.query(sql, [underscore.compact(data)], function(err, removedResult) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(null, preferncesObj);
          }
        });
      } else {
        callback(null, preferncesObj);
      }
    }
  });
};


exports.slugCreation = function(entityObject, usrSlug, count, originlSlug, callback) {
  var me = this;

  usrSlug = usrSlug.split('-').join('');
  originlSlug = originlSlug.split('-').join('');

  pool.query("select * from entity_tbl where slug =?", [usrSlug], function(err, entitySlugResult) {

    if (entitySlugResult && entitySlugResult.length > 0) {

      usrSlug = originlSlug + count;
      count = count + 1;
      me.slugCreation(entityObject, usrSlug, count, originlSlug, callback);
    } else {

      entityObject.slug = usrSlug;
      excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], [entityObject], function(err, entityId) {
        if (err) {
          callback(err, null);
        } else {
          var codeObj = {};
          codeObj.originalslug = usrSlug;
          codeObj.slug = usrSlug;
          codeObj.entity_id = entityId;
          me.storeUserNames(codeObj, function(err, data) {
            if (err) {
              callback(err, null);
            } else {
              callback(null, entityId, usrSlug);
            }
          });

        }
      });

      // pool.query("update entity_tbl set slug =? where id=?", [usrSlug, singleObject.id], callback);
    }
  });
};

exports.getcharityein = function(charityid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCharityEin'], [charityid], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows[0]);
    }
  });
};
exports.validateEntitySlug = function(slugObject, callback) {
  var me = this;
  var flag = '';

  slugObject.slug = slugObject.slug.split('-').join('');
  slugObject.originalslug = slugObject.originalslug.toString();
  slugObject.originalslug = slugObject.originalslug.split('-').join('');

  pool.query('select * from entity_tbl where slug=?', [slugObject.slug], function(err, slugResult) {
    console.log(slugResult);
    if (err) {
      callback(new Error(err), null);
    } else {
      if (slugObject.type == 'create') {

        if (slugResult && slugResult.length > 0) {
          callback({
            status: 'success'
          });
        } else {
          callback({
            status: 'success',
            data: true
          });
        }
      } else {
        if (slugResult && slugResult.length > 0) {
          async.each(slugResult, function(singleObj, callback) {
              console.log('ROYALS');
              console.log(singleObj);
              console.log(slugObject);
              if (slugObject.originalslug === singleObj.slug) {
                flag = 'allow';
                callback(null);
              } else {
                callback(null);
              }
            },
            function(err) {
              if (err) {
                console.log("i am in errorknnknj")
                callback(err, null);
              } else {
                if (flag === 'allow') {
                  callback({
                    status: 'success',
                    data: true
                  });
                } else {
                  callback({
                    status: 'success'
                  });
                }
              }
            });
        } else {
          callback({
            status: 'success',
            data: true
          });
        }
      }
    }
  });
}

function randomString(length) {
  var result = '';
  var chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result;
}

exports.generateRandomString = function(callback) {
  var slug = randomString(7);
  var me = this;
  excuteQuery.queryForAll("select * from entity_tbl where slug=?", [slug], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      if (result.length) {
        me.generateRandomString(callback);
      } else {
        callback(null, { data: { slug: slug } });
      }
    }

  });
};

exports.entitySlugCreation = function(entityObject, usrSlug, userDetailsObject, originlSlug, callback) {
  var me = this;
  usrSlug = usrSlug.split('-').join('');
  originlSlug = originlSlug.split('-').join('');
  pool.query("select * from entity_tbl where slug=?", [usrSlug], function(err, entitySlugResult) {

    if (entitySlugResult && entitySlugResult.length > 0) {

      pool.query("select * from user_tbl where name =?", [userDetailsObject.name], function(err, userResult) {
        if (userResult && userResult.length > 0) {
          //userDetailsObject.count = userResult.length + userDetailsObject.count;
          usrSlug = originlSlug + (userResult.length + userDetailsObject.count);
          userDetailsObject.count = userDetailsObject.count + 1;
          me.entitySlugCreation(entityObject, usrSlug, userDetailsObject, originlSlug, callback);

        } else {
          usrSlug = originlSlug + userDetailsObject.count;
          userDetailsObject.count = userDetailsObject.count + 1;
          me.entitySlugCreation(entityObject, usrSlug, userDetailsObject, originlSlug, callback);
        }
      });

    } else {
      entityObject.slug = usrSlug;
      excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], [entityObject], function(err, result) {
        if (err) {
          callback(new Error(err), null);
        } else {
          // pool.query("update entity_tbl set slug =? where id=?", [usrSlug, singleObject.id], callback);
          var userObj = {};
          userObj.originalslug = usrSlug;
          userObj.slug = usrSlug;
          userObj.entity_id = result;
          me.storeUserNames(userObj, callback);
        }
      });
    }
  });
};

exports.storeUserNames = function(userObj, callback) {
  var obj = {};

  obj.previous_slug = userObj.originalslug;
  obj.updated_slug = userObj.slug;
  obj.created_date = moment.utc().toDate();
  obj.entity_id = userObj.entity_id;
  pool.query('select * from slug_manager_tbl where entity_id=?', [obj.entity_id], function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      if (data && data.length > 0) {
        /*       pool.query('update slug_manager_tbl set updated_slug=?,previous_slug=?,created_date=? where entity_id=?', [obj.updated_slug, obj.previous_slug, obj.created_date, obj.entity_id], function(err, update) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, update);
          }
        });
*/
        pool.query('insert into slug_manager_tbl set ?', obj, function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, obj);
          }
        });
      } else {
        pool.query('insert into slug_manager_tbl set ?', obj, function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, obj);
          }
        });
      }
    }
  })
};

exports.addCharityClaim = function(data, callback) {
  try {
    var charity_data;
    var charityClaimObj;
    async.waterfall([function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['checkCharityClaimByCharity'], [data.charity_id], function(err, charityClaim) {
        if (err) {
          callback(new Error(err), null);
        } else {
          charityClaim = charityClaim[0];

          if (charityClaim) {
            excuteQuery.queryForAll(sqlQueryMap['checkAdminEmailInCharity'], [data.charity_id, data.user_id], function(err, charityClaimRes) {
              if (charityClaimRes && charityClaimRes.length) {
                if (charityClaim.email_address === data.user_email) {
                  callback('ALREADY_OWNED', null);
                } else {
                  callback('OWNED_BY_OTHER', null);
                }
              } else {
                callback(null, true);
              }
            })

          } else {
            callback(null, true);
          }
        }
      });
    }, function(charityNotClaimed, callback) {
      var charityData = {};
      if (charityNotClaimed) {
        excuteQuery.queryForAll(sqlQueryMap['checkCharityById'], [data.charity_id], function(err, result) {
          if (err) {
            callback(new Error(err), null);
          } else {
            if (result[0]) {
              charityData.charity = result[0];
              excuteQuery.queryForAll(sqlQueryMap['getUserProfile'], [data.user_id], function(err, user) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  console.log(user[0])
                  charityData.user = user[0];
                  if (user[0] && user[0].name) {
                    user[0].name = user[0].name.split(' ');
                    charityData.user.first_name = user[0].name[0];
                    charityData.user.last_name = user[0].name[1];
                  }

                  callback(null, charityData);
                }
              });
            } else {
              callback('CHARITY_NOT_FOUND', null);
            }
          }
        });
      }
    }, function(charityData, callback) {
      charityClaimObj = charityData;
      excuteQuery.insertAndReturnKey(sqlQueryMap['charity_claim_insert'], [charityData.charity.id, charityData.user.first_name, charityData.user.last_name, charityData.charity.name_tmp, charityData.user.email, charityData.user.home_phone, charityData.charity.ein, new Date(), data.weEmailId], function(err, rows) {
        if (err) {
          callback(new Error(err), null);
        } else {
          callback(null, rows)
        }
      });
    }], function(err, result) {
      if (err) {
        if (err === 'ALREADY_OWNED') {
          callback(null, { success: true });
        } else if (err === 'OWNED_BY_OTHER') {
          callback(new Error(JSON.stringify({ errors: ['Sorry . You are not allowed to create a campaign .Because this charity already claimed by someone else'], status: 400 })), { success: false });
        } else {
          callback(err, null);
        }
      } else {
        callback(null, { success: true });
        var claimObject = {
          first_name: charityClaimObj.user.first_name,
          last_name: charityClaimObj.user.last_name,
          email_address: charityClaimObj.user.email,
          charity_name: charityClaimObj.charity.name_tmp,
          ein: charityClaimObj.charity.ein,
          phone: charityClaimObj.charity.phone
        };
        pageService.sendClaimsignup(claimObject, function(err, result) {
          utility.nodeLogs('ERROR', err);
          utility.nodeLogs('INFO', result);
          utility.nodeLogs('INFO', { message: 'Sent claim request email to user', charityData: JSON.stringify(charityClaimObj) });
        });
        //Todo add claim request email to admin claim request info
        pageService.sendClaimRequestEmailToAdmin(claimObject, function(err, result) {
          utility.nodeLogs('ERROR', err);
          utility.nodeLogs('INFO', result);
          utility.nodeLogs('INFO', { message: 'Sent claim request email to Admin', charityData: JSON.stringify(charityClaimObj) });
        });
        elasticService.updateNonProfitStatus(data.charity_id, 'PENDING', charityClaimObj.charity.profile_pic_url,function(err, result) {

          if (err) {
            utility.nodeLogs('ERROR', {
              message: 'Error in creating charity claim ',
              error: err
            });
          } else {
            utility.nodeLogs('INFO', 'Charity claim status updated to pending in elastic search');
            utility.nodeLogs('INFO', result);
          }
        });

      }
    });
  } catch (err) {
    callback(err, null);
  }
};

exports.checkCharityApproved = function(codeId, callback) {

  excuteQuery.queryForAll(sqlQueryMap['checkCharityClaimByCodeId'], [codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (result[0] && result[0].approval_date) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  });
};
//cheking for campaign having canmailing or not
exports.checkingCanMailing = function(address, callback) {
  var user_id = address.userId;
  var country = address.country;
  var city = address.city;
  var state = address.state;
  var address_1 = address.address_1;
  var address_2 = address.address_2;
  var postal_code = address.postal_code;
  excuteQuery.queryForAll(sqlQueryMap['checkingUserAddress'], [user_id], function(err, result) {
    if (err) {
      callback(new Error(err), null)
    } else {
      if (result[0]) {
        excuteQuery.queryForAll(sqlQueryMap['insertingUserAddress'], [address_1, address_2, country, state, city, postal_code, user_id], function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', { message: 'Erro in inserting user address', error: err });
            callback(new Error(err), null);
          } else {
            callback(null, result);
          }
        });
      } else {
        utility.nodeLogs('INFO', { message: 'No user details found with user id in updatig use address', user_id: user_id });
        callback(null, null);
      }
    }
  });

}
