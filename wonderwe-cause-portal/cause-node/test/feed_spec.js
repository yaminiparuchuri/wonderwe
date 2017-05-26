//THIS FILE HAVE FEED AND MENTION ACTION CALLS
require("./donorreg_spec");
require("./charityprofile_spec");
require("./donorlogin_spec");
require("./repostorreply_spec");
require("./donordashboard_spec");

postFeedAction = function(data) {

  //need to add charity title

  frisby.create('Post feed from charity without any mention one').post(URL + "feed/", {

   // INFO :-  data is from modify Admin User permission

    "charityId": data.data.charity_id,
    "city": "Kansas City",
    "content": "hey i'm trying to post in my wall using test case.",
    "entity_id": charitylistuser.data[0].entity_id,
    "headline": null,
    "image": "https://wonderwe.s3.amazonaws.com/profile/10344a9c-068d-4bf5-9454-be11815a51af-default-charitypng.png",
    "image_url": "http://rack.3.mshcdn.com/media/ZgkyMDEyLzEyLzIwL2Y3L2dpdmVjaGFyaXR5Ljk0YzY2LmpwZwpwCXRodW1iCTk1MHg1MzQjCmUJanBn/a9aa7a20/73e/give-charity-donations.jpg",
    "mentions": [],
    "state": "MO",
    "status_type": "post",
    "title":""
  }, {
    json: true
  }, {
    "content-type": "application/json"
  }).timeout(40000).expectStatus(200).afterJSON(postFeedAction2).inspectBody().toss();

};

postFeedAction2 = function(data) {

  abovepostresponse = data;

  frisby.create('Post feed from charity without any mention second').post(URL + "feed/", {

    "charityId": abovepostresponse.data.charityId,
    "city": "Kansas City",
    "content": "hey i'm trying to post in my wall using test case second one.",
    "entity_id": abovepostresponse.data.entity_id,
    "headline": null,
    "image": "https://wonderwe.s3.amazonaws.com/profile/10344a9c-068d-4bf5-9454-be11815a51af-default-charitypng.png",
    "image_url": "http://static1.squarespace.com/static/5127f7b0e4b0706f4bc5db3e/t/546b42d6e4b006269fadf5ae/1416315607088/",
    "mentions": [],
    "state": "MO",
    "status_type": "post",
    "title": abovepostresponse.data.title
  }, {
    json: true
  }, {
    "content-type": "application/json"
  }).timeout(40000).expectStatus(200).afterJSON(postFeedAction3).inspectBody().toss();

};
postFeedAction3 = function(data) {
  abovepostresponse = data;
  frisby.create('Post feed from charity without any mention third').post(URL + "feed/", {
    "charityId": abovepostresponse.data.charityId,
    "city": "Kansas City",
    "content": "hey i'm trying to post in my wall using test case third one.",
    "entity_id": abovepostresponse.data.entity_id,
    "headline": null,
    "image": "https://wonderwe.s3.amazonaws.com/profile/10344a9c-068d-4bf5-9454-be11815a51af-default-charitypng.png",
    "image_url": "http://static.guim.co.uk/sys-images/MONEY/Pix/pictures/2011/3/25/1301056655348/charity-tin-collect-donat-007.jpg",
    "mentions": [],
    "state": "MO",
    "status_type": "post",
    "title": abovepostresponse.data.title

  }, {
    json: true
  }, {
    "content-type": "application/json"
  }).timeout(40000).expectStatus(200).afterJSON(postFeedAction4).inspectBody().toss();

};
postFeedAction4 = function(data) {

  abovepostresponse = data;

  frisby.create('Post feed from charity without any mention four').post(URL + "feed/", {
    "charityId": abovepostresponse.data.charityId,
    "city": "Kansas City",
    "content": "hey i'm trying to post in my wall using test case fourth one.",
    "entity_id": abovepostresponse.data.entity_id,
    "headline": null,
    "image": "https://wonderwe.s3.amazonaws.com/profile/10344a9c-068d-4bf5-9454-be11815a51af-default-charitypng.png",
    "image_url": "http://i2.cdn.turner.com/cnnnext/dam/assets/111128070140-child-charity-story-top.jpg",
    "mentions": [],
    "state": "MO",
    "status_type": "post",
    "title": abovepostresponse.data.title
  }, {
    json: true
  }, {
    "content-type": "application/json"
  }).timeout(40000).afterJSON(deleteFeedAction).inspectBody().toss();

};

/*getFeedDtata = function(data){
  
  //TODO: userId and skip get dynamically.........

  console.log("in get feed dataa...............................");
  frisby.create('get Post feed from org').get(URL + "feed/list/" +charitylistuser.data[0].user_id, +0, {
    "content-type" : "application/json"
  }).timeout(40000).expectStatus(200).expectStatus(200).afterJSON().inspectBody().toss();
};*/


deleteFeedAction = function(data) {
  abovepostresponse = data;
  frisby.create('Delete Feed').delete(URL + "feed/" + abovepostresponse.data.id).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(donorRegisterUserDonor).inspectBody().toss();
};


// reGetPosts = function(data){

//  //TODO:NEED TO BE GIVEN USERID dynamicaly 
//  //TODO:NEED to be given skip dynamically
//  console.log("after delete the post get the remaining posts.....................")
//  frisby.create('get Feed').get(URL + "feed/list/"+ userId + skip).expectStatus(200).expectHeaderContains('content-type', 'application/json').inspectBODY().toss();
// };

