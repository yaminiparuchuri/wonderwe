var express = require('express');
var teamRouter = express.Router();
var teamService = require('../services/team');

/**
*@api {post} /team/create Team creation
* @apiName teamCreation
* @apiGroup Teams
* @apiDescription  Used to create a team         
*  @apiParam {string}   team_name                           Team name.
*  @apiParam {string}   team_custom_message                 Team custom message used to send to invitess.
*  @apiParam {string}   team_slug                           Team slug is used for unique identity.
*  @apiParam {string}   team_image                          Team image.
*  @apiParam {string}   team_description                    Team description.
*  @apiParam {string}   donot_allow_join                    It is a flag used to restrict the users to join or not with same team.
*  @apiParam {string}   support_multiple_campaigns          It is a flag to allow to to support the invitees reusable.
*  @apiParam {Array}    inviteesEmail                       These are the invitees for teams.
*  @apiParam {string}   teamFlag                            it is a flag used to show step1 and step2 while in team creation.
*  @apiParam {string}   teamapproval                        it is a approval to teams.
*  @apiParam {Number}   codeid                              This is a id of campaign for your team.
*  @apiParam {Number}   codeUserId                          This is a id of campaign creator.
*  @apiParam {Number}   codecreatorid                       This is a id of campaign creator.
*  @apiParam {string}   userName                            This is user name of loggedin user.
*  @apiParam {string}   userEmail                           This is email of loggedin user.
*  @apiParam {number}   user_id                             This is a id of loggedin user.
* @apiParamExample {json} Request-Example:
* Body for team creation:
*{"team_name":"Helping hands",
*"team_custom_message":"This is for testing",
*"team_slug":"wv3jrxs",
*"team_image":"https://wonderwe.s3.amazonaws.com/profile/10e9e416-85be-46bc-abd3-90f0c222ecc6-team.png",
*"team_description":"This is for testing",
*"donot_allow_join":"no",
*"support_multiple_campaigns":"no",
*"inviteesEmail":{"0":{"_data":{"email":"bvnkumar007+21@gmail.com","name":"nareandra"},"_cid":".map5750",
"_computedBindings":{},"email":"bvnkumar007+21@gmail.com","name":"nareandra","__bindEvents":{"change":[{"name":"change"}]}},
"1":{"_data":{"email":"bvnkumar007+22@gmail.com","name":"Narendra"},"_cid":".map5747","_computedBindings":{},
"email":"bvnkumar007+22@gmail.com","name":"Narendra","__bindEvents":{"change":[{"name":"change"}]}},"length":2,"
_cid":".map5744","_computedBindings":{},"__bindEvents":{"change":[{"name":"change"}],"comparator":[{"name":"comparator"}]},
"_comparatorBound":false},
*"teamFlag":"teamstep1",
*"teamapproval":"yes",
*"codeid":9388,
*"codeUserId":4623,
*"codecreatorid":4623,
*"userName":"VenkataNarendra Bethamcherlaa",
*"userEmail":"bvnkumar007@gmail.com",
*"user_id":2491
*}
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*{"status":"success",
*"data":
*  {
*    "team_name":"Helping hands",
*   "team_custom_message":"This is for testing",
*    "team_slug":"wv3jrxs",
*    "team_image":"https://wonderwe.s3.amazonaws.com/profile/10e9e416-85be-46bc-abd3-90f0c222ecc6-team.png",
*    "team_description":"This is for testing",
*    "donot_allow_join":"no",
*    "support_multiple_campaigns":"no",
*    "inviteesEmail":{"0":{"_data":{"email":"bvnkumar007+21@gmail.com","name":"nareandra"},"_cid":".map5750","_computedBindings":{},"email":"bvnkumar007+21@gmail.com","name":"nareandra","__bindEvents":{"change":[{"name":"change"}]}},"1":{"_data":{"email":"bvnkumar007+22@gmail.com","name":"Narendra"},"_cid":".map5747","_computedBindings":{},"email":"bvnkumar007+22@gmail.com","name":"Narendra","__bindEvents":{"change":[{"name":"change"}]}},"length":2,"_cid":".map5744","_computedBindings":{},"__bindEvents":{"change":[{"name":"change"}],"comparator":[{"name":"comparator"}]},"_comparatorBound":false},
*    "teamFlag":"teamstep1",
*    "teamapproval":"yes",
*    "codeid":9388,
*    "codeUserId":4623,
*    "codecreatorid":4623,
*    "userName":"VenkataNarendra Bethamcherlaa",
*    "userEmail":"bvnkumar007@gmail.com",
*    "user_id":2491,
*    "team_id":636
*   }
*  }
*/
teamRouter.post('/create',function(req,res,next){
  var teamObj=req.body;
  var logsObj=req.logsObj;
  teamService.creatingTeam(teamObj,function(err,result){
    if(err){
      utility.newAppErrorHandler(err,logsObj,res)
    }
    else{
      var object={};
      object.data=result;
      utility.dataHandler(object,res);
    }
  });
});

