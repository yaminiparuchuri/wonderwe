exports.deleteFeed = function(feedId, replyId, entityid, callback) {

  excuteQuery.queryForAll(sqlQueryMap['getDeleteFeeds'], [feedId], function(err, deleteFeed) {
    var countarray = [];
    if (err) {
      callback(new Error(err), null);
    } else {
      async.parallel({
          deleteFeed: function(deleteCallback) {
            excuteQuery.update(sqlQueryMap['deleteFeed'], [feedId, feedId], deleteCallback);
          },
          updateCount: function(updateCountCallback) {
            if (deleteFeed && deleteFeed.length > 0) {
              async.eachSeries(deleteFeed, function iterator(item, callback) {
                excuteQuery.update(sqlQueryMap['decreasePostCount'], [item.entity_id], function(err, data) {
                  if (err) {
                    callback(new Error(err), null);
                  } else {
                    if (item.status_type === 'share') {
                      excuteQuery.update(sqlQueryMap['decreasePostCountShare'], [replyId], function(err, data) {
                        if (err) {
                          callback(new Error(err), null);
                        } else {
                          callback(null, data);
                        }
                      });
                    } else {
                      callback(null, data);
                    }
                  }
                });
              }, function(err, result) {
                if (err) {
                  updateCountCallback(err, null);
                } else {
                  updateCountCallback(null, result);
                }

              });
            } else {
              updateCountCallback(null, null);
            }
          }
        },
        function(err, asynResult) {
          if (err) {
            callback(err);
          } else {
            async.eachSeries(deleteFeed, function iterator(item, callback) {
                if (entityid == item.entity_id) {
                  countarray.push(item.entity_id);
                }
                callback(null, countarray);
              },
              function(err, result) {
                if (err) {
                  callback(err, null);
                } else {
                  callback(null, countarray.length);
                }

              });
            // callback(null, asynResult.deleteFeed);
          }
        });
    }
  });
  /*  excuteQuery.update(sqlQueryMap['deleteFeed'], [feedId, feedId], function(err, rows) {
      if (err) {
        loggerwinston.error(err.stack);
        callback(err);
      } else {
        callback(null, rows);
      }

    });*/

};
exports.getPostData = function(id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getPostById'], [id], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows[0]);
    }
  });
};

exports.postFeed = function(feedObj, callback) {
  feedObj.in_reply_id = null;
  var me = this,
    content = '',
    mentions = [];
    console.log("I came form feedpost")
  var re = /(((http|https|ftp|ftps)\:\/\/)|www\.)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,9}(\/\S*)?/gi;
  var m;
  //m = re.exec(feedObj.content);
  var urlsArray = [];
  while ((m = re.exec(feedObj.content)) !== null) {
    if (m.index === re.lastIndex) {
      re.lastIndex++;
    }
    urlsArray.push(m[0])
  }
  if (feedObj && feedObj.mentions.length > 0) {
    for (var i = 0; i < feedObj.mentions.length; i++) {
      mentions[i] = feedObj.mentions[i];
      mentions[i].length = feedObj.mentions[i].slug.length;
    };
    content = feedObj.content;
    contentParser(content, mentions, function(err, result5) {
      feedObj.content = result5;
      if (urlsArray && urlsArray.length > 0) {
        metaData(urlsArray, feedObj, function(err, result6) {
          //feedObj.content = result6;
          insertPostfunction(feedObj, me, callback);
        });
      } else {
        metaData(null, feedObj, function(err, result6) {
          insertPostfunction(feedObj, me, callback);
        });
      }
    });
  } else {
    if (urlsArray && urlsArray.length > 0) {
      metaData(urlsArray, feedObj, function(err, result6) {
        insertPostfunction(feedObj, me, callback);
      });
    } else {
      insertPostfunction(feedObj, me, callback);
    }
  }
};

function insertPostfunction(feedObj, me, callback) {
  console.log("insertPotFunction");
  console.log(feedObj);
  excuteQuery.insertAndReturnKey(sqlQueryMap['postFeed'], [feedObj.in_reply_id, feedObj.entity_id, feedObj.date_posted, feedObj.ip_address, feedObj.hostname, feedObj.city, feedObj.state, feedObj.content, feedObj.status_type, feedObj.image_url, feedObj.headline, feedObj.original_entity_id], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      feedObj.id = rows;
      if (feedObj && (feedObj.urlsobj && feedObj.urlsobj.title || feedObj.code_tmpl)) {
        //insertMetaData(feedObj);
        if (feedObj.urlsobj) {
          var metadata = JSON.stringify(feedObj.urlsobj);
        } else {
          var metadata = null;
        }
        if (feedObj.code_tmpl) {
          var code_tmpl = JSON.stringify(feedObj.code_tmpl);
        } else {
          code_tmpl = null;
        }
        excuteQuery.insertAndReturnKey(sqlQueryMap['insert_post_meta_data'], [feedObj.id, metadata, code_tmpl], function(err, metaresult) {

        });
      }
      if (feedObj.mentions) {
        var url = '',
          name = '',
          mentionImage = feedObj.mentioningimage;
        //TODO: Need to Change this to Make this as Batch Update
        if (feedObj.title) {
          url = props.domain + '/' + feedObj.commonSlug;
          name = feedObj.title;
        } else {
          url = props.domain + '/' + feedObj.commonSlug;
          name = feedObj.name;
        }
        async.eachSeries(feedObj.mentions, function(item, callback) {
            var emaillist = [];
            var viewObj = item;
            var mention = {};
            mention.post_id = rows;
            mention.start_position = 0;
            mention.length = viewObj.slug.length;
            mention.link_type = "post";
            mention.text = viewObj.slug;
            mention.linked_type = viewObj.type;
            mention.linked_id = viewObj.suggestid;
            var content = feedObj.content;
            var mentionData = {};
            mentionData.mention = mention;
            mentionData.me = me;
            mentionData.url = url;
            mentionData.name = name;
            mentionData.content = content;
            mentionData.feedObj = feedObj;
            mentionData.mentionImage = mentionImage;
            console.log(viewObj);
            if (viewObj.type === "user") {
              //mention.linked_id = viewObj.entityId;
              var notifyObj = {};
              notifyObj.user_id = viewObj.suggestid;
              notifyObj.link_id = mention.post_id;
              notifyObj.type = 'mention';
              // utility.socketioNotifications(notifyObj);
              agenda.now('socket io notifications', notifyObj);

              //Added push notification code foe mentioned user

              excuteQuery.queryForAll(sqlQueryMap['checkuserId'], [viewObj.suggestid], function(err, deviceResult) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  if (deviceResult && deviceResult.length > 0) {
                    if (deviceResult[0].device_type === 'android') {
                      sendAndroidPushNotification(name + " mentioned you on WonderWe", deviceResult[0].device_token, props.domain + '/pages/' + feedObj.commonSlug + '/posts/' + mention.post_id);
                    } else if (deviceResult[0].device_type === 'ios') {
                      sendIosPushNotification(deviceResult[0].device_token, name + " mentioned you on WonderWe", props.domain + '/pages/' + feedObj.commonSlug + '/posts/' + mention.post_id);
                    }
                  }
                }

              });

              excuteQuery.queryForAll(sqlQueryMap['getUserEmailForMentions'], [mention.linked_id, mention.linked_id, mention.linked_id, mention.linked_id], function(err, resultuser) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  emaillist = resultuser;
                  mentionData.emaillist = emaillist;
                  //agenda.now('sendMailForMentionedUser', mentionData);
                  sendMailForMentioned(mention, me, name, url, content, emaillist, feedObj, mentionImage);
                }

              });

            } else if (viewObj.type === "code") {
              excuteQuery.queryForAll(sqlQueryMap['getUserEmailForMentions'], [mention.linked_id, mention.linked_id, mention.linked_id, mention.linked_id], function(err, resultuser) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  emaillist = resultuser;
                  mentionData.emaillist = emaillist;
                  //agenda.now('sendMailForMentionedUser', mentionData);
                  console.log(feedObj.feedbot)
                  if (!feedObj.feedbot) {
                    sendMailForMentioned(mention, me, name, url, content, emaillist, feedObj, mentionImage);
                  }
                }
              });

            } else if (viewObj.type == "charity") {
              excuteQuery.queryForAll(sqlQueryMap['getUserEmailForWrittenMentions'], [viewObj.slug, viewObj.slug, viewObj.slug], function(err, resultuser) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  emaillist = resultuser;
                  mentionData.emaillist = emaillist;
                  if (resultuser && resultuser[0].name) {
                    mention.text = resultuser[0].name;
                  }
                  //agenda.now('sendMailForMentionedUser', mentionData);
                  sendMailForMentioned(mention, me, name, url, content, emaillist, feedObj, mentionImage);
                }
              });
            } else if (viewObj.type == "hashcode") {
              mention.post_id = rows;
              mention.start_position = 0;
              mention.length = viewObj.slug.length;
              mention.link_type = 'hashcode';
              mention.text = viewObj.slug;
              mention.linked_type = null;
              mention.linked_id = null;
              console.log("camehere hellowolddsdsdsdrd")

              me.addMention(mention, function(err, data) {});
            } else if (viewObj.type === "userslug" || viewObj.type === "wecode") {
              excuteQuery.queryForAll(sqlQueryMap['getUserEmailForWrittenMentions'], [viewObj.slug, viewObj.slug, viewObj.slug], function(err, resultuser) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  if (resultuser && resultuser.length) {
                    if (resultuser[0].type === "user") {
                      var notifyObj = {};
                      notifyObj.user_id = resultuser[0].id;
                      notifyObj.link_id = mention.post_id;
                      notifyObj.type = 'mention';
                      agenda.now('socket io notifications', notifyObj);
                    }
                    emaillist = resultuser[0].email;
                    mention.text = resultuser[0].name;
                    mention.linked_type = resultuser[0].type;
                    mention.linked_id = resultuser[0].id;

                    mentionData.mention = mention;
                    mentionData.emaillist = resultuser;
                    //agenda.now('sendMailForMentionedUser', mentionData);
                    console.log("camehere hellowolrd")
                    sendMailForMentioned(mention, me, name, url, content, emaillist, feedObj, mentionImage);
                  }
                }
              });
            }
            callback(null);
          },
          function(err) {
            utility.log('WARN', "inside error");
          });
      }
      excuteQuery.update(sqlQueryMap['updatePostCount'], [feedObj.entity_id], function(err, updateCountResult) {

      });
      callback(null, feedObj);
    }

  });
}

