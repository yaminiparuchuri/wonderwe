// var mysql = require('mysql');
// var async = require('async');

// var pool = mysql.createPool({
//   host: "104.131.114.107", //"104.236.69.222", // "173.194.251.198",
//   user: "root",
//   password: "wonderwe1$",
//   database: "wonderwe_prod"
// });

// banner image, code_picture_url, profile_pic_url
// code_tbl, organization_tbl, user_profile_tbl

// Development Default images

/*
https://wonderwe.s3.amazonaws.com/profile/c5bfa833-ff85-4842-84d1-cf0ffa94f378-default-campaignpng.png
https://wonderwe.s3.amazonaws.com/profile/10344a9c-068d-4bf5-9454-be11815a51af-default-charitypng.png
https://wonderwe.s3.amazonaws.com/profile/2637709f-214d-4dbb-a551-a17f2f783a37-default-userpng.png
https://wonderwe.s3.amazonaws.com/profile/bf65c8c0-1296-4e96-87e6-0ef346ec2424-default-charity-backgroundjpg.jpg
*/


// Production Default Images
/*
https://wonderwe-prod.s3.amazonaws.com/profile/6202a9d6-bca7-487a-b48d-c22532a3c73e-default-campaignpng.png
https://wonderwe-prod.s3.amazonaws.com/profile/92cc3195-8136-4f4f-8f5e-f859263d34f5-default-userpng.png
https://wonderwe-prod.s3.amazonaws.com/profile/38ef71cb-2ed4-4e7f-8f6d-37a198f1517a-default-charitypng.png
https://wonderwe-prod.s3.amazonaws.com/profile/073cab00-86ab-48ea-92db-a71fe3a9a790-default-charity-backgroundjpg.jpg
*/

async.parallel({
    code_tbl: function(callback) {
      pool.query("update code_tbl set code_picture_url=? where code_picture_url=''", ['https://wonderwe-prod.s3.amazonaws.com/profile/6202a9d6-bca7-487a-b48d-c22532a3c73e-default-campaignpng.png'], callback);
    },
    organization_tbl: function(callback) {
      pool.query("update organization_tbl set profile_pic_url=? where profile_pic_url=''", ['https://wonderwe-prod.s3.amazonaws.com/profile/38ef71cb-2ed4-4e7f-8f6d-37a198f1517a-default-charitypng.png'], callback);
    },
    organization_banner_tbl: function(callback) {
      pool.query("update organization_tbl set background_pic_url=? where background_pic_url is NULL", ['https://wonderwe-prod.s3.amazonaws.com/profile/073cab00-86ab-48ea-92db-a71fe3a9a790-default-charity-backgroundjpg.jpg'], callback);
    },
    user_profile_tbl: function(callback) {
      pool.query("update user_profile_tbl set profile_pic_url=? where profile_pic_url is NULL", ['https://wonderwe-prod.s3.amazonaws.com/profile/92cc3195-8136-4f4f-8f5e-f859263d34f5-default-userpng.png'], callback);

    },
  },
  function(err, results) {
    console.log(err);
    // results now equals: {one: 1, two: 2}
    console.log('Done well...');
  });
