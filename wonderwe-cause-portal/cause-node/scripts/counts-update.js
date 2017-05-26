var mysql = require('mysql');
var props = require('config').props;

var pool = mysql.createPool({
  host: props.host,
  port:props.port,
  user: props.username,
  password: props.password,
  database: props.database,
});

var async = require('async');
// Update charity, donors, campaigns

pool.query("select * from entity_tbl where slug is not null", function(err, entityResult) {
  console.log(err);
  console.log(entityResult.length);
  if (entityResult && entityResult.length > 0) {

    async.eachSeries(entityResult, function(singleObject, callback) {
      //console.log(singleObject);

      if (singleObject.entity_type === 'user') {
        async.parallel({
          campaingfollowing: function(followingCallback) {
            pool.query('select count(*) as campaingfollowing from follow_tbl ft inner join entity_tbl et on et.id = ft.entity_id and et.entity_type =? where ft.user_id =?', ['code', singleObject.entity_id], function(err, campaignResult) {
              followingCallback(null, campaignResult);
            });
          },
          charityFollowing: function(followingCallback) {
            pool.query('select count(*) charityFollowing from follow_tbl ft inner join entity_tbl et on et.id = ft.entity_id and et.entity_type =? where ft.user_id =?', ['charity', singleObject.entity_id], function(err, charityresult) {
              followingCallback(null, charityresult);
            });
          },
          donorsFollowing: function(followingCallback) {
            pool.query('select count(*) as userFollowing  from follow_tbl ft inner join entity_tbl et on et.id = ft.entity_id and et.entity_type =? where ft.user_id =?', ['user', singleObject.entity_id], function(err, userResult) {
              followingCallback(null, userResult);
            });
          },
          followers: function(followersCallback) {
            pool.query('select count(*) as followersCount from entity_tbl et inner join follow_tbl ft on ft.entity_id = et.id where et.entity_id =? and et.entity_type=?', [singleObject.entity_id, 'user'], function(err, followersResult) {
              followersCallback(null, followersResult);
            });
          },
          postCounts: function(postsCallback) {
            pool.query('select count(*) as postsCount from status_update_tbl st where entity_id =? and status_type IN ("post","share") and date_deleted is null;', [singleObject.id], function(err, postsResult) {
              postsCallback(null, postsResult);
            });
          },
          userTransactions: function(transactionCallback) {
            pool.query('select count(*) as donationsCount from transaction_tbl where user_id =?', [singleObject.entity_id], function(err, donationCount) {
              transactionCallback(null, donationCount);
            });
          }
        }, function(err, donorResult) {

          console.log(donorResult);

          pool.query('update entity_tbl set noofposts=?,following_users=?,following_charities=?,following_codes=?,nooffollowers=? where id=?', [donorResult.postCounts[0].postsCount, donorResult.donorsFollowing[0].userFollowing, donorResult.charityFollowing[0].charityFollowing, donorResult.campaingfollowing[0].campaingfollowing, donorResult.followers[0].followersCount, singleObject.id], function(err, updatedResult) {
            callback(null);
          });
        });

      } else if (singleObject.entity_type === 'code') {
        console.log('This is campaing blog');
        async.parallel({
          followers: function(followersCallback) {
            pool.query('select count(*) as followersCount from entity_tbl et inner join follow_tbl ft on ft.entity_id = et.id where et.entity_id =? and et.entity_type=?', [singleObject.entity_id, 'code'], function(err, followersResult) {
              followersCallback(null, followersResult);
            });
          },
          postCounts: function(postsCallback) {
            pool.query('select count(*) as postsCount from status_update_link_tbl st where st.linked_id =? and st.linked_type =?', [singleObject.entity_id, 'code'], function(err, postsResult) {
              postsCallback(null, postsResult);
            });
          },
          campaignTransactions: function(transactionCallback) {
            pool.query('select count(*) as campainDonations from transaction_tbl where code_id =?', [singleObject.entity_id], function(err, donationCount) {
              transactionCallback(null, donationCount);
            });
          }
        }, function(err, donorResult) {
          console.log(donorResult);
          pool.query('update entity_tbl set noofposts=?, nooffollowers=? where id=?', [donorResult.postCounts[0].postsCount, donorResult.followers[0].followersCount, singleObject.id], function(err, updatedResult) {
            callback(null);
          });
        });

      } else if (singleObject.entity_type === 'charity') {

        async.parallel({
          followers: function(followersCallback) {
            pool.query('select count(*) as followersCount from entity_tbl et inner join follow_tbl ft on ft.entity_id = et.id where et.entity_id =? and et.entity_type=?', [singleObject.entity_id, 'charity'], function(err, followersResult) {
              followersCallback(null, followersResult);
            });
          },
          postCounts: function(postsCallback) {
            pool.query('select count(*) as postsCount from status_update_tbl st where entity_id =? and status_type IN ("post","share") and date_deleted is null;', [singleObject.id], function(err, postsResult) {
              postsCallback(null, postsResult);
            });
          },
          charityTransactions: function(transactionCallback) {
            pool.query('select count(*) as charityDonations from transaction_tbl where charity_id =?', [singleObject.entity_id], function(err, donationCount) {
              transactionCallback(null, donationCount);
            });
          }
        }, function(err, donorResult) {
          console.log(donorResult);
          pool.query('update entity_tbl set noofposts=?, nooffollowers=? where id=?', [donorResult.postCounts[0].postsCount, donorResult.followers[0].followersCount, singleObject.id], function(err, updatedResult) {
            callback(null);
          });
        });
      } else {
        console.log('Skipped condition');
        callback(null);
      }

    }, function(err) {
      console.log('Done well...');
    });
  }
});
