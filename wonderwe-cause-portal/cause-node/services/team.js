var charityService = require('./charity.js');
var codeServices = require('./code.js');
var underscore = require('underscore');
exports.creatingTeam = function(teamObj, callback) {
  var me = this;
  var obj = {};
  obj.code_id = teamObj.codeid;
  obj.tc_user_id = teamObj.user_id;
  obj.team_name = teamObj.team_name;
  obj.team_logo = teamObj.team_image;
  obj.team_description = teamObj.team_description;
  obj.donot_allow_join = teamObj.donot_allow_join;
  obj.support_multiple_campaigns = teamObj.support_multiple_campaigns;
  obj.check_p2p = teamObj.check_p2p;
  obj.date_created = moment.utc().toDate();
  if (teamObj.teamapproval === 'yes') {
    obj.status = "draft";
    var me = this;
    excuteQuery.insertAndReturnKey(sqlQueryMap['teamCreation'], obj, function(err, rows) {
      if (err) {
        utility.nodeLogs('ERROR', 'Error while creating team')
        callback(new Error(err), null);
      } else {
        var entityObj = {};
        entityObj.entity_type = 'team';
        entityObj.entity_id = rows;
        entityObj.slug = uslug(teamObj.team_slug);
        teamObj.team_id = rows;
        excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], entityObj, function(err, entityrows) {
          if (err) {
            callback(new Error(err), null);
          } else {
            var campEmailObj = {};
            campEmailObj.codeid = teamObj.codeid;
            campEmailObj.tc_user_id = teamObj.user_id;
            campEmailObj.team_name = teamObj.team_name;
            campEmailObj.team_slug = teamObj.team_slug;
            campEmailObj.team_id = entityObj.entity_id;
            if (teamObj.inviteesEmail.length > 0) {
              async.each(teamObj.inviteesEmail, function(singleObj, eachCallback) {
                  if (singleObj.email) {
                    excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [singleObj.email], function(err, userResult) {
                      if (err) {
                        eachCallback(err, null);
                      } else {
                        //for existing user
                        if (userResult && userResult[userResult.length-1]) {
                          if (userResult[userResult.length-1].id != teamObj.creatorid) {
                            var team_invitees = {};
                            team_invitees.team_id = entityObj.entity_id;
                            team_invitees.user_id = userResult[userResult.length-1].id;
                            team_invitees.created = 'no';
                            team_invitees.is_admin = 'no';
                            team_invitees.invited_date = moment.utc().toDate();
                            team_invitees.code_id = teamObj.codeid;
                            if (userResult[userResult.length-1].password_salt) {
                              //inserting into team invitees_tbl
                              excuteQuery.queryForAll(sqlQueryMap['teamInvitation'], team_invitees, function(err, teamInvitationdata) {
                                if (err) {
                                  utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                                  eachCallback(err, null);
                                } else {
                                  eachCallback(null, {
                                    slug: teamObj.team_slug
                                  });
                                }
                              })
                            } else {
                              excuteQuery.queryForAll(sqlQueryMap['teamInvitation'], team_invitees, function(err, teamInvitationdata) {
                                if (err) {
                                  utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                                  eachCallback(err, null);
                                } else {
                                  eachCallback(null, null)
                                }
                              });
                            }
                          } else {
                            var error = {};
                            error.errors = ["Don't add creator email"];
                            error.status = 400;
                            eachCallback(new Error(JSON.stringify(error)));
                          }
                        } else {
                          //for new user
                          var invitee_name = singleObj.name;
                          var verification_key = uuid.v4() + "-" + uslug(invitee_name);
                          var date = moment.utc().toDate();
                          var active = "no";
                          excuteQuery.insertAndReturnKey(sqlQueryMap['insertingIntoUserTbl'], [invitee_name, singleObj.email, verification_key, date, active], function(err, userId) {
                            if (err) {
                              eachCallback(err)
                            } else {
                              singleObj.user_id = userId;
                              singleObj.Active = "";
                              var team_invitees = {};
                              team_invitees.team_id = entityObj.entity_id;
                              team_invitees.user_id = singleObj.user_id;
                              team_invitees.created = 'no';
                              team_invitees.is_admin = 'no';
                              team_invitees.invited_date = moment.utc().toDate();
                              team_invitees.code_id = teamObj.codeid;
                              async.parallel({
                                enitycreation: function(callback) {
                                  var userEntity = {};
                                  userEntity.entity_id = singleObj.user_id;
                                  userEntity.entity_type = "user";
                                  var count = 1;
                                  var usrSlug = uslug(invitee_name);
                                  var originlSlug = uslug(invitee_name);
                                  var userDetailsObject = {
                                    count: 1,
                                    name: invitee_name
                                  };
                                  charityService.entitySlugCreation(userEntity, usrSlug, userDetailsObject, originlSlug, function(err, userEntityId) {
                                    if (err) {
                                      callback(err, null);
                                    } else {
                                      userEntity.id = userEntityId;
                                      callback(null, userId);
                                    }
                                  });
                                },
                                updateUserprofile: function(callback) {
                                  var timezone_id = 381;
                                  excuteQuery.queryForAll(sqlQueryMap['useIdAddToUserProfile'], [userId, timezone_id], function(err, userResult) {
                                    if (err) {
                                      callback(err, null);
                                    } else {
                                      callback(null, userId);
                                    }
                                  });
                                },
                                teamInviteeInsertion: function(callback) {
                                  excuteQuery.queryForAll(sqlQueryMap['teamInvitation'], team_invitees, function(err, teamInvitationdata) {
                                    if (err) {
                                      utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                                      callback(err, null);
                                    } else {
                                      callback(null, null);
                                    }
                                  });
                                }
                              }, function(err, results) {
                                if (err) {
                                  utility.log('error', "while user data storage");
                                  eachCallback(err);
                                } else {
                                  eachCallback(null);
                                }
                              });
                            }
                          });
                        }
                      }
                    });
                  }
                },
                function(err) {
                  if (err) {
                    callback(err, null);
                  } else {
                    agenda.now('New team created for your campaign', campEmailObj);
                    me.sendTeamApprovalToCampaignOwner(teamObj, function(err, result) {
                      if (err) {
                        callback(err, null);
                      } else {
                        callback(null, teamObj);
                      }
                    });
                  }
                })
            }

          }
        });
      }
    });
  } else {
    console.log("in else");
    obj.status = "published";
    obj.approved_by = teamObj.codeUserId;
    obj.approved_date = moment.utc().toDate();
    me.createTeamWithApproval(obj, teamObj, callback);
  }
}
exports.createTeamWithApproval = function(obj, teamObj, callback) {
  var me = this;
  excuteQuery.insertAndReturnKey(sqlQueryMap['teamCreation'], obj, function(err, rows) {
    if (err) {
      utility.nodeLogs('ERROR', 'Error while creating team')
      callback(new Error(err), null);
    } else {
      var entityObj = {};
      entityObj.entity_type = 'team';
      entityObj.entity_id = rows;
      entityObj.slug = uslug(teamObj.team_slug);
      teamObj.team_id = rows;
      excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], entityObj, function(err, entityrows) {
        if (err) {
          callback(new Error(err), null);
        } else {
          var campEmailObj = {};
          campEmailObj.codeid = teamObj.codeid;
          campEmailObj.tc_user_id = teamObj.user_id;
          campEmailObj.team_name = teamObj.team_name;
          campEmailObj.team_slug = teamObj.team_slug;
          campEmailObj.team_id = entityObj.entity_id;
          // agenda.now('New team created for your campaign', campEmailObj)
          agenda.now('Send mail to team captain', teamObj)

          //     me.sendTeamAlertToTeamCreator(teamObj,function(err,result){
          // if(err){
          //   console.log("error to send mail to team captaign");
          // }else{
          //   console.log("mail sent successfully");
          // }
          // });
          entityObj.id = entityrows;
          entityObj.type = 'team';
          //     codeServices.createCampaignUserCharityInElasticSearch(entityObj, function(err, result) {
          //   if (err) {
          //   console.log("team captaign updated in elastic search");
          //   }else{
          //   console.log("error while update into elastic search")
          //   }

          // });
          agenda.now('updatinig team in elastic search', entityObj);
          if (teamObj.inviteesEmail.length > 0) {
            async.each(teamObj.inviteesEmail, function(singleObj, eachCallback) {
                if (singleObj.email) {
                  excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [singleObj.email], function(err, userResult) {
                    if (err) {
                      eachCallback(err, null);
                    } else {
                      //for existing user
                      if (userResult && userResult[userResult.length-1]) {
                        if (userResult[userResult.length-1].id != teamObj.creatorid) {
                          var team_invitees = {};
                          team_invitees.team_id = entityObj.entity_id;
                          team_invitees.user_id = userResult[userResult.length-1].id;
                          team_invitees.created = 'no';
                          team_invitees.is_admin = 'no';
                          team_invitees.invited_date = moment.utc().toDate();
                          team_invitees.code_id = teamObj.codeid;
                          if (userResult[0].password_salt) {
                            //inserting into team invitees_tbl
                            excuteQuery.queryForAll(sqlQueryMap['teamInvitation'], team_invitees, function(err, teamInvitationdata) {
                              if (err) {
                                utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                                eachCallback(err, null);
                              } else {
                                eachCallback(null, {
                                  slug: teamObj.team_slug
                                });
                                var invitees_id = teamInvitationdata
                                if (teamObj.codeid) {
                                  me.sendMailsToTeamInvitees(teamObj, singleObj.name, singleObj.email, 'existingUser', '', userResult[userResult.length-1].id, entityObj.entity_id, function(err, data) {
                                    if (err) {
                                      // eachCallback(err, null)
                                      utility.nodeLogs('ERROR', 'Error occured While sending the mail to invitees')
                                    } else {
                                      // eachCallback(null, null)
                                      utility.nodeLogs('INFO', 'sending the mail to invitees Sucessfully')
                                    }
                                  });
                                } else {
                                  me.inviteMembersWithoutCodeid(teamObj, singleObj.name, singleObj.email, 'existingUser', '', userResult[userResult.length-1].id, entityObj.entity_id, function(err, result) {
                                    if (err) {
                                      console.log("error while calling");
                                    } else {
                                      console.log("Mail sent successfully")
                                    }
                                  })
                                }
                              }
                            })
                          } else {
                            excuteQuery.queryForAll(sqlQueryMap['teamInvitation'], team_invitees, function(err, teamInvitationdata) {
                              if (err) {
                                utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                                eachCallback(err, null);
                              } else {
                                eachCallback(null, null)
                                if (teamObj.codeid) {
                                  me.sendMailsToTeamInvitees(teamObj, singleObj.name, singleObj.email, 'newUser', '', userResult[userResult.length-1].id, entityObj.entity_id, function(err, data) {
                                    if (err) {
                                      utility.nodeLogs('ERROR', 'Error occured While sending the mail to invitees')
                                    } else {
                                      utility.nodeLogs('INFO', 'sending the mail to invitees Sucessfully')
                                    }
                                  });
                                } else {
                                  me.inviteMembersWithoutCodeid(teamObj, singleObj.name, singleObj.email, 'newUser', '', userResult[userResult.length-1].id, entityObj.entity_id, function(err, result) {
                                    if (err) {
                                      console.log("error while calling");
                                    } else {
                                      console.log("Mail sent successfully");
                                    }
                                  })
                                }
                              }
                            });
                          }
                        } else {
                          var error = {};
                          error.errors = ["Don't add creator email"];
                          error.status = 400;
                          eachCallback(new Error(JSON.stringify(error)));
                        }
                      } else {
                        //for new user
                        var invitee_name = singleObj.name;
                        var verification_key = uuid.v4() + "-" + uslug(invitee_name);
                        var date = moment.utc().toDate();
                        var active = 'no';
                        excuteQuery.insertAndReturnKey(sqlQueryMap['insertingIntoUserTbl'], [invitee_name, singleObj.email, verification_key, date, active], function(err, userId) {
                          if (err) {
                            eachCallback(err)
                          } else {
                            singleObj.user_id = userId;
                            singleObj.Active = "";
                            var team_invitees = {};
                            team_invitees.team_id = entityObj.entity_id;
                            team_invitees.user_id = singleObj.user_id;
                            team_invitees.code_id = teamObj.codeid;
                            team_invitees.created = 'no';
                            team_invitees.is_admin = 'no';
                            team_invitees.invited_date = moment.utc().toDate();
                            async.parallel({
                              enitycreation: function(callback) {
                                var userEntity = {};
                                userEntity.entity_id = singleObj.user_id;
                                userEntity.entity_type = "user";
                                var count = 1;
                                var usrSlug = uslug(invitee_name);
                                var originlSlug = uslug(invitee_name);
                                var userDetailsObject = {
                                  count: 1,
                                  name: invitee_name
                                };
                                charityService.entitySlugCreation(userEntity, usrSlug, userDetailsObject, originlSlug, function(err, userEntityId) {
                                  if (err) {
                                    callback(err, null);
                                  } else {
                                    userEntity.id = userEntityId;
                                    callback(null, userId);
                                  }
                                });
                              },
                              updateUserprofile: function(callback) {
                                var timezone_id = 381;
                                excuteQuery.queryForAll(sqlQueryMap['useIdAddToUserProfile'], [userId, timezone_id], function(err, userResult) {
                                  if (err) {
                                    callback(err, null);
                                  } else {
                                    callback(null, userId);
                                  }
                                });
                              },
                              teamInviteeInsertion: function(callback) {
                                excuteQuery.queryForAll(sqlQueryMap['teamInvitation'], team_invitees, function(err, teamInvitationdata) {
                                  if (err) {
                                    utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                                    callback(err, null);
                                  } else {
                                    callback(null, null);
                                    //
                                    if (teamObj.codeid) {
                                      me.sendMailsToTeamInvitees(teamObj, singleObj.name, singleObj.email, 'newUser', verification_key, singleObj.user_id, entityObj.entity_id, function(err, data) {
                                        if (err) {
                                          utility.nodeLogs('ERROR', 'Error occured whil sending the mail to invitees')
                                        } else {
                                          utility.nodeLogs('INFO', 'sending the mail to invitees Sucessfully')
                                        }
                                      });
                                    } else {
                                      me.inviteMembersWithoutCodeid(teamObj, singleObj.name, singleObj.email, 'newUser', verification_key, singleObj.user_id, entityObj.entity_id, function(err, result) {
                                          if (err) {
                                            console.log("error while calling");
                                          } else {
                                            console.log("Mail sent successfully");
                                          }
                                        })
                                        //
                                    }
                                  }
                                });
                              }
                            }, function(err, results) {
                              if (err) {
                                utility.log('error', "while user data storage");
                                eachCallback(err);
                              } else {
                                eachCallback(null);
                              }
                            });
                          }
                        });
                      }
                    }
                  });
                }
              },
              function(err) {
                if (err) {
                  callback(err, null);
                } else {
                  callback(null, teamObj);
                  agenda.now('New team created for your campaign', campEmailObj);

                }
              })
          } else {
            utility.nodeLogs('INFO', 'No invitees for team');
            callback(null, null)
          }
        }
      })
    }
  });
}

