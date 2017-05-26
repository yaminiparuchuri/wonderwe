var props = require('config').props;

exports.sendThankYouEmail = function(codeObject, callback) {
  //5x55t4q
  try {
    var mandrilObject = {};
    var user;
    mandrilObject.from = props.fromemail;
    mandrilObject.text = "";
    mandrilObject.subject = "Congratulations";
    mandrilObject.template_name = "thank you - fundraiser creator";
    mandrilObject.template_content = [{
      "name": "name",
      "content": "*|NAME|*"
    }, {
      "name": "campaignurl",
      "content": "*|CAMPAIGN_URL|*"
    }, {
      "name": "email",
      "content": "*|email|*"
    }, {
      "name": "facebookshare",
      "content": "*|SHARE_FACEBOOK|*"
    }, {
      "name": "loginurl",
      "content": "*|LOGIN_URL|*"
    }, {
      "name": "campaigntitle",
      "content": "*|CAMPAIGN_TITLE|*"
    }, {
      "name": "facebookclientid",
      "content": "*|FACEBOOK_CLIENT_ID|*"
    }, {
      "name": "wecode",
      "content": "*|WECODE|*"
    }, {
      "name": "goal",
      "content": "*|GOAL|*"
    }, {
      "name": "peerurl",
      "content": "*|PEER_URL|*"
    }, {
      "name": "groupurl",
      "content": "*|GROUP_URL|*"
    }, {
      "name": "widgetsfeature",
      "content": "*|WIDGETS_FEATURE|*"
    }, {
      "name": "campaignwidgeturl",
      "content": "*|CAMPAIGN_WIDGETS_URL|*"
    }];

    excuteQuery.queryForAll(sqlQueryMap['getUserProfileWithCurrency'], [codeObject.id], function(err, result) {
      if (err) {
        utility.nodeLogs('ERROR', {
          message: 'Error in sql query '
        });
        callback(err, null);
      } else {
        if (result && result[0]) {
          var user = result[0];
          mandrilObject.email = user.email;
          mandrilObject.merge_vars = [{
            "name": "NAME",
            "content": user.name
          }, {
            "name": "CAMPAIGN_URL",
            "content": props.domain + '/' + codeObject.code_text
          }, {
            "name": "email",
            "content": user.email
          }, {
            "name": "LOGIN_URL",
            "content": props.domain + '/login'
          }, {
            "name": "SHARE_FACEBOOK",
            "content": "http://facebook.com/dialog/feed?link=" + props.domain + '/' + codeObject.code_text + '&app_id=' + props.facebook_client_id + '&redirect_uri=' + props.domain + '/' + codeObject.code_text
          }, {
            "name": "FACEBOOK_CLIENT_ID",
            "content": props.facebook_client_id
          }, {
            "name": "CAMPAIGN_TITLE",
            "content": codeObject.title
          }, {
            "name": "WECODE",
            "content": codeObject.code_text
          }, {
            "name": "GOAL",
            "content": user.currency_symbol + numeral(codeObject.goal).format('0,0')
          }, {
            "name": "PEER_URL",
            "content": props.domain + "/features/peer-to-peer/"
          }, {
            "name": "GROUP_URL",
            "content": props.domain + "/features/groups/"
          }, {
            "name": "WIDGETS_FEATURE",
            "content": props.domain + "/features/widgets/"
          }, {
            "name": "CAMPAIGN_WIDGETS_URL",
            "content": props.domain + "/features/widgets?slug=" + codeObject.code_text
          }];

          utility.mandrillTemplate(mandrilObject, function(err, data) {
            if (err) {
              console.log("Error in sending success email for campaign creationerror in drip");
              console.log(err);
              utility.nodeLogs('error', {
                message: 'Error in sending email to thank you message'
              });
              callback(err, null);
            } else {
              utility.nodeLogs('INFO', {
                message: 'Thank you email sent successfully'
              });
              callback(null, "mail send successfully");
            }
          });
        } else {
          callback({
            message: 'User id not found in the database wich is send by code object',
            codeObject: codeObject
          }, null);
        }
        //callback(null,result);
      }
    });
  } catch (err) {
    callback(null, true);
  }

};

exports.sendThankyouEmailForTeamCampaign = function(codeObject, callback) {

  var mandrilObject = {};
  var user = {};
  var mandrilObject = {};
  var user;
  utility.nodeLogs('INFO', {
    message: ' Comes to sending thank you email for campaign creation'
  });
  mandrilObject.from = props.fromemail;
  mandrilObject.text = "";
  mandrilObject.subject = "Congratulations";
  mandrilObject.template_name = "thank you - peer-to-peer creator";
  mandrilObject.template_content = [{
    "name": "name",
    "content": "*|NAME|*"
  }, {
    "name": "campaignurl",
    "content": "*|CAMPAIGN_URL|*"
  }, {
    "name": "email",
    "content": "*|email|*"
  }, {
    "name": "facebookshare",
    "content": "*|SHARE_FACEBOOK|*"
  }, {
    "name": "loginurl",
    "content": "*|LOGIN_URL|*"
  }, {
    "name": "maincampaignname",
    "content": "*|MAIN_CAMPAIGN_NAME|*"
  }, {
    "name": "campaigntitle",
    "content": "*|CAMPAIGN_TITLE|*"
  }, {
    "name": "facebookclientid",
    "content": "*|FACEBOOK_CLIENT_ID|*"
  }, {
    "name": "widgetsfeature",
    "content": "*|WIDGETS_FEATURE|*"
  }, {
    "name": "campaignwidgeturl",
    "content": "*|CAMPAIGN_WIDGETS_URL|*"
  }];

  excuteQuery.queryForAll(sqlQueryMap['getUserAndCampaign'], [codeObject.user_id, codeObject.parent_id], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', {
        message: 'Error in sql query '
      });
      callback(err, null);
    } else {

      if (result && result[0]) {
        user.name = result[0].name;
        user.email = result[0].email;
        codeObject.main_campaign_name = result[0].main_campaign_name;
        mandrilObject.email = user.email;
        mandrilObject.merge_vars = [{
          "name": "NAME",
          "content": user.name
        }, {
          "name": "CAMPAIGN_URL",
          "content": props.domain + '/' + codeObject.code_text
        }, {
          "name": "email",
          "content": user.email
        }, {
          "name": "LOGIN_URL",
          "content": props.domain + '/login'
        }, {
          "name": 'MAIN_CAMPAIGN_NAME',
          "content": codeObject.main_campaign_name
        }, {
          "name": "SHARE_FACEBOOK",
          "content": "http://facebook.com/dialog/feed?link=" + props.domain + '/' + codeObject.code_text + '&app_id=' + props.facebook_client_id + '&redirect_uri=' + props.domain + '/' + codeObject.code_text
        }, {
          "name": "FACEBOOK_CLIENT_ID",
          "content": props.facebook_client_id
        }, {
          "name": "CAMPAIGN_TITLE",
          "content": codeObject.title
        }, {
          "name": "WIDGETS_FEATURE",
          "content": props.domain + "/features/widgets/"
        }, {
          "name": "CAMPAIGN_WIDGETS_URL",
          "content": props.domain + "/features/widgets?slug=" + codeObject.code_text
        }];
        utility.mandrillTemplate(mandrilObject, function(err, data) {
          if (err) {
            utility.nodeLogs('error', {
              message: 'Error in sending email to thank you message'
            });
            callback(err, null);
          } else {
            utility.nodeLogs('INFO', {
              message: 'Thank you email sent successfully'
            });
            callback(null, "mail send successfully");
          }
        });
      } else {
        callback({
          message: 'User id not found in the database wich is send by code object',
          codeObject: codeObject
        }, null);
      }
      //callback(null,result);
    }
  });
};

