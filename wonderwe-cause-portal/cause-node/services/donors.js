var donationService = require('./donations.js');
var wepayService = require('./wepay.js');
var emoji = require('emojione');



exports.getDonorsByDates = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['donorFilterByDates'], [obj.charityId, obj.fromDate, obj.toDate], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.getDonorsByYear = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['donorFilterByYear'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.addGivingLevels = function(obj, callback) {
  if (obj.id) {
    obj.date_modified=moment.utc().toDate();
    excuteQuery.queryForAll(sqlQueryMap['updateFundraisegiving'], [obj, obj.id, obj.code_id], function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else if (result) {
        var givingLevels = obj;
        callback(null, givingLevels);
      }
    });

  } else {
    obj.date_created=moment.utc().toDate();
    obj.date_modified=moment.utc().toDate();
    excuteQuery.insertAndReturnKey(sqlQueryMap['addFundraisegiving'], [obj], function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else if (result) {
        var givingLevels = obj;
        givingLevels.id = result;
        givingLevels.quantity_left = 0;
        callback(null, givingLevels);
      }
    });
  }
};
exports.getGivingLevel = function(obj, callback) {
  if (obj.givinglevelId) {
    if (obj.fundCampDelete) {
      excuteQuery.queryForAll(sqlQueryMap['deleteGivingLevel'], [obj.givinglevelId], function(err, result) {
        if (err) {
          callback(new Error(err), null);
        } else if (result) {
          callback(null, result);
        }
      });
    } else {
      excuteQuery.queryForAll(sqlQueryMap['getSingleGivingLevel'], [obj.givinglevelId], function(err, result) {
        if (err) {
          callback(new Error(err), null);
        } else if (result) {
          callback(null, result);
        }
      });
    }
  } else {
    excuteQuery.queryForAll(sqlQueryMap['getgivinglevelforfundraise'], [obj.codeId], function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else if (result) {
        callback(null, result);
      }
    });
  }


}

