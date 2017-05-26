//THIS FILE HAVE DONOR PROFILE DETAILS and PASSWORD RESET
require("./donordonation_spec");

donorProfileGetAction = function(data) {

  frisby.create('Get Donor Profile Details').get(URL + "donors/user/profile/" + Newdonoruserdata.data[0].user_id).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(donorProfileUpdateAction).inspectBody().toss();

};

donorProfileUpdateAction = function(data) {

  frisby.create('Update Donor Profile Details').post(URL + "settings/update/account/details", {

    "address_1": "Madhura Nager",
    "address_2": "saradhi studious,coffee day,Ameerpet",
    "city": "Hyderbad",
    "state": "LA",
    "postal_code": "66223",
    "email": Newdonoruserdata.data[0].email,
    "id": Newdonoruserdata.data[0].user_id,
    "name": Newdonoruserdata.data[0].name,
    "phone": "9885933281",
    "profile_pic_url": "http://mashnewsinfo.com/wp-content/uploads/2015/03/gal-gadot-hd-wallpaper-why-gal-gadot-is-actually-a-great-choice-for-wonder-woman.jpeg",
    "cell": "8977282913",
    "timezone": "Central Time (US & Canada)",
    "gender": "female",
    "relationship": "single",
    "religious_affiliation": "hindu"

  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(donorProfileResetPasswordAction).inspectBody().toss();

};

donorProfileResetPasswordAction = function(data) {

  frisby.create('Update Donor Password').post(URL + "settings/password/reset", {
    "currentPassword": "sai@1",
    "id": Newdonoruserdata.data[0].user_id,
    "newPassword": "xyz@1",
    "verifyPassword": "xyz@1"
  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(mentionUserAction).inspectBody().toss();

};
