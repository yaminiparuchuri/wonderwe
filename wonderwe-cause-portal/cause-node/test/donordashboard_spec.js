//THIS FILE HAVE DONOR DASHBOARD ACTION CALL
require("./donorprofile_spec");
donorDashbordAction = function(data) {
  frisby.create('Getting the Initial codes').get(URL + "donors/dashboard/" + charitylistuser.data[0].charityId, {
    'Content-Type': 'application/json'
  }).expectStatus(200).afterJSON(donorProfileGetAction).inspectBody().toss();

};