/*function sendIosPushNotification(deviceToken, messageBody, postid, slug) {

  var myPhone = deviceToken;
  var myDevice = new apn.Device(myPhone);
  var note = new apn.Notification();
  note.badge = 1;
  note.sound = "notification-beep.wav";
  note.alert = {
    "body": messageBody,
    "action-loc-key": "Play",
    "launch-image": "mysplash.png",
    "link": props.domain + "/pages/" + slug + "/posts/" + postid
  };
  note.payload = {
    'messageFrom': 'Holly'
  };

  note.device = myDevice;

  var callback = function(errorNum, notification) {

  }
  var options = {
    gateway: 'gateway.sandbox.push.apple.com', // this URL is different for Apple's Production Servers and changes when you go to production
    errorCallback: callback,
    cert: './services/cert.pem',
    key: './services/key.pem',
    passphrase: 'wonderwe',
    port: 2195,
    enhanced: true,
    cacheLength: 100
  }
  var apnsConnection = new apn.Connection(options);
  apnsConnection.sendNotification(note);
}
*/
/*function sendAndroidPushNotification(messageBody, deviceToken) {

  var message = new gcm.Message();
  //API Server Key
  var sender = new gcm.Sender('AIzaSyBbhtBT73uEAhPg6IPu7qrIKCaSMFJ-vqU');
  var registrationIds = [];
  // Value the payload data to send...
  message.addData('message',messageBody);
  message.addData('title','Wonderwe' );
  message.addData('msgcnt','3'); // Shows up in the notification in the status bar when you drag it down by the time
  message.addData('click_action','wonderwe://register'); // Shows up in the notification in the status bar when you drag it down by the time

  message.addNotification({
    title: 'Alert!!!',
    body: messageBody,
    icon: 'ic_launcher',
    click_action: 'wonderwe://register'
  });

  //message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app - may not work
  //message.collapseKey = 'demo';
  //message.delayWhileIdle = true; //Default is false
  message.timeToLive = 3000; // Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.
  // At least one reg id/token is required
  registrationIds.push(deviceToken);


  sender.send(message, registrationIds, 4, function(result) {

  });
}*/

function sendMailForMentioned(mention, me, name, url, content, userForMentions, feedObj, mentioningimage) {
  me.addMention(mention, function(err, data) {
    if (feedObj.in_reply_id) {
      var postId = feedObj.in_reply_id;
    } else {
      var postId = feedObj.id;
    }
    var finalobjectmandril = {};
    finalobjectmandril.from = name + "( via WonderWe ) <noreply@wonderwe.com>";
    if (userForMentions && userForMentions.length > 0) {
      if (userForMentions && userForMentions[0].email) {
        finalobjectmandril.email = userForMentions[0].email;
      }
      if (userForMentions && userForMentions[0].timezone_id) {
        var timezone_id = userForMentions[0].timezone_id;
      }
    } else {
      finalobjectmandril.email = '';
      var timezone_id = '';
    }
    if (finalobjectmandril && finalobjectmandril.email == undefined) {
      finalobjectmandril.email = userForMentions;
    }


    finalobjectmandril.text = "";
    finalobjectmandril.subject = name + " mentioned you on WonderWe";
    finalobjectmandril.template_name = "You were mentioned in post";
    var moment = require('moment-timezone');
    var utilService = require('./weutil.js');
    utilService.getZoneById(timezone_id, function(err, zoneArray) {
      var userTimeZoneDate = '';
      if (!err && zoneArray.length > 0) {
        userTimeZoneDate = moment.utc(feedObj.date_posted).tz(zoneArray[0].zone_name);
      } else {
        userTimeZoneDate = moment.utc(feedObj.date_posted).tz("America/Chicago");
      }
      finalobjectmandril.template_content = [{
        "name": "mentioningusername",
        "content": "*|MENTIONING_USER_NAME|*"
      }, {
        "name": "mentionuserimage",
        "content": "*|MENTIONING_USER_IMG|*"
      }, {
        "name": "messagedate",
        "content": "*|MESSAGE_DATE|*"
      }, {
        "name": "message",
        "content": "*|MESSAGE|*"
      }, {
        "name": "messageimage",
        "content": "*|MESSAGE_IMG|*"
      }, {
        "name": "mentioninguserurl",
        "content": "*|MENTIONING_USER_URL|*"
      }, {
        "name": "taggedposturl",
        "content": "*|TAGGED_POST_URL|*"
      }];
      finalobjectmandril.merge_vars = [{
        "name": "MENTIONING_USER_NAME",
        "content": name
      }, {
        "name": "MENTIONING_USER_IMG",
        "content": mentioningimage
      }, {
        "name": "MESSAGE_DATE",
        "content": userTimeZoneDate.format('MMMM Do') + " at " + userTimeZoneDate.format('h:mm a')
      }, {
        "name": "MESSAGE",
        "content": content.split('<div class="js-viewCampaign profile-card new-campaign-card')[0]
      }, {
        "name": "MESSAGE_IMG",
        "content": feedObj.image_url
      }, {

        "name": "MENTIONING_USER_URL",
        "content": props.domain + "/" + feedObj.commonSlug
      }, {
        "name": "TAGGED_POST_URL",
        "content": props.domain + "/pages/" + feedObj.commonSlug + "/posts/" + postId
      }];

      utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
        if (err) {
          //callback(err);
        } else {
          //callback(null, reuslt);
        }
      });
    });
  });
}

