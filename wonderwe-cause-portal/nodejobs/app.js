//External Modules Import Here
express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
mandrill = require('mandrill-api/mandrill');
moment = require('moment');
md5 = require('MD5');
uuid = require('node-uuid');
jwt = require('jwt-simple');
exphbs = require('express-handlebars');
mysql = require('mysql');
//redis = require('redis');
crypto = require('crypto');
async = require('async');
db_template = require('db-template');
underscore = require('underscore');
var fs = require('fs');
var parser = require('xml2json');
var pathmodule = require('path');
uslug = require('uslug');
var multer = require('multer');
request = require('request');
wepay = require('wepay').WEPAY;
slugController = require('./services/slug-controller.js');
numeral = require('numeral');
var dripCampaign = require('./services/drip-campaign');
var router = express.Router();
var monthlyDonations = require('./services/monthly-donations');

router.use(function(req, res, next) {
  next();
});

//Internal Modules Import Here - TODO: We have to move these to respective routes.

utility = require('./utils/util');

props = require('config').props;
mail = require('./mail');
donationServices = require('./services/donations.js');
followerServices = require('./services/follower.js');
authServices = require('./services/auth.js');
pageServices = require('./services/pages.js');
settingsServices = require('./services/settings.js');
charityServices = require('./services/charity.js');
reminderServices = require('./services/reminder.js');
wepayService = require('./services/wepay.js');
feedServices = require('./services/feed.js');
feedBotSrevice = require('./services/feedBot');
teamServices = require('./services/team.js')
codeServices = require('./services/code.js');
elasticService = require('./services/elastic.js');
elasticsearch = require('elasticsearch');
stripeService = require('./services/stripe');
stripe = require('stripe')(props.stripe_secret_key);


elasticClient = new elasticsearch.Client({
  host: props.elasticServer,
  log: props.elasticSearchlog
})

elasticClient.ping({
  // ping usually has a 3000ms timeout
  requestTimeout: Infinity,
  hello: "elasticsearch!"
}, function(error) {
  if (error) {
    console.trace('elasticsearch cluster is down!');
  } else {
    console.log('Elastic server is up..');
    console.log('All is well');
  }
});

imgDimension = require('./config/img-dimensions');



//Converted the JSON Array into a SQL Map so that Queries can be looked up using Key Value Pairs.

var content = fs.readFileSync(__dirname + '/sql-queries.xml');
var json = parser.toJson(content, {
  sanitize: false
});
//returns a string containing the JSON structure by default
var sqlQueries = JSON.parse(json)['sql-queries']['sql-query'];
sqlQueryMap = {};
for (var i = 0; i < sqlQueries.length; i++) {
  sqlQueryMap[sqlQueries[i]['id']] = sqlQueries[i]['$t'];
}

app = express();

require('devmetrics')({
  'app': app,
  'uncaughtException': true,
  'app_id': props.devmetrics_app_id
});

//TODO:Need to Implement the Logger

app.use(multer({
  dest: './uploads/'
}));
app.use(bodyParser.json({
  limit: '50mb'
}));
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}));

//app.set('jwtTokenSecret', 'WonderWe');
app.use(cookieParser());
app.enable('trust proxy');

var os = require("os");
var systemname = os.hostname();
//app.use('/', router);


pool = mysql.createPool({
  host: props.host,
  user: props.username,
  password: props.password,
  port: props.port,
  database: props.database,
  connectionLimit: props.connectionLimit,
  debug: props.dbdebug,
  connectTimeout: props.connectTimeout
});
excuteQuery = db_template(pool);

var Agenda = require('agenda');
var agendaUI = require('agenda-ui');

agenda = new Agenda({
  db: {
    address: props.agendadb,
    collection: props.agendaJobCollection
  }
});