//Getting intercome userid by using mysql database user_id


exports.checkCampaignsVideoStatus = function(data, callback) {
  try {
    var me = this;
    excuteQuery.queryForAll(sqlQueryMap['getVideoNotUploadedCampaigns'], [48, 72], function(err, result) {
      if (err) {

        utility.nodeLogs('ERROR', {
          message: 'Error in reading campaign which are not uploaded videos'
        });
      } else {
        utility.nodeLogs('INFO', {
          message: 'After getting the emails'
        });
        if (result && result.length) {
          me.sendUploadVideoMails(result, function(err, result) {
            callback(null, {
              message: 'Successfully send emails'
            });
          });
        } else {
          callback(null, {
            message: 'No campaign found without video'
          });
        }
      }
    });
  } catch (err) {
    callback(err, null);
  }
};


exports.sendUploadVideoMails = function(codeObjects, callback) {
  async.each(codeObjects, function(codeObject, eachCallback) {
    var mandrilObject = {};
    mandrilObject.from = props.fromemail;
    mandrilObject.text = "";
    mandrilObject.subject = "Upload a video";
    mandrilObject.template_name = "upload a video";
    if (codeObject.user_id) {
      excuteQuery.queryForAll(sqlQueryMap['getUserProfile'], [codeObject.user_id], function(err, result) {
        if (err) {
          utility.nodeLogs('ERROR', {
            message: 'Error in sending upload video email ',
            codeObject: codeObject
          });
          eachCallback(null);
        } else {
          if (result && result[0]) {
            codeObject.user_email = result[0].email;
            codeObject.user_name = result[0].name;
            mandrilObject.email = codeObject.user_email;
            mandrilObject.template_content = [{
              "name": "name",
              "content": "*|NAME|*"
            }, {
              "name": "campaignurl",
              "content": "*|CAMPAIGN_URL|*"
            }, {
              "name": "email",
              "content": "*|email|*"
            }, {
              "name": "campaigntitle",
              "content": "*|CAMPAIGN_TITLE|*"
            }, {
              "name": "loginurl",
              "content": "*|LOGIN_URL|*"
            }, {
              "name": "facebookclientid",
              "content": "FACEBOOK_CLIENT_ID"
            }, {
              "name": "widgetsfeature",
              "content": "*|WIDGETS_FEATURE|*"
            }, {
              "name": "campaignwidgeturl",
              "content": "*|CAMPAIGN_WIDGETS_URL|*"
            }];

            mandrilObject.merge_vars = [{
              "name": "NAME",
              "content": codeObject.user_name
            }, {
              "name": "CAMPAIGN_URL",
              "content": props.domain + '/' + codeObject.code_text
            }, {
              "name": "email",
              "content": codeObject.user_email
            }, {
              "name": "LOGIN_URL",
              "content": props.domain + '/login'
            }, {
              "name": "CAMPAIGN_TITLE",
              "content": codeObject.title
            }, {
              "name": "FACEBOOK_CLIENT_ID",
              "content": props.facebook_client_id
            }, {
              "name": "WIDGETS_FEATURE",
              "content": props.domain + "/features/widgets/"
            }, {
              "name": "CAMPAIGN_WIDGETS_URL",
              "content": props.domain + "/features/widgets?slug=" + codeObject.code_text
            }];

            utility.mandrillTemplate(mandrilObject, function(err, result) {
              if (err) {
                utility.nodeLogs('ERROR', {
                  message: 'Added error objects '
                });
                eachCallback(null);
              } else {
                utility.nodeLogs('INFO', {
                  message: 'Successfully send email',
                  result: result
                });
                eachCallback(null);
              }
            });
          } else {
            eachCallback(null);
          }
        }
      });
    } else {
      eachCallback(null);
    }
  }, function(err) {
    callback(null, null);
  });
};


exports.getCampaignsNoPeerToPeer = function(data, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['getCampaignsNoPeerToPeer'], [72, 96], function(err, result) {
    if (err) {
      console.log(err);
      utility.nodeLogs('ERROR', {
        message: 'Error in getting campaign which do not have peer to peer campaigns'
      });
    } else {
      if (result && result.length) {
        me.sendPeerToPeerCampaignEmails(result, function(err, result) {
          callback(null, {
            message: 'Successfully sent emails to peer to peer camaigns'
          });
        });
      } else {
        callback(null, {
          message: 'No campaign found without peer to peer campaign '
        });
        utility.nodeLogs('INFO', {
          message: 'No campaign found without peer to peer campaign '
        });
      }
    }
  });
};



exports.sendPeerToPeerCampaignEmails = function(codeObjects, callback) {
  async.each(codeObjects, function(codeObject, eachCallback) {
    var mandrilObject = {};
    mandrilObject.from = props.fromemail;
    mandrilObject.text = "";
    mandrilObject.subject = "Get peer-to-peer fundraisers";
    mandrilObject.template_name = "get peer-to-peer fundraisers";
    if (codeObject.user_id) {
      excuteQuery.queryForAll(sqlQueryMap['getUserProfile'], [codeObject.user_id], function(err, result) {
        if (err) {
          utility.nodeLogs('ERROR', {
            message: 'Error in sending create peer-to-peer campaign email',
            codeObject: codeObject
          });
          eachCallback();
        } else {
          if (result && result[0]) {
            codeObject.user_email = result[0].email;
            codeObject.user_name = result[0].name;
            mandrilObject.email = codeObject.user_email;
            mandrilObject.template_content = [{
              "name": "name",
              "content": "*|NAME|*"
            }, {
              "name": "campaignurl",
              "content": "*|CAMPAIGN_URL|*"
            }, {
              "name": "email",
              "content": "*|email|*"
            }, {
              "name": "campaigntitle",
              "content": "*|CAMPAIGN_TITLE|*"
            }, {
              "name": "loginurl",
              "content": "*|LOGIN_URL|*"
            }, {
              "name": "facebookclientid",
              "content": "*|FACEBOOK_CLIENT_ID|*"
            }, {
              "name": "widgetsfeature",
              "content": "*|WIDGETS_FEATURE|*"
            }, {
              "name": "campaignwidgeturl",
              "content": "*|CAMPAIGN_WIDGETS_URL|*"
            }];
            mandrilObject.merge_vars = [{
              "name": "NAME",
              "content": codeObject.user_name
            }, {
              "name": "CAMPAIGN_URL",
              "content": props.domain + '/' + codeObject.code_text
            }, {
              "name": "email",
              "content": codeObject.user_email
            }, {
              "name": "LOGIN_URL",
              "content": props.domain + '/login'
            }, {
              "name": "CAMPAIGN_TITLE",
              "content": codeObject.title
            }, {
              "name": "FACEBOOK_CLIENT_ID",
              "content": props.facebook_client_id
            }, {
              "name": "WIDGETS_FEATURE",
              "content": props.domain + "/features/widgets/"
            }, {
              "name": "CAMPAIGN_WIDGETS_URL",
              "content": props.domain + "/features/widgets?slug=" + codeObject.code_text
            }];

            utility.mandrillTemplate(mandrilObject, function(err, result) {
              if (err) {
                utility.nodeLogs('ERROR', {
                  message: 'Error in sending peer to peer campaign motivation email',
                  error: err
                });
                eachCallback();
              } else {
                eachCallback();
                utility.nodeLogs('INFO', {
                  message: 'Successfully send email for user to motivate peer-to-peer campaign',
                  user_id: codeObject.user_id,
                  result: result
                });
              }
            });
          } else {
            utility.nodeLogs('ERROR', {
              message: 'No records found with user id ',
              codeObject: codeObject
            });
            eachCallback(null);
          }
        }
      });
    } else {
      eachCallback(null);
    }
  }, function(err) {
    callback(null, null);
  });

};


