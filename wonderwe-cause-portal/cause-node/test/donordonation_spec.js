//THIS FILE HAVE DONONATIONS FOR CHARITY
require("./charityanalytics_spec");
onetimeDonationAction = function(data) {

  frisby.create('one Time Donation Account').post(URL + "donations/onetime", {
    "amount": "100",
    "cc-cvv": "4003",
    "cc-month": "09",
    "cc-number": "4003830171874018",
    "cc-year": "2019",
    "charity_id": charitylistuser.data[0].charityId,
    "code_id": createcampeventresponse.data.id,
    "credit_card_id": 2727899391,
    "email": existClaimDoner.data[0].email,
    "name": "Trinesh Yadla",
    "typeof_payment": "one time",
    "user_id": existClaimDoner.data[0].user_id,
    "zip": "66223"

  }, {
    json: true
  }, {
    'content-type': 'application/json'
  }).timeout(20000).expectStatus(200).afterJSON(monthlyDonationAction).inspectBody().toss();

};

monthlyDonationAction = function(data) {

  frisby.create('monthly Donation Account').post(URL + "donations/monthly/subscription", {

    "amount": "100",
    "cc-cvv": "4003",
    "cc-month": "09",
    "cc-number": "4003830171874018",
    "cc-year": "2019",
    "charity_id": charitylistuser.data[0].charityId,
    "code_id": createcampeventresponse.data.id,
    "credit_card_id": 2727899391,
    "email": existClaimDoner.data[0].email,
    "name": "Trinesh Yadla",
    "typeof_payment": "one time",
    "user_id": existClaimDoner.data[0].user_id,
    "zip": "66223"

  }, {
    json: true
  }, {
    'content-type': 'application/json'
  }).timeout(20000).expectStatus(200).afterJSON(getSavedCardsAction).inspectBody().toss();

};

getSavedCardsAction = function(data) {

  frisby.create('Get Saved Cards Details').get(URL + "donations/donor/" + existClaimDoner.data[0].user_id + "/cards").expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(donorDonationsHistory).toss();

};

donorDonationsHistory = function(data) {

  frisby.create('donor donations history').get(URL + "donations/donor/" + existClaimDoner.data[0].user_id + "/transactions", {
    'content-type': 'application/json'
  }).timeout(20000).expectStatus(200).inspectBody().toss();
};