/**
*@api {post} /team/insert/inviteeData Team invitees insertion
* @apiName teamInviteesInsertion
* @apiGroup Teams
* @apiDescription  Used to check the invitees is in invited list or not        
*  @apiParam {Number}   userid                 Loggedin user id.
*  @apiParam {Number}   teamid                 Team id.
*  @apiParam {string}   created                It is a team created or not for the first time we are sendind it one as 'no'.
*  @apiParam {string}   is_admin               it is a flag for team admin or not for the first time we are sending this is one as 'no'
*  @apiParam {Date}     invited_date           It is a invited date of invitees for particular team.
* @apiParamExample {json} Request-Example:
* Body for team invitees insertion:
*{"userid":2491,
*"team_id":68,
*"created":"no",
*"is_admin":"no",
*"invited_date":Sun Feb 05 2017 00:32:33 GMT+0530 (IST)
*}
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
* {"status":"success",
*  "data":
*     {"created":"no"
*     }
*  }
*/
teamRouter.post('/insert/inviteeData',function(req,res,next){
var logsObj=req.logsObj;
  var teamObj=req.body;
  var logsObj=req.logsObj;
  teamService.insertingInviteesdata(teamObj,function(err,result){
    if(err){
      utility.newAppErrorHandler(err,logsObj,res)
    }
    else{
      var object={};
      object.data=result;
      utility.dataHandler(object,res);
    }
  });
});
/**
*@api {get} /team/getting/teamdata/:teamid/:userid Getting team data
* @apiName Getting team data
* @apiGroup Teams
* @apiDescription  Used to get the team data        
*  @apiParam {Number}   userid                 Loggedin user id.
*  @apiParam {Number}   teamid                 Team id.
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*{
*"status":"success",
*"data":
*{
*"gettingTeamData":[{"id":579,"tc_user_id":2491,"code_id":null,"team_name":"gfgfhgfg","team_logo":"https://wonderwe.s3.amazonaws.com/profile/10e9e416-85be-46bc-abd3-90f0c222ecc6-team.png","team_description":"ghfgf hhgfhg","date_created":"2017-01-31T13:37:06.000Z","donot_allow_join":"no","status":"published","approved_by":null,"approved_date":"2017-01-31T13:37:06.000Z","support_multiple_campaigns":"no","check_p2p":null,"slug":"el7kvgo","maincampstatus":null,"maincampdatedeleted":null,"main_campaign_name":null,"maincampaignid":null,"campaignowneremail":null,"teamstatus":"published"}],
*"gettingTeamMembers":[{"id":2104,"team_id":579,"user_id":7096,"created":"no","is_admin":"no","deleted_by":null,"action_date":null,"invited_date":"2017-01-31T13:37:06.000Z","code_id":null,"name":"gfghfgh","email":"fgfghfhgfhgf@gmail.com"},{"id":2105,"team_id":579,"user_id":7097,"created":"no","is_admin":"no","deleted_by":null,"action_date":null,"invited_date":"2017-01-31T13:37:06.000Z","code_id":null,"name":"gghfhgf","email":"ghfhgf@hgh.com"}]
* }
*  }
*/
teamRouter.get('/getting/teamdata/:teamid/:userid',function(req,res,next){
  var logsObj=req.logsObj;
  var teamid=req.params.teamid;
  var userid=req.params.userid;
  teamService.gettingTeamData(teamid,userid,function(err,result){
    if(err){
      utility.newAppErrorHandler(err,logsObj,res)
    }
    else{
      var object={};
      object.data=result;
      utility.dataHandler(object,res);
    }
  });
});
/**
*@api {get} /team/get/teamdata/:teamid      Getting team data for multiple support
* @apiName Getting team data for multiple support
* @apiGroup Teams
* @apiDescription  Used to get the team data for multiple support        
*  @apiParam {Number}   teamid                 Team id.
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*{
*"status":"success",
*"data":
*{
*"gettingTeamDetails":[{"id":579,"tc_user_id":2491,"code_id":null,"team_name":"gfgfhgfg","team_logo":"https://wonderwe.s3.amazonaws.com/profile/10e9e416-85be-46bc-abd3-90f0c222ecc6-team.png","team_description":"ghfgf hhgfhg","date_created":"2017-01-31T13:37:06.000Z","donot_allow_join":"no","status":"published","approved_by":null,"approved_date":"2017-01-31T13:37:06.000Z","support_multiple_campaigns":"no","check_p2p":null,"slug":"el7kvgo","maincampstatus":null,"maincampdatedeleted":null,"main_campaign_name":null,"maincampaignid":null,"campaignowneremail":null,"teamstatus":"published"}],
*"gettingTeamMembers":[{"id":2104,"team_id":579,"user_id":7096,"created":"no","is_admin":"no","deleted_by":null,"action_date":null,"invited_date":"2017-01-31T13:37:06.000Z","code_id":null,"name":"gfghfgh","email":"fgfghfhgfhgf@gmail.com"},{"id":2105,"team_id":579,"user_id":7097,"created":"no","is_admin":"no","deleted_by":null,"action_date":null,"invited_date":"2017-01-31T13:37:06.000Z","code_id":null,"name":"gghfhgf","email":"ghfhgf@hgh.com"}]
* }
*  }
*/
teamRouter.get('/get/teamdata/:teamid/',function(req,res,next){
  var logsObj=req.logsObj;
  var teamid=req.params.teamid;
  teamService.getTeamData(teamid,function(err,result){
    if(err){
      utility.newAppErrorHandler(err,logsObj,res)
    }
    else{
      var object={};
      object.data=result;
      utility.dataHandler(object,res);
    }
  });
});