exports.getNextDayCampaigns = function(data, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['getNextDayCampaigns'], [24, 48], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', {
        message: 'Error in sending email for next day campaigns',
        error: err
      });
    } else {
      utility.nodeLogs('INFO', {
        message: 'Successfully sent emails for next day'
      });
      me.sendNextDayEmailsToCampaigns(result, function(err, result) {
        if (err) {
          utility.nodeLogs('ERROR', {
            message: 'Error in sending next day emails'
          });
        } else {
          utility.nodeLogs('ERROR', {
            message: 'Successfully sent next day emails'
          });
        }
        callback(null, true);
      });
    }
  });
};

exports.sendNextDayEmailsToCampaigns = function(codeObjects, callback) {

  async.each(codeObjects, function(codeObject, eachCallback) {
    var mandrilObject = {};
    mandrilObject.from = props.fromemail;
    mandrilObject.text = "";
    mandrilObject.subject = "Share fundraiser";
    mandrilObject.template_name = "next day email";
    excuteQuery.queryForAll(sqlQueryMap['getUserProfile'], [codeObject.user_id], function(err, result) {
      if (err) {
        utility.nodeLogs('ERROR', {
          message: 'Error in getting user details for the campaign'
        });
        eachCallback();
      } else {
        if (result && result[0]) {
          codeObject.user_email = result[0].email;
          codeObject.user_name = result[0].name;
          mandrilObject.email = codeObject.user_email;
          mandrilObject.template_content = [{
            "name": "name",
            "content": "*|NAME|*"
          }, {
            "name": "campaignurl",
            "content": "*|CAMPAIGN_URL|*"
          }, {
            "name": "email",
            "content": "*|email|*"
          }, {
            "name": "campaigntitle",
            "content": "*|CAMPAIGN_TITLE|*"
          }, {
            "name": "loginurl",
            "content": "*|LOGIN_URL|*"
          }, {
            "name": "facebookshare",
            "content": "*|FACEBOOK_SHARE|*"
          }, {
            "name": "twittershare",
            "content": "*|TWITTER_SHARE|*"
          }, {
            "name": "facebookclientid",
            "content": "*|FACEBOOK_CLIENT_ID|*"
          }, {
            "name": "groupurl",
            "content": "*|GROUP_URL|*"
          }];

          mandrilObject.merge_vars = [{
            "name": "NAME",
            "content": codeObject.user_name
          }, {
            "name": "CAMPAIGN_URL",
            "content": props.domain + '/' + codeObject.code_text
          }, {
            "name": "email",
            "content": codeObject.user_email
          }, {
            "name": "LOGIN_URL",
            "content": props.domain + '/login'
          }, {
            "name": "CAMPAIGN_TITLE",
            "content": codeObject.title
          }, {
            "name": "FACEBOOK_SHARE",
            "content": "http://facebook.com/dialog/feed?link=" + props.domain + '/' + codeObject.code_text + '&app_id=' + props.facebook_client_id + '&redirect_uri=' + props.domain + '/' + codeObject.code_text
          }, {
            "name": "TWITTER_SHARE",
            "content": "https://twitter.com/intent/tweet?text=" + codeObject.title + ": " + props.domain + '/' + codeObject.code_text
          }, {
            "name": "FACEBOOK_CLIENT_ID",
            "content": props.facebook_client_id
          }, {
            "name": "GROUP_URL",
            "content": props.domain + "/features/groups/"
          }];
          utility.mandrillTemplate(mandrilObject, function(err, result) {
            if (err) {
              utility.nodeLogs('ERROR', {
                message: 'Error in sending next day emails',
                error: err
              });
              eachCallback(null);
            } else {
              eachCallback(null);
              utility.nodeLogs('INFO', {
                message: 'Successfully send next day email for campaign',
                user_id: codeObject.user_id,
                result: result
              });
            }
          });
        } else {
          utility.nodeLogs('ERROR', {
            message: 'No user found for code ',
            codeObject: codeObject
          });
          eachCallback(null);
        }
      }
    });
  }, function(err) {
    callback();
  });
};

exports.sendWeeklyProgressToCampaigns = function(data, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['getWeeklyCampaigns'], [], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', {
        error: err,
        message: 'Sql query error in get weekly campaigns'
      });
      callback(err, null);
    } else {

      if (result && result.length) {
        me.sendWeeklyProgressEmails(result, function(err, result) {
          callback(null, {
            message: 'Successfully sent emails'
          });
        });
      } else {
        utility.nodeLogs('INFO', {
          message: 'Added'
        });
        callback(null, {
          message: 'No weekly campaigns found'
        });
      }
    }
  });
};

exports.sendWeeklyToOwnerAndAdminsForSevenDays = function(data, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['getCampaignOwnersAndAdmins'], [7, 7], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', {
        message: 'Sql query error in get weekly Admin Owners'
      });
      callback(err, null);
    } else {
      if (result && result.length) {
        me.sendWeeklyProgressEmailsToOwnerAndAdminsForSevenDays(result, function(err, result) {
          callback(null, {
            message: 'successfully sent emails'
          });
        });
      } else {
        utility.nodeLogs('INFO', {
          message: 'Added'
        });
        callback(null, {
          message: 'No weekly Admins and owners Found'
        });
      }
    }
  });
};

exports.sendWeeklyProgressEmailsToOwnerAndAdminsForSevenDays = function(codeObjects, callback) {
  async.each(codeObjects, function(codeObject, eachCallback) {
    console.log("getting mail");
    console.log(codeObject);
    var mandrilObject = {};
    mandrilObject.from = props.fromemail;
    mandrilObject.text = "";
    mandrilObject.subject = "Please confirm your details with WePay";
    mandrilObject.email = codeObjects.email;
    mandrilObject.template_name = "Wepay status report campaign owner";
    mandrilObject.template_content = [{
      "name": "Campaign Name",
      "content": "*|CAMPAIGNNAME|*"
    }, {
      "name": "name",
      "content": "*|NAME|*"
    }, {
      "name": "beneficiary",
      "content": "*|BENEFICIARY|*"
    }, {
      "name": "Email",
      "content": "*|EMAIL|*"
    }, {
      "name": "Phone Number",
      "content": "*|PHONE|*"
    }, {
      "name": "currentyear",
      "content": "*|CURRENT_YEAR|*"
    }, {
      "name": "web_url",
      "content": "*|web_url|*"
    }];
    mandrilObject.merge_vars = [{
      "name": "CAMPAIGNNAME",
      "content": codeObject.Campaign_Name
    }, {
      "name": "NAME",
      "content": codeObject.name
    }, {
      "name": "BENEFICIARY",
      "content": codeObject.beneficiary
    }, {
      "name": "EMAIL",
      "content": codeObject.email
    }, {
      "name": "PHONE",
      "content": codeObject.phone || 'N/A'
    }, {
      "name": "CURRENT_YEAR",
      "content": moment.utc().year()
    }, {
      "name": "web_url",
      "content": props.domain
    }];
    utility.mandrillTemplate(mandrilObject, function(err, result) {
      if (err) {
        eachCallback(null);
        utility.nodeLogs('ERROR', {
          message: 'Error in sending weekly progress email',
          error: err
        });
      } else {
        eachCallback(null);
        utility.nodeLogs('INFO', {
          message: 'Successfully sent weekly proress email for user',
          user_id: codeObject.user_id,
          result: result
        });
      }
    });

  }, function(err) {
    utility.nodeLogs({
      message: 'Successfully send wepay alert email to campaign owners and admins'
    });
    callback(null, {
      success: true
    });
  });

};

