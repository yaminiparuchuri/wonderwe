//THIS FILE HAVE FOLLOW ACTION CALLS
require("./donorreg_spec");
require("./donordashboard_spec");

charityFollowersAction = function(data) {

  //INFO:-Newdonoruserdata donor user data
  Newdonoruserdata = data;

  frisby.create('Gets who follows charity').get(URL + "follower/charity/" + charitylistuser.data[0].charityId)
    .expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(followDonorAction).inspectBody().toss();

};

followDonorAction = function(data) {
  frisby.create('Donor trying to follow other User/Donor').post(URL + "follower/user/" + donoruserdata.data[0].user_id, {
    "user_id": Newdonoruserdata.data[0].user_id
  }, {
    'content-type': 'application/json'
  }).timeout(10000).expectStatus(200).afterJSON(followCodeAction).inspectBody().toss();

};

followCodeAction = function(data) {

  frisby.create('Donor trying to follow code').post(URL + "follower/code/" + createcampeventresponse.data.id, {
    "user_id": Newdonoruserdata.data[0].user_id
  }, {
    'content-type': 'application/json'
  }).timeout(20000).expectStatus(200).afterJSON(followCharityAction).inspectBody().toss();
};

followCharityAction = function(data) {

  frisby.create('Donor trying to follow charity').post(URL + "follower/charity/" + charitylistuser.data[0].charityId, {
    "user_id": Newdonoruserdata.data[0].user_id
  }, {
    'content-type': 'application/json'
  }).timeout(10000).expectStatus(200).afterJSON(followCharityAction2).inspectBody().toss();

};

followCharityAction2 = function(data) {
 
  frisby.create('Donor trying to follow charity').post(URL + "follower/charity/" + totalCharity.data[1].id, {
    "user_id": Newdonoruserdata.data[0].user_id
  }, {
    'content-type': 'application/json'
  }).timeout(10000).expectStatus(200).afterJSON(unFollowCharityAction).inspectBody().toss();

};

unFollowCharityAction = function(data) {
  
  frisby.create('Donor trying to follow charity').post(URL + "follower/unfollow/charity/" + totalCharity.data[1].id, {
    "user_id": Newdonoruserdata.data[0].user_id
  }, {
    'content-type': 'application/json'
  }).timeout(10000).expectStatus(200).afterJSON(mentionUserAction).inspectBody().toss();

};