exports.sendTeamApprovalToCampaignOwner = function(teamObj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCampaignOwnerAndAdminEmails'], [teamObj.codeid, teamObj.codeid], function(err, entityrows) {
    if (err) {
      callback(err, null);
    } else {
      async.each(entityrows, function(eachObject, eachCallback) {
        var finalobjectmandril = {};
        finalobjectmandril.from = props.fromemail;
        finalobjectmandril.email = eachObject.email;
        finalobjectmandril.text = "";
        finalobjectmandril.subject = "Team approval request for " + eachObject.title;
        finalobjectmandril.template_name = " team approval request to campaign admin";
        finalobjectmandril.template_content = [{
          "name": "accept_url",
          "content": "*|ACCEPT_URL|*"
        }, {
          "name": "deny_url",
          "content": "*|DENY_URL|*"
        }, {
          "name": "campaign_name",
          "content": "*|CAMPAIGN_NAME|*"
        }, {
          "name": "team_slug",
          "content": "*|TEAM_SLUG|*"
        }, {
          "name": "email",
          "content": "*|EMAIL|*"
        }, {
          "name": "teamname",
          "content": "*|TEAM_NAME|*"
        }, {
          "name": "campaign_owner",
          "content": "*|CAMPAIGN_OWNER|"
        }, {
          "name": "team_creator",
          "content": "*|TEAM_CREATOR|*"
        }];

        finalobjectmandril.merge_vars = [{
          "name": "ACCEPT_URL",
          "content": props.domain + '/pages/team/approval/' + eachObject.admin_user_id + '?teamid=' + teamObj.team_id
        }, {
          "name": "DENY_URL",
          "content": props.domain + '/pages/team/deny/' + eachObject.admin_user_id + '?teamid=' + teamObj.team_id
        }, {
          "name": "CAMPAIGN_NAME",
          "content": eachObject.title
        }, {
          "name": "TEAM_SLUG",
          "content": props.domain + '/' + teamObj.team_slug
        }, {
          "name": "EMAIL",
          "content": teamObj.userEmail
        }, {
          "name": "TEAM_NAME",
          "content": teamObj.team_name
        }, {
          "name": "CAMPAIGN_OWNER",
          "content": eachObject.name
        }, {
          "name": "TEAM_CREATOR",
          "content": teamObj.userName
        }];
        eachCallback(null);
        utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
          if (err) {
            //callback(err, null);
          } else {
            //callback(null, teamObj);
          }
        });

      }, function(err) {
        callback(null, teamObj);
      });
    }
  });
}

