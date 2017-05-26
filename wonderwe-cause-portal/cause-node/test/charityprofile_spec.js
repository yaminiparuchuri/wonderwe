//THIS FILE HAVE Charity profile update details
require("./charityadmin_spec");

charityProfileAction = function(data) {

  frisby.create('Charity Org Profile Details').put(URL + "charity/profile/charity/" + charitylistuser.data[0].charityId, {

    "file": "",
    "profile_pic_url": "https://wonderwe.s3.amazonaws.com/profile/5100d273-a580-44ae-aa80-e71297312700-kitten_a4swuc_scaledjpg.jpg",
    "brief_description": " test charity discription from test casess from login call coniusely",
    "web_url": "http://www.google.co.in",
    "category[]": [1967, 1991, 2026],
    "charityId": charitylistuser.data[0].charityId
  }, {
    json: true
  }, {
    'Content-Type': 'application/json'
  }).expectStatus(200).timeout(15000).afterJSON(createAdminNewAction).inspectJSON().toss();

};
