exports.getAllCampaignsBasedOnCategory = function(obj, callback) {
  console.log(obj);
  console.log(sqlQueryMap);
  var value = sqlQueryMap["campaignBasedOnCategory"];
  console.log('value:',value);
  if (obj.categoryId) {
    console.log(value);
    value += ' and category_id=' + "'" + obj.categoryId + "'" + 'group by c.id order by donation_progress desc, e.nooffollowers desc LIMIT 20 OFFSET '+ obj.skip ;
  } else {
    value += ' group by c.id order by donation_progress desc, e.nooffollowers desc LIMIT 20 OFFSET '+ obj.skip ;

  }
  console.log(value)
  excuteQuery.queryForAll(value, [], function(err, rows) {
    if (err) {
      console.log(err);
      callback(new Error(err), null);
    } else {

      callback(null, rows);
    }
  });
}