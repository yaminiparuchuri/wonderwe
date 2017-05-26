exports.charityTransactions = function(tranceObject, callback) {
  if (tranceObject.type == null) {
    excuteQuery.queryForAll(sqlQueryMap['charityTransactions'], [tranceObject.charityId, tranceObject.startDate, tranceObject.endDate], function(err, rows) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, rows);
      }
    });
  } else if (tranceObject.type == 'code') {
    excuteQuery.queryForAll(sqlQueryMap['charityCodeTransactions'], [tranceObject.charityId, tranceObject.startDate, tranceObject.endDate], function(err, rows) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, rows);
      }
    });
  }
};
exports.charityStatistics = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['charityStatistics'], [charityId,charityId], function(err, rows) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
};
exports.getCharityCounts = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getcharityanalytics'], [obj.charityId], function(err, totalCounts) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, totalCounts);
    }
  });
};
exports.getAllActivityList = function(obj, callback) {
  var today = [];
  var week = [];
  var month = [];
  var year = [];
  excuteQuery.queryForAll(sqlQueryMap['transFilterByToday'], [obj.charityId], function(err, todayDonations) {
    if (err) {
      callback(err, null);
    } else {
      if (todayDonations.length > 0) {
        today.push(todayDonations);
      }
      excuteQuery.queryForAll(sqlQueryMap['getNewFollowersToday'], [obj.charityId], function(err, todayFollowers) {
        if (err) {
          callback(err, null);
        } else {
          if (todayFollowers.length > 0) {
            today.push(todayFollowers[0]);
          }
          if (today.length > 0) {
            var obj1 = {};
            obj1.day = "day";
            obj1.data = today;
            callback(null, obj1);
          } else {
            excuteQuery.queryForAll(sqlQueryMap['transFilterByWeek'], [obj.charityId], function(err, weekDonations) {
              if (err) {
                callback(err, null);
              } else {
                if (weekDonations.length > 0) {
                  week.push(weekDonations[0]);
                }
                excuteQuery.queryForAll(sqlQueryMap['getNewFollowersByWeek'], [obj.charityId], function(err, weekFollowers) {
                  if (err) {
                    callback(err, null);
                  } else {
                    if (weekFollowers.length > 0) {
                      week.push(weekFollowers[0]);
                    }
                    if (week.length > 0) {
                      var obj1 = {};
                      obj1.week = "week";
                      obj1.data = week;
                      callback(null, obj1);
                    } else {
                      excuteQuery.queryForAll(sqlQueryMap['transFilterByMonth'], [obj.charityId], function(err, monthDonations) {
                        if (err) {
                          callback(err, null);
                        } else {
                          if (monthDonations.length > 0) {
                            month.push(monthDonations[0]);
                          }
                          excuteQuery.queryForAll(sqlQueryMap['getNewFollowersByMonth'], [obj.charityId], function(err, monthFollowers) {
                            if (err) {
                              callback(err, null);
                            } else {
                              if (monthFollowers.length > 0) {
                                month.push(monthFollowers[0]);
                              }
                              if (month.length > 0) {
                                var obj1 = {};
                                obj1.month = "month";
                                obj1.data = month;
                                callback(null, obj1);
                              } else {
                                excuteQuery.queryForAll(sqlQueryMap['transFilterByYear'], [obj.charityId], function(err, yearDonations) {
                                  if (err) {
                                    callback(err, null);
                                  } else {
                                    if (yearDonations.length > 0) {
                                      year.push(yearDonations[0]);
                                    }
                                    excuteQuery.queryForAll(sqlQueryMap['getNewFollowersByYear'], [obj.charityId], function(err, yearFollowers) {
                                      if (err) {
                                        callback(err, null);
                                      } else {
                                        if (yearFollowers.length > 0) {
                                          year.push(yearFollowers[0]);
                                        }
                                        if (year.length > 0) {
                                          var obj1 = {};
                                          obj1.year = "year";
                                          obj1.data = year;
                                          callback(null, obj1);
                                        } else {
                                          callback(null, null);
                                        }

                                      }
                                    });

                                  }
                                });

                              }
                            }
                          });

                        }
                      });

                    }

                  }
                });
              }
            });
          }
        }
      });

    }
  });
};
