mandrill = require('mandrill-api/mandrill');
var async = require('async');

mandrill_client2 = new mandrill.Mandrill('8tzQ1m0N1HwoCGtrPt5qIQ'); // Development Account key

mandrill_client = new mandrill.Mandrill('fUbnv1q2xN65AodaXjAKEg'); // Production Account Key



var templates = [{ name: 'invite-fundraise-contacts', slug: 'invite-fundraise-contacts', status: 'update' },
  { name: '', slug: '', status: 'new' }
];



async.eachSeries(templates, function(individualtemplate, eachCallback) {

  // List of templates
  // To get the template information from Develop Templates 

  mandrill_client2.templates.info({
    name: individualtemplate.name, //'invite-fundraise-contacts',
    slug: individualtemplate.slug //'invite-fundraise-contacts'
  }, function(singleObj) {

    console.log(singleObj);

    var name = singleObj.name;
    var from_email = singleObj.from_email;
    var from_name = singleObj.from_name;
    var subject = singleObj.subject;
    var code = singleObj.code;
    var text = singleObj.text;
    var publish = true;
    var labels = singleObj.labels;


    if (individualtemplate.status === 'new') {

      mandrill_client.templates.add({
        "name": name,
        "from_email": from_email,
        "from_name": from_name,
        "subject": subject,
        "code": code,
        "text": text,
        "publish": publish,
        "labels": labels
      }, function(result2) {

        console.log(individualtemplate.name + 'Templated Added successfully...');
        eachCallback(null);

      }, function(e) {
        console.log(individualtemplate.name + 'Get error while create a new template');
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        eachCallback(null);
        // A mandrill error occurred: Invalid_Key - Invalid API key
      });

    } else {

      // TODO Update existing templates query

      mandrill_client.templates.update({
        "name": name,
        "from_email": from_email,
        "from_name": from_name,
        "subject": subject,
        "code": code,
        "text": text,
        "publish": publish,
        "labels": labels
      }, function(result2) {

        console.log(individualtemplate.name + 'Template updated successfully');
        eachCallback(null);
        //  console.log(result2);
      }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log(individualtemplate.name + 'Get error while update');
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        eachCallback(null);
        // A mandrill error occurred: Invalid_Key - Invalid API key
      });
    }

  }, function(e) {
    // Mandrill returns the error as an object with name and message keys
    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    eachCallback(null);
    // A mandrill error occurred: Invalid_Key - Invalid API key
  });



}, function(err) {
  console.log('Templates migrated successfully..');
  console.log('DOne well...');
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