/*function insertMetaData(feedObj) {
  var metadata = JSON.stringify(feedObj.urlsobj);
  excuteQuery.insertAndReturnKey(sqlQueryMap['insert_post_meta_data'], [feedObj.id, metadata], function(err, rows) {
    if (err) {
      //callback(err);
    } else {
      //callback(null, rows);
    }
  });
}*/

function metaData(urlsArray, obj, metadatacallback) {
  var re = /(((http|https|ftp|ftps)\:\/\/)|www\.)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,9}(\/\S*)?/gi;

  if (urlsArray && urlsArray.length > 0) {
    for (var i in urlsArray) {
      var url = urlsArray[i];
      var url1 = urlsArray[i];
      if (!/^(f|ht)tps?:\/\//i.test(url1)) {
        url1 = "http://" + url1;
      }
      if (obj.headline) {
        if (url1) {
          var contentFinal = obj.headline.replace(url, '<a href="' + url1 + '" target="_blank" rel="nofollow" class="link">' + url + '</a>');
        } else {
          var contentFinal = obj.headline.replace(url, '<a href="' + url + '" target="_blank" rel="nofollow" class="link">' + url + '</a>')
        }
        obj.headline = contentFinal;
      } else {
        if (url1) {
          var contentFinal = obj.content.replace(url, '<a href="' + url1 + '"  target="_blank" rel="nofollow" class="link">' + url + '</a>');
        } else {
          var contentFinal = obj.content.replace(url, '<a href="' + url + '"  target="_blank" rel="nofollow" class="link">' + url + '</a>')
        }
        obj.content = contentFinal;

      }
    }
  }
  if (obj.mentions && obj.mentions.length > 0) {
    var codeMention = underscore.findWhere(obj.mentions, {
      type: "code"
    });
    var wecodeMention = underscore.findWhere(obj.mentions, {
      type: "wecode"
    });
    if (codeMention && codeMention.type === 'code' || wecodeMention && wecodeMention.type === 'wecode') {
      if (codeMention && codeMention.slug) {
        var slug = codeMention.slug
      } else {
        var slug = wecodeMention.slug
      }
      excuteQuery.queryForAll(sqlQueryMap['verificationOfWecodeSlug'], [slug, 'code'], function(err, resultuser) {
        if (err) {
          callback(new Error(err), null);
        } else {
          if (resultuser && resultuser.length) {
            if (resultuser[0].entity_type === "code") {
              obj.code_tmpl = resultuser[0];
              //'<a class="col-sm-6 col-md-12 js-viewCampaign" style="padding-left:0px;color: white" data-slug="' + resultuser[0].slug + '"><div data-slug="' + resultuser[0].slug + '" class="profile-card new-campaign-card"><div class="campaign-bg" data-slug="' + resultuser[0].slug + '" style="background-image:url(' + resultuser[0].code_picture_url + ')"></div><div class="card-container" data-slug="' + resultuser[0].slug + '"><div class="campaign-info" data-slug="' + resultuser[0].slug + '"><div class="top-card" data-slug="' + resultuser[0].slug + '"><h4 style="color:white">' + resultuser[0].title + ' (We#' + resultuser[0].code_text + ')</h4><a class="btn btn-subtle col-sm-1 js-campaignMentionDonation"  data-slug="' + resultuser[0].slug + '" data-loading-text="Loading..." style="float:right;margin-top: -20px;">Donate</a></div></div></div></div></a>';
            }
          }
          if (urlsArray) {
            var list = og(urlsArray[0], function(err, results1) {
              if (results1) {
                obj.urlsobj = results1;
                metadatacallback(null, obj);
              } else {
                metadatacallback(null, obj);
              }
            });
          } else {
            metadatacallback(null, obj);
          }
        }
      });
    } else {
      if (urlsArray) {
        var list = og(urlsArray[0], function(err, results1) {
          if (results1) {
            obj.urlsobj = results1;
            metadatacallback(null, obj);
          } else {
            metadatacallback(null, obj);
          }
        });
      } else {
        metadatacallback(null, obj);
      }
    }
  } else {
    if (urlsArray) {
      var list = og(urlsArray[0], function(err, results1) {
        if (results1) {
          obj.urlsobj = results1;
          metadatacallback(null, obj);
        } else {
          metadatacallback(null, obj);
        }
      });
    } else {
      metadatacallback(null, obj);
    }
  }
}

