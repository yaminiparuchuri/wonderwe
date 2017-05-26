var donorService = require('../services/donors')
var feedServices = require('../services/feed')
var seoServices = require('../services/seo');
var teamService = require('../services/team')
exports.publicUserProfile = function(req, res, next) {
  var userId = req.params.userId
  var entityId = req.query.entityId
  var flag = req.query.flag
  var mobileLoginDonorId = req.query.logindonorid
  var countdown = require('countdown')
  var momentCountdown = require('moment-countdown')
  if (req.query.logindonorid || mobileLoginDonorId) {
    if (mobileLoginDonorId) {
      var user_id = mobileLoginDonorId
    } else {
      var user_id = req.query.logindonorid
    }
  } else {
    var user_id = ''
  }
  async.parallel({
    userDetails: function(callback) {
      donorService.userFullDetails(userId, entityId, callback)
    },
    numberOfPosts: function(callback) {
      donorService.numberOfDonorPosts(userId, callback)
    },
    numberOfFollowers: function(callback) {
      donorService.numberOfFollowers(userId, callback)
    },
    numberOfFollowing: function(callback) {
      donorService.numberOfFollowing(userId, callback)
    },
    numberOfPeopleFollowing: function(callback) {
      donorService.numberOfPeopleFollowing(userId, callback)
    },
    numberOfOrgsFollowing: function(callback) {
      donorService.numberOfOrgsFollowing(userId, callback)
    },
    numberOfCamFollowing: function(callback) {
      donorService.numberOfCamFollowing(userId, callback)
    },
    userPosts: function(callback) {
      donorService.donorUserPosts(userId, callback)
    },
    followingOrgs: function(callback) {
      if (flag == 'mobilepubliccharity') {
        donorService.getDonorFollowingOrganizations(entityId, userId, callback)
      } else {
        callback(null, []);
      }
    },
    followingCampaigns: function(callback) {
      if (flag == 'mobilepubliccharity') {
        donorService.getUserFollowingCampaigns(entityId, userId, function(err, campaignResult) {
          if (err) {
            callback(err, null);
          } else {
            async.each(campaignResult, function(singleObj, eachCallback2) {
              donorService.getCharityCategories(singleObj, function(err, categoryresult) {
                singleObj.group_title = categoryresult;
                eachCallback2(null);
              });
            }, function(err) {
              callback(null, campaignResult);
            });
          }
        })
      } else {
        callback(null, []);
      }
    },
    followingPeoples: function(callback) {
      if (flag == 'mobilepubliccharity') {
        donorService.getUserFollowingPeoples(entityId, userId, callback)
      } else {
        callback(null, []);
      }
    },
    followerPeoples: function(callback) {
      if (flag == 'mobilepubliccharity') {
        donorService.getUserFollowerPeoples(userId, entityId, callback)
      } else {
        callback(null, []);
      }
    },
    fundraisecampaigns: function(callback) {
      if (flag == 'mobilepubliccharity') {
        donorService.getFundraiseCampaigns(user_id, userId, callback)
      } else {
        callback(null, []);
      }
    },
    videoData: function(callback) {
      if (req.query.openVideo) {
        donorService.getCampaignVideo(req.query.openVideo, callback);
      } else {
        callback(null, null);
      }
    },
    donorTeams: function(teamCallback) {
      donorService.getDonorTeams(user_id, userId, teamCallback)
    },
    userTeams: function(callback) {
      teamService.getMyTeams(userId, null, null, callback)
    }
  }, function(err, result) {
    if (err) {
      if (err.flag) {
        //loggermessage(req, 'error', err, 'userIdValidations....1..validator.js ')
        utility.appErrorHandler(err, res)
      } else {
        //loggermessage(req, 'error', err, 'donorProfile....1..routes/donors.js ')
        utility.appErrorHandler(err, res)
      }
    } else {

      // Send 200 Status With Real Data
      //var subCount = result.numberOfCamFollowing.noofcamfollowing - result.followingCampaigns.length;

      var obj = {}
      if (!result.videoData || result.videoData.length === 0) {
        delete result['videoData'];
      } else {
        obj.videoData = result.videoData[0];
      }
      if (!req.cookies.token) {
        obj.donornav = "signUpModule";
      }

      obj.fundraisecampaigns = result.fundraisecampaigns;
      obj.nooffundraisecampaigns = result.fundraisecampaigns.length;
      obj.totalFundraisersCount = result.fundraisecampaigns.length + result.donorTeams.length + result.userTeams.length;
      //obj.totalFundraisersCount = result.fundraisecampaigns.length + result.donorTeams.length;
      obj.user = result.userDetails;
      obj.numfollowing = result.numberOfFollowing.nooffollowing;
      // obj.numfollowing = result.numberOfFollowing.nooffollowing - subCount;
      obj.numfollowers = result.numberOfFollowers.nooffollowers
        // obj.numfollowing = result.numberOfFollowing.nooffollowing - subCount;
      obj.numPeopleFollowing = result.numberOfPeopleFollowing.noofpeoplefollowing
      obj.numOrgsFollowing = result.numberOfOrgsFollowing.nooforgsfollowing
      obj.numCamFollowing = result.numberOfCamFollowing.noofcamfollowing; //result.numberOfCamFollowing.noofcamfollowing

      //obj.numCamFollowing = result.followingCampaigns.length; //result.numberOfCamFollowing.noofcamfollowing
      obj.numPosts = result.numberOfPosts.noofposts
      if (result.donorTeams && result.donorTeams.length > 0) {
        obj.teams = result.donorTeams;
      }
      obj.teamsCount = result.donorTeams.length;
      obj.userTeams = result.userTeams
      obj.numOfTeams = result.userTeams.length;
      obj.campaigns = result.followingCampaigns
      for (var i in result.followerPeoples) {
        result.followerPeoples[i].sessionuserid = parseInt(req.query.logindonorid)
      }
      for (var i in result.followingPeoples) {
        result.followingPeoples[i].sessionuserid = parseInt(req.query.logindonorid)
      }
      for (var i in obj.campaigns) {
        obj.campaigns[i].donation = numeral(obj.campaigns[i].donation).format('0,0')
        obj.campaigns[i].goal = numeral(obj.campaigns[i].goal).format('0,0')
        if (obj.campaigns[i].status === 'draft') {
          obj.campaigns[i].draftCampaign = 'draft'
        }
        if (obj.campaigns[i].code_type == 'event') {
          var now = moment().toDate();
          var campaignNotExpired = moment(obj.campaigns[i].end_date).isAfter(now); // will return true if the campaign's end date is in the future
          var campaignExpiredToday = moment(obj.campaigns[i].end_date).isSame(now, 'day');
          if (campaignNotExpired || campaignExpiredToday) {
            obj.campaigns[i].daysRemaining = moment().countdown(obj.campaigns[i].end_date, countdown.DAYS, 2).toString(); // '301 days'
            obj.campaigns[i].daysRemaining = obj.campaigns[i].daysRemaining.replace("days", ""); // remove the label
          } else {
            obj.campaigns[i].time_left = -1;
            obj.campaigns[i].status = "preview";
          }
        }
      }
      for (var i in obj.fundraisecampaigns) { // loop through all fundraisers for the user
        obj.fundraisecampaigns[i].donation = numeral(obj.fundraisecampaigns[i].donation).format('0,0')
        obj.fundraisecampaigns[i].goal = numeral(obj.fundraisecampaigns[i].goal).format('0,0')
        if (obj.fundraisecampaigns[i].status === 'draft') {
          obj.fundraisecampaigns[i].draftCampaign = 'draft'
        }

        if (obj.fundraisecampaigns[i].type == 'event') { // if it is not ongoing, make dates pretty
          var now = moment().toDate();
          var campaignNotExpired = moment(obj.fundraisecampaigns[i].end_date).isAfter(now); // will return true if the campaign's end date is in the future
          var campaignExpiredToday = moment(obj.fundraisecampaigns[i].end_date).isSame(now, 'day');
          if (campaignNotExpired || campaignExpiredToday) {
            obj.fundraisecampaigns[i].daysRemaining = moment().countdown(obj.fundraisecampaigns[i].end_date, countdown.DAYS, 2).toString(); // '301 days'
            obj.fundraisecampaigns[i].daysRemaining = obj.fundraisecampaigns[i].daysRemaining.replace("days", ""); // remove the label
          } else {
            obj.fundraisecampaigns[i].time_left = -1;
            obj.fundraisecampaigns[i].status = "preview";
          }
        }
      }


      obj.peoplefollowers = result.followerPeoples
      obj.peopleFollowing = result.followingPeoples
      obj.userPosts = result.userPosts
      obj.orgList = result.followingOrgs
      obj.entityid = obj.user.entityid
      obj.shareObject = {}
      obj.shareObject.url = encodeURI(props.domain + '/' + obj.user.userSlug); // '/pages/user/profile/' + userId)
      obj.shareObject.name = encodeURI(obj.user.name)
      obj.shareObject.via = 'wonderweapp';

      if (obj.user && obj.user.description) {
        obj.shareObject.description = obj.user.description.replace(/(<([^>]+)>)/ig, '')
      } else {
        obj.shareObject.description = ''
      }
      obj.imageId = obj.user.id
      obj.imageType = 'user'
      obj.from = 'donor'
        /*if (req.cookies.loadFrom != 'charity' && req.cookies.token) {
          obj.donornav = 'donor'
        } else if (req.cookies.loadFrom == 'charity' && req.cookies.token) {
          obj.charitynav = 'a'
        } else {
          obj.nav = ''
        }*/
      if (result.userDetails.id == req.query.logindonorid) {
        obj.accountUser = true
      } else {
        obj.accountUser = false
      }
      obj.fullfooter = 'true';
      obj.layout = 'pages'
        // obj.accountUser = false
      obj.image = obj.user.profile_pic_url
      obj.type = 'website'
      obj.description = obj.shareObject.description
      obj.title = obj.user.name
      obj.pagetitle = obj.user.name
      obj.stripe_publishable_key = props.stripe_publishable_key
      obj.analyticsid = props.analyticsid;
      obj.ziggeoToken = props.videoToken;
      if (obj.user && obj.user.date_created) {
        obj.date_created = moment(obj.user.date_created).format('MMM YYYY')
      }

      // Send 200 Status With Real Data
      if (flag == 'mobilepubliccharity') {
        res.send(obj)
      } else {
        //obj.domain = props.domain;
        obj.metadata = seoServices.seoMetaDataUtility('user', obj);
        res.render('./pages/userprofilepage', obj)
      }
    }
  })

}