exports.inviteMembersWithoutCodeid = function(teamObj, inviteename, inviteeemail, type, verification_key, userid, teamid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getTeamCaptainName'], [teamObj.team_id], function(err, teamData) {
    if (err) {
      callback(err, null)
    } else {
      if (teamData && teamData[0]) {
        //need to send the email here
        var finalobjectmandril = {};
        finalobjectmandril.from = props.fromemail;
        finalobjectmandril.email = inviteeemail;
        finalobjectmandril.text = "";
        if (type == 'newUser') {
          finalobjectmandril.subject = teamData[0].team_captain_name + " has invited you to create a fundraiser to  the team " + teamObj.team_name;
          finalobjectmandril.template_name = "Invitation to team invitees without campaigndetail";
          finalobjectmandril.template_content = [{
            "name": "inviteename",
            "content": "*|INVITEE_NAME|*"
          }, {
            "name": "teamname",
            "content": "*|TEAM_NAME|*"
          }, {
            "name": "teamcaptainname",
            "content": "*|TEAM_CAPTAIN_NAME|*"
          }, {
            "name": "teamcaptainemail",
            "content": "*|EMAIL|*"
          }, {
            "name": "teamname",
            "content": "*|TEAM_NAME|*"
          }, {
            "name": "CUSTOM_MESSAGE",
            "content": "*|CUSTOM_MESSAGE|*"
          }, {
            "name": "denyurl",
            "content": "*|DENY_URL|*"
          }, {
            "name": "accepturl",
            "content": "*|ACCEPT_URL|*"
          }, {
            "name": "slug`",
            "content": "*|SLUG|*"
          }];
          finalobjectmandril.merge_vars = [{
            "name": "INVITEE_NAME",
            "content": inviteename
          }, {
            "name": "TEAM_NAME",
            "content": teamData[0].team_name
          }, {
            "name": "TEAM_CAPTAIN_NAME",
            "content": teamData[0].team_captain_name
          }, {
            "name": "EMAIL",
            "content": teamData[0].team_captain_email
          }, {
            "name": "CUSTOM_MESSAGE",
            "content": teamObj.team_custom_message
          }, {
            "name": "DENY_URL",
            "content": props.domain + "/pages/inviteedelete/" + userid + '?teamid=' + teamid
          }, {
            "name": "ACCEPT_URL",
            "content": props.domain + "/pages/resetpassword/" + userid + '?teamfundraise=teamfundraise' + '&teamid=' + teamid
          }, {
            "name": "SLUG",
            "content": props.domain + '/' + teamObj.team_slug
          }];
        } else {
          finalobjectmandril.subject = teamData[0].team_captain_name + " has invited you to create a fundriser for  the team " + teamObj.team_name;
          finalobjectmandril.template_name = "Invitation to team invitees without campaigndetail";
          finalobjectmandril.template_content = [{
            "name": "inviteename",
            "content": "*|INVITEE_NAME|*"
          }, {
            "name": "teamname",
            "content": "*|TEAM_NAME|*"
          }, {
            "name": "teamcaptainname",
            "content": "*|TEAM_CAPTAIN_NAME|*"
          }, {
            "name": "teamcaptainemail",
            "content": "*|EMAIL|*"
          }, {
            "name": "messagebody",
            "content": "*|CUSTOM_MESSAGE|*"
          }, {
            "name": "denyurl",
            "content": "*|DENY_URL|*"
          }, {
            "name": "accepturl",
            "content": "*|ACCEPT_URL|*"
          }, {
            "name": "slug",
            "content": "*|SLUG|*"
          }];
          finalobjectmandril.merge_vars = [{
            "name": "INVITEE_NAME",
            "content": inviteename
          }, {
            "name": "TEAM_NAME",
            "content": teamData[0].team_name
          }, {
            "name": "TEAM_CAPTAIN_NAME",
            "content": teamData[0].team_captain_name
          }, {
            "name": "EMAIL",
            "content": teamData[0].team_captain_email
          }, {
            "name": "CUSTOM_MESSAGE",
            "content": teamObj.team_custom_message
          }, {
            "name": "DENY_URL",
            "content": props.domain + "/pages/inviteedelete/" + userid + '?teamid=' + teamid
          }, {
            "name": "ACCEPT_URL",
            "content": props.domain + '/login' + '?teamid=' + teamid + '&userid=' + userid
          }, {
            "name": "SLUG",
            "content": props.domain + '/' + teamObj.team_slug
          }];
        }
        utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(null, null);
          }
        });
        //end
      } else {
        utility.nodeLogs('INFO', 'NO team details found in teams_tbl')
        callback(null, null);
      }
    }
  });
}
exports.sendMailsToTeamInvitees = function(teamObj, inviteename, inviteeemail, type, verification_key, userid, teamid, callback) {
  var codeid = teamObj.codeid;
  excuteQuery.queryForAll(sqlQueryMap['getCodeById'], [codeid], function(err, codeData) {
    if (err) {
      callback(err, null);
    } else {
      if (codeData && codeData[0]) {
        var campaign_name = codeData[0].title;
        excuteQuery.queryForAll(sqlQueryMap['getEntityUser'], [teamObj.codeid, 'code'], function(err, entityData) {
          if (err) {
            callback(err, null)
          } else {
            if (entityData && entityData[0]) {
              var codeSlug = entityData[0].slug;
              excuteQuery.queryForAll(sqlQueryMap['getTeamCaptainName'], [teamObj.team_id], function(err, teamData) {
                if (err) {
                  callback(err, null)
                } else {
                  if (teamData && teamData[0]) {
                    //need to send the email here
                    var finalobjectmandril = {};
                    finalobjectmandril.from = props.fromemail;
                    finalobjectmandril.email = inviteeemail;
                    finalobjectmandril.text = "";
                    if (type == 'newUser') {
                      finalobjectmandril.subject = teamData[0].team_captain_name + " has invited you to create a fundraiser to  the team " + teamObj.team_name;
                      finalobjectmandril.template_name = "Invitation to team invitees";
                      finalobjectmandril.template_content = [{
                        "name": "inviteename",
                        "content": "*|INVITEE_NAME|*"
                      }, {
                        "name": "teamname",
                        "content": "*|TEAM_NAME|*"
                      }, {
                        "name": "campaignname",
                        "content": "*|CAMPAIGN_NAME|*"
                      }, {
                        "name": "teamcaptainname",
                        "content": "*|TEAM_CAPTAIN_NAME|*"
                      }, {
                        "name": "teamcaptainemail",
                        "content": "*|EMAIL|*"
                      }, {
                        "name": "teamname",
                        "content": "*|TEAM_NAME|*"
                      }, {
                        "name": "CUSTOM_MESSAGE",
                        "content": "*|CUSTOM_MESSAGE|*"
                      }, {
                        "name": "denyurl",
                        "content": "*|DENY_URL|*"
                      }, {
                        "name": "accepturl",
                        "content": "*|ACCEPT_URL|*"
                      }, {
                        "name": "slug`",
                        "content": "*|SLUG|*"
                      }];
                      finalobjectmandril.merge_vars = [{
                        "name": "INVITEE_NAME",
                        "content": inviteename
                      }, {
                        "name": "TEAM_NAME",
                        "content": teamData[0].team_name
                      }, {
                        "name": "CAMPAIGN_NAME",
                        "content": codeData[0].title
                      }, {
                        "name": "TEAM_CAPTAIN_NAME",
                        "content": teamData[0].team_captain_name
                      }, {
                        "name": "EMAIL",
                        "content": teamData[0].team_captain_email
                      }, {
                        "name": "CUSTOM_MESSAGE",
                        "content": teamObj.team_custom_message
                      }, {
                        "name": "DENY_URL",
                        "content": props.domain + "/pages/inviteedelete/" + userid + '?teamid=' + teamid
                      }, {
                        "name": "ACCEPT_URL",
                        "content": props.domain + "/pages/resetpassword/" + userid + '?team=team' + '&mainCampaignSlug=' + codeSlug + '&teamid=' + teamid
                      }, {
                        "name": "SLUG",
                        "content": props.domain + '/' + teamObj.team_slug
                      }];
                    } else {
                      finalobjectmandril.subject = teamData[0].team_captain_name + " has invited you to create a fundriser for  the team " + teamObj.team_name;
                      finalobjectmandril.template_name = "Invitation to team invitees";
                      finalobjectmandril.template_content = [{
                        "name": "inviteename",
                        "content": "*|INVITEE_NAME|*"
                      }, {
                        "name": "teamname",
                        "content": "*|TEAM_NAME|*"
                      }, {
                        "name": "campaignname",
                        "content": "*|CAMPAIGN_NAME|*"
                      }, {
                        "name": "teamcaptainname",
                        "content": "*|TEAM_CAPTAIN_NAME|*"
                      }, {
                        "name": "teamcaptainemail",
                        "content": "*|EMAIL|*"
                      }, {
                        "name": "messagebody",
                        "content": "*|CUSTOM_MESSAGE|*"
                      }, {
                        "name": "denyurl",
                        "content": "*|DENY_URL|*"
                      }, {
                        "name": "accepturl",
                        "content": "*|ACCEPT_URL|*"
                      }, {
                        "name": "slug",
                        "content": "*|SLUG|*"
                      }];
                      finalobjectmandril.merge_vars = [{
                        "name": "INVITEE_NAME",
                        "content": inviteename
                      }, {
                        "name": "TEAM_NAME",
                        "content": teamData[0].team_name
                      }, {
                        "name": "CAMPAIGN_NAME",
                        "content": codeData[0].title
                      }, {
                        "name": "TEAM_CAPTAIN_NAME",
                        "content": teamData[0].team_captain_name
                      }, {
                        "name": "EMAIL",
                        "content": teamData[0].team_captain_email
                      }, {
                        "name": "CUSTOM_MESSAGE",
                        "content": teamObj.team_custom_message
                      }, {
                        "name": "DENY_URL",
                        "content": props.domain + "/pages/inviteedelete/" + userid + '?teamid=' + teamid
                      }, {
                        "name": "ACCEPT_URL",
                        "content": props.domain + '/' + codeSlug + '?teamid=' + teamid + '&userid=' + userid + '&teamMember=yes'
                      }, {
                        "name": "SLUG",
                        "content": props.domain + '/' + teamObj.team_slug
                      }];
                    }
                    utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
                      if (err) {
                        callback(new Error(err), null);
                      } else {
                        callback(null, null);
                      }
                    });
                    //end
                  } else {
                    utility.nodeLogs('INFO', 'NO team details found in teams_tbl')
                    callback(null, null)
                  }
                }
              });
            } else {
              utility.nodeLogs('INFO', 'NO campaign details found in entity_tbl')
              callback(null, null)
            }
          }
        });
      } else {
        utility.nodeLogs('INFO', 'NO campaign details found in code_tbl')
        callback(null, null)
      }
    }
  });
}
exports.getTeamDetails = function(teamId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getTeamDetails'], [teamId], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'error occured while getting the team details')
      callback(err, null);
    } else {
      if (result && result[0]) {
        utility.nodeLogs('INFO', 'Getting team details');
        callback(null, result[0]);
      } else {
        utility.nodeLogs('INFO', 'NO team details found');
        callback(null, [])
      }
    }
  });
}
exports.getCampaignTeamsCount = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCampaignTeamsCount'], [codeId], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'error occured while getting the team details')
      callback(err, null);
    } else {
      if (result && result[0]) {
        utility.nodeLogs('INFO', 'Getting team details');
        callback(null, result[0]);
      } else {
        utility.nodeLogs('INFO', 'NO team details found');
        callback(null, [])
      }
    }
  });
}
exports.rejectionOfTeamInvitation = function(data, callback) {
  var finalobjectmandril = {};
  finalobjectmandril.from = props.fromemail;
  finalobjectmandril.email = data.invited_email;
  finalobjectmandril.text = "";
  finalobjectmandril.subject = data.team_name + " has been denied by " + data.invited_name;
  finalobjectmandril.template_name = "Rejection of team invitation";
  finalobjectmandril.template_content = [{
    "name": "inviteename",
    "content": "*|INVITEE_NAME|*"
  }, {
    "name": "teamname",
    "content": "*|TEAM_NAME|*"
  }, {
    "name": "invitedname",
    "content": "*|INVITED_NAME|*"
  }];
  finalobjectmandril.merge_vars = [{
    "name": "INVITEE_NAME",
    "content": data.invitee_name
  }, {
    "name": "TEAM_NAME",
    "content": data.team_name
  }, {
    "name": "INVITED_NAME",
    "content": data.invited_name
  }];
  utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, null);
    }
  });
}
exports.sendTeamAlertToCampaignOwner = function(data, callback) {
  excuteQuery.queryForAll(sqlQueryMap['teamCampDetails'], [data.codeid], function(err, result) {
    if (err) {
      callback(err, null)
    } else {
      if (result && result[0]) {
        var campaign_owner_name = result[0].campaign_owner_name;
        var campaign_owner_email = result[0].campaign_owner_email;
        var campaign_name = result[0].campaign_name;
        excuteQuery.queryForAll(sqlQueryMap['checkemailactteam'], [data.team_id, data.tc_user_id], function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            if (result && result[0]) {
              var team_captain_name = result[0].name;
              var team_captain_email = result[0].email;
              var invitees_count = result[0].invitations_count
              var finalobjectmandril = {};
              finalobjectmandril.from = props.fromemail;
              finalobjectmandril.email = campaign_owner_email;
              finalobjectmandril.text = "";
              finalobjectmandril.subject = "New team for your campaign " + campaign_name;
              finalobjectmandril.template_name = "New team created for your campaign";
              finalobjectmandril.template_content = [{
                "name": "campaignownername",
                "content": "*|CAMPAIGN_OWNER_NAME|*"
              }, {
                "name": "teamname",
                "content": "*|TEAM_NAME|*"
              }, {
                "name": "campaignname",
                "content": "*|CAMPAIGN_NAME|*"
              }, {
                "name": "teamcaptainname",
                "content": "*|TEAM_CAPTAIN_NAME|*"
              }, {
                "name": "teamcaptainemail",
                "content": "*|TEAM_CAPTAIN_EMAIL|*"
              }, {
                "name": "teampage",
                "content": "|TEAM_PAGE|*"
              }, {
                "name": "invitees_count",
                "content": "*|INVITATIONS_COUNT|*"
              }];
              finalobjectmandril.merge_vars = [{
                "name": "CAMPAIGN_OWNER_NAME",
                "content": campaign_owner_name
              }, {
                "name": "TEAM_NAME",
                "content": data.team_name
              }, {
                "name": "CAMPAIGN_NAME",
                "content": campaign_name
              }, {
                "name": "TEAM_CAPTAIN_NAME",
                "content": team_captain_name
              }, {
                "name": "TEAM_CAPTAIN_EMAIL",
                "content": team_captain_email
              }, {
                'name': 'TEAM_PAGE',
                "content": props.domain + '/' + data.team_slug
              }, {
                "name": 'INVITATIONS_COUNT',
                "content": invitees_count
              }];
              utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  callback(null, null);
                }
              });
            } else {
              callback(null, null);
            }
          }
        });

      } else {
        callback(null, null);
      }
    }
  });
}

exports.getTeamFundraisers = function(teamId, callback) {
    excuteQuery.queryForAll(sqlQueryMap['getTeamFundraisersCount'], teamId, function(err, result) {
      if (err) {
        callback(err, null);
      } else {
        if (result && result[0]) {
          callback(null, result[0]);
        } else {
          callback(null, []);
        }
      }
    });
  }
  // exports.getTeamFollowerCount=function(teamId, callback){
  //   excuteQuery.queryForAll(sqlQueryMap[''], teamId, function(err, result)) {
  //   if (err) {
  //       callback(err, null);
  //     }
  //   }
  // }