function contentParser(content, mentions, parserCallback) {
  var nextIndex = 0,
    finalString = '',
    replaceString = '',
    href = '',
    str = content;
  async.eachSeries(mentions, function(mentionObj, callback) {
    var increment = 0;
    if (mentionObj.type === 'user') {
      href = props.domain + '/' + mentionObj.slug;
      increment = parseInt(mentionObj.length) + 1;
      replaceString = "<a href=" + href + ">" + str.substring(mentionObj.index, parseInt(mentionObj.index) + increment) + "</a>";
      finalString = finalString + str.substring(nextIndex, mentionObj.index) + replaceString;
      nextIndex = parseInt(mentionObj.index) + increment;
      callback(null);
    } else if (mentionObj.type === 'charity') {
      href = props.domain + '/' + mentionObj.slug;
      increment = parseInt(mentionObj.length) + 1;
      replaceString = "<a href=" + href + ">" + str.substring(mentionObj.index, parseInt(mentionObj.index) + increment) + "</a>";
      finalString = finalString + str.substring(nextIndex, mentionObj.index) + replaceString;
      nextIndex = parseInt(mentionObj.index) + increment;
      callback(null);
    } else if (mentionObj.type === 'code') {
      href = props.domain + '/' + mentionObj.slug;
      increment = parseInt(mentionObj.length) + 3;
      replaceString = "<a href=" + href + ">" + str.substring(mentionObj.index, parseInt(mentionObj.index) + increment) + "</a>";
      finalString = finalString + str.substring(nextIndex, mentionObj.index) + replaceString;
      //var wecodeString = '<div class="js-viewCampaign profile-card new-campaign-card" data-slug="' + mentionObj.slug + '"><div class="campaign-bg" data-slug="' + mentionObj.slug + '" style="background-image:url(' + mentionObj.image + ')"></div><div class="card-container"><div class="campaign-info"><div class="campaignText"><a href="' + href + '"><h4>' + mentionObj.title + '</h4><p>We#' + mentionObj.suggestedname + '</p></a></div><div class="campaignAction"><button class="btn btn-subtle js-campaignMentionDonation"  data-slug="' + mentionObj.slug + '" data-loading-text="Loading..." data-codeid="' + mentionObj.suggestid + '" href="#">Donate</button></div></div></div></div>'
      var wecodeString = '';
      nextIndex = parseInt(mentionObj.index) + increment;
      str = str + wecodeString;
      callback(null);
    } else if (mentionObj.type === 'hashcode') {
      href = props.domain + '/search/hash/' + mentionObj.slug;
      increment = parseInt(mentionObj.length) + 1;
      replaceString = "<a href=" + href + ">" + str.substring(mentionObj.index, parseInt(mentionObj.index) + increment) + "</a>";
      finalString = finalString + str.substring(nextIndex, mentionObj.index) + replaceString;
      nextIndex = parseInt(mentionObj.index) + increment;
      callback(null);
    } else if (mentionObj.type === 'userslug') {
      var type1 = "user";
      var type2 = "charity";
      excuteQuery.queryForAll(sqlQueryMap['verificationOfSlug'], [mentionObj.slug, type1, mentionObj.slug, type2], function(err, rows) {
        if (err) {
          // callback(err);
          callback(new Error(err), null);
        } else {
          if (rows && rows.length > 0) {
            href = props.domain + '/' + mentionObj.slug;
            if (rows[0].entity_type == 'user' || rows[0].entity_type == 'charity') {
              increment = parseInt(mentionObj.length) + 1;
            } else if (rows[0].entity_type == 'code') {
              increment = parseInt(mentionObj.length) + 3;
            }
            replaceString = "<a href=" + href + ">" + str.substring(mentionObj.index, parseInt(mentionObj.index) + increment) + "</a>";
            finalString = finalString + str.substring(nextIndex, mentionObj.index) + replaceString;
            nextIndex = parseInt(mentionObj.index) + increment;
          }
          callback(null);
        }
      });
    } else if (mentionObj.type === 'wecode') {
      var type1 = "code";
      var type2 = "code";
      excuteQuery.queryForAll(sqlQueryMap['verificationOfWecodeSlug'], [mentionObj.slug, type1], function(err, rows) {
        if (err) {
          // callback(err);
          callback(new Error(err), null);
        } else {
          if (rows && rows.length > 0) {
            href = props.domain + '/' + mentionObj.slug;
            if (rows[0].entity_type == 'user' || rows[0].entity_type == 'charity') {
              increment = parseInt(mentionObj.length) + 1;
            } else if (rows[0].entity_type == 'code') {
              increment = parseInt(mentionObj.length) + 3;
            }
            replaceString = "<a href=" + href + ">" + str.substring(mentionObj.index, parseInt(mentionObj.index) + increment) + "</a>";
            finalString = finalString + str.substring(nextIndex, mentionObj.index) + replaceString;
            //   var wecodeString = '<a class="col-sm-6 col-md-12 js-viewCampaign" style="padding-left:0px;color: white" data-slug="' + rows[0].slug + '"><div data-slug="' + rows[0].slug + '" class="profile-card new-campaign-card"><div class="campaign-bg" data-slug="' + rows[0].slug + '" style="background-image:url(' + rows[0].code_picture_url + ')"></div><div class="card-container" data-slug="' + rows[0].slug + '"><div class="campaign-info" data-slug="' + rows[0].slug + '"><div class="top-card" data-slug="' + rows[0].slug + '"><h4 style="color:white">' + rows[0].title + ' (We#' + rows[0].code_text + ')</h4><a class="btn btn-subtle col-sm-1 js-campaignMentionDonation"  data-slug="' + rows[0].slug + '" data-loading-text="Loading..." style="float:right;margin-top: -20px;">Donate</a></div></div></div></div></a>'
            //var wecodeString = '<div class="js-viewCampaign profile-card new-campaign-card" data-slug="' + rows[0].slug + '"><div class="campaign-bg" data-slug="' + rows[0].slug + '" style="background-image:url(' + rows[0].code_picture_url + ')"></div><div class="card-container"><div class="campaign-info"><div class="campaignText"><a href="' + href + '"><h4>' + rows[0].title + '</h4><p>We#' + rows[0].code_text + '</p></a></div><div class="campaignAction"><button class="btn btn-subtle js-campaignMentionDonation"  data-slug="' + rows[0].slug + '" data-loading-text="Loading..." data-codeid="' + rows[0].entity_id + '" href="#">Donate</button></div></div></div></div>'
            var wecodeString = '';
            nextIndex = parseInt(mentionObj.index) + increment;
            str = str + wecodeString;
          }
          callback(null);
        }
      });
    }
  }, function(err) {
    finalString = finalString + str.substring(nextIndex, str.length);
    parserCallback(null, finalString);
  });

}


exports.addMention = function(mentionsobj, callback) {
  excuteQuery.insertAndReturnKey(sqlQueryMap['status_update_link_tbl_insert'], [mentionsobj.post_id, mentionsobj.start_position, mentionsobj.length, mentionsobj.link_type, mentionsobj.text, mentionsobj.linked_type, mentionsobj.linked_id], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.viewFeed = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['feedList'], [parseInt(obj.userId), parseInt(obj.skip)], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });

};

exports.retrieveCharityFollowers = function(urlSlug, callback) {

  excuteQuery.queryForAll(sqlQueryMap['retriveCharityFollowers'], [urlSlug], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }

  });
};

exports.updatePost = function(obj, callback) {
  excuteQuery.insertAndReturnKey(sqlQueryMap['update_post'], [obj.content, obj.update_id], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, obj);
    }
  });
};

exports.getAllCharityMentions = function(charityId, callback) {

  excuteQuery.queryForAll(sqlQueryMap['getCharityMentions'], [charityId, charityId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};
exports.getCodeMentions = function(codeId, callback) {

  excuteQuery.queryForAll(sqlQueryMap['getCodeMentions'], [codeId, codeId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};
exports.getUserMentions = function(userId, obj, callback) {
console.log(userId);
console.log(obj);
console.log("mentions....")
  excuteQuery.queryForAll(sqlQueryMap['getUserMentions'], [userId, parseInt(obj.skip)], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      console.log(rows)
      callback(null, rows);
    }
  });
};
exports.getEntityMentions = function(obj, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['getEntityById'], [obj.entityId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (rows && rows.length) {
        if (rows[0].entity_type === 'charity') {
          me.getAllCharityMentions(rows[0].entity_id, callback);
        } else if (rows[0].entity_type === 'code') {
          me.getCodeMentions(rows[0].entity_id, callback);
        } else {
          me.getUserMentions(rows[0].entity_id, obj, callback);
        }

      } else {
        me.getUserMentions(rows, obj, callback);
      }
    }
  });
};


exports.getAllPreviousReTweets = function(postId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['postAndReposts'], [postId, postId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      var post = {};
      post.id = postId;
      post.postandreposts = rows;
      callback(null, post);
    }
  });
};

exports.getAllPreviousReplys = function(postId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['postAndReplies'], [postId, postId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      var post = {};
      post.id = postId;
      post.postandcomments = rows;
      callback(null, post);
    }
  });
};

exports.insertRetweetPost = function(obj, callback) {
  var mentions = [],
    me = this,
    content = '';
  var re = /(((http|https|ftp|ftps)\:\/\/)|www\.)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,9}(\/\S*)?/gi;
  var m;
  //m = re.exec(obj.content);
  var urlsArray = [];
  while ((m = re.exec(obj.headline)) !== null) {
    if (m.index === re.lastIndex) {
      re.lastIndex++;
    }
    urlsArray.push(m[0])
  }
  if (obj && obj.mentions && obj.mentions.length > 0) {
    for (var i = 0; i < obj.mentions.length; i++) {
      mentions[i] = obj.mentions[i];
      mentions[i].length = obj.mentions[i].slug.length;
    };
    content = obj.headline;
    contentParser(content, mentions, function(err, result5) {
      obj.headline = result5;
      if (urlsArray && urlsArray.length > 0) {
        metaData(urlsArray, obj, function(err, result6) {
          retweetpost(obj, me, callback);
        });
      } else {
        metaData(null, obj, function(err, result6) {
          retweetpost(obj, me, callback);
        });
      }
    });

  } else {
    if (urlsArray && urlsArray.length > 0) {
      metaData(urlsArray, obj, function(err, result6) {
        retweetpost(obj, me, callback);
      });
    } else {
      retweetpost(obj, me, callback);
    }
  }
};