exports.publicCharityProfile = function(req, res, next) {
  var charityId = req.params.charityId
  var donatePopup = req.query.donate;
  var countdown = require('countdown')
  var momentCountdown = require('moment-countdown')
  var flag = req.query.flag
  var mobileLoginDonorId = req.query.logindonorid
  if (req.query.logindonorid || mobileLoginDonorId) {
    if (mobileLoginDonorId) {
      var user_id = mobileLoginDonorId
    } else {
      var user_id = req.query.logindonorid
    }
  } else {
    var user_id = ''
  }
  async.parallel({
    charityData: function(callback) {
      donorService.charityInfo(charityId, user_id, callback)
    },
    numberOfPosts: function(callback) {
      donorService.numberOfCharityPosts(charityId, callback)
    },
    numberOfFollowers: function(callback) {
      donorService.numberOfCharityFollowers(charityId, callback)
    },
    numberOfCampaigns: function(callback) {
      donorService.numberOfCampaigns(charityId, callback)
    },
    charityDonors: function(callback) {
      donorService.getCharityDonars(charityId, callback)
    },
    // numberOfCharityCampaigns: function(callback) {
    //   donorService.numberOfCharityCampaigns(charityId, callback)
    // },
    charityPosts: function(callback) {
      donorService.charityPosts(charityId, callback)
    },
    charityCampaigns: function(callback) {
      donorService.charityCampaigns(charityId, user_id, function(err, charityCampaigns) {
        if (err) {
          callback(err, null);
        } else {
          async.each(charityCampaigns, function(singleObj, eachCallback2) {
            donorService.getCharityCategories(singleObj, function(err, categoryresult) {
              singleObj.group_title = categoryresult;
              eachCallback2(null);
            });
          }, function(err) {
            callback(null, charityCampaigns);
          });
        }
      });
    },
    charityFollowers: function(callback) {
      if (flag == 'mobilepubliccharity') {
        donorService.charityFollowers(charityId, user_id, callback)
      } else {
        callback(null, []);
      }
    },
    charityManaged: function(callback) {
      donorService.isItManaged(charityId, callback)
    },
    charityAdmins:function(callback){
    donorService.charityAdmins(charityId,callback)
    },
    videoData: function(callback) {
      if (req.query.openVideo) {

        donorService.getCampaignVideo(req.query.openVideo, callback);
      } else {
        callback(null, null);
      }
    }
  }, function(err, result) {

    if (err) {
      if (err.flag) {
        utility.appErrorHandler(err, res)
      } else {
        utility.appErrorHandler(err, res)
      }
    } else {
      if (!result.charityData) {
        res.redirect('/404');
      } else {
        var object = {}
        if (!result.videoData || result.videoData.length === 0) {
          delete result['videoData'];
        } else {
          object.videoData = result.videoData[0];
        }
        if (!req.cookies.token) {
          object.donornav = "signUpModule";
        }

        object.charityInfo = result.charityData
        object.donors = result.charityDonors;
        for (var i in object.donors) {
          if (object.donors.length < 5) {
            object.moreDonorsExist = false
          } else {
            object.moreDonorsExist = true
          }
          if (object.donors[i] && object.donors[i].created_date) {
            object.donors[i].created_date = moment.utc(object.donors[i].created_date).fromNow();
          }
          if (object.donors[i] && object.donors[i].transaction_date) {
            object.donors[i].transaction_date = moment.utc(object.donors[i].transaction_date).fromNow();
          }

          object.donors[i].amount = numeral(object.donors[i].amount).format('0,0');
          //setting the flag to donors data
          if (object.donors[i].hide_amount == 'yes' && object.donors[i].anonymous == 'yes') {
            object.donors[i].donorflag = 'anonymous'
          }
          if (object.donors[i].hide_amount == 'yes' && object.donors[i].anonymous == 'no') {
            object.donors[i].donorflag = 'nameonly'
          }
          if (object.donors[i].hide_amount == 'no' && object.donors[i].anonymous == 'yes') {
            object.donors[i].donorflag = 'amountonly'
          }
          if (object.donors[i].hide_amount == 'no' && object.donors[i].anonymous == 'no') {
            object.donors[i].donorflag = 'nameandamount'
          }
          if (object.donors[i].hide_amount != 'no') {
            object.donors[i].amount = ''
            object.donors[i].hide_amount_class = 'hidden'
          }
          if (object.donors[i].anonymous != 'no') {
            object.donors[i].name = 'Anonymous'
            object.donors[i].profile_pic_url = 'https://wonderwe.s3.amazonaws.com/profile/002640b0-1680-4988-b67e-ed7f727e27f6-default-userpng.png'
          } else {
            object.donors[i].donor_name = 'show'
          }
        }
        object.facebook_app_id = props.facebook_client_id
        object.domain = props.domain;
        object.numOfPosts = result.numberOfPosts.count
        object.numOfFollowers = result.numberOfFollowers.count
        object.numOfCampaigns = result.charityCampaigns.length; //result.numberOfCampaigns.count
        object.posts = result.charityPosts
        object.followers = result.charityFollowers
        object.campaigns = result.charityCampaigns
        object.sessionid = user_id
          // if(result.numberOfCharityCampaigns.campcount){
          // object.numberOfCharityCampaigns = result.numberOfCharityCampaigns.campcount
          // }else{
          // object.numberOfCharityCampaigns = 0;
          // }
        object.charityInfo.suggested_donation = 0;
        // object.numberOfCharityCampaigns = result.numberOfCharityCampaigns.campcount;
        console.log("in org profile");
        console.log(object.numberOfCharityCampaigns);
        object.donatePopup = donatePopup;
        for (var i in object.followers) {
          object.followers[i].sessionid = parseInt(req.query.logindonorid)
        }
        object.shareObject = {}
        object.shareObject.url = encodeURI(props.domain + '/' + object.charityInfo.slug); // '/pages/organization/' + charityId)
        object.shareObject.name = encodeURI(object.charityInfo.name_tmp)
        object.shareObject.via = 'wonderweapp'
        if (object.charityInfo && object.charityInfo.full_description) {
          object.shareObject.description = object.charityInfo.full_description.replace(/(<([^>]+)>)/ig, '')
        } else {
          object.shareObject.description = ''
        }
        for (var i in object.campaigns) {
          object.campaigns[i].donation = numeral(object.campaigns[i].donation).format('0,0')
          object.campaigns[i].goal = numeral(object.campaigns[i].goal).format('0,0')
          if (object.campaigns[i].donation_progress >= 100) {
            object.campaigns[i].donation_progress = 100
          }
          if (object.campaigns[i].type == 'event') {
            var now = moment().toDate();
            var campaignNotExpired = moment(object.campaigns[i].end_date).isAfter(now); // will return true if the campaign's end date is in the future
            var campaignExpiredToday = moment(object.campaigns[i].end_date).isSame(now, 'day');

            if (campaignNotExpired || campaignExpiredToday) {
              daysRemaining = moment().countdown(object.campaigns[i].end_date, countdown.DAYS, 2).toString(); // '301 days'
              if (daysRemaining)
                object.campaigns[i].daysRemaining = daysRemaining.match(/\d+/g) // regex to strip out the text and only show the number
              else {
                object.campaigns[i].daysRemaining = 0; // regex to strip out the text and only show the number
              }
            } else {
              object.campaigns[i].time_left = -1;
              object.campaigns[i].status = "preview";

            }

          }
        }
        var charityAdmins = [];
      if (result.charityAdmins && result.charityAdmins.length > 0) {
        charityAdmins = underscore.pluck(result.charityAdmins, 'user_id')
        object.charityAdmins=charityAdmins;
      }

        if (object.charityInfo.web_url === 'http://') {
          object.charityInfo.web_url = null;
        }

        if (object.charityInfo && object.charityInfo.date_created) {
          object.charityInfo.date_created = moment(object.charityInfo.date_created).format('MMM YYYY')
        }

        if (result.charityManaged[0].noofadmins > 0) {
          object.notmanaged = false
        } else {
          object.notmanaged = true
        }
        object.loadForm = 'charity'
        object.entityid = object.charityInfo.entityid
        object.from = 'donor'
        object.pagetitle = object.charityInfo.name_tmp
        object.type = 'website'
        object.image = object.charityInfo.profile_pic_url
        object.description = object.shareObject.description
        object.imageId = object.charityInfo.id
        object.imageType = 'charity'

        /*if (req.cookies.loadFrom != 'charity' && req.cookies.token) {
          object.donornav = 'donor'
        } else if (req.cookies.loadFrom == 'charity' && req.cookies.token) {
          object.charitynav = 'a'
        } else {
          object.nav = ''
        }*/
        object.referrer = req.headers.referrer;
        object.fullfooter = 'true';
        object.layout = 'pages';
        object.stripe_publishable_key = props.stripe_publishable_key
        object.ziggeoToken = props.videoToken;
        object.analyticsid = props.analyticsid;
        object.jsonObject = JSON.stringify(object);

        object.metadata = seoServices.seoMetaDataUtility('organization', object);

        //Send 200 Status With Real Data
        if (flag == 'mobilepubliccharity') {
          res.send(object)
        } else {
          res.render('./pages/organizationprofile', object)
        }
      }
    }
  })
}