exports.sendTeamAlertToTeamCreator = function(data, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCodeById'], [data.codeid], function(err, result) {
    if (err) {
      callback(err, null)
    } else {
      if (result && result[0]) {
        var finalobjectmandril = {};
        finalobjectmandril.from = props.fromemail;
        finalobjectmandril.email = data.userEmail;
        finalobjectmandril.text = "";
        finalobjectmandril.subject = "Your " + data.team_name + " team created successfully";
        finalobjectmandril.template_name = "Team created successfully";
        finalobjectmandril.template_content = [{
          "name": "teamname",
          "content": "*|TEAM_NAME|*"
        }, {
          "name": "teamcaptainname",
          "content": "*|TEAM_CAPTAIN_NAME|*"
        }, {
          "name": "teampage",
          "content": "*|TEAM_PAGE|*"
        }, {
          "name": "maincampaignname",
          "content": "*|MAIN_CAMPAIGN_NAME|*"
        }, {
          "name": "createdtime",
          "content": "*|CREATED_TIME|*"
        }, {
          "name": "campaignname",
          "content": "*|MAIN_CAMPAIGN_LINK|*"
        }];
        finalobjectmandril.merge_vars = [{
          "name": "TEAM_NAME",
          "content": data.team_name
        }, {
          "name": "TEAM_CAPTAIN_NAME",
          "content": data.userName
        }, {
          'name': 'TEAM_PAGE',
          "content": props.domain + '/' + data.team_slug
        }, {
          "name": "MAIN_CAMPAIGN_NAME",
          "content": result[0].title
        }, {
          "name": "CREATED_TIME",
          "content": moment().utc().format('MM-DD-YYYY')
        }, {
          "name": "MAIN_CAMPAIGN_LINK",
          "content": props.domain + '/' + result[0].code_text
        }];
        utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(null, null);
          }
        });
      } else {
        utility.nodeLogs('INFO', 'NO campaign results');
        callback(null, null);
      }
    }
  });
}



exports.sendTeamApproveAlertToTeamCreator = function(data, callback) {
  excuteQuery.queryForAll(sqlQueryMap['teamdata'], [data.teamid], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      if (result && result[0]) {
        excuteQuery.queryForAll(sqlQueryMap['password'], data.userId, function(err, userResult) {
          if (err) {
            callback(err, null);
          } else {
            if (userResult && userResult[0]) {
              var finalobjectmandril = {};
              finalobjectmandril.from = props.fromemail;
              finalobjectmandril.email = result[0].creator_email;
              finalobjectmandril.text = "";
              finalobjectmandril.subject = "Your " + result[0].team_name + " team approve successfully";
              finalobjectmandril.template_name = "Team approved successfully";
              finalobjectmandril.template_content = [{
                "name": "teamname",
                "content": "*|TEAM_NAME|*"
              }, {
                "name": "teamcaptainname",
                "content": "*|TEAM_CAPTAIN_NAME|*"
              }, {
                "name": "teampage",
                "content": "*|TEAM_PAGE|*"
              }, {
                "name": "createdtime",
                "content": "*|CREATED_TIME|*"
              }];
              finalobjectmandril.merge_vars = [{
                "name": "TEAM_NAME",
                "content": result[0].team_name
              }, {
                "name": "TEAM_CAPTAIN_NAME",
                "content": result[0].team_creator_name
              }, {
                'name': 'TEAM_PAGE',
                "content": props.domain + '/' + result[0].team_slug
              }, {
                "name": "CREATED_TIME",
                "content": moment().utc().format('MM-DD-YYYY')
              }];
              utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  callback(null, null);
                }
              });
            } else {
              utility.nodeLogs('INFO', 'no user details found')
              callback(null, null);
            }
          }
        });
      } else {
        utility.nodeLogs('INFO', 'NO campaign results');
        callback(null, null);
      }
    }
  });
}


exports.sendFundraiseAlertToTeamCaptain = function(data, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getTeamCaptainName'], [data.team_id], function(err, result) {
    if (err) {
      callback(new Error(err), null)
    } else {
      if (result && result[0]) {
        var team_captain_name = result[0].team_captain_name;
        var team_captain_email = result[0].team_captain_email;
        var team_campaign_slug = result[0].team_campaign_slug;
        var team_name = result[0].team_name;
        excuteQuery.queryForAll(sqlQueryMap['gettingTeamCurrency'], [data.team_id], function(err, currencyData) {
          if (err) {
            callback(err, null);
          } else {
            var finalobjectmandril = {};
            finalobjectmandril.from = props.fromemail;
            finalobjectmandril.email = team_captain_email;
            finalobjectmandril.text = "";
            finalobjectmandril.subject = "New " + data.title + " campaign created for " + team_name + " successfully";
            finalobjectmandril.template_name = "New fundraiser created for your team";
            finalobjectmandril.template_content = [{
              "name": "inviteename",
              "content": "*|INVITEE_NAME|*"
            }, {
              "name": "teamcampaigntitle",
              "content": "*|TEAM_CAMPAIGN_TITLE|*"
            }, {
              "name": "teamcaptainname",
              "content": "*|TEAM_CAPTAIN_NAME|*"
            }, {
              "name": "wecode",
              "content": "*|WECODE|*"
            }, {
              "name": "goal",
              "content": "*|GOAL|*"
            }, {
              "name": "teampage",
              "content": "*|TEAM_PAGE|*"
            }, {
              "name": "facebookshare",
              "content": "*|SHARE_FACEBOOK|*"
            }, {
              'name': 'campaign_url',
              'content': "*|CAMPAIGN_URL|*"
            }];
            finalobjectmandril.merge_vars = [{
              "name": "INVITEE_NAME",
              "content": data.user_full_name
            }, {
              "name": "TEAM_CAMPAIGN_TITLE",
              "content": data.title
            }, {
              "name": "TEAM_CAPTAIN_NAME",
              "content": team_captain_name
            }, {
              "name": "WECODE",
              "content": data.code_text
            }, {
              "name": "GOAL",
              "content": currencyData[0].currency_symbol + numeral(data.goal).format('0,0')
            }, {
              "name": "SHARE_FACEBOOK",
              "content": "http://facebook.com/dialog/feed?link=" + props.domain + '/' + data.code_text + '&app_id=' + props.facebook_client_id + '&redirect_uri=' + props.domain + '/' + data.code_text
            }, {
              'name': 'CAMPAIGN_URL',
              "content": props.domain + '/' + data.code_text
            }];
            utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
              if (err) {
                callback(new Error(err), null);
              } else {
                callback(null, null);
              }
            });
          }
        })
      } else {
        utility.nodeLogs('INFO', 'No details found')
        callback(null, null);
      }
    }
  });
}

exports.sendFundraiseAlertToTeamMember = function(data, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getTeamCaptainName'], [data.team_id], function(err, result) {
    if (err) {
      callback(new Error(err), null)
    } else {
      if (result && result[0]) {
        var team_captain_name = result[0].team_captain_name;
        var team_captain_email = result[0].team_captain_email;
        var team_campaign_slug = result[0].team_campaign_slug;
        var team_name = result[0].team_name;
        excuteQuery.queryForAll(sqlQueryMap['gettingTeamCurrency'], [data.team_id], function(err, currencyData) {
          if (err) {
            callback(err, null);
          } else {
            var finalobjectmandril = {};
            finalobjectmandril.from = props.fromemail;
            finalobjectmandril.email = data.email;
            finalobjectmandril.text = "";
            finalobjectmandril.subject = "Your fundraiser created for  " + team_name + " team";
            finalobjectmandril.template_name = "New fundraiser created for member";
            finalobjectmandril.template_content = [{
              "name": "inviteename",
              "content": "*|INVITEE_NAME|*"
            }, {
              "name": "teamcampaigntitle",
              "content": "*|TEAM_CAMPAIGN_TITLE|*"
            }, {
              "name": "teamcaptainname",
              "content": "*|TEAM_CAPTAIN_NAME|*"
            }, {
              "name": "wecode",
              "content": "*|WECODE|*"
            }, {
              "name": "goal",
              "content": "*|GOAL|*"
            }, {
              "name": "teampage",
              "content": "*|TEAM_PAGE|*"
            }, {
              'name': 'campaign_url',
              'content': "*|CAMPAIGN_URL|*"
            }];
            finalobjectmandril.merge_vars = [{
              "name": "INVITEE_NAME",
              "content": data.user_full_name
            }, {
              "name": "TEAM_CAMPAIGN_TITLE",
              "content": data.title
            }, {
              "name": "TEAM_CAPTAIN_NAME",
              "content": team_captain_name
            }, {
              "name": "WECODE",
              "content": data.code_text
            }, {
              "name": "GOAL",
              "content": currencyData[0].currency_symbol + numeral(data.goal).format('0,0')
            }, {
              'name': 'CAMPAIGN_URL',
              "content": props.domain + '/' + data.code_text
            }];
            utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
              if (err) {
                callback(new Error(err), null);
              } else {
                callback(null, null);
              }
            });
          }
        });

      } else {
        utility.nodeLogs('INFO', 'No details found')
        callback(null, null);
      }
    }
  });
};

exports.getTeamMembers = function(teamId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getTeamMembersDetails'], [teamId], function(err, result) {
    if (err) {
      callback(err, null)
    } else {
      if (result.length >= 0) {
        callback(null, result)
      } else {
        callback(null, [])
      }
    }
  });
};

exports.getTeamEntites = function(teamId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getEntityOfTeam'], [teamId], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      if (result && result[0]) {
        callback(null, result);
      } else {
        callback(null, []);
      }
    }
  });
}

exports.getTeamIndividualDetails = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getTeamIndividualDetails'], [codeId], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      if (result && result[0]) {
        callback(null, result);
      } else {
        callback(null, []);
      }
    }
  });
}

exports.getMainCampaignInfo = function(teamId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['gettingTeamDetails'], [teamId], function(err, teamData) {
    if (err) {
      utility.nodeLogs('ERROR', 'error while getting the team details')
      callback(err, null)
    } else {
      if (teamData && teamData[0]) {
        excuteQuery.queryForAll(sqlQueryMap['getMainCampaignInfo'], [teamData[0].code_id], function(err, campaignData) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, campaignData)
          }
        });
      } else {
        callback(null, []);
      }
    }
  });
}
exports.insertingInviteesdata = function(teamObj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['gettingTeamDetails'], [teamObj.teamid], function(err, teamResult) {
    if (err) {
      callback(err, result)
    } else {
      if (teamResult && teamResult[0]) {
        console.log("teambhhhsdhsdfhsd....")
        excuteQuery.queryForAll(sqlQueryMap['checkTeamData'], [teamObj.teamid, teamObj.userid], function(err, checkData) {
          teamObj.invited_date = moment.utc().toDate();
          if (err) {
            callback(err, result)
          } else {
            if (checkData && checkData[0]) {
              console.log("checkData");
              if (checkData[0].deleted_by) {
                callback(null, {
                  'flag': 'deleted'
                });
              } else if (checkData[0].created == 'yes') {
                callback(null, {
                  'flag': 'yes'
                });
              } else {
                callback(null, {
                  'flag': 'no'
                });
              }
            } else {
              excuteQuery.queryForAll(sqlQueryMap['insertingInviteesdata'], [teamObj.teamid, teamObj.userid, teamObj.invited_date], function(err, result) {
                if (err) {
                  callback(err, result)
                } else {
                  callback(null, {
                    'flag': 'no'
                  })
                }
              });
            }
          }
        });
      } else {
        callback(null, { 'flag': 'noTeam' })
      }
    }
  });

}

