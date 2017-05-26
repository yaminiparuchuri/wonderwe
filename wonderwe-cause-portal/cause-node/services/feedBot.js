var postServices = require('./feed');

/**
 * To Post a notification in WonderWe Bot when campaing reaches cartain Thresholds
 * 15%  25%  50%  75%  100%
 *  1    2    3    4     5
 * Numbers represents a Notification sent or not for a certain Thresholds
 */
exports.campaignReachedThresholds = function(obj, callback) {

  async.parallel({
    campaingDetails: function(campaignCallback) {
      excuteQuery.queryForAll(sqlQueryMap['campaignThresholds'], [obj.code_id], campaignCallback);
    },
    botDetails: function(botCallback) {
      excuteQuery.queryForAll(sqlQueryMap['botDetails'], [props.botId], botCallback);
    }
  }, function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      var campaignDetails = result.campaingDetails;
      var botDetails = {};
      if (result.botDetails && result.botDetails.length > 0) {
        botDetails = result.botDetails[0];
      }

      if (campaignDetails && (campaignDetails.length > 0)) {

        var details = campaignDetails[0];

        if (details.donation_progress > 14.9) {

          var postObj = {
            mentioningimage: details.mentioningimage,
            name: botDetails.name,
            title: botDetails.title,
            // charityId: details.charityId,
            headline: null,
            entity_id: botDetails.entity_id,
            // content: 'Hey your campaign We#' + details.code_text + ' has reached ' + percent + '% of the total goal!',
            image_url: null,
            city: botDetails.city,
            state: details.state,
            status_type: 'post',
            commonSlug: botDetails.commonSlug,
            mentions: [],
            ip_address: obj.ip,
            hostname: null,
            date_deleted: null,
            deleted_by: null,
            date_posted: moment.utc().toDate(),
            mentions: [{
              slug: details.codeSlug,
              image: details.code_picture_url,
              title: details.code_text,
              suggestedname: details.codeTitle,
              suggestid: details.code_id,
              entityId: details.codeEntityId,
              type: 'code',
              index: 33
            }],
          };
          /*if (!details.charityId) {
            postObj.mentioneduserID = details.mentioneduserID;
          } else {
            postObj.charityId = details.charityId;
          }*/
          postObj.mentioneduserID = botDetails.user_id;

          var donation_progress = details.donation_progress;
          var percent, submitNotification, notificationValue;


          // Here we are differenciating the data to percentage with number to send a notification
          // 15%, 25%, 50%, 75%, 100%
          // 1     2    3    4    5
          if (donation_progress >= 15 && donation_progress < 25) {
            percent = 15;
            if (details.progress_notifications == 1) {
              callback(null, 'Already sent a notification');
            } else {
              submitNotification = 'yes';
              notificationValue = 1;
            }
          } else
          if (donation_progress >= 25 && donation_progress < 50) {
            percent = 25;

            if (details.progress_notifications == 2) {
              callback(null, 'Already sent a notification');
            } else {
              submitNotification = 'yes';
              notificationValue = 2;
            }

          } else if (donation_progress >= 50 && donation_progress < 75) {
            percent = 50;
            if (details.progress_notifications == 3) {
              callback(null, 'Already sent a notification');
            } else {
              submitNotification = 'yes';
              notificationValue = 3;
            }
          } else if (donation_progress >= 75 && donation_progress < 100) {
            percent = 75;
            if (details.progress_notifications == 4) {
              callback(null, 'Already sent a notification');
            } else {
              submitNotification = 'yes';
              notificationValue = 4;
            }
          } else if (donation_progress >= 100) {
            percent = 100;
            if (details.progress_notifications == 5) {
              callback(null, 'Already sent a notification');
            } else {
              submitNotification = 'yes';
              notificationValue = 5;
            }
          }

          if (submitNotification == 'yes') {
            postObj.content = 'Congratulations! The fundraiser, We#' + details.code_text + ' reached ' + percent + '% of the total goal!';
            submitNotificationPost(postObj, obj.code_id, notificationValue, callback)
          } else {
            callback(null, 'No notification to submit');
          }
        } else {
          callback(null, 'Less than 15%');
        }
      } else {
        callback(null, 'CodeId is wrong or something wrong with data');
      }
    }
  });
};

function submitNotificationPost(postObj, code_id, notificationValue, callback) {
  console.log('submitNotificationPost');
  postObj.feedbot=true;
  postServices.postFeed(postObj, function(err, result4) {
    callback(null, result4);
    pool.query('UPDATE code_tbl SET progress_notifications =? WHERE id=?', [notificationValue, code_id], function(err, updateResult) {});
  });
}


