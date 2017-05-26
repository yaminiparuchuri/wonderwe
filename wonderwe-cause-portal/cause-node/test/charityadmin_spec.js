//THIS FILE HAVE ADMIN STUFF
require("./donorreg_spec");

require("./feed_spec");


adminDeleteAction = function(data) {

  frisby.create('Deleting admin Account').get(URL + "charity/admin/delete/" + donoruserdata.data[0].user_id, {
    'content-type': 'application/json'
  }).expectStatus(200).inspectBody().toss();
};


updateAdminAction = function(data) {

  //INFO:- have createAdminExistingAction response

  adminExistingresponse = data;

  frisby.create('modify Admin User permission').put(URL + "charity/admin/" + adminExistingresponse.data.user_id + "/charity/" + adminExistingresponse.data.charity_id, {
    "can_admin": "yes",
    "can_code": "no",
    "can_manage_followers": "yes",
    "can_post": "yes",
    "can_update_financial": "yes",
    "can_view_reports": "yes",
    "charity_id": adminExistingresponse.data.charity_id,
    "name": adminExistingresponse.data.name,
    "user_id": adminExistingresponse.data.user_id

  }, {
    'content-type': 'application/json'
  }).expectStatus(200).afterJSON(postFeedAction).inspectBody().toss();

};

createAdminNewAction = function(data) {

  frisby.create('adding New user as admin').post(URL + "charity/admin", {
    "can_admin": "yes",
    "can_code": "yes",
    "can_manage_followers": "yes",
    "can_post": "yes",
    "can_update_financial": "yes",
    "can_view_reports": "yes",
    "charity_id": charitylistuser.data[0].charityId,
    "email": "kusuma.isolvers+donor22@gmail.com",
    "file": "",
    "profile_pic_url": "",
    "user_id": tokenuserobject.data[0].user_id,
    "yourname": "Kusuma New As Admin"
  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(donorRegisterUserAdmin).inspectBody().toss();

};

createAdminExistingAction = function(data) {

  //INFO:- donoruserdata have donor user data
  donoruserdata = data;

  frisby.create('Adding Exisiting user').post(URL + "charity/admin", {
    "can_admin": "yes",
    "can_code": "yes",
    "can_manage_followers": "yes",
    "can_post": "yes",
    "can_update_financial": "yes",
    "can_view_reports": "yes",
    "charity_id": charitylistuser.data[0].charityId,
    "email": donoruserdata.data[0].email,
    "file": "",
    "profile_pic_url": "",
    "user_id": tokenuserobject.data[0].user_id,
    "yourname": ""
  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(updateAdminAction).inspectBody().toss();

};


// charityUpdateAction = function(data) {

//   frisby.create('charity datails upadate').put(URL + "charity/admin/" + existClaimDoner.data[0].user_id + "/charity/" + charitylistuser.data[0].charityId, {

//       "charity_id": charitylistuser.data[0].charityId,
//       "user_id": existClaimDoner.data[0].user_id,
//       "can_post": "yes",
//       "can_update_financial": "yes",
//       "can_request_withdrawal": "yes",
//       "can_view_reports": "yes",
//       "can_code": "yes",
//       "can_manage_followers": "yes",
//       "can_admin": "yes",
//       "date_deleted": null,
//       "affectedRows": 8
//     },

//     {
//       'content-Type': 'application/json'
//     }).timeout(40000).expectStatus(200).afterJSON(updateAdminAction).inspectBody().toss();
// }
