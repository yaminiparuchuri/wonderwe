frisby = require('frisby');

//Register call for userand test cases starts execution with auth_spec

// INFO :- token have token value
token = "",
// INFO:- tokenuserobject have user object after token verification
tokenuserobject = [];

URL = "http://localhost:3005/";

globalTokenSet = function(data) {
  token = data.data.token;
  frisby.globalSetup({ // globalSetup is for ALL requests
    request: {
      headers: {
        'x-access-token': data.data.token
      }
    }
  });
};

autoActivationAction = function() {
  frisby.create('Auto Activation of Account').get(URL + "auth/auto/activate/kusuma.isolvers+donor20@gmail.com").expectStatus(200).expectHeaderContains('content-type', 'application/json').timeout(30000).inspectBody().toss();
};

loginAction = function(data) {
  frisby.create('Login For user Account').post(URL + "auth/login", {
    "email": "kusuma.isolvers+donor20@gmail.com",
    "password": "kusuma1"
  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(globalTokenSet).afterJSON(tokenValidationAction).timeout(40000).inspectBody().toss();
};

tokenValidationAction = function(data) {
  frisby.create('Token verification').get(URL + "auth/token/verify?token=" + data.data.token).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(getAllCharity).timeout(40000).inspectBody().toss();
};

registerUser = function() {
  frisby.create('Register User').post(URL + "auth/register", {
    "firstname": "sai",
    "lastname": "llla",
    "email": "kusuma.isolvers+donor20@gmail.com",
    "password": "kusuma1",
    "confirmpassword": "kusuma1"
  }, {
    'content-type': 'application/json'
  }).expectStatus(200).timeout(50000).afterJSON(globalTokenSet).afterJSON(autoActivationAction).afterJSON(loginAction).inspectBody().toss();
};

registerUser();

require("./getallcharity_spec");
