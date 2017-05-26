//THIS FILE HAVE CAMPAINGN CREATION AND UPDATE ACTION CALLS

require("./charitydetails_spec");

createCampaignEventAction = function(data) {

  frisby.create('Create event Campaign').post(URL + "code/", {

      "address_1": "church street ",
      "address_2": "near to mcdonals",
      "campaign_zip": "66223",
      "charity_id": charitylistuser.data[0].charityId,
      "city": "pitsberg",
      "code_picture_url": "http://2.bp.blogspot.com/-T6PqyDX5pQA/VE4Xix-ezEI/AAAAAAAA_es/qK9oAwWoN1A/s1600/CLEAN1.jpg",
      "code_text": "TCFA",
      "description": "I'm Creating this for test case",
      "end_date": "07/12/2015",
      "file": "",
      "files": "",
      "goal": "1000",
      "start_date": "07/04/2015",
      "state": "KS",
      "suggested_donation": "25.00",
      "title": "Clean India",
      "type": "event",
      "user_id": charitylistuser.data[0].id,
    }).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(updateCampaignEventAction)
    .inspectBody().toss();
};

createCampaignOngoingAction = function(data) {

  frisby.create('Create Ongoing Campaign').post(URL + "code/", {

    "address_1": "",
    "address_2": "",
    "campaign_zip": "",
    "charity_id": charitylistuser.data[0].charityId,
    "city": "",
    "code_picture_url": "https://pbs.twimg.com/profile_images/563489207381811200/cyq-1To9.jpeg",
    "code_text": "TOAC",
    "description": "Ongoaing desc.",
    "end_date": "",
    "file": "",
    "files": "",
    "goal": "1000",
    "start_date": "",
    "state": "",
    "suggested_donation": "25.00",
    "title": "Test Ongoing ",
    "type": "ongoing",
    "user_id": charitylistuser.data[0].id
  }, {
    'content-type': 'application/json'
  }).expectStatus(200).afterJSON(function(json) {

    createcampongoingresponse = json;

  }).afterJSON(updateCampaignOngoingAction).inspectBody().toss();

};

updateCampaignEventAction = function(data) {

  //INFO :- createcampeventresponse have response from created event campaign

  createcampeventresponse = data;

  frisby.create('Update event Campaign').put(URL + "code/" + createcampeventresponse.data.id, {

    "address_1": "church street ",
    "address_2": "near to mcdonals",
    "campaign_zip": "66223",
    "city": "pitsberg",
    "code_picture_url": "http://4.bp.blogspot.com/-cW8Vo49-L7A/VC4vT-4w2zI/AAAAAAAAATU/w4JslqcYWEg/s1600/clean%2Bindia.JPG",
    "code_text": "TCFA",
    "codeimage": "",
    "description": "hello i'm creating a campaing for test the auto case for node api calls",
    "end_date": "07/11/2015",
    "file": "",
    "files": "",
    "goal": "1000",
    "id": createcampeventresponse.data.id,
    "picture": "",
    "start_date": "07/03/2015",
    "state": "KS",
    "suggested_donation": "10",
    "title": "Updated clean India",
    "type": "event",
    "user_id": charitylistuser.data[0].id
  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').timeout(30000).afterJSON(createCampaignOngoingAction).inspectBody().toss();

};

updateCampaignOngoingAction = function(date) {

  //INFO:- createcampongoingresponse have creted ongoing response

  frisby.create('update Campaign ongoing ').put(URL + "code/" + createcampongoingresponse.data.id, {

    "address_1": "",
    "address_2": "",
    "campaign_zip": "",
    "city": "",
    "code_picture_url": "http://carolinastylemag.com/wp-content/uploads/2013/03/Kind-Logo.jpg",
    "code_text": "TOAC",
    "codeimage": "",
    "description": "Ongoaing desc. from test case",
    "end_date": "",
    "file": "",
    "files": "",
    "goal": "1000",
    "id": createcampongoingresponse.data.id ,
    "picture": "",
    "start_date": "07/03/2015",
    "state": null,
    "suggested_donation": "25",
    "title": "Test Ongoing Update",
    "type": "ongoing",
    "user_id": charitylistuser.data[0].id,
  }, {
    'content-type': 'application/json'
  }).expectStatus(200).afterJSON(getInitialsCodesAction).inspectBody().toss();

};