exports.sendWeeklyToOwnerAndAdminsForTenDays = function(data, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['getCampaignOwnersAndAdmins'], [10, 10], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', {
        message: 'Sql query error in get weekly Admin Owners'
      });
      callback(err, null);
    } else {
      if (result && result.length) {
        me.sendWeeklyProgressEmailsToOwnerAndAdminsForTenDays(result, function(err, result) {
          callback(null, {
            message: 'successfully sent emails'
          });
        });
      } else {
        utility.nodeLogs('INFO', {
          message: 'Added'
        });
        callback(null, {
          message: 'No weekly Admins and Owners Found'
        });
      }
    }
  });
};

exports.sendWeeklyProgressEmailsToOwnerAndAdminsForTenDays = function(codeObjects, callback) {
  async.each(codeObjects, function(codeObject, eachCallback) {
    console.log("getting mail");
    console.log(codeObject);
    var mandrilObject = {};
    mandrilObject.from = props.fromemail;
    mandrilObject.text = "";
    mandrilObject.subject = "Please confirm your details with WePay";
    mandrilObject.email = codeObjects.email;
    mandrilObject.template_name = "Wepay status report campaign owner";
    mandrilObject.template_content = [{
      "name": "Campaign Name",
      "content": "*|CAMPAIGNNAME|*"
    }, {
      "name": "name",
      "content": "*|NAME|*"
    }, {
      "name": "title",
      "content": "*|TITLE|*"
    }, {
      "name": "Email",
      "content": "*|EMAIL|*"
    }, {
      "name": "Phone Number",
      "content": "*|PHONE|*"
    }, {
      "name": "currentyear",
      "content": "*|CURRENT_YEAR|*"
    }, {
      "name": "web_url",
      "content": "*|web_url|*"
    }];
    mandrilObject.merge_vars = [{
      "name": "CAMPAIGNNAME",
      "content": codeObject.Campaign_Name
    }, {
      "name": "NAME",
      "content": codeObject.name
    }, {
      "name": "TITLE",
      "content": codeObject.title
    }, {
      "name": "EMAIL",
      "content": codeObject.email
    }, {
      "name": "PHONE",
      "content": codeObject.phone || 'N/A'
    }, {
      "name": "CURRENT_YEAR",
      "content": moment.utc().year()
    }, {
      "name": "web_url",
      "content": props.domain
    }];
    utility.mandrillTemplate(mandrilObject, function(err, result) {
      if (err) {
        eachCallback(null);
        utility.nodeLogs('ERROR', {
          message: 'Error in sending weekly progress email',
          error: err
        });
      } else {
        eachCallback(null);
        utility.nodeLogs('INFO', {
          message: 'Successfully sent weekly proress email for user',
          user_id: codeObject.user_id,
          result: result
        });
      }
    });

  }, function(err) {
    utility.nodeLogs({
      message: 'Successfully send wepay alert email to campaign owners and admins'
    });
    callback(null, {
      success: true
    });
  });

};

// exports.sendWeeklyToUsersForSevenDays = function(data, callback) {
//   var me = this;
//   excuteQuery.queryForAll(sqlQueryMap['getCampaignOwnersForSevenDays'], [], function(err, result) {
//     if (err) {
//       utility.nodeLogs('ERROR', { message: 'Sql query error in get weekly users' });
//       callback(err, null);
//     } else {
//       console.log('No of user to lenght', result.length);
//       if (result && result.length) {
//         me.sendWeeklyProgressEmailsToUsersForSevenDays(result, function(err, result) {
//           callback(null, { message: 'successfully sent emails' });
//         });
//       } else {
//         utility.nodeLogs('INFO', { message: 'Added' });
//         callback(null, { message: 'No weekly users Found' });
//       }
//     }
//   });

// };

// exports.sendWeeklyProgressEmailsToUsersForSevenDays = function(codeObjects, callback) {
//   async.each(codeObjects, function(codeObject, eachCallback) {
//     var mandrilObject = {};
//     mandrilObject.from = props.fromemail;
//     mandrilObject.text = "";
//     mandrilObject.subject = "Activate Wepay account";
//     mandrilObject.email = "kandepu.deepthi127@gmail.com";
//     mandrilObject.template_name = "Wepay status report campaign owner";
//     mandrilObject.template_content = [{
//       "name": "Campaign Name",
//       "content": "*|CAMPAIGNNAME|*"
//     }, {
//       "name": "name",
//       "content": "*|NAME|*"
//     }, {
//       "name": "title",
//       "content": "*|TITLE|*"
//     }, {
//       "name": "Email",
//       "content": "*|EMAIL|*"
//     }, {
//       "name": "Phone Number",
//       "content": "*|PHONE|*"
//     }, {
//       "name": "currentyear",
//       "content": "*|CURRENT_YEAR|*"
//     }, {
//       "name": "web_url",
//       "content": "*|web_url|*"
//     }];
//     mandrilObject.merge_vars = [{
//       "name": "CAMPAIGNNAME",
//       "content": codeObject.Campaign_Name
//     }, {
//       "name": "NAME",
//       "content": codeObject.name
//     }, {
//       "name": "TITLE",
//       "content": codeObject.title
//     }, {
//       "name": "EMAIL",
//       "content": codeObject.email
//     }, {
//       "name": "PHONE",
//       "content": codeObject.phone || 'N/A'
//     }, {
//       "name": "CURRENT_YEAR",
//       "content": moment.utc().year()
//     }, {
//       "name": "web_url",
//       "content": props.domain
//     }];


//     utility.mandrillTemplate(mandrilObject, function(err, result) {
//       if (err) {
//         eachCallback(null);
//         utility.nodeLogs('ERROR', { message: 'Error in sending weekly progress email', error: err });
//       } else {
//         console.log(codeObject.email, 'mail success');
//         eachCallback(null);
//         utility.nodeLogs('INFO', {
//           message: 'Successfully sent weekly proress email for user',
//           user_id: codeObject.user_id,
//           result: result
//         });
//       }
//     });
//   }, function(err) {
//     //eachCallback
//     callback(null, { message: 'Emails send successfully' });
//   });

// };

// exports.sendWeeklyToUsersForTenDays = function(data, callback) {
//   var me = this;
//   excuteQuery.queryForAll(sqlQueryMap['getCampaignOwnersForTenDays'], [], function(err, result) {
//     if (err) {
//       utility.nodeLogs('ERROR', { message: 'Sql query error in get weekly users' });
//       callback(err, null);
//     } else {
//       console.log('No of user to lenght', result.length);
//       if (result && result.length) {
//         me.sendWeeklyProgressEmailsToUsersForTenDays(result, function(err, result) {
//           callback(null, { message: 'successfully sent emails' });
//         });
//       } else {
//         utility.nodeLogs('INFO', { message: 'Added' });
//         callback(null, { message: 'No weekly users Found' });
//       }
//     }
//   });

