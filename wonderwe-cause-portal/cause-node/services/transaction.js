var donorServices = require('./donations.js');
exports.transObject = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['transFilterByDates'], [obj.charityId, obj.fromDate, obj.toDate], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.transObjectOfYear = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['transFilterByYear'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.transObjectOfMonth = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['transFilterByMonth'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      callback(null, result);
    }
  });
};

exports.transObjectOfWeek = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['transFilterByWeek'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.transObjectOfToday = function(obj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['transFilterByToday'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.activeSummaryYearly = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['activitySummeryYearly'], [obj.charityId, obj.year, obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};
exports.campainsBreakdownYearly = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['campainsBreakdownYear'], [charityId, charityId, charityId], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};
exports.summaryBreakdownYearly = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['summaryBreakdownYear'], [obj.charityId, obj.year], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};
exports.totalsBreakdownYearly = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['totalsBreakdownYear'], [charityId], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};
exports.addOfflineTransactions = function(obj, callback) {
  if (obj.email) {
    excuteQuery.queryForAll(sqlQueryMap['checkemail'], [obj.email], function(err, result) {
      if (err) {
        callback(err, null);
      } else {
        console.log(obj.transaction_date);
        obj.transaction_date = moment.utc(obj.transaction_date).format('YYYY-MM-DD HH:mm:ss');
        if (result[0] && result[0].id) {
          obj.user_id = result[0].id;
          var tranceObj = {};
          tranceObj.user_id = result[0].id;
          tranceObj.transaction_date = obj.transaction_date
          tranceObj.offline = 'yes';
          tranceObj.code_id = obj.code_id;
          tranceObj.type = 'code';
          if(obj.charity_id){
          tranceObj.charity_id = obj.charity_id;
          }
          tranceObj.amount = obj.donation;
          tranceObj.hide_amount = obj.hide_amount;
          tranceObj.anonymous = obj.anonymous;
          tranceObj.created_date = obj.created_date;
          tranceObj.wonderwe_fee=0.00;
          excuteQuery.queryForAll(sqlQueryMap['saveDonationTransaction'], [tranceObj], function(err, result) {
            if (err) {
              callback(err, null);
            } else {
              donorServices.donationAmountUpdate(tranceObj, function(err, result7) {});
              callback(null, obj);
               agenda.now('campaignReachedThresholds', { code_id: obj.code_id });
            }
          });
        } else {
          obj.transaction_date = moment.utc(obj.transaction_date).format('YYYY-MM-DD HH:mm:ss');
          excuteQuery.queryForAll(sqlQueryMap['addingUserData'], [obj.transaction_date, obj.fullname, obj.email], function(err, result) {
            if (err) {
              callback(err, null);
            } else {
              excuteQuery.queryForAll(sqlQueryMap['newProfiledatainsert'], [result.insertId, obj.phone], function(err, result1) {
                if (err) {
                  callback(err, null);
                } else {
                  excuteQuery.queryForAll(sqlQueryMap['userIdStoreInEntity'], [result.insertId, 'user'], function(err, result2) {
                    if (err) {
                      callback(err, null);
                    } else {
                      obj.user_id = result.insertId;
                      var tranceObj = {};
                      tranceObj.user_id = result.insertId;
                      tranceObj.transaction_date = obj.transaction_date
                      tranceObj.offline = 'yes';
                      tranceObj.code_id = obj.code_id;
                      tranceObj.type = 'code';
                      if(obj.charity_id){
                         tranceObj.charity_id = obj.charity_id;
                      }
                      tranceObj.amount = obj.donation;
                      tranceObj.hide_amount = obj.hide_amount;
                      tranceObj.anonymous = obj.anonymous;
                      tranceObj.created_date = obj.created_date;
                      tranceObj.wonderwe_fee=0.00;
                      excuteQuery.queryForAll(sqlQueryMap['saveDonationTransaction'], [tranceObj], function(err, result3) {
                        if (err) {
                          callback(err, null);
                        } else {
                          donorServices.donationAmountUpdate(tranceObj, function(err, result7) {});
                          callback(null, obj);
                          agenda.now('campaignReachedThresholds', { code_id: obj.code_id });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      }
    });
  } else {
    obj.transaction_date = moment.utc(obj.transaction_date).format('YYYY-MM-DD HH:mm:ss');
    excuteQuery.queryForAll(sqlQueryMap['addingUserDatawithoutemail'], [obj.transaction_date, obj.fullname], function(err, result) {
      if (err) {
        callback(err, null);
      } else {
        excuteQuery.queryForAll(sqlQueryMap['newProfiledatainsert'], [result.insertId, obj.phone], function(err, result1) {
          if (err) {
            callback(err, null);
          } else {
            excuteQuery.queryForAll(sqlQueryMap['userIdStoreInEntity'], [result.insertId, 'user'], function(err, result2) {
              if (err) {
                callback(err, null);
              } else {
                obj.user_id = result.insertId;
                var tranceObj = {};
                tranceObj.user_id = result.insertId;
                tranceObj.transaction_date = obj.transaction_date
                tranceObj.offline = 'yes';
                tranceObj.code_id = obj.code_id;
                tranceObj.type = 'code';
                if(obj.charity_id){
                   tranceObj.charity_id = obj.charity_id;
                 }
                tranceObj.amount = obj.donation;
                tranceObj.hide_amount = obj.hide_amount;
                tranceObj.anonymous = obj.anonymous;
                tranceObj.created_date = obj.created_date;
                tranceObj.wonderwe_fee=0.00;
                excuteQuery.queryForAll(sqlQueryMap['saveDonationTransaction'], [tranceObj], function(err, result3) {
                  if (err) {
                    callback(err, null);
                  } else {
                    callback(null, obj);
                    donorServices.donationAmountUpdate(tranceObj, function(err, result7) {});
                    agenda.now('campaignReachedThresholds', { code_id: obj.code_id });
                  }
                });
              }
            });
          }
        });
      }
    });
  }
};
exports.getOfflineDonations = function(tranceObj, callback) {
  if(tranceObj.type==='charity'){
  var query='getCharityOfflineDonations';
 }else{
  var query='getUserOfflineDonations';
 }
  excuteQuery.queryForAll(sqlQueryMap[query], [tranceObj.Id,tranceObj.Id], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};