/**
*@api {get} /team/make/admin/:teamid/:userid      Make an admin 
* @apiName Make an admin for a team
* @apiGroup Teams
* @apiDescription  Used to make an invitees as a admin for team        
*  @apiParam {Number}   teamid                 Team id.
*  @apiParam {Number}   userid                 invitee user id.
* @apiParamExample {json} Request-Example:
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*{
*"status":"success",
*"data":
*{

* }
*  }
*/
teamRouter.get('/make/admin/:teamid/:userid',function(req,res,next){
  var logsObj=req.logsObj;
  var teamid=req.params.teamid;
  var userid=req.params.userid;
  teamService.makingTeamAdmin(teamid,userid,function(err,result){
    if(err){
      utility.newAppErrorHandler(err,logsObj,res)
    }
    else{
      var object={};
      object.data=result;
      utility.dataHandler(object,res);
    }
  });
});

/**
*@api {get} /team/delete/invitee/:teamid/:userid/:inviteeid     To delete an team invitee
* @apiName To delete an invitee invitation
* @apiGroup Teams
* @apiDescription  Used to delete team invitee invitation        
*  @apiParam {Number}   teamid                 Team id.
*  @apiParam {Number}   userid                 team captain or team admin id.
*  @apiParam {Number}   inviteeid                 invitee user id.
* @apiParamExample {json} Request-Example:
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*{
*"status":"success",
*"data":
*{
*"success":true
* }
*  }
*/
teamRouter.get('/delete/invitee/:teamid/:userid/:inviteeid',function(req,res,next){
  var logsObj=req.logsObj;
  var teamid=req.params.teamid;
  var userid=req.params.userid;
  var inviteeid=req.params.inviteeid;
  console.log("Im from delete indivejjnj")
  teamService.deletingTeamInvitee(teamid,userid,inviteeid,function(err,result){
    if(err){
      utility.newAppErrorHandler(err,logsObj,res)
    }
    else{
      var object={};
      object.data=result;
      utility.dataHandler(object,res);
    }
  });
});
/**
*@api {get} /team/resend/invitee/:teamid/:inviteeid  Resend mail to team invitee 
* @apiName Send again team inviteation to invitee
* @apiGroup Teams
* @apiDescription  Used to send team invitation again to team invitee        
*  @apiParam {Number}   teamid                 Team id.
*  @apiParam {Number}   userid                 invitee user id.
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*{
*"status":"success",
*"data":
*{
*"success":true
* }
*  }
*/
teamRouter.get('/resend/invitee/:teamid/:inviteeid',function(req,res,next){
  var logsObj=req.logsObj;
  var teamid=req.params.teamid;
  var inviteeid=req.params.inviteeid;
  teamService.resendTeamInvitee(teamid,inviteeid,function(err,result){
    if(err){
      utility.newAppErrorHandler(err,logsObj,res)
    }else{
      var object={};
      object.data=result;
      utility.dataHandler(object,res);
    }
  });
});

