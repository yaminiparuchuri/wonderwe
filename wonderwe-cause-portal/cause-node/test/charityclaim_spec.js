//THIS FILE HAVE CLAIM ACTION CALLS

require("./charitydetails_spec");

clamedresponse = {};

charityClaimAction = function(data) {

  //INFO:- totalcharity have data from guide star it is an array
  totalCharity = data;

  frisby.create('Donor claims charity First time').post(URL + "charity/" + data.data[0].id + "/claim/", {

    "acceptTerms": "on",
    "charity_title": "Swope Corridor Renaissance/upper Room",
    "ein": "345465677",
    "email_address": tokenuserobject.data[0].email,
    "first_name": "Kusuma Test",
    "id": data.data[0].id,
    "last_name": "Auto Case",
    "phone_number": "9134567893",
    "title": "co-founder"
  }, {
    json: true
  }, {
    'Content-Type': 'application/json'
  }).expectStatus(200).timeout(50000).afterJSON(clamedApprovalAction).inspectBody().toss();

};

clamedApprovalAction = function(data) {

  //INFO:-clamedresponse have charity claimed response is object
  clamedresponse = data;

  frisby.create('clamed Approval Action').post(URL + "charity/user/claim/approval", {
    "id": data.data.id
  }, {
    json: true
  }, {
    'Content-Type': 'application/json'
  }).expectStatus(200).timeout(50000).afterJSON(afterClaimLoginAction).inspectJSON().toss();

};

globalTokenSetAfter = function(data) {

  token = data.data.token;
  frisby.globalSetup({ // globalSetup is for ALL requests
    request: {
      headers: {
        'x-access-token': data.data.token
      }
    }
  });
};

afterClaimLoginAction = function(data) {

  frisby.create('after Claim Login For user Account').post(URL + "auth/login", {

    "email": "kusuma.isolvers+donor20@gmail.com",
    "password": "kusuma1"

  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(globalTokenSetAfter).afterJSON(afterTokenValidationAction).timeout(10000).inspectBody().toss();

};
afterTokenValidationAction = function(data) {

  frisby.create('Token verification after claim').get(URL + "auth/token/verify?token=" + data.data.token).expectStatus(200).expectHeaderContains('content-type', 'application/json').timeout(10000).afterJSON(useridForCharityAction).inspectBody().toss();

};