function retweetpost(obj, me, callback) {
  var result = '';
  async.parallel({
    retweet: function(tweetCallback) {
      excuteQuery.insertAndReturnKey(sqlQueryMap['postFeed'], [obj.in_reply_id, obj.entity_id, obj.date_posted, obj.ip_address, obj.hostname, obj.city, obj.state, obj.content, obj.status_type, obj.image_url, obj.headline, obj.original_entity_id],
        function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {
            result = rows;
            obj.id = rows;
            if (obj && (obj.urlsobj && obj.urlsobj.title || obj.code_tmpl)) {
              //insertMetaData(feedObj);
              if (obj.urlsobj) {
                var metadata = JSON.stringify(obj.urlsobj);
              } else {
                var metadata = null;
              }
              if (obj.code_tmpl) {
                var code_tmpl = JSON.stringify(obj.code_tmpl);
              } else {
                code_tmpl = null;
              }
              excuteQuery.insertAndReturnKey(sqlQueryMap['insert_post_meta_data'], [obj.id, metadata, code_tmpl], function(err, metaresult) {

              });
            }
            if (obj.mentions.length > 0) {
              var url = '',
                name = '';
              url = props.domain + '/' + obj.commonSlug;
              //TODO: Need to Change this to Make this as Batch Update.
              if (obj.title) {
                name = obj.title;
              } else {
                name = obj.name;
              }
              async.eachSeries(obj.mentions, function iterator(item, callback) {
                var emaillist = [];
                var viewObj = item;
                var mention = {};
                mention.post_id = rows;
                mention.start_position = 0;
                if (viewObj.suggestedname) {
                  mention.length = viewObj.suggestedname.length;
                }

                mention.link_type = 'share';
                mention.text = viewObj.suggestedname;
                mention.linked_type = viewObj.type;
                mention.linked_id = viewObj.suggestid;

                var content = obj.headline;

                var retweetpostData = {};
                retweetpostData.mention = mention;
                retweetpostData.me = me;
                retweetpostData.url = url;
                retweetpostData.name = name;
                retweetpostData.content = content;
                retweetpostData.feedObj = obj;
                retweetpostData.mentionImage = obj.mentioningimage;

                if (viewObj.type === "user") {
                  //mention.linked_id = viewObj.entityId;
                  var notifyObj = {};
                  notifyObj.user_id = viewObj.suggestid;
                  notifyObj.link_id = obj.in_reply_id;
                  notifyObj.type = 'mention';
                  //utility.socketioNotifications(notifyObj);
                  agenda.now('socket io notifications', notifyObj);
                  excuteQuery.queryForAll(sqlQueryMap['getUserEmailForMentions'], [mention.linked_id, mention.linked_id, mention.linked_id, null], function(err, resultuser) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      emaillist = resultuser;
                      retweetpostData.emaillist = emaillist;
                      //agenda.now('sendMailForRetweetPostUser', retweetpostData);
                      sendMailForMentioned(mention, me, name, url, content, emaillist, obj, obj.mentioningimage);
                    }
                  });
                } else if (viewObj.type === "code") {
                  excuteQuery.queryForAll(sqlQueryMap['getUserEmailForMentions'], [mention.linked_id, mention.linked_id, mention.linked_id, null], function(err, resultuser) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      emaillist = resultuser;
                      retweetpostData.emaillist = emaillist;
                      //agenda.now('sendMailForRetweetPostUser', retweetpostData);

                      sendMailForMentioned(mention, me, name, url, content, emaillist, obj, obj.mentioningimage);
                    }
                  });
                } else if (viewObj.type == "charity") {
                  excuteQuery.queryForAll(sqlQueryMap['getUserEmailForMentions'], [mention.linked_id, mention.linked_id, mention.linked_id, null], function(err, resultuser) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      emaillist = resultuser;
                      retweetpostData.emaillist = emaillist;
                      //agenda.now('sendMailForRetweetPostUser', retweetpostData);
                      sendMailForMentioned(mention, me, name, url, content, emaillist, obj, obj.mentioningimage);
                    }
                  });
                } else if (viewObj.type == "hashcode") {
                  mention.post_id = rows;
                  mention.start_position = 0;
                  mention.length = viewObj.slug.length;
                  mention.link_type = 'hashcode';
                  mention.text = viewObj.slug;
                  mention.linked_type = null;
                  mention.linked_id = null;
                  me.addMention(mention, function(err, data) {});
                } else if (viewObj.type === "userslug" || viewObj.type === "wecode") {
                  excuteQuery.queryForAll(sqlQueryMap['getUserEmailForWrittenMentions'], [viewObj.slug, viewObj.slug, viewObj.slug], function(err, resultuser) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      if (resultuser && resultuser.length) {
                        if (resultuser[0].type === "user") {
                          var notifyObj = {};
                          notifyObj.user_id = resultuser[0].id;
                          notifyObj.link_id = mention.post_id;
                          notifyObj.type = 'mention';
                          agenda.now('socket io notifications', notifyObj);
                        }
                        emaillist = resultuser[0].email;
                        mention.length = viewObj.slug.length;
                        mention.text = resultuser[0].name;
                        mention.linked_type = resultuser[0].type;
                        mention.linked_id = resultuser[0].id;

                        retweetpostData.emaillist = resultuser;
                        retweetpostData.mention = mention;
                        //agenda.now('sendMailForRetweetPostUser', retweetpostData);

                        sendMailForMentioned(mention, me, name, url, content, emaillist, obj);
                      }
                    }
                  });
                }
                callback(null);

              }, function(err) {
                utility.log('WARN', "inside error");
              });
            }
            tweetCallback(null, result);
          }
        });
      excuteQuery.queryForAll(sqlQueryMap['getOriginalmeg'], [obj.in_reply_id, obj.in_reply_id], function(err, originalresult) {
        if (err) {
          callback(new Error(err), null);
        } else {
          var notifiObj = {};
          notifiObj.entity_id = originalresult[0].entity_id;
          notifiObj.link_id = obj.in_reply_id;
          notifiObj.type = 'share';
          notifiObj.user_id = obj.suggestid;
          //utility.socketioNotifications(notifiObj);
          agenda.now('socket io notifications', notifiObj);
        }
      });

    },
    countUpdate: function(updateCallback) {
      excuteQuery.update(sqlQueryMap['updateRetweetCount'], [obj.in_reply_id], updateCallback);
    },
    updatentityCount: function(entityCallback) {
      excuteQuery.update(sqlQueryMap['updatePostCount'], [obj.entity_id], entityCallback);
    }
  }, function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      obj.post_id = result.retweet;
      callback(null, obj);
    }
  });
}

