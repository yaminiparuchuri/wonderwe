
exports.getSiteMapHome = function(callback) {

  var smResult = {};
  var countriesArray = [];
  var cityList = [];

  excuteQuery.queryForAll(sqlQueryMap['sitemapCountryList'], function(err, countryResult) {
    if (err) {
      callback(err, null);
    } else {
      async.each(countryResult, function(eachCountryObj, eachCallback) {
        var countryObj = {};
        countryObj.country_name = eachCountryObj.country_name;
        countryObj.country_code = eachCountryObj.country_code.toLowerCase();
        excuteQuery.queryForAll(sqlQueryMap['sitemapHome'], [eachCountryObj.country_id,eachCountryObj.country_id], function(err, result) {
          if (err) {
            eachCallback(err);
          } else {
            countryObj.cityList = result;
            countriesArray.push(countryObj);
            eachCallback(null);

          }
        });
      }, function(err) {

        smResult = countriesArray.sort(countryNameComparator);
        callback(null, smResult);
      });

    }
  });
};

exports.getSiteMapHomeCity = function(city, callback) {

  excuteQuery.queryForAll(sqlQueryMap['sitemapHomeCity'], [city, city, city, city, city], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};

exports.seoMetaDataUtility = function(seoPageType, seoPageObj) {

    var pageSeoData = {};
    pageSeoData.domain = props.domain;
    if (pageSeoData.domain == 'https://www.wonderwe.com') {
      pageSeoData.indexStatus = 'index';
    }

    if (seoPageType == 'user') {

      pageSeoData.seoPageType = "user";

      if (seoPageObj.user.city != null && seoPageObj.user.state != null) {
        pageSeoData.seoTitle = seoPageObj.user.name + " (@" + seoPageObj.user.userSlug + "), " + seoPageObj.user.city + "-" + seoPageObj.user.state;
        pageSeoData.seoDescription = "Follow " + seoPageObj.user.name + "'s profile on WonderWe. Check out the people, organizations, and fundraisers that " + seoPageObj.user.name + " follows.  Discover more people in " + seoPageObj.user.city + " on WonderWe.";
        pageSeoData.seoKeywords = seoPageObj.user.name + ", fundraisers, posts, campaigns, non profit organizations, wonderwe, followers," + seoPageObj.user.city + "," + seoPageObj.user.state;
      } else {
        pageSeoData.seoTitle = seoPageObj.user.name + " (@" + seoPageObj.user.userSlug + ")";
        pageSeoData.seoDescription = "Follow " + seoPageObj.user.name + "'s profile on WonderWe. Check out the people, organizations, and fundraisers that " + seoPageObj.user.name + " follows.";
        pageSeoData.seoKeywords = seoPageObj.user.name + ", fundraisers, posts, campaigns, non profit organizations, wonderwe, followers,";
      }

      pageSeoData.seoAndroidSlugUrl = "user/other/profile/" + seoPageObj.user.userSlug;

      pageSeoData.seoImageUrl = seoPageObj.user.profile_pic_url;
      pageSeoData.seoSlugUrl = seoPageObj.user.userSlug;
      pageSeoData.seoSocialTitle = "Follow " + seoPageObj.user.name + "(@" + seoPageObj.user.userSlug + ") on WonderWe";
      pageSeoData.seoOgType = "wonderwe:user";

      pageSeoData.seoLJPersonName = seoPageObj.user.name;
      // pageSeoData.seoLJPersonEmail = "";
      pageSeoData.seoLJPersonImageUrl = seoPageObj.user.profile_pic_url;
      // pageSeoData.seoLJPersonTelephone = "";

      if (seoPageObj.user.city != null && seoPageObj.user.state != null) {
        pageSeoData.seoLJAddressLocality = seoPageObj.user.city + ", " + seoPageObj.user.state;
      }

      // pageSeoData.seoLJAddressRegion = "";
      // pageSeoData.seoLJPostalCode = "";
      // pageSeoData.seoLJStreetAddress = "";

      return pageSeoData;

    }

    if (seoPageType == 'organization') {

      pageSeoData.seoPageType = "organization";
      if (seoPageObj.charityInfo.city != null && seoPageObj.charityInfo.state != null) {
        pageSeoData.seoTitle = seoPageObj.charityInfo.name_tmp + " (@" + seoPageObj.charityInfo.slug + "), " + seoPageObj.charityInfo.city + "-" + seoPageObj.charityInfo.state;
        pageSeoData.seoKeywords = seoPageObj.charityInfo.name_tmp + ", fundraiser, organization, charity, profile, social media, crowdfunding, fundraising, wonderwe, campaign, donate," + seoPageObj.charityInfo.city + ", " + seoPageObj.charityInfo.state;
      } else {
        pageSeoData.seoTitle = seoPageObj.charityInfo.name_tmp + " (@" + seoPageObj.charityInfo.slug + ")";
        pageSeoData.seoKeywords = seoPageObj.charityInfo.name_tmp + ", fundraiser, organization, charity, profile, social media, crowdfunding, fundraising, wonderwe, campaign, donate";
      }
      pageSeoData.seoDescription = seoPageObj.charityInfo.full_description;
      pageSeoData.seoImageUrl = seoPageObj.charityInfo.profile_pic_url;
      pageSeoData.seoSlugUrl = seoPageObj.charityInfo.slug;
      pageSeoData.seoSocialTitle = "Click Here To Support " + seoPageObj.charityInfo.name_tmp + " On WonderWe";
      pageSeoData.seoOgType = "wonderwe:organization";

      pageSeoData.seoAndroidSlugUrl = "charity/" + seoPageObj.charityInfo.slug;

      pageSeoData.seoLJWebUrl = seoPageObj.charityInfo.web_url;
      pageSeoData.seoLJDescription = pageSeoData.seoDescription;
      pageSeoData.seoLJName = seoPageObj.charityInfo.name_tmp;
      if (seoPageObj.charityInfo.city != null && seoPageObj.charityInfo.state != null) {
        pageSeoData.seoLJAddressLocality = seoPageObj.charityInfo.city + ", " + seoPageObj.charityInfo.state;
      }

      return pageSeoData;
    } if (seoPageType == 'campaign') {
      pageSeoData.seoPageType = "campaign";
      if (seoPageObj.campaignInfo.city != null && seoPageObj.campaignInfo.state != null) {
        pageSeoData.seoTitle = seoPageObj.campaignInfo.title + ", " + seoPageObj.campaignInfo.city + " - " + seoPageObj.campaignInfo.state;
        pageSeoData.seoKeywords = seoPageObj.campaignInfo.type + ", fundraising, crowdfunding, " + seoPageObj.campaignInfo.creator_name + ", " + moment.utc(seoPageObj.campaignInfo.start_date).format('YYYY-MM-DD') + ", campaign, fundraiser, raise money, wonderwe, donate, give, donation" + seoPageObj.campaignInfo.city + "," + seoPageObj.campaignInfo.state;
      } else {
        pageSeoData.seoTitle = seoPageObj.campaignInfo.title;
        pageSeoData.seoKeywords = seoPageObj.campaignInfo.type + ", fundraising, crowdfunding, " + seoPageObj.campaignInfo.creator_name + ", " + moment.utc(seoPageObj.campaignInfo.start_date).format('YYYY-MM-DD') + ", campaign, fundraiser, raise money, wonderwe, donate, give, donation";
      }
      pageSeoData.seoDescription = seoPageObj.campaignInfo.description;
      pageSeoData.seoImageUrl = seoPageObj.campaignInfo.code_picture_url;
      pageSeoData.seoSlugUrl = seoPageObj.campaignInfo.campaignSlug;
      pageSeoData.seoSocialTitle = "Click Here To Support " + seoPageObj.campaignInfo.title + " by " + seoPageObj.campaignInfo.creator_name;
      //Cross Verify below value
      pageSeoData.seoOgType = "wonderwe:" + seoPageObj.campaignInfo.type;
      if(seoPageObj.fundraiseUser !=null){
      pageSeoData.isCampaignCreator = 'true';
      pageSeoData.seoCampaignCreatorSlug = seoPageObj.fundraiseUser.slug;
      }

      pageSeoData.seoAndroidSlugUrl = "campaignProfile/" + seoPageObj.campaignInfo.campaignSlug;

      pageSeoData.seoLJCampaignName = seoPageObj.campaignInfo.title;
      pageSeoData.seoLJCampaignImageUrl = seoPageObj.campaignInfo.code_picture_url;
      pageSeoData.seoLJCampaignDesc = seoPageObj.campaignInfo.full_description;
      //pageSeoData.seoLJCampaignOrgName = seoPageObj.owner.title;

      if (seoPageObj.campaignInfo.creator_name != null) {
        pageSeoData.seoLJCampaignOrgType = "Person";
        pageSeoData.seoLJCampaignCreator = seoPageObj.campaignInfo.creator_name;
      } else {
        pageSeoData.seoLJCampaignOrgType = "Organization";
      }

      if (seoPageObj.campaignInfo.city != null && seoPageObj.campaignInfo.state != null) {
        pageSeoData.seoLJAddressLocality = seoPageObj.campaignInfo.city + ", " + seoPageObj.campaignInfo.state;
      }
      pageSeoData.seoLJCampaignStartDate = moment.utc(seoPageObj.campaignInfo.date_created).format('YYYY-MM-DD');
      pageSeoData.seoLJCampaignSlugUrl = seoPageObj.campaignInfo.campaignSlug;;

      return pageSeoData;
    }else if(seoPageType === 'team'){
      console.log('In the team');
      pageSeoData.seoPageType = 'Team';
      console.log(seoPageObj.teamDetails);
      pageSeoData.seoTitle = seoPageObj.teamDetails.team_name;
      pageSeoData.seoDescription = seoPageObj.teamDetails.team_description;      
        //pageSeoData.seoKeywords = seoPageObj.teamDetails.type + ", fundraising, crowdfunding, " + seoPageObj.campaignInfo.creator_name + ", " + moment.utc(seoPageObj.campaignInfo.start_date).format('YYYY-MM-DD') + ", campaign, fundraiser, raise money, wonderwe, donate, give, donation";
      pageSeoData.seoImageUrl = seoPageObj.teamDetails.team_logo;        
      pageSeoData.seoSlugUrl = seoPageObj.getEntityOfTeam[0].slug;      
      pageSeoData.seoSocialTitle = "Click Here To Support " + seoPageObj.teamDetails.team_name + " by " + seoPageObj.teamDetails.team_captain;
      pageSeoData.seoOgType = 'wonderwe:ongoing';
      console.log('Beofre sending pageseodata');
      console.log(pageSeoData.seoSlugUrl);
      return pageSeoData;
    }
  }
  //End: SEO Util function

var countryNameComparator = function(a, b) {
  if (a.country_name < b.country_name) {
    return -1;
  } else if (a.country_name > b.country_name) {
    return 1;
  } else {
    return 0;
  }
}