exports.getMyTeams = function(userid, skip, limit, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getMyTeams'], [userid, userid], function(err, result) {
    if (err) {
      callback(err, null)
    } else {
      callback(null, result)
    }
  });
}
exports.gettingTeamData = function(team_id, user_id, callback) {
  async.parallel({
    gettingTeamDetails: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['checkAdmin'], [team_id, user_id], function(err, teamResult) {
        var query = '';
        if (err) {
          callback(err, null);
        } else {
          if (teamResult[0]) {
            query = 'gettingAdminTeam';
          } else {
            query = 'gettingTeamData';
          }

          excuteQuery.queryForAll(sqlQueryMap[query], [team_id, team_id, user_id], function(err, campData) {
            if (err) {
              callback(err, null)
            } else {
              callback(null, campData)
            }
          });
        }
      });

    },
    gettingTeamMembers: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['gettingTeamMembers'], [team_id], function(err, teamMembersDetails) {
        if (err) {
          callback(err, null)
        } else {
          callback(null, teamMembersDetails)
        }
      });
    }
  }, function(err, result) {
    if (err) {
      callback(err, null)
    } else {
      var row = {};
      row.gettingTeamData = result.gettingTeamDetails;
      row.gettingTeamMembers = result.gettingTeamMembers;
      callback(null, row)
    }
  })
}

exports.getTeamData = function(team_id, callback) {
  async.parallel({
    gettingTeamDetails: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['teamdata'], [team_id], function(err, campData) {
        if (err) {
          callback(err, null)
        } else {
          callback(null, campData)
        }
      });
    },
    gettingTeamMembers: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['gettingTeamMembers'], [team_id], function(err, teamMembersDetails) {
        if (err) {
          callback(err, null)
        } else {
          callback(null, teamMembersDetails)
        }
      });
    }
  }, function(err, result) {
    if (err) {
      callback(err, null)
    } else {
      var row = {};
      row.gettingTeamData = result.gettingTeamDetails;
      row.gettingTeamMembers = result.gettingTeamMembers;
      callback(null, row)
    }
  })
}
exports.makingTeamAdmin = function(teamid, user_id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['makingTeamAdmin'], [teamid, user_id], function(err, result) {
    if (err) {
      callback(err, null)
    } else {
      callback(null, result)
    }
  })
}

exports.deletingTeamInvitee = function(teamid, userid, inviteeid, callback) {
  var obj = {};
  obj.action_date = moment.utc().toDate();
  async.parallel({
    deletingTeamInvitee: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['deletingTeamInvitee'], [userid, obj.action_date, teamid, inviteeid], function(err, deletingTeamInvitee) {
        if (err) {
          callback(err, null)
        } else {
          callback(null, deletingTeamInvitee)
        }
      });
    },
    updateIntoCode: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['updateIntoCode'], [teamid, userid], function(err, updateIntoCode) {
        if (err) {
          callback(err, null)
        } else {
          callback(null, updateIntoCode)
        }
      });
    }
  }, function(err, result) {
    if (err) {
      callback(err, null)
    } else {
      callback(null, null)
    }
  });
}

exports.resendTeamInvitee = function(teamid, inviteeid, callback) {
  var me = this;
  console.log("in resend mail");
  excuteQuery.queryForAll(sqlQueryMap['checkemailactteam'], [teamid, inviteeid], function(err, userResult) {
    if (err) {
      callback(err, null)
    } else {
      if (userResult && userResult[0]) {
        excuteQuery.queryForAll(sqlQueryMap['getTeamDetails'], [teamid], function(err, teamData) {
          if (err) {
            callback(err, null)
          } else {
            var teamObj = {};
            var inviteename = userResult[0].name;
            var inviteeemail = userResult[0].email;
            var userid = inviteeid;
            teamObj.codeid = teamData[0].code_id;
            teamObj.team_name = teamData[0].team_name;
            teamObj.userName = teamData[0].team_captain;
            teamObj.userEmail = teamData[0].team_captain_email;
            teamObj.team_id = teamid;
            if (userResult[0].password_salt) {
              console.log("in existing user");
              if(teamObj.codeid){
              me.sendMailsToTeamInvitees(teamObj, inviteename, inviteeemail, 'existingUser', '', userid, teamid, function(err, data) {
                if (err) {
                  callback(err, null)
                  utility.nodeLogs('ERROR', 'Error occured While sending the mail to invitees')
                } else {
                  callback(null, {
                    success: true
                  })
                  utility.nodeLogs('INFO', 'sending the mail to invitees Sucessfully')
                }
              });
            }else{
              me.inviteMembersWithoutCodeid(teamObj, inviteename, inviteeemail, 'existingUser', '', userid, teamid,function(err,result){
                                  if(err){
                                    console.log("error while calling");
                                  }else{
                                    console.log("No error found");
                                     callback(null,{success:true});
                                  }
                                })
            }
            } else {
              console.log("in new user")
              if(teamObj.codeid){
              me.sendMailsToTeamInvitees(teamObj, inviteename, inviteeemail, 'newUser', '', userid, teamid, function(err, data) {
                if (err) {
                  callback(err, null)
                  utility.nodeLogs('ERROR', 'Error occured While sending the mail to invitees')
                } else {
                  callback(null, {
                    success: true
                  })
                  utility.nodeLogs('INFO', 'sending the mail to invitees Sucessfully')

                }
              });
            }else{
              me.inviteMembersWithoutCodeid(teamObj, inviteename, inviteeemail, 'newUser', '', userid, teamid,function(err,result){
                                  if(err){
                                    console.log("error while calling");
                                  }else{
                                    console.log("No error found");
                                    callback(null,{success:true});
                                  }
                                })
            }

            }
          }
        });
      } else {
        utility.nodeLogs('INFO', 'no user results found')
        callback(null, null)
      }
    }
  });
}

exports.updatingTeamDetails = function(campaignObj, callback) {
  var logsObj = {};
  var me = this;
  console.log('in team services');
  console.log(campaignObj);
  excuteQuery.queryForAll(sqlQueryMap['getCodeTeamId'], [parseInt(campaignObj.team_id)], function(err, codeResult) {
    if (err) {
      callback(err, null)
    } else {
      if (codeResult && codeResult[0]) {
        campaignObj.codeid = codeResult[0].code_id;
        async.parallel({
          teamUpdate: function(callback) {
            excuteQuery.queryForAll(sqlQueryMap['updateTeamDetails'], [campaignObj.team_name, campaignObj.team_description, campaignObj.team_logo, campaignObj.donot_allow_join, campaignObj.support_multiple_campaigns, campaignObj.check_p2p, campaignObj.team_id], function(err, teamUpdate) {
              if (err) {
                callback(err, null)
              } else {
                callback(null, teamUpdate)
              }
            });
          },
          entityUpdate: function(callback) {
            excuteQuery.queryForAll(sqlQueryMap['entityUpdate'], [campaignObj.team_slug, campaignObj.team_id, 'team'], function(err, entityUpdate) {
              if (err) {
                callback(err, null)
              } else {
                callback(null, entityUpdate)
              }
            });
          },
          sendMailsToTeamInvitees: function(callback) {
            me.sendMailsToInvitees(campaignObj, function(err, emailCallback) {
              if (err) {
                console.log('err in team sending');
                callback(err, null)
              } else {
                console.log('successfully sent mails')
                callback(null, emailCallback)
              }
            })

          }

        }, function(err, result) {
          if (err) {
            callback(err, null)
          } else {
            callback(null, {
                'teamid': campaignObj.team_id
              })
              //update team detais into elastic search
            excuteQuery.queryForAll(sqlQueryMap['getEntity'], [campaignObj.team_id, 'team'], function(err, rows) {
              if (err) {
                callback(new Error(err), null);
              } else {
                var entityObj = {};
                entityObj.entity_id = campaignObj.team_id;
                entityObj.entity_type = 'team';
                entityObj.id = rows[0].id;
                entityObj.slug = rows[0].slug;
                entityObj.update = 'update';
                logsObj.action = "team Update Initiated to agenda job to update in elastcsearch";
                utility.nodeLogs('INFO', logsObj);
                agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
                //agenda.now('send campaign/update email', codeObject);
              }
            });
            //end
          }
        });
      } else {
        callback(null, null)
      }
    }
  });
};

