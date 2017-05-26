//THIS FILE HAVE REPLY AND REPOST
require("./donorreg_spec");

repostAction = function(data) {
  //TODO:in reply id and entity id need to be dyanamic
  mentionsdata = data;
  frisby.create(' In Post a Retweet').post(URL + "feed/mentions/insert/retweet", {
    "city": "hyd",
    "content": "trying to repost from test case",
    "entity_id": Newdonoruserdata.data[0].entity_id,
    "headline": null,
    "image_url": null,
    "in_reply_id": data.data.id,
    "original_entity_id": existClaimDoner.data[0].entity_id,
    "state": "HI",
    "status_type": "share"

  }).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(repostGetAction).toss();

};

//For Getting Retweets For The Post
repostGetAction = function(data) {
  frisby.create('Get all the Retweet').get(URL + "feed/mentions/prev/retweets/" + data.data.id).expectStatus(200).expectHeaderContains('content-type', 'application/json').afterJSON(replyAction).inspectBody().toss();
};

replyAction = function(data) {

  //TODO:POSTID need to be dynamic example:- 3023
  repostdata = data;
  frisby.create('Get the Replay from previous replys').post(URL + "feed/mentions/inset/reply/", {

    "city": "hyd",
    "content": "trying to repost from test case",
    "entity_id": Newdonoruserdata.data[0].entity_id,
    "headline": null,
    "image_url": null,
    "in_reply_id": data.data.id,
    "original_entity_id": existClaimDoner.data[0].entity_id,
    "state": "HI",
    "status_type": "share"

  }, {
    'content-type': 'application/json'
  }).expectStatus(200).afterJSON(onetimeDonationAction).inspectBody().toss();

};