//team profile view
exports.publicTeamProfile = function(req, res, next) {
  var flag = req.query.flag;
  var countdown = require('countdown')
  var momentCountdown = require('moment-countdown')
  var teamId = req.params.team_id;
  async.parallel({
    teamDetails: function(callback) {
      teamService.getTeamDetails(teamId, callback)
    },
    noOfFundraisers: function(callback) {
      teamService.getTeamFundraisers(teamId, callback)
    },
    teamMembers: function(callback) {
      teamService.getTeamMembers(teamId, callback)
    },
    getEntityOfTeam: function(callback) {
      teamService.getTeamEntites(teamId, callback)
    },
    getMainCampaignInfo: function(callback) {
      teamService.getMainCampaignInfo(teamId, callback)
    },
    getTeamAdmins: function(callback) {
      teamService.getTeamAdmins(teamId, callback)
    }
  }, function(err, result) {
    if (err) {
      res.redirect('/404')
    } else {
      var teamObj = {};
      console.log(result.teamDetails);
      teamObj.teamDetails = result.teamDetails;
      teamObj.teamFundraisers = result.noOfFundraisers;
      teamObj.teamMembersDetails = result.teamMembers;
      teamObj.getEntityOfTeam = result.getEntityOfTeam;
      teamObj.amount = result.getEntityOfTeam[0].noof_donations;
      teamObj.donors = result.getEntityOfTeam[0].noof_donors;
      teamObj.teamid = teamId;
      teamObj.campaignInfo = result.getMainCampaignInfo[0];
      teamObj.fullfooter = 'true';
      teamObj.layout = "pages";
      teamObj.metadata = seoServices.seoMetaDataUtility('team', teamObj);
      var url = props.domain + '/' + teamObj.getEntityOfTeam[0].slug
      console.log(teamObj.getEntityOfTeam[0].slug)
      teamObj.twitterUrl = "https://twitter.com/intent/tweet/?text=" + teamObj.teamDetails.team_name + "&url=" + url + "&via=WonderWe";
      teamObj.fbUrl = "https://www.facebook.com/sharer/sharer.php?u=" + url;
      teamObj.gpUrl = "https://plus.google.com/share?url=" + url + "&media=" + teamObj.teamDetails.team_logo;
      teamObj.pinUrl = "https://www.pinterest.com/pin/create/button/?url=" + url + "&media=" + teamObj.teamDetails.team_logo + "&description=" + teamObj.teamDetails.team_description;
      if (teamObj.campaignInfo) {
        var now = moment().toDate();
        var campaignNotExpired = moment(teamObj.campaignInfo.end_date).isAfter(now);
        var campaignExpiredToday = moment(teamObj.campaignInfo.end_date).isSame(now, 'day');
        if (campaignNotExpired || campaignExpiredToday) {
          teamObj.campaignInfo.daysRemaining = moment().countdown(teamObj.campaignInfo.end_date, countdown.DAYS, 2).toString();
          teamObj.campaignInfo.daysRemaining = teamObj.campaignInfo.daysRemaining.replace("days", "");
        } else {
          teamObj.campaignInfo.daysRemaining = -1;
          teamObj.campaignInfo.status = "preview";
        }
      }
      var teamCaptainsIds = [];
      if (result.getTeamAdmins && result.getTeamAdmins.length > 0) {
        teamCaptainsIds = underscore.pluck(result.getTeamAdmins, 'userid')
      }
      teamObj.teamCaptainsIds = teamCaptainsIds;
      var result={};
      result.data=teamObj;
      if (flag == 'mobilepubliccharity') {
       utility.dataHandler(result, res);
      } else {
        res.render('./pages/teamview', teamObj)
      }
    }
  });

}

exports.publicEventProfile = function(req, res, next) {
  var eventId = req.params.eventId;
  var countdown = require('countdown')
  var momentCountdown = require('moment-countdown')
  if (req.query.logindonorid) {
    var user_id = req.query.logindonorid
  } else {
    if (req.query.user_id) {
      var user_id = req.query.user_id
    } else {
      var user_id = ''
    }
  }
  async.parallel({
    eventData: function(callback) {
      donorService.eventDetails(eventId, callback)
    },
    eventCreaterData: function(callback) {
      //campaignCharityDetails
      donorService.eventCreaterDetails(eventId, user_id, function(err, charityResult) {

        if (charityResult) {
          callback(null, charityResult);
        } else {

          donorService.fundraiserDetails(eventId, function(err, fundraiseUserResult) {

            if (fundraiseUserResult) {
              var fundraiseUserResult = fundraiseUserResult;
              //res.send(object);
              var charityData = {};
              charityData.currency_symbol = fundraiseUserResult.currency_symbol;
              charityData.currency_code = fundraiseUserResult.currency_code;
              charityData.payment_gateway = fundraiseUserResult.payment_gateway;
              charityData.fundraiser = "yes";
              callback(null, charityData);
            } else {
              var charityData = {};
              callback(null, charityData);
            }
          });
        }
      })
    },
    eventTickets: function(callback) {
      donorService.eventTicketsList(eventId, callback)
    },
    eventShifts: function(callback) {
      donorService.eventShiftsList(eventId, callback)
    },
    eventParticipants: function(callback) {
      donorService.eventParticipantsList(eventId, callback)
    },
    videoData: function(callback) {
      if (req.query.openVideo) {
        donorService.getCampaignVideo(req.query.openVideo, callback);
      } else {
        callback(null, null);
      }
    }
  }, function(err, result) {
    var eventobj = result;
    if (!result.videoData || result.videoData.length === 0) {
      delete result['videoData'];
    } else {
      eventobj.videoData = result.videoData[0];
    }
    /* if (req.cookies.loadFrom != 'charity' && req.cookies.token) {
       eventobj.donornav = 'donor'
     } else if (req.cookies.loadFrom == 'charity' && req.cookies.token) {
       eventobj.charitynav = 'a'
     } else {
       eventobj.nav = ''
     }*/
    eventobj.eventData.filledPer = parseInt((result.eventData.volunteers_filled / result.eventData.volunteers_required) * 100);
    eventobj.eventData.start_date = moment.utc(result.eventData.start_date).format('LL');
    eventobj.eventData.end_date = moment.utc(result.eventData.end_date).format('LL');
    var now = moment().toDate();
    var campaignNotExpired = moment(result.eventData.end_date).isAfter(now); // will return true if the campaign's end date is in the future
    var campaignExpiredToday = moment(result.eventData.start_date).isSame(now, 'day');
    if (campaignNotExpired || campaignExpiredToday) {
      daysRemaining = moment().countdown(result.eventData.end_date, countdown.DAYS, 2).toString(); // '301 days'
      if (daysRemaining)
        eventobj.eventData.time_left = daysRemaining.match(/\d+/g) // regex to strip out the text and only show the number
      else {
        eventobj.eventData.time_left = 0; // regex to strip out the text and only show the number
      }
    } else {
      eventobj.eventData.time_left = -1;
    }
    if (result.eventParticipants && result.eventParticipants.length > 0) {
      for (var i in result.eventParticipants) {
        result.eventParticipants[i].date_signup = moment.utc(result.eventParticipants[i].date_signup).fromNow();
      }
    }
    eventobj.fullfooter = 'true';
    eventobj.layout = "pages";
    if (eventobj.eventData && eventobj.eventData.status === "draft") {
      res.redirect('/404')
    } else {
      res.render('./pages/eventpage', eventobj);
    }
  });
}

//TODO: May be create the API for Mobile Calls to Make it Data Independent