exports.insertReplyPost = function(obj, callback) {
  var mentions = [],
    me = this,
    content = '';
  var re = /(((http|https|ftp|ftps)\:\/\/)|www\.)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,9}(\/\S*)?/gi;
  var m;
  //m = re.exec(obj.content);
  var urlsArray = [];
  while ((m = re.exec(obj.content)) !== null) {
    if (m.index === re.lastIndex) {
      re.lastIndex++;
    }
    urlsArray.push(m[0])
  }
  if (obj.title) {
    if (obj && obj.mentions.length > 0) {
      for (var i = 0; i < obj.mentions.length; i++) {
        mentions[i] = obj.mentions[i];
        mentions[i].length = obj.mentions[i].slug.length;
      };
      content = obj.content;
      contentParser(content, mentions, function(err, result5) {
        obj.content = result5;
        if (urlsArray && urlsArray.length > 0) {
          metaData(urlsArray, obj, function(err, result6) {
            replypost(obj, me, callback);
          });
        } else {
          metaData(null, obj, function(err, result6) {
            replypost(obj, me, callback);
          });
        }
      });
    } else {
      if (urlsArray && urlsArray.length > 0) {
        metaData(urlsArray, obj, function(err, result6) {
          replypost(obj, me, callback);
        });
      } else {
        replypost(obj, me, callback);
      }
    }
  } else {
    excuteQuery.queryForAll(sqlQueryMap['commentuserinfo'], [obj.entity_id], function(err, commentUserInfo) {
      if (err) {
        callback(new Error(err), null);
      } else {
        if (commentUserInfo && commentUserInfo.length > 0) {
          obj.name = commentUserInfo[0].name;
          obj.mentioningimage = commentUserInfo[0].profile_pic_url;
        }
        if (obj && obj.mentions.length > 0) {
          for (var i = 0; i < obj.mentions.length; i++) {
            mentions[i] = obj.mentions[i];
            mentions[i].length = obj.mentions[i].slug.length;
          };
          content = obj.content;
          contentParser(content, mentions, function(err, result5) {
            obj.content = result5;
            if (urlsArray && urlsArray.length > 0) {
              metaData(urlsArray, obj, function(err, result6) {
                replypost(obj, me, callback);
              });
            } else {
              metaData(null, obj, function(err, result6) {
                replypost(obj, me, callback);
              });
            }
          });
        } else {
          if (urlsArray && urlsArray.length > 0) {
            metaData(urlsArray, obj, function(err, result6) {
              replypost(obj, me, callback);
            });
          } else {
            replypost(obj, me, callback);
          }
        }
      }
    });
  }



};

function replypost(obj, me, callback) {
  var result = '';
  async.parallel({
      replyPost: function(postCallback) {
        excuteQuery.insertAndReturnKey(sqlQueryMap['postFeed'], [obj.in_reply_id, obj.entity_id, obj.date_posted, obj.ip_address, obj.hostname, obj.city, obj.state, obj.content, obj.status_type, obj.image_url, obj.headline, obj.original_entity_id],
          function(err, rows) {
            if (err) {
              callback(new Error(err), null);
            } else {
              result = rows;
              obj.id = rows;
              if (obj && (obj.urlsobj && obj.urlsobj.title || obj.code_tmpl)) {
                //insertMetaData(feedObj);
                if (obj.urlsobj) {
                  var metadata = JSON.stringify(obj.urlsobj);
                } else {
                  var metadata = null;
                }
                if (obj.code_tmpl) {
                  var code_tmpl = JSON.stringify(obj.code_tmpl);
                } else {
                  code_tmpl = null;
                }
                excuteQuery.insertAndReturnKey(sqlQueryMap['insert_post_meta_data'], [obj.id, metadata, code_tmpl], function(err, metaresult) {

                });
              }

              if (obj.mentions.length > 0) {

                excuteQuery.queryForAll(sqlQueryMap['getOriginalmeg'], [obj.in_reply_id, obj.in_reply_id], function(err, originalresult) {
                  if (err) {
                    callback(new Error(err), null);
                  } else {
                    var url = props.domain + '/' + obj.commonSlug,
                      name = '',
                      originalposturl = props.domain + '/' + originalresult[0].slug;

                    if (obj.title) {
                      name = obj.title;
                    } else {
                      name = obj.name;
                    }

                    async.eachSeries(obj.mentions, function(item, callback) {
                      var emaillist = [];
                      var viewObj = item;
                      var mention = {};
                      mention.post_id = obj.in_reply_id;
                      mention.start_position = 0;
                      if (viewObj.suggestedname) {
                        mention.length = viewObj.suggestedname.length;
                      }
                      mention.link_type = 'reply';
                      mention.text = viewObj.suggestedname;
                      mention.linked_type = viewObj.type;
                      mention.linked_id = viewObj.suggestid;
                      mention.linked_image = viewObj.image

                      var content = obj.content;

                      var replypostData = {};
                      replypostData.me = me;
                      replypostData.url = url;
                      replypostData.name = name;
                      replypostData.content = content;
                      replypostData.feedObj = obj;
                      replypostData.mention = mention;
                      replypostData.originalresult = originalresult;
                      replypostData.originalposturl = originalposturl;

                      if (viewObj.type === "user") {
                        //mention.linked_id = viewObj.entityId;
                        var notifyObj = {};
                        notifyObj.user_id = viewObj.suggestid;
                        notifyObj.link_id = obj.in_reply_id;
                        notifyObj.type = 'mention';
                        //utility.socketioNotifications(notifyObj);
                        agenda.now('socket io notifications', notifyObj);
                        excuteQuery.queryForAll(sqlQueryMap['getUserEmailForMentions'], [mention.linked_id, mention.linked_id, mention.linked_id, null], function(err, resultuser) {
                          if (err) {
                            callback(new Error(err), null);
                          } else {
                            emaillist = resultuser;

                            replypostData.emaillist = emaillist;
                            //agenda.now('sendMailForMentionedUser', replypostData);
                            sendMailForMentioned(mention, me, name, url, content, emaillist, obj, obj.mentioningimage);
                          }

                        });
                      } else if (viewObj.type === "code") {
                        excuteQuery.queryForAll(sqlQueryMap['getUserEmailForMentions'], [mention.linked_id, mention.linked_id, mention.linked_id, null], function(err, resultuser) {
                          if (err) {
                            callback(new Error(err), null);
                          } else {
                            emaillist = resultuser;
                            replypostData.emaillist = emaillist;
                            //agenda.now('sendMailForMentionedUser', replypostData);
                            sendMailForMentioned(mention, me, name, url, content, emaillist, obj, obj.mentioningimage);
                          }
                        });

                      } else if (viewObj.type == "charity") {

                        excuteQuery.queryForAll(sqlQueryMap['getUserEmailForMentions'], [mention.linked_id, mention.linked_id, mention.linked_id, null], function(err, resultuser) {
                          if (err) {
                            callback(new Error(err), null);
                          } else {
                            emaillist = resultuser;
                            replypostData.emaillist = emaillist;
                            //agenda.now('sendMailForMentionedUser', replypostData);
                            sendMailForMentioned(mention, me, name, url, content, emaillist, obj, obj.mentioningimage);
                          }
                        });
                      } else if (viewObj.type == "hashcode") {
                        mention.post_id = rows;
                        mention.start_position = 0;
                        mention.length = viewObj.slug.length;
                        mention.link_type = 'hashcode';
                        mention.text = viewObj.slug;
                        mention.linked_type = null;
                        mention.linked_id = null;
                        me.addMention(mention, function(err, data) {});
                      } else if (viewObj.type === "userslug" || viewObj.type === "wecode") {
                        excuteQuery.queryForAll(sqlQueryMap['getUserEmailForWrittenMentions'], [viewObj.slug, viewObj.slug, viewObj.slug], function(err, resultuser) {
                          if (err) {
                            callback(new Error(err), null);
                          } else {
                            if (resultuser && resultuser.length) {
                              if (resultuser[0].type === "user") {
                                var notifyObj = {};
                                notifyObj.user_id = resultuser[0].id;
                                notifyObj.link_id = mention.post_id;
                                notifyObj.type = 'mention';
                                agenda.now('socket io notifications', notifyObj);
                              }
                              emaillist = resultuser[0].email;
                              mention.text = resultuser[0].name;
                              mention.linked_type = resultuser[0].type;
                              mention.linked_id = resultuser[0].id;

                              replypostData.mention = obj.mention;
                              replypostData.emaillist = resultuser;
                              //agenda.now('sendMailForMentionedUser', replypostData);
                              sendMailForMentioned(mention, me, name, url, content, emaillist, obj);
                            }
                          }
                        });
                      }
                      callback(null);
                    }, function(err) {
                      utility.log('WARN', "inside error");
                    });
                  }

                });
              } //else {
              excuteQuery.queryForAll(sqlQueryMap['getOriginalmeg'], [obj.in_reply_id, obj.in_reply_id], function(err, originalresult) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  var url = props.domain + '/' + obj.commonSlug,
                    name = '',
                    content = obj.content,
                    originalposturl = props.domain + '/' + originalresult[0].slug;

                  var replypostMandrill = {};
                  replypostMandrill.me = me;
                  replypostMandrill.url = url;
                  replypostMandrill.content = content;
                  replypostMandrill.feedObj = obj;
                  replypostMandrill.mention = obj.mention;
                  replypostMandrill.originalresult = originalresult;
                  replypostMandrill.originalposturl = originalposturl;
                  if (obj.title) {
                    replypostMandrill.name = obj.title;
                    name = obj.title;
                    excuteQuery.queryForAll(sqlQueryMap['getUserEmailForMentions'], [obj.charityId, obj.charityId, obj.charityId, null], function(err, resultuser) {
                      if (err) {
                        callback(new Error(err), null);
                      } else {
                        emaillist = resultuser;
                        replypostMandrill.emaillist = emaillist;
                        //agenda.now('sendEmailForReplyPost', replypostMandrill);
                        mandrillMailObject(obj.mentions, me, name, url, content, emaillist, obj, originalresult, originalposturl)
                      }
                    });
                  } else {
                    replypostMandrill.name = obj.name;
                    name = obj.name;
                    excuteQuery.queryForAll(sqlQueryMap['getUserEmailForMentions'], [obj.entity_id, obj.entity_id, obj.entity_id, null], function(err, resultuser) {
                      if (err) {
                        callback(new Error(err), null);
                      } else {
                        emaillist = resultuser;
                        var notifiObj = {};
                        notifiObj.entity_id = originalresult[0].entity_id;
                        notifiObj.link_id = obj.in_reply_id;
                        notifiObj.type = 'comment';
                        notifiObj.user_id = obj.suggestid;
                        agenda.now('socket io notifications', notifiObj);

                        replypostMandrill.emaillist = emaillist;
                        //agenda.now('sendEmailForReplyPost', replypostMandrill);
                        mandrillMailObject(obj.mentions, me, name, url, content, emaillist, obj, originalresult, originalposturl);
                      }
                    });
                  }

                }
                //   callback(null);
              });

              //}
            }
          });
        postCallback(null, result);
      },
      countUpdate: function(updateCallback) {
        excuteQuery.update(sqlQueryMap['updateReplyPostCount'], [obj.in_reply_id], updateCallback);
      }
    },
    function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else {
        obj.parentPostId = obj.in_reply_id;
        if (result && result.replyPost) {
          obj.post_id = result.replyPost;
        } else {
          //TODO: Need to check why we need this.
          obj.post_id = 0;
        }
        callback(null, obj);
      }
    });
}