// };
// exports.sendWeeklyProgressEmailsToUsersForTenDays = function(codeObjects, callback) {
//   async.each(codeObjects, function(codeObject, eachCallback) {
//     var mandrilObject = {};
//     mandrilObject.from = props.fromemail;
//     mandrilObject.text = "";
//     mandrilObject.subject = "Activate Wepay account";
//     mandrilObject.email = "kandepu.deepthi127@gmail.com";
//     mandrilObject.template_name = "Wepay status report campaign owner";
//     mandrilObject.template_content = [{
//       "name": "Campaign Name",
//       "content": "*|CAMPAIGNNAME|*"
//     }, {
//       "name": "name",
//       "content": "*|NAME|*"
//     }, {
//       "name": "title",
//       "content": "*|TITLE|*"
//     }, {
//       "name": "Email",
//       "content": "*|EMAIL|*"
//     }, {
//       "name": "Phone Number",
//       "content": "*|PHONE|*"
//     }, {
//       "name": "currentyear",
//       "content": "*|CURRENT_YEAR|*"
//     }, {
//       "name": "web_url",
//       "content": "*|web_url|*"
//     }];
//     mandrilObject.merge_vars = [{
//       "name": "CAMPAIGNNAME",
//       "content": codeObject.Campaign_Name
//     }, {
//       "name": "NAME",
//       "content": codeObject.name
//     }, {
//       "name": "TITLE",
//       "content": codeObject.title
//     }, {
//       "name": "EMAIL",
//       "content": codeObject.email
//     }, {
//       "name": "PHONE",
//       "content": codeObject.phone || 'N/A'
//     }, {
//       "name": "CURRENT_YEAR",
//       "content": moment.utc().year()
//     }, {
//       "name": "web_url",
//       "content": props.domain
//     }];


//     utility.mandrillTemplate(mandrilObject, function(err, result) {
//       if (err) {
//         eachCallback(null);
//         utility.nodeLogs('ERROR', { message: 'Error in sending weekly progress email', error: err });
//       } else {
//         console.log(codeObject.email, 'mail success');
//         eachCallback(null);
//         utility.nodeLogs('INFO', {
//           message: 'Successfully sent weekly proress email for user',
//           user_id: codeObject.user_id,
//           result: result
//         });
//       }
//     });
//   }, function(err) {
//     //eachCallback
//     callback(null, { message: 'Emails send successfully' });
//   });

// };

exports.sendWeeklyEmailToWonderAdminsForSevenDays = function(data, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['getActionRequiredCampaigns'], [], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', {
        message: 'Sql query error in get weekly Admin Owners'
      });
      callback(err, null);
    } else {
      console.log(result);
      if (result && result.length) {
        me.sendWeeklyProgressEmailsToWonderAdminsForSevenDays(result, function(err, result3) {
          callback(null, {
            message: 'successfully sent emails'
          });
        });
      } else {
        utility.nodeLogs('INFO', {
          message: 'Added'
        });
        callback(null, {
          message: 'No weekly campaigns And Admins Found'
        });
      }
    }
  });
};
exports.sendWeeklyProgressEmailsToWonderAdminsForSevenDays = function(campaigns, callback) {
  var codeObjects = {};
  codeObjects.layout = 'mailtemplate';
  codeObjects.domain = props.domain;
  // codeObjects.domain = ca
  codeObjects.campaigns = campaigns;

  app.render('./pages/campaignstats', codeObjects, function(err, html) {
    var emails = underscore.compact(underscore.pluck(codeObjects.admins, 'email'));


    //Get all the emails of admins to: individualEmail,in the format of string with coma separated

    var mailOptions = {
      from: props.fromemail, // sender address
      to: props.adminEmails.emails, // list of receivers obj.admins.toString
      cc: props.adminEmails.cc,
      subject: 'Campaigns need to be activated in WePay', // Subject line
      text: '', // plaintext body
      html: html // html body
    };
    mail.sendEmail(mailOptions, function(err, result) {
      if (err) {
        callback(err, null);
      } else {
        console.log('7days campaign stats email sent successfully');
        callback(null, result);
      }
    });
  });

}

exports.sendWeeklyEmailToWonderAdminsForTenDays = function(data, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['getCampaignOwnersAndAdmins'], [10, 10], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', {
        message: 'Sql query error in get weekly Admin Owners'
      });
      callback(err, null);
    } else {
      if (result && result.length) {
        excuteQuery.queryForAll(sqlQueryMap['getWonderAdmins'], [], function(err, adminResults) {
          var obj = {};
          obj.campaigns = result;
          obj.admins = adminResults;

          me.sendWeeklyProgressEmailsToWonderAdminsForTenDays(obj, function(err, result3) {
            callback(null, {
              message: 'successfully sent emails'
            });
          });
        });
      } else {
        utility.nodeLogs('INFO', {
          message: 'Added'
        });
        callback(null, {
          message: 'No weekly Owners And Admins Found'
        });
      }
    }
  });
};
exports.sendWeeklyProgressEmailsToWonderAdminsForTenDays = function(codeObjects, callback) {
  codeObjects.layout = 'mailtemplate';
  codeObjects.domain = props.domain;
  // codeObjects.domain = ca
  console.log(codeObjects);

  app.render('./pages/campaignstats', codeObjects, function(err, html) {

    console.log(err);
    console.log(codeObjects.admins);
    var emails = underscore.compact(underscore.pluck(codeObjects.admins, 'email'));
    console.log(emails);
    async.each(emails, function(individualEmail, eachCallback) {

      //Get all the emails of admins to: individualEmail,in the format of string with coma separated
      console.log(emails);
      console.log(html);
      var mailOptions = {
        from: props.fromemail, // sender address
        to: individualEmail, // list of receivers obj.admins.toString
        subject: 'Campaigns need to be activated in WePay', // Subject line
        text: '', // plaintext body
        html: html // html body
      };
      console.log(html);
      mail.sendEmail(mailOptions, function(err, result) {
        console.log(err);
        console.log(result);
        if (err) {
          eachCallback(null);
        } else {
          console.log('10days campaign stats email sent successfully');
          eachCallback(null);
        }
      });
      //  eachCallback();
      // callback(null, result);
    }, function(err) {

      callback(err, null)
    });
  });

}

// exports.sendWeeklyEmailToWonderAdminsForTenDays = function(data, call) {
//   var me = this;
//   excuteQuery.queryForAll(sqlQueryMap[''], [], function(err, result) {
//     if (err) {
//       utility.nodeLogs('ERROR', { message: 'Sql query error in get weekly Admin Owners' });
//       callback(err, null);
//     } else {
//       if (result && result.length) {
//         me.sendWeeklyProgressEmailsToWonderAdminsForTenDays(result, function(err, result) {
//           callback(null, { message: 'successfully sent emails' });
//         });
//       } else {
//         utility.nodeLogs('INFO', { message: 'Added' });
//         callback(null, { message: 'No weekly Admins Found' });
//       }
//     }
//   });
// };
// exports.sendWeeklyProgressEmailsToWonderAdminsForTenDays = function(codeObjects, callback) {
//   async.each(codeObjects, function(codeObject, eachCallback) {
//     var mandrilObject = {};
//     mandrilObject.from = props.fromemail;
//     mandrilObject.text = "";
//     mandrilObject.subject = "Activate Wepay account";
//     mandrilObject.email = "kandepu.deepthi127@gmail.com";
//     mandrilObject.template_name = "";
//     mandrilObject.template_content = [{

//     }];
//     mandrilObject.merge_vars = [{

//     }];