exports.publicCampaignProfileMinimal = function(req, res, next) {
  //If the request from Mobile Return the JSON Data otherwise Render the Page.
  var codeId = req.params.codeId
  var donatePopup = req.query.donate;


  if (!codeId && req.query.codeid) {
    var codeId = req.query.codeid;
  }

  var flag = req.query.flag
  var mobileLoginDonorId = req.query.logindonorid

  //TODO: May be get rid of this in the next version once we make this to the API.
  if (req.cookies.logindonorid || mobileLoginDonorId) {
    if (mobileLoginDonorId) {
      var user_id = mobileLoginDonorId
    } else {
      var user_id = req.cookies.logindonorid
    }
  } else {
    if (req.query.user_id) {
      var user_id = req.query.user_id
    } else {
      var user_id = ''
    }
  }
  //Get the Campaign Data from code_tbl, entity_tbl, charity_tbl, organization_tbl and user_tbl, user_profile_tbl 
  // Get Followers.

  //Let's see is this the Better way of Handling the CallBacks.
  var serviceRequests = {};
  serviceRequests.campaignInfo = function(callback) {
    donorService.getCampaignData(codeId, user_id, callback);
  };
  serviceRequests.followers = function(callback) {
    donorService.campaignFollowersData(codeId, user_id, callback);
  };
  /*serviceRequests.teamAdmin = function(teamCallback) {
    //If it is Team Campaign This wil be Called.
    donorService.teamCampaignAdmin(codeId, teamCallback);
  };*/
  if (req.query.openVideo) {
    serviceRequests.videoData = function(callback) {
      donorService.getCampaignVideo(req.query.openVideo, callback);
    };
  }
  serviceRequests.teams = function(teamCampaignCallback) {
      donorService.teamCampaigns(codeId, user_id, teamCampaignCallback);
    }
    /*serviceRequests.owner = function(ownerCallBack) {
      donorService.getCampaignOwner(codeId, ownerCallBack);
    }
    if(user_id){
      serviceRequests.user=function(loggedInUserCallBack){
        donorService.getUser(user_id, loggedInUserCallBack); 
      }
    }*/
  async.parallel(serviceRequests, function(err, result) {
    if (err) {
      //TODO: Check this Error Handler to make sure is it right or not.
      utility.appErrorHandler(err, res)
    } else {
      //
      var countdown = require('countdown')
      var momentCountdown = require('moment-countdown')
      var campaignModel = result;
      if (req.cookies.loadFrom != 'charity' && req.cookies.token) {
        campaignModel.nav = 'donor'
      } else if (req.cookies.loadFrom == 'charity' && req.cookies.token) {
        campaignModel.nav = 'a'
      } else {
        campaignModel.nav = ''
      }
      //Remove this once we change the queryForObject Method.
      //SEO Meta Data.
      //Currency Data, Creator Data, For NonProfit, 
      //How to get Owner Information.
      console.log(campaignModel);
      campaignModel.shareObject = {}
      campaignModel.shareObject.url = encodeURI(props.domain + '/' + campaignModel.campaignInfo.campaignSlug); // '/pages/campaign/' + codeId)
      campaignModel.shareObject.name = escape(campaignModel.campaignInfo.title)
      campaignModel.shareObject.via = 'wonderweapp'
      if (campaignModel.campaignInfo && campaignModel.campaignInfo.description) {
        campaignModel.shareObject.description = campaignModel.campaignInfo.description.replace(/(<([^>]+)>)/ig, '')
      } else {
        campaignModel.shareObject.description = ''
      }

      campaignModel.donatePer = parseInt((parseFloat(campaignModel.campaignInfo.noof_donations) / parseFloat(campaignModel.campaignInfo.goal)) * 100)
      campaignModel.campaignInfo.donatePer = campaignModel.donatePer;
      if (campaignModel.donatePer >= 100) {
        campaignModel.goalcompleted = true
        campaignModel.donatePer = 100
      }
      campaignModel.campaignInfo.noof_donations = numeral(campaignModel.campaignInfo.noof_donations).format('0,0.00');
      campaignModel.campaignInfo.goal = numeral(campaignModel.campaignInfo.goal).format('0,0');
      //var now = moment(new Date("2014-04-25T01:32:21.196Z")); // Important to load today's date in this format.
      var now = moment().toDate();
      var campaignNotExpired = moment(campaignModel.campaignInfo.end_date).isAfter(now); // will return true if the campaign's end date is in the future
      var campaignExpiredToday = moment(campaignModel.campaignInfo.end_date).isSame(now, 'day');

      campaignModel.imageId = campaignModel.campaignInfo.id
      campaignModel.imageType = 'code'

      campaignModel.stripe_publishable_key = props.stripe_publishable_key;
      campaignModel.analyticsid = props.analyticsid;
      campaignModel.ziggeoToken = props.videoToken;

      if (campaignNotExpired || campaignExpiredToday) {
        daysRemaining = moment().countdown(campaignModel.campaignInfo.end_date, countdown.DAYS, 2).toString(); // '301 days'
        if (daysRemaining)
          campaignModel.campaignInfo.time_left = daysRemaining.match(/\d+/g) // regex to strip out the text and only show the number
        else {
          campaignModel.campaignInfo.time_left = 0; // regex to strip out the text and only show the number
        }
      } else {
        campaignModel.campaignInfo.time_left = -1;
      }
      campaignModel.metadata = seoServices.seoMetaDataUtility('campaign', campaignModel);
      campaignModel.layout = "pages";

      res.render('./pages/campaignpage-slim', campaignModel);
    }
  });



}