/**
*@api {post} /team/update/team/details Team details update
* @apiName updating team details
* @apiGroup Teams
* @apiDescription  Used to update the team details         
*  @apiParam {string}   team_name                           Team name.
*  @apiParam {string}   team_slug                           Team slug is used for unique identity.
*  @apiParam {string}   team_logo                           Team image.
*  @apiParam {string}   team_description                    Team description.
*  @apiParam {string}   donot_allow_join                    It is a flag used to restrict the users to join or not with same team.
*  @apiParam {string}   support_multiple_campaigns          It is a flag to allow to to support the invitees reusable.
*  @apiParam {Array}    inviteesEmail                       These are the invitees for teams.
*  @apiParam {string}   status                              it is a status of a team.
*  @apiParam {string}   check_p2p                           
*  @apiParam {string}   approved_by                         it is a team approver user id.
* @apiParamExample {json} Request-Example:
* Body for team update:
*{"team_name":"Helping hands",
*"team_custom_message":"This is for testing",
*"team_slug":"wv3jrxs",
*"team_logo":"https://wonderwe.s3.amazonaws.com/profile/10e9e416-85be-46bc-abd3-90f0c222ecc6-team.png",
*"team_description":"This is for testing",
*"donot_allow_join":"no",
*"support_multiple_campaigns":"no",
*"inviteesEmail":{"0":{"_data":{"email":"bvnkumar007+21@gmail.com","name":"nareandra"},"_cid":".map5750",
"_computedBindings":{},"email":"bvnkumar007+21@gmail.com","name":"nareandra","__bindEvents":{"change":[{"name":"change"}]}},
"1":{"_data":{"email":"bvnkumar007+22@gmail.com","name":"Narendra"},"_cid":".map5747","_computedBindings":{},
"email":"bvnkumar007+22@gmail.com","name":"Narendra","__bindEvents":{"change":[{"name":"change"}]}},"length":2,"
_cid":".map5744","_computedBindings":{},"__bindEvents":{"change":[{"name":"change"}],"comparator":[{"name":"comparator"}]},
"_comparatorBound":false},
*"status":"draft",
*"check_p2p":"no",
*"approved_by":2491
*}
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*{"status":"success",
*"data":
*  {
*    "team_name":"Helping hands",
*   "team_custom_message":"This is for testing",
*    "team_slug":"wv3jrxs",
*    "team_image":"https://wonderwe.s3.amazonaws.com/profile/10e9e416-85be-46bc-abd3-90f0c222ecc6-team.png",
*    "team_description":"This is for testing",
*    "donot_allow_join":"no",
*    "support_multiple_campaigns":"no",
*    "inviteesEmail":{"0":{"_data":{"email":"bvnkumar007+21@gmail.com","name":"nareandra"},"_cid":".map5750","_computedBindings":{},"email":"bvnkumar007+21@gmail.com","name":"nareandra","__bindEvents":{"change":[{"name":"change"}]}},"1":{"_data":{"email":"bvnkumar007+22@gmail.com","name":"Narendra"},"_cid":".map5747","_computedBindings":{},"email":"bvnkumar007+22@gmail.com","name":"Narendra","__bindEvents":{"change":[{"name":"change"}]}},"length":2,"_cid":".map5744","_computedBindings":{},"__bindEvents":{"change":[{"name":"change"}],"comparator":[{"name":"comparator"}]},"_comparatorBound":false},
*    "status":"draft",
*    "check_p2p":"no",
*    "approved_by":2491
*   }
*  }
*/
teamRouter.post('/update/team/details',function(req,res,next){
  var logsObj=req.logsObj;
  var campaignData=req.body;
  console.log('in team routes updates');
  console.log(campaignData);
  teamService.updatingTeamDetails(campaignData,function(err,result){
    if(err){
      utility.newAppErrorHandler(err,logsObj,res)
    }
    else{
      var object={};
      object.data=result;
      utility.dataHandler(object,res);
    }
  });
});
/**
*@api {get} /team/accept/check/:teamid/:userid Accept the team invitation
* @apiName Accept team invitation
* @apiGroup Teams
* @apiDescription  Used accept team invitaion   
*  @apiParam {Number}   teamid                 Team id.
*  @apiParam {Number}   userid                 Invitee user id.
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*{
*"status":"success",
*"data":
*{
*"flag":"no"
* }
*  }
*/
teamRouter.get('/accept/check/:teamid/:userid',function(req,res,next){
  var logsObj=req.logsObj;
  var userid=req.params.userid;
  var teamid=req.params.teamid;
  teamService.checkingUserTeam(userid,teamid,function(err,result){
    if(err){
      utility.newAppErrorHandler(err,logsObj,res)
    }
    else{
      var object={};
      console.log("in routes");
      object.data=result;
      utility.dataHandler(object,res);
    }
  });
});
/**
*@api {put} /team/published/status/:teamid Updating team status to publish
* @apiName Updating team status to publish
* @apiGroup Teams
* @apiDescription  Used to update the team status to published      
*  @apiParam {Number}   teamid                 Team id.
* @apiParamExample {json} Request-Example:
* Body for team publish:
*{
*"teamid":68,
*}
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*{
*"status":"success",
*"data":
*{
*"success":"success"
* }
*  }
*/
teamRouter.put('/published/status/:teamid',function(req,res,next){
  var logsObj=req.logsObj;
  var teamid=req.params.teamid;
  teamService.updatePublishStatus(teamid,function(err,result){
    if(err){
      utility.newAppErrorHandler(err,logsObj,res)
    }
    else{
      var object={};
      console.log("in routes");
      object.data=result;
      utility.dataHandler(object,res);
    }
  });
});
/**
*@api {put} /team/unpublished/status/:teamid Updating team status to unpublish
* @apiName Updating team status to unpublish
* @apiGroup Teams
* @apiDescription  Used to update the team status to unpublished      
*  @apiParam {Number}   teamid                 Team id.
* @apiParamExample {json} Request-Example:
* Body for team unpublish:
*{
*"teamid":68,
*}
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*{
*"status":"success",
*"data":
*{
*"success":"success"
* }
*  }
*/
teamRouter.put('/unpublished/status/:teamid',function(req,res,next){
  console.log("in team router");
  var logsObj=req.logsObj;
  var teamid=req.params.teamid;
  console.log(teamid);
  console.log("in team updatation for draft");
  teamService.updateUnPublishStatus(teamid,function(err,result){
    if(err){
      utility.newAppErrorHandler(err,logsObj,res)
    }
    else{
      var object={};
      console.log("in routes");
      object.data=result;
      utility.dataHandler(object,res);
    }
  });
});
/**
*@api {get} /team/delete/team/:teamid To delete a team
* @apiName To delete a team
* @apiGroup Teams
* @apiDescription  Used to delete the team      
*  @apiParam {Number}   teamid                 Team id.
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*{
*"status":"success",
*"data":
*{
*"success":"success"
* }
*  }
*/
teamRouter.get('/delete/team/:teamid',function(req,res,next){
var teamid=req.params.teamid;
var logsObj=req.logsObj;
teamService.deleteTeam(teamid,function(err,result){
  if(err){
      utility.newAppErrorHandler(err,logsObj,res)
  }else{
  var object={};
  object.data=result;
  utility.dataHandler(object,res);
  }
})
});


