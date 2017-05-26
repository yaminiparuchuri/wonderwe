


// This is only to update the Single existing mandril template, But need to Write a script for all the templates

mandrill = require('mandrill-api/mandrill');
var async = require('async');
//mandrill_client = new mandrill.Mandrill('8tzQ1m0N1HwoCGtrPt5qIQ');// Development Account key

//mandrill_client2 = new mandrill.Mandrill('fUbnv1q2xN65AodaXjAKEg');  // Production Account Key

mandrill_client.templates.info({
  name: 'Donation Success to unclaimed Charity',
  lug: 'donation-success-to-unclaimed-charity'
}, function(result) {
console.log(result);

//  async.each(result, function(singleObj, callback) {


    var name = result.name;
    var from_email = result.from_email;
    var from_name = result.from_name;
    var subject = result.subject;
    var code = result.code;
    var text = result.text;
    var publish = true;
    var labels = result.labels;

    // TODO Move new templates from prod to dev query

    // mandrill_client2.templates.add({
    //   "name": name,
    //   "from_email": from_email,
    //   "from_name": from_name,
    //   "subject": subject,
    //   "code": code,
    //   "text": text,
    //   "publish": publish,
    //   "labels": labels
    // }, function(result2) {
    //
    //   callback(null);
    //
    // }, function(e) {
    //   // Mandrill returns the error as an object with name and message keys
    //   console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    //   callback(null);
    //   // A mandrill error occurred: Invalid_Key - Invalid API key
    // });

    // TODO Update existing templates query

      mandrill_client2.templates.update({
        "name": name,
        "from_email": from_email,
        "from_name": from_name,
        "subject": subject,
        "code": code,
        "text": text,
        "publish": publish,
        "labels": labels
      }, function(result2) {

      console.log(result2);
      console.log('Now Template is good...:)');
      }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);

        // A mandrill error occurred: Invalid_Key - Invalid API key
      });

//  }, function(err) {
    console.log('Done well...');
//  });

}, function(e) {
  // Mandrill returns the error as an object with name and message keys
  console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
  // A mandrill error occurred: Invalid_Key - Invalid API key
});