exports.sendMailsToInvitees = function(teamObj, callback) {
  var me = this;
  if (teamObj.inviteesEmail.length > 0) {
    async.each(teamObj.inviteesEmail, function(singleObj, eachCallback) {
        if (singleObj.email) {
          excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [singleObj.email], function(err, userResult) {
            if (err) {
              eachCallback(err, null);
            } else {
              //for existing user
              if (userResult && userResult[userResult.length-1]) {
                if (userResult[userResult.length-1].id != teamObj.creatorid) {
                  var team_invitees = {};
                  team_invitees.team_id = teamObj.team_id
                  team_invitees.user_id = userResult[userResult.length-1].id;
                  team_invitees.created = 'no';
                  team_invitees.is_admin = 'no';
                  team_invitees.deleted_by = null;
                  team_invitees.action_date = null;
                  team_invitees.invited_date = moment.utc().toDate();
                  if (userResult[userResult.length-1].password_salt) {
                    team_invitees.team_id = parseInt(team_invitees.team_id);
                    excuteQuery.queryForAll(sqlQueryMap['checkTeamInvitee'], [team_invitees.user_id, team_invitees.team_id, team_invitees.user_id], function(err, teamInviteeData) {
                      if (err) {
                        utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                        eachCallback(err, null);
                      } else {
                        if (teamInviteeData && teamInviteeData[0]) {
                          //inserting into team invitees_tbl
                          excuteQuery.queryForAll(sqlQueryMap['updateInvitation'], [team_invitees.deleted_by, team_invitees.action_date, team_invitees.team_id, team_invitees.user_id], function(err, teamInvitationdata) {
                            if (err) {
                              utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                              eachCallback(err, null);
                            } else {
                              eachCallback(null, {
                                slug: teamObj.team_slug
                              });
                              var invitees_id = teamInvitationdata
                              if (teamObj && teamObj.approved_by && teamObj.codeid) {
                                me.sendMailsToTeamInvitees(teamObj, singleObj.name, singleObj.email, 'existingUser', '', userResult[userResult.length-1].id, teamObj.team_id, function(err, data) {
                                  if (err) {
                                    // eachCallback(err, null)
                                    utility.nodeLogs('ERROR', 'Error occured While sending the mail to invitees')
                                  } else {
                                    // eachCallback(null, null)
                                    utility.nodeLogs('INFO', 'sending the mail to invitees Sucessfully')
                                  }
                                });
                              } else {
                                me.inviteMembersWithoutCodeid(teamObj, singleObj.name, singleObj.email, 'existingUser', '', userResult[userResult.length-1].id, teamObj.team_id, function(err, result) {
                                  if (err) {
                                    console.log("error while calling");
                                  } else {
                                    console.log("Mail sent successfully");
                                  }
                                });
                              }

                            }
                          })
                        } else {
                          //inserting into team invitees_tbl
                          excuteQuery.queryForAll(sqlQueryMap['teamInvitation'], team_invitees, function(err, teamInvitationdata) {
                            if (err) {
                              utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                              eachCallback(err, null);
                            } else {
                              eachCallback(null, {
                                slug: teamObj.team_slug
                              });
                              var invitees_id = teamInvitationdata
                              if (teamObj && teamObj.approved_by && teamObj.codeid) {
                                me.sendMailsToTeamInvitees(teamObj, singleObj.name, singleObj.email, 'existingUser', '', userResult[userResult.length-1].id, teamObj.team_id, function(err, data) {
                                  if (err) {
                                    // eachCallback(err, null)
                                    utility.nodeLogs('ERROR', 'Error occured While sending the mail to invitees')
                                  } else {
                                    // eachCallback(null, null)
                                    utility.nodeLogs('INFO', 'sending the mail to invitees Sucessfully')
                                  }
                                });
                              } else {
                                me.inviteMembersWithoutCodeid(teamObj, singleObj.name, singleObj.email, 'existingUser', '', userResult[userResult.length-1].id, teamObj.team_id, function(err, result) {
                                  if (err) {
                                    console.log("error while calling");
                                  } else {
                                    console.log("Mail sent successfully");
                                  }
                                });
                              }

                            }
                          })
                        }
                      }
                    })
                  } else {
                    excuteQuery.queryForAll(sqlQueryMap['checkTeamInvitee'], [team_invitees.user_id, team_invitees.team_id, team_invitees.user_id], function(err, teamInviteeData) {
                      if (err) {
                        utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                        eachCallback(err, null);
                      } else {
                        if (teamInviteeData && teamInviteeData[0]) {
                          excuteQuery.queryForAll(sqlQueryMap['updateInvitation'], [team_invitees.deleted_by, team_invitees.action_date, team_invitees.team_id, team_invitees.user_id], function(err, teamInvitationdata) {
                            if (err) {
                              utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                              eachCallback(err, null);
                            } else {
                              eachCallback(null, null)
                              if (teamObj && teamObj.approved_by && teamObj.codeid) {
                                me.sendMailsToTeamInvitees(teamObj, singleObj.name, singleObj.email, 'newUser', '', userResult[userResult.length-1].id, teamObj.team_id, function(err, data) {
                                  if (err) {
                                    utility.nodeLogs('ERROR', 'Error occured While sending the mail to invitees')
                                  } else {
                                    utility.nodeLogs('INFO', 'sending the mail to invitees Sucessfully')

                                  }
                                });
                              } else {
                                me.inviteMembersWithoutCodeid(teamObj, singleObj.name, singleObj.email, 'newUser', '', userResult[userResult.length-1].id, teamObj.team_id, function(err, result) {
                                  if (err) {
                                    console.log("error while calling");
                                  } else {
                                    console.log("Mail sent successfully");
                                  }
                                });
                              }
                            }
                          });
                        } else {
                          excuteQuery.queryForAll(sqlQueryMap['teamInvitation'], team_invitees, function(err, teamInvitationdata) {
                            if (err) {
                              utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                              eachCallback(err, null);
                            } else {
                              eachCallback(null, null)
                              if (teamObj && teamObj.approved_by && teamObj.codeid) {
                                me.sendMailsToTeamInvitees(teamObj, singleObj.name, singleObj.email, 'newUser', '', userResult[userResult.length-1].id, teamObj.team_id, function(err, data) {
                                  if (err) {
                                    utility.nodeLogs('ERROR', 'Error occured While sending the mail to invitees')
                                  } else {
                                    utility.nodeLogs('INFO', 'sending the mail to invitees Sucessfully')

                                  }
                                });
                              } else {
                                me.inviteMembersWithoutCodeid(teamObj, singleObj.name, singleObj.email, 'newUser', '', userResult[userResult.length-1].id, teamObj.team_id, function(err, result) {
                                  if (err) {
                                    console.log("error while calling");
                                  } else {
                                    console.log("Mail sent successfully")
                                  }
                                });
                              }
                            }
                          });
                        }
                      }
                    });
                  }
                } else {
                  var error = {};
                  error.errors = ["Don't add creator email"];
                  error.status = 400;
                  eachCallback(new Error(JSON.stringify(error)));
                }
              } else {
                //for new user
                var invitee_name = singleObj.name;
                var verification_key = uuid.v4() + "-" + uslug(invitee_name);
                var date = moment.utc().toDate();
                var active = 'no';
                excuteQuery.insertAndReturnKey(sqlQueryMap['insertingIntoUserTbl'], [invitee_name, singleObj.email, verification_key, date, active], function(err, userId) {
                  if (err) {
                    eachCallback(err)
                  } else {
                    singleObj.user_id = userId;
                    singleObj.Active = "";
                    var team_invitees = {};
                    team_invitees.team_id = teamObj.team_id;
                    team_invitees.user_id = singleObj.user_id;
                    team_invitees.created = 'no';
                    team_invitees.is_admin = 'no';
                    team_invitees.invited_date = moment.utc().toDate();
                    async.parallel({
                      enitycreation: function(callback) {
                        var userEntity = {};
                        userEntity.entity_id = singleObj.user_id;
                        userEntity.entity_type = "user";
                        var count = 1;
                        var usrSlug = uslug(invitee_name);
                        var originlSlug = uslug(invitee_name);
                        var userDetailsObject = {
                          count: 1,
                          name: invitee_name
                        };
                        charityService.entitySlugCreation(userEntity, usrSlug, userDetailsObject, originlSlug, function(err, userEntityId) {
                          if (err) {
                            callback(err, null);
                          } else {
                            userEntity.id = userEntityId;
                            callback(null, userId);
                          }
                        });
                      },
                      updateUserprofile: function(callback) {
                        var timezone_id = 381;
                        excuteQuery.queryForAll(sqlQueryMap['useIdAddToUserProfile'], [userId, timezone_id], function(err, userResult) {
                          if (err) {
                            callback(err, null);
                          } else {
                            callback(null, userId);
                          }
                        });
                      },
                      teamInviteeInsertion: function(callback) {
                        excuteQuery.queryForAll(sqlQueryMap['teamInvitation'], team_invitees, function(err, teamInvitationdata) {
                          if (err) {
                            utility.nodeLogs('ERROR', 'Error getting while inserting into team_invitees_tbl');
                            callback(err, null);
                          } else {
                            callback(null, null);
                            //
                            if (teamObj && teamObj.approved_by) {
                              me.sendMailsToTeamInvitees(teamObj, singleObj.name, singleObj.email, 'newUser', verification_key, singleObj.user_id, teamObj.team_id, function(err, data) {
                                if (err) {
                                  utility.nodeLogs('ERROR', 'Error occured whil sending the mail to invitees')
                                } else {
                                  utility.nodeLogs('INFO', 'sending the mail to invitees Sucessfully')
                                }

                              });
                            }else{
                              me.inviteMembersWithoutCodeid(teamObj, singleObj.name, singleObj.email, 'newUser', verification_key, singleObj.user_id, teamObj.team_id, function(err, result) {
                                  if (err) {
                                    console.log("error while calling");
                                  } else {
                                    console.log("Mail sent successfully")
                                  }
                                });
                            }
                            //
                          }
                        });
                      }
                    }, function(err, results) {
                      if (err) {
                        utility.log('error', "while user data storage");
                        eachCallback(err);
                      } else {
                        eachCallback(null);
                      }
                    });
                  }
                });
              }
            }
          });
        }
      },
      function(err) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, teamObj);
        }
      })
  } else {
    utility.nodeLogs('INFO', 'No invitees for team');
    callback(null, null)
  }
}
exports.checkingUserTeam = function(userid, teamid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['checkingUserTeam'], [userid, teamid], function(err, dataCheck) {
    if (err) {
      callback(err, result)
    } else {
      if (dataCheck && dataCheck[0]) {
        if (dataCheck[0].created == 'yes') {
          callback(err, {
            'flag': 'yes',
            'slug': dataCheck[0].slug
          })
        } else {
          callback(err, {
            'flag': 'no'
          })
        }
      } else {
        callback(err, {
          'flag': 'no'
        })
      }
    }
  });
}

exports.getTeamCaptainAndMembers = function(codeId, callback) {
    var teamIds = [];
    var userIds = [];
    var teamDetails = [];
    excuteQuery.queryForAll(sqlQueryMap['getTeamIds'], codeId, function(err, teamsData) {
      if (err) {
        utility.nodeLogs('ERROR', "error occured while getting the team ids")
        callback(err, null)
      } else {
        if (teamsData && teamsData[0]) {
          teamDetails = teamsData;
          teamIds = underscore.pluck(teamsData, 'id')
          userIds = underscore.pluck(teamsData, 'tc_user_id')
          excuteQuery.queryForAll(sqlQueryMap['getTeamEmailsAndNames'], [teamIds], function(err, teamEmailsData) {
            if (err) {
              utility.nodeLogs('ERROR', "error occured while getting the data")
              callback(err, null)
            } else {
              if (teamEmailsData && teamEmailsData[0]) {
                for (var i = 0; i < teamEmailsData.length; i++) {
                  teamDetails.push(teamEmailsData[i])
                }
                utility.nodeLogs('INFO', "data sent to called method")
                if (teamDetails && teamDetails.length) {
                  callback(null, teamDetails)
                } else {
                  callback(null, [])
                }
              } else {
                utility.nodeLogs('INFO', "data sent to called method without team invitees data")
                if (teamDetails && teamDetails.length) {
                  callback(null, teamDetails)
                } else {
                  callback(null, [])
                }
              }
            }
          })
        } else {
          utility.nodeLogs('INFO', "no team ids found")
          callback(null, []);
        }
      }
    });
  }

exports.sendMailsTeamOwners=function(codeid,status,callback) {
excuteQuery.queryForAll(sqlQueryMap['getUserBasedOnTeam'],[codeid],function(err,teamOwnersDetails) {
if(err){
  callback(err,null);
  utility.nodeLogs('ERROR','Error occured while getting the user details based on campaignid');
}else{
  if(teamOwnersDetails&&teamOwnersDetails.length){
      async.each(teamOwnersDetails, function(singleObj, eachCallback) {
              var finalobjectmandril = {};
              finalobjectmandril.from = props.fromemail;
              finalobjectmandril.email = singleObj.email;
              finalobjectmandril.text = "";
              finalobjectmandril.subject = 'Alert from ' + singleObj.title + ' campaign';
              if(status=="draft"){
              finalobjectmandril.template_name = "Alert to team owners when main campain draft";
            }else{
              finalobjectmandril.template_name = "Alert to team owners when main campain publish";
            }
                finalobjectmandril.template_content = [{
                  "name": "name",
                  "content": "*|NAME|*"
                }, {
                  "name": "campaign_name",
                  "content": "*|CAMPAIGN_NAME|*"
                }, {
                  "name": "camp_name",
                  "content": "*|CAMP_NAME|*"
                }, {
                  "name": "domain",
                  "content": "*|DOMAIN|*"
                }];
                finalobjectmandril.merge_vars = [{
                  "name": "NAME",
                  "content": singleObj.name
                }, {
                  "name": "CAMPAIGN_NAME",
                  "content": singleObj.title
                }, {
                  "name": "TEAM_NAME",
                  "content": singleObj.team_name
                }, {
                  "name": "DOMAIN",
                  "content": props.domain
                }];
            
              utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
                if (err) {
                  eachCallback(err, null);
                } else {
                  eachCallback(null, reuslt);
                }
              });

            }, function(err) {
              if (err) {
                utility.nodeLogs('ERROR', "error occred while sending mail")
                callback(err)
              } else {
                utility.nodeLogs('INFO', "mail sent successflly")
                callback()
              }
            });
  }else {
        utility.nodeLogs('INFO', 'NO data found');
        callback(null, null);
      }
}
});
}

  //send mails to team capatian and members when main campaaing is in draft

