require("./followers_spec");

donorLoginglobalTokenSet = function(data) {
  token = data.data.token;
  frisby.globalSetup({ // globalSetup is for ALL requests
    request: {
      headers: {
        'x-access-token': data.data.token
      }
    }
  });
};

donorLoginloginAction = function(data) {
  donoruserdata = data;

  frisby.create('Charity Login For user Account').post(URL + "auth/login", {

    "email": "abcd+5@gmail.com",
    "password": "sai@1"

  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(donorLoginglobalTokenSet).afterJSON(donorLoginTokenValidationAction).timeout(20000).inspectBody().toss();

};
donorLoginTokenValidationAction = function(data) {
  frisby.create('Charity Token verification').get(URL + "auth/token/verify?token=" + data.data.token).expectStatus(200).expectHeaderContains('content-type', 'application/json').timeout(20000).afterJSON(followDonorAction).inspectBody().toss();

};