mentionUserAction = function(data) {

  newDonordata = data;
 
  frisby.create('Mention the user from Test case').post(URL + "feed/", {

    "city": "hyd",
    "content": "@anusha having fun while trying to mention her name from test case",
    "entity_id": existClaimDoner.data[0].entity_id, //charity entity id get it dynamically
    "headline": null,
    "image_url": "http://www.pxleyes.com/images/contests/wild%20animals/fullsize/wild%20animals_4b4c7bb07b9d6_hires.jpg",
    "in_reply_id": null,
    "mentions": [{
      "image": null, //if user have image then get it
      "suggestedname": "sivarao",
      "suggestid": donoruserdata.data[0].user_id, //sivarao user id get it dynamically
      "type": "user"
    }],
    "original_entity_id": null,
    "state": "HI",
    "status_type": "Post"
  }, {
    json: true
  }, {
    'content-type': 'application/json'
  }).timeout(50000).expectStatus(200).afterJSON(mentionCharityAction).inspectBody().toss();

};

mentionCharityAction = function(data) {
  frisby.create('Mention the Charity from Test case').post(URL + "feed/", {

    //TODO:entity id  and suggested charity id get it dynamically

    "city": "hyd",
    "content": "now i'm trying to mention @PARTNERS HEALTHCARE SYSTEM INC and test it from Test case",
    "entity_id": existClaimDoner.data[0].entity_id,
    "headline": null,
    "image_url": "",
    "in_reply_id": null,
    "mentions": [{
      "image": "https://wonderwe.s3.amazonaws.com/profile/eaa53f6b-6804-4a68-a5c8-4743de715ce8-smilejpg.jpg",
      "suggestedname": "PARTNERS HEALTHCARE SYSTEM INC",
      "suggestid": charitylistuser.data[0].charity_id,
      "type": "charity"
    }],
    "original_entity_id": null,
    "state": "HI",
    "status_type": "Post"
  }, {
    json: true
  }, {
    'content-type': 'application/json'
  }).timeout(40000).expectStatus(200).afterJSON(mentionCodeAction).inspectBody().toss();

};

mentionCodeAction = function(data) {
  frisby.create('Mention the WE Code from Test case').post(URL + "feed/", {

    //TODO: entity id  and code id get it dynamically

    "city": "hyd",
    "content": "We#molestie trying to mention from test case",
    "entity_id": existClaimDoner.data[0].entity_id,
    "headline": null,
    "in_reply_id": null,
    "mentions": [{
      "image": null,
      "suggestedname": "molestie",
      "suggestid": charityinitialcodes.data[0].id,
      "type": "code"
    }],
    "original_entity_id": null,
    "state": "HI",
    "status_type": "Post"

  }, {
    json: true
  }, {
    'content-type': 'application/json'
  }).timeout(40000).expectStatus(200).afterJSON(mentionHashtagAction).inspectBody().toss();

};

mentionHashtagAction = function(data) {
  frisby.create('Mention the WE Code from Test case').post(URL + "feed/", {

    //TODO: entity id get it dynamically

    "city": "hyd",
    "content": "#charity will be used ",
    "entity_id": existClaimDoner.data[0].entity_id,
    "hashtags": ["#charity"],
    "headline": null,
    "in_reply_id": null,
    "original_entity_id": null,
    "state": "HI",
    "status_type": "Post",
  }, {
    json: true
  }, {
    'content-type': 'application/json'
  }).timeout(40000).expectStatus(200).afterJSON(adminexistloginAction).inspectBody().toss();

};
////admin login 

adminexistloginAction = function(data) {
  frisby.create('Login For user Account').post(URL + "auth/login", {

    "email": "pentelaanusha@gmail.com",
    "password": "anu@1"

  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(adminexistglobalTokenSet).afterJSON(adminexisttokenValidationAction).timeout(40000).inspectBody().toss();

};

adminexistglobalTokenSet = function(data) {
  token = data.data.token;
  frisby.globalSetup({ // globalSetup is for ALL requests
    request: {
      headers: {
        'x-access-token': data.data.token
      }
    }
  });
};

adminexisttokenValidationAction = function(data) {
  frisby.create('Token verification').get(URL + "auth/token/verify?token=" + data.data.token).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(getAllmentionsForCharity).timeout(40000).inspectBody().toss();

};

getAllmentionsForCharity = function(data) {
  frisby.create('Get ALL MENtions Action').get(URL + "feed/mentions/" + charitylistuser.data[0].charityId, {
    'content-type': 'application/json'
  }).timeout(30000).expectStatus(200).afterJSON(repostAction).inspectBody().toss();
};

getMentionsAndReplysforcharity = function(data) {

  frisby.create('Mention the WE Code from Test case').get(URL + "feed/mentionsandreplies/" + charitylistuser.data[0].charity_id, +0, {
    json: true
  }, {
    'content-type': 'application/json'
  }).timeout(40000).expectStatus(200) /*.afterJSON(getCodeMentionsAndreplies)*/ .inspectBody().toss();

};


getCodeMentionsAndreplies = function(data) {
  frisby.create('Mention the WE Code from Test case').get(URL + "feed/code/mentionsandreplies/" + charityinitialcodes.data[0].id, +5, {
    'content-type': 'application/json'
  }).timeout(40000).expectStatus(200).afterJSON().inspectBody().toss();
};

charityMentionsReply = function(data) {
  frisby.create('Get ALL MENtions Action').post(URL + "feed/mentions/inset/reply", {

    "in_reply_id": "188",
    "entity_id": null,
    "date_posted": "2015-04-27 04:39:34",
    "ip_address": null,
    "hostname": null,
    "city": "hyd",
    "state": "TS",
    "content": "Hai naren",
    "status_type": "post",
    "image_url": null
  }, {
    'content-type': 'application/json'
  }).timeout(30000).expectStatus(200).afterJSON().inspectBody().toss();

};