exports.sendMailsTeamCaptainAndMembersDraft = function(codeId, callback) {
  var me = this;
  me.getTeamCaptainAndMembers(codeId, function(err, teamEmailsData) {
    if (err) {
      utility.nodeLogs('ERROR', "Error while getting from campaign")
      callback(err, null)
    } else {
      if (teamEmailsData && teamEmailsData.length) {
        excuteQuery.queryForAll(sqlQueryMap['getCodeById'], codeId, function(err, codeData) {
          if (err) {
            callback(err, null)
          } else {
            async.each(teamEmailsData, function(singleObj, eachCallback) {
              var finalobjectmandril = {};
              finalobjectmandril.from = props.fromemail;
              finalobjectmandril.email = singleObj.email;
              finalobjectmandril.text = "";
              finalobjectmandril.subject = 'Alert from ' + codeData[0].title + ' campaign';
              finalobjectmandril.template_name = "Alert to team captain and members for draft";
              if (singleObj && singleObj.team_name) {
                finalobjectmandril.template_content = [{
                  "name": "name",
                  "content": "*|NAME|*"
                }, {
                  "name": "campaign_name",
                  "content": "*|CAMPAIGN_NAME|*"
                }, {
                  "name": "team_name",
                  "content": "*|TEAM_NAME|*"
                }, {
                  "name": "domain",
                  "content": "*|DOMAIN|*"
                }];
                finalobjectmandril.merge_vars = [{
                  "name": "NAME",
                  "content": singleObj.name
                }, {
                  "name": "TEAM_NAME",
                  "content": singleObj.team_name
                }, {
                  "name": "CAMPAIGN_NAME",
                  "content": codeData[0].title
                }, {
                  "name": "DOMAIN",
                  "content": props.domain
                }];
              } else {
                finalobjectmandril.template_content = [{
                  "name": "name",
                  "content": "*|NAME|*"
                }, {
                  "name": "campaign_name",
                  "content": "*|CAMPAIGN_NAME|*"
                }, {
                  "name": "camp_name",
                  "content": "*|CAMP_NAME|*"
                }, {
                  "name": "domain",
                  "content": "*|DOMAIN|*"
                }];
                finalobjectmandril.merge_vars = [{
                  "name": "NAME",
                  "content": singleObj.name
                }, {
                  "name": "CAMPAIGN_NAME",
                  "content": codeData[0].title
                }, {
                  "name": "CAMP_NAME",
                  "content": singleObj.camp_name
                }, {
                  "name": "DOMAIN",
                  "content": props.domain
                }];
              }
              utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
                if (err) {
                  eachCallback(err, null);
                } else {
                  eachCallback(null, reuslt);
                }
              });

            }, function(err) {
              if (err) {
                utility.nodeLogs('ERROR', "error occred while sending mail")
                callback(err)
              } else {
                utility.nodeLogs('INFO', "mail sent successflly")
                callback()
              }
            });
          }
        });
      } else {
        utility.nodeLogs('INFO', 'NO data found');
        callback(null, null);
      }

    }
  });
}


//send mails to team capatian and members when main campaaing is in publish
exports.sendMailsTeamCaptainAndMembersPublish = function(codeId, callback) {
  var me = this;
  me.getTeamCaptainAndMembers(codeId, function(err, teamEmailsData) {
    if (err) {
      utility.nodeLogs('ERROR', "Error while getting from campaign")
      callback(err, null)
    } else {
      if (teamEmailsData && teamEmailsData.length) {
        excuteQuery.queryForAll(sqlQueryMap['getCodeById'], codeId, function(err, codeData) {
          if (err) {
            callback(err, null)
          } else {
            async.each(teamEmailsData, function(singleObj, eachCallback) {
              var finalobjectmandril = {};
              finalobjectmandril.from = props.fromemail;
              finalobjectmandril.email = singleObj.email;
              finalobjectmandril.text = "";
              finalobjectmandril.subject = "Alert from " + codeData[0].title + " campaign";
              finalobjectmandril.template_name = "Alert to team captain and members for publish";
              if (singleObj && singleObj.team_name) {
                finalobjectmandril.template_content = [{
                  "name": "name",
                  "content": "*|NAME|*"
                }, {
                  "name": "campaign_name",
                  "content": "*|CAMPAIGN_NAME|*"
                }, {
                  "name": "team_name",
                  "content": "*|TEAM_NAME|*"
                }, {
                  "name": "domain",
                  "content": "*|DOMAIN|*"
                }];
                finalobjectmandril.merge_vars = [{
                  "name": "NAME",
                  "content": singleObj.name
                }, {
                  "name": "TEAM_NAME",
                  "content": singleObj.team_name
                }, {
                  "name": "CAMPAIGN_NAME",
                  "content": codeData[0].title
                }, {
                  "name": "DOMAIN",
                  "content": props.domain
                }];
              } else {
                finalobjectmandril.template_content = [{
                  "name": "name",
                  "content": "*|NAME|*"
                }, {
                  "name": "campaign_name",
                  "content": "*|CAMPAIGN_NAME|*"
                }, {
                  "name": "camp_name",
                  "content": "*|CAMP_NAME|*"
                }, {
                  "name": "domain",
                  "content": "*|DOMAIN|*"
                }];
                finalobjectmandril.merge_vars = [{
                  "name": "NAME",
                  "content": singleObj.name
                }, {
                  "name": "CAMPAIGN_NAME",
                  "content": codeData[0].title
                }, {
                  "name": "CAMP_NAME",
                  "content": singleObj.camp_name
                }, {
                  "name": "DOMAIN",
                  "content": props.domain
                }];
              }
              utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
                if (err) {
                  eachCallback(err, null);
                } else {
                  eachCallback(null, reuslt);
                }
              });

            }, function(err) {
              if (err) {
                utility.nodeLogs('ERROR', "error occred while sending mail")
                callback(err)
              } else {
                utility.nodeLogs('INFO', "mail sent successflly")
                callback()
              }
            });
          }
        });
      } else {
        utility.nodeLogs('INFO', "no data found successflly")
        callback(null, null)
      }

    }
  });
}

exports.addDenyTeams = function(obj, callback) {
  var me = this;
  var teamDetails = {};
  excuteQuery.queryForAll(sqlQueryMap['teamdata'], [obj.teamid], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'ERROR occured while updating');
      callback(err, null);
    } else {
      if (result && result[0]) {
        if (result[0].approved_by) {
          callback(null, { status: 'success', flag: 'approved' })
        } else {
          teamDetails = result[0];
          excuteQuery.queryForAll(sqlQueryMap['denyTeamRecord'], [obj.teamid], function(err, result) {
            if (err) {
              utility.nodeLogs('ERROR', 'ERROR occured while updating');
              callback(err, null)
            } else {
              utility.nodeLogs('INFO', 'Team deleted Sucessfully')
              callback(null, result)
              excuteQuery.queryForAll(sqlQueryMap['deleteTeamInviteesRecord'], [obj.teamid], function(err, result) {
                if (err) {
                  utility.nodeLogs('ERROR', 'Error while deleting the team invitees');
                  callback(err, null);
                } else {
                  utility.nodeLogs('INFO', 'Team invitees deleted successfully');
                  excuteQuery.queryForAll(sqlQueryMap['password'], obj.deny_user_id, function(err, userResult) {
                    if (err) {
                      callback(err, null)
                    } else {
                      if (userResult && userResult[0]) {
                        teamDetails.deny_name = userResult[0].name;
                        callback(null, { status: 'success', flag: 'deniedinvitaion' });
                        me.sendTeamDenyAlertToTeamCreator(teamDetails, function(err, result) {
                          if (err) {
                            console.log("error occured while sending the mail")
                          } else {
                            console.log("mail sent successfully");
                          }
                        })
                      } else {
                        utility.nodeLogs('INFO', 'No user details found');
                      }
                    }
                  });
                }
              });

            }
          });
        }
      } else {

        callback(null, { status: 'success', flag: 'deniedinvitaionalready' });
        utility.nodeLogs('INFO', "NO team details found");
      }
    }
  });

}