// function sendMailForComment(mention, me, name, url, content, emaillist, obj, originalresult, originalposturl) {

//   me.addMention(mention, function(err, data) {
//     mandrillMailObject(mention, me, name, url, content, emaillist, obj, originalresult, originalposturl);
//   });
// }


function mandrillMailObject(mention, me, name, url, content, userForMentions, obj, originalresult, originalposturl) {
  if (mention && mention.length > 0) {
    var text = mention.text;
  } else {
    var text = name;
  }
  if (originalresult && originalresult.length > 0) {
    if (originalresult[0].headline === null) {
      originalresult[0].headline = '';
    }
    if (originalresult[0].status_type === "share") {
      var type = originalresult[0].status_type;
    } else if (originalresult[0].status_type === "post") {
      var typepost = originalresult[0].status_type;
    }
  } else {
    originalresult[0].headline = '';
  }
  var finalobjectmandril = {};
  finalobjectmandril.from = name + "( via WonderWe ) <noreply@wonderwe.com>";
  if (originalresult && originalresult.length > 0) {
    finalobjectmandril.email = originalresult[0].email;
  } else {
    finalobjectmandril.email = '';
  }
  if (userForMentions && userForMentions.length > 0) {
    var timezone_id = userForMentions[0].timezone_id;
  } else {
    var timezone_id = '';
  }
  finalobjectmandril.text = "";
  finalobjectmandril.subject = name + " commented on a post";
  finalobjectmandril.template_name = "New reply to your post";
  var moment = require('moment-timezone');
  var utilService = require('./weutil.js');
  utilService.getZoneById(timezone_id, function(err, zoneArray) {

    var userTimeZoneDate = '',
      userTimeZoneDateOrizinal = '';
    if (!err && zoneArray.length > 0) {
      userTimeZoneDate = moment.utc(obj.date_posted).tz(zoneArray[0].zone_name);
    } else {
      userTimeZoneDate = moment.utc(obj.date_posted).tz("America/Chicago");
    }

    if (!err && zoneArray.length > 0) {
      userTimeZoneDateOrizinal = moment.utc(originalresult[0].date_posted).tz(zoneArray[0].zone_name);
    } else {
      userTimeZoneDateOrizinal = moment.utc(originalresult[0].date_posted).tz("America/Chicago");
    }
    finalobjectmandril.template_content = [{
      "name": "commentingusername",
      "content": "*|COMMENTING_USER_NAME|*"
    }, {
      "name": "commentinguserurl",
      "content": "*|COMMENTING_USER_URL|*"
    }, {
      "name": "mentionuserimage",
      "content": "*|MENTIONING_USER_IMG|*"
    }, {
      "name": "originaluserimage",
      "content": "*|ORIGINAL_USER_IMG|*"
    }, {
      "name": "originalusername",
      "content": "*|ORIGINAL_USER_NAME|*"
    }, {
      "name": "originalmessagedate",
      "content": "*|ORIGINAL_MESSAGE_DATE|*"
    }, {
      "name": "originalheadline",
      "content": "*|ORIGINAL_HEADLINE|*"
    }, {
      "name": "originalmessage",
      "content": "*|ORIGINAL_MESSAGE|*"
    }, {
      "name": "originalmessageimage",
      "content": "*|ORIGINAL_IMG|*"
    }, {
      "name": "commentingusername",
      "content": "*|COMMENTING_USER_NAME|*"
    }, {
      "name": "messagedate",
      "content": "*|MESSAGE_DATE|*"
    }, {
      "name": "message",
      "content": "*|MESSAGE|*"
    }, {
      "name": "messageimage",
      "content": "*|MESSAGE_IMG|*"
    }, {
      "name": "commentingposturl",
      "content": "*|COMMENTING_POST_URL|*"
    }, {
      "name": "statustype",
      "content": "*|STATUS_TYPE_SHARE|*"
    }, {
      "name": "statustypepost",
      "content": "*|STATUS_TYPE_POST|*"
    }, {
      "name": "parentusername",
      "content": "*|USER_NAME|*"
    }, {
      "name": "parentuserimg",
      "content": "*|USER_IMG|*"
    }];
    finalobjectmandril.merge_vars = [{
      "name": "COMMENTING_USER_NAME",
      "content": name
    }, {
      "name": "COMMENTING_USER_URL",
      "content": props.domain + "/" + obj.commonSlug
    }, {
      "name": "MENTIONING_USER_NAME",
      "content": text
    }, {
      "name": "ORIGINAL_USER_IMG",
      "content": originalresult[0].profile_pic_url
    }, {
      "name": "ORIGINAL_USER_NAME",
      "content": originalresult[0].name
    }, {
      "name": "ORIGINAL_MESSAGE_DATE",
      "content": userTimeZoneDateOrizinal.format('MMMM Do') + " at " + userTimeZoneDateOrizinal.format('h:mm a')
    }, {
      "name": "ORIGINAL_HEADLINE",
      "content": originalresult[0].headline
    }, {
      "name": "ORIGINAL_MESSAGE",
      "content": originalresult[0].content.split('<div class="js-viewCampaign profile-card new-campaign-card')[0]
    }, {
      "name": "ORIGINAL_IMG",
      "content": originalresult[0].image_url
    }, {
      "name": "MENTIONING_USER_IMG",
      "content": obj.mentioningimage
    }, {
      "name": "MESSAGE_DATE",
      "content": userTimeZoneDate.format('MMMM Do') + " at " + userTimeZoneDate.format('h:mm a')
    }, {
      "name": "MESSAGE",
      "content": content.split('<div class="js-viewCampaign profile-card new-campaign-card')[0]
    }, {
      "name": "MESSAGE_IMG",
      "content": obj.image_url
    }, {
      "name": "COMMENTING_POST_URL",
      "content": props.domain + "/pages/" + obj.commonSlug + "/posts/" + obj.parentPostId
    }, {
      "name": "STATUS_TYPE_SHARE",
      "content": type
    }, {
      "name": "STATUS_TYPE_POST",
      "content": typepost
    }, {
      "name": "USER_NAME",
      "content": originalresult[0].parent_creator_name
    }, {
      "name": "USER_IMG",
      "content": originalresult[0].parent_creator_pic
    }];

    utility.mandrillTemplate(finalobjectmandril, function(err, result) {
      if (err) {
        //callback(err);
      } else {
        //callback(null, result);
      }
    });
  });
}



