//THIS FILE HAVE GETS CHARITY FROM GUIDE STAR

require("./charityclaim_spec");

totalCharity = "";

getAllCharity = function(data) {

//INFO:- tokenuserobject have user basic information.
  tokenuserobject = data;
  
  frisby.create('Get All the charities from guide star').get(URL + "charity/browse/all", {
    'content-type': 'application/json'
  }).expectStatus(200).timeout(100000).afterJSON(charityClaimAction).inspectBody().toss();
};
