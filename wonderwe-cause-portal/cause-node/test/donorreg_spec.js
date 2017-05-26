require("./login_spec");
require("./charityadmin_spec");
require("./followers_spec");

donorglobalTokenSetAdmin = function(data) {
  token = data.data.token;
  frisby.globalSetup({ // globalSetup is for ALL requests
    request: {
      headers: {
        'x-access-token': data.data.token
      }
    }
  });
};

donorLoginActionAdmin = function(data) {
  frisby.create('DONOR Login For user Account Admin').post(URL + "auth/login", {
    "email": "kusuma.isolvers+donor23@gmail.com",
    "password": "kusuma1"
  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(donorglobalTokenSetAdmin).afterJSON(donorTokenValidationActionAdmin).timeout(10000).inspectBody().toss();

};
donorTokenValidationActionAdmin = function(data) {
  frisby.create('DONOR Token verification Admin').get(URL + "auth/token/verify?token=" + data.data.token).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(createAdminExistingAction).timeout(10000).inspectBody().toss();
};

donorAutoActivationActionAdmin = function(data) {
  frisby.create('DONOR Auto Activation of Account Admin').get(URL + "auth/auto/activate/kusuma.isolvers+donor23@gmail.com").expectStatus(200).expectHeaderContains('content-type', 'application/json').timeout(10000).inspectBody().toss();
};

donorRegisterUserAdmin = function(data) {

  //INFO:- newUseradmin have latest user data who is created while making him/her as admin
  newUseradmin = data

  frisby.create('DONOR Register User Admin').post(URL + "auth/register", {
   
    "firstname": "Kusuma Test",
    "lastname": "Jammula",
    "email": "kusuma.isolvers+donor23@gmail.com",
    "password": "kusuma1",
    "confirmpassword": "kusuma1"

  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').timeout(20000).afterJSON(donorglobalTokenSetAdmin).afterJSON(donorAutoActivationActionAdmin).afterJSON(donorLoginActionAdmin).inspectBody().toss();
};

//.....................................................................................................................................................................

donorglobalTokenSetDonor = function(data) {
  token = data.data.token;
  frisby.globalSetup({ // globalSetup is for ALL requests
    request: {
      headers: {
        'x-access-token': data.data.token
      }
    }
  });
};

donorLoginActionDonor = function(data) {
  frisby.create('DONOR Login For user Account Donor').post(URL + "auth/login", {
    "email": "kusuma.isolvers+donor24@gmail.com",
    "password": "kusuma1"
  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').inspectBody().afterJSON(donorglobalTokenSetDonor).afterJSON(donorTokenValidationActionDonor).timeout(40000).toss();

};
donorTokenValidationActionDonor = function(data) {
  frisby.create('DONOR Token verification Donor').get(URL + "auth/token/verify?token=" + data.data.token).expectStatus(200).expectHeaderContains('content-type', 'application/json').timeout(40000).afterJSON(charityFollowersAction).inspectBody().toss();
};

donorAutoActivationActionDonor = function(data) {
  frisby.create('DONOR Auto Activation of Account Donor').get(URL + "auth/auto/activate/kusuma.isolvers+donor24@gmail.com").expectStatus(200).expectHeaderContains('content-type', 'application/json').timeout(30000).inspectBody().toss();
};

donorRegisterUserDonor = function(data) {
  frisby.create('DONOR Register User Donor').post(URL + "auth/register", {
    "firstname": "kusuma test two",
    "lastname": "jammula",
    "email": "kusuma.isolvers+donor24@gmail.com",
    "password": "kusuma1",
    "confirmpassword": "kusuma1"
  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').timeout(20000).afterJSON(donorglobalTokenSetDonor).afterJSON(donorAutoActivationActionDonor).afterJSON(donorLoginActionDonor).inspectBody().toss();
};
