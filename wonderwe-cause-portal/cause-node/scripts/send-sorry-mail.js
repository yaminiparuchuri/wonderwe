var mandrill = require('mandrill-api/mandrill');
 props = require('config').props;

var mail = require('../mail');


console.log(props);

function sendApolizeEmail(){


var finalobjectmandril = {};
  finalobjectmandril.from = props.fromsupport;
  finalobjectmandril.email = "medaamarnadh@gmail.com";
  finalobjectmandril.text = "";
  finalobjectmandril.subject = "Important: Donation issue on Internet explorer for Hope Ministries Outdoor Play Scape";
  finalobjectmandril.template_name = "Donation fail to fundraiser";
  finalobjectmandril.template_content = [{
    "name": "name",
    "content": "*|NAME|*"
  }, {
    "name": "content",
    "content": "*|CONTENT|*"
  },{
  	"name":"campaign_url",
  	"content":"*|CAMPAIGN_URL|*"
  }];
  finalobjectmandril.merge_vars = [{
    "name": "NAME",
    "content": "Katie J Davis"
  }, {
    "name": "CONTENT",
    "content":"Sorry for the inconvenience caused while donating to the campaign <b>Hope Ministries Outdoor Play Scape</b> on 08-04-2016 from WonderWe."+
    	" We were running into few issues with Application while using Internet Explorer, now thatthe problem has been troubleshooted and it is working fine."+
    	 " Please do find some time to fund and promote the campaign. Also if it does not work on Internet Explorer, use Google Chrome or Mozilla Firefox."+
    	 " We are more than happy to help you further."
  },{
  	"name":"CAMPAIGN_URL",
  	"content":"https://www.wonderwe.com/hopesb?donate=true"
  }];

    var mandrill_client = new mandrill.Mandrill(props.mandrilkey);
    mandrill_client.templates.render({
      "template_name": finalobjectmandril.template_name,
      "template_content": finalobjectmandril.template_content,
      "merge_vars": finalobjectmandril.merge_vars
    }, function(result) {
      var mailOptions = {
        from: finalobjectmandril.from, // sender address
        to: finalobjectmandril.email, // list of receivers
        subject: finalobjectmandril.subject, // Subject line
        text: finalobjectmandril.text, // plaintext body
        html: result.html // html body
      };
      mail.sendEmail(mailOptions, function(err, data) {
        if (err) {
          utility.nodeLogs('ERROR', { error: err });
          callback(new Error(JSON.stringify({ errors: [err.message], status: 500 })), null);
        } else {
        	console.log(data);
        	process.exit();
        }
      });

  });

}

sendApolizeEmail();