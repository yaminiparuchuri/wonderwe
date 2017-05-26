//THIS FILE HAVE DONATION DETAILS AND OTHER CHARITY DASHBOARD STUFF

totalYearDonationDetails = function(data) {
  console.log("totalYearDonationDetails.............");
  frisby.create('Total Year Donation Details').get(URL + "analytics/statistics/" + charitylistuser.data[0].charityId, {
    'content-type': 'application/json'
  }).timeout(20000).expectStatus(200).inspectBody().toss();
};
