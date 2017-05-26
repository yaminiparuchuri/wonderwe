//THIS FILE HAVE GET INITIAL CODES FOR CHARITY AND GET HOW MANY CHARITY DOES USER HAVE

require("./campaign_spec");

require("./charityadmin_spec");

// INFO:- charityinitialcodes have response back from getInitialsCodesAction
charitylistuser = [];

// INFO:- charitylistuser have response back from useridForCharityAction
charityinitialcodes = [];

useridForCharityAction = function(data) {

  //INFO:-tokenuserobject and existClaimDoner have logged in user data
  tokenuserobject = data;
  existClaimDoner = data;

  frisby.create('Gets user charity if he/she have').get(URL + "charity/getCharityDetails/" + data.data[0].user_id).timeout(25000).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(function(json) {

    //INFO:- charitylistuser have response of charity details which is an array
    charitylistuser = json;

    // Here we have claimed charity already so expected response should have one charity.
    expect(json.data.length).toBe(1);

    createCampaignEventAction(charitylistuser);

  }).inspectBody().toss();

};

getInitialsCodesAction = function(data) {

  frisby.create('Getting the Initial codes of particular Charity').get(URL + "code/" + createcampeventresponse.data.charity_id, {
    'Content-Type': 'application/json'
  }).timeout(40000).expectStatus(200).afterJSON(function(json) {

    //INFO:- charityinitialcodes have repose of all the campaign
    charityinitialcodes = json;

 // Here we have created 2 campaings already so expected response should have 2 codes.
    expect(json.data.length).toBe(2);

    createAdminNewAction(charityinitialcodes);

  }).inspectBody().toss();

};