/* we are not using this service*/
teamRouter.get('/get/campaigns',function(req,res,next){
var name=req.query.q;
var code_id = req.query.code_id

var logsObj=req.logsObj;
var obj={};
obj.name=name;
obj.code_id = code_id;
teamService.getCampaigns(obj,function(err,result){
  if(err){
      utility.newAppErrorHandler(err,logsObj,res)
  }else{
  var object={};
  object.data=result;
  res.send(result);
  // utility.dataHandler(object,res);
  }
})
});
/**
*@api {get} /team/campaigns/:campaign To get campaigns for team creation
* @apiName To get campaigns for team creation
* @apiGroup Teams
* @apiDescription  Used to get campaings for team creation     
*  @apiParam {string}   campaign                code_text or title of a campaign
* @apiParamExample {json} Request-Example:
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
* {
*{
*   "status":"success",
*   "data":
*  [{"id":9388,"name":"testcampaign","org_pic_url":"https://wonderwe.s3.amazonaws.com/profile/2637709f-214d-4dbb-a551-a17f2f783a37-default-userpng.png","background_pic_url":"","organization_name":null,"code_text":"boss1","teamcampaign":"no","entity_type":"code","status":"published","individual":"yes","profile_pic_url":"https://wonderwe.s3.amazonaws.com/profile/33627987-74d7-4905-ad1e-7fe6ffe9e041-download.jpg","state":3435,"campaign_creator":"venkata narendra","beneficiary":"Narendra","city":"Hyderabad","charity_id":"","suggested_donation":0,"wecode":"boss1","goal":12121212,"can_mailing_required":"yes","end_date":"2099-12-31T23:59:59.000Z","type":"ongoing","donotallow_p2p_campaigns":"yes","p2p_approval_required":"yes","team_approve":"yes","campaign_creator_id":4623,"entityid":9388,"description":"this is the test campaign for testing","nooffollowers":9,"noof_donors":9,"slug":"boss1","donation":434,"donation_progress":0,"currency_code":"USD","currency_symbol":"$","user_id":4623,"fundraiser_userid":4623,"fundraiser_codeid":9388,"fundraiser":"fundraiser"},{"id":9484,"name":"stripecampaignfortesting","org_pic_url":"https://wonderwe.s3.amazonaws.com/profile/2637709f-214d-4dbb-a551-a17f2f783a37-default-userpng.png","background_pic_url":null,"organization_name":null,"code_text":"boss9","teamcampaign":"no","entity_type":"code","status":"published","individual":"yes","profile_pic_url":"https://wonderwe.s3.amazonaws.com/profile/defa5914-9a3c-4770-ae48-339e8e51cfb5-download.jpg","state":null,"campaign_creator":"venkata narendra","beneficiary":"Narendra","city":null,"charity_id":"","suggested_donation":0,"wecode":"boss9","goal":32323232,"can_mailing_required":"no","end_date":"2099-12-31T23:59:59.000Z","type":"ongoing","donotallow_p2p_campaigns":"no","p2p_approval_required":"no","team_approve":"yes","campaign_creator_id":4722,"entityid":9484,"description":"this is the stripe campaing for testing purpose wecan this one fot that it232323","nooffollowers":2,"noof_donors":2,"slug":"boss9","donation":27,"donation_progress":0,"currency_code":"EUR","currency_symbol":"€","user_id":4722,"fundraiser_userid":4722,"fundraiser_codeid":9484,"fundraiser":"fundraiser"}]}
*  }
*/
teamRouter.get('/campaigns/:campaign',function(req,res,next){
var name=req.params.campaign;
var logsObj=req.logsObj;
var obj={};
obj.name=name;
if(req.query.codeid){
  obj.codeid=req.query.codeid;
}
if(req.query.teamFund){
  obj.teamFund=req.query.teamFund;
}
teamService.getCampaigns(obj,function(err,result){
  if(err){
      utility.newAppErrorHandler(err,logsObj,res)
  }else{
  var object={};
  object.data=result;
 utility.dataHandler(object,res);
  }
})
});
/**
*@api {get} /team/created/status/:userid To get user team invitations
* @apiName To get the user team invitaions
* @apiGroup Teams
* @apiDescription  Used to get the user team invitations     
*  @apiParam {Number}   user                 loggedin user id.
* @apiParamExample {json} Request-Example:
*  @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
* {
* "status":"success",
* "data":
*      [{"team_name":"team for test","team_id":44,"codeid":9577,"id":157,"user_id":2491,"created":"no","is_admin":"no","deleted_by":null,"action_date":null,"invited_date":null,"code_id":null,"code_text":"edcuds1"}]
* }
*  }
*/
teamRouter.get('/created/status/:userid',function(req,res,next){
 var userid=req.params.userid;
 var logsObj=req.logsObj;
 teamService.getCreatedStatus(userid,function(err,result){
  if(err){
      utility.newAppErrorHandler(err,logsObj,res)
  }else{
  var object={};
  object.data=result;
 utility.dataHandler(object,res);
  }
 })
});

module.exports=teamRouter;