//     utility.mandrillTemplate(mandrilObject, function(err, result) {
//       if (err) {
//         eachCallback(null);
//         utility.nodeLogs('ERROR', { message: 'Error in sending weekly progress email', error: err });
//       } else {
//         console.log(codeObject.email, 'mail success');
//         eachCallback(null);
//         utility.nodeLogs('INFO', {
//           message: 'Successfully sent weekly proress email for user',
//           user_id: codeObject.user_id,
//           result: result
//         });
//       }
//     });
//   }, function(err) {
//     //eachCallback
//     callback(null, { message: 'Emails send successfully' });
//   });

// };


exports.sendWeeklyProgressEmails = function(codeObjects, callback) {

  async.each(codeObjects, function(codeObject, eachCallback) {
    var mandrilObject = {};
    mandrilObject.from = props.fromemail;
    mandrilObject.text = "";
    mandrilObject.subject = "Weekly progress for " + codeObject.title;
    mandrilObject.template_name = "weekly progress";
    mandrilObject.template_content = [{
      "name": "name",
      "content": "*|NAME|*"
    }, {
      "name": "campaignurl",
      "content": "*|CAMPAIGN_URL|*"
    }, {
      "name": "email",
      "content": "*|email|*"
    }, {
      "name": "campaigntitle",
      "content": "*|CAMPAIGN_TITLE|*"
    }, {
      "name": "loginurl",
      "content": "*|LOGIN_URL|*"
    }, {
      "name": "facebookshare",
      "content": "*|FACEBOOK_SHARE|*"
    }, {
      "name": "twittershare",
      "content": "*|TWITTER_SHARE|*"
    }, {
      "name": "thisweekcount",
      "content": "*|THIS_WEEK_COUNT|*"
    }, {
      "name": "thisweekraised",
      "content": "*|THIS_WEEK_RAISED|*"
    }, {
      "name": "thisweekdayavg",
      "content": "*|THIS_WEEK_DAY_AVG|*"
    }, {
      "name": "thisweekpercent",
      "content": "*|THIS_WEEK_PERCENT|*"
    }, {
      "name": "beneficiary",
      "content": "*|BENEFICIARY|*"
    }, {
      "name": "createddate",
      "content": "*|CREATED_DATE|*"
    }, {
      "name": "numberofdays",
      "content": "*|NUMBER_OF_DAYS|*"
    }, {
      "name": "campaigngoal",
      "content": "*|CAMPAIGN_GOAL|*"
    }, {
      "name": "amountraised",
      "content": "*|AMOUNT_RAISED|*"
    }, {
      "name": "campaignpercent",
      "content": "*|CAMPAIGN_PERCENT|*"
    }, {
      "name": "facebookclientid",
      "content": "*|FACEBOOK_CLIENT_ID|*"
    }, {
      "name": "currencysymbol",
      "content": "*|CURRENCY_SYMBOL|*"
    }];

    excuteQuery.queryForAll(sqlQueryMap['getCampaignInfo'], [codeObject.code_id], function(err, result) {
      if (err) {
        console.log(err);
        eachCallback(err, null);
      } else {

        if (result && result[0]) {

          var sentemail = true;
          if (codeObject.this_week_raised === 0) {
            if (codeObject.transaction_date) {
              var noofweeks = moment(moment.utc().toDate()).diff(codeObject.transaction_date, 'weeks');
            } else if (codeObject.date_created) {
              var noofweeks = moment(moment.utc().toDate()).diff(codeObject.date_created, 'weeks');

            }
            if (noofweeks > 8) {
              sentemail = false;
            } else {
              sentemail = true;
            }
          }
          mandrilObject.merge_vars = [{
            "name": "NAME",
            "content": codeObject.user_name
          }, {
            "name": "CAMPAIGN_URL",
            "content": props.domain + '/' + codeObject.code_text
          }, {
            "name": "email",
            "content": codeObject.user_email
          }, {
            "name": "LOGIN_URL",
            "content": props.domain + '/login'
          }, {
            "name": "CAMPAIGN_TITLE",
            "content": codeObject.title
          }, {
            "name": "FACEBOOK_SHARE",
            "content": "http://facebook.com/dialog/feed?link=" + props.domain + '/' + codeObject.code_text + '&app_id=' + props.facebook_client_id + '&redirect_uri=' + props.domain + '/' + codeObject.code_text
          }, {
            "name": "TWITTER_SHARE",
            "content": "https://twitter.com/intent/tweet?text=" + codeObject.title + ": " + props.domain + '/' + codeObject.code_text
          }, {
            "name": "THIS_WEEK_COUNT",
            "content": codeObject.this_week_count
          }, {
            "name": "THIS_WEEK_RAISED",
            "content": codeObject.currency_symbol + numeral(codeObject.this_week_raised).format('0,0.00') //codeObject.this_week_raised
          }, {
            "name": "THIS_WEEK_PERCENT",
            "content": numeral(codeObject.this_week_percentage).format('0,0.00') + "%"
          }, {
            "name": "THIS_WEEK_DAY_AVG",
            "content": codeObject.currency_symbol + numeral(codeObject.this_week_day_avg).format('0,0.00')
          }, {
            "name": "BENEFICIARY",
            "content": result[0].beneficiary
          }, {
            "name": "CREATED_DATE",
            "content": result[0].created_date
          }, {
            "name": "NUMBER_OF_DAYS",
            "content": result[0].number_of_days
          }, {
            "name": "CAMPAIGN_GOAL",
            "content": codeObject.currency_symbol + numeral(result[0].campaign_goal).format('0,0.00')
          }, {
            "name": "AMOUNT_RAISED",
            "content": codeObject.currency_symbol + numeral(result[0].amount_raised).format('0,0.00')
          }, {
            "name": "CAMPAIGN_PERCENT",
            "content": numeral(result[0].campaign_percent).format('0,0.00') + "%"
          }, {
            "name": "FACEBOOK_CLIENT_ID",
            "content": props.facebook_client_id
          }, {
            "name": "CURRENCY_SYMBOL",
            "content": result[0].currency_symbol
          }];
          mandrilObject.email = codeObject.user_email;
          if (((props.environment_type === 'production') || (codeObject.this_week_raised && props.environment_type === 'qa')) && sentemail) {
            utility.mandrillTemplate(mandrilObject, function(err, result) {
              if (err) {
                eachCallback(null);
                utility.nodeLogs('ERROR', {
                  message: 'Error in sending weekly progress email',
                  error: err
                });
              } else {
                eachCallback(null);
                utility.nodeLogs('INFO', {
                  message: 'Successfully sent weekly proress email for user',
                  user_id: codeObject.user_id,
                  result: result
                });
              }
            });
          } else {
            eachCallback(null, {
              message: 'Qa campaign'
            });
          }
        } else {
          utility.nodeLogs('ERROR', {
            message: 'Campaign info not found for code ',
            codeObject: codeObject
          });
          eachCallback();
        }
      }
    });
  }, function(err) {
    callback(null);
  });
};

