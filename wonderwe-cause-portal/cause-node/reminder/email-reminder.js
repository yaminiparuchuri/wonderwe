var express = require('express');
var reminderRouter = express.Router();


reminderRouter.get('/send/email', function(req, res, next) {

  pool.query('select * from referral_tbl where created_date IS NULL', function(err, userData) {
    if (err) {
      console.log(err);
    } else {
      async.each(userData, function(data, callback) {

        var days = moment(moment.utc().toDate()).diff(data.invited_date, 'days');

        console.log("days..difference....");
        console.log(days);

        if (days > 6) {

          pool.query('select * from user_tbl where id=?', [data.invited_user_id], function(err, inviteUserData) {
            if (err) {
              console.log(err);
            } else {
              pool.query('select * from user_tbl where id=?', [data.referral_user_id], function(err, referralUserData) {
                if (err) {
                  console.log(err);
                } else {

                  if (data.invited_from === "donor") {
                    sendRemainderEmail(referralUserData[0], "donor", inviteUserData[0], data.invited_user_id, data.id, "", "");
                    callback(null);
                  } else {
                    pool.query('select * from charity_tbl where id=?', [data.charity_id], function(err, charityData) {
                      if (err) {
                        console.log(err);
                      } else {
                        sendRemainderEmail(referralUserData[0], "charity", inviteUserData[0], data.invited_user_id, data.id, charityData[0].name_tmp, data.charity_id);
                      }
                      callback(null);
                    });
                  }

                }
              });
            }
          });

        } else {
          callback(null);
        }
      }, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("completed");
        }
      })
    }
  });
});

function sendRemainderEmail(userInfo, type, userObj, id, referral_id, charityName, charity_id) {

  var org_fullname = userObj.name;
  var org_firstname = org_fullname.substr(0, org_fullname.indexOf(' '));
  if (org_firstname) {

  } else {
    org_firstname = userObj.name;
  }
  if (type === "charity") {
    var finalobjectmandril = {};
    finalobjectmandril.from = props.fromemail;
    finalobjectmandril.email = userInfo.email;
    finalobjectmandril.text = "Hello world ✔";
    finalobjectmandril.subject = "Reminder to join WonderWe";
    finalobjectmandril.template_name = "Organization Invitation To New Donor (reminder)";
    finalobjectmandril.template_content = [{
      "name": "charityName",
      "content": "*|ORGANIZATION|*"
    }, {
      "name": "org_fullname",
      "content": "*|ORGANIZATION_FULLNAME|*"
    }, {
      "name": "org_firstname",
      "content": "*|ORGANIZATION_FIRSTNAME|*"
    }, {
      "name": "registernewuserfollowdonor",
      "content": "*|REGISTERNEWUSERFOLLOWORG|*"
    }];
    finalobjectmandril.merge_vars = [{
      "name": "ORGANIZATION",
      "content": charityName
    }, {
      "name": "ORGANIZATION_FULLNAME",
      "content": org_fullname
    }, {
      "name": "ORGANIZATION_FIRSTNAME",
      "content": org_firstname
    }, {
      "name": "REGISTERNEWUSERFOLLOWORG",
      "content": props.domain + "/pages/signup/donor/" + id + "?followed_id=" + charity_id + "&type=charity" + "&referral_id=" + referral_id
    }];
    mandrillTemplate(finalobjectmandril, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log("Org invite email send successfully");
      }
    });
  } else {
    var finalobjectmandril = {};
    finalobjectmandril.from = props.fromemail;
    finalobjectmandril.email = userInfo.email;
    finalobjectmandril.text = "Hello world ✔";
    finalobjectmandril.subject = "Reminder to join WonderWe";
    finalobjectmandril.template_name = "Donor Invitation To New Donor (reminder)";
    finalobjectmandril.template_content = [{
      "name": "name",
      "content": "*|NAME|*"
    }, {
      "name": "charityname",
      "content": "*|CHARITYNAME|*"
    }, {
      "name": "registernewuserfollowdonor",
      "content": "*|REGISTERNEWUSERFOLLOWDONOR|*"
    }];
    finalobjectmandril.merge_vars = [{
      "name": "NAME",
      "content": org_fullname
    }, {
      "name": "CHARITYNAME",
      "content": charityName
    }, {
      "name": "REGISTERNEWUSERFOLLOWDONOR",
      "content": props.domain + "/pages/signup/donor/" + id + "?followed_id=" + userObj.id + "&type=user" + "&referral_id=" + referral_id
    }];
    mandrillTemplate(finalobjectmandril, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log("donor invite email send successfully");
      }
    });
  }
}

module.exports = reminderRouter;