exports.addApproveTeam = function(obj, callback) {
  var me = this;
  var userUpdate = {};
  var userids = [];
  var teamDetails = {};
  obj.teamid = parseInt(obj.teamid)
  excuteQuery.queryForAll(sqlQueryMap['getCodeTeamId'], [obj.teamid], function(err, teamresult) {
    if (err) {
      utility.nodeLogs('ERROR', 'ERROR updating');
      callback(err, null);
    } else {
      if (teamresult && teamresult[0]) {
        if (teamresult && teamresult[0] && !teamresult[0].approved_by) {
          obj.approved_date = moment.utc().toDate();
          excuteQuery.queryForAll(sqlQueryMap['getStatusUpdate'], [obj.userId, obj.approved_date, obj.teamid], function(err, result1) {
            if (err) {
              utility.nodeLogs('ERROR', 'ERROR updating');
              callback(err, null);
            } else {
              excuteQuery.queryForAll(sqlQueryMap['teamdata'], [obj.teamid], function(err, teamDetails) {
                if (err) {
                  utility.nodeLogs('ERROR', 'ERROR updating');
                  callback(err, null);
                } else {
                  if (teamDetails && teamDetails[0]) {
                    teamDetails = teamDetails[0];
                    //
                    excuteQuery.queryForAll(sqlQueryMap['getTeamApprove'], [obj.teamid], function(err, inviteData) {
                      if (err) {
                        utility.nodeLogs('ERROR', 'ERROR occured while getting team members');
                        callback(err, null);
                      } else {
                        var teamData = {};
                        teamData = inviteData;
                        userids = underscore.pluck(teamData, 'user_id');
                        excuteQuery.queryForAll(sqlQueryMap['getTeamUser'], [userids], function(err, result3) {
                          if (err) {
                            utility.nodeLogs('ERROR', 'ERROR occured while getting user detsils');
                            callback(err, null);
                          } else {
                            teamMemberData = result3;
                            async.each(teamMemberData, function(singleObj, eachCallback) {
                              var finalobjectmandril = {}
                              finalobjectmandril.from = props.fromemail;
                              finalobjectmandril.email = singleObj.email;
                              finalobjectmandril.text = "";
                              if (!singleObj.password_salt) {
                                finalobjectmandril.subject = teamDetails.team_creator_name + " has invited you to create a fundraiser to  the team " + teamDetails.team_name;
                                finalobjectmandril.template_name = "Invitation to team invitees";
                                finalobjectmandril.template_content = [{
                                  "name": "inviteename",
                                  "content": "*|INVITEE_NAME|*"
                                }, {
                                  "name": "teamname",
                                  "content": "*|TEAM_NAME|*"
                                }, {
                                  "name": "campaignname",
                                  "content": "*|CAMPAIGN_NAME|*"
                                }, {
                                  "name": "teamcaptainname",
                                  "content": "*|TEAM_CAPTAIN_NAME|*"
                                }, {
                                  "name": "teamcaptainemail",
                                  "content": "*|EMAIL|*"
                                }, {
                                  "name": "teamname",
                                  "content": "*|TEAM_NAME|*"
                                }, {
                                  "name": "denyurl",
                                  "content": "*|DENY_URL|*"
                                }, {
                                  "name": "accepturl",
                                  "content": "*|ACCEPT_URL|*"
                                }, {
                                  "name": "slug`",
                                  "content": "*|SLUG|*"
                                }];
                                finalobjectmandril.merge_vars = [{
                                  "name": "INVITEE_NAME",
                                  "content": singleObj.name
                                }, {
                                  "name": "TEAM_NAME",
                                  "content": teamDetails.team_name
                                }, {
                                  "name": "CAMPAIGN_NAME",
                                  "content": teamDetails.main_campaign_name
                                }, {
                                  "name": "TEAM_CAPTAIN_NAME",
                                  "content": teamDetails.team_creator_name
                                }, {
                                  "name": "EMAIL",
                                  "content": teamDetails.creator_email
                                }, {
                                  "name": "DENY_URL",
                                  "content": props.domain + "/pages/inviteedelete/" + singleObj.id + '?teamid=' + teamDetails.id
                                }, {
                                  "name": "ACCEPT_URL",
                                  "content": props.domain + "/pages/resetpassword/" + singleObj.id + '?team=team' + '&mainCampaignSlug=' + teamDetails.main_campaign_slug + '&teamid=' + teamDetails.id
                                }, {
                                  "name": "SLUG",
                                  "content": props.domain + '/' + teamDetails.team_slug
                                }];
                                utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
                                  if (err) {
                                    eachCallback(err, null);
                                  } else {
                                    eachCallback(null, reuslt);
                                  }
                                });
                              } else {
                                finalobjectmandril.subject = teamDetails.team_creator_name + " has invited you to create a fundriser for  the team " + teamDetails.team_name;
                                finalobjectmandril.template_name = "Invitation to team invitees";
                                finalobjectmandril.template_content = [{
                                  "name": "inviteename",
                                  "content": "*|INVITEE_NAME|*"
                                }, {
                                  "name": "teamname",
                                  "content": "*|TEAM_NAME|*"
                                }, {
                                  "name": "campaignname",
                                  "content": "*|CAMPAIGN_NAME|*"
                                }, {
                                  "name": "teamcaptainname",
                                  "content": "*|TEAM_CAPTAIN_NAME|*"
                                }, {
                                  "name": "teamcaptainemail",
                                  "content": "*|EMAIL|*"
                                }, {
                                  "name": "denyurl",
                                  "content": "*|DENY_URL|*"
                                }, {
                                  "name": "accepturl",
                                  "content": "*|ACCEPT_URL|*"
                                }, {
                                  "name": "slug",
                                  "content": "*|SLUG|*"
                                }];
                                finalobjectmandril.merge_vars = [{
                                  "name": "INVITEE_NAME",
                                  "content": singleObj.name
                                }, {
                                  "name": "TEAM_NAME",
                                  "content": teamDetails.team_name
                                }, {
                                  "name": "CAMPAIGN_NAME",
                                  "content": teamDetails.main_campaign_name
                                }, {
                                  "name": "TEAM_CAPTAIN_NAME",
                                  "content": teamDetails.team_creator_name
                                }, {
                                  "name": "EMAIL",
                                  "content": teamDetails.creator_email
                                }, {
                                  "name": "DENY_URL",
                                  "content": props.domain + "/pages/inviteedelete/" + singleObj.id + '?teamid=' + teamDetails.id
                                }, {
                                  "name": "ACCEPT_URL",
                                  "content": props.domain + '/' + teamDetails.main_campaign_slug + '?teamid=' + teamDetails.id + '&userid=' + singleObj.id + '&teamMember=yes'
                                }, {
                                  "name": "SLUG",
                                  "content": props.domain + '/' + teamDetails.team_slug
                                }];
                                utility.mandrillTemplate(finalobjectmandril, function(err, result) {
                                  if (err) {
                                    eachCallback(err, null);
                                  } else {
                                    eachCallback(null, result);
                                  }
                                });

                              }
                            }, function(err) {
                              if (err) {
                                callback(err)
                              } else {

                                me.sendTeamApproveAlertToTeamCreator(obj, function(err, data) {
                                  if (err) {
                                    utility.nodeLogs('ERROR', 'Error occured whil sending the mail to invitees')
                                  } else {
                                    utility.nodeLogs('INFO', 'sending the mail to invitees Sucessfully')
                                  }
                                });
                                callback(null, { status: "success", flag: 'approved' });
                              }
                            });
                          }
                        });

                      }

                    });
                  } else {
                    utility.nodeLogs('INFO', 'No team and team members details found');
                    callback(null, { status: 'success' });
                  }
                }
              });
            }
          });
        } else {
          utility.nodeLogs('INFO', 'team approved already');
          excuteQuery.queryForAll(sqlQueryMap['password'], [obj.userId], function(err, userResult) {
            if (err) {
              utility.nodeLogs('INFO', 'No team and team members details found');
              callback(err, null);

            } else {
              callback(null, { status: 'success', flag: 'Accepted_already', name: userResult[0].name, teamname: teamDetails.team_name });
            }
          })

        }
      } else {
        callback(null, { status: 'success', flag: 'nodata' })
      }
    }
  });
}

//sending mail to owner
exports.sendTeamDenyAlertToTeamCreator = function(data, callback) {
  var finalobjectmandril = {};
  finalobjectmandril.from = props.fromemail;
  finalobjectmandril.email = data.creator_email;
  finalobjectmandril.text = "";
  finalobjectmandril.subject = "Your " + data.team_name + " team denied successfully";
  finalobjectmandril.template_name = "Team denied successfully";
  finalobjectmandril.template_content = [{
    "name": "teamname",
    "content": "*|TEAM_NAME|*"
  }, {
    "name": "denynname",
    "content": "*|DENY_NAME|*"
  }, {
    "name": "teamcaptainname",
    "content": "*|TEAM_CAPTAIN_NAME|*"
  }, {
    "name": "teampage",
    "content": "*|TEAM_PAGE|*"
  }];
  finalobjectmandril.merge_vars = [{
    "name": "TEAM_NAME",
    "content": data.team_name
  }, {
    "name": "DENY_NAME",
    "content": data.deny_name
  }, {
    "name": "TEAM_CAPTAIN_NAME",
    "content": data.team_creator_name
  }, {
    'name': 'TEAM_PAGE',
    "content": props.domain + '/' + data.team_slug
  }];
  utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, null);
    }
  });
}

exports.sendMailToTeamApprovar = function(teamDetails, callback) {
  var finalobjectmandril = {};
  finalobjectmandril.from = props.fromemail;
  finalobjectmandril.email = singleObj.email;
  finalobjectmandril.text = "";
  finalobjectmandril.subject = "Your team " + teamDetails.title;
  finalobjectmandril.template_name = "Team denied successfully";
  if (singleObj && singleObj.team_name) {
    finalobjectmandril.template_content = [{
      "name": "name",
      "content": "*|NAME|*"
    }, {
      "name": "campaign_name",
      "content": "*|CAMPAIGN_NAME|*"
    }, {
      "name": "team_name",
      "content": "*|TEAM_NAME|*"
    }, {
      "name": "domain",
      "content": "*|DOMAIN|*"
    }];
    finalobjectmandril.merge_vars = [{
      "name": "NAME",
      "content": singleObj.name
    }, {
      "name": "TEAM_NAME",
      "content": singleObj.team_name
    }, {
      "name": "CAMPAIGN_NAME",
      "content": codeData[0].title
    }, {
      "name": "DOMAIN",
      "content": props.domain
    }];
  }
}


exports.updatePublishStatus = function(teamId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['updateTeamPublishStatus'], teamId, function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'ERROR occured while updating');
      callback(err, null)
    } else {
      utility.nodeLogs('INFO', 'Status publish updated Sucessfully')
      callback(null, { status: 'success' })
    }
  });
}
exports.updateUnPublishStatus = function(teamId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['updateUnPublishStatus'], teamId, function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'ERROR occured while updating')
      callback(err, null)
    } else {
      utility.nodeLogs('INFO', 'Status draft updated Sucessfully')
      callback(null, { status: 'success' })
    }
  });
}
exports.deleteTeam = function(teamid, callback) {
  var id = "";
  excuteQuery.queryForAll(sqlQueryMap['deleteTeam'], teamid, function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'Error occured while deleting the team');
    } else {
      utility.nodeLogs('INFO', 'Team deleted Sucessfully');
      callback(null, { status: 'success' });
      pool.query('select * from entity_tbl where entity_id =?', [teamid], function(err, slugResult) {
        if (err) {
          callback(err, null);
        } else {
          if (slugResult && slugResult.length > 0) {
            id = slugResult[0].id;
          } else {
            id = 12345;
          }
          agenda.now('Delete campaign from elasticsearch', {
            id: id
          });
        }
      });
    }
  });
}


exports.getCampaigns = function(obj, callback) {
  var value = sqlQueryMap["campaignBasedOnCategory"];
  if (!obj.skip) {
    obj.skip = 0;
  }
  if (obj.categoryId) {

    value += ' and c.team_campaign="no" and c.team_id is null and ';

    if(obj.codeid){
      value += ' c.id NOT IN ('+ obj.codeid +') AND ';
    }

    value +=   ' (c.code_text like' + "'%" + obj.name + "%'" + ' or c.title like ' + "'%" + obj.name + "%')" + ' and category_id=' + "'" + obj.categoryId + "'" + ' group by c.id ORDER BY c.title DESC limit 50'; //LIMIT 20 OFFSET '+ obj.skip ;
  }else if(obj&&obj.teamFund){
    value += ' and c.donotallow_team_campaigns = "no" and  c.team_campaign="no" and c.team_id is null and ';

    if(obj.codeid){
      value += ' c.id NOT IN ('+ obj.codeid +') AND ';
    }
    value += ' (c.code_text like' + "'%" + obj.name + "%'" + ' or c.title like ' + "'%" + obj.name + "%')" + ' group by c.id ORDER BY c.title DESC limit 50';
    
  } else {

    value += ' and c.team_campaign="no" and c.team_id is null and ';

    if(obj.codeid){
      value += ' c.id NOT IN ('+ obj.codeid +') AND ';
    }

    value += ' (c.code_text like' + "'%" + obj.name + "%'" + ' or c.title like ' + "'%" + obj.name + "%')" + ' group by c.id ORDER BY c.title DESC limit 50'; // LIMIT 20 OFFSET '+ obj.skip ;
  }

  excuteQuery.queryForAll(value, [], function(err, rows) {

    if (err) {
      console.log(err);
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};



exports.getTeamAdmins = function(teamId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getTeamAdmins'], [teamId, teamId], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
}

exports.getCreatedStatus = function(userid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCreatedStatus'], [userid], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      if (result.length) {
        callback(null, result);
      } else {
        callback(null, { 'status': 'success' });
      }
    }
  });
}

exports.getTeamName = function(teamId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['gettingTeamDetails'], [teamId], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
}