exports.publicCampaignProfile = function(req, res, next) {

  console.time('Time Taken....');
  var codeId = req.params.codeId
  var donatePopup = req.query.donate;
  var p2pPopup = req.query.p2p;
  var usertype = req.query.user;
  var p2puserid = req.query.id;

  if (codeId && codeId != undefined) {

  } else {
    if (req.query.codeid) {
      var codeId = req.query.codeid;
    }
  }
  var flag = req.query.flag
  var mobileLoginDonorId = req.query.logindonorid


  if (req.query.logindonorid || mobileLoginDonorId) {
    if (mobileLoginDonorId) {
      var user_id = mobileLoginDonorId
    } else {
      var user_id = req.query.logindonorid
    }
  } else {
    if (req.query.user_id) {
      var user_id = req.query.user_id
    } else {
      var user_id = ''
    }
  }

  var countdown = require('countdown')
  var momentCountdown = require('moment-countdown')

  async.parallel({
    campainData: function(callback) {
      donorService.campaignDetails(codeId, user_id, callback)
    },
    campainCharityData: function(callback) {
      donorService.campaignCharityDetails(codeId, user_id, function(err, charityResult) {

        if (charityResult) {
          callback(null, charityResult);
        } else {

          donorService.fundraiserDetails(codeId, function(err, fundraiseUserResult) {

            if (fundraiseUserResult) {
              var fundraiseUserResult = fundraiseUserResult;
              //res.send(object);
              var charityData = {};
              charityData.currency_symbol = fundraiseUserResult.currency_symbol;
              charityData.currency_code = fundraiseUserResult.currency_code;
              charityData.payment_gateway = fundraiseUserResult.payment_gateway;
              charityData.country_name = fundraiseUserResult.country_name;
              charityData.currency_conversion = fundraiseUserResult.currency_conversion;
              charityData.fundraiser = "yes";
              callback(null, charityData);
            } else {
              var charityData = {};
              callback(null, charityData);
            }
          });
        }
      })
    },
    campaignDonors: function(callback) {
      donorService.campaignDonorsDataFund(codeId, callback)
    },
    getCampaignDonorsCount: function(callback) {
      donorService.getCampaignDonorsCampaignCount(codeId, callback)
    },
    amountCollected: function(callback) {
      donorService.collectedAmount(codeId, callback)
    },
    mentionsOfCampaign: function(callback) {
      donorService.campaignMentions(codeId, callback)
    },
    numOfFollowers: function(callback) {
      donorService.numOfCampaignFollowers(codeId, callback)
    },
    givingLevels: function(callback) {
      donorService.givingLevelsOfCamp(codeId, callback)
    },
    givingLevelsTotal: function(callback) {
      donorService.givingLevelsOfCampaign(codeId, callback)
    },
    campaignFollowers: function(callback) {
      if (flag == 'mobilepubliccharity') {
        donorService.campaignFollowersData(codeId, user_id, callback)
      } else {
        callback(null, []);
      }
    },
    fundraiseUser: function(callback) {
      if (req.query.userid || req.query.utm_userid) {
        var user_id = req.query.userid || req.query.utm_userid;
        donorService.getFundariserUser(user_id, callback);
      } else {
        callback(null, null);
      }
    },
    donorData: function(callback) {
      donorService.donorCountryData(user_id, callback);
    },
    videoData: function(callback) {
      if (req.query.openVideo) {
        donorService.getCampaignVideo(req.query.openVideo, callback);
      } else {
        callback(null, null);
      }
    },
    teamAdmin: function(teamCallback) {
      donorService.teamCampaignAdmin(codeId, teamCallback);
    },
    newteamCampaignAdmin: function(newteamCallback) {
      donorService.newteamCampaignAdmin(codeId, newteamCallback);
    },
    teamCampaigns: function(teamCampaignCallback) {
      donorService.teamCampaigns(codeId, user_id, teamCampaignCallback);
    },
    getTeamIndividualDetails: function(teamsCallback) {
      teamService.getTeamIndividualDetails(codeId, teamsCallback);
    },
    campaignAdmindetails: function(adminDetailsCallback) {
      donorService.getCampaignAdminDetails(codeId, user_id, adminDetailsCallback);
    },
    getCampaignUpdates: function(campaignUpdatesCallback) {
      donorService.getCampaignUpdates(codeId, campaignUpdatesCallback);
    },
    getCampaignsCount: function(teamDetailsCallback) {
      teamService.getCampaignTeamsCount(codeId, teamDetailsCallback);
    },
    getGivingLevelsCount: function(getGivingLevelsCountCallback) {
      donorService.getGivingLevelsCount(codeId, getGivingLevelsCountCallback);
    },
    getDonorCommentCount: function(getDonorCommentCountCallback) {
      donorService.getDonorCommentCount(codeId, getDonorCommentCountCallback);
    },
    gettingCampTeamCaptains: function(gettingCampTeamCaptainsCallback) {
      donorService.gettingCampTeamCaptains(codeId, gettingCampTeamCaptainsCallback)
    },
    getCampaignDonorsCount: function(callback) {
      donorService.getCampaignDonorsCampaignCount(codeId, callback)
    }
  }, function(err, result) {
    if (err) {
      console.log(err);
      if (err.flag) {
        utility.appErrorHandler(err, res)
      } else {
        utility.appErrorHandler(err, res)
      }
    } else {
      var object = {};
      object.facebook_app_id = props.facebook_client_id
      if (!result.videoData || result.videoData.length === 0) {
        delete result['videoData'];
      } else {

        object.videoData = result.videoData[0];
      }
      if (result && result.amountCollected) {
        object.amuntCollected = result.amountCollected.count
      } else {
        object.amuntCollected = 0
      }
      if (!req.cookies.token) {
        object.donornav = "signUpModule";
      }
      object.numOfPosts = result.mentionsOfCampaign.length
      if (result && result.numOfFollowers && result.numOfFollowers.count) {
        object.numOfFollowers = result.numOfFollowers.count
      } else {
        object.numOfFollowers = 0;
      }
      var campAdminUserId = [];
      if (result.campaignAdmindetails.length > 0) {
        for (var i = 0; i < result.campaignAdmindetails.length; i++) {
          campAdminUserId.push(result.campaignAdmindetails[i].user_id);
        }
      }

      if (result.getGivingLevelsCount[0]) {
        object.getGivingLevelsCount = result.getGivingLevelsCount[0].count;
      }
      if (result.getDonorCommentCount[0]) {
        object.donorscount = result.getDonorCommentCount[0].donors_count;
      }
      object.campaignAdmin = campAdminUserId;
      object.noOfTeams = result.getCampaignsCount.noOfTeams;
      object.donors = result.campaignDonors
      object.followers = result.campaignFollowers
      object.campaignInfo = result.campainData
      object.charityData = result.campainCharityData
      object.mentions = result.mentionsOfCampaign
      object.givingLevels = result.givingLevels
      object.givingLevelsTotal = result.givingLevelsTotal
      object.donatePopup = donatePopup;
      object.p2pPopup = p2pPopup;
      object.usertype = usertype;
      object.p2puserid = p2puserid;
      object.getCampaignDonorsCount = result.getCampaignDonorsCount;
      if (object.getGivingLevelsCount <= 2) {
        object.moreGivingExist = false
      } else {
        object.moreGivingExist = true
      }
      if (result.getCampaignUpdates) {

        object.campaignUpdates = result.getCampaignUpdates;
        object.noofupdates = result.getCampaignUpdates.length;
      }
      if (result.campaignAdmindetails.length > 0) {
        object.campaignAdminDetails = result.campaignAdmindetails;
        object.campaignAdminDetails.messagebody = result.campaignAdmindetails[0].msg_body;
      }
      if (result.teamAdmin && result.teamAdmin.length > 0) {
        object.teamAdmin = result.teamAdmin[0];
      }
      if (result.newteamCampaignAdmin && result.newteamCampaignAdmin.length > 0) {
        object.newteamCampaignAdmin = result.newteamCampaignAdmin[0];
      }
      var teamCampUserId = [];
      if (result.teamCampaigns && result.teamCampaigns.length > 0) {
        object.teams = result.teamCampaigns;
        for (var i = 0; i < result.teamCampaigns.length; i++) {
          teamCampUserId.push(result.teamCampaigns[i].user_id);
        }
      }
      var campTeamUserId = [];
      if (result.gettingCampTeamCaptains && result.gettingCampTeamCaptains.length > 0) {
        campTeamUserId = underscore.pluck(result.gettingCampTeamCaptains, 'tc_user_id')
      }
      object.campteamuserid = campTeamUserId;
      if (result.getTeamIndividualDetails && result.getTeamIndividualDetails.length > 0) {
        object.teamsForCampaigns = result.getTeamIndividualDetails;
      }
      object.teamcampuserid = teamCampUserId;
      object.teamsCount = result.teamCampaigns.length;
      object.domain = props.domain;
      var userCurrencyValue = "";
      var userCountryCode = "";
      var userCurrencySymbol = "";

      if (result.donorData && result.donorData.length > 0) {
        userCurrencyValue = result.donorData[0].currency_conversion;
        userCountryCode = result.donorData[0].currency_code;
        userCurrencySymbol = result.donorData[0].currency_symbol;
      } else {
        userCurrencyValue = 1;
        userCountryCode = 'USD';
        userCurrencySymbol = '$';
      }

      object.campaignInfo.goalConversion = numeral(((object.campaignInfo.goal / object.charityData.currency_conversion) * userCurrencyValue).toFixed(2)).format('0,0');
      object.campaignInfo.donationConversion = numeral(((object.campaignInfo.noof_donations / object.charityData.currency_conversion) * userCurrencyValue).toFixed(2)).format('0,0');
      object.campaignInfo.userCountryCode = userCountryCode;
      object.campaignInfo.userCurrencySymbol = userCurrencySymbol;

      for (var i in object.followers) {
        object.followers[i].sessionid = parseInt(req.query.logindonorid)
      }
      if (flag == 'mobilepubliccharity') {
        object.campaignPosts = result.campaignPosts
      }
      if (object.campaignInfo && object.campaignInfo.type && object.campaignInfo.type == 'ongoing') {
        object.campaignInfo.ongoing = 'ongoing'
      }

      if (req.query.status) {
        object.campaignInfo.status = 'preview';
      }
      // object.campaignInfo.Sharedescription =object.campaignInfo.description.replace(/(<([^>]+)>)/ig, "")
      for (var i in object.donors) {
        if (object.donors.length < 5) {
          object.moreDonorsExist = false
        } else {
          object.moreDonorsExist = true
        }
        // if (object.donors[i].offline == 'yes') {
        if (object.donors[i] && object.donors[i].created_date) {
          object.donors[i].created_date = moment.utc(object.donors[i].created_date).fromNow();
        }
        // } else {
        if (object.donors[i] && object.donors[i].transaction_date) {
          object.donors[i].transaction_date = moment.utc(object.donors[i].transaction_date).fromNow();
        }
        //}

        object.donors[i].amount = numeral(object.donors[i].amount).format('0,0');
        //setting the flag to donors data
        if (object.donors[i].hide_amount == 'yes' && object.donors[i].anonymous == 'yes') {
          object.donors[i].donorflag = 'anonymous'
        }
        if (object.donors[i].hide_amount == 'yes' && object.donors[i].anonymous == 'no') {
          object.donors[i].donorflag = 'nameonly'
        }
        if (object.donors[i].hide_amount == 'no' && object.donors[i].anonymous == 'yes') {
          object.donors[i].donorflag = 'amountonly'
        }
        if (object.donors[i].hide_amount == 'no' && object.donors[i].anonymous == 'no') {
          object.donors[i].donorflag = 'nameandamount'
        }
        if (object.donors[i].hide_amount != 'no') {
          object.donors[i].amount = ''
          object.donors[i].hide_amount_class = 'hidden'
        }
        if (object.donors[i].anonymous != 'no') {
          object.donors[i].name = 'Anonymous'
          object.donors[i].profile_pic_url = 'https://wonderwe.s3.amazonaws.com/profile/002640b0-1680-4988-b67e-ed7f727e27f6-default-userpng.png'
        } else {
          object.donors[i].donor_name = 'show'
        }
      }
      object.shareObject = {}
      object.shareObject.url = encodeURI(props.domain + '/' + object.campaignInfo.campaignSlug); // '/pages/campaign/' + codeId)
      object.shareObject.name = escape(object.campaignInfo.title)
      object.shareObject.via = 'wonderweapp'
      if (object.campaignInfo && object.campaignInfo.description) {
        object.shareObject.description = object.campaignInfo.description.replace(/(<([^>]+)>)/ig, '')
      } else {
        object.shareObject.description = ''
      }

      object.donatePer = parseInt((parseFloat(object.campaignInfo.noof_donations) / parseFloat(object.campaignInfo.goal)) * 100)
      object.campaignInfo.donatePer = object.donatePer;
      object.loadForm = 'charity'
      if (object.donatePer >= 100) {
        object.goalcompleted = true
        object.donatePer = 100
      } else {}
      var totalRaisedRaw = object.campaignInfo.noof_donations;
      var totalGoalRaw = object.campaignInfo.goal;
      object.campaignInfo.noof_donations = numeral(object.campaignInfo.noof_donations).format('0,0.00');
      object.campaignInfo.goal = numeral(object.campaignInfo.goal).format('0,0');
      //var now = moment(new Date("2014-04-25T01:32:21.196Z")); // Important to load today's date in this format.
      var now = moment().toDate();
      var campaignNotExpired = moment(object.campaignInfo.end_date).isAfter(now); // will return true if the campaign's end date is in the future
      var campaignExpiredToday = moment(object.campaignInfo.end_date).isSame(now, 'day');

      if (campaignNotExpired || campaignExpiredToday) {
        daysRemaining = moment().countdown(object.campaignInfo.end_date, countdown.DAYS, 2).toString(); // '301 days'
        if (daysRemaining) {
          object.campaignInfo.time_left = daysRemaining.match(/\d+/g); // regex to strip out the text and only show the number
        } else {
          object.campaignInfo.time_left = 0; // regex to strip out the text and only show the number
        }
      } else {
        object.campaignInfo.time_left = -1;
      }

      var eachRaised;
      var p2pTotal = 0;
      for (var i in object.teams) {
        object.teams[i].time_left = object.campaignInfo.time_left;
        eachRaised = parseFloat(object.teams[i].donation);
        if (!isNaN(eachRaised)) p2pTotal += eachRaised;
      }
      // Interesting data point but we aren't showing it anywhere yet
      object.campaignInfo.p2pRaisePercent = numeral(((p2pTotal / totalRaisedRaw) * 100).toFixed(2)).format('0,0');
      object.campaignInfo.p2pGoalPercent = numeral(((p2pTotal / totalGoalRaw) * 100).toFixed(2)).format('0,0');
      object.campaignInfo.p2pAverage = numeral((p2pTotal / object.teamsCount).toFixed(2)).format('0,0');
      object.campaignInfo.p2pTotal = numeral((p2pTotal).toFixed(2)).format('0,0');

      object.from = 'mentions'
      object.pagetitle = object.campaignInfo.title
      object.type = 'website'
      object.image = object.campaignInfo.code_picture_url
      object.description = object.shareObject.description
      if (req.query.logindonorid) {
        object.reference_userid = req.query.logindonorid;
        var referenceid = req.query.logindonorid;
      } else {
        var referenceid = "";
      }
      if (object.charityData && object.charityData.charity_id) {
        object.charityurl = props.domain + '/' + 'pages/organization/' + object.charityData.charity_id
      }
      object.imageId = object.campaignInfo.id
      object.imageType = 'code'
        /*if (req.cookies.loadFrom != 'charity' && req.cookies.token) {
          object.donornav = 'donor'
        } else if (req.cookies.loadFrom == 'charity' && req.cookies.token) {
          object.charitynav = 'a'
        } else {
          object.nav = ''
        }*/
      object.stripe_publishable_key = props.stripe_publishable_key;
      object.analyticsid = props.analyticsid;
      object.ziggeoToken = props.videoToken;
      //Send 200 Status With Real Data

      if (flag == 'mobilepubliccharity' && req.query.preview != 'preview') {

        if (object.campaignInfo && object.campaignInfo.status === 'draft') {
          var obj = {}
          obj.campaignInfo = object.campaignInfo;
          obj.wecode = object.campaignInfo.code_text
          if (object.campaignInfo && object.campaignInfo.individual === "yes") {
            excuteQuery.queryForAll(sqlQueryMap['userInfoandCurrenceSymbol'], [object.campaignInfo.user_id], function(err, fundraiseUserResult) {
              if (fundraiseUserResult && fundraiseUserResult.length > 0) {
                obj.fundraiseUser = fundraiseUserResult;
              }
              obj.fundraiser_userid = object.campaignInfo.user_id;
              obj.fundraiser_codeid = object.campaignInfo.id;
              obj.fundraiser = "fundraiser"
              res.send(obj)
            });
          } else {
            res.send(obj)
          }
        } else {
          if (object.campaignInfo && object.campaignInfo.individual === "yes") {
            excuteQuery.queryForAll(sqlQueryMap['userInfoandCurrenceSymbol'], [object.campaignInfo.user_id], function(err, fundraiseUserResult) {
              if (fundraiseUserResult && fundraiseUserResult.length > 0) {
                object.fundraiseUser = fundraiseUserResult;
              }
              object.fundraiser_userid = object.campaignInfo.user_id;
              object.fundraiser_codeid = object.campaignInfo.id;
              object.fundraiser = "fundraiser"
              res.send(object)
            });
          } else {
            res.send(object)
          }
        }
      } else if (req.query.preview == 'preview') {

        if (object.charityData && object.charityData.fundraiser != "yes") {
          res.send(object);
        } else {
          excuteQuery.queryForAll(sqlQueryMap['userInfoandCurrenceSymbol'], [user_id], function(err, fundraiseUserResult) {
            object.fundraiseUser = fundraiseUserResult;
            donorService.campaignDonorsDataFund(codeId, function(err, campaignDonors) {
              if (err) {
                object.donors = []
              } else {
                object.donors = campaignDonors;
              }
              if (object.donors.length) {
                for (var i in object.donors) {
                  if (object.donors.length < 5) {
                    object.moreDonorsExist = false
                  } else {
                    object.moreDonorsExist = true
                  }
                  // if (object.donors[i].offline == 'yes') {
                  if (object.donors[i] && object.donors[i].created_date) {
                    object.donors[i].created_date = moment.utc(object.donors[i].created_date).fromNow();
                  }
                  // } else {
                  if (object.donors[i] && object.donors[i].transaction_date) {
                    object.donors[i].transaction_date = moment.utc(object.donors[i].transaction_date).fromNow();
                  }
                  //}

                  object.donors[i].amount = numeral(object.donors[i].amount).format('0,0.00');
                  if (object.donors[i].hide_amount != 'no') {
                    object.donors[i].amount = ''
                    object.donors[i].hide_amount_class = 'hidden'
                  }
                  if (object.donors[i].anonymous != 'no') {
                    object.donors[i].name = 'Anonymous'
                    object.donors[i].profile_pic_url = 'https://wonderwe.s3.amazonaws.com/profile/002640b0-1680-4988-b67e-ed7f727e27f6-default-userpng.png'
                  } else {
                    object.donors[i].donor_name = 'show'
                  }
                }
              }
              res.send(object);
              //object.layout = "pages";
              //res.render('./pages/fund-campaignpage', object)
              // }
            })
          });
        }
      } else {
        if (req.query.status == 'preview') {
          excuteQuery.queryForAll(sqlQueryMap['userInfoandCurrenceSymbol'], [object.campaignInfo.user_id], function(err, fundraiseUserResult) {
            if (fundraiseUserResult && fundraiseUserResult.length > 0) {
              var fundraiseUserResult = fundraiseUserResult[0];
              if (!object.charityData) {
                object.charityData = {};
                object.charityData.currency_symbol = fundraiseUserResult.currency_symbol;
                object.charityData.currency_code = fundraiseUserResult.currency_code;
                object.charityData.country_name = fundraiseUserResult.country_name;
                object.charityData.currency_conversion = fundraiseUserResult.currency_conversion;
              }
              object.fullfooter = 'true';
              object.layout = "pages";
              object.fundraiseUser = {};
              object.fundraiseUser = fundraiseUserResult;
              res.render('./pages/campaignpage', object);
            }
          });
        } else if (object.campaignInfo && object.campaignInfo.status === 'draft') {
          var obj = {}
          obj.wecode = object.campaignInfo.code_text
          res.redirect('/404')
            //}
        } else {
          if (result.fundraiseUser && result.fundraiseUser.length > 0) {
            object.fundraiseUser = result.fundraiseUser[0];
          }
          var trackInfo = {};
          if (req.query.utm_userid && req.query.utm_fundraise == "fundraise") {
            object.fundraiser_userid = req.query.utm_userid;
            object.fundraiser = 'fundraiser';
            object.fundraiser_codeid = req.params.codeId;
            trackInfo.code_id = req.params.codeId;

            if (req.query.utm_reference_userid) {
              trackInfo.reference_userid = req.query.utm_reference_userid;
            } else {
              trackInfo.reference_userid = req.query.utm_userid;
            }
            if (req.query.utm_reference_userid) {
              object.reference_userid = req.query.utm_reference_userid;
            } else {
              object.reference_userid = req.query.utm_userid;
            }
            if (referenceid) {

            } else {
              var referenceid = req.query.utm_reference_userid;
            }
            //trackInfo.referer = req.headers['referer'];
            trackInfo.time_stamp = moment.utc().format('YYYY-MM-DD HH:mm:ss');
            trackInfo.social_source = req.query.utm_source;
            trackInfo.track_type = "click";
            excuteQuery.insertAndReturnKey(sqlQueryMap['trackedInfo'], trackInfo, function(err, rows) {});

            excuteQuery.queryForAll(sqlQueryMap['userInfoandCurrenceSymbol'], [req.query.utm_userid], function(err, fundraiseUserResult) {
              if (fundraiseUserResult && fundraiseUserResult.length > 0) {
                var fundraiseUserResult = fundraiseUserResult[0];
                //res.send(object);
                object.charityData = {};
                object.charityData.currency_symbol = fundraiseUserResult.currency_symbol;
                object.charityData.currency_code = fundraiseUserResult.currency_code;
                object.charityData.country_name = fundraiseUserResult.country_name;
                object.charityData.currency_conversion = fundraiseUserResult.currency_conversion;

                var urlshortener = google.urlshortener('v1');
                urlshortener.url.insert({
                  auth: props.shortultapikey,
                  resource: {
                    longUrl: object.shareObject.url + '?utm_userid=' + object.fundraiser_userid + '&utm_codeid=' + object.fundraiser_codeid + '&utm_reference_userid=' + referenceid + '&utm_fundraise=fundraise&utm_source=facebook'
                  }
                }, function(err, result) {
                  if (err) {
                    // callback(err, null);
                    object.furl = props.domain + '/' + object.campaignInfo.campaignSlug;

                  } else {
                    object.furl = result.id;
                    urlshortener.url.insert({
                      auth: props.shortultapikey,
                      resource: {
                        longUrl: object.shareObject.url + '?utm_userid=' + object.fundraiser_userid + '&utm_codeid=' + object.fundraiser_codeid + '&utm_reference_userid=' + referenceid + '&utm_fundraise=fundraise&utm_source=twitter'
                      }
                    }, function(err, result1) {
                      if (err) {
                        // callback(err, null);
                        object.turl = props.domain + '/' + object.campaignInfo.campaignSlug;

                      } else {
                        object.turl = result1.id;
                      }
                    })
                  }
                  donorService.campaignDonorsDataFund(codeId, function(err, campaignDonors) {
                      if (err) {
                        object.donors = [];

                      } else {

                        object.donors = campaignDonors;
                      }
                      if (object.donors.length) {
                        for (var i in object.donors) {
                          if (object.donors.length < 5) {
                            object.moreDonorsExist = false
                          } else {
                            object.moreDonorsExist = true
                          }
                          // if (object.donors[i].offline == 'yes') {
                          if (object.donors[i] && object.donors[i].created_date) {
                            object.donors[i].created_date = moment.utc(object.donors[i].created_date).fromNow();
                          }
                          // } else {
                          if (object.donors[i] && object.donors[i].transaction_date) {
                            object.donors[i].transaction_date = moment.utc(object.donors[i].transaction_date).fromNow();
                          }
                          //}

                          object.donors[i].amount = numeral(object.donors[i].amount).format('0,0.00');
                          if (object.donors[i].hide_amount != 'no') {
                            object.donors[i].amount = ''
                            object.donors[i].hide_amount_class = 'hidden'
                          }
                          if (object.donors[i].anonymous != 'no') {
                            object.donors[i].name = 'Anonymous'
                            object.donors[i].profile_pic_url = 'https://wonderwe.s3.amazonaws.com/profile/002640b0-1680-4988-b67e-ed7f727e27f6-default-userpng.png'
                          } else {
                            object.donors[i].donor_name = 'show'
                          }
                        }
                      }
                      object.fullfooter = 'true';
                      object.layout = "pages";
                      res.render('./pages/fund-campaignpage', object)
                        //res.send(object);
                        //}
                    })
                    // }
                    // });
                    //}
                });

              }
            });
          } else if (req.query.fundraise == "fundraise") {
            var trackInfo = {};
            object.fundraiser_userid = req.query.userid;
            object.fundraiser = 'fundraiser';
            object.fundraiser_codeid = req.query.codeid;
            object.emailpage = "emailpage";
            trackInfo.code_id = req.query.codeid;
            if (req.query.reference_userid) {
              trackInfo.reference_userid = req.query.reference_userid;
            } else {
              trackInfo.reference_userid = req.query.userid;
            }
            //if (object.reference_userid) {

            //} else {
            object.reference_userid = req.query.reference_userid;
            //}
            //trackInfo.referer = req.headers['referer'];
            if (req.query.inviteuserid) {
              object.inviteuserid = req.query.inviteuserid;
            }
            trackInfo.time_stamp = moment.utc().format('YYYY-MM-DD HH:mm:ss');
            trackInfo.social_source = "email";
            trackInfo.track_type = "click";
            excuteQuery.insertAndReturnKey(sqlQueryMap['trackedInfo'], trackInfo, function(err, rows) {});
            excuteQuery.queryForAll(sqlQueryMap['userInfoandCurrenceSymbol'], [req.query.userid], function(err, fundraiseUserResult) {
              if (fundraiseUserResult && fundraiseUserResult.length > 0) {
                var fundraiseUserResult = fundraiseUserResult[0];
                //res.send(object);

                object.charityData = {};
                object.charityData.currency_symbol = fundraiseUserResult.currency_symbol;
                object.charityData.currency_code = fundraiseUserResult.currency_code;
                object.charityData.country_name = fundraiseUserResult.country_name;
                object.charityData.currency_conversion = fundraiseUserResult.currency_conversion;

                var google = require('googleapis');
                var urlshortener = google.urlshortener('v1');
                urlshortener.url.insert({
                  auth: props.shortultapikey,
                  resource: {
                    longUrl: object.shareObject.url + '?utm_userid=' + object.fundraiser_userid + '&utm_codeid=' + object.fundraiser_codeid + '&utm_reference_userid=' + req.query.inviteuserid + '&utm_fundraise=fundraise&utm_source=facebook'
                  }
                }, function(err, result) {
                  if (err) {
                    // callback(err, null);
                    excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [req.query.inviteuserid], function(err, userInfo) {
                      object.fullfooter = 'true';
                      object.layout = "pages";
                      object.email = userInfo[0].email;
                      if (userInfo[0].active) {
                        object.active = userInfo[0].active;
                      } else {
                        object.active = "no";
                      }
                      res.render('./pages/fund-campaignpage', object)
                        //res.send(object);
                    });
                  } else {
                    object.furl = result.id;
                    urlshortener.url.insert({
                      auth: props.shortultapikey,
                      resource: {
                        longUrl: object.shareObject.url + '?utm_userid=' + object.fundraiser_userid + '&utm_codeid=' + object.fundraiser_codeid + '&utm_reference_userid=' + req.query.inviteuserid + '&utm_fundraise=fundraise&utm_source=twitter'
                      }
                    }, function(err, result1) {
                      if (err) {
                        // callback(err, null);
                        excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [req.query.inviteuserid], function(err, userInfo) {
                          object.fullfooter = 'true';
                          object.layout = "pages";
                          object.email = userInfo[0].email;
                          if (userInfo[0].active) {
                            object.active = userInfo[0].active;
                          } else {
                            object.active = "no";
                          }
                          res.render('./pages/fund-campaignpage', object)
                            //res.send(object);
                        });
                      } else {
                        object.turl = result1.id;
                        donorService.campaignDonorsDataFund(codeId, function(err, campaignDonors) {
                          if (err) {
                            // callback(err, null);
                            object.donors = [];

                          } else {
                            object.donors = campaignDonors;
                          }
                          if (object.donors.length) {
                            for (var i in object.donors) {
                              if (object.donors.length < 5) {
                                object.moreDonorsExist = false
                              } else {
                                object.moreDonorsExist = true
                              }
                              // if (object.donors[i].offline == 'yes') {
                              if (object.donors[i] && object.donors[i].created_date) {
                                object.donors[i].created_date = moment.utc(object.donors[i].created_date).fromNow();
                              }
                              // } else {
                              if (object.donors[i] && object.donors[i].transaction_date) {
                                object.donors[i].transaction_date = moment.utc(object.donors[i].transaction_date).fromNow();
                              }
                              //}

                              object.donors[i].amount = numeral(object.donors[i].amount).format('0,0.00');
                              if (object.donors[i].hide_amount != 'no') {
                                object.donors[i].amount = ''
                                object.donors[i].hide_amount_class = 'hidden'
                              }
                              if (object.donors[i].anonymous != 'no') {
                                object.donors[i].name = 'Anonymous'
                                object.donors[i].profile_pic_url = 'https://wonderwe.s3.amazonaws.com/profile/002640b0-1680-4988-b67e-ed7f727e27f6-default-userpng.png'
                              } else {
                                object.donors[i].donor_name = 'show'
                              }
                            }
                          }
                          excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [req.query.inviteuserid], function(err, userInfo) {
                            object.fullfooter = 'true';
                            object.layout = "pages";
                            object.email = userInfo[0].email;
                            if (userInfo[0].active) {
                              object.active = userInfo[0].active;
                            } else {
                              object.active = "no";
                            }
                            res.render('./pages/fund-campaignpage', object)
                              //res.send(object);
                          });
                          // }
                        })
                      }
                    });
                  }

                });
              }

            });
          } else {
            if (object.charityData && !object.charityData.fundraiser) {
              var trackInfo = {};
              excuteQuery.queryForAll(sqlQueryMap['getFundCampStatus'], [req.params.codeId], function(err, codeInfoCharity) {
                if (err) {
                  codeInfoCharity = [];
                  // object.metadata = seoServices.seoMetaDataUtility('campaign', object);
                  object.fullfooter = 'true';
                  object.layout = "pages";
                  res.render('./pages/campaignpage', object);
                } else {
                  if (codeInfoCharity && codeInfoCharity[0].individual) {

                    if (codeInfoCharity[0].parent_user_id) {
                      var parent_user_id = codeInfoCharity[0].parent_user_id;
                    } else {
                      var parent_user_id = codeInfoCharity[0].user_id;
                    }

                    donorService.getFundariserUser(parent_user_id, function(err, resultUser) {
                      if (err) {
                        // callback(err, null);
                        /*object.fullfooter = 'true';
                        object.layout = "pages";
                        res.render('./pages/fund-campaignpage', object)*/
                      } else {
                        if (resultUser && resultUser.length > 0) {
                          object.fundraiseUser = resultUser[0];
                          object.fundraiser_userid = parent_user_id; //codeInfoCharity[0].user_id;
                        }

                        if (object.reference_userid) {

                        } else {
                          object.reference_userid = object.fundraiser_userid;
                        }
                        object.fundraiser = 'charity';
                        object.fundraiser_codeid = req.params.codeId;

                        if (req.params.codeId || req.query.codeid) {
                          if (req.query.codeid) {
                            trackInfo.code_id = req.query.codeid;
                          } else {
                            trackInfo.code_id = req.params.codeId;
                          }
                        }
                        if (req.query.reference_userid) {
                          trackInfo.reference_userid = req.query.reference_userid;
                        } else {
                          trackInfo.reference_userid = req.query.userid;
                        }
                      }
                      //trackInfo.referer = req.headers['referer'];
                      trackInfo.time_stamp = moment.utc().format('YYYY-MM-DD HH:mm:ss');
                      if (req.query.social_source || req.query.utm_social_source) {
                        if (req.query.utm_social_source) {
                          trackInfo.social_source = req.query.utm_social_source;
                        } else {
                          trackInfo.social_source = req.query.social_source;
                        }
                      }
                      trackInfo.track_type = "click";
                      if (req.query.fundraise === "charity" || req.query.utm_fundraise === "charity") {
                        excuteQuery.insertAndReturnKey(sqlQueryMap['trackedInfo'], trackInfo, function(err, rows) {});
                      }
                      var google = require('googleapis');
                      var urlshortener = google.urlshortener('v1');
                      urlshortener.url.insert({
                        auth: props.shortultapikey,
                        resource: {
                          longUrl: object.shareObject.url + '?utm_userid=' + object.fundraiser_userid + '&utm_codeid=' + object.fundraiser_codeid + '&utm_reference_userid=' + object.reference_userid + '&utm_fundraise=' + object.fundraiser + '&utm_source=facebook'
                        }
                      }, function(err, result) {
                        if (err) {
                          // callback(err, null);
                          object.furl = props.domain + '/' + object.campaignInfo.campaignSlug;

                        } else {
                          object.furl = result.id;
                          urlshortener.url.insert({
                            auth: props.shortultapikey,
                            resource: {
                              longUrl: object.shareObject.url + '?utm_userid=' + object.fundraiser_userid + '&utm_codeid=' + object.fundraiser_codeid + '&utm_reference_userid=' + object.reference_userid + '&utm_fundraise=' + object.fundraiser + '&utm_source=twitter'
                            }
                          }, function(err, result1) {
                            if (err) {
                              //callback(err, null);
                              object.turl = props.domain + '/' + object.campaignInfo.campaignSlug;

                            } else {
                              object.turl = result1.id;
                            }
                          })
                        }

                        donorService.campaignDonorsDataFund(codeId, function(err, campaignDonors) {
                            if (err) {
                              // callback(err, null);
                              object.donors = [];
                              object.fullfooter = 'true';
                              object.layout = "pages";
                              res.render('./pages/fund-campaignpage', object)
                            } else {
                              object.donors = campaignDonors;
                            }
                            if (object.donors && object.donors.length) {


                              for (var i in object.donors) {
                                if (object.donors.length < 5) {
                                  object.moreDonorsExist = false
                                } else {
                                  object.moreDonorsExist = true
                                }
                                if (object.donors[i].hide_amount == 'yes' && object.donors[i].anonymous == 'yes') {
                                  object.donors[i].donorflag = 'anonymous'
                                }
                                if (object.donors[i].hide_amount == 'yes' && object.donors[i].anonymous == 'no') {
                                  object.donors[i].donorflag = 'nameonly'
                                }
                                if (object.donors[i].hide_amount == 'no' && object.donors[i].anonymous == 'yes') {
                                  object.donors[i].donorflag = 'amountonly'
                                }
                                if (object.donors[i].hide_amount == 'no' && object.donors[i].anonymous == 'no') {
                                  object.donors[i].donorflag = 'nameandamount'
                                }
                                // if (object.donors[i].offline == 'yes') {
                                if (object.donors[i] && object.donors[i].created_date) {
                                  object.donors[i].created_date = moment.utc(object.donors[i].created_date).fromNow();
                                }
                                // } else {
                                if (object.donors[i] && object.donors[i].transaction_date) {
                                  object.donors[i].transaction_date = moment.utc(object.donors[i].transaction_date).fromNow();
                                }
                                //}

                                object.donors[i].amount = numeral(object.donors[i].amount).format('0,0.00');
                                if (object.donors[i].hide_amount != 'no') {
                                  object.donors[i].amount = ''
                                  object.donors[i].hide_amount_class = 'hidden'
                                }
                                if (object.donors[i].anonymous != 'no') {
                                  object.donors[i].name = 'Anonymous'
                                  object.donors[i].profile_pic_url = 'https://wonderwe.s3.amazonaws.com/profile/002640b0-1680-4988-b67e-ed7f727e27f6-default-userpng.png'
                                } else {
                                  object.donors[i].donor_name = 'show'
                                }
                              }
                            }
                            object.metadata = seoServices.seoMetaDataUtility('campaign', object);
                            object.fullfooter = 'true';
                            object.layout = "pages";
                            res.render('./pages/fund-campaignpage', object)
                              //res.send(object);
                              // }
                          })
                          //   }
                          // });
                          //  }
                      });
                      //}
                    });
                  } else {

                    console.timeEnd('Time Taken....');


                    object.metadata = seoServices.seoMetaDataUtility('campaign', object);
                    object.fullfooter = 'true';
                    object.layout = "pages";
                    res.render('./pages/campaignpage', object);
                  }
                }
              });
            } else {

              excuteQuery.queryForAll(sqlQueryMap['codeUrls'], [req.params.codeId], function(err, codeInfo) {
                if (err) {
                  //callback(err, null);
                  codeInfo = [];
                } else {
                  if (codeInfo && codeInfo.length > 0) {

                    if (codeInfo[0].parent_user_id) {
                      var parent_user_id = codeInfo[0].parent_user_id;
                    } else {
                      var parent_user_id = codeInfo[0].user_id;
                    }

                    excuteQuery.queryForAll(sqlQueryMap['userInfoandCurrenceSymbol'], [parent_user_id], function(err, fundraiseUserResult) {
                      if (fundraiseUserResult && fundraiseUserResult.length > 0) {
                        var fundraiseUserResult = fundraiseUserResult[0];
                        //res.send(object);
                        object.charityData = {};
                        object.charityData.currency_symbol = fundraiseUserResult.currency_symbol;
                        object.charityData.currency_code = fundraiseUserResult.currency_code;
                        object.charityData.country_name = fundraiseUserResult.country_name;
                        object.charityData.currency_conversion = fundraiseUserResult.currency_conversion;

                        donorService.getFundariserUser(parent_user_id, function(err, resultUser) {
                          if (err) {
                            resultUser = [];
                          } else {
                            if (resultUser && resultUser.length > 0) {
                              object.fundraiseUser = resultUser[0];
                            }
                            if (req.query.userid) {
                              object.fundraiser_userid = req.query.userid;
                            } else {
                              object.fundraiser_userid = parent_user_id; //codeInfo[0].user_id;
                            }
                            if (object.reference_userid) {

                            } else {
                              object.reference_userid = object.fundraiser_userid;
                            }
                            object.fundraiser = 'fundraiser';
                            object.fundraiser_codeid = req.params.codeId;


                            var google = require('googleapis');
                            var urlshortener = google.urlshortener('v1');
                            urlshortener.url.insert({
                              auth: props.shortultapikey,
                              resource: {
                                longUrl: object.shareObject.url + '?utm_userid=' + object.fundraiser_userid + '&utm_codeid=' + object.fundraiser_codeid + '&utm_reference_userid=' + object.reference_userid + '&utm_fundraise=fundraise&utm_source=facebook'
                              }
                            }, function(err, result) {
                              if (err) {
                                // callback(err, null);
                                // object.metadata = seoServices.seoMetaDataUtility('campaign', object);

                                object.furl = props.domain + '/' + object.campaignInfo.campaignSlug;

                              } else {
                                object.furl = result.id;
                                urlshortener.url.insert({
                                  auth: props.shortultapikey,
                                  resource: {
                                    longUrl: object.shareObject.url + '?utm_userid=' + object.fundraiser_userid + '&utm_codeid=' + object.fundraiser_codeid + '&utm_reference_userid=' + object.reference_userid + '&utm_fundraise=fundraise&utm_source=twitter'
                                  }
                                }, function(err, result1) {
                                  if (err) {
                                    // callback(err, null);
                                    // object.metadata = seoServices.seoMetaDataUtility('campaign', object);

                                    object.turl = props.domain + '/' + object.campaignInfo.campaignSlug;

                                  } else {
                                    object.turl = result1.id;
                                  }
                                })
                              }
                              donorService.campaignDonorsDataFund(codeId, function(err, campaignDonors) {
                                if (err) {
                                  // callback(err, null);
                                  object.donors = [];
                                  //    object.metadata = seoServices.seoMetaDataUtility('campaign', object);


                                } else {
                                  object.donors = campaignDonors;
                                }
                                if (object.donors.length) {
                                  for (var i in object.donors) {
                                    if (object.donors.length < 5) {
                                      object.moreDonorsExist = false
                                    } else {
                                      object.moreDonorsExist = true
                                    }
                                    // if (object.donors[i].offline == 'yes') {
                                    if (object.donors[i] && object.donors[i].created_date) {
                                      object.donors[i].created_date = moment.utc(object.donors[i].created_date).fromNow();
                                    }
                                    // } else {
                                    if (object.donors[i] && object.donors[i].transaction_date) {
                                      object.donors[i].transaction_date = moment.utc(object.donors[i].transaction_date).fromNow();
                                    }
                                    //}

                                    object.donors[i].amount = numeral(object.donors[i].amount).format('0,0.00');

                                    //setting the flag to donors data
                                    if (object.donors[i].hide_amount == 'yes' && object.donors[i].anonymous == 'yes') {
                                      object.donors[i].donorflag = 'anonymous'
                                    }
                                    if (object.donors[i].hide_amount == 'yes' && object.donors[i].anonymous == 'no') {
                                      object.donors[i].donorflag = 'nameonly'
                                    }
                                    if (object.donors[i].hide_amount == 'no' && object.donors[i].anonymous == 'yes') {
                                      object.donors[i].donorflag = 'amountonly'
                                    }
                                    if (object.donors[i].hide_amount == 'no' && object.donors[i].anonymous == 'no') {
                                      object.donors[i].donorflag = 'nameandamount'
                                    }
                                    if (object.donors[i].hide_amount != 'no') {
                                      object.donors[i].amount = ''
                                      object.donors[i].hide_amount_class = 'hidden'
                                    }
                                    if (object.donors[i].anonymous != 'no') {
                                      object.donors[i].name = 'Anonymous'
                                      object.donors[i].profile_pic_url = 'https://wonderwe.s3.amazonaws.com/profile/002640b0-1680-4988-b67e-ed7f727e27f6-default-userpng.png'
                                    } else {
                                      object.donors[i].donor_name = 'show'
                                    }
                                  }
                                }
                                object.metadata = seoServices.seoMetaDataUtility('campaign', object);
                                object.fullfooter = 'true';
                                object.layout = "pages";
                                res.render('./pages/fund-campaignpage', object)
                                  //res.send(object)
                                  // }
                              })

                              //}
                              // });
                              // }
                            });
                          }
                        });
                      } else {
                        object.fullfooter = 'true';
                        object.layout = "pages";
                        res.render('./pages/campaignpage', object);
                      }
                    });

                  }
                }
              });
            }

          }
        }
      }
    }
  })
}