/**
 * WonderWe bot will get a notification when campaign updated
 * [campaignUpdateNotifications description]
 * @param  {[type]}   obj      [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
exports.campaignUpdateNotifications = function(obj, callback) {

  async.parallel({
    campaingDetails: function(campaignCallback) {
      excuteQuery.queryForAll(sqlQueryMap['campaignThresholds'], [obj.code_id], campaignCallback);
    },
    botDetails: function(botCallback) {
      excuteQuery.queryForAll(sqlQueryMap['botDetails'], [props.botId], botCallback);
    }
  }, function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      var campaignDetails = result.campaingDetails;
      var botDetails = {};
      if (result.botDetails && result.botDetails.length > 0) {
        botDetails = result.botDetails[0];
      }

      if (campaignDetails && (campaignDetails.length > 0)) {

        var details = campaignDetails[0];

        var postObj = {
          mentioningimage: botDetails.mentioningimage,
          name: botDetails.name,
          title: botDetails.title,
          // charityId: details.charityId,
          headline: null,
          entity_id: botDetails.entity_id,
          // content: 'Hey your campaign We#' + details.code_text + ' has reached ' + percent + '% of the total goal!',
          image_url: null,
          city: botDetails.city,
          state: botDetails.state,
          status_type: 'post',
          commonSlug: botDetails.commonSlug,
          mentions: [],
          ip_address: obj.ip,
          hostname: null,
          date_deleted: null,
          deleted_by: null,
          date_posted: moment.utc().toDate(),
          mentions: [{
            slug: details.codeSlug,
            image: details.code_picture_url,
            title: details.code_text,
            suggestedname: details.codeTitle,
            suggestid: details.code_id,
            entityId: details.codeEntityId,
            type: 'code',
            index: 15
          }]
        };

        // TODO: Just added the temporary Content and Need to update later
        obj.description = 'New update for We#' + details.code_text + ': </br></br>' + obj.description;
        postObj.content = obj.description;
        /*if (!details.charityId) {
          postObj.mentioneduserID = details.mentioneduserID;
        } else {
          postObj.charityId = details.charityId;
        }*/
        postObj.mentioneduserID = botDetails.user_id;
        console.log(postObj);
        postServices.postFeed(postObj, callback);
      } else {
        callback(null, 'Something wrong with data');
      }
    }
  });
};


/**
 * Method is to send a notification to WonderWe bot when some one follows a campaign
 * code_id and botId, those 2 inputs are required to run this API
 */
exports.campaignFollowsNotifications = function(obj, user_id, callback) {

  async.parallel({
    campaingDetails: function(campaignCallback) {
      excuteQuery.queryForAll(sqlQueryMap['campaignThresholds'], [obj.code_id], campaignCallback);
    },
    botDetails: function(botCallback) {
      excuteQuery.queryForAll(sqlQueryMap['botDetails'], [props.botId], botCallback);
    }
  }, function(err, result) {
    console.log(err);

    if (err) {
      callback(new Error(err), null);
    } else {

      var campaignDetails = result.campaingDetails;

      if (campaignDetails && campaignDetails.length > 0) {

        var details = campaignDetails[0];
        var botDetails = {};
        if (result.botDetails && result.botDetails.length > 0) {
          botDetails = result.botDetails[0];
        }

        excuteQuery.queryForAll(sqlQueryMap['userDetails'], [user_id, user_id], function(err, result2) {
          if (err) {
            callback(new Error(err), null);
          } else {

            if (result2 && result2.length > 0) {

              var userResult = result2[0];

              var postObj = {
                mentioningimage: botDetails.mentioningimage,
                name: botDetails.name,
                title: botDetails.title,
                // charityId: details.charityId,
                headline: null,
                entity_id: botDetails.entity_id,
                // content: 'Hey your campaign We#' + details.code_text + ' has reached ' + percent + '% of the total goal',
                image_url: null,
                city: botDetails.city,
                state: botDetails.state,
                status_type: 'post',
                commonSlug: botDetails.commonSlug,
                mentions: [],
                ip_address: obj.ip,
                hostname: null,
                date_deleted: null,
                deleted_by: null,
                date_posted: moment.utc().toDate(),
                mentions: [{
                  slug: userResult.userSlug,
                  image: userResult.profile_pic_url,
                  suggestedname: userResult.name,
                  suggestid: userResult.id,
                  entityId: userResult.entityid,
                  type: 'user',
                  index: 0
                }, {
                  slug: details.codeSlug,
                  image: details.code_picture_url,
                  title: details.code_text,
                  suggestedname: details.codeTitle,
                  suggestid: details.code_id,
                  entityId: details.codeEntityId,
                  type: 'code',
                  index: userResult.name.length + 35
                }]
              };
              obj.description = userResult.name + ' is now following We#' + details.code_text;
              postObj.content = obj.description;
              /*if (!details.charityId) {
                postObj.mentioneduserID = details.mentioneduserID;
              } else {
                postObj.charityId = details.charityId;
              }*/
              postObj.mentioneduserID = botDetails.user_id;
              console.log(postObj);
              postServices.postFeed(postObj, callback);
            } else {
              callback(null, 'Something wrong with user_id!  We could not find any data');
            }
          }
        });
      } else {
        callback(null, 'CodeId is wrong or something wrong with the data');
      }
    }
  });
};