exports.getUsersForMentions = function(callback) {
  excuteQuery.queryForAll(sqlQueryMap['getAllUsers'], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

/**
 * Takes the UserID/Charity and Gets the Feed with Replies. Implement the Caching using Redis and That way we can avoid the Round Trips to Database.
 * @param  {[type]}   obj      UserID and Skip will come as fields.
 * @param  {Function} callback CallBack to Send the Result or Error to Route
 * @return {[type]}            It retunrs the posts with relies.
 */
exports.postAndReplies = function(obj, callback) {

  //Get Redis Client - Store the Key feed:obj.userId:obj.skip
  var key = "feed:" + obj.entityId + ":" + obj.skip;
  redisClient.get(key, function(err, data) {
    if (data) {
      callback(null, JSON.parse(data).feedswithreplies);
    } else {
      var replyArray = [];

      excuteQuery.queryForAll(sqlQueryMap['feedList'], [parseInt(obj.entityId), parseInt(obj.skip)], function(err, rows) {
        if (err) {
          callback(new Error(err), null);
        } else {
          async.eachSeries(rows, function(singleObj, eachCallback) {

            var resObj = singleObj;
            var status_type = 'reply';
            excuteQuery.queryForAll(sqlQueryMap['getAllRetweetsOrReplys'], [singleObj.post_id, status_type, singleObj.post_id, status_type], function(err, postReply) {
              if (err) {
                callback(new Error(err), null);
                //callback(err);
              } else {
                resObj.replies = postReply;
                replyArray.push(resObj);
                eachCallback(null);
              }
            });
          }, function(err) {
            if (!err) {
              redisClient.set(key, JSON.stringify({
                "feedswithreplies": replyArray
              }), function() {
                utility.log('info', "Sets the Data in Redis :" + key);
              });
              var expires = moment().add(60, 'minutes').valueOf();
              redisClient.expire(key, expires, function() {
                utility.log('info', "Sets the Expiry for the Token: " + key);
              });
              callback(null, replyArray);
            } else {
              callback(err, null);
            }
          });
        }
      });
    }
  });

}
exports.commonFeed = function(obj, callback) {
  if (obj.followers && obj.followers === 'true') {
    excuteQuery.queryForAll(sqlQueryMap['postsIncludingFollowers'], [obj.entityId, obj.entityId, parseInt(obj.skip)], function(err, rows) {
      if (err) {
        callback(new Error(err), null);
      } else {
        callback(null, rows);
      }
    });

  } else {
    excuteQuery.queryForAll(sqlQueryMap['postsByEntity'], [obj.entityId, parseInt(obj.skip), obj.entityId, parseInt(obj.skip)], function(err, rows) {
      if (err) {
        callback(new Error(err), null);
      } else {
        callback(null, rows);
      }
    });
  }
}
exports.getCharityMentionsandReply = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['memtion_id'], [obj.charityId, obj.charityId], function(err, mentionRows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      var array = [];
      async.eachSeries(mentionRows, function(singleObj, eachCallback) {

        var obj = singleObj;
        var postId = singleObj.post_id;

        var status_type = 'reply';
        excuteQuery.queryForAll(sqlQueryMap['getAllRetweetsOrReplys'], [postId, status_type, postId, status_type], function(err, rows) {
          if (err) {
            callback(err);
          } else {
            obj.replies = rows;
            array.push(obj);
            eachCallback(null);
          }
        });
      }, function(err) {
        if (!err) {
          callback(null, array);
        } else {
          callback(err);
        }
      });
    }
  });

}

exports.getCodeMentionsandReply = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['mentionsForTheCampaigns'], [obj.codeid], function(err, mentionRows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      var array = [];
      async.eachSeries(mentionRows, function(singleObj, eachCallback) {

        var obj = singleObj;
        var postId = singleObj.post_id;

        var status_type = 'reply';
        excuteQuery.queryForAll(sqlQueryMap['getAllRetweetsOrReplys'], [postId, status_type, postId, status_type], function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {
            obj.replies = rows;
            array.push(obj);
            eachCallback(null);
          }
        });
      }, function(err) {

        if (!err) {
          callback(null, array);
        } else {
          callback(err, null);
        }
      });
    }
  });
}

exports.getHashtagData = function(hashtag, callback) {
  excuteQuery.queryForAll(sqlQueryMap['gethashtagdata'], [hashtag, hashtag], function(err, hashtag) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, hashtag);
    }
  });
}

exports.getHashtagAccounts = function(hashtag, userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['gethashtagaccounts'], [userId, hashtag, userId, hashtag, userId, hashtag], function(err, hashtag) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, hashtag);
    }
  });
}

exports.getPostPageFeed = function(postId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['postpagequery'], [postId], function(err, feed) {
    if (err) {
      callback(new Error(err), null);
    } else {
      /*var post = {};
      post.id = postId;
      post.postandcomments = rows;
      callback(null, post);*/
      callback(null, feed);
    }
  });
}
