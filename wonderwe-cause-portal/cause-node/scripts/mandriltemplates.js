mandrill = require('mandrill-api/mandrill');
var async = require('async');
mandrill_client = new mandrill.Mandrill('8tzQ1m0N1HwoCGtrPt5qIQ');  // Dev account key Account key 

mandrill_client2 = new mandrill.Mandrill('fUbnv1q2xN65AodaXjAKEg'); // Production Account Key  fUbnv1q2xN65AodaXjAKEg

mandrill_client.templates.list({
  label: 'aug122016'
}, function(result) {

  async.each(result, function(singleObj, callback) {


    var name = singleObj.name;
    var from_email = singleObj.from_email;
    var from_name = singleObj.from_name;
    var subject = singleObj.subject;
    var code = singleObj.code;
    var text = singleObj.text;
    var publish = true;
    var labels = singleObj.labels;
    // TODO Move new templates from prod to dev query

  /*  mandrill_client2.templates.add({
      "name": name,
      "from_email": from_email,
      "from_name": from_name,
      "subject": subject,
      "code": code,
      "text": text,
      "publish": publish,
      "labels": labels
    }, function(result2) {

      callback(null);

    }, function(e) {
      // Mandrill returns the error as an object with name and message keys
      console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
      callback(null);
      // A mandrill error occurred: Invalid_Key - Invalid API key
    });
    */


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
        console.log(from_name+' successfully moved');
        callback(null);

      }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        callback(null);
        // A mandrill error occurred: Invalid_Key - Invalid API key
      });  
      


    // TODO delete templates  query

    /*  mandrill_client2.templates.delete({
        "name": singleObj.name
      }, function(result) {
        callback(null);
      }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Invalid_Key - Invalid API key
      });*/

  }, function(err) {
    console.log(err);
    console.log('Done well...');
  });

}, function(e) {
  // Mandrill returns the error as an object with name and message keys
  console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
  // A mandrill error occurred: Invalid_Key - Invalid API key
});