exports.sendUpdateCampaignEmail = function(codeObject, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCodeInfoWithUser'], [codeObject.id], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      codeObject.user_profile_picture = result[0].user_profile_picture;
      codeObject.created_user_name = result[0].name;
      codeObject.email = result[0].email;
      codeObject.campaign_creator_name = result[0].campaign_creator_name;
      codeObject.description = result[0].campaign_description;
      codeObject.user_profile_picture = result[0].profile_pic_url;
      excuteQuery.queryForAll(sqlQueryMap['getDonarsOfCampaign'], [codeObject.id], function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          if (result && result.length) {
            async.each(result, function(donar, eachCallback) {
              var mandrilObject = {};
              mandrilObject.from = props.fromemail;
              mandrilObject.text = "";
              mandrilObject.template_name = "campaign update";
              mandrilObject.template_content = [{
                "name": "campaignurl",
                "content": "*|CAMPAIGN_URL|*"
              }, {
                "name": "email",
                "content": "*|email|*"
              }, {
                "name": "campaigntitle",
                "content": "*|CAMPAIGN_TITLE|*"
              }, {
                "name": "campaigncreatorname",
                "content": "*|CAMPAIGN_CREATOR_NAME|*"
              }, {
                "name": "messagedate",
                "content": "*|MESSAGE_DATE|*"
              }, {
                "name": "message",
                "content": "*|MESSAGE|*"
              }, {
                "name": "campaigndescription",
                "content": "*|CAMPAIGN_DESCRIPTION|*"
              }, {
                "name": "currentyear",
                "content": "*|CURRENT_YEAR|*"
              }, {
                "name": "mentioninguserimg",
                "content": "*|MENTIONING_USER_IMG|*"
              }];

              mandrilObject.merge_vars = [{
                "name": "CAMPAIGN_CREATOR_NAME",
                "content": codeObject.campaign_creator_name
              }, {
                "name": "MENTIONING_USER_IMG",
                "content": codeObject.user_profile_picture
              }, {
                "name": "CAMPAIGN_TITLE",
                "content": codeObject.title
              }, {
                "name": "CAMPAIGN_DESCRIPTION",
                "content": codeObject.description
              }, {
                "name": "MESSAGE",
                "content": codeObject.thank_message
              }, {
                "name": "MESSAGE_DATE",
                "content": moment().utc().format('DD-MM-YYYY')
              }, {
                "name": "EMAIL",
                "content": donar.user_email
              }, {
                "name": "CAMPAIGN_URL",
                "content": props.domain + '/' + codeObject.code_text
              }];
              mandrilObject.email = donar.user_email;
              mandrilObject.subject = codeObject.title + ' just posted an update here';
              utility.mandrillTemplate(mandrilObject, function(err, result) {
                if (err) {
                  eachCallback();
                  utility.nodeLogs('ERROR', {
                    message: 'Error in sending weekly progress email',
                    error: err
                  });
                } else {
                  eachCallback();
                  utility.nodeLogs('INFO', {
                    message: 'Successfully sent weekly proress email for user',
                    user_id: codeObject.user_id,
                    result: result
                  });
                }
              });
            }, function(err) {
              callback(null, {
                message: 'Successfully sent result'
              });
            });
          } else {
            utility.nodeLogs('INFO', {
              message: 'There are no donar found for campaign',
              codeObject: codeObject
            });
            callback(null, {
              message: 'Successfully sent email'
            });
          }
        }
      });

    }
  });
};


exports.checkGoalReachedFlagExists = function(code_id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCodeById'], [code_id], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result[0]) {
      if (result[0].goal_reached === 'yes') {
        callback(null, true);
      } else {
        callback(null, false);
      }
    } else {
      callback({
        message: 'Something went wrong'
      }, null);
    }
  });
}

exports.checkCampaignGoalReached = function(data, callback) {
  var me = this;

  excuteQuery.queryForAll(sqlQueryMap['checkCampaignGoalReached'], [data.code_id], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      if (result && result[0]) {
        if (result[0].amount_raised >= result[0].goal_amount) {
          me.checkGoalReachedFlagExists(data.code_id, function(err, exists) {
            if (err) {
              callback(err, null);
            } else {
              if (!exists) {
                //Sending email for all donors for successful campaign
                console.log('In checking all');
                me.sendCampaignGoalReachedEmail(data.code_id, function(err, result) {
                  if (err) {
                    callback(err, null);
                  } else {
                    callback(null, {
                      message: 'Successfully completed campaign goal reached emails'
                    });
                  }
                });
              } else {
                //Sending email for already successfull campaign
                me.sendCampaignSuccessEmail(data, function(err, result) {
                  if (err) {
                    callback(err, null);
                  } else {
                    callback(null, {
                      message: 'Successfully completed campaign goal reached emails'
                    });
                  }
                });
              }
            }
          });

        } else {
          callback(null, {
            message: 'Campaign goal not reached'
          });
        }
      } else {
        callback({
          message: 'Some thing went wrong code id not found in checking campaign goal reached or not',
          codeId: codeId
        }, null);
      }
    }
  });
};


exports.sendCampaignGoalReachedEmail = function(codeId, callback) {
  var codeObject;
  utility.nodeLogs('INFO', {
    message: 'Added send campaign goal reached email'
  });
  excuteQuery.queryForAll(sqlQueryMap['campaignStatus'], [codeId], function(err, result) {
    if (err) {
      callback({
        error: err
      }, null);
    } else {
      if (result && result[0]) {
        codeObject = result[0];
        excuteQuery.queryForAll(sqlQueryMap['getDonarEmailsListCampaigns'], [codeId], function(err, result) {
          if (err) {
            callback(err, null);
          } else if (result && result[0]) {
            async.each(result, function(donar, eachCallback) {
              var mandrilObject = {};
              mandrilObject.from = props.fromemail;
              mandrilObject.text = "";
              mandrilObject.subject = codeObject.campaign_name + " is fully funded";
              mandrilObject.template_name = "fundraiser goal reached";
              mandrilObject.template_content = [{
                "name": "campaignname",
                "content": "*|CAMPAIGN_NAME|*"
              }, {
                "name": "thankmessage",
                "content": "*|THANK_MESSAGE|*"
              }, {
                "name": "campaigncreator",
                "content": "*|CAMPAIGN_CREATOR|*"
              }, {
                "name": "beneficiary",
                "content": "*|BENEFICIARY|*"
              }, {
                "name": "datereached",
                "content": "*|DATE_REACHED|*"
              }, {
                "name": "campaigngoal",
                "content": "*|CAMPAIGN_GOAL|*"
              }, {
                "name": "amountraised",
                "content": "*|AMOUNT_RAISED|*"
              }, {
                "name": "campaigntitle",
                "content": "*|CAMPAIGN_TITLE|*"
              }, {
                "name": "createddate",
                "content": "*|CREATED_DATE|*"
              }, {
                "name": "campaignimage",
                "content": "*|CAMPAIGN_IMAGE|*"
              }, {
                "name": "campaignurl",
                "content": "*|CAMPAIGN_URL|*"
              }];
              mandrilObject.merge_vars = [{
                "name": "CAMPAIGN_NAME",
                "content": codeObject.campaign_name
              }, {
                "name": "THANK_MESSAGE",
                "content": codeObject.thank_message
              }, {
                "name": "CAMPAIGN_CREATOR",
                "content": codeObject.campaign_creator_name
              }, {
                "name": "BENEFICIARY",
                "content": codeObject.beneficiary
              }, {
                "name": "DATE_REACHED",
                "content": moment().utc().format('MM-DD-YYYY')
              }, {
                "name": "CAMPAIGN_GOAL",
                "content": codeObject.currency_symbol + numeral(codeObject.goal_amount).format('0,0')
              }, {
                "name": "AMOUNT_RAISED",
                "content": codeObject.currency_symbol + numeral(codeObject.amount_raised).format('0,0')
              }, {
                "name": "CAMPAIGN_TITLE",
                "content": codeObject.campaign_title
              }, {
                "name": "CREATED_DATE",
                "content": codeObject.created_date
              }, {
                "name": "CAMPAIGN_IMAGE",
                "content": codeObject.campaign_image
              }, {
                "name": "CAMPAIGN_URL",
                "content": props.domain + '/' + codeObject.code_text
              }];
              mandrilObject.email = donar.user_email;

              utility.mandrillTemplate(mandrilObject, function(err, result) {
                if (err) {
                  eachCallback();
                  utility.nodeLogs('ERROR', {
                    message: 'Error in sending campaign goal reached emails',
                    error: err
                  });
                } else {
                  eachCallback();
                  utility.nodeLogs('INFO', {
                    message: 'Successfully sent goal reached email',
                    user_id: donar.user_id,
                    result: result
                  });
                }
              });

            }, function(err) {
              if (err) {
                callback(err, null);
              } else {
                console.log('Before sending update campaign');
                excuteQuery.queryForAll(sqlQueryMap['campaignGoalReached'], ['yes', codeId], function(err, result) {
                  if (err) {
                    console.log(err);
                    utility.nodeLogs('ERROR', {
                      error: err
                    });
                  } else {
                    console.log('In the else');
                    utility.nodeLogs('INFO', {
                      message: 'Successfully set flag goal reached',
                      code_id: codeId
                    });
                  }
                });
                callback(null, {
                  message: 'Successfully send emails'
                });
              }
            });
          } else {
            callback({
              error: 'Not able to find donar list of the campaign'
            }, null);
          }
        });
      } else {
        callback(null, {
          message: 'There is no campaign to reach the goal'
        });
      }
    }
  });
};