exports.getDonorsByMonth = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['donorFilterByMonth'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.getDonorsByWeek = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['donorFilterByWeek'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.getDonorsByToday = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['donorFilterByToday'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
//Donor Dashboard Queries
exports.numberOfDonorPosts = function(userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getPostsCount'], [userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      if (result[0]) {
        callback(null, result[0]);
      } else {
        var obj = {
          noofposts: 0
        }
        callback(null, obj);
      }
    }
  });
};
exports.numberOfFollowers = function(userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getFollowersCount'], [userId], function(err, result) {
    if (err) {
      console.log(err);
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};
exports.numberOfFollowing = function(userId, callback) { // Gets the count for following in upper left hand card on member dashboard
  excuteQuery.queryForAll(sqlQueryMap['getFollowingCount'], [userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};
exports.numberOfPeopleFollowing = function(userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getuserFollowingPeopleCount'], [userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};
exports.numberOfOrgsFollowing = function(userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getuserFollowingOrgsCount'], [userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};
exports.numberOfCamFollowing = function(userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getuserFollowingCamCount'], [userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      excuteQuery.queryForAll(sqlQueryMap['getuserFollowingCamCountFund'], [userId], function(err, result1) {
        if (err) {
          callback(new Error(err), null);
        } else if (result1) {
          var obj = {};
          obj.noofcamfollowing = result[0].noofcamfollowing + result1[0].noofcamfollowing;
          callback(null, obj);
        }
      });
    }
  });
};
exports.donorPosts = function(userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getDonorPosts'], [userId, userId, userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.getCampaignAdminDetails = function(codeId, userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCampaignAdminDetails'], [codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.curentTrendingCampains = function(userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['trendingCampains'], [userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.followRecommendationsOrgs = function(userId, skip, callback) {
  excuteQuery.queryForAll(sqlQueryMap['followersRecommendationsOrgs'], [userId, parseInt(skip)], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.followRecommendations = function(userId, flag, skip, callback) {
  if (flag && flag != "undefined" && flag == "reload") {
    var limit = 1;
    skip = parseInt(skip);
  } else {
    var limit = 5;
    skip = 0;
  }
  excuteQuery.queryForAll(sqlQueryMap['followersRecommendations'], [userId, userId, limit, skip, userId, limit, skip], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.followRecommendationsUser = function(userId, flag, skip, callback) {
  if (flag && flag != "undefined" && flag == "reload") {
    var limit = 1;
    skip = parseInt(skip);
  }

  excuteQuery.queryForAll(sqlQueryMap['followersRecommendationsUser'], [userId,userId,limit, skip], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.followRecommendationsOrg = function(userId, flag, skip, callback) {
  if (flag && flag != "undefined" && flag == "reload") {
    var limit = 1;
    skip = parseInt(skip) - 1;
  }
  excuteQuery.queryForAll(sqlQueryMap['followRecommendationsOrg'], [userId, limit, skip], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.popularWeCodesForDonors = function(callback) {
  excuteQuery.queryForAll(sqlQueryMap['popularWeCode'], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
//For Donor User Profile
exports.donorUserPosts = function(userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getDonorUserPosts'], [userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.getEntityImages = function(entityId, entityType, callback) {

  if (entityType == 'charity') {
    excuteQuery.queryForAll(sqlQueryMap['getCharityEntityImages'], [entityId, entityId], function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else if (result) {
        callback(null, result);
      }
    });
  } else if (entityType == 'code') {

    excuteQuery.queryForAll(sqlQueryMap['getCodeEntityImages'], [entityId], function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else if (result) {
        callback(null, result);
      }
    });

  } else if (entityType == 'user') {

    excuteQuery.queryForAll(sqlQueryMap['getUserEntityImages'], [entityId], function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else if (result) {
        callback(null, result);
      }
    });

  }

};
exports.getDonorFollowingOrganizations = function(sessionuserid, fuserId, callback) { // Show the organization information for orgs the user's profile is following
  excuteQuery.queryForAll(sqlQueryMap['getUserFollowingOrgs'], [sessionuserid, fuserId, fuserId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.numberOfCharityPosts = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['numOfCharityPosts'], [charityId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};
exports.numberOfCharityFollowers = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['numOfCharityFollowers'], [charityId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};
exports.numberOfCampaigns = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['numOfCharityCampaigns'], [charityId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};
exports.numberOfCharityCampaigns = function(charityId, callback) {
  console.log("in services");
  console.log(charityId);
  excuteQuery.queryForAll(sqlQueryMap['numOfCharityCreatedCampaigns'], [charityId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      console.log(result);
      callback(null, result[0]);
    }
  });
};
exports.charityPosts = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['feedList'], [charityId, 0], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.charityCampaigns = function(charityId, userid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['charityCampaigns'], [userid, charityId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.charityFollowers = function(charityId, userid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['followerByCharity'], [userid, charityId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.charityInfo = function(charityId, userid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['charityInformation'], [userid, charityId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};
//For charity Admins
exports.charityAdmins = function(charityId,callback) {
  excuteQuery.queryForAll(sqlQueryMap['charityAdmins'], [charityId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
//For Campaigns Data
exports.campaignDetails = function(codeId, userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['campainInformation'], [userId, userId, codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};
exports.getCampaignData = function(codeId, userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['campaignData'], [userId, codeId], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};

exports.campaignDonorsData = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['CampaignDonorDetails'], [codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.collectedAmount = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['collectedAmountForCampaign'], [codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};
exports.campaignMentions = function(codeId, callback) {
  //Changed this to use new queries.
  excuteQuery.queryForAll(sqlQueryMap['getCodeMentions'], [codeId, codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.numOfCampaignFollowers = function(codeId, callback) { // Number of Followers for the campaign - can we consolidate this?
  excuteQuery.queryForAll(sqlQueryMap['numOfCampaignFollowers'], [codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};
exports.givingLevelsOfCampaign = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['givingLevelsOfCampaign'], [codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null)
    } else if (result) {
      var total = [];
      if (result.length >= 0) {
        var total = [];
        for (var i in result) {
          if ((result[i].quantity != result[i].quantity_left) || (result[i].quantity == 0 && result[i].quantity_left == 0)) {
            total.push(result[i]);
          }
        }

        callback(null, total)
      } else {

        callback(null, result)
      }
      // console.log(result);
    }
  })
}

//getting giving levels of campaig
exports.givingLevelsOfCamp = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['givingLevelsOfCamp'], [codeId, 0], function(err, result) {
    if (err) {
      callback(new Error(err), null)
    }
    /*else if (result) {
         console.log(result);
         var total=[];
         if(result.length>=0){
           var total=[];
           for(var i in result){
             if((result[i].quantity!=result[i].quantity_left)||(result[i].quantity==0&&result[i].quantity_left==0)){
               total.push(result[i]);
             }
           }

           callback(null, total)
         }*/
    else {

      callback(null, result)
    }
    // console.log(result);
    // }
  })
}


//end
exports.campaignFollowersData = function(codeId, user_id, callback) { // Complete data for followers for the campaign page
  excuteQuery.queryForAll(sqlQueryMap['campaignFollowerDetails'], [user_id, codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.campaignCharityDetails = function(codeId, user_id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['campainCharityInformation'], [user_id, codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};

exports.fundraiserDetails = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['fundraiserDetails'], [codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};

exports.userFullDetails = function(userId, entityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['userDetails'], [entityId, userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
};
exports.getUserFollowingCampaigns = function(entityId, userId, callback) { // On User Profile Page - shows the campaigns a user is following

  excuteQuery.queryForAll(sqlQueryMap['userFollowingCampaigns'], [entityId, userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {

      excuteQuery.queryForAll(sqlQueryMap['userFollowingCampaignsFund'], [entityId, userId], function(err, result1) {
        if (err) {
          callback(new Error(err), null);
        } else if (result1) {
          result.push(result1);
          callback(null, underscore.compact(underscore.flatten(result)));

        }
      });
    }
  });
};
exports.isItManaged = function(charityId, callback) {
  excuteQuery.queryForObject(sqlQueryMap['alreadyManagedCharity'], [charityId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.getUserFollowingPeoples = function(entityId, userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['userFollowingPeople'], [entityId, userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.getUserFollowerPeoples = function(userId, entityId, callback) { // show information about each follower on a user Profile

  excuteQuery.queryForAll(sqlQueryMap['userFollowersPeople'], [entityId, userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.addNewCard = function(donationObj, cardCallback) {
  // Insert card details into credit_card_tbl;

  var cardObj = {
    last_four: donationObj['cc-number'].slice(-4),
    date_added: moment.utc().format('YYYY-MM-DD'),
    date_expires: null,
    user_id: donationObj.user_id,
    token: donationObj.credit_card_id,
    month: donationObj['cc-month'],
    year: donationObj['cc-year'],
    postal_code: donationObj.zip,
    name: donationObj.name,
    email: donationObj.email,
    payment_gateway: 'wepay'
  };

  excuteQuery.insertAndReturnKey(sqlQueryMap['saveCreditCard'], cardObj, function(err, result) {
    if (err) {
      cardCallback(new Error(err), null);
    } else {
      cardObj.id = result;
      cardCallback(null, cardObj);
      var cardObject = {
        credit_card_id: donationObj.credit_card_id,
        cardid: result
      };
      //   donationService.updateCreditCardName(cardObject);
      wepayService.authorizeCard(cardObject, function(err, authorResult) {});
    }
  });
};

exports.deleteDonorCard = function(obj, callback) {
  excuteQuery.insertAndReturnKey(sqlQueryMap['deleteDonorCard'], [obj.id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, obj);
    }
  });
};

exports.codeSerach = function(wecode, callback) {
  excuteQuery.queryForAll(sqlQueryMap['wecodesearch'], [wecode], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.categoryCharities = function(userid, group, callback) {
  excuteQuery.queryForAll(sqlQueryMap['categoryCharitys'], [userid, group], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.getStateName = function(stateid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getStateName'], [stateid], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.hashtagImages = function(hashtag, callback) {
  excuteQuery.queryForAll(sqlQueryMap['gethashtagimages'], [hashtag], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
/**
 * Method used to get All Donors.
 * @param  Code Object
 * 
 * @return List of Donors for the Campaign Including Team Campaigns.
 */
exports.givingLevels = function(obj, callback) {
  var row = {};
  if (obj.fundraiser) {
    var query = "givingLevelsOfCamp"
  } else {
    var query = "getCampaignExtraGivingLevels";
  }
  // excuteQuery.queryForAll(sqlQueryMap[query], [obj.codeId, parseInt(obj.skip)], function(err, result) {
  //   if (err) {
  //     callback(err, null);
  //   } else if (result) {
  //     callback(null, result);
  //   }
  // });
  async.parallel({
    count: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['countOfGivingLevels'], [obj.codeId, parseInt(obj.skip)], callback)
    },
    givingLevels: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap[query], [obj.codeId, parseInt(obj.skip)], callback)
    },
  }, function(err, result) {
    row.count = result.count;
    row.givingLevels = result.givingLevels;
    callback(null, row)

  });

};
exports.campaignDonors = function(obj, callback) {

if(obj.flag&&obj.flag=="charity"){
   var query='getCharityDonars';
}else{
  // if (obj.fundraiser) {
  //   var query = "CampaignDonorDetailsFund"
  // } else {
  //   var query = "getCampaignExtraDonors";
  // }
  var query="getCampaignDonors";
}
  //TODO: This need to be modified to get the right Donor List, Making into One Query Now.
  //getCampaignDonors
  excuteQuery.queryForAll(sqlQueryMap[query], [obj.codeId,parseInt(obj.skip)], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.setAsAdminUser = function(email, callback) {
  excuteQuery.queryForAll(sqlQueryMap['setUserAsAdmin'], [email], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
//getFundariserUser

exports.getFundariserUser = function(userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getFundariserDetails'], [userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.campaignDonorsDataFund = function(codeId, callback) { // show list of donors for fundraising campaign page
  excuteQuery.queryForAll(sqlQueryMap['CampaignDonorDetailsFund'], [codeId, 0], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {

      for(var i=0;i<result.length;i++){
        if(result[i].donor_comment){
          result[i].commentlength=result[i].donor_comment.length
          result[i].donor_comment = emoji.shortnameToUnicode(result[i].donor_comment);
        } else{
          result[i].commentlength=0;
        }
      }
      callback(null, result);
    }
  });
};

//Get charity donars
exports.getCharityDonars = function(charityId, callback) { // show list of donors for fundraising campaign page
  excuteQuery.queryForAll(sqlQueryMap['getCharityDonars'], [charityId, 0], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {

      for(var i=0;i<result.length;i++){
        if(result[i].donor_comment){
          result[i].commentlength=result[i].donor_comment.length
          result[i].donor_comment = emoji.shortnameToUnicode(result[i].donor_comment);
        } else{
          result[i].commentlength=0;
        }
      }
      callback(null, result);
    }
  });
};

exports.getDonorDetailsData = function(userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['donorDataSteps'], [userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.updateDonorDetails = function(obj, callback) {
  if (obj.address_2) {
    excuteQuery.queryForAll(sqlQueryMap['updateDonorAddress'], [obj.address_1, obj.address_2, obj.user_id], function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else if (result) {
        callback(null, result);
      }
    });
  } else {
    excuteQuery.queryForAll(sqlQueryMap['updateDonorAddressDetail'], [obj.address_1, obj.user_id], function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else if (result) {
        callback(null, result);
      }
    });
  }

};

exports.updateDonorCity = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['updateDonorCity'], [obj.city, obj.userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.updateDonorRelationship = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['updateDonorRelationship'], [obj.relationship, obj.userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.updateDonorReligious = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['updateDonorReligious'], [obj.religious_affiliation, obj.userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};


exports.updateDonorZipcode = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['updateDonorZipcode'], [obj.postal_code, obj.userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.updateDonorDesc = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['updateDonorDesc'], [obj.about_me, obj.userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.updateDonorPhone = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['updateDonorPhone'], [obj.home_phone, obj.userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};


exports.updateDonorCountry = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['updateDonorCountry'], [obj.country, obj.userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.updateDonorState = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['updateDonorState'], [obj.state, obj.userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.updateDonorGender = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['updateDonorGender'], [obj.gender, obj.userId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.getCountryNames = function(callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCountryNames'], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.eventDetails = function(eventId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getEventInfo'], [eventId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
}

exports.eventCreaterDetails = function(eventId, user_id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getEventCreaterInfo'], [parseInt(eventId), parseInt(eventId)], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result[0]);
    }
  });
}
exports.eventTicketsList = function(eventId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getEventTicketsList'], [eventId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
}
exports.eventShiftsList = function(eventId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getEventShiftsList'], [eventId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
}
exports.getFundraiseCampaigns = function(userId, user_id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getFundraiseCampaigns'], [userId, user_id, user_id, user_id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
}
exports.eventParticipantsList = function(eventId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['eventParticipantsList'], [eventId, eventId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
}

exports.donorCountryData = function(user_id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getDonorCurrencyData'], [user_id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
}

exports.getCharityCategories = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCharityCategories'], [obj.charity_id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (result && result.length > 0) {
        var group_title = underscore.uniq(underscore.compact(underscore.pluck(result, 'group_title')));
        callback(null, group_title);
      } else {
        callback(null, []);
      }
    }
  });
};

exports.saveDonorLocation = function(obj, callback) {
  //TODO:This Code Need to Be Refactored using the Async Call Backs.
  excuteQuery.queryForAll(sqlQueryMap['checkCountryStatus'], [obj.country], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (result && result.length > 0) {
        excuteQuery.queryForAll(sqlQueryMap['getCountryCode'], [obj.country], function(err, result) {
          if (err) {
            callback(new Error(err), null);
          } else {
            var resultObj = {};
            if (result && result.length > 0) {
              resultObj.country_id = result[0].id;
              excuteQuery.queryForAll(sqlQueryMap['getCurrencysymbol'], [resultObj.country_id], function(err, currData) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  resultObj.currency_symbol = currData[0].currency_symbol;
                  resultObj.currency_code = currData[0].currency_code;
                  resultObj.country_code = currData[0].country_code;

                  excuteQuery.queryForAll(sqlQueryMap['getStateCode'], [obj.state, resultObj.country_id], function(err, result) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      if (result && result.length > 0) {
                        resultObj.state_id = result[0].id;
                        excuteQuery.update(sqlQueryMap['saveDonorLocation'], [resultObj.country_id, resultObj.state_id, obj.city, obj.postal_code, obj.userId], function(err, result) {
                          if (err) {
                            callback(new Error(err), null);
                          } else {
                            //Sending the State and City Instead of the Codes.
                            resultObj.city = obj.city;
                            resultObj.state = obj.state;
                            resultObj.postal_code = obj.postal_code;
                            callback(null, resultObj);
                          }
                        });
                      } else {
                        excuteQuery.update(sqlQueryMap['saveDonorLocationWithOutState'], [resultObj.country_id, obj.city, obj.postal_code, obj.userId], function(err, result) {
                          if (err) {
                            callback(new Error(err), null);
                          } else {
                            resultObj.city = obj.city;
                            resultObj.postal_code = obj.postal_code;
                            callback(null, resultObj);
                          }
                        });
                      }
                    }
                  });
                }
              });
            }
          }
        });
      } else {
        obj.countrystatus = 'notallowed';
        callback(null, obj);
      }
    }
  });
};

exports.teamCampaignAdmin = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['teamCampaignAdmin'], [codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.teamCampaigns = function(codeId, userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['teamCampaigns'], [userId, codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.getDonorTeams = function(user_id, userId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['donorTeamCampaigns4'], [user_id, userId, 100], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.getDonorUniqueTeam = function(code_id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getdonorTeamCampaignsUnique'], [null, code_id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.getCampaignVideo = function(videoId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['videoData'], [videoId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      //Changed this to Include the Video Object Directly.
      if(result && result.length>0){
        callback(null, result[0]);  
      }else{
        callback(null, null);  
      }
      
    }
  });
}
exports.getCampaignUpdates = function(codeid, callback) {
  console.log("sadjbasdjasjdjb")
  console.log(codeid);
  excuteQuery.queryForAll(sqlQueryMap['campaignUpdates'], [codeid,codeid], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      console.log(result);
      console.log(result.length);
      callback(null, result);
    }
  })
}

exports.getFundraiserCampaignDetails = function(codeid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['campainData'], [codeid], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      if (result && result.length > 0) {
        excuteQuery.queryForAll(sqlQueryMap['getCampaignAdminDetails'], [codeid], function(err, adminDetails) {
          result[0].groupAdminDetails = adminDetails;
          excuteQuery.queryForAll(sqlQueryMap['getCampaignP2PDetails'], [codeid], function(err, p2pDetails) {
            result[0].p2pDetails = p2pDetails;
            callback(null, result);
          })
        })
      }
    }
  });
}

exports.outSideFollowRecommendations = function(userId, flag, skip, type, callback) {
  if (flag && flag != "undefined" && flag == "reload") {
    var limit = 1;
    skip = parseInt(skip);
  } else {
    var limit = 5;
    skip = 0;
  }
  if (!type || type === 'undefined') {
    type = '';
  }

  excuteQuery.queryForAll(sqlQueryMap['followersRecommendations' + type], [userId, limit, skip, userId, userId, limit, skip], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      console.log(result.length);
      callback(null, result);
    }
  });
};

exports.getCampaignStatistics = function(obj, callback) {
  var value;
  if (obj.statValue === 'nearcomplete') {
    value = "nearCompleteStatistics";
  } else if (obj.statValue === 'live') {
    value = "liveCampaignStatistics";
  } else if (obj.statValue === 'reported') {
    value = "reportedCampaignStatistics";
  } else {
    value = "dailyCampaignStatistics";
  }
  console.log(value);
  excuteQuery.queryForAll(sqlQueryMap[value], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }

  })
}
exports.donorsList = function(obj, callback) {
var paramArray = [];
  if (obj.type === 'charity') {
    var query = "charityDonorsList";
    paramArray.push(obj.id);
    paramArray.push(obj.id);
  } else {
    var query = "donorsList";
    paramArray.push(obj.id);
  }

  excuteQuery.queryForAll(sqlQueryMap[query], paramArray, function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  })
}
exports.newteamCampaignAdmin = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['newteamCampaignAdmin'], [codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.getGivingLevelsCount = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['countOfGivingLevels'], [codeId], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'Error occured while getting the getGivingLevelsCount');
      callback(new Error(err), null);
    } else {
      console.log("in donor services");
      console.log(result);
      callback(null, result);
    }
  })
}
exports.getDonorCommentCount = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getDonorCommentCount'], [codeId], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'Error occured while getting the donorcommentscount');
      callback(new Error(err), null);
    } else {
      console.log("in donor services");
      console.log(result);
      callback(null, result);
    }
  })
}
exports.gettingCampTeamCaptains = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['gettingCampTeamCaptains'], [codeId], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'error while getting the code team captains');
      callback(new Error(err), null);
    } else {
      callback(null, result);
    }
  });
}
exports.getCampaignDonorsCampaignCount = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getTotalDonorsCOunt'], [codeId], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'error while getting the totaldonors count for mobile');
      callback(new Error(err), null);
    } else {
      callback(null, result[0]);
    }
  });
}


exports.getCampaignDonorsCampaignCount = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getTotalDonorsCOunt'], [codeId], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'error while getting the totaldonors count for mobile');
      callback(new Error(err), null);
    } else {
      callback(null, result[0]);
    }
  });
}