agenda._db.update({
    '$and': [{
      'lockedAt': {
        '$exists': true,
        '$ne': null
      }
    }, {
      'name': {
        '$nin': ['WePay status update', 'Fundraiser WePay status update']
      }
    }]
  }, {
    '$set': {
      'lockedAt': null
    }
  }, {
    multi: true
  },
  function(e, numUnlocked) {
    if (e) {
      throw e;
    }

    console.log("Unlocked " + numUnlocked + " jobs.");


    //{lockedAt: { $exists: true, $ne: null }}

    //TODO Onetime or monthly donation
    agenda.define('sendAnEmailToDonater', function(job, done) {
      var data = job.attrs.data;
      donationServices.sendEmailToDonater(data, function(err, result) {
        if (err) {

          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'sendAnEmailToDonater';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);

        }
        done();
      });
    });
     agenda.define('sendMonthlyEmailToDonater', function(job, done) {
      var data = job.attrs.data;
      donationServices.sendMonthlyEmailToDonater(data, function(err, result) {
        if (err) {

          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'sendMonthlyEmailToDonater';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);

        }
        done();
      });
    });

    //mail to team captaign when rejection of team member
    agenda.define('rejection of team invitation', function(job, done) {
      var data = job.attrs.data;
      teamServices.rejectionOfTeamInvitation(data, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'rejection of team invitation';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    //mail send campaing owner when a tema created for campaign
    agenda.define('New team created for your campaign', function(job, done) {
      var data = job.attrs.data;
      teamServices.sendTeamAlertToCampaignOwner(data, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'New team created for your campaign';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });
    //mail send to the team creator
    agenda.define('Send mail to team captain', function(job, done) {
      var data = job.attrs.data;
      teamServices.sendTeamAlertToTeamCreator(data, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'Send mail to team captain';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });
    //mail send to the team captain when fundraise is created
    agenda.define('Send mail for team fundraise creation', function(job, done) {
      var data = job.attrs.data;
      teamServices.sendFundraiseAlertToTeamCaptain(data, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'Send mail for team fundraise creation';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });
    // mail send to team member when fundraiser is created
    agenda.define('Send mail to teammember for fundraise creation', function(job, done) {
      var data = job.attrs.data;
      teamServices.sendFundraiseAlertToTeamMember(data, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'Send mail to teammember for fundraise creation';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    //TODO follow User,Charity and Campaign
    agenda.define('follow', function(job, done) {
      var data = job.attrs.data;
      followerServices.followUserCharityCode(data, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'follow';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);

        }
        done();
      });
    });

    //TODO Send Activation Email
    agenda.define('sendActivationEmail', {
      lockLifeTime: 1000
    }, function(job, done) {
      var data = job.attrs.data;

      authServices.sendActivationEmail(data.user, data.userid, data.pass, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'sendActivationEmail';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    //TODO Nonprofit signup
    agenda.define('sendClaimsignupRequestEmail', function(job, done) {
      var data = job.attrs.data;
      pageServices.sendClaimsignupRequestEmail(data, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'sendClaimsignupRequestEmail';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);

        }
        done();
      });
    });
    //TODO Add New Organization
    agenda.define('addNewOrganization', function(job, done) {
      var data = job.attrs.data;
      settingsServices.addNewCharity(data.charityId, data.charityObj, data.orgInfo, function(err, result) {
        if (err) {

          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'addNewOrganization';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    //TODO unfollow User,Charity and Campaign
    agenda.define('unfollowUserCharityCode', function(job, done) {
      var data = job.attrs.data;

      followerServices.unfollowUserCharityCodeHandler(data, function(err, result) {
        if (err) {
          //utility.logException(err);
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'unfollowUserCharityCode';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    //TODO Invite New Administrator
    agenda.define('sendEmailToInviteCharityAdmin', function(job, done) {
      var data = job.attrs.data;
      charityServices.sendEmailToInviteCharityAdmin(data.email, data.userid, data.name, data.charity_id, data.flag, function(err, result) {
        if (err) {
          //utility.logException(err);
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'sendEmailToInviteCharityAdmin';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    //TODO Charity Approval email
    agenda.define('sendEmailToApproveCharityAdmin', function(job, done) {
      var data = job.attrs.data;
      charityServices.sendEmailToApproveCharityAdmin(data, function(err, result) {
        if (err) {
          //utility.logException(err);
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'sendEmailToApproveCharityAdmin';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    //TODO Check user Email exists or not (like donor profile update)
    agenda.define('checkUserEmailExistOrNot', function(job, done) {
      var data = job.attrs.data;
      charityServices.checkUserEmail(data.email, data.name, data.id, function(err, result) {
        if (err) {
          //utility.logException(err);
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'checkUserEmailExistOrNot';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    //TODO Update charity profile
    agenda.define('updateCharityProfile', function(job, done) {
      var data = job.attrs.data;
      charityServices.updateCharityProfileAgenda(data, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'updateCharityProfile';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);

        }
        done();
      });
    });



    //TODO Reminder email invite by charity/donor

    /* agenda.define('send email to user whose inactive after 6 days', {
       priority: 'high',
       concurrency: 10
     }, function(job, done) {
       var data = job.attrs.data;
       reminderServices.sendReminderEmails(function(err, data) {
         if (err) {
           utility.logException(err);
         }
         done();
       })
     });*/

    //TODO socket.io
    agenda.define('socket io notifications', function(job, done) {
      var data = job.attrs.data;
      utility.socketioNotifications(data, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'socket io notifications';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    //TODO picupload
    /*agenda.define('pic upload', function(job, done) {
      var data = job.attrs.data;
      utility.urlStoreInRackspace(data.url, data.filename, data.ext, data.type, function(err, result) {
        done();
      });
    });*/
    //TODO send Reset Password Email
    agenda.define('semdEmailToResetPassword', function(job, done) {
      var data = job.attrs.data;
      authServices.sendResetPasswordEmail(data, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'semdEmailToResetPassword';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    //TODO sendMentionedEmail
    agenda.define('sendMailForMentionedUser', function(job, done) {
      var data = job.attrs.data;
      console.log(data);
      console.log(data.me);
      feedServices.sendMailForMentioned(data.mention, data.me, data.name, data.url, data.content, data.emaillist, data.feedObj, data.mentionImage, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'sendMailForMentionedUser';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    //TODO sendMailForRetweetPostUser
    agenda.define('sendMailForRetweetPostUser', function(job, done) {
      var data = job.attrs.data;
      feedServices.sendMailForMentioned(data.mention, data.me, data.name, data.url, data.content, data.emaillist, data.feedObj, data.mentionImage, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'sendMailForRetweetPostUser';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    //job for inserting the data into elastic search
    agenda.define('updatinig team in elastic search', function(job, done) {
      var data = job.attrs.data;
      codeServices.createCampaignUserCharityInElasticSearch(data, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'inserting teams into elastic search';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }

        done();
      });
    });

    //TODO sendEmailForReplyPost
    agenda.define('sendEmailForReplyPost', function(job, done) {
      var data = job.attrs.data;
      feedServices.mandrillMailObject(data.mention, data.me, data.name, data.url, data.content, data.emaillist, data.feedObj, data.originalresult, data.originalposturl, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'sendEmailForReplyPost';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }

        done();
      });
    });

    //TODO sendInviteEmailToImportDonors
    agenda.define('sendInviteEmailToImportDonors', function(job, done) {
      var data = job.attrs.data;
      pageServices.sendInviteEmailToImportDonors(data.email, data.name, data.charityName, data.userObj, data.charity_id, data.importFrom, data.rows, data.id, data.referral_id, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'sendInviteEmailToImportDonors';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    agenda.define('create campaign/donor/charity in elasticsearch', function(job, done) {
      var data = job.attrs.data;
      codeServices.createCampaignUserCharityInElasticSearch(data, function(err, result) {

        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'create campaign/donor/charity in elasticsearch';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }

        done();
      });
    });

    //sending mails to p2p admins
    agenda.define('sendmails to p2p admins', function(job, done) {
      var data = job.attrs.data;
      var codeId = data.codeid;
      codeServices.sendMailsTop2pAdmins(codeId, function(err, result) {
        if (err) {
          var logsobj = {};
          logsobj.error = err;
          logsobj.stack = new Error().stack;
          logsobj.jobname = 'sendmails to p2p admins';
          logsobj.data = codeId;
          utility.nodeLogs('ERROR', logsobj);
        }
        done();
      });
    });
    //send mails to team captain and members
    agenda.define('send mails to team captain and members', function(job, done) {
      var data = job.attrs.data;
      var codeId = data.codeid;
      teamServices.sendMailsTeamCaptainAndMembersDraft(codeId, function(err, result) {
        if (err) {
          var logsobj = {};
          logsobj.error = err;
          logsobj.stack = new Error().stack;
          logsobj.jobname = 'send mails to team captain and members';
          logsobj.data = codeId;
          utility.nodeLogs('ERROR', logsobj);
        }
        done();
      });
    });
    //send mails to team owners when changed the 
   agenda.define('send mails to team owners', function(job, done) {
      var data = job.attrs.data;
      var codeId = data.codeid;
      var status = data.status;
      teamServices.sendMailsTeamOwners(codeId,status, function(err, result) {
        if (err) {
          var logsobj = {};
          logsobj.error = err;
          logsobj.stack = new Error().stack;
          logsobj.jobname = 'send mails to team owners';
          logsobj.data = codeId;
          utility.nodeLogs('ERROR', logsobj);
        }
        done();
      });
    });

    agenda.define('send mails to team captain and members when main campaign is in publish', function(job, done) {
      var data = job.attrs.data;
      var codeId = data.codeid;
      teamServices.sendMailsTeamCaptainAndMembersPublish(codeId, function(err, result) {
        if (err) {
          var logsobj = {};
          logsobj.error = err;
          logsobj.stack = new Error().stack;
          logsobj.jobname = 'send mails to team captain and members when main campaign is in publish';
          logsobj.data = codeId;
          utility.nodeLogs('ERROR', logsobj);
        }
        done();
      });
    });



    //send mails to campaign owner and admins
    agenda.define('sendAnEmailToCampaignOwnersAndAdmins', function(job, done) {
      var data = job.attrs.data;
      donationServices.sendMailsToCampaignOwner(data, function(err, result) {
        if (err) {
          var logsobj = {};
          logsobj.error = err;
          logsobj.stack = new Error().stack;
          logsobj.jobname = 'sendMails to campaing owner after donation success';
          logsobj.data = data;
          utility.nodeLogs('ERROR', logsobj);
        }
        done();
      });
    });

    agenda.define('send peertopeer approval request for campaign owner', function(job, done) {
      var data = job.attrs.data;
      codeServices.sendp2pApprovalToCampaignOwner(data.admindetails, data.id, data.teamresult, function(err, result) {

        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'send peertopeer approval request for campaign owner';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }

        done();
      });
    });
    agenda.define('send mails to team invitees', function(job, done) {
      var data = job.attrs.data;
      teamServices.sendMailsToTeamInvitees(data, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jodname = 'sendMailsToTeamInvitees';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj)
        }
        done();
      });
    });
    agenda.define('Delete campaign from elasticsearch', function(job, done) {
      var data = job.attrs.data;

      elasticService.removeDocument(data, function(err, result) {
        console.log('Delete from elasticsearch');
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'Delete campaign from elasticsearch';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    agenda.define('WePay status update', function(job, done) {

      wepayService.wepayAccountStatus({}, function(err, result) {
        if (err) {
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'WePay status update';
          logsObj.data = {};
          utility.nodeJobLogs('ERROR', logsObj);
          //utility.logException(err);
        }
        done();
      });
    });

    agenda.define('Fundraiser WePay status update', function(job, done) {
      done()
        /* wepayService.wepayDonorAccountStatus({}, function(err, result) {
          if (err) {
            var logsObj = {};
            logsObj.error = err;
            logsObj.stack = new Error().stack;
            logsObj.jobname = 'Fundraiser WePay status update';
            logsObj.data = {};
            utility.nodeJobLogs('ERROR', logsObj);
            //utility.logException(err);
          }
          done();
        }); */
    });

    agenda.define('Resend Donor Activation Email', function(job, done) {
      var data = job.attrs.data;
      authServices.resendDonorActivationEmail(data, function(err, result) {
        if (err) {
          //utility.logException(err);
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'Resend Donor Activation Email';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    agenda.define('Save postal code user and charity', function(job, done) {
      var data = job.attrs.data;
      pageServices.updateAddressByPostalcode(data, function(err, result) {
        if (err) {
          //utility.logException(err);
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'Save postal code user and charity';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    agenda.define('onboardingCompletionEmail', function(job, done) {
      var data = job.attrs.data;
      codeServices.onboardingCompletionEmail(data, function(err, result) {
        if (err) {
          //utility.logException(err);
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'onboardingCompletionEmail';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    agenda.define('sendfollowmail', function(job, done) {
      var data = job.attrs.data;
      followerServices.sendingEmail(data, function(err, result) {
        if (err) {
          //utility.logException(err);
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'sendfollowmail';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });

    agenda.define('update country currencies', function(job, done) {

      pageServices.updateCurrencyData({}, function(err, result) {
        if (err) {
          //utility.logException(err);
          var logsObj = {};
          logsObj.error = err;
          logsObj.stack = new Error().stack;
          logsObj.jobname = 'update country currencies';
          logsObj.data = data;
          utility.nodeJobLogs('ERROR', logsObj);
        }
        done();
      });
    });
    /** Sending this email */
    agenda.define('Sending email for all the followers before delete', function(job, done) {
        console.log(job.attrs.data.followRecords);
        codeServices.sendFinalEmailForDeleteCampaign(job.attrs.data.followRecords, job.attrs.data.message_body, function(err, result) {
          if (err) {
            //utility.logException(err);
            var logsObj = {};
            logsObj.error = err;
            logsObj.stack = new Error().stack;
            logsObj.jobname = 'Sending email for all the followers before delete';
            logsObj.data = data;
            utility.nodeJobLogs('ERROR', logsObj);
          }
          done();
        })
      })
      /**
       * Send a thank you email for owner of the campaign after campaign creation
       * and publish done successfully.
       */
    agenda.define('Send thankyou/email for campaign created successfully and published.', function(job, done) {
      var data = job.attrs.data;
      dripCampaign.sendThankYouEmail(data, function(err, result) {
        if (err) {
          utility.nodeLogs('ERROR', { message: 'Error in sending success email for campaign creation ', codeData: data });
        } else {
          utility.nodeLogs('INFO', { message: 'Successfully sent success email for campaign creation and publish' });
        }
        done();
      });
    });
/**
* send promote mail to campaign owner
*/
agenda.define('send promote mail to campaign creator', function(job, done) {
      var data = job.attrs.data;
      dripCampaign.sendThankyouEmailForTeamCampaign(data, function(err, result) {
        if (err) {
          utility.nodeLogs('ERROR', { message: 'Error in sending promote mail to campaign owner' });
        } else {
          utility.nodeLogs('INFO', { message: ' Successfully sent promote mail to campaign owner' });
        }
        done();
      });
    });


    /**
     *  Send thank you email for team campaign(peer to peer campaign) creation to owner.
     */

    agenda.define('Send thankyou/email for team campaign creation', function(job, done) {
      var data = job.attrs.data;
      dripCampaign.sendThankyouEmailForTeamCampaign(data, function(err, result) {
        if (err) {
          utility.nodeLogs('ERROR', { message: 'Error in sending thank you for team campaign creation' });
        } else {
          utility.nodeLogs('INFO', { message: ' Successfully created email for team campaign' });
        }
        done();
      });
    });

    /**
     * Checking the campaign status status
     */

    agenda.define('Check campaigns video not uploaded', function(job, done) {

      utility.nodeLogs('INFO', { message: 'Before going to check status' });
      if (props.environment_type === 'qa' || props.environment_type === 'production') {
        dripCampaign.checkCampaignsVideoStatus({}, function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', { message: 'Error in checking campaign status' });
          } else {
            utility.nodeLogs('ERROR', { message: 'Success in  checking campaign status' });
          }
          done();
        });
      } else {
        done();
      }
    });

    agenda.define('Check campaign do not have peer to peer campaigns', function(job, done) {
      if (props.environment_type === 'qa' || props.environment_type === 'production') {
        dripCampaign.getCampaignsNoPeerToPeer({}, function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', { message: 'Error in sending peer-to-peer campaign motivation email', error: err });
          } else {
            utility.nodeLogs('INFO', { message: 'Successfully sent all the emails ' });
          }
          done();
        });
      } else {
        done();
      }
    });

    agenda.define('Send next day email for campaigns', function(job, done) {
      if (props.environment_type === 'qa' || props.environment_type === 'production') {
        dripCampaign.getNextDayCampaigns({}, function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', { message: 'Send emails for next day campaigns' });
          } else {
            utility.nodeLogs('INFO', { message: 'Sending next day emails for the campaigns' });
          }
          done();
        });
      } else {
        done();
      }
    });

    agenda.define('Send weekly progress to campaigns', function(job, done) {
      if (props.environment_type === 'qa' || props.environment_type === 'production') {
        dripCampaign.sendWeeklyProgressToCampaigns({}, function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', { message: 'There is an error in sending weekly progress to campaigns' });
          } else {
            utility.nodeLogs('INFO', { message: ' Successfully sent to weekly progress emails for all fundraisers' });
          }
          done();
        });
      } else {
        done();
      }
    });

    agenda.define('send weekly progress to campaign owners and admins for 7 days', function(job, done) {
      if (props.environment_type === 'qa' || props.environment_type === 'production') {
        var data = job.attrs.data;
        dripCampaign.sendWeeklyToOwnerAndAdminsForSevenDays(data, function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', { message: 'There is an error in sending weekly progress to campaigns' });
          } else {
            utility.nodeLogs('INFO', { message: 'successfully sent to weekly progress emails' });
          }
          done();
        });
      } else {
        done();
      }
    });
    agenda.define('send weekly progress to campaign owners and admins for 10 days', function(job, done) {
      if (props.environment_type === 'qa' || props.environment_type === 'production') {
        var data = job.attrs.data;
        dripCampaign.sendWeeklyToOwnerAndAdminsForSevenDays(data, function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', { message: 'There is an error in sending weekly progress to campaigns' });
          } else {
            utility.nodeLogs('INFO', { message: 'successfully sent to weekly progress emails' });
          }
          done();
        });
      } else {
        done();
      }
    });
    // agenda.define('Send weekly alerts to campaign owners who do does not connected to wepay',function(job,done){
    //     if(props.environment_type === 'production'){
    //       var data = job.attrs.data;
    //       dripCampaign.sendWeeklyToUsersForSevenDays(data,function(err,result){
    //         if(err){
    //           utility.nodeLogs('ERROR',{message:'There is an error in sending weekly progress to campaigns'});
    //           }else{
    //           utility.nodeLogs('INFO',{message:'successfully sent to weekly progress emails'});
    //         }
    //         done();
    //         });
    //       }else{
    //          done();
    //       }
    //   });
    // agenda.define('Send weekly alerts to campaign owners who do does not connected to wepay',function(job,done){
    //     if(props.environment_type === 'production'){
    //       var data = job.attrs.data;
    //       dripCampaign.sendWeeklyToUsersForTenDays(data,function(err,result){
    //         if(err){
    //           utility.nodeLogs('ERROR',{message:'There is an error in sending weekly progress to campaigns'});
    //           }else{
    //           utility.nodeLogs('INFO',{message:'successfully sent to weekly progress emails'});
    //         }
    //         done();
    //         });
    //       }else{
    //          done();
    //       }
    //   });
    agenda.define('Send weekly alerts to wonderwe admins who do does not connected to wepay for 7 days', function(job, done) {
      if (props.environment_type === 'qa' || props.environment_type === 'production') {
        var data = job.attrs.data;
        dripCampaign.sendWeeklyEmailToWonderAdminsForSevenDays(data, function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', { message: 'There is an error in sending weekly progress to campaigns' });
          } else {
            utility.nodeLogs('INFO', { message: 'successfully sent to weekly progress emails' });
          }
          done();
        });
      } else {
        done();
      }
    });

    agenda.define('Send weekly alerts to wonderwe admins who do does not connected to wepay for 10 days', function(job, done) {
      if (props.environment_type === 'qa' || props.environment_type === 'production') {
        var data = job.attrs.data;
        dripCampaign.sendWeeklyEmailToWonderAdminsForTenDays(data, function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', { message: 'There is an error in sending weekly progress to campaigns' });
          } else {
            utility.nodeLogs('INFO', { message: 'successfully sent to weekly progress emails' });
          }
          done();
        });
      } else {
        done();
      }
    });


    agenda.define('campaignReachedThresholds', function(job, done) {
      //done();
      var data = job.attrs.data;
      feedBotSrevice.campaignReachedThresholds(data, function(err, botResponse) {
        if (err) {
          console.log(err);
        }
        done();
      });
    });


    agenda.define('Check campaign success or not and send campaign reaches to goal', function(job, done) {
      var codeObject = job.attrs.data;
      dripCampaign.checkCampaignGoalReached(data, function(err, result) {
        if (err) {
          utility.nodeLogs('ERROR', {
            message: 'Error in sending success email to donators',
            error: err,
            codeObject: codeObject
          });
        } else {
          if (result.not_reached_goal) {
            utility.nodeLogs('INFO', { message: 'Campaign not reached goal' });
          } else {
            utility.nodeLogs('INFO', { message: 'Send campiagn reached goal thank you message to every one who donated' });
          }
        }
        done();
      });
    });



    agenda.define('send campaign/update email', function(job, done) {
      var data = job.attrs.data;
      dripCampaign.sendUpdateCampaignEmail(data, function(err, data) {
        if (err) {
          utility.nodeLogs('ERROR', { message: 'Sending emails error', error: err });
        } else {
          utility.nodeLogs('INFO', { message: 'Sending update campaign email successfully' });
        }
        done();
      });
    });

    agenda.define('Check fundraiser goal reached or not', function(job, done) {
      var data = job.attrs.data;
      done();
      /* dripCampaign.checkCampaignGoalReached(data,function(err,result){
         if(err){
           utility.nodeLogs('ERROR',{message:"Error in sending fundraiser goal reached email",error:err});
         }else{
           utility.nodeLogs('INFO',{message:'Sucessfully send emails to fundraiser goal reached'});
         }
         done();
       }); */
    });

    agenda.define('Get stripe accounts status', function(job, done) {
      if (props.environment_type === 'qa' || props.environment_type === 'production') {
        stripeService.checkAccountsStatusAndSendActivationEmails({}, function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', { message: 'Error in sending activation emails for stripe' });
          } else {
            utility.nodeLogs('INFO', { message: 'We have sent activation emails for stripe' })
          }
          done();
        });
      } else {
        done();
      }
    });

    agenda.define('Create stripe connect for existing email', function(job, done) {
      var data = job.attrs.data
      stripeService.enableStripeAccount(data, function(err, result) {
        if (err) {
          utility.nodeLogs('ERROR', { message: 'Error in enabling stripe connect for user' });
        } else {
          utility.nodeLogs('INFO', { message: 'We have sent a stripe failure email for customer' });
        }
        done();
      });
    });

    agenda.define('Check charity has default campaign if not set this', function(job, done) {
      var data = job.attrs.data;
      codeServices.checkAndSetAsCharityDefault(data, function(err, result) {
        if (err) {
          utility.nodeLogs('ERROR', { message: 'Error in the service' });
        } else {
          utility.nodeLogs('INFO', { message: 'Successfully added campaign service in charity' });
        }
        done();
      });
    });
    agenda.define('Check charity has app fee', function(job, done) {
      var data = job.attrs.data;
      codeServices.insertAppFeeToCharity(data, function(err, result) {
        if (err) {
          utility.nodeLogs('ERROR', { message: 'Error in the service' });
        } else {
          utility.nodeLogs('INFO', { message: 'Successfully added campaign service in charity' });
        }
        done();
      });
    });


    agenda.define('Get share count all campaigns', function(job, done) {
      var data = job.attrs.data;
      if (props.environment_type === 'production') {
        codeServices.getShareCountsOfCampaigns(data, function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', { error: 'Error in getting share count of slugs' });
          } else {
            utility.nodeLogs('INFO', { message: 'Successfully run share count job ' });
          }
          done();
        });
      } else {
        utility.nodeLogs('INFO', { message: 'Does not require for dev evnironmetns. Done...' });
        done();
      }
    });

    agenda.define('Run monthly donations for this Day on Wepay', function(job, done) {
      var data = job.attrs.data;
      if (props.environment_type === 'production' || props.environment_type === 'qa') {
        monthlyDonations.getMonthlyDonationsForThisDay({}, function(err, result) {
          if (err) {
            done();
            utility.nodeLogs('ERROR', { message: 'Error in running monthly donations', error: err });
          } else {
            done();
            utility.nodeLogs('INFO', { message: 'Monthly donations running successfully' });
          }
        });
      } else {
        done();
      }
    });
 /*   agenda.define('stripe occurences cancellation', function(job, done) {
      if (props.environment_type === 'production' || props.environment_type === 'qa' || props.environment_type === 'dev') {
        stripeService.cancelOccurenceExpiration({}, function(err, result) {
          if (err) {
            done();
            utility.nodeLogs('ERROR', { message: 'Error in stripe occurences', error: err });
          } else {
            done();
            utility.nodeLogs('INFO', { message: 'stripe occurences successful' });
          }
        });
      } else {
        done();
      }
    });
*/
    agenda.define('stripe cancellation for expired campaigns', function(job, done) {
      if (props.environment_type === 'production' || props.environment_type === 'qa' || props.environment_type === 'dev') {
        stripeService.cancelStripeForalreadyexpiredCampaigns({}, function(err, result) {
          if (err) {
            done();
            utility.nodeLogs('ERROR', { message: 'Error in stripe occurences', error: err });
          } else {
            done();
            utility.nodeLogs('INFO', { message: 'stripe occurences successful' });
          }
        });
      } else {
        done();
      }
    });

    // agenda.define('Send fundraiser/create email for charity campaigns',function(job,done){
    //   var charity_id = job.attrs.data.charity_id;

    // });
    // Every Day morning 12:30 AM
    //agenda.every('2 hours', 'WePay status update');
    agenda.every('2 hours', 'update country currencies');

    //Checking campaign creation after few days


    //agenda.every('00 45 12 * * *', 'update country currencies');
    agenda.every('00 45 12 * * *', ['Check campaigns video not uploaded',
      'Check campaign do not have peer to peer campaigns',
      'Send next day email for campaigns',
      // 'Send weekly progress to campaigns',
      // 'send weekly progress to campaign owners and admins for 7 days',
      //'send weekly progress to campaign owners and admins for 10 days',
      // 'Send weekly alerts to wonderwe admins who do does not connected to wepay for 7 days',
      //'Send weekly alerts to wonderwe admins who do does not connected to wepay for 10 days'
    ]);
    agenda.every('00 45 12 * * *', 'Get stripe accounts status');
    agenda.every('00 45 12 * * 5', ['Send weekly alerts to wonderwe admins who do does not connected to wepay for 7 days', 'Send weekly progress to campaigns']);
    agenda.every('00 45 12 * * *', ['Get share count all campaigns']);
    agenda.every('00 45 12 * * *', ['Run monthly donations for this Day on Wepay']);
   // agenda.every('00 45 12 * * *', ['stripe occurences cancellation']);
    agenda.every('00 45 12 * * *', ['stripe cancellation for expired campaigns']);

    //agenda.now('Run monthly donations for this Day on Wepay');




    //'Send weekly progress to campaigns'
    //agenda.now('send weekly progress to users');
    //agenda.now('send weekly progress to admins');


    agenda.on('start', function(job) {
      console.log("Job %s starting", job.attrs.name);
    });
    agenda.on('complete', function(job) {
      console.log("Job %s finished", job.attrs.name);
    });
    agenda.on('success', function(job) {
      console.log("Job Success : %s", job.attrs.name);
    });
    agenda.on('fail', function(err, job) {
      console.log("Job failed with error: %s", err.message);
    });

    agenda.start();

  });

app.use('/agenda-ui', agendaUI(agenda, {
  poll: false
}));

agenda.jobs({}, function(err, jobs) {
  // Work with jobs (see below)
  if (!err) {
    //   console.log(jobs);
  } else {
    console.error(err);
  }
});

app.set('views', path.join(__dirname, 'views'));

var hbs = exphbs.create({
  // Specify helpers which are only registered on this instance.
  helpers: {
    constructUrl: function(url, size, options) {
      if (url) {
        var extRemovalUrl = url.slice(0, url.lastIndexOf('.'));
        var ext = url.split('.').pop();
        return extRemovalUrl + '-size' + size + '.' + ext;

      } else {
        return url;
      }
    },
    ifconcat: function(value1, value2, options) {
      if (value1 && value2) {
        return value1 + ', ' + value2;
      } else {
        if (value1 || value2) {
          var returnvalue = value1 ? value1 : value2;
          returnvalue = value2 ? value2 : value1;
          return returnvalue;
        }
      }
    },
    equal: function(lvalue, rvalue, options) {

      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
    equaltoo: function(lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue === rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  },
  defaultLayout: 'main'
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

//Added mandrill template

global.mandrillTemplate = function(finalobjectmandril, callback) {
  mandrill_client = new mandrill.Mandrill(props.mandrilkey);
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
        callback(err, null);

      } else {
        callback(null, data);
      }
    });
  }, function(e) {
    // Mandrill returns the error as an object with name and message keys
    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    // A mandrill error occurred: Invalid_Key - Invalid API key
  });

};

global.setDevHeaders = function(res) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Authorization,x-access-token");
};

app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);
app.use(catchErrorHandler);

// Catch all 404 errors...
function catchErrorHandler(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  console.error(req.path);
  console.log("URL Found");
  if (req.xhr) {
    res.status(404);
  } else {
    res.status(404);
  }
}

function logErrors(err, req, res, next) {
  // Here we need to trace all the errors what we get
  next(err);
}

function clientErrorHandler(err, req, res, next) {
  console.log(err);
  if (req.xhr) {
    res.status(500).send({
      error: 'Something blew up!'
    });
  } else {
    next(err);
  }
}

function errorHandler(err, req, res, next) {
  console.error("Unexpected Errors");
  console.error(err);
  console.error(err.stack);
  res.status(err.status || 500);
  res.send({
    'error': err.message
  });

}

global.notifications = function(entity_id) {
  console.log('in socketio notificationssssss11111apppp');
  excuteQuery.queryForAll(sqlQueryMap['getNotificationsCount'], [entity_id], function(err, rows) {
    if (err) {
      utility.appErrorHandler(err, '');
    } else {
      console.log(entity_id);
      io.emit(entity_id, {
        data: rows[0]
      });
    }
  });
}

process.on('uncaughtException', function(err) {
  console.error(err.stack);
  console.log("Node NOT Exiting...");
  var mailOptions = {
    from: props.fromemail, // sender address
    to: props.devteam_emails, // list of receivers
    subject: 'Node jobs crashed in domin: ' + props.agendadomin, // Subject line
    text: '', // plaintext body
    html: err.stack // html body
  };
  mail.sendEmail(mailOptions, function(err, data) {
    if (err) {
      utility.nodeLogs('ERROR', { error: err });
    } else {
      utility.nodeLogs('INFO', { message: 'Successfully send job crashing emails to dev team' });
    }
  });
});


module.exports = app;