exports.getAdminDetails = function(data, callback) {
  intercomeCleint.admins.list(function(err, result) {
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      console.log(result);
      callback(null, result.body);
    }
  });
};


exports.sendCampaignSuccessEmail = function(data, callback) {
  var codeObject;
  try {
    console.log('Data', data);
    excuteQuery.queryForAll(sqlQueryMap['campaignStatus'], [data.code_id], function(err, result) {
      if (err) {
        callback(err, null);
      } else {
        codeObject = result[0];
        excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [data.user_id], function(err, user) {
          if (err) {
            callback(err, null);
          } else {
            var mandrilObject = {};
            mandrilObject.email = user[0].email;
            mandrilObject.from = props.fromemail;
            mandrilObject.text = "";
            mandrilObject.subject = codeObject.campaign_name + " is fully funded";
            mandrilObject.template_name = "fundraiser goal reached";
            mandrilObject.template_content = [{
              "name": "campaignname",
              "content": "*|CAMPAIGN_NAME|*"
            }, {
              "name": "thankmessage",
              "content": "*|THANK_MESSAGE|*"
            }, {
              "name": "campaigncreator",
              "content": "*|CAMPAIGN_CREATOR|*"
            }, {
              "name": "beneficiary",
              "content": "*|BENEFICIARY|*"
            }, {
              "name": "datereached",
              "content": "*|DATE_REACHED|*"
            }, {
              "name": "campaigngoal",
              "content": "*|CAMPAIGN_GOAL|*"
            }, {
              "name": "amountraised",
              "content": "*|AMOUNT_RAISED|*"
            }, {
              "name": "campaigntitle",
              "content": "*|CAMPAIGN_TITLE|*"
            }, {
              "name": "createddate",
              "content": "*|CREATED_DATE|*"
            }, {
              "name": "campaignimage",
              "content": "*|CAMPAIGN_IMAGE|*"
            }, {
              "name": "campaignurl",
              "content": "*|CAMPAIGN_URL|*"
            }];
            mandrilObject.merge_vars = [{
              "name": "CAMPAIGN_NAME",
              "content": codeObject.campaign_name
            }, {
              "name": "THANK_MESSAGE",
              "content": codeObject.thank_message
            }, {
              "name": "CAMPAIGN_CREATOR",
              "content": codeObject.campaign_creator_name
            }, {
              "name": "BENEFICIARY",
              "content": codeObject.beneficiary
            }, {
              "name": "DATE_REACHED",
              "content": moment().utc().format('MM-DD-YYYY')
            }, {
              "name": "CAMPAIGN_GOAL",
              "content": codeObject.currency_symbol + numeral(codeObject.goal_amount).format('0,0')
            }, {
              "name": "AMOUNT_RAISED",
              "content": codeObject.currency_symbol + numeral(codeObject.amount_raised).format('0,0')
            }, {
              "name": "CAMPAIGN_TITLE",
              "content": codeObject.campaign_title
            }, {
              "name": "CREATED_DATE",
              "content": codeObject.created_date
            }, {
              "name": "CAMPAIGN_IMAGE",
              "content": codeObject.campaign_image
            }, {
              "name": "CAMPAIGN_URL",
              "content": props.domain + '/' + codeObject.code_text
            }];
            utility.mandrillTemplate(mandrilObject, function(err, result) {
              if (err) {
                callback(err, null);
                utility.nodeLogs('ERROR', {
                  message: 'Error in sending campaign goal reached emails',
                  error: err
                });
              } else {
                console.log('After sending latest email');

                callback(null, {
                  message: 'Successfully sent email to donor after donations completed'
                });
                utility.nodeLogs('INFO', {
                  message: 'Successfully sent goal reached email',
                  user_id: data.user_id,
                  result: result
                });
              }
            });
          }
        })
      }
    });
  } catch (err) {
    console.log(err);
  }
};

exports.sendTeamApprovalToCampaignOwner = function(codeObject, callback) {
  console.log("codeObject", codeObject);

  excuteQuery.queryForAll(sqlQueryMap['getCampaignOwner'], [codeObject.id], function(err, userObject) {
    if (err) {
      callback(err, null);
    } else {
      if (!codeObject.campaign) {
        codeObject.campaign = null;
      }
      var finalObjectMandril = {};
      finalObjectMandril.from = props.fromsupport;
      finalObjectMandril.email = userObject[0].email;
      finalObjectMandril.text = "";
      finalObjectMandril.subject = "Few more steps to reach more people -- WonderWe.";
      finalObjectMandril.template_name = "campaign promotion email";
      finalObjectMandril.template_content = [{
        "name": "user_name",
        "content": "*|NAME|*"
      }, {
        "email": "user_email",
        "content": "*|email|*"
      }, {
        "name": "campaigntitle",
        "content": "*|CAMPAIGN_TITLE|*"
      }, {
        "name": "facebookclientid",
        "content": "*|FACEBOOK_CLIENT_ID|*"
      }, {
        "name": "campaignurl",
        "content": "*|CAMPAIGN_URL|*"
      }, {
        "name": "peerurl",
        "content": "*|PEER_URL|*"
      }, {
        "name": "teamurl",
        "content": "*|TEAM_URL|*"
      }, {
        "name": 'campaign',
        "content": "*|CAMPAIGN|*"
      }, {
        "name": "campaignimage",
        "content": "*|CAMPAIGN_IMG|*"
      }];

      finalObjectMandril.merge_vars = [{
        "name": "NAME",
        "content": userObject[0].name
      }, {
        "name": "email",
        "content": userObject[0].email
      }, {
        "name": "FACEBOOK_CLIENT_ID",
        "content": props.facebook_client_id
      }, {
        "name": "CAMPAIGN_TITLE",
        "content": userObject[0].title
      }, {
        "name": "CAMPAIGN_URL",
        "content": props.domain + '/' + userObject[0].code_text
      }, {
        "name": "PEER_URL",
        "content": props.domain + "/features/peer-to-peer/"
      }, {
        "name": "TEAM_URL",
        "content": props.domain + "/features/teams/"
      }, {
        "name": "CAMPAIGN",
        "content": codeObject.campaign
      }, {
        "name": "CAMPAIGN_IMG",
        "content": userObject[0].code_picture_url
      }];
      utility.mandrillTemplate(finalObjectMandril, function(err, reuslt) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, codeObject);
        }
      });
    }
  });
}
