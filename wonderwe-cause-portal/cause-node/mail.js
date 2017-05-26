module.exports = ( function() {
		var nodemailer = require("nodemailer");
		var sgusername = props.sp_uname;
		var sgpassword = props.sp_pass;
		// create reusable transport method (opens pool of SMTP connections)
		var smtpTransport = nodemailer.createTransport("SMTP", {
			service : props.mailservice,
			auth : {
				user : sgusername,
				pass : sgpassword
			}
		});

		// setup e-mail data with unicode symbols

		// send mail with defined transport object

		function sendEmail(mailOptions, cb) {
			//
			smtpTransport.sendMail(mailOptions, function(error, response) {
				if (error) {
					cb(error, null);
				} else {
					cb(null, response);
				}
			});
		}

		return {
			sendEmail : sendEmail
		};

	}());
