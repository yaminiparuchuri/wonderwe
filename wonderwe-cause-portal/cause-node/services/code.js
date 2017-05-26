/*
 $StartDate = strtotime($_REQUEST['start_date'] . ' ' . $_REQUEST['start_time']);
 $_REQUEST['start_date'] = date("Y-m-d H:i:s", $StartDate);
 $EndDate = strtotime($_REQUEST['end_date'] . ' ' . $_REQUEST['end_time']);
 $_REQUEST['end_date'] = date("Y-m-d H:i:s", $EndDate);
 */
var charityService = require('./charity.js');
var wepayService = require('./wepay');
var stripeService = require('./stripe');
var elasticService = require('../services/elastic');
var dripCampaign = require('../services/drip-campaign');
var feedBotService = require('./feedBot');
var followerService = require('./follower');
var teamService = require('./team');
var pagesService = require('../services/pages');
var request = require('request');

exports.getCategoriesByCharity = function(charityId, callback) {
  //Connection Code

  excuteQuery.queryForAll(sqlQueryMap['codeCategoryByCharity'], [charityId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.createCodeCategory = function(categoryObj, callback) {

  var query = excuteQuery.insertAndReturnKey(sqlQueryMap['codeCategoryInsert'], [categoryObj.charityId, categoryObj.title], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      //TODO: Check the Updated Rows and See InsertID is Valid Value.
      categoryObj.id = rows;
      callback(null, categoryObj);
    }
  });
};
exports.updateCustomSettingsData = function(settingsData, callback) {

  var userData = {};
  userData.full_name = settingsData.fullname;
  userData.email = settingsData.email;
  userData.phone = settingsData.phone_number;
  userData.val = true;
  userDataStore(userData, function(err, result) {

    async.each(settingsData.filedData, function(indiData, callback) {

    })
  })

}
exports.updateStateId = function(stateCode, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getStateBycode'], [stateCode], function(err, rows2) {
    if (err) {
      callback(err);
    } else {
      console.log(rows2);
      callback(null, rows2[0]);
      //var rows = rows2[0];
    }
  })
}
exports.getEventData = function(eventId, callback) {
  var getEvent = excuteQuery.queryForAll(sqlQueryMap['getEventDataById'], [eventId], function(err, rows2) {
    if (err) {
      callback(err);
    } else {
      var rows = rows2[0];

      if (rows.event_tickets || rows.event_volunteers) {
        async.parallel({
          getEventVolunteers: function(callback) {
            excuteQuery.queryForAll(sqlQueryMap['getEventTickets'], [eventId], callback)
          },
          getEventTickets: function(callback) {
            excuteQuery.queryForAll(sqlQueryMap['getVolunteerTickets'], [eventId], callback)
          },
          getEventSettings: function(callback) {
            if (rows.event_coordinator_id) {

              excuteQuery.queryForAll(sqlQueryMap['getCustomSettingsdata'], [eventId], callback)

            } else {
              excuteQuery.queryForAll(sqlQueryMap['getcustomfield'], [eventId], callback)

            }
          },
          getUserdata: function(callback) {

            if (rows.event_coordinator_id) {
              excuteQuery.queryForAll(sqlQueryMap['getUserCoordinator'], [rows.event_coordinator_id], callback)

            } else {
              callback(null, null)
            }
          }
        }, function(err, result) {
          rows.eventtickets = result.getEventTickets;
          rows.eventvolunteers = result.getEventVolunteers;
          rows.settingsfields = result.getEventSettings;
          if (result.getUserdata)
            rows.getUserdata = result.getUserdata[0];
          callback(null, rows);


        })
      } else {
        callback(null, rows2)
      }
      //})
    }
  });
}
exports.getCharityData = function(charityId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getOrgDetails'], [charityId], function(err, charityDta) {
    if (err)
      callback(new Error(err), null);
    else callback(null, charityDta);
  })

}
exports.getallusercampaigns = function(userid, usercallback) {
  console.log("in servhcjcjdjsnj")
  async.parallel({
    getAllCodeAdmins: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['getAllCodeAdmins'], [userid], function(err, charityDta) {
        if (err) {

          callback(new Error(err), null);
        } else {
          callback(null, charityDta);
        }
      })
    },
    getAllCampaigns: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['getAllCampaigns'], [userid], function(err, charityDta) {
        if (err) {
          callback(new Error(err), null);
        } else {
          callback(null, charityDta);
        }
      })
    },
    getAllp2pcampaigns: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['getAllp2pcampaigns'], [userid], function(err, charityDta) {
        if (err) {
          callback(new Error(err), null);
        } else {
          callback(null, charityDta);
        }
      })
    },
    getAllCharities: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['getAllCharities'], [userid], function(err, charityDta) {
        if (err) {
          console.log("hello i ccammjnjn")
          callback(new Error(err), null);
        } else {
          callback(null, charityDta);
        }
      })
    },
    getAllMonthlyDonation:function(callback){
      console.log("in")
       excuteQuery.queryForAll(sqlQueryMap['getAllMonthlyDonation'],[userid,userid],function(err, donationData){
      if(err){
       callback(new Error(err),null);
      }else{
       callback(null,donationData);
      }
      });
    }
  }, function(err, result) {
    console.log(result);
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      var rows = {};
      rows.getAllCodeAdmins = result.getAllCodeAdmins;
      rows.getAllCharities = result.getAllCharities;
      rows.getAllp2pcampaigns = result.getAllp2pcampaigns;
      rows.getAllCampaigns = result.getAllCampaigns;
      rows.getAllMonthlyDonation=result.getAllMonthlyDonation;
      usercallback(null, rows);
    }
  })
}
exports.userMonthlyDonationDelete = function(userid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['userMonthlyDonationDelete'], [userid], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'Error occured while deleting the monthly donation');
      callback(new Error(err), null);
    } else {
      utility.nodeLogs('INFO', 'Updated user monthly the monthly donations');
      callback(null, result);
    }
  });
}
exports.userStripeSubscriptonDelete  = function(userid, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getUserMonthlyDonations'], [userid,'stripe'], function(err, userResult) {
    if (err) {
      utility.nodeLogs('ERROR','Error occured while getting user payment gateway details');
      callback(new Error(err), null);
    } else {
      if (userResult.length) {
        async.eachSeries(userResult, function(singleObj, eachCallback) {
          excuteQuery.queryForAll(sqlQueryMap['getUserPaymentGateway'],[singleObj.id],function(err,paymentResult){
            if(err){
              utility.nodeLogs('ERROR','Error occured while getting the user payment result');
              eachCallback(err);
          }else{
            var obj={};
            obj.paymentgatewayid=paymentResult[0].paymentgatewayid;
            obj.customer_id=paymentResult[0].customer_id;
            obj.subscription_id=paymentResult[0].subscription_id;
            obj.id=paymentResult[0].subscription_id;
            stripeService.cancelStripeSubscription(obj, function(err,result){
              if(err){
                eachCallback(err);
              }else{
                eachCallback(null);
              }
            });
          }
        });
        }, function(err, result) {
          if (err) {
            callback(err,null)
          } else {
            callback(null,{status:"success"});
          }
        });
      } else {
        callback(null, null);
      }
    }
  });
}
exports.userDataDelete = function(userid, callback) {
  console.log(userid);
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['cancelAccount'], [parseInt(userid)], function(err, result) {
    if (err) {
      console.log(err);
      callback(new Error(err), null);
    } else {
      console.log(result);
      callback(null, result);



      excuteQuery.queryForAll(sqlQueryMap['deleteElasticDataForCancelAccount'], [parseInt(userid)], function(err, entityResult) {
        if (err) {
          console.log(err);
          // callback(new Error(err), null);


        } else {
          console.log("entityresult");
          console.log(entityResult)
          var flatArray = [],
            charity_data = {};
          charity_data = {
            index: props.elastic_index + '_np',
            type: 'charity_for_fundraiser',
            doc: {
              status: "NOT_CLAIMED",
              profilepic:props.default_org_profile_pic_url
            }
          };
          if (entityResult.length > 0) {
            var id = underscore.pluck(entityResult, 'id')
            var campaignResult = underscore.pluck(entityResult, 'campaignid');
            var charityid = underscore.pluck(entityResult, 'charityid');
            var charitycampaignid = underscore.pluck(entityResult, 'charitycampaignid');
            flatArray.push(id)
            
           if(campaignResult.length){
            var charity_logo=props.default_org_profile_pic_url;
             excuteQuery.queryForAll(sqlQueryMap['updateCharityImageForCustom'],[charity_logo,campaignResult],function(err,result){
              if(err){
               utility.nodeLogs('ERROR','Error while updating charity logo')
              }else{
                utility.nodeLogs('sucess','charity logo updated');
              }
             });
           }

            if (campaignResult.length > 0) {
              var campaignEntityId = underscore.uniq(campaignResult)
              flatArray.push(campaignEntityId)
            }

            if (charityid.length > 0) {
              var charityEntityId = underscore.uniq(charityid)
              flatArray.push(charityEntityId)

            }

            if (charitycampaignid.length > 0) {
              var charityCampaignEntityId = underscore.uniq(charitycampaignid)
              flatArray.push(charityCampaignEntityId)
            }
            var allEntityIds = underscore.flatten(flatArray);
            me.cancelAccountUpdatesCount(userid, id, function(err, result) {
              if (err) {
                console.log(err)
              } else {
                async.each(underscore.compact(allEntityIds), function(entityid, elasticCallback) {

                  elasticService.updateDocument(charity_data, function(err, result) {
                    //   elasticCallback(null)

                  })
                  elasticClient.delete({
                    index: props.elastic_index,
                    type: 'entity',
                    id: entityid
                  }, function(error, response2) {
                    console.log('fundraiser charity removal response.');
                    console.log(error);
                    console.log(response2);
                    elasticCallback(null)
                  });
                  charity_data.id = entityid;

                }, function(err) {
                  console.log('Done well..');
                })
              }
            })

          } else {
            console.log("No userid found with that userid");
          }
        }
      })
    }
  })
}
exports.cancelAccountUpdatesCount = function(userid, entityId, callback) {
  async.parallel({
    getUserFollowingPeople: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['updateUserFollowingPeople'], [parseInt(userid)], function(err, result) {
        if (err) {
          console.log(err);
          callback(new Error(err), null);
        } else {
          console.log(result);
          callback(null, result);
        }
      })
    },
    getUserFollowers: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['updateUserFollowers'], [parseInt(entityId)], function(err, result) {
        if (err) {
          console.log(err);
          callback(new Error(err), null);
        } else {
          console.log(result);
          callback(null, result);
        }
      })
    },
    getUserFollowingCharity: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['updateUserFollowingCharities'], [parseInt(userid)], function(err, result) {
        if (err) {
          console.log(err);
          callback(new Error(err), null);
        } else {
          console.log(result);
          callback(null, result);
        }
      })
    },
    getUserFollowingCampaigns: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['updateUserFollowingCampaigns'], [parseInt(userid)], function(err, result) {
        if (err) {
          console.log(err);
          callback(new Error(err), null);
        } else {
          console.log(result);
          callback(null, result);
        }
      })
    },
    getUserCharityFollowers: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['updateUserCharityFollowers'], [parseInt(userid)], function(err, result) {
        if (err) {
          console.log(err);
          callback(new Error(err), null);
        } else {
          console.log(result);
          callback(null, result);
        }
      })
    },
    getUserCharityCampaignFollowers: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['updateUserCharityCampaignFollowers'], [parseInt(userid)], function(err, result) {
        if (err) {
          console.log(err);
          callback(new Error(err), null);
        } else {
          console.log(result);
          callback(null, result);
        }
      })
    },
    getUserCampaignFollwers: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['updateUserCampaignFollowers'], [parseInt(userid)], function(err, result) {
        if (err) {
          console.log(err);
          callback(new Error(err), null);
        } else {
          console.log(result);
          callback(null, result);
        }
      })
    }
  }, function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, 'success');

    }
  })
}
exports.updateEvent = function(editEventData, callback) {
  var eventdata = {};
  var preferncesObj = {};
  /*
    if(editEventData.causes){
      preferncesObj.preferences=editEventData.causes;
      preferncesObj.event_id=editEventData.id;
    var data = [];

    underscore.map(preferncesObj.preferences, function(num) {
      if (num && num.length > 1) {
        var newArray = num.split(',');
        underscore.map(newArray, function(newNum) {
          data.unshift([newNum, preferncesObj.event_id]);
        });
        return null;
      } else {
        data.unshift([num, preferncesObj.event_id]);
        return null;
      }
    });
  =======
  =======
  >>>>>>> feature/teams
        if (rows.event_tickets || rows.event_volunteers) {
          async.parallel({
            getEventVolunteers: function(callback) {
              excuteQuery.queryForAll(sqlQueryMap['getEventTickets'], [eventId], callback)
            },
            getEventTickets: function(callback) {
              excuteQuery.queryForAll(sqlQueryMap['getVolunteerTickets'], [eventId], callback)
            },
            getEventSettings: function(callback) {
              if (rows.event_coordinator_id) {
                excuteQuery.queryForAll(sqlQueryMap['getCustomSettingsdata'], [eventId], callback)

              } else {
                excuteQuery.queryForAll(sqlQueryMap['getcustomfield'], [eventId], callback)

              }
            },
            getUserdata: function(callback) {

              if (rows.event_coordinator_id) {
                excuteQuery.queryForAll(sqlQueryMap['getUserCoordinator'], [rows.event_coordinator_id], callback)

              } else {
                callback(null, null)
              }
            }
          }, function(err, result) {
            rows.eventtickets = result.getEventTickets;
            rows.eventvolunteers = result.getEventVolunteers;
            rows.settingsfields = result.getEventSettings;
            if (result.getUserdata)
              rows.getUserdata = result.getUserdata[0];
            callback(null, rows);


          })
        } else {
          callback(null, rows2)
        }
        //})
      }
    });
  }
  exports.updateEvent = function(editEventData, callback) {
    var eventdata = {};
    var preferncesObj = {};
    /*
      if(editEventData.causes){
        preferncesObj.preferences=editEventData.causes;
        preferncesObj.event_id=editEventData.id;
      var data = [];

      underscore.map(preferncesObj.preferences, function(num) {
        if (num && num.length > 1) {
          var newArray = num.split(',');
          underscore.map(newArray, function(newNum) {
            data.unshift([newNum, preferncesObj.event_id]);
          });
          return null;
        } else {
          data.unshift([num, preferncesObj.event_id]);
          return null;
        }
      });
    =======
          if (rows.event_tickets || rows.event_volunteers) {
            async.parallel({
              getEventVolunteers: function(callback) {
                excuteQuery.queryForAll(sqlQueryMap['getEventTickets'], [eventId], callback)
              },
              getEventTickets: function(callback) {
                excuteQuery.queryForAll(sqlQueryMap['getVolunteerTickets'], [eventId], callback)
              },
              getEventSettings: function(callback) {
                if (rows.event_coordinator_id) {
                  excuteQuery.queryForAll(sqlQueryMap['getCustomSettingsdata'], [eventId], callback)
    >>>>>>> 54c50ce4da4a11c3ebbd7947c434e0174040d5fc

                } else {
                  excuteQuery.queryForAll(sqlQueryMap['getcustomfield'], [eventId], callback)

                }
              },
              getUserdata: function(callback) {

                if (rows.event_coordinator_id) {
                  excuteQuery.queryForAll(sqlQueryMap['getUserCoordinator'], [rows.event_coordinator_id], callback)

                }
              }
            }, function(err, result) {

              rows.eventtickets = result.getEventTickets;
              rows.eventvolunteers = result.getEventVolunteers;
              rows.settingsfields = result.getEventSettings;
              if (result.getUserdata)
                rows.getUserdata = result.getUserdata[0];
              callback(null, rows);
            })
          } else {
            callback(null, rows2);
          }
        }
      });
    }
    exports.updateEvent = function(editEventData, callback) {
      var eventdata = {};
      var preferncesObj = {};
      /*
        if(editEventData.causes){
          preferncesObj.preferences=editEventData.causes;
          preferncesObj.event_id=editEventData.id;
        var data = [];
        underscore.map(preferncesObj.preferences, function(num) {
          if (num && num.length > 1) {
            var newArray = num.split(',');
            underscore.map(newArray, function(newNum) {
              data.unshift([newNum, preferncesObj.event_id]);
            });
            return null;
          } else {
            data.unshift([num, preferncesObj.event_id]);
            return null;
          }
        });
        pool.query("DELETE FROM code_fund_category_tbl WHERE event_id = ?", [preferncesObj.event_id], function(err, removedResult) {
          if (err) {

          } else {
            if (preferncesObj.preferences && preferncesObj.preferences.length > 0) {
              var sql = "INSERT INTO event_categories_tbl(category_group,event_id) VALUES ?";
              pool.query(sql, [underscore.compact(data)], function(err, removedResult) {
              })

            } else {

           }
          }
        });
      }*/

  if (editEventData.event_name)
    eventdata.event_name = editEventData.event_name;
  if (editEventData.organizer)
    eventdata.organizer = editEventData.organizer;
  if (editEventData.start_date)
    eventdata.start_date = moment.utc(editEventData.start_date).format('YYYY-MM-DD HH:mm:ss');
  if (editEventData.end_date)
    eventdata.end_date = moment.utc(editEventData.end_date).format('YYYY-MM-DD HH:mm:ss');
  if (editEventData.location)
    eventdata.location = editEventData.location;
  if (editEventData.event_text)
    eventdata.event_text = editEventData.event_text;
  if (editEventData.event_picture_url)
    eventdata.event_picture_url = editEventData.event_picture_url;
  if (eventdata.description)
    eventdata.description = editEventData.description;
  if (editEventData.event_video_url)
    eventdata.event_video_url = editEventData.event_video_url;
  if (editEventData.tickets) {
    if (editEventData.tickets.length)
      eventdata.event_tickets = "yes";
    else
      eventdata.event_tickets = "no";
  }

  if (editEventData.volunteers) {
    if (editEventData.volunteers.length)
      eventdata.event_volunteers = "yes";
    else
      eventdata.event_volunteers = "no";
  }

  async.parallel({
    updateevent: function(callback) {
      if (eventdata) {

        if (!editEventData.eventValStep) {
          excuteQuery.queryForAll(sqlQueryMap['updateEventData'], [eventdata.event_name, eventdata.start_date, eventdata.end_date, eventdata.organizer, eventdata.location, eventdata.event_text, editEventData.id], function(err, data) {
            if (err) {

            } else {
              callback(null, data)
            }
          });
        }
      } else callback(null, null)
    },
    updatevolunteers: function(callback) {
      var volunteersLength = 0,
        volunteerResult = [];
      if (editEventData.volunteers) {
        if (editEventData.volunteers.length) {
          async.each(editEventData.volunteers, function(volunteers, eachCallback) {
            if (volunteers.start_date)
              volunteers.start_date = moment.utc(volunteers.start_date).format('YYYY-MM-DD HH:mm:ss');
            else
              volunteers.start_date = moment.utc(editEventData.start_date).format('YYYY-MM-DD HH:mm:ss');
            if (volunteers.start_time) {
              volunteers.start_time = volunteers.start_time
            } else {
              volunteers.start_time = "00:00:00" //moment.utc(volunteers.start_date).format('HH:mm:ss');
            }
            if (volunteers.end_time) {
              volunteers.end_time = volunteers.end_time;
            } else {
              volunteers.end_time = "00:00:00" //moment.utc(volunteers.start_date).format('HH:mm:ss');
            }
            if (volunteers.id) {
              excuteQuery.update(sqlQueryMap['updatevolunteers'], [volunteers.shift_name, volunteers.volunteers_required,
                volunteers.start_date, volunteers.start_time, volunteers.end_time,
                volunteers.volunteers_required, volunteers.id
              ], function(err, result) {

                volunteersLength += 1;
                if (err) {} else {
                  volunteerResult.push(result);
                }
                if (editEventData.volunteers.length === volunteersLength) {
                  callback(null, volunteerResult);
                }
              });
            } else {
              var shiftObj = {};
              shiftObj = volunteers;
              shiftObj.event_id = editEventData.id;
              shiftObj.start_date = moment.utc(volunteers.start_date).format('YYYY-MM-DD HH:mm:ss');
              //shiftObj.end_date = moment.utc(group.end_date).format('YYYY-MM-DD HH:mm:ss');
              if (volunteers.start_time) {
                shiftObj.start_time = moment.utc(volunteers.start_time).format('HH:mm:ss');
              } else {
                shiftObj.start_time = moment.utc(volunteers.start_date).format('HH:mm:ss');
              }
              if (volunteers.end_time) {
                shiftObj.end_time = moment.utc(volunteers.end_time).format('HH:mm:ss');
              } else {
                shiftObj.end_time = moment.utc(volunteers.end_date).format('HH:mm:ss');
              }
              excuteQuery.insertAndReturnKey(sqlQueryMap['eventVolunteers'], [shiftObj], function(err, result) {

                volunteersLength += 1;
                if (err) {} else {
                  volunteerResult.push(result);
                }
                if (editEventData.volunteers.length === volunteersLength) {
                  callback(null, volunteerResult);
                }
              });

            }
          }, function(err) {

          })
        }

      } else callback(null, null)

    },

    updatetickets: function(callback) {
      var ticketLength = 0,
        ticketResults = [];
      if (editEventData.tickets) {
        if (editEventData.tickets.length) {

          async.each(editEventData.tickets, function(tickets, callback1) {

            if (tickets.start_date)
              tickets.start_date = moment.utc(tickets.start_date).format('YYYY-MM-DD HH:mm:ss');
            else
              tickets.start_date = moment.utc(editEventData.start_date).format('YYYY-MM-DD HH:mm:ss');

            if (tickets.end_date)
              tickets.end_date = moment.utc(tickets.end_date).format('YYYY-MM-DD HH:mm:ss');
            else
              tickets.end_date = moment.utc(editEventData.end_date).format('YYYY-MM-DD HH:mm:ss');
            if (tickets.start_time) {
              tickets.start_time = tickets.start_time
            } else {
              tickets.start_time = moment.utc(tickets.start_date).format('HH:mm:ss');
            }
            if (tickets.end_time) {
              tickets.end_time = tickets.end_time;
            } else {
              tickets.end_time = moment.utc(tickets.start_date).format('HH:mm:ss');
            }
            if (tickets.id) {
              excuteQuery.update(sqlQueryMap['updateTickets'], [tickets.ticket_name,
                tickets.quantity_required, tickets.prise, tickets.start_date,
                tickets.start_time, tickets.end_date,
                tickets.end_time, tickets.passfees, tickets.quantity_sold, tickets.id
              ], function(err, result) {
                ticketLength += 1;
                if (err) {} else {
                  ticketResults.push(result);
                }
                if (editEventData.tickets.length === ticketLength) {
                  callback(null, ticketResults);
                }
              });
            } else {
              var ticketsObj = {};
              ticketsObj = tickets;
              ticketsObj.event_id = editEventData.id;
              ticketsObj.start_date = tickets.start_date
              ticketsObj.end_date = tickets.end_date

              if (tickets.start_time) {
                ticketsObj.start_time = tickets.start_time;
              } else {
                ticketsObj.start_time = moment.utc(tickets.start_date).format('HH:mm:ss');
              }
              if (tickets.end_time) {
                ticketsObj.end_time = tickets.end_time;
              } else {
                ticketsObj.end_time = moment.utc(tickets.end_date).format('HH:mm:ss');
              }
              excuteQuery.insertAndReturnKey(sqlQueryMap['eventTickets'], [ticketsObj], function(err, result) {
                ticketLength += 1;
                if (err) {} else {
                  ticketResults.push(result);
                }
                if (editEventData.tickets.length === ticketLength) {
                  callback(null, ticketResults);
                }
              });
            }
          }, function(err) {

          })
        }
      } else callback(null, null)

    },

  }, function(err, results) {
    if (err) {
      callback(err);
    } else {
      var rows = {};
      if (results.updateevent)
        rows.eventData = results.updateevent;
      if (results.updatetickets)
        rows.updatetickets = results.updatetickets;
      if (results.updatevolunteers)
        rows.updatevolunteers = results.updatevolunteers;
      callback(null, rows);
    }
  })
}

exports.getCampaignMacro = function(obj, callback) {
  var campaignmacro = obj.campaignMacro;
  // var campaignMacro = sqlQueryMap["getCampaignMacro"];
  var additionalData,
    campaignMacro;
  if (campaignmacro.category) {
    if (additionalData) {
      additionalData += 'and c.category_id=' + campaignmacro.category
    } else {
      additionalData = 'c.category_id=' + campaignmacro.category
    }
  }
  if (campaignmacro.country) {
    if (additionalData) {
      additionalData += ' and c.country=' + campaignmacro.country
    } else {
      additionalData = 'c.country=' + campaignmacro.country
    }

  }
  if (campaignmacro.state) {
    if (additionalData) {
      additionalData += ' and c.state=' + campaignmacro.state
    } else {
      additionalData = 'c.state=' + campaignmacro.state
    }
  }

  async.parallel({
      getCampaignGoal: function(callback) {
        campaignMacro = sqlQueryMap["goalAmount"];
        if (campaignmacro.date) {
          if (campaignmacro.date == 'customdate') {
            if (obj.customDateObj) {
              campaignMacro += '  DATE(c.date_created) BETWEEN ' + "'" + obj.customDateObj.start_date + "'" + ' AND ' + "'" + obj.customDateObj.end_date + "'";
            }
          } else if (campaignmacro.date === 'livetodate') {
            campaignMacro += '  DATE(c.date_created) BETWEEN 2015-01-01  AND  Date(current_date) ';

          } else {
            campaignMacro += '  YEAR(c.date_created) = YEAR(current_date)';
          }
          if (additionalData) {
            campaignMacro += ' and ' + additionalData
          }
        }

        excuteQuery.queryForAll(campaignMacro, [campaignMacro], function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {

            callback(null, rows);
          }
        });
      },
      getCampaignRaised: function(callback) {
        campaignMacro = sqlQueryMap["totalAmountRaised"];
        if (campaignmacro.date) {
          if (campaignmacro.date == 'customdate') {
            if (obj.customDateObj) {
              campaignMacro += '  DATE(t.transaction_date) BETWEEN ' + "'" + obj.customDateObj.start_date + "'" + ' AND ' + "'" + obj.customDateObj.end_date + "'";
            }
          } else if (campaignmacro.date === 'livetodate') {
            campaignMacro += '  DATE(t.transaction_date) BETWEEN 2015-01-01  AND  Date(current_date) ';

          } else {
            campaignMacro += '  YEAR(t.transaction_date) = YEAR(current_date)';
          }
          if (additionalData) {
            campaignMacro += ' and ' + additionalData
          }
        }
        excuteQuery.queryForAll(campaignMacro, [campaignMacro], function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {

            callback(null, rows);
          }
        });
      },
      getCampaignP2PDonations: function(callback) {
        campaignMacro = sqlQueryMap["p2pAmountRaised"] + ' c.team_campaign="yes"';
        if (campaignmacro.date) {
          if (campaignmacro.date == 'customdate') {
            if (obj.customDateObj) {
              campaignMacro += ' AND  DATE(tb.transaction_date) BETWEEN ' + "'" + obj.customDateObj.start_date + "'" + ' AND ' + "'" + obj.customDateObj.end_date + "'";
            }
          } else if (campaignmacro.date === 'livetodate') {
            campaignMacro += ' and DATE(tb.transaction_date) BETWEEN 2015-01-01  AND Date(current_date) ';

          } else {
            campaignMacro += '  and  YEAR(tb.transaction_date) = YEAR(current_date)';
          }
          if (additionalData) {
            campaignMacro += ' and ' + additionalData
          }
        }
        excuteQuery.queryForAll(campaignMacro, [campaignMacro], function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {

            callback(null, rows);
          }
        });
      },
      getCampaignDonors: function(callback) {
        campaignMacro = sqlQueryMap["totalnoofDonors"];
        if (campaignmacro.date) {
          if (campaignmacro.date == 'customdate') {
            if (obj.customDateObj) {
              campaignMacro += '  DATE(tb.transaction_date) BETWEEN ' + "'" + obj.customDateObj.start_date + "'" + ' AND ' + "'" + obj.customDateObj.end_date + "'";
            }
          } else if (campaignmacro.date === 'livetodate') {
            campaignMacro += '  DATE(tb.transaction_date) BETWEEN 2015-01-01  AND Date(current_date) ';

          } else {
            campaignMacro += '  YEAR(tb.transaction_date) = YEAR(current_date)';
          }
          if (additionalData) {
            campaignMacro += ' and ' + additionalData
          }
        }
        excuteQuery.queryForAll(campaignMacro, [campaignMacro], function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {

            callback(null, rows);
          }
        });
      },
      getMereCompletedCampaigns: function(callback) {
        campaignMacro = sqlQueryMap["getMereCompletedCampaigns"] + "  c.status = 'published' and (((select TRUNCATE((coalesce(sum(tb.amount), 0) / c.goal) * 100, 2)) >= 80 and TIMESTAMPDIFF(day, now(), c.end_date) > 0) or(TIMESTAMPDIFF(day, now(), c.end_date) <= 15 and TIMESTAMPDIFF(day, now(), c.end_date) > 0))";
        if (campaignmacro.date) {
          if (campaignmacro.date == 'customdate') {
            if (obj.customDateObj) {
              campaignMacro += ' and  DATE(tb.transaction_date) BETWEEN ' + "'" + obj.customDateObj.start_date + "'" + ' AND ' + "'" + obj.customDateObj.end_date + "'";
            }
          } else if (campaignmacro.date === 'livetodate') {
            campaignMacro += ' and  DATE(tb.transaction_date) BETWEEN 2015-01-01  AND  Date(current_date) ';

          } else {
            campaignMacro += ' and   YEAR(tb.transaction_date) = YEAR(current_date)';
          }
          if (additionalData) {
            campaignMacro += ' and ' + additionalData
          }
        }
        console.log(campaignMacro);
        excuteQuery.queryForAll(campaignMacro, [campaignMacro], function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {
            console.log(rows);
            callback(null, rows);
          }
        });
      },
      //including all the users
      getAllCampaignDonors: function(callback) {
        campaignMacro = sqlQueryMap["completeDonors"]
        if (campaignmacro.date) {
          if (campaignmacro.date == 'customdate') {
            if (obj.customDateObj) {
              campaignMacro += ' DATE(tb.transaction_date) BETWEEN ' + "'" + obj.customDateObj.start_date + "'" + ' AND ' + "'" + obj.customDateObj.end_date + "'";
            }
          } else if (campaignmacro.date === 'livetodate') {
            campaignMacro += '  DATE(tb.transaction_date) BETWEEN 2015-01-01  AND  Date(current_date) ';

          } else {
            campaignMacro += '  YEAR(tb.transaction_date) = YEAR(current_date)';
          }
          if (additionalData) {
            campaignMacro += ' and ' + additionalData
          }
        }
        console.log(campaignMacro);
        excuteQuery.queryForAll(campaignMacro, [campaignMacro], function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {
            console.log(rows);
            callback(null, rows);
          }
        });
      },
      getCampaignP2pDonors: function(callback) {
        campaignMacro = sqlQueryMap["totalP2pDonors"] + '  c.team_campaign="yes"';
        if (campaignmacro.date) {
          if (campaignmacro.date == 'customdate') {
            if (obj.customDateObj) {
              campaignMacro += ' and  DATE(tb.transaction_date) BETWEEN ' + "'" + obj.customDateObj.start_date + "'" + ' AND ' + "'" + obj.customDateObj.end_date + "'";
            }
          } else if (campaignmacro.date === 'livetodate') {
            campaignMacro += ' and DATE(tb.transaction_date) BETWEEN 2015-01-01  AND Date(current_date) ';

          } else {
            campaignMacro += ' and  YEAR(tb.transaction_date) = YEAR(current_date)';
          }
          if (additionalData) {
            campaignMacro += ' and ' + additionalData
          }
        }
        excuteQuery.queryForAll(campaignMacro, [campaignMacro], function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {

            callback(null, rows);
          }
        });
      },
      getCampaignAdmins: function(callback) {
        campaignMacro = sqlQueryMap["noofadmins"]
        if (campaignmacro.date) {
          if (campaignmacro.date == 'customdate') {
            if (obj.customDateObj) {
              campaignMacro += ' DATE(cat.date_created) BETWEEN ' + "'" + obj.customDateObj.start_date + "'" + ' AND ' + "'" + obj.customDateObj.end_date + "'";
            }
          } else if (campaignmacro.date === 'livetodate') {
            campaignMacro += '  DATE(cat.date_created) BETWEEN 2015-01-01  AND  Date(current_date) ';

          } else {
            campaignMacro += '  YEAR(cat.date_created) = YEAR(current_date)';
          }
          if (additionalData) {
            campaignMacro += ' and ' + additionalData
          }
        }
        console.log(campaignMacro);
        excuteQuery.queryForAll(campaignMacro, [campaignMacro], function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {
            console.log(rows);
            callback(null, rows);
          }
        });
      },
      getCampaignGroups: function(callback) {
        campaignMacro = sqlQueryMap["noofgroups"]
        if (campaignmacro.date) {
          if (campaignmacro.date == 'customdate') {
            if (obj.customDateObj) {
              campaignMacro += ' DATE(cat.date_created) BETWEEN ' + "'" + obj.customDateObj.start_date + "'" + ' AND ' + "'" + obj.customDateObj.end_date + "'";
            }
          } else if (campaignmacro.date === 'livetodate') {
            campaignMacro += '  DATE(cat.date_created) BETWEEN 2015-01-01  AND  Date(current_date) ';

          } else {
            campaignMacro += '  YEAR(cat.date_created) = YEAR(current_date)';
          }
          if (additionalData) {
            campaignMacro += ' and ' + additionalData
          }
        }
        console.log(campaignMacro);
        excuteQuery.queryForAll(campaignMacro, [campaignMacro], function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {
            console.log(rows);
            callback(null, rows);
          }
        });
      },
      getCampaignCurrency: function(callback) {
        if (campaignmacro.country) {
          excuteQuery.queryForAll(sqlQueryMap["getCurrencySymbol"], [campaignmacro.country], function(err, rows) {
            callback(null, rows);
          })
        } else {
          callback(null, null)
        }
      }

    },
    function(err, result) {
      if (err) {
        console.log(err);
        utility.appErrorHandler(err, null)
      } else {
        var obj = {}
        obj.donation = result.getCampaignRaised[0].donationamount;
        obj.goal = result.getCampaignGoal[0].goal;
        obj.live = result.getCampaignGoal[0].live;
        obj.draft = result.getCampaignGoal[0].draft;
        obj.p2pDonation = result.getCampaignP2PDonations[0].p2pdonationamount;
        obj.noofdonors = result.getCampaignDonors.length;
        obj.noofp2pdonors = result.getCampaignP2pDonors.length;
        obj.completedcampaigns = result.getMereCompletedCampaigns[0].completedcampaigns;
        obj.getAllCampaignDonors = result.getAllCampaignDonors.length;
        obj.noofgroups = result.getCampaignGroups[0].noofgroups;
        obj.noofadmins = result.getCampaignAdmins[0].noofadmins;
        if (result.getCampaignCurrency && result.getCampaignCurrency.length) {
          obj.getCurrencySymbol = result.getCampaignCurrency[0].currency_symbol;
        } else {
          obj.getCurrencySymbol = '$';
        }
        callback(null, obj);

      }
    })
}
exports.getAttendees = function(codeData, callback) {
  excuteQuery.queryForAll(sqlQueryMap["getAttendees"], [codeData.eventId, "attendee"], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
}
exports.getVolunteers = function(codeData, callback) {
  excuteQuery.queryForAll(sqlQueryMap["getVolunteers"], [codeData.eventId, "volunteer"], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
}

exports.deleteTicketData = function(codeEvent, callback) {
  var value;
  if (codeEvent.type == "tickets") value = 'deleteParticularTicket'
  else value = "deleteParticularAttendee"
  var query = excuteQuery.queryForAll(sqlQueryMap[value], [codeEvent.id], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
}
exports.deleteCategory = function(categoryId, callback) {

  var query = excuteQuery.queryForAll(sqlQueryMap['codeCategoryDelete'], [categoryId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};


exports.campaignCreation = function(codeObject, callback) {
  var me = this;
  console.log("success campaign for us fgfdgfdgfd");
  console.log(codeObject);
  if (!codeObject.team_campaign) {
    codeObject.team_campaign = 'no';
  }
  codeObject.show_in_search = 1;
  excuteQuery.insertAndReturnKey(sqlQueryMap['codeInsert'], [codeObject.parent_code_id, codeObject.charity_id, codeObject.category_id, codeObject.user_id, codeObject.date_created, codeObject.date_deleted, codeObject.code_text, codeObject.type, codeObject.start_date, codeObject.end_date, codeObject.suggested_donation, codeObject.title, codeObject.description, codeObject.goal, codeObject.goal_notified, codeObject.match_amount, codeObject.match_name, codeObject.city, codeObject.state, codeObject.beneficiary, codeObject.country, codeObject.campaign_zip, codeObject.address_2, codeObject.address_1, codeObject.code_picture_url, codeObject.code_slug, codeObject.charity_default, codeObject.short_name, codeObject.code_video_url, codeObject.status, codeObject.last_modified_date, codeObject.thank_message, codeObject.fundraise, codeObject.individual, codeObject.parent_id, codeObject.team_campaign, codeObject.parent_user_id, codeObject.payment_gateway_id, codeObject.show_in_search, codeObject.progress_notifications, codeObject.can_mailing_required, codeObject.group_admin, codeObject.last_change_user, codeObject.donation_alert_required, codeObject.p2p_approval_required, codeObject.p2p_offlinedonation_deny, codeObject.donotallow_p2p_campaigns, codeObject.published_date, codeObject.team_approve, codeObject.team_offline_deny, codeObject.donotallow_team_campaigns, codeObject.app_fee], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      codeObject.id = rows;
      callback(null, codeObject);
    }
  });

}


exports.entityCreation = function(codeObject, callback) {

  var entityObj = {};
  entityObj.entity_type = 'code';
  entityObj.entity_id = codeObject.id;
  entityObj.slug = uslug(codeObject.code_text);

  excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], entityObj, function(err, entityRows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      entityObj.id = entityRows;
      callback(null, entityObj, codeObject.id);
    }
  });
}

exports.elasticCreation = function(entityObj, code_id, callback) {
  var codeObj = {};
  codeObj.originalslug = entityObj.slug;
  codeObj.slug = entityObj.slug;
  codeObj.entity_id = entityObj.id;
  charityService.storeUserNames(codeObj, function(err, data) {});
  //entityObj.id = entityrows;
  agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
  callback(null, entityObj, code_id);
}

exports.createCode = function(codeObject, logsObj, callback) {

  var me = this;
  var original_ip = codeObject.original_ip;
  var original_device = codeObject.original_device;
  var country_code = codeObject.country_code;
  var charity_status;
  var charity_data;

  delete codeObject.country_code;
  delete codeObject.original_ip;
  delete codeObject.original_device;

  if (codeObject.flag) {
    var flag = codeObject.flag;
    delete codeObject['flag'];
  }

  if (codeObject.charity_status) {
    charity_status = codeObject.charity_status;
    delete codeObject.charity_status;
  }

  codeObject.date_created = moment.utc().toDate();
  codeObject.short_name = codeObject.title.slice(0, 18);
  codeObject.goal = new Number(codeObject.goal).toFixed(2);
  codeObject.category_id = parseInt(codeObject.category_id);
  if (!codeObject.suggested_donation) {
    codeObject.suggested_donation = 0;
  }
  var campaignSlug = uslug(codeObject.code_text);
  if (codeObject.end_date === '') {
    codeObject.type = 'ongoing';
    codeObject.start_date = moment.utc().toDate();
    codeObject.end_date = "2099-12-31 23:59:59";
  } else {

    codeObject.type = 'event';
    codeObject.start_date = moment.utc(codeObject.start_date).format('YYYY-MM-DD HH:mm:ss');
    codeObject.end_date = moment.utc(codeObject.end_date).hours(0).minutes(0).add(1, 'days').subtract(1, 'seconds').format('YYYY-MM-DD HH:mm:ss');


  }
  delete codeObject['files'];
  delete codeObject['file'];
  delete codeObject['slug'];
  if (codeObject.state === 'select' || codeObject.state === 'state') {
    codeObject.state = null;
  }
  if (codeObject.country === 'select' || codeObject.state === 'country') {
    codeObject.country = null;
  }

  if (!codeObject.code_picture_url) {
    delete codeObject.code_picture_url;
  }
  codeObject.parent_user_id = codeObject.user_id;

  if (!codeObject.code_video_url) {
    delete codeObject.code_video_url;
  }

  if (!codeObject.status) {
    codeObject.status = 'published';
  }

  codeObject.code_slug = uslug(codeObject.code_text);
  codeObject.published_date = moment.utc().toDate()
  async.waterfall([
    async.apply(me.campaignCreation, codeObject),
    me.entityCreation,
    me.elasticCreation
  ], function(err, result, code_id) {
    if (err) {
      callback(err, null);
    } else {
      console.log("result code object");
      console.log(result);
      codeObject.id = code_id;
      codeObject.codeid = result.entity_id;
      console.log("codeentity", codeObject.entity_id)
      callback(null, codeObject);
      codeObject.original_ip = original_ip
      codeObject.original_device = original_device
      codeObject.country_code = country_code;

      //console.log(codeObject);
      //redisClient.set(result.slug, JSON.stringify({ slug: result.slug, type: 'code', entityid: result.id, id: code_id }));
      console.log("dcfgvhbnjhgcf vbnjhgvbnjhb");
      if ((!codeObject.team_campaign || codeObject.team_campaign === 'no') && (codeObject.individual === 'yes' || codeObject.individual === null)) {
        if (codeObject.status === 'published') {
          console.log("dxcfvgv sbdadbasdhasgdbsadhj")
          me.checkPaymentGateways(codeObject, function(err, codeResult4) {
            if (err) {
              logsObj.error = err;
              logsObj.action = "Got an error while payment gateway for created campaign - code services : 647";
              utility.nodeLogs('ERROR', logsObj);
            } else {
              logsObj.message = "Payment gateway created successfully for a Charity.";
              logsObj.action = "Payment Gateway Created successflly -- code Services : 654";
              utility.nodeLogs('INFO', logsObj);
            }
          });
        }
      } else {
        if (codeObject.charity_id) {
          var commonid = codeObject.charity_id;
          var query = "charityPaymentGateWays";
          excuteQuery.queryForAll(sqlQueryMap[query], [commonid], function(err, gateWaysResult) {
            if (gateWaysResult && gateWaysResult.length > 0) {
              var updateObj = {};
              updateObj.payment_gateway_id = gateWaysResult[0].id;
              updateObj.code_id = codeObject.id;
              updateObj.user_id = codeObject.user_id;

              wepayService.updateCampaignPaymentGateway(updateObj, function(err, updateresult3) {});
            }
          });
        }
      }
      if (codeObject.charity_id) {

        //agenda.now('Check charity has default campaign if not set this', codeObject);
        agenda.now('Check charity has app fee', codeObject);
        //  me.insertAppFeeToCharity(codeObject, function(err, result1) {
        // console.log("success campaign for us");
        // console.log(codeObject);
        //   if (err) {
        //     console.log("error while creating");
        //   } else {
        //     console.log("success");
        //     console.log(result1);
        //   }
        // });
      }

      //Adding drip campaign email
      if (codeObject.status === 'published') {
        console.log('checking insert');
        console.log(codeObject);

        console.log('In codeObject success before going to sending thank you email');
        agenda.now('Send thankyou/email for campaign created successfully and published.', codeObject);
        codeObject.campaign="yes";
        // agenda.now('send promote mail to campaign creator',codeObject);
        // dripCampaign.sendTeamApprovalToCampaignOwner(codeObject,function(err,result){
        //   if(err){
        //     console.log("error occuresd while sending the mail");
        //   }else{
        //     console.log("Mail sent successfully to the campaign owner");
        //   }
        // })
        if (codeObject.charity_id) {

          agenda.now('Check charity has default campaign if not set this', codeObject);
        }
      }
    }
  });
};
exports.insertAppFeeToCharity = function(codeObject, callback) {
  console.log("success campaign for us");
  console.log(codeObject);
  excuteQuery.queryForAll(sqlQueryMap['checkCharityById'], [codeObject.charity_id], function(err, result) {
    if (err) {
      console.log("error while");
    } else {
      console.log("result", result)
      excuteQuery.queryForAll(sqlQueryMap['updateAppFee'], [result[0].app_fee, codeObject.entity_id], function(err, result1) {
        if (err) {
          callback(new Error(err), null);
        } else {
          console.log("updated successflly")
          callback(null, result1);
        }
      });

    }
  });


}

exports.checkPaymentGateways = function(codeObject, callback) {
  var me = this;
  if (codeObject.individual === null) {
    // Charity Fundraiser and We have to update the charity payment_gateway_id
    codeObject.commonid = codeObject.charity_id;
    codeObject.query = "charityPaymentGateWays";
    me.setPaymentGateways(codeObject, callback);
    console.log('in charity payment gateway');
  } else if (codeObject.individual === 'yes') {
    console.log("sdghghjasdhjasd asd hijs")
      //This function works when user want to send money to different wepay account.
    if (codeObject.wepayemail) {
      excuteQuery.queryForAll(sqlQueryMap['checkemail'], [codeObject.wepayemail], function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          if (result[0] && result[0].id) {
            codeObject.user_id = result[0].id;
            codeObject.query = "userPaymentGateWays";
            codeObject.commonid = codeObject.user_id;
            me.setPaymentGateways(codeObject, callback);
          } else {
            var verification_key = uuid.v4() + "-" + uslug(codeObject.fullname);
            excuteQuery.queryForAll(sqlQueryMap['importdata'], [codeObject.fullname, codeObject.wepayemail, verification_key, codeObject.date_created], function(err, result) {
              if (err) {
                callback(err, null);
              } else {
                excuteQuery.queryForAll(sqlQueryMap['newProfiledatainsert'], [result.insertId, codeObject.phone], function(err, result1) {
                  if (err) {
                    callback(err, null);
                  } else {
                    var userEntity = {};
                    userEntity.entity_id = result.insertId;
                    userEntity.entity_type = "user";
                    var count = 1;
                    var usrSlug = uslug(codeObject.fullname);
                    var originlSlug = uslug(codeObject.fullname);
                    console.log(originlSlug);
                    var userDetailsObject = {
                      count: 1,
                      name: codeObject.fullname
                    };
                    charityService.entitySlugCreation(userEntity, usrSlug, userDetailsObject, originlSlug, function(err, userEntityId) {
                      if (err) {
                        callback(err, null);
                      } else {
                        codeObject.user_id = result.insertId;
                        codeObject.query = "userPaymentGateWays";
                        codeObject.commonid = codeObject.user_id;
                        me.setPaymentGateways(codeObject, callback);
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
      //  Fundraiser data
      codeObject.query = "userPaymentGateWays";
      codeObject.commonid = codeObject.user_id;
      this.setPaymentGateways(codeObject, function(err, codeResult4) {});
    }
  }
  //  settingsService.getPaymentGateways(obj, function(err, gateWaysResult) {


}

exports.setPaymentGateways = function(codeObject, callback) {
  console.log("I msnd sdhjsd sjdbhasd asdjasbdubasd asduasd asdjubasudasd basudgas")
  excuteQuery.queryForAll(sqlQueryMap[codeObject.query], [codeObject.commonid], function(err, gateWaysResult) {
    console.log(err);
    if (err) {

      callback(err, null);
      var logsObj = codeObject;
      logsObj.error = err;
      logsObj.stack = err.stack;
      logsObj.action = "Got an error to the existing payment gateways of Charity/user - code services : 681";
      utility.nodeLogs('ERROR', logsObj);

    } else {
      //console.log(gateWaysResult);
      if (gateWaysResult && gateWaysResult.length > 0) {

        var updateObj = {};
        updateObj.payment_gateway_id = gateWaysResult[0].id;
        updateObj.code_id = codeObject.id;
        updateObj.user_id = codeObject.user_id;
        gateWaysResult[0].code_id = codeObject.id;
        gateWaysResult[0].payment_gateway_id = gateWaysResult[0].id;
        console.log("sasdfvhasdg hasgdh asdhsavdhasn dashdasd asdbhasydahsn mwkisduvhb n")
        wepayService.updateCampaignPaymentGateway(updateObj, callback);
      } else {
        // need to call the WePay account creation
        codeObject.code_id = codeObject.id;

      /*  if (codeObject.country_code == 'CA' || codeObject.country_code == 'US') {
          console.log("registired:" + JSON.stringify(codeObject));
          if (codeObject.wepayemail) {
            codeObject.wepayquery = 'FundDetails';
            codeObject.Id = codeObject.user_id;
          } else {
            codeObject.wepayquery = 'CharityDetails';
            codeObject.Id = codeObject.code_id;
          }
          console.log("wepayaccounnbfbdbdfbsdufbsdfbsdbfsudbfyusd")
          wepayService.wepayAccountRegistration(codeObject, callback);
        } else { */
          stripeService.stripeManagedAccountRegistration(codeObject, function(err, payment_gateway_id) {
            if (err) {
              utility.nodeLogs({
                message: 'Error in updating and creating managed stripe account'
              });
            } else {
              var updateObj = {};
              updateObj.payment_gateway_id = payment_gateway_id;
              updateObj.code_id = codeObject.id;
              wepayService.updateCampaignPaymentGateway(updateObj, callback);
            }
          });
      /*  } */
      }
    }
  });
}

exports.createCampaignUserCharityInElasticSearch = function(singleObj, callback) {
  var type = singleObj.entity_type;
  var client = new elasticsearch.Client({
    host: props.elasticServer,
    // log: 'trace'
  });

  if (type === 'user') {
    //callback(null);

    var sqlQuery = "select u.id,u.name, up.about_me as description, up.city, up.background_pic_url, up.address_1, up.address_2, st.name as state, up.profile_pic_url from user_tbl u inner join user_profile_tbl up on up.user_id = u.id left outer join states_tbl st on st.id = up.state where u.id = ?";
    pool.query(sqlQuery, [singleObj.entity_id], function(err, userResult) {
      if (err) {
        callback(err, null);
      } else {
        if (userResult && userResult.length > 0) {
          var object = userResult[0];
          if (object) {
            var userObject = {};

            userObject.entityid = singleObj.id;
            userObject.id = userResult[0].id;
            userObject.state = userResult[0].state;
            userObject.city = userResult[0].city;
            userObject.background_pic = userResult[0].background_pic_url;
            userObject.profilepic = userResult[0].profile_pic_url;
            userObject.username = singleObj.slug;
            userObject.fullname = userResult[0].name;
            userObject.type = 'user';
            userObject.description = userResult[0].description;
            userObject.location = "";

            pool.query('select ct.* from user_category_tbl uc inner join charity_category_tbl ct on ct.group_code = uc.category_id where uc.user_id=? group by uc.category_id', [singleObj.entity_id], function(err, categoryResult) {

              if (categoryResult && categoryResult.length > 0) {
                var categories = underscore.uniq(underscore.pluck(categoryResult, 'group_title'));
                userObject.categories = categories;
              } else {
                userObject.categories = [];
              }

              if (singleObj.update) {
                client.update({
                    index: props.elastic_index,
                    type: 'entity',
                    id: singleObj.id,
                    body: {
                      doc: userObject
                    }
                  },
                  function(err, result4) {
                    if (err) {
                      callback(err, null);
                    } else {
                      callback(null, result4);
                    }

                  });
              } else {
                client.create({
                    index: props.elastic_index,
                    type: 'entity',
                    id: singleObj.id,
                    body: userObject
                  },
                  function(err, result4) {
                    if (err) {
                      callback(err, null);
                    } else {

                      callback(null, result4);
                    }

                  });
              }
            });

          } else {
            callback(null, null);
          }
        } else {
          callback(null, null);
        }
      }
    });

  } else if (type === 'charity') {
    var sqlQuery2 = "select c.id,c.charity_from,c.postal_code,c.ein,c.payment_gateway,o.title as name,o.background_pic_url,code.suggested_donation as suggested_donation,cbt.code_text as code,cbt.id as code_id, o.full_description as description, c.city, c.address_1, c.address_2, st.name as state, o.profile_pic_url,cct.currency_code,cct.currency_symbol from charity_tbl c inner join organization_tbl o on o.id = c.organization_id left outer join states_tbl st on st.id = c.state left outer join code_tbl cbt on cbt.charity_id=? left outer join code_tbl code on code.charity_id=? left outer join countries_currency cct on cct.country_id = c.country where c.id = ?";

    pool.query(sqlQuery2, [singleObj.entity_id, singleObj.entity_id, singleObj.entity_id], function(err, userResult2) {
      if (err) {
        callback(err, null);
      } else {
        if (userResult2 && userResult2.length > 0) {
          var object2 = userResult2[0];
          if (object2) {

            var charityObject = {};

            charityObject.entityid = singleObj.id;
            charityObject.id = userResult2[0].id;
            charityObject.state = userResult2[0].state;
            charityObject.city = userResult2[0].city;
            charityObject.profilepic = userResult2[0].profile_pic_url;
            charityObject.username = singleObj.slug;
            charityObject.fullname = userResult2[0].name;
            charityObject.type = 'charity';
            charityObject.description = userResult2[0].description;
            charityObject.location = "";
            charityObject.background_pic_url = userResult2[0].background_pic_url;
            charityObject.code = userResult2[0].code;
            charityObject.code_id = userResult2[0].code_id;
            charityObject.suggested_donation = userResult2[0].suggested_donation;
            charityObject.currency_symbol = userResult2[0].currency_symbol;
            charityObject.currency_code = userResult2[0].currency_code;
            charityObject.payment_gateway = userResult2[0].payment_gateway;
            if (object2.charity_from === "approved") {
              charityObject.approved = "approved";
            }

            pool.query('select cc.* from charity_category_tbl  cc inner join category_charity_tbl cct on cct.category_id = cc.id where cct.charity_id =? group by cc.group_code', [singleObj.entity_id], function(err, charityCategory) {

              if (charityCategory && charityCategory.length > 0) {
                var categories = underscore.uniq(underscore.pluck(charityCategory, 'group_title'));
                charityObject.categories = categories;
              } else {
                charityObject.categories = [];
              }
              var geocoder = require('geocoder');
              geocoder.geocode(object2.postal_code, function(err, data) {
                if (data && data.results.length > 0) {
                  charityObject.loc = [];
                  charityObject.loc.push(data.results[0].geometry.location.lat);
                  charityObject.loc.push(data.results[0].geometry.location.lng);
                }
                charityObject.ein = object2.ein;


                if (singleObj.update) {

                  client.update({
                      index: props.elastic_index,
                      type: 'entity',
                      id: singleObj.id,
                      body: {
                        doc: charityObject
                      }
                    },
                    function(err, result2) {
                      if (err) {
                        callback(err, null);
                      } else {
                        callback(null, result2);
                      }
                    });

                  client.update({
                      index: props.elastic_index + '_np',
                      type: 'charity_for_fundraiser',
                      id: singleObj.id,
                      body: {
                        doc: charityObject
                      }
                    },
                    function(err, result3) {
                      console.log(err);
                    });

                } else {

                  client.create({
                      index: props.elastic_index,
                      type: 'entity',
                      id: singleObj.id,
                      body: charityObject
                    },
                    function(err, result2) {
                      if (err) {
                        callback(err, null);
                      } else {
                        callback(null, result2);
                      }
                    });

                  client.create({
                      index: props.elastic_index + '_np',
                      type: 'charity_for_fundraiser',
                      id: singleObj.id,
                      body: charityObject
                    },
                    function(err, result3) {
                      console.log(err);
                    });
                }
              });
            });
          } else {
            callback(null, null);
          }
        } else {

          callback(null, null);
        }
      }
    });

  } else if (type === 'team') {
    utility.nodeLogs('INFO', {
      message: 'Comes to team creation to entity ',
      entityObj: singleObj
    });
    excuteQuery.queryForAll(sqlQueryMap['insertTeamInElastic'], [singleObj.entity_id], function(err, teamData) {
      if (err) {
        callback(err, null);
      } else {
        if (teamData && teamData[0]) {
          var Object = teamData[0];
        }
        if (Object) {
          var teamObject = {};
          teamObject.entityid = singleObj.id;
          teamObject.id = Object.id;
          teamObject.username = Object.team_slug;
          teamObject.fullname = Object.team_name;
          teamObject.type = "team";
          teamObject.description = Object.team_description;
          teamObject.wecode = Object.team_slug;
          teamObject.profilepic = Object.team_logo;
          teamObject.creator_name = Object.creator_name;
          if (singleObj.update) {
            client.update({
                index: props.elastic_index,
                type: 'entity',
                id: teamObject.entityid,
                body: {
                  doc: teamObject
                }
              },
              function(err, result3) {
                if (err) {
                  callback(err, null);
                } else {
                  utility.nodeLogs('INFO', 'Updated status of the campaign in elastic search for code  :' + Object.team_name);
                  callback(null, result3);
                }

              });
          } else {

            client.create({
                index: props.elastic_index,
                type: 'entity',
                id: teamObject.entityid,
                body: teamObject
              },
              function(err, result3) {
                if (err) {
                  callback(err, null);
                } else {
                  callback(null, result3);
                  utility.nodeLogs('INFO', {
                    message: 'Created code in elastic search for:' + Object.team_name,
                    teamObject: teamObject
                  });
                }
              });
          }
        } else {
          callback(null)
        }
      }
    });
  } else if (type === 'code') {
    //  var sqlQuery3 = "select ot.title as charity_name,c.id,c.code_text as wecode,c.end_date,c.status,c.title as name,cht.id as charity_id,cht.payment_gateway, c.description, c.city, c.address_1, c.address_2, st.name as state, c.code_picture_url,c.suggested_donation,c.goal,cct.currency_symbol,cct.currency_code from code_tbl c left outer join states_tbl st on st.id = c.state left outer join charity_tbl cht on cht.id=c.charity_id inner join organization_tbl ot on ot.id= cht.organization_id left outer join countries_currency cct on cct.country_id = cht.country where c.id = ?";
    //  pool.query(sqlQuery3, [singleObj.entity_id], function(err, userResult3) {
    utility.nodeLogs('INFO', {
      message: 'Comes to code creation to entity ',
      entityObj: singleObj
    });
    excuteQuery.queryForAll(sqlQueryMap['charityCodeJob'], [singleObj.entity_id], function(err, userResult3) {
      if (err) {
        callback(err, null);
      } else {
        if (userResult3 && userResult3.length > 0) {
          var object3 = userResult3[0];
          if (object3) {
            var codeObject = {};
            codeObject.entityid = singleObj.id;
            codeObject.id = userResult3[0].id;
            codeObject.state = userResult3[0].state;
            codeObject.city = userResult3[0].city;
            codeObject.profilepic = userResult3[0].code_picture_url;
            codeObject.username = singleObj.slug;
            codeObject.fullname = userResult3[0].name;
            codeObject.type = 'code';
            codeObject.description = userResult3[0].description;
            codeObject.location = "";
            codeObject.categories = [];
            codeObject.charity_name = userResult3[0].charity_name;
            codeObject.charity_id = userResult3[0].charity_id;
            codeObject.wecode = userResult3[0].wecode;
            codeObject.suggested_donation = userResult3[0].suggested_donation;
            codeObject.goal = userResult3[0].goal;
            codeObject.status = userResult3[0].status;
            codeObject.currency_symbol = userResult3[0].currency_symbol;
            codeObject.currency_code = userResult3[0].currency_code;
            codeObject.payment_gateway = userResult3[0].payment_gateway;
            codeObject.end_date = userResult3[0].end_date;
            codeObject.team_campaign = userResult3[0].team_campaign;
            if (codeObject.team_campaign === 'yes') {
              codeObject.campaign_creator = userResult3[0].user_name;
            } else {
              codeObject.campaign_creator = userResult3[0].charity_name
            }

            if (singleObj.update) {
              client.update({
                  index: props.elastic_index,
                  type: 'entity',
                  id: singleObj.id,
                  body: {
                    doc: codeObject
                  }
                },
                function(err, result3) {
                  if (err) {
                    callback(err, null);
                  } else {
                    utility.nodeLogs('INFO', 'Updated status of the campaign in elastic search for code  :' + codeObject.fullname);
                    callback(null, result3);
                  }

                });
            } else {

              client.create({
                  index: props.elastic_index,
                  type: 'entity',
                  id: singleObj.id,
                  body: codeObject
                },
                function(err, result3) {
                  if (err) {
                    callback(err, null);
                  } else {
                    callback(null, result3);
                    utility.nodeLogs('INFO', {
                      message: 'Created code in elastic search for:' + codeObject.fullname,
                      codeObject: codeObject
                    });
                  }
                });
            }
          } else {
            callback(null);
          }
        } else {

          excuteQuery.queryForAll(sqlQueryMap['fundraiserCodeJob'], [singleObj.entity_id], function(err, codeData) {
            //    pool.query('select * from code_tbl where id=?', [singleObj.entity_id], function(err, codeData) {
            if (err) {
              callback(err, null);
            } else {
              if (codeData && codeData.length > 0) {
                var codeObject = {};
                codeObject.entityid = singleObj.id;
                codeObject.id = singleObj.entity_id;
                //codeObject.state = userResult3[0].state;
                //codeObject.city = userResult3[0].city;
                codeObject.profilepic = codeData[0].code_picture_url;
                codeObject.username = singleObj.slug;
                codeObject.fullname = codeData[0].title;
                codeObject.type = 'code';
                codeObject.description = codeData[0].description;
                codeObject.location = "";
                codeObject.categories = [];
                //codeObject.charity_name = userResult3[0].charity_name;
                //codeObject.charity_id = userResult3[0].charity_id;
                codeObject.wecode = codeData[0].code_text;
                codeObject.suggested_donation = codeData[0].suggested_donation;
                codeObject.goal = codeData[0].goal;
                codeObject.status = codeData[0].status;
                codeObject.fundraiser = "fundraiser";
                codeObject.team_campaign = codeData[0].team_campaign;
                codeObject.campaign_creator = codeData[0].creator_name;
                if (codeData[0] && codeData[0].parent_user_id) {
                  var fuserid = codeData[0].parent_user_id;
                } else {
                  var fuserid = codeData[0].user_id;
                }
                codeObject.fundraiser_userid = fuserid; //codeData[0].user_id;
                codeObject.end_date = codeData[0].end_date;

                var sqlQuery4 = "SELECT cc.*,upt.* from user_profile_tbl up inner join countries_currency cc on cc.country_id=up.country inner join user_tbl u on u.id=up.user_id left outer join user_payment_tbl upt on upt.user_id=up.user_id where up.user_id=?";
                pool.query(sqlQuery4, [fuserid], function(err, userResult4) {
                  if (err) {
                    callback(err, null);
                  } else {
                    if (userResult4 && userResult4.length > 0) {
                      if (userResult4[0].payment_gateway) {
                        codeObject.payment_gateway = userResult4[0].payment_gateway;
                      }
                      codeObject.currency_symbol = userResult4[0].currency_symbol;
                      codeObject.currency_code = userResult4[0].currency_code;
                      //codeObject.state = userResult3[0].state;
                      //codeObject.city = userResult3[0].city;
                    }
                    if (singleObj.update) {
                      client.update({
                          index: props.elastic_index,
                          type: 'entity',
                          id: singleObj.id,
                          body: {
                            doc: codeObject
                          }
                        },
                        function(err, result3) {
                          if (err) {
                            callback(err, null);
                          } else {
                            callback(null, result3);
                          }
                        });
                    } else {
                      client.create({
                          index: props.elastic_index,
                          type: 'entity',
                          id: singleObj.id,
                          body: codeObject
                        },
                        function(err, result3) {
                          if (err) {
                            callback(err, null);
                          } else {
                            callback(null, result3);
                          }
                        });
                    }
                  }
                });
              } else {
                callback(null, null);
              }
            }
          })
        }
      }
    });
  } else {
    callback(null, null);
  }
};

exports.getCodesByCharity = function(charityId, callback) {

  var query = excuteQuery.queryForAll(sqlQueryMap['codesOfCharity'], [charityId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.getCodeUrlsByCode = function(codeId, callback) {

  var query = excuteQuery.queryForAll(sqlQueryMap['codeUrls'], [codeId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.searchByText = function(term, callback) {

  excuteQuery.queryForAll(sqlQueryMap['wecodesuggestions'], [term], function(err, rows) {
    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
};
exports.searchByHashTag = function(term, callback) {

  excuteQuery.queryForAll(sqlQueryMap['hashcodesuggestions'], [term], function(err, rows) {
    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
};



exports.getCarityCodes = function(charityId, eventType, callback) {
  var typeevent = [];
  var parentCampaigns = []

  if (eventType == "all") {
    typeevent.push(charityId);
    typeevent.push('ongoing');
    typeevent.push('event');
  } else {
    typeevent.push(charityId);
    typeevent.push(eventType);
    typeevent.push(eventType);
  }


  excuteQuery.queryForAll(sqlQueryMap['charityCodesWithDonations'], typeevent, function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (result && result.length) {
        async.each(result, function(teamData, eachCallback) {
          if (teamData.team_id && teamData.team_campaign == "no") {
            excuteQuery.queryForAll(sqlQueryMap['getParentCampDetails'], [teamData.team_id], function(err, result) {
              if (result && result.length) {
                teamData.teamParentOfflineDeny = result[0].team_offline_deny;
                parentCampaigns.push(teamData);
                eachCallback(null)

              } else {
                eachCallback(null)
              }
            })
          } else {
            parentCampaigns.push(teamData);
            eachCallback(null)
          }
        }, function(err) {
          callback(err, parentCampaigns);
        });
      } else {
        callback(null, result);
      }
    }
  });
};
exports.charityCodeData = function(codeId, callback) {

  excuteQuery.queryForAll(sqlQueryMap['charityCodeData'], [codeId], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (rows && rows.length > 0) {

        callback(null, rows);
      } else {
        excuteQuery.queryForAll(sqlQueryMap['userCodeData'], [codeId], function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(null, rows);
          }
        });
      }

    }
  });
};

exports.onboardingCompletionEmail = function(codeObject, callback) {
  var codeTitle = codeObject.title;
  excuteQuery.queryForAll(sqlQueryMap['getCharityAdminEmail'], [codeObject.user_id], function(err, emailResult) {
    if (err) {
      utility.log('error');
      callback(err);
    } else {
      //Added Mandril Template
      if (emailResult[0] && emailResult[0].email) {
        var adminEmail = emailResult[0].email;
      } else {
        var adminEmail = '';
      }
      var finalobjectmandril = {};
      finalobjectmandril.from = props.fromemail;
      finalobjectmandril.email = adminEmail;
      finalobjectmandril.text = "Hai/Hello";
      finalobjectmandril.subject = "Share your new profile with these copy and paste templates!";

      finalobjectmandril.template_name = "Welcome email with social media and invite text";
      finalobjectmandril.template_content = [{
        "name": "name",
        "content": "*|FULLNAME|*"
      }];

      finalobjectmandril.merge_vars = [{
        "name": "FULLNAME",
        "content": codeTitle
      }];

      utility.mandrillTemplate(finalobjectmandril, function(err, data) {
        if (err) {
          utility.log('error');
          callback(err);
        } else {

          callback(null, "mail send successfully");
        }
      });
    }
  });

}

exports.updateCharityCode = function(codeObject, codeId, logsObj, callback) {
  var logsObj = {}
  var me = this;
  var completeFlag = "";
  // if (codeObject.category) {
  //   var category = codeObject.category;
  //   delete codeObject['category'];
  // }
  console.log("before utc");
  console.log(codeObject);
  if (codeObject.flag) {
    var flag = codeObject.flag;
    completeFlag = codeObject.flag;
    delete codeObject['flag'];
  }
  delete codeObject['files'];
  delete codeObject['file'];
  delete codeObject['slug'];


  if (!codeObject.code_picture_url) {
    delete codeObject.code_picture_url;
  }

  if (!codeObject.code_video_url) {
    delete codeObject.code_video_url;
  }

  codeObject.user_id = codeObject.user_id;
  codeObject.short_name = codeObject.title.slice(0, 18);
  if (codeObject.end_date === '') {
    codeObject.type = 'ongoing';
    codeObject.start_date = moment.utc().toDate();
    codeObject.end_date = "2099-12-31 23:59:59";
  } else {
    //var str=codeObject.end_date + "23:59:59";
    codeObject.type = 'event';
    codeObject.start_date = moment.utc(codeObject.end_date).format('YYYY-MM-DD HH:mm:ss');
    codeObject.end_date = moment.utc(codeObject.end_date).hours(0).minutes(0).add(1, 'days').subtract(1, 'seconds').format('YYYY-MM-DD HH:mm:ss');

    //codeObject.end_date = moment.utc(codeObject.end_date).format('YYYY-MM-DD HH:mm:ss');
    console.log(codeObject.end_date);
  }
  console.log("in services");
  console.log(codeObject);
  if (codeObject.state === 'select' || codeObject.state === 'state') {
    codeObject.state = null;
  }
  if (codeObject.country === 'select' || codeObject.state === 'country') {
    codeObject.country = null;
  }
  codeObject.code_slug = uslug(codeObject.code_text);
  codeObject.slug = uslug(codeObject.code_text);
  //codeObject.type ='update';
  codeObject.last_modified_date = moment.utc().toDate();

  charityService.validateEntitySlug(codeObject, function(result) {
    if (result.data) {

      async.parallel({

          codeUpdate: function(callback) {
            excuteQuery.update(sqlQueryMap['updateCharityCodeData'], [codeObject.code_text, codeObject.end_date, codeObject.suggested_donation, codeObject.title, codeObject.code_picture_url, codeObject.code_video_url, codeObject.description, codeObject.type, codeObject.goal, codeObject.match_amount, codeObject.match_name, codeObject.category, codeObject.city, codeObject.state, codeObject.campaign_zip, codeObject.address_1, codeObject.address_2, codeObject.short_name, codeObject.country, codeObject.thank_message, codeObject.beneficiary, codeObject.category_id, codeObject.last_change_user, codeObject.last_modified_date, codeObject.can_mailing_required, codeObject.p2p_approval_required, codeObject.donation_alert_required, codeObject.p2p_offlinedonation_deny, codeId], callback);
          },
          entityUpdate: function(callback) {
            if (codeObject.slug) {
              excuteQuery.update(sqlQueryMap['updateEntitySlug'], [codeObject.slug, codeId, 'code'], callback);
            } else {
              callback(null, null);
            }
          },
        },
        function(err, results) {
          if (err) {
            callback(new Error(err), null);

          } else {
            callback(null, codeObject);

            if (completeFlag) {
              agenda.now('onboardingCompletionEmail', codeObject);
            }
            // if (codeObject && codeObject.code_picture_url) {
            me.updateTeamUpdate(codeId, codeObject, function(err, teamUpdateRes) {});
            me.updateTeamFundraisers(codeId, codeObject.end_date, codeObject.type, function(err, teamFundUpdate) {})
              //}
            excuteQuery.queryForAll(sqlQueryMap['getEntity'], [codeId, 'code'], function(err, rows) {
              if (err) {
                callback(new Error(err), null);

              } else {

                var entityObj = {};
                entityObj.entity_id = codeId;
                entityObj.entity_type = 'code';
                entityObj.id = rows[0].id;
                entityObj.slug = rows[0].slug;
                entityObj.update = 'update';

                if (codeObject.slug != codeObject.originalslug) {
                  codeObject.entity_id = rows[0].id;
                  charityService.storeUserNames(codeObject, function(err, result3) {});
                }

                logsObj.action = "Campaign Update Initiated to agenda job to update in elastcsearch -- code Router : 359";
                utility.nodeLogs('INFO', logsObj);

                agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
                //agenda.now('send campaign/update email', codeObject);
              }
            });
          }
        });
    } else {
      logsObj.error = err;
      logsObj.action = "Got Wecode alreay in use error  while update a campaign-- codeService : 1325";
      utility.nodeLogs('ERROR', logsObj);

      callback({
        error: 'WeCode already in use, choose different one'
      }, null);
    }
  });
};

exports.updateTeamUpdate = function(codeId, codeObj, callback) {
  // pool.query('update code_tbl set code_picture_url = ?,p2p_offlinedonation_deny = ?,end_date=? where id in (select team_code_id from team_campaigns_tbl where original_code_id=?)', [codeObj.code_picture_url, codeObj.p2p_offlinedonation_deny, codeObj.end_date, codeId], callback);
  excuteQuery.queryForAll('update code_tbl set end_date= ?,p2p_offlinedonation_deny = ?,type=? where id in(select team_code_id from team_campaigns_tbl where original_code_id=?)', [codeObj.end_date, codeObj.p2p_offlinedonation_deny, codeObj.type, codeId], function(err, result) {
    if (err) {
      console.log("in error");
    } else {
      console.log("p2p details updated successfully");
    }
  })
}
exports.updateTeamFundraisers = function(codeId, end_date, type, callback) {
  var codeIds = [];
  excuteQuery.queryForAll(sqlQueryMap['getTeamIds'], codeId, function(err, teamsData) {
    if (err) {
      utility.nodeLogs('ERROR', 'error while getting the teams')
      callback(err, null)
    } else {
      if (teamsData && teamsData[0]) {
        codeIds = underscore.pluck(teamsData, 'id');
        excuteQuery.queryForAll(sqlQueryMap['updatingTeamFundraisersDate'], [end_date, type, codeIds], function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', 'Error occured while updating teams')
            callback(err, null)
          } else {
            utility.nodeLogs('INFO', 'updating the date for team fundraisers')
            callback(null, null);
          }
        })
      }
    }
  })
}
exports.validationCampaignCode = function(campaignObj, callback) {
  var code_text = uslug(campaignObj.code_text);
  excuteQuery.queryForAll(sqlQueryMap['vaidateCampaignCode'], [code_text], function(err, campaignResult) {
    if (err) {
      callback(new Error(err), null);
    } else {
      // create code validation condition
      if (campaignObj.typeOfMode == 'create') {
        if (campaignResult && campaignResult.length > 0) {
          callback(null, {
            msg: 'exists'
          });
        } else {
          callback(null, {
            msg: 'success'
          });
        }
      } else {
        // Update Code validation condition
        if (campaignResult && campaignResult.length > 0) {
          if (code_text == uslug(campaignObj.orgiginal)) {
            callback(null, {
              msg: 'success'
            });
          } else {
            callback(null, {
              msg: 'exists'
            });
          }
        } else {
          callback(null, {
            msg: 'success'
          });
        }
      }
    }
  });
};
exports.getcampaignUnique = function(code_id, user_id, callback) {

  excuteQuery.queryForAll(sqlQueryMap['codeWithDonations'], [user_id, code_id], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (rows && rows.length > 0 && rows[0].charity_id) {
        callback(null, rows);
      } else {
        excuteQuery.queryForAll(sqlQueryMap['codeWithDonationsFund'], [user_id, code_id], function(err, rows1) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(null, rows1);
          }
        });
      }

    }
  });
}
exports.getCharityDefaultcampaign = function(charity_id, callback) { // campaigns shown for campaigns page in organization dashboard

  excuteQuery.queryForAll(sqlQueryMap['charityCodeWithDonationsUniq'], [parseInt(charity_id)], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });

}

exports.getCharityDonationCampaigns = function(charity_id, callback) {

  excuteQuery.queryForAll(sqlQueryMap['charityDonateCampaigns'], [parseInt(charity_id)], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
}
exports.validateEntitySlug = function(slugObject, callback) {

  excuteQuery.queryForAll(sqlQueryMap['validateEntitySlug'], [slugObject.slug], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (rows && rows.length > 0) {
        callback(null, false);
      } else {
        callback(null, true);
      }
    }
  });
}
exports.updateCodeStatus = function(codeId, callback) {
  var me = this;
  var show_in_search = 1;
  var status = "published";
  var published_date = moment.utc().toDate();
  excuteQuery.update(sqlQueryMap['codeStatusUpdate'], [show_in_search, published_date, parseInt(codeId)], function(err, updateResult) {
    if (err) {
      callback(err, null);
    } else {
      // callback(null, updateResult);
      agenda.now('send mails to team captain and members when main campaign is in publish', {
        codeid: codeId
      });
      // teamService.sendMailsTeamCaptainAndMembersPublish(codeId, function(err, result) {
      //   if (err) {
      //     console.log("error");
      //   }
      //     else{
      //       console.log("sucess published");
      //     }
      //   });
      agenda.now('send mails to team owners', { codeid: codeId, status: status });
      excuteQuery.queryForAll(sqlQueryMap['getEntity'], [codeId, 'code'], function(err, rows) {
        var entityObj = {};
        entityObj.entity_id = codeId;
        entityObj.entity_type = 'code';
        entityObj.id = rows[0].id;
        entityObj.slug = rows[0].slug;
        entityObj.update = 'update';
        agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
      });
      me.getAllSubCampaigns(codeId, function(err, codeArrays) {
        if (err) {
          utility.nodeLogs('ERROR', 'error while gettig codeids')
          callback(err, null)
        } else {
          if (codeArrays && codeArrays.length) {
            excuteQuery.queryForAll(sqlQueryMap['updateAllSubCampaignPublish'], [codeArrays], function(err, result) {
              if (err) {
                callback(err, null)
              } else {
                utility.nodeLogs('INFO', 'Updated publish status to all campaigns')
                callback(null, updateResult);
                //updating in elastic search
                if (codeArrays && codeArrays.length) {
                  async.each(codeArrays, function(singleObj, eachCallback) {
                    console.log(singleObj);
                    excuteQuery.queryForAll(sqlQueryMap['getEntity'], [singleObj, 'code'], function(err, rows) {
                      if (err) {
                        eachCallback(err, null)
                      } else {
                        eachCallback(null)
                        var entityObj = {};
                        entityObj.entity_id = singleObj;
                        entityObj.entity_type = 'code';
                        entityObj.id = rows[0].id;
                        entityObj.slug = rows[0].slug;
                        entityObj.update = 'update';
                        agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
                        // me.createCampaignUserCharityInElasticSearch(entityObj,function(err,result){
                        //   if(err){
                        //     console.log("elsstc error");
                        //   }else{
                        //     console.log("elastic sucess");
                        //   }
                        // });
                      }
                    });
                  }, function(err) {
                    if (err) {
                      utility.nodeLogs('ERROR', 'error while updated in elastic')
                      callback(err, null)
                    } else {
                      utility.nodeLogs('INFO', 'updated successflly in elastic')
                    }
                  });
                } else {
                  utility.nodeLogs('INFO', 'no sub campaigns found')
                }
              }
            });
          } else {
            callback(null, updateResult)
          }

        }
      });
      /** This code is for setting the campaign status based on
       */
      me.getAllTeamsForACampaign(codeId, status, function(err, result) {
        if (err) {
          utility.nodeLogs('ERROR', 'error occured while updating the team status');
        } else {
          utility.nodeLogs('INFO', 'Teams status updated successflly');
        }
      });
    }
  });
}
exports.addCustomField = function(codeDta, callback) {
  excuteQuery.insertAndReturnKey(sqlQueryMap['insertCustomData'], [codeDta], function(err, data) {
    if (err) {} else {
      var obj = {};
      obj.data = data;
      obj.value = codeDta;
      callback(null, obj);
    }
  });
}

exports.updateCodeUnpublishedStatus = function(codeId, flag, callback) {
    var me = this;
    var show_in_search = 0;
    var status = "draft";
    excuteQuery.update(sqlQueryMap['codeStatusUnpublishedUpdate'], [show_in_search, parseInt(codeId)], function(err, updateResult) {
      if (err) {
        callback(new Error(err), null);
      } else {
        excuteQuery.queryForAll(sqlQueryMap['getEntity'], [codeId, 'code'], function(err, rows) {
          var entityObj = {};
          entityObj.entity_id = codeId;
          entityObj.entity_type = 'code';
          entityObj.id = rows[0].id;
          entityObj.slug = rows[0].slug;
          entityObj.update = 'update';
          agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
          agenda.now('sendmails to p2p admins', {
            codeid: codeId
          });
          agenda.now('send mails to team captain and members', {
            codeid: codeId
          });
          agenda.now('send mails to team owners', { codeid: codeId, status: status });
          callback(null, updateResult);
          if (flag && flag == "yes") {
            me.getAllSubCampaigns(codeId, function(err, codeArrays) {
              if (err) {
                utility.nodeLogs('ERROR', 'error while gettig codeids')
                callback(err, null)
              } else {
                if (codeArrays && codeArrays.length) {
                  excuteQuery.queryForAll(sqlQueryMap['updateAllSubCampaign'], [codeArrays], function(err, result) {
                    if (err) {
                      callback(err, null)
                    } else {
                      utility.nodeLogs('INFO', 'Updated draft status to all campaigns')
                      async.each(codeArrays, function(singleObj, eachCallback) {
                        console.log(singleObj);
                        excuteQuery.queryForAll(sqlQueryMap['getEntity'], [singleObj, 'code'], function(err, rows) {
                          if (err) {
                            eachCallback(err, null);
                          } else {
                            eachCallback(null);
                            var entityObj = {};
                            entityObj.entity_id = singleObj;
                            entityObj.entity_type = 'code';
                            entityObj.id = rows[0].id;
                            entityObj.slug = rows[0].slug;
                            entityObj.update = 'update';
                            agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
                          }
                        });
                      }, function(err) {
                        if (err) {
                          utility.nodeLogs('ERROR', 'error while updated in elastic');
                          callback(err, null);
                        } else {
                          utility.nodeLogs('INFO', 'updated successflly in elastic');
                        }
                      });
                    }
                  });
                } else {
                  utility.nodeLogs('INFO', "No details found")
                    //callback(null, updateResult);
                }
              }
            });
            /** This code is for setting the campaign status based on
             */
            me.getAllTeamsForACampaign(codeId, status, function(err, result) {
              if (err) {
                utility.nodeLogs('ERROR', 'error occured while updating the team status');
              } else {
                utility.nodeLogs('INFO', 'Teams status updated successflly');
              }
            });
          }
        });
      }
    });
  }
  /**
   *Get all teams for particular campaign
   */
exports.getAllTeamsForACampaign = function(codeId, status, callback) {
  var teamsArray = [];
  excuteQuery.queryForAll(sqlQueryMap['gettingTeamIds'], [codeId], function(err, teamResult) {
    if (err) {
      utility.nodeLogs('ERROR', 'error occured while getting the teams');
      callback(err, null);
    } else {
      if (teamResult && teamResult.length) {
        teamsArray = underscore.pluck(teamResult, 'id');
        console.log("teamsArray", teamsArray);
        excuteQuery.queryForAll(sqlQueryMap['updateTeamStatus'], [status, teamsArray], function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', 'error occured while updating the teams status');
            callback(err, null);
          } else {
            // callback(null,{status:'success'});
            utility.nodeLogs('INFO', 'Teams status updatd successflly');
            async.each(teamsArray, function(singleObj, eachCallback) {
              console.log(singleObj);
              excuteQuery.queryForAll(sqlQueryMap['getEntity'], [singleObj, 'team'], function(err, rows) {
                if (err) {
                  eachCallback(err, null);
                } else {
                  eachCallback(null);
                  var entityObj = {};
                  entityObj.entity_id = singleObj;
                  entityObj.entity_type = 'team';
                  entityObj.id = rows[0].id;
                  entityObj.slug = rows[0].slug;
                  entityObj.update = 'update';
                  agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
                }
              });
            }, function(err) {
              if (err) {
                utility.nodeLogs('ERROR', 'error while updated in elastic');
                callback(err, null);
              } else {
                utility.nodeLogs('INFO', 'updated successflly in elastic');
                callback(null, { status: 'success' });
              }
            });
          }
        });
      } else {
        utility.nodeLogs('INFO', 'No teams found for this campaign');
        callback(null, { status: 'success' })
      }
    }
  });
}

/**
 * getAllSubCampaigns Returns peer to peer fundraisers and team fundraiser of a main fundraier based on its id
 * @param  {Number}   codeId   code id of the main fundraiser(parent fundraiser)
 * @param  {Function} callback Returns a callback function
 * @return {[type]}            [description]
 */
exports.getAllSubCampaigns = function(codeId, callback) {
  var codeIds = [];
  var teamIds = [];
  var teamCodes = [];
  excuteQuery.queryForAll(sqlQueryMap['getAllP2pCamps'], codeId, function(err, peerResult) {
    if (err) {
      utility.nodeLogs('ERROR', 'Error occured while getting the p2p campaigns');
      callback(err, null)
    } else {
      if (peerResult && peerResult.length) {
        codeIds = underscore.pluck(peerResult, 'id')
      } else {
        utility.nodeLogs('INFO', 'No p2p details found');
      }
      excuteQuery.queryForAll(sqlQueryMap['getTeamIds'], codeId, function(err, teamResult) {
        if (err) {
          utility.nodeLogs('ERROR', 'Error occured while getting team fundraisers')
          callback(err, null)
        } else {
          var teamIds = underscore.pluck(teamResult, 'id')
          if (teamIds && teamIds.length) {
            excuteQuery.queryForAll(sqlQueryMap['getAllTeamCodes'], [teamIds], function(err, teamCodeResult) {
              if (err) {
                callback(err, null);
              } else {
                if (teamCodeResult && teamCodeResult.length) {
                  teamCodes = underscore.pluck(teamCodeResult, 'id');
                  codeIds = codeIds.concat(teamCodes);
                  callback(null, codeIds);
                } else {
                  utility.nodeLogs('INFO', 'No team fundraisers details found');
                  if (codeIds && codeIds.length) {
                    callback(null, codeIds);
                  } else {
                    callback(null, []);
                  }
                }
              }
            });
          } else {
            utility.nodeLogs('INFO', 'No teams details found');
            if (codeIds && codeIds.length) {
              callback(null, codeIds);
            } else {
              callback(null, []);
            }
          }
        }
      }); //End of get team ids query and callback
    }
  });
}

exports.deleteCampaign = function(codeSlug, callback) {

  pool.query('select * from entity_tbl where slug =?', [codeSlug], function(err, slugResult) {

    if (err) {
      callback(err, null);
    } else {
      async.parallel({
        deleteCampaignRelateData: function(callback) {
          console.log("result of data of 2");
          excuteQuery.queryForAll(sqlQueryMap['deleteCampaign'], [codeSlug], callback);
        },
        updateCampaignData: function(callback) {
          console.log("result of data");
          console.log(slugResult);
          excuteQuery.queryForAll(sqlQueryMap['updatecampaigndelete'], [moment.utc().toDate(), slugResult[0].entity_id], callback);
        }
      }, function(err, results) {
        if (err) {
          console.log(err);
          callback(new Error(err), null);
        } else {
          console.log("siuccchhb")
          callback(null, results.deleteCampaignRelateData);
          var id = "";
          if (slugResult && slugResult.length > 0) {
            id = slugResult[0].id
          } else {
            id = 12345;
          }
          agenda.now('Delete campaign from elasticsearch', {
            id: id
          });
        }
      });
    }
  });
}
exports.sendFinalDeleteEmail = function(entityRecord, message_body, callback) {
  async.parallel({
    getAllFollowers: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['getCampaignFollowers'], [entityRecord[0].id], function(err, followers) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, followers);
        }
      })
    },
    getAllAdmins: function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['getCampaignsAdmins'], [entityRecord[0].entity_id], function(err, admins) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, admins);
        }
      })
    }
  }, function(err, results) {
    console.log("results for deleteEmail");
    console.log(results);
    var finalResultArray = [];

    if (results && results.getAllFollowers.length) {
      finalResultArray.push(results.getAllFollowers);
    }
    if (results && results.getAllAdmins.length) {
      finalResultArray.push(results.getAllAdmins);

    }
    console.log(finalResultArray);
    if (finalResultArray && finalResultArray.length) {
      finalResultArray = underscore.flatten(finalResultArray)
    }
    if (finalResultArray && finalResultArray.length > 0) {
      agenda.now('Sending email for all the followers before delete', {
        followRecords: finalResultArray,
        message_body: message_body
      });
    } else {
      callback(null, null);
    }
  })

}
exports.sendFinalEmailForDeleteCampaign = function(data, message_body, callback) {
  async.each(data, function(obj, eachCallback) {
    console.log("sendEmailBeforeDelete");
    console.log(obj)
    sendEmailBeforeDelete(obj.email, obj.name, obj.title, obj.sendername, obj.senderemail, message_body, function(err, result) {
      eachCallback(null);
    });
  }, function(err) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, null);
    }
  });
}
exports.deleteDefaultCampaign = function(codeSlug, defaultCodeId, callback) {
  pool.query("UPDATE code_tbl SET charity_default='yes', status='published' WHERE id=?", [defaultCodeId], function(err, result) {

    if (err) {

      callback(new Error(err), null);
    } else {
      excuteQuery.queryForAll(sqlQueryMap['getEntity'], [defaultCodeId, 'code'], function(err, rows) {
        var entityObj = {};
        entityObj.entity_id = defaultCodeId;
        entityObj.entity_type = 'code';
        entityObj.id = rows[0].id;
        entityObj.slug = rows[0].slug;
        entityObj.update = 'update';
        agenda.now('create campaign/donor/charity in elasticsearch', entityObj);

        pool.query('select * from entity_tbl where slug =?', [codeSlug], function(err, slugResult) {
          if (err) {
            callback(err, null);
          } else {
            pool.query("UPDATE code_tbl c inner join entity_tbl et on et.entity_id=c.id SET c.charity_default='no', et.date_deleted=now(), c.date_deleted=? WHERE c.id=?", [moment.utc().toDate(), slugResult[0].entity_id], function(err, result) {
              excuteQuery.queryForAll(sqlQueryMap['deleteCampaign'], [codeSlug], function(err, rows1) {

                if (err) {
                  callback(new Error(err), null);
                } else {
                  callback(null, defaultCodeId);

                  var id = "";
                  if (slugResult && slugResult.length > 0) {
                    id = slugResult[0].id
                  } else {
                    id = 12345;
                  }
                  agenda.now('Delete campaign from elasticsearch', {
                    id: id
                  });
                }
              });
            })
          }
        });
      });
    }
  });
}

exports.sendCampaignDetails = function(obj, callback) {
  if (obj.profilepicurl) {
    obj.profilePicUrl = obj.profilepicurl;
  }
  async.each(obj.emails, function(object, callback) {

    shareCampaignDetails(object.email, obj.subject, obj.emailBody, obj.campaignname, obj.campaignslug, obj.codeid, obj.userid, obj.profilePicUrl, obj.sendername, obj.senderemail, callback);
  }, function(err) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, obj);
    }
  });
}

function sendAdminEmail(sendername, invitedname, campaignname, userEmail, messagebody, type, verification_key, userid, callback) {
  invitedname = invitedname.replace(/ +/g, ' ');
  var nameArray = invitedname.split(' ');
  var firstname = nameArray[0];
  var finalobjectmandril = {};
  finalobjectmandril.from = props.fromemail;
  finalobjectmandril.email = userEmail;
  finalobjectmandril.text = "";
  if (type == 'newUser') {
    finalobjectmandril.subject = sendername + " has invited you to manage the Campaign " + campaignname;
    finalobjectmandril.template_name = "Group Fundraiser Admin Invitation - New User";
    finalobjectmandril.template_content = [{
      "name": "sendername",
      "content": "*|SENDER_NAME|*"
    }, {
      "name": "campaignname",
      "content": "*|CAMPAIGN_NAME|*"
    }, {
      "name": "invitedname",
      "content": "*|INVITED_NAME|*"
    }, {
      "name": "signupurl",
      "content": "*|SIGN_UP_URL|*"
    }, {
      "name": "messagebody",
      "content": "*|MESSAGE_BODY|*"

    }, , {
      "name": "groupurl",
      "content": "*|GROUP_URL|*"
    }, {
      "name": "wonderurl",
      "content": "*|WONDER_URL|*"
    }];
    finalobjectmandril.merge_vars = [{
      "name": "SENDER_NAME",
      "content": sendername
    }, {
      "name": "CAMPAIGN_NAME",
      "content": campaignname
    }, {
      "name": "INVITED_NAME",
      "content": firstname
    }, {
      "name": "SIGN_UP_URL",
      "content": props.domain + "/pages/resetpassword/" + userid + "?admin=admin"
    }, {
      "name": "MESSAGE_BODY",
      "content": messagebody
    }, {
      "name": "GROUP_URL",
      "content": props.domain + "/features/groups/"
    }, {
      "name": "WONDER_URL",
      "content": props.domain
    }];

  } else {
    finalobjectmandril.subject = sendername + " has invited you to manage the Campaign " + campaignname;
    finalobjectmandril.template_name = "Group Fundraiser Admin Invitation - existing user";
    finalobjectmandril.template_content = [{
      "name": "sendername",
      "content": "*|SENDER_NAME|*"
    }, {
      "name": "campaignname",
      "content": "*|CAMPAIGN_NAME|*"
    }, {
      "name": "invitedname",
      "content": "*|INVITED_NAME|*"
    }, {
      "name": "linktologin",
      "content": "*|LOGINPAGE|*"
    }, {
      "name": "messagebody",
      "content": "*|MESSAGE_BODY|*"

    }, {
      "name": "groupurl",
      "content": "*|GROUP_URL|*"
    }, {
      "name": "wonderurl",
      "content": "*|WONDER_URL|*"
    }];
    finalobjectmandril.merge_vars = [{
      "name": "SENDER_NAME",
      "content": sendername
    }, {
      "name": "CAMPAIGN_NAME",
      "content": campaignname
    }, {
      "name": "INVITED_NAME",
      "content": firstname
    }, {
      "name": "LOGINPAGE",
      "content": props.domain + "/login"
    }, {
      "name": "MESSAGE_BODY",
      "content": messagebody
    }, {
      "name": "GROUP_URL",
      "content": props.domain + "/features/groups/"
    }, {
      "name": "WONDER_URL",
      "content": props.domain
    }];
  }
  utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
    if (err) {
      callback(new Error(err), null);
    } else {
      console.log("sdjjsdjsn");
      console.log(reuslt);
      callback(null, reuslt);
    }
  });
}

function sendEmailBeforeDelete(invitedemail, invitedname, campaignname, sendername, senderemail, message_body, callback) {
  console.log("finaly in delete");
  console.log(invitedemail);
  console.log(sendername);
  console.log(senderemail);
  var finalobjectmandril = {};
  finalobjectmandril.from = props.fromemail;
  finalobjectmandril.email = invitedemail;
  finalobjectmandril.subject = campaignname + ' campaign has been deleted';
  finalobjectmandril.template_name = "Campaign delete email";
  finalobjectmandril.template_content = [{
    "name": "sendername",
    "content": "*|SENDER_NAME|*"
  }, {
    "name": "campaignname",
    "content": "*|CAMPAIGN_NAME|*"
  }, {
    "name": "invitedname",
    "content": "*|INVITED_NAME|*"
  }, {
    "name": "messagebody",
    "content": "*|MESSAGE_BODY|*"
  }];
  finalobjectmandril.merge_vars = [{
    "name": "SENDER_NAME",
    "content": sendername
  }, {
    "name": "CAMPAIGN_NAME",
    "content": campaignname
  }, {
    "name": "INVITED_NAME",
    "content": invitedname
  }, {
    "name": "MESSAGE_BODY",
    "content": message_body
  }];

  utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
    console.log(err);
    if (err) {
      callback(new Error(err), null);
    } else {
      console.log("sdjjsdjsn");
      console.log(reuslt);
      callback(null, reuslt);
    }
  });
}

function sendP2PEmail(sendername, invitedname, campaignname, userEmail, messagebody, type, verification_key, userid, slug, callback) {
  var finalobjectmandril = {};
  finalobjectmandril.from = props.fromemail;
  finalobjectmandril.email = userEmail;
  finalobjectmandril.text = "";
  if (type == 'newUser') {
    finalobjectmandril.subject = sendername + " has invited you to create the  peer-to-peer Campaign to support " + campaignname;
    finalobjectmandril.template_name = "PeerToPeer Invitation - existing user";
    finalobjectmandril.template_content = [{
      "name": "sendername",
      "content": "*|SENDER_NAME|*"
    }, {
      "name": "campaignname",
      "content": "*|CAMPAIGN_NAME|*"
    }, {
      "name": "invitedname",
      "content": "*|INVITED_NAME|*"
    }, {
      "name": "signupurl",
      "content": "*|SIGN_UP_URL|*"
    }, {
      "name": "messagebody",
      "content": "*|MESSAGE_BODY|*"

    }];
    finalobjectmandril.merge_vars = [{
      "name": "SENDER_NAME",
      "content": sendername
    }, {
      "name": "CAMPAIGN_NAME",
      "content": campaignname
    }, {
      "name": "INVITED_NAME",
      "content": invitedname
    }, {
      "name": "SIGN_UP_URL",
      "content": props.domain + "/" + slug + "?p2p=true&user=newuser&id=" + userid
    }, {
      "name": "MESSAGE_BODY",
      "content": messagebody
    }];

  } else {
    finalobjectmandril.subject = sendername + " has invited you to create the  peer-to-peer Campaign to support " + campaignname;
    finalobjectmandril.template_name = "PeerToPeer Invitation - existing user";
    finalobjectmandril.template_content = [{
      "name": "sendername",
      "content": "*|SENDER_NAME|*"
    }, {
      "name": "campaignname",
      "content": "*|CAMPAIGN_NAME|*"
    }, {
      "name": "invitedname",
      "content": "*|INVITED_NAME|*"
    }, {
      "name": "linktologin",
      "content": "*|LOGINPAGE|*"
    }, {
      "name": "messagebody",
      "content": "*|MESSAGE_BODY|*"

    }];
    finalobjectmandril.merge_vars = [{
      "name": "SENDER_NAME",
      "content": sendername
    }, {
      "name": "CAMPAIGN_NAME",
      "content": campaignname
    }, {
      "name": "INVITED_NAME",
      "content": invitedname
    }, {
      "name": "LOGINPAGE",
      "content": props.domain + "/" + slug + "?p2p=true&user=existing"
    }, {
      "name": "MESSAGE_BODY",
      "content": messagebody
    }];
  }
  utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
    if (err) {
      callback(new Error(err), null);
    } else {
      console.log("sdjjsdjsn");
      console.log(reuslt);
      callback(null, reuslt);
    }
  });
}

function shareCampaignDetails(email, subject, emailBody, campaignName, campaignSlug, codeid, userid, profilePicUrl, senderName, senderEmail, callback) {
  var finalobjectmandril = {};
  finalobjectmandril.from = props.fromemail;
  finalobjectmandril.email = email;
  finalobjectmandril.text = "";
  finalobjectmandril.subject = subject;
  //TODO new means if user don't have account
  finalobjectmandril.template_name = "Share Campaign";
  finalobjectmandril.template_content = [{
    "name": "userfullname",
    "content": "*|USER_FULL_NAME|*"
  }, {
    "name": "campaignname",
    "content": "*|CAMPAIGN_NAME|*"
  }, {
    "name": "emailBody",
    "content": "*|EMAIL_MESSAGE|*"
  }, {
    "name": "userName",
    "content": "*|USER_FULL_NAME|*"
  }, {
    "name": "profilePicUrl",
    "content": "*|USER_PIC_URL|*"
  }, {
    "name": "useremail",
    "content": "*|USER_EMAIL_ADDRESS|*"
  }, {
    "name": "campaignname",
    "content": "*|CAMPAIGN_NAME|*"
  }, {
    "name": "campaignurl",
    "content": "*|CAMPAIGN_URL|*"
  }, {
    "name": "campaignurlfacebook",
    "content": "*|CAMPAIGN_URL|*"
  }, {
    "name": "campaignurlfbshare",
    "content": "*|CAMPAIGN_URL|*"
  }, {
    "name": "campaignurltweet",
    "content": "*|CAMPAIGN_URL|*"
  }, {
    "name": "campaignurltweetshare",
    "content": "*|CAMPAIGN_URL|*"
  }];
  finalobjectmandril.merge_vars = [{
    "name": "USER_FULL_NAME",
    "content": senderName
  }, {
    "name": "CAMPAIGN_NAME",
    "content": campaignName
  }, {
    "name": "USER_PIC_URL",
    "content": profilePicUrl
  }, {
    "name": "EMAIL_MESSAGE",
    "content": emailBody
  }, {
    "name": "USER_FULL_NAME",
    "content": senderName
  }, {
    "name": "USER_EMAIL_ADDRESS",
    "content": senderEmail
  }, {
    "name": "CAMPAIGN_NAME",
    "content": campaignName
  }, {
    "name": "CAMPAIGN_URL",
    "content": props.domain + "/" + campaignSlug
  }, {
    "name": "CAMPAIGN_URL",
    "content": props.domain + "/" + campaignSlug
  }, {
    "name": "CAMPAIGN_URL",
    "content": props.domain + "/" + campaignSlug
  }, {
    "name": "CAMPAIGN_URL",
    "content": props.domain + "/" + campaignSlug
  }, {
    "name": "CAMPAIGN_URL",
    "content": props.domain + "/" + campaignSlug
  }];
  //TODO exists means if user already have a account


  utility.mandrillTemplate(finalobjectmandril, function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      utility.log('info', 'mail send successfully');
      callback(null, data);
    }
  });
}

exports.unpublishDefaultCampaign = function(codeSlug, defaultCodeId, codeId, callback) {
  pool.query("UPDATE code_tbl SET charity_default='yes', status='published' WHERE id=?", [defaultCodeId], function(err, result) {

    if (err) {

      callback(new Error(err), null);;
    } else {
      excuteQuery.queryForAll(sqlQueryMap['getEntity'], [defaultCodeId, 'code'], function(err, rows) {
        var entityObj = {};
        entityObj.entity_id = defaultCodeId;
        entityObj.entity_type = 'code';
        entityObj.id = rows[0].id;
        entityObj.slug = rows[0].slug;
        entityObj.update = 'update';
        agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
        pool.query("UPDATE code_tbl SET charity_default='no', status='draft' WHERE id=?", [codeId], function(err, result) {
          excuteQuery.queryForAll(sqlQueryMap['getEntity'], [codeId, 'code'], function(err, rows) {
            callback(null, defaultCodeId);
            var entityObj = {};
            entityObj.entity_id = codeId;
            entityObj.entity_type = 'code';
            entityObj.id = rows[0].id;
            entityObj.slug = rows[0].slug;
            entityObj.update = 'update';
            agenda.now('create campaign/donor/charity in elasticsearch', entityObj);

          });
        });
      });
    }
  });
}
exports.updateCampaignDetails = function(obj, callback) {
  console.log('In update campaign details');
  if (obj.flag == "viral") {
    pool.query("UPDATE code_tbl SET emissary_campaign=?,viral_campaign=? WHERE id=?", [obj.emissary_campaign, obj.viral_campaign, obj.code_id], function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else {
        callback(null, obj);
      }
    });
  } else if (obj.flag == "status") {
    pool.query("UPDATE code_tbl SET status=? WHERE id=?", [obj.status, obj.code_id], function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else {
        callback(null, obj);
      }
    });
  } else {
    pool.query("UPDATE code_tbl SET description=?, code_picture_url=?,code_video_url=? WHERE id=?", [obj.description, obj.code_picture_url, obj.code_video_url, obj.code_id], function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else {
        callback(null, obj);
      }
    });
  }
  if (obj && obj.code_picture_url) {
    this.updateTeamUpdate(obj.code_id, obj, function(err, teamUpdateRes) {
      console.log(err);
      console.log("in the team update");
      console.log(teamUpdateRes);
    });
  }
}
exports.saveCustomSettingsData = function(settingsData, callback) {
  //full_name,email,phone
  /*result
     id:{
  previous_slug
  updated_slug
  created_date
  entity_id
     }

    slug:
    entity_id="5966",
    entity_type="user"*/
  var userData = {};
  userData.full_name = settingsData.fullname;
  userData.email = settingsData.email;
  userData.phone = settingsData.phone_number;
  userData.val = true;
  userDataStore(userData, function(err, result) {

    async.each(settingsData.filedData, function(indiData, callback) {
      var settingseventdata = {};
      settingseventdata.field_id = indiData.id;
      settingseventdata.event_id = settingsData.event_id;
      settingseventdata.include = indiData.include;
      settingseventdata.required = indiData.required;

      if (result[0]) {
        excuteQuery.queryForAll(sqlQueryMap['getEntityUser'], [result[0].id, "user"], function(err, eresult) {
          settingseventdata.creator_id = eresult[0].id;
        })
      } else {
        settingseventdata.creator_id = result.id.entity_id;
      }


      excuteQuery.insertAndReturnKey(sqlQueryMap['eventDataInsert'], [settingseventdata], function(err, id) {
          if (err) {} else {
            var sqlQuery = "update event_tbl set auto_approval=?,event_coordinator_id=? where id=?";

            pool.query(sqlQuery, [settingsData.auto_approval, settingseventdata.creator_id, settingseventdata.event_id], function(err, updatedResult) {
              if (err) {
                callback(err);
              } else {

              }
            })
          }
        }) //end of eventdata query
    }, function(err) {
      if (err) callback(null, err);
      else callback(null, "")
    })
  })
}

exports.sendEmailForFundraise = function(obj, finalCallback) {
  if (obj.emails) {
    obj.invitedusers = obj.emails.split(',');
  }
  if (obj.fundraiser_userid) {

  } else {
    obj.fundraiser_userid = obj.userid;
  }
  async.each(obj.invitedusers, function(singleUser, callback) {
    if (singleUser && singleUser.email) {
      var email = singleUser.email;
    } else {
      var email = singleUser;
    }

    if (singleUser.fullname) {
      var name = singleUser.fullname;
    } else {
      var name = email.split('@');
      name = name[0];
    }

    pool.query('select * from user_tbl where email =?', [email.toLowerCase().trim()], function(err, userResult) {
      if (err) {
        callback(new Error(err), null);
      } else {
        if (userResult && userResult.length > 0) {
          var id = userResult[0].id;
          async.parallel({
            codeInfo: function(callback) {
              excuteQuery.queryForAll(sqlQueryMap['codeUrls'], [obj.codeid], callback);
            },
            senderInfo: function(callback) {
              if (obj.currentUserId) {
                var commonid = obj.currentUserId;
              } else {
                var commonid = obj.userid;
              }
              excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [commonid], callback);
            }
          }, function(err, data) {
            if (err) {
              callback(new Error(err), null);
            } else {
              if (obj.slug) {
                var slug = obj.slug;
              } else {
                var slug = obj.campaignslug;
              }
              if (obj.referenceuserid) {

              } else {
                obj.referenceuserid = obj.userid;
              }
              var emailBody = obj.emailBody;
              sendMailForFundraise(email, emailBody, data.codeInfo[0].title, slug, obj.codeid, obj.profilepicurl, data.senderInfo[0].email, data.senderInfo[0].name, id, obj, function(err, result) {
                if (err) {
                  callback(new Error(err));
                } else {
                  callback(null);
                }
              });
            }
          });

        } else {

          var verification_key = uuid.v4() + "-" + uslug(name);
          var date = moment.utc().toDate();
          excuteQuery.insertAndReturnKey(sqlQueryMap['importdata'], [name, email.toLowerCase().trim(), verification_key, date], function(err, id) {
            if (err) {
              callback(new Error(err), null);
            } else {
              var userEntityObject = {};
              userEntityObject.entity_id = id;
              userEntityObject.entity_type = 'user';

              var userDetailsObject = {
                name: name,
                count: 1
              };
              var usrSlug = uslug(name);
              var originlSlug = uslug(name);

              charityService.entitySlugCreation(userEntityObject, usrSlug, userDetailsObject, originlSlug, function(err, userResult) {
                userEntityObject.id = userResult;
                // });
                //excuteQuery.queryForAll(sqlQueryMap['userIdStoreInEntity'], [id, 'user'], function(err, userResult) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  var timezone_id = 381;
                  excuteQuery.queryForAll(sqlQueryMap['useIdAddToUserProfile'], [id, timezone_id], function(err, userResult) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      async.parallel({
                        codeInfo: function(callback) {
                          excuteQuery.queryForAll(sqlQueryMap['codeUrls'], [obj.codeid], callback);
                        },
                        senderInfo: function(callback) {
                          if (obj.currentUserId) {
                            var commonid = obj.currentUserId;
                          } else {
                            var commonid = obj.userid;
                          }
                          excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [commonid], callback);
                        }
                      }, function(err, data) {
                        if (err) {
                          callback(new Error(err), null);
                        } else {
                          if (obj.slug) {
                            var slug = obj.slug;
                          } else {
                            var slug = obj.campaignslug;
                          }
                          if (obj.referenceuserid) {

                          } else {
                            obj.referenceuserid = obj.userid;
                          }
                          var emailBody = obj.emailBody;
                          sendMailForFundraise(email, emailBody, data.codeInfo[0].title, slug, obj.codeid, obj.profilepicurl, data.senderInfo[0].email, data.senderInfo[0].name, id, obj, function(err, result) {
                            if (err) {
                              callback(new Error(err));
                            } else {
                              callback(null);
                            }
                          });
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
  }, function(err) {
    if (err) {
      finalCallback(err, null);
    } else {
      finalCallback(null, obj);
    }
  });
}

function sendMailForFundraise(email, emailBody, campaignName, campaignSlug, codeid, profilePicUrl, senderEmail, senderName, id, obj, callback) {
  var inviteInfo = {};
  if (obj.referenceuserid) {
    inviteInfo.user_id = obj.referenceuserid;
  } else {
    inviteInfo.user_id = obj.userid;
  }
  inviteInfo.code_id = codeid;
  inviteInfo.invite_userid = id;
  if (obj && obj.flag == "charity") {
    var type = "charity";
  } else if (obj && obj.flag == "fundraiser") {
    var type = "fundraise";
  } else {
    var type = "not";
  }
  //var type = "fundraise";
  var urlshortener = google.urlshortener('v1');
  urlshortener.url.insert({
    auth: props.shortultapikey,
    resource: {
      longUrl: props.domain + "/" + campaignSlug + "?codeid=" + codeid + "&userid=" + obj.fundraiser_userid + "&reference_userid=" + obj.referenceuserid + "&fundraise=" + type + "&social_source=email&inviteuserid=" + id
    }
  }, function(err, shortUrl) {
    if (err) {
      utility.appErrorHandler(err, res);
    } else {
      inviteInfo.link = shortUrl.id;
      inviteInfo.social_source = "email";
      inviteInfo.created_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
      excuteQuery.insertAndReturnKey(sqlQueryMap['inviteFundraiseContacts'], [inviteInfo], function(err, referral_id) {
        if (err) {
          callback(new Error(err));
        } else {
          var finalobjectmandril = {};
          finalobjectmandril.from = props.fromemail;
          finalobjectmandril.email = email;
          finalobjectmandril.text = "";
          finalobjectmandril.subject = "Help " + campaignName;
          //TODO new means if user don't have account
          finalobjectmandril.template_name = "invite-fundraise-contacts";
          finalobjectmandril.template_content = [{
            "name": "userfullname",
            "content": "*|USER_FULL_NAME|*"
          }, {
            "name": "campaignname",
            "content": "*|CAMPAIGN_NAME|*"
          }, {
            "name": "emailBody",
            "content": "*|EMAIL_MESSAGE|*"
          }, {
            "name": "userName",
            "content": "*|USER_FULL_NAME|*"
          }, {
            "name": "profilePicUrl",
            "content": "*|USER_PROFILE_IMG|*"
          }, {
            "name": "useremail",
            "content": "*|USER_EMAIL_ADDRESS|*"
          }, {
            "name": "campaignname",
            "content": "*|CAMPAIGN_NAME|*"
          }, {
            "name": "campaignurl",
            "content": "*|CAMPAIGN_URL_DONATE|*"
          }, {
            "name": "campaignurlfacebook",
            "content": "*|CAMPAIGN_URL|*"
          }, {
            "name": "campaignurlfbshare",
            "content": "*|CAMPAIGN_URL|*"
          }, {
            "name": "campaignurltweet",
            "content": "*|CAMPAIGN_URL|*"
          }, {
            "name": "campaignurltweetshare",
            "content": "*|CAMPAIGN_URL|*"
          }, {
            "name": "donate_url",
            "content": "*|DONATE_URL|*"
          }];
          finalobjectmandril.merge_vars = [{
            "name": "USER_FULL_NAME",
            "content": senderName
          }, {
            "name": "USER_PROFILE_IMG",
            "content": profilePicUrl
          }, {
            "name": "CAMPAIGN_NAME",
            "content": campaignName
          }, {
            "name": "EMAIL_MESSAGE",
            "content": emailBody
          }, {
            "name": "USER_FULL_NAME",
            "content": senderName
          }, {
            "name": "USER_EMAIL_ADDRESS",
            "content": senderEmail
          }, {
            "name": "CAMPAIGN_NAME",
            "content": campaignName
          }, {
            "name": "CAMPAIGN_URL_DONATE",
            "content": shortUrl.id
          }, {
            "name": "CAMPAIGN_URL",
            "content": props.domain + "/" + campaignSlug
          }, {
            "name": "CAMPAIGN_URL",
            "content": props.domain + "/" + campaignSlug
          }, {
            "name": "CAMPAIGN_URL",
            "content": props.domain + "/" + campaignSlug
          }, {
            "name": "CAMPAIGN_URL",
            "content": props.domain + "/" + campaignSlug
          }, {
            "name": "DONATE_URL",
            "content": props.domain + "/" + campaignSlug + '?donate=true'
          }];
          //TODO exists means if user already have a account


          utility.mandrillTemplate(finalobjectmandril, function(err, data) {
            if (err) {
              callback(err);
            } else {
              utility.log('info', 'mail send successfully');
              callback(null, data);
            }
          });
        }
      });
    }
  });
}
exports.getFundraisers = function(userid, skip, limit, callback) {
  var skipVal, limitVal, objData = [];
  skipVal = parseInt(skip);
  limitVal = parseInt(limit);
  excuteQuery.queryForAll(sqlQueryMap['getFundraisers'], [userid, userid, limitVal], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      var obj = {};
      obj.data = data;
      callback(null, obj);

      /*    excuteQuery.queryForAll(sqlQueryMap['getUserCountrySymbol'], [userid], function(err, currencyInfo) {
            if (err) {
              callback(err, null);
            } else {
              var obj = {};
              async.each(data, function(groupDta, callback) {
                  groupDta.daystogo = moment.utc(groupDta.end_date).fromNow();

                  objData.push(groupDta);
                  callback(null);

                }, function(err) {

                  obj.data = objData;
                  if (currencyInfo && currencyInfo.length > 0) {
                    obj.currencyInfo = currencyInfo[0];
                  }

                  callback(null, obj);
                })
                //data.daystogo=moment.utc(data.end_date).fromNow();

            }

          }); */
    }
  });
}

exports.saveShareInfo = function(sharedata, callback) {
  delete sharedata['name'];
  sharedata.created_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  // Wehave to remove title field in sharedata object in the process of pramotion.
  if (sharedata.title) {
    delete sharedata['title'];
  }
  excuteQuery.insertAndReturnKey(sqlQueryMap['inviteFundraiseContacts'], [sharedata], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, data);
    }
  });
}

exports.saveEvent = function(eventData, callback) {
  eventData.created_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  if (eventData.causes) {
    var causes = eventData.causes;
    delete eventData['causes'];
  }
  if (eventData.tickets && eventData.tickets.length > 0) {
    var tickets = eventData.tickets;
    delete eventData['tickets'];
    eventData.event_tickets = 'yes';
  } else {
    eventData.event_tickets = 'no';
  }
  if (eventData.volunteers && eventData.volunteers.length > 0) {
    var volunteers = eventData.volunteers;
    delete eventData['volunteers'];
    eventData.event_volunteers = 'yes';
  } else {
    eventData.event_volunteers = 'no';
  }
  var eventSlug = uslug(eventData.event_text);
  eventData.start_date = moment.utc(eventData.start_date).format('YYYY-MM-DD HH:mm:ss');
  eventData.end_date = moment.utc(eventData.end_date).format('YYYY-MM-DD HH:mm:ss');
  delete eventData['files'];
  delete eventData['file'];
  if (!eventData.code_video_url) {
    delete eventData.code_video_url;
  }
  var volunteers_required = eventData.total_volunteers_required;
  delete eventData.total_volunteers_required;
  excuteQuery.insertAndReturnKey(sqlQueryMap['createEvent'], [eventData], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      eventData.id = rows;
      var entityObj = {};
      entityObj.entity_type = 'event';
      entityObj.entity_id = rows;
      entityObj.slug = eventSlug;
      entityObj.volunteers_required = volunteers_required;
      excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], entityObj, function(err, entityrows) {
        if (err) {
          callback(new Error(err), null);;
        } else {
          if (!eventData.event_picture_url) {
            if (props.environment_type == 'production') {
              eventData.event_picture_url = "https://wonderwe-prod.s3.amazonaws.com/profile/6202a9d6-bca7-487a-b48d-c22532a3c73e-default-campaignpng.png";
            } else {
              eventData.event_picture_url = "https://wonderwe.s3.amazonaws.com/profile/c5bfa833-ff85-4842-84d1-cf0ffa94f378-default-campaignpng.png";
            }
          }
          var codeObj = {};
          codeObj.originalslug = entityObj.slug;
          codeObj.slug = entityObj.slug;
          codeObj.entity_id = entityrows;
          charityService.storeUserNames(codeObj, function(err, data) {
            if (err) {
              callback(err, null);
            } else {

            }
          });
          if (eventData.event_tickets == 'yes') {
            async.each(tickets, function(group, callback1) {
              var ticketsObj = {};
              ticketsObj = group;
              ticketsObj.event_id = eventData.id;
              ticketsObj.start_date = moment.utc(group.start_date).format('YYYY-MM-DD HH:mm:ss');
              ticketsObj.end_date = moment.utc(group.end_date).format('YYYY-MM-DD HH:mm:ss');
              if (group.start_time) {
                ticketsObj.start_time = group.start_time;
              } else {
                ticketsObj.start_time = moment.utc(group.start_date).format('HH:mm:ss');
              }
              if (group.end_time) {
                ticketsObj.end_time = group.end_time;
              } else {
                ticketsObj.end_time = moment.utc(group.end_date).format('HH:mm:ss');
              }
              excuteQuery.insertAndReturnKey(sqlQueryMap['eventTickets'], [ticketsObj], callback)

            }, function(err) {
              callback1(null, null)
            });
          }
          if (eventData.event_volunteers == 'yes') {
            async.each(volunteers, function(group, callback1) {
              var shiftObj = {};
              shiftObj = group
              shiftObj.event_id = eventData.id;
              shiftObj.start_date = moment.utc(group.start_date).format('YYYY-MM-DD HH:mm:ss');
              //shiftObj.end_date = moment.utc(group.end_date).format('YYYY-MM-DD HH:mm:ss');
              if (group.start_time) {
                shiftObj.start_time = moment.utc(group.start_time).format('HH:mm:ss');
              } else {
                shiftObj.start_time = moment.utc(group.start_date).format('HH:mm:ss');
              }
              if (group.end_time) {
                shiftObj.end_time = moment.utc(group.end_time).format('HH:mm:ss');
              } else {
                shiftObj.end_time = moment.utc(group.end_date).format('HH:mm:ss');
              }
              excuteQuery.insertAndReturnKey(sqlQueryMap['eventVolunteers'], [shiftObj], function(err, result) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  callback1(null, result);
                }
              });
            }, function(err, data) {});
          }
          if (causes) {
            //causes = causes.split(',');
            async.each(causes, function(group, callback1) {
              excuteQuery.insertAndReturnKey(sqlQueryMap['eventCategories'], [rows, group], function(err, result) {
                if (err) {
                  callback(new Error(err), null);
                } else {
                  callback1(null, result);
                }
              });
            }, function(err, data) {
              if (err) {

              } else {
                callback(null, eventData);
              }
            })
          } else {
            callback(null, eventData);
          }
        }
      });
    }
  });
}
exports.getEventsList = function(creater_id, limit, callback) {
  var limit = parseInt(limit);
  excuteQuery.queryForAll(sqlQueryMap['getEventsList'], [creater_id, limit], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, data);
    }
  });
}
exports.trackingCampaignDonations = function(codeobj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCampaignDonations'], [codeobj.codeid], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, data)
    }
  });
}

exports.trackingCampaignData = function(codeobj, callback) {

  excuteQuery.queryForAll(sqlQueryMap['getFundraisersTrackInfo'], [codeobj.codeid, codeobj.userid], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      var object = {};
      async.each(data, function(obj, callback) {
          if (obj.social_source == 'facebook') {
            object.facebook = "facebook";
          }
          if (obj.social_source == 'twitter') {
            object.twitter = "twitter";
          }
          if (obj.social_source == 'email') {
            object.email = 'email';
          }
          callback(null);
        },
        function(err) {
          if (err) {
            callback(err, null);
          } else {
            excuteQuery.queryForAll(sqlQueryMap['getFundraisersShareCount'], [codeobj.codeid], function(err, datacount) {
              if (err) {
                callback(new Error(err), null);
              } else {
                var dataobj = {};
                dataobj.trackArray = [];
                dataobj.trackArray = datacount;
                excuteQuery.queryForAll(sqlQueryMap['getFundCampStatus'], [codeobj.codeid], function(err, campstatus) {
                  if (err) {
                    callback(new Error(err), null);
                  } else {
                    if (campstatus && campstatus.length > 0) {
                      dataobj.status = campstatus[0].status;
                    }

                    callback(null, dataobj);
                  }
                });
              }
            });
          }
        });
      //callback(null, data);
    }
  });

}
exports.ticketOrShiftSignupsAsGuest = function(signupObj, callback) {
  if (signupObj.type == 'attendee') {
    ticketOrShiftSignups(signupObj, callback);
  } else {
    excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [signupObj.userObj.email], function(err, userResult) {
      if (err) {
        callback1(err, null);
      } else {
        if (userResult && userResult.length) {
          delete signupObj['userObj'];
          signupObj.user_id = userResult[0].id;
          ticketOrShiftSignups(signupObj, callback);
        } else {
          userDataStore(signupObj.userObj, function(err, userGuestObj) {
            if (err) {
              callback(err, null);
            } else {
              delete signupObj['userObj'];
              signupObj.user_id = userGuestObj.entity_id;;
              ticketOrShiftSignups(signupObj, callback);
            }
          });
        }
      }
    });
  }
}
exports.addPeerInvitees = function(adminData, callback) {
  var existingUserId;
  var emailArray = [];
  async.each(adminData.adminEmail, function(eachEmail, callback1) {
      if (eachEmail.email) {
        excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [eachEmail.email], function(err, userRecord) {
          if (err) {
            console.log(err);
            callback1(err);
          } else {
            //for existing user
            if (userRecord && userRecord.length > 0 && userRecord[userRecord.length - 1].date_deleted == null) {
              //checking while edit
              eachEmail.user_id = userRecord[userRecord.length - 1].id;
              eachEmail.active = userRecord[userRecord.length - 1].active;
              eachEmail.code_id = adminData.campaignId;
              emailArray.push(eachEmail);
              if (userRecord[userRecord.length - 1].id != adminData.creatorid) {
                excuteQuery.queryForAll(sqlQueryMap['insertP2PData'], [userRecord[userRecord.length - 1].id, adminData.campaignId, adminData.messageBody], function(err, userRecord1) {
                  sendP2PEmail(adminData.userName, userRecord[userRecord.length - 1].name, adminData.campaignTitle, eachEmail.email, adminData.messageBody, 'existingUser', '', userRecord[userRecord.length - 1].id, adminData.slug, function(err, data) {
                    if (err) {
                      callback1(err);
                    } else {
                      callback1(null);
                    }
                  });

                })
              } else {
                var error = {};
                error.errors = ['Dont add creator email '];
                error.status = 400;
                callback1(new Error(JSON.stringify(error)));
              }


            } else {
              //for new user
              var senderEmailName = eachEmail.name;
              var verification_key = uuid.v4() + "-" + uslug(senderEmailName);
              var date = moment.utc().toDate();
              excuteQuery.insertAndReturnKey(sqlQueryMap['importdata'], [senderEmailName, eachEmail.email, verification_key, date], function(err, userId) {
                if (err) {
                  callback1(err);
                } else {
                  eachEmail.user_id = userId;
                  eachEmail.active = "";
                  eachEmail.code_id = adminData.campaignId;

                  emailArray.push(eachEmail);
                  sendP2PEmail(adminData.userName, senderEmailName, adminData.campaignTitle, eachEmail.email, adminData.messageBody, 'newUser', verification_key, userId, adminData.slug, function(err, data) {

                  })
                  async.parallel({
                    enitycreation: function(callback) {
                      console.log("entitycreation")
                      var userEntity = {};
                      userEntity.entity_id = userId;
                      userEntity.entity_type = "user";

                      var count = 1;
                      var usrSlug = uslug(senderEmailName);
                      var originlSlug = uslug(senderEmailName);
                      console.log(originlSlug);
                      var userDetailsObject = {
                        count: 1,
                        name: senderEmailName
                      };
                      charityService.entitySlugCreation(userEntity, usrSlug, userDetailsObject, originlSlug, function(err, userEntityId) {
                        if (err) {
                          callback(err, null);
                        } else {
                          console.log("userid");
                          userEntity.id = userEntityId;
                          callback(null, userId);
                        }
                      });
                    },
                    updateUserprofile: function(callback) {
                      console.log("userlkjkj")
                      var timezone_id = 381;
                      excuteQuery.queryForAll(sqlQueryMap['useIdAddToUserProfile'], [userId, timezone_id], function(err, userResult) {
                        if (err) {
                          callback(err, null);
                        } else {
                          console.log("updateuserprofile")
                          callback(null, userId);
                        }
                      });
                    },
                    insertAdminData: function(callback) {
                      excuteQuery.queryForAll(sqlQueryMap['insertP2PData'], [userId, adminData.campaignId, adminData.messageBody], function(err, userRec) {
                        console.log("insertAdminData");
                        if (err) {
                          callback(err, null);

                        } else {
                          callback(null, userRec);

                        }
                      });
                    }
                  }, function(err, results) {
                    console.log("ayncasbnsnparalleel")
                    if (err) {
                      utility.log('error', "userDataStore from page route - ");
                      callback1(err);
                    } else {
                      callback1(null);
                    }
                  });
                }
              });
            }
          }
        });
      }
    },
    function(err) {
      if (err) {
        console.log(err);
        callback(err, null)
      } else {
        console.log(emailArray);
        console.log("lastfinal data reached");
        callback(null, emailArray)
      }

    })
}
exports.updateCampaignAdminData = function(adminData, callback) {
  var existingUserId;
  console.log("asas");
  console.log(adminData.adminEmail);
  excuteQuery.queryForAll(sqlQueryMap['getCampaignAdminDetails'], [adminData.campaignId], function(err, existData) {
    if (existData) {
      console.log("existingUserId");
      existingUserId = underscore.pluck(existData, 'user_id');
    }
    var emailArray = [];
    async.each(adminData.adminEmail, function(eachEmail, callback1) {
        if (eachEmail.email) {
          excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [eachEmail.email], function(err, userRecord) {
            if (err) {
              console.log(err);
              callback1(err);
            } else {
              //for existing user
              if (userRecord && userRecord.length > 0 && userRecord[userRecord.length - 1].date_deleted === null) {
                //checking while edit
                console.log(existingUserId.indexOf(userRecord[userRecord.length - 1].id));

                if (existingUserId.indexOf(userRecord[userRecord.length - 1].id) >= 0) {
                  existingUserId = underscore.without(existingUserId, userRecord[userRecord.length - 1].id);
                  console.log(existingUserId);
                  excuteQuery.queryForAll(sqlQueryMap['updateDataForAdmins'], [adminData.messageBody, userRecord[userRecord.length - 1].id, adminData.campaignId], function(err, userRecord1) {
                    if (err) {
                      callback1(err)
                    } else {
                      callback1(null);

                    }
                  })

                } else {
                  //For the first time
                  console.log("nnnn")
                  eachEmail.user_id = userRecord[userRecord.length - 1].id;
                  eachEmail.active = userRecord[userRecord.length - 1].active;
                  eachEmail.code_id = adminData.campaignId;
                  eachEmail.password_salt=userRecord[userRecord.length - 1].password_salt;
                  emailArray.push(eachEmail);
                  if (userRecord[userRecord.length - 1].id != adminData.creatorid) {
                    excuteQuery.queryForAll(sqlQueryMap['insertAdminData'], [userRecord[userRecord.length - 1].id, adminData.campaignId, adminData.messageBody, moment.utc().toDate()], function(err, userRecord1) {
                      if (userRecord[userRecord.length - 1].active === "yes") {
                        sendAdminEmail(adminData.userName, userRecord[userRecord.length - 1].name, adminData.campaignTitle, eachEmail.email, adminData.messageBody, 'existingUser', '', userRecord[userRecord.length - 1].id, function(err, data) {
                          if (err) {
                            callback1(err);
                          } else {
                            callback1(null);
                          }
                        });
                      } else {
                        sendAdminEmail(adminData.userName, userRecord[userRecord.length - 1].name, adminData.campaignTitle, eachEmail.email, adminData.messageBody, 'newUser', '', userRecord[userRecord.length - 1].id, function(err, data) {
                          if (err) {
                            callback1(err);
                          } else {
                            callback1(null);
                          }
                        });
                      }

                    })
                  } else {
                    var error = {};
                    error.errors = ['Dont add creator email '];
                    error.status = 400;
                    callback1(new Error(JSON.stringify(error)));
                  }

                }
              } else {
                //for new user
                var senderEmailName = eachEmail.name;
                var verification_key = uuid.v4() + "-" + uslug(senderEmailName);
                var date = moment.utc().toDate();
                excuteQuery.insertAndReturnKey(sqlQueryMap['importdata'], [senderEmailName, eachEmail.email, verification_key, date], function(err, userId) {
                  if (err) {
                    callback1(err);
                  } else {
                    eachEmail.user_id = userId;
                    eachEmail.active = "";
                    eachEmail.code_id = adminData.campaignId;
                     eachEmail.password_salt="";
                    emailArray.push(eachEmail);
                    sendAdminEmail(adminData.userName, senderEmailName, adminData.campaignTitle, eachEmail.email, adminData.messageBody, 'newUser', verification_key, userId, function(err, data) {
                      /*if (err) {
                      callback1(err);
                    } else {
                      callback1(null);

                    }
*/
                    })
                    async.parallel({
                      enitycreation: function(callback) {
                        console.log("entitycreation")
                        var userEntity = {};
                        userEntity.entity_id = userId;
                        userEntity.entity_type = "user";

                        var count = 1;
                        var usrSlug = uslug(senderEmailName);
                        var originlSlug = uslug(senderEmailName);
                        console.log(originlSlug);
                        var userDetailsObject = {
                          count: 1,
                          name: senderEmailName
                        };
                        charityService.entitySlugCreation(userEntity, usrSlug, userDetailsObject, originlSlug, function(err, userEntityId) {
                          if (err) {
                            callback(err, null);
                          } else {
                            console.log("userid");
                            userEntity.id = userEntityId;
                            callback(null, userId);
                          }
                        });
                      },
                      updateUserprofile: function(callback) {
                        console.log("userlkjkj")
                        var timezone_id = 381;
                        excuteQuery.queryForAll(sqlQueryMap['useIdAddToUserProfile'], [userId, timezone_id], function(err, userResult) {
                          if (err) {
                            callback(err, null);
                          } else {
                            console.log("updateuserprofile")
                            callback(null, userId);
                          }
                        });
                      },
                      insertAdminData: function(callback) {
                        excuteQuery.queryForAll(sqlQueryMap['insertAdminData'], [userId, adminData.campaignId, adminData.messageBody, moment.utc().toDate()], function(err, userRec) {
                          console.log("insertAdminData");
                          callback(null, userRec);
                        });
                      }
                    }, function(err, results) {
                      console.log("ayncasbnsnparalleel")
                      if (err) {
                        utility.log('error', "userDataStore from page route - ");
                        callback1(err);
                      } else {

                        var followUserObj = {};
                        followUserObj.followeduser_id = props.botId;
                        followUserObj.user_id = userId;
                        followUserObj.date_followed = moment.utc().toDate();
                        followerService.createFollowUser(followUserObj, function(err, data) {});

                        callback1(null);
                      }
                    });
                  }
                });
              }
            }
          });
        }
      },
      function(err) {
        if (err) {
          console.log(err);
          callback(err, null)
        } else {
          console.log(emailArray);
          console.log("lastfinal data reached");
          callback(null, emailArray)
        }
        if (existingUserId && existingUserId.length) {
          console.log("asndsan in deelete")
          console.log(existingUserId);
          excuteQuery.queryForAll(sqlQueryMap['removeAdminEmails'], [adminData.campaignId, existingUserId], function(err, data) {
            console.log(err);
          })
        }
      });

  })
}
exports.resendAdminEmail = function(codeObject, callback) {
  excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [codeObject.email], function(err, userRecord) {
    if (err) {
      console.log(err);
      callback1(err);
    } else {
      //for existing user
      if (userRecord && userRecord.length > 0 && userRecord[userRecord.length - 1].date_deleted === null) {
        sendAdminEmail(codeObject.userName, userRecord[userRecord.length - 1].name, codeObject.campaignTitle, userRecord[userRecord.length - 1].email, codeObject.messageBody, 'newUser', userRecord[userRecord.length - 1].verification_key, userRecord[userRecord.length - 1].id, function(err, data) {
          if (err) {
            console.log(err);
            callback(new Error(err), null);
          } else {
            callback(null, 'success')

          }
        })
      } else if (userRecord && userRecord.length > 0 && userRecord[userRecord.length - 1].date_deleted !== null) {
        var error = {};
        error.errors = ['This record has already deleted'];
        error.status = 400;
        callback(new Error(JSON.stringify(error)), null);

      }
    }

  })
}
exports.deleteAdminEmail = function(codeObject, callback) {
  var existingUserId = [];
  existingUserId.push(codeObject.userid);
  excuteQuery.queryForAll(sqlQueryMap['removeAdminEmails'], [codeObject.codeid, existingUserId], function(err, data) {
    if (err) {
      callback(new Error(err), null);

    } else {
      callback(null, data);
    }
  })
}

exports.editCampaignUpdates = function(codeObject, callback) {
  console.log("sdbjsdjsjjsj")
  excuteQuery.queryForAll(sqlQueryMap['getCampaignUpdates'], [codeObject.codeid], function(err, data) {
    if (err) {
      callback(new Error(err), null);

    } else {
      console.log(data);
      callback(null, data);
    }
  })

}
exports.deleteCampaignUpdates = function(updateid, callback) {
  console.log(updateid);
  console.log('In update id');
  excuteQuery.queryForAll(sqlQueryMap['deleteCampaignUpdates'], [updateid], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, data);
    }
  })
}
exports.addCampaignUpdates = function(campaignData, callback) {
  var me = this;

  if (campaignData.user_id === '') {
    campaignData.user_id = null;
  }
  if (campaignData.charity_id === '') {
    campaignData.charity_id = null;
  }
  if (campaignData.id) {
    excuteQuery.queryForAll(sqlQueryMap['updateCampaignUpdates'], [campaignData.user_id, campaignData.charity_id, campaignData.code_id, campaignData.title, campaignData.description, campaignData.id], function(err, data) {
      if (err) {
        var error = {};
        error.errors = ['Description Too long'];
        error.status = 400;
        callback(new Error(JSON.stringify(error)), null);
      } else {
        campaignData.id = data;
        me.sendEmailForUpdates(campaignData, function(err, result) {
          console.log(err);
          console.log(result);
        });
        callback(null, campaignData);
        feedBotService.campaignUpdateNotifications(campaignData, function(err, result4) {
          console.log(err);
        });

      }
    })
  } else {
    if (campaignData.user_id === '') {
      campaignData.user_id = null;
    }
    if (campaignData.charity_id === '') {
      campaignData.charity_id = null;
    }
    excuteQuery.insertAndReturnKey(sqlQueryMap['insertCampaignUpdates'], [campaignData.user_id, campaignData.charity_id, campaignData.code_id, campaignData.title, campaignData.description], function(err, data) {
      if (err) {
        var error = {};
        error.errors = ['Description Too long'];
        error.status = 400;
        callback(new Error(JSON.stringify(error)), null);
      } else {
        campaignData.id = data;
        me.sendEmailForUpdates(campaignData, function(err, result) {
          console.log(err);
          console.log(result);
        });
        callback(null, campaignData);
        feedBotService.campaignUpdateNotifications(campaignData, function(err, result4) {
          console.log(err);
        });
      }
    })
  }
}


exports.sendEmailForUpdates = function(campaignData, callback) {
  console.log(campaignData);
  excuteQuery.queryForAll(sqlQueryMap['getCampaignDonorsList'], [campaignData.code_id], function(err, donorsData) {
    if (err) {
      callback(err, null);
    } else {
      if (donorsData && donorsData.length) {
        async.each(donorsData, function(obj, eachCallback) {
          console.log("sendEmailBeforeDelete");
          console.log(obj)
          sendEmailForUpdatesForDonors(obj.email, obj.name, campaignData, function(err, result) {
            eachCallback(null);
          });
        }, function(err) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(null, null);
          }
        });
      } else {

        callback(null, null);

      }
    }
  })
}


function sendEmailForUpdatesForDonors(receiverEmail, receiverName, campaignDta, callback) {
  var finalobjectmandril = {};
  finalobjectmandril.from = props.fromemail;
  finalobjectmandril.email = receiverEmail;
  finalobjectmandril.text = "";
  finalobjectmandril.subject = campaignDta.title;
  finalobjectmandril.template_name = "send email while doing updates";
  finalobjectmandril.reply = campaignDta.email;

  finalobjectmandril.template_content = [{
    "name": "name",
    "content": "*|NAME|*"
  }, {
    "name": "slug",
    "content": "*|WECODE|"
  }, {
    "name": "description",
    "content": "*|Description|"
  }, {
    "name": "campaignurl",
    "content": "*|CAMPAIGN_URL|"
  }, {}];

  finalobjectmandril.merge_vars = [{
    "name": "NAME",
    "content": receiverName
  }, {
    "name": "WECODE",
    "content": campaignDta.slug
  }, {
    "name": "DESCRIPTION",
    "content": campaignDta.description
  }, {
    "name": "CAMPAIGN_URL",
    "content": props.domain + '/' + campaignDta.slug
  }];

  utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
    console.log(finalobjectmandril);
    console.log("fcgvhbnjfinalobjectmandril")
    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      console.log("cfgvhbnj")
      callback(null, reuslt);
    }
  });
}


exports.eventSigunupAsGuest = function(signupObj, callback) {
  //  if (signupObj.type == 'attendee') {
  //    ticketOrShiftSignups(signupObj, callback);
  //  } else {
  async.each(signupObj.orders, function(group, callback) {
    excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [signupObj.userObj.email], function(err, userResult) {
      if (err) {
        callback1(err, null);
      } else {
        if (userResult && userResult.length) {
          delete signupObj['userObj'];
          var signupObject = group;
          signupObject.user_id = userResult[0].id;
          signupObject.count = signupObj.count;
          if (signupObj.guests && signupObj.guests.length > 0) {
            signupObject.guests = signupObj.guests;
          }
          delete signupObject['prise'];
          delete signupObject['ticket_name'];
          delete signupObject['shift_name'];
          ticketOrShiftSignups(signupObject, callback);
        } else {
          userDataStore(signupObj.userObj, function(err, userGuestObj) {
            if (err) {
              callback(err, null);
            } else {
              delete signupObj['userObj'];
              var signupObject = group;
              signupObject.user_id = userGuestObj.entity_id;
              signupObject.count = signupObj.count;
              if (signupObj.guests && signupObj.guests.length > 0) {
                signupObject.guests = signupObj.guests;
              }
              delete signupObject['prise'];
              delete signupObject['ticket_name'];
              delete signupObject['shift_name'];
              ticketOrShiftSignups(signupObject, callback);
            }
          });
        }
      }
    });
  }, function(err, ticket) {
    if (err) {
      callback(err, null);
    } else {
      callback(err, signupObj);
    }
  });
  //  }
}

exports.eventSigunup = function(signupObj, callback) {
  async.each(signupObj.orders, function(group, callback) {
    var signupObject = group;
    signupObject.user_id = signupObj.user_id;
    signupObject.count = signupObj.count;
    if (signupObj.guests && signupObj.guests.length > 0) {
      signupObject.guests = signupObj.guests;
    }
    delete signupObject['prise'];
    delete signupObject['ticket_name'];
    delete signupObject['shift_name'];
    ticketOrShiftSignups(signupObject, callback);
  }, function(err, ticket) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(err, signupObj);
    }
  })
}

exports.ticketOrShiftSignupsAsUser = function(signupObj, callback) {
  ticketOrShiftSignups(signupObj, callback);
}

function ticketOrShiftSignups(signupObj, callback) {
  signupObj.date_signup = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  var count = 1;
  if (signupObj.guests) {
    if (signupObj.guests.length > 0) {
      count = count + signupObj.guests.length;
      var guests = signupObj.guests;
    }
    delete signupObj['guests'];
  }
  excuteQuery.insertAndReturnKey(sqlQueryMap['ticketSignup'], [signupObj], function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      if (guests) {
        async.each(guests, function(group, callback1) {
          excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [group.email], function(err, groupResult) {
            if (err) {
              callback1(err, null);
            } else {
              if (groupResult && groupResult.length) {
                var guestUser = {};
                guestUser.shift_id = signupObj.ticket_or_shift_id;
                guestUser.user_id = signupObj.user_id;
                guestUser.member_id = groupResult[0].id;
                guestUser.date_signup = signupObj.date_signup;
                guestUser.type = signupObj.type;
                guestUser.shift_signup_tbl = data;
                guestUser.event_id = signupObj.event_id;
                excuteQuery.insertAndReturnKey(sqlQueryMap['eventGuestInfo'], [guestUser], function(err, result) {
                  if (err) {
                    callback1(err, null);
                  } else {
                    callback1(null, result);
                  }
                });
              } else {
                var userData = group;
                userDataStore(userData, function(err, userGuestObj) {
                  if (err) {
                    callback1(err, null);
                  } else {
                    var guestUser = {};
                    guestUser.shift_id = signupObj.ticket_or_shift_id;
                    guestUser.user_id = signupObj.user_id;
                    guestUser.member_id = userGuestObj.entity_id;
                    guestUser.date_signup = signupObj.date_signup;
                    guestUser.type = signupObj.type;
                    guestUser.shift_signup_tbl = data;
                    guestUser.event_id = signupObj.event_id;
                    excuteQuery.insertAndReturnKey(sqlQueryMap['eventGuestInfo'], [guestUser], function(err, result) {
                      if (err) {
                        callback1(err, null);
                      } else {
                        callback1(null, result);
                      }
                    });
                  }
                });
              }
            }
          });

        }, function(err, ticket) {
          if (err) {
            //  callback1(err, null);
          } else {
            excuteQuery.update(sqlQueryMap['updateUservolunteersCount'], [count, signupObj.event_id], function(err, result) {});
            //callback1(err, signupObj);
          }
        });
      } else {
        excuteQuery.update(sqlQueryMap['updateUservolunteersCount'], [count, signupObj.event_id], function(err, result) {});
      }
      if (signupObj.type === "volunteer") {
        excuteQuery.update(sqlQueryMap['updateUserVolunteerSignedup'], [count, signupObj.ticket_or_shift_id], function(err, result) {});
      } else {
        excuteQuery.update(sqlQueryMap['updateUserQuentitySold'], [count, signupObj.ticket_or_shift_id], function(err, result) {});
      }
      callback(null, signupObj);
    }
  });
}


function userDataStore(charityData, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['checkemail'], [charityData.email], function(err, rows) {
    if (err) {
      callback(err, null);
    } else {
      if (rows && rows.length > 0) {
        utility.log('info', "user already exists");
        if (charityData.val) callback(null, rows);
        else
          callback(null, "user already exists");
      } else {
        var userInfo = {};
        userInfo.name = charityData.full_name;
        userInfo.email = charityData.email;
        userInfo.verification_key = uuid.v4() + "-" + uslug(userInfo.name);
        userInfo.date_created = moment.utc().toDate();
        userInfo.date_verified = moment.utc().toDate();

        var userProfileInfo = {};
        userProfileInfo.state = charityData.state;
        userProfileInfo.city = charityData.city;
        userProfileInfo.home_phone = charityData.phone;
        userProfileInfo.postal_code = charityData.zip;
        userProfileInfo.gender = charityData.gender;
        async.waterfall([
            function(callback) {
              excuteQuery.insertAndReturnKey(sqlQueryMap['newUser'], [userInfo], function(err, userId) {
                if (err) {
                  callback(err, null);
                } else {
                  callback(null, userId);
                }
              });
            },
            function(userId, callback) {
              userProfileInfo.user_id = userId;
              excuteQuery.insertAndReturnKey(sqlQueryMap['newProfile'], [userProfileInfo], function(err, userProfile) {
                if (err) {
                  callback(err, null);
                } else {
                  callback(null, userId);
                }
              });
            },
            function(userId, callback) {
              var userEntity = {};
              userEntity.entity_id = userId;
              userEntity.entity_type = "user";

              var count = 1;
              var usrSlug = uslug(userInfo.name);
              var originlSlug = uslug(userInfo.name);

              var userDetailsObject = {
                count: 1,
                name: userInfo.name
              };
              charityService.entitySlugCreation(userEntity, usrSlug, userDetailsObject, originlSlug, function(err, userEntityId) {
                if (err) {
                  callback(err, null);
                } else {
                  userEntity.id = userEntityId;
                  callback(null, userEntity);
                }
              });
            }
          ],
          function(err, results) {
            if (err) {
              utility.log('error', "userDataStore from page route - " + req.cookies.logindonorid);
              callback(err, null);
            } else {
              callback(null, results);
            }
          });
      }
    }
  });
}
exports.sendEmailForChallenge = function(obj, callback) {
  var challengObj = {};
  excuteQuery.queryForAll(sqlQueryMap['getFundCampStatus'], [obj.codeid], function(err, codeData) {
    if (obj.emails) {
      obj.invitedusers = obj.emails.split(',');
    }
    async.each(obj.invitedusers, function(singleUser, callback) {
      if (singleUser && singleUser.email) {
        var email = singleUser.email;
      } else if (singleUser) {
        var email = singleUser;
      }
      if (singleUser.fullname) {
        var name = singleUser.fullname;
      } else {
        var name = email.split('@');
        name = name[0];
      }
      var verification_key = uuid.v4() + "-" + uslug(name);
      var date = moment.utc().toDate();
      excuteQuery.insertAndReturnKey(sqlQueryMap['importdata'], [name, email, verification_key, date], function(err, id) {
        if (err) {
          callback(err);
        } else {
          var userEntityObject = {};
          userEntityObject.entity_id = id;
          userEntityObject.entity_type = 'user';

          var userDetailsObject = {
            name: name,
            count: 1
          };
          var usrSlug = uslug(name);
          var originlSlug = uslug(name);

          charityService.entitySlugCreation(userEntityObject, usrSlug, userDetailsObject, originlSlug, function(err, userResult) {
            userEntityObject.id = userResult;
            if (err) {
              callback(err, null);
            } else {
              var timezone_id = 381;
              excuteQuery.queryForAll(sqlQueryMap['useIdAddToUserProfile'], [id, timezone_id], function(err, userResult) {
                if (err) {
                  callback(err, null);
                } else {
                  async.parallel({
                    codeInfo: function(callback) {
                      excuteQuery.queryForAll(sqlQueryMap['codeUrls'], [obj.codeid], callback);
                    },
                    senderInfo: function(callback) {
                      excuteQuery.queryForAll(sqlQueryMap['checkemailact'], [obj.userid], callback);
                    }
                  }, function(err, data) {
                    if (err) {
                      callback(err, null);
                    } else {
                      if (obj.slug) {
                        var slug = obj.slug;
                      } else {
                        var slug = obj.campaignslug;
                      }
                      if (obj.referenceuserid) {

                      } else {
                        obj.referenceuserid = obj.userid;
                      }
                      var emailBody = obj.emailBody;
                      //obj.challenge = "challenge";

                      var codeslug = obj.username.split(' ').slice(0, -1) + "" + codeData[0].code_text.toUpperCase();
                      challengObj = codeData[0];
                      delete challengObj['id'];
                      challengObj.individual = "challenge";
                      challengObj.user_id = obj.userid;
                      challengObj.code_text = codeslug;
                      challengObj.parent_id = obj.codeid;
                      excuteQuery.queryForAll(sqlQueryMap['checkChallege'], [obj.userid, obj.codeid], function(err, codeFubdData) {
                        if (codeFubdData && codeFubdData.length > 0) {
                          sendMailForFundraise(email, emailBody, data.codeInfo[0].title, codeslug, codeFubdData[0].id, obj.profilepicurl, data.senderInfo[0].email, data.senderInfo[0].name, id, obj, function(err, result) {
                            if (err) {
                              callback(err);
                            } else {
                              callback(null);
                            }
                          });
                        } else {
                          excuteQuery.insertAndReturnKey(sqlQueryMap['defaultCodeInsert'], [challengObj], function(err, challengeid) {
                            var entityObj = {};
                            entityObj.entity_type = 'code';
                            entityObj.entity_id = challengeid;
                            entityObj.slug = codeslug;
                            excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], entityObj, function(err, entityrows) {
                              agenda.now('create campaign/donor/charity in elasticsearch', entityObj);

                              sendMailForFundraise(email, emailBody, data.codeInfo[0].title, codeslug, challengeid, obj.profilepicurl, data.senderInfo[0].email, data.senderInfo[0].name, id, obj, function(err, result) {
                                if (err) {
                                  callback(err);
                                } else {
                                  callback(null);
                                }
                              });
                            });
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });

    }, function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, obj);
      }
    });
  });
}
exports.eventShiftsAndTickets = function(eventId, callback) {
  var eventObj = {};
  excuteQuery.queryForAll(sqlQueryMap['getEventShiftsList'], [eventId], function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      eventObj.shifts = data;
      excuteQuery.queryForAll(sqlQueryMap['getEventTicketsList'], [eventId], function(err, data1) {
        if (err) {
          callback(err, null);
        } else {
          eventObj.tickets = data1;
          callback(null, eventObj);
        }
      });
    }
  });
}


exports.getShiftVolunteers = function(shiftId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getEventShiftVolunteers'], [shiftId, shiftId], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, data);
    }
  });
}

exports.teamCampaignCreation = function(campaignObj, callback) {
  console.log('In campaign Obj', campaignObj);
  var me = this;
  if (campaignObj.p2papprovalrequired === 'yes') {
    excuteQuery.queryForAll(sqlQueryMap['teamInviteUser'], [campaignObj.user_id], function(err, adminresult) {
      if (err) {
        callback(new Error(err), null);
      } else {
        if (adminresult && adminresult.length > 0) {
          var codeid = underscore.findWhere(adminresult, {
            code_id: campaignObj.original_code_id
          });
          if (codeid) {
            campaignObj.status = 'published';
            me.teamCreationWithApproval(campaignObj, callback);
          } else {
            campaignObj.status = 'draft';
            me.teamCreationWithApproval(campaignObj, callback);
          }
        } else {
          campaignObj.status = 'draft';
          me.teamCreationWithApproval(campaignObj, callback);
        }
      }
    });
  } else {
    campaignObj.status = 'published';
    me.teamCreationWithApproval(campaignObj, callback);
  }

};

exports.teamCreationWithApproval = function(campaignObj, callback) {
  var me = this;
  console.log('Campaign obj', campaignObj);
  excuteQuery.queryForAll(sqlQueryMap['teamMainCampaign'], [campaignObj.original_code_id], function(err, codeResult) {
    //  pool.query('select * from code_tbl where id=?', [campaignObj.original_code_id], function(err, codeResult) {

    if (err) {
      callback(new Error(err), null);
    } else {

      if (codeResult && codeResult.length > 0) {
        var codeObj = codeResult[0];
        codeObj.date_created = moment.utc().toDate();
        codeObj.code_text = uslug(campaignObj.code_text);
        codeObj.goal = campaignObj.goal;
        if (campaignObj.team_id) {
          codeObj.team_id = campaignObj.team_id;
        } else {
          codeObj.team_id = null;
        }

        //Not sure why we do not have this? Is this only allowed for Personal Campaigns.
        codeObj.parent_id = codeResult[0].id;
        codeObj.app_fee = codeResult[0].app_fee;
        codeObj.parent_user_id = codeResult[0].user_id;
        codeObj.user_id = campaignObj.user_id;
        codeObj.team_campaign = 'yes';
        codeObj.charity_default = 'no';
        codeObj.individual = codeResult[0].individual;
        codeObj.description = campaignObj.description;
        codeObj.status = campaignObj.status;
        codeObj.donotallow_p2p_campaigns = "yes";
        codeObj.donotallow_team_campaigns = "yes";
        if (campaignObj.team_picture_url) {
          codeObj.code_picture_url = campaignObj.team_picture_url;
        } else {
          codeObj.code_picture_url = codeResult[0].code_picture_url
        }
        if (!codeObj.suggested_donation) {
          codeObj.suggested_donation = 25.00; // This will be the default suggested donation
        }

        campaignObj.mainCampaignSlug = codeObj.slug;
        campaignObj.originalCampaignTitle = codeObj.title;
        campaignObj.slug = uslug(campaignObj.code_text);

        //TODO: Why are we removing the slug and we should not?
        delete codeObj['slug'];
        delete codeObj['id'];

        if (codeObj.title) {
          codeObj.title = campaignObj.title;
        }
        console.log('CodeObject:', codeObj);
        excuteQuery.insertAndReturnKey(sqlQueryMap['defaultCodeInsert'], codeObj, function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {
            codeObj.id = rows;
            codeObj.slug = uslug(campaignObj.code_text);
            async.parallel({
              entityCreation: function(entityCallback) {
                var entityObj = {};

                entityObj.entity_type = 'code';
                entityObj.entity_id = rows;
                entityObj.slug = uslug(campaignObj.code_text);

                excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], entityObj, function(err, entityrows) {
                  entityObj.id = entityrows;
                  //me.createCampaignUserCharityInElasticSearch(entityObj, function(err, result4) {});

                  agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
                  agenda.now('Send thankyou/email for team campaign creation', codeObj);
                  // agenda.now('send promote mail to campaign creator',codeObj);
        // dripCampaign.sendTeamApprovalToCampaignOwner(codeObj,function(err,result){
        //   if(err){
        //     console.log("error occuresd while sending the mail");
        //   }else{
        //     console.log("Mail sent successfully to the campaign owner");
        //   }
        // })

                  if (codeObj.status === 'draft') {
                    console.log("draft to mail");
                    excuteQuery.queryForAll(sqlQueryMap['getCampaignOwnerAndAdminEmails'], [campaignObj.original_code_id, campaignObj.original_code_id], function(err, admindetails) {
                      if (admindetails && admindetails[0]) {
                        excuteQuery.queryForAll(sqlQueryMap['getTeamCampaignDetails'], [codeObj.id], function(err, teamresults) {
                          if (teamresults && teamresults[0]) {
                            //me.sendp2pApprovalToCampaignOwner(admindetails, codeObj.id, teamresults[0], function(err, result5) {});
                            var jobObject = {};
                            // var me=this;
                            jobObject.admindetails = admindetails;
                            jobObject.id = codeObj.id;
                            jobObject.teamresult = teamresults[0];
                            //agenda.now('send peertopeer approval request for campaign owner', jobObject);
                            me.sendp2pApprovalToCampaignOwner(jobObject.admindetails, jobObject.id, jobObject.teamresult, function(err, result) {
                              if (err) {
                                console.log("mail failure");
                                console.log(err);
                              } else {
                                console.log("success");
                                console.log(result);
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                  entityCallback(null, entityrows);
                  var codeUserObj = {};
                  codeUserObj.originalslug = entityObj.slug;
                  codeUserObj.slug = entityObj.slug;
                  codeUserObj.entity_id = entityrows;
                  charityService.storeUserNames(codeUserObj, function(err, data) {});
                });
              },
              teamCampaignCreation: function(teamCreationCallback) {
                var teamCampaignObj = {};
                teamCampaignObj.original_code_id = campaignObj.original_code_id;
                teamCampaignObj.team_code_id = rows;
                teamCampaignObj.team_name = campaignObj.title;
                if (campaignObj.team_picture_url) {
                  teamCampaignObj.code_picture_url = campaignObj.team_picture_url;
                } else {
                  teamCampaignObj.code_picture_url = codeObj.code_picture_url;
                }
                if (campaignObj.status === 'published') {
                  teamCampaignObj.approved_by = campaignObj.user_id;
                }
                if (campaignObj.team_id) {
                  teamCampaignObj.team_id = campaignObj.team_id;
                } else {
                  teamCampaignObj.team_id = null;
                }
                pool.query('INSERT INTO team_campaigns_tbl SET ?', teamCampaignObj, teamCreationCallback);
                pool.query('update team_invitees_tbl set code_id=,action_date= where team_id= and user_id=');
                var created_date = moment.utc().toDate();
                if (campaignObj.team_id) {
                  excuteQuery.queryForAll(sqlQueryMap['updatingTeamInvitees'], [campaignObj.original_code_id, created_date, 'yes', campaignObj.team_id, campaignObj.user_id], function(err, result) {});
                }
              },
              teamMemberCreation: function(memberCreationCallback) {
                var memberObj = {};
                memberObj.user_id = campaignObj.user_id;
                memberObj.code_id = rows;
                memberObj.created_user = 'yes';
                pool.query('INSERT INTO team_campaign_members_tbl SET ?', memberObj, memberCreationCallback);
              }
            }, function(err, result) {
              if (err) {
                callback(err, null);
              } else {
                callback(null, codeObj);
                campaignObj.alias_code_id = rows;
                me.campaignMembersCreation(campaignObj, function(err, memberResult) {});
              }
            });
          }
        });
      } else {
        callback('Something broken', null);
      }
    }
  });
};

/*<<<<<<< HEAD
exports.sendp2pApprovalToCampaignOwner = function(codeObj, id, callback) {
  async.each(codeObj, function(eachObject, eachCallback) {
    var finalobjectmandril = {};
    finalobjectmandril.from = props.fromemail;
    finalobjectmandril.email = eachObject.email;
    finalobjectmandril.text = "";
    finalobjectmandril.subject = "Peer-to-peer approval request";
    finalobjectmandril.template_name = " P2p approval request to campaign admin";
    finalobjectmandril.template_content = [{
      "name": "accept_url",
      "content": "*|ACCEPT_URL|*"
    }, {
      "name": "deny_url",
      "content": "*|DENY_URL|*"
    }];

    finalobjectmandril.merge_vars = [{
      "name": "ACCEPT_URL",
      "content": props.domain + '/pages/peertopeer/approval/' + eachObject.admin_user_id + '?cid=' + id + '&type=approve'
    }, {
      "name": "DENY_URL",
      "content": props.domain + '/pages/peertopeer/approval/' + eachObject.admin_user_id + '?cid=' + id + '&type=delete'
    }];

    utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, reuslt);
      }
    });
  }, function(err) {
    callback(err, null);
=======*/
exports.teamFundriserCreation = function(campaignObj, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['teamMainCampaign'], [campaignObj.original_code_id], function(err, codeResult) {
    //  pool.query('select * from code_tbl where id=?', [campaignObj.original_code_id], function(err, codeResult) {

    if (err) {
      callback(new Error(err), null);
    } else {
      if (codeResult && codeResult.length > 0) {
        var codeObj = codeResult[0];
        if (!codeObj.individual) {
          codeObj.individual = "no"
        }
        codeObj.date_created = moment.utc().toDate();
        codeObj.code_text = uslug(campaignObj.code_text);
        codeObj.code_slug = uslug(campaignObj.code_text);
        codeObj.goal = campaignObj.goal;
        codeObj.title = campaignObj.title;
        codeObj.user_id = campaignObj.user_id;
        codeObj.team_campaign = 'no';
        codeObj.charity_default = 'no';
        codeObj.individual = codeResult[0].individual;
        codeObj.description = campaignObj.description;
        codeObj.app_fee = codeResult[0].app_fee;
        // codeObj.status =codeResult[0].individual;
        if (campaignObj.team_picture_url) {
          codeObj.code_picture_url = campaignObj.team_picture_url;
        } else {
          codeObj.code_picture_url = codeResult[0].code_picture_url
        }
        /*if (!campaignObj.team_picture_url) {
          campaignObj.code_picture_url = codeResult[0].code_picture_url;
        } else {
          campaignObj.code_picture_url = campaignObj.team_picture_url;
        }
        // if (!codeObj.suggested_donation) {
        //   codeObj.suggested_donation = 25.00; // This will be the default suggested donation
        // }*/

        campaignObj.mainCampaignSlug = codeObj.slug;
        campaignObj.originalCampaignTitle = codeObj.title;
        campaignObj.slug = uslug(campaignObj.code_text);
        codeObj.team_id = campaignObj.team_id;
        codeObj.donotallow_p2p_campaigns = "yes";
        codeObj.donotallow_team_campaigns = "yes";
        //TODO: Why are we removing the slug and we should not?
        delete codeObj['slug'];
        delete codeObj['id'];
        excuteQuery.insertAndReturnKey(sqlQueryMap['defaultCodeInsert'], codeObj, function(err, rows) {
          if (err) {
            callback(new Error(err), null);
          } else {
            codeObj.id = rows;
            codeObj.slug = uslug(campaignObj.code_text);
            //need to update the created in team_invitees_tbl

            async.parallel({
              entityCreation: function(entityCallback) {
                var entityObj = {};
                entityObj.entity_type = 'code';
                entityObj.entity_id = rows;
                entityObj.slug = uslug(campaignObj.code_text);
                excuteQuery.insertAndReturnKey(sqlQueryMap['codeEntityInsert'], entityObj, function(err, entityrows) {
                  entityObj.id = entityrows;

                  agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
                  entityCallback(null, entityrows);
                  var codeUserObj = {};
                  codeUserObj.originalslug = entityObj.slug;
                  codeUserObj.slug = entityObj.slug;
                  codeUserObj.entity_id = entityrows;
                  charityService.storeUserNames(codeUserObj, function(err, data) {});
                });
              },
              InviteeCreatedUpdate: function(InviteeCallback) {
                var obj = {};
                obj.action_date = moment.utc().toDate();
                excuteQuery.queryForAll(sqlQueryMap['updatingTeamCreated'], [obj.action_date, campaignObj.team_id, campaignObj.user_id], function(err, rows) {
                  if (err) {
                    utility.nodeLogs('ERROR', 'error occured while updating the created in team_invitees_tbl');
                    InviteeCallback(new Error(err), null);
                  } else {
                    InviteeCallback(null, null);
                  }
                });
              }
            }, function(err, result) {
              if (err) {
                callback(err, null);
              } else {
                console.log("campaign successflly")
                callback(null, codeObj);
                agenda.now('Send mail for team fundraise creation', campaignObj)
                agenda.now('Send mail to teammember for fundraise creation', campaignObj)
                 // agenda.now('send promote mail to campaign creator',codeObj);
        // dripCampaign.sendTeamApprovalToCampaignOwner(codeObj,function(err,result){
        //   if(err){
        //     console.log("error occuresd while sending the mail");
        //   }else{
        //     console.log("Mail sent successfully to the campaign owner");
        //   }
        // })
                campaignObj.alias_code_id = rows;
              }
            });
          }
        });
        //
      } else {
        callback('something broken', null);
      }
    }
  });
}
exports.sendp2pApprovalToCampaignOwner = function(codeObj, id, teamResults, callback) {
  var name = teamResults.name.replace(/ +/g, ' ');
  var nameArray = name.split(' ');
  if (nameArray && nameArray.length > 1) {
    teamResults.first_name = nameArray[0];
    teamResults.last_name = nameArray[1];
  }
  async.each(codeObj, function(eachObject, eachCallback) {
    var finalobjectmandril = {};
    finalobjectmandril.from = props.fromemail;
    finalobjectmandril.email = eachObject.email;
    finalobjectmandril.text = "";
    finalobjectmandril.subject = "Peer-to-peer approval request for " + eachObject.title;
    finalobjectmandril.template_name = " P2p approval request to campaign admin";
    finalobjectmandril.template_content = [{
      "name": "accept_url",
      "content": "*|ACCEPT_URL|*"
    }, {
      "name": "deny_url",
      "content": "*|DENY_URL|*"
    }, {
      "name": "campaign_name",
      "content": "*|CAMPAIGN_NAME|*"
    }, {
      "name": "first_name",
      "content": "*|FIRST_NAME|*"
    }, {
      "name": "last_name",
      "content": "*|LAST_NAME|*"
    }, {
      "name": "email",
      "content": "*|EMAIL|*"
    }, {
      "name": "team_name",
      "content": "*|TEAM_NAME|*"
    }, {
      "name": "campaign_owner",
      "content": "*|CAMPAIGN_OWNER|"
    }, {
      "name": "p2p_creator",
      "content": "*|P2P_CREATOR|*"
    }];

    finalobjectmandril.merge_vars = [{
      "name": "ACCEPT_URL",
      "content": props.domain + '/pages/peertopeer/approval/' + eachObject.admin_user_id + '?cid=' + id + '&type=approve'
    }, {
      "name": "DENY_URL",
      "content": props.domain + '/pages/peertopeer/approval/' + eachObject.admin_user_id + '?cid=' + id + '&type=delete'
    }, {
      "name": "CAMPAIGN_NAME",
      "content": eachObject.title
    }, {
      "name": "FIRST_NAME",
      "content": teamResults.first_name
    }, {
      "name": "LAST_NAME",
      "content": teamResults.last_name
    }, {
      "name": "EMAIL",
      "content": teamResults.email
    }, {
      "name": "TEAM_NAME",
      "content": teamResults.title
    }, {
      "name": "CAMPAIGN_OWNER",
      "content": eachObject.name
    }, {
      "name": "P2P_CREATOR",
      "content": teamResults.name
    }];

    utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, reuslt);
      }
      /*>>>>>>> 1fa7b2bb939ba9de23f74818606c1c77c6039016
       */
    });
  })
};
exports.teamInviteMembersEmail = function(obj, email, callback) {
  var finalobjectmandril = {};
  finalobjectmandril.from = props.fromemail;
  finalobjectmandril.email = email;
  finalobjectmandril.text = "";
  finalobjectmandril.subject = "Help " + obj.originalCampaignTitle + " campaign on WonderWe";
  finalobjectmandril.template_name = "invite-team-fundraiser-contacts";
  finalobjectmandril.template_content = [{
    "name": "user_full_name",
    "content": "*|USER_FULL_NAME|*"
  }, {
    "name": "subject",
    "content": "*|SUBJECT|*"
  }, {
    "name": "team_name",
    "content": "*|TEAM_NAME|*"
  }, {
    "name": "campaign_name",
    "content": "*|CAMPAIGN_NAME|*"
  }, {
    "name": "campaign_image",
    "content": "*|CAMPAIGN_IMAGE|*"
  }, {
    "name": "team_goal",
    "content": "*|TEAM_GOAL|*"
  }, {
    "name": "user_email_address",
    "content": "*|USER_EMAIL_ADDRESS|*"
  }, {
    "name": "personal_message",
    "content": "*|PERSONAL_MESSAGE|*"
  }, {
    "name": "team_content",
    "content": "*|TEAM_CONTENT|*"
  }, {
    "name": "campaign_url",
    "content": "*|CAMPAIGN_URL|*"
  }, {
    "name": "user_profile_img",
    "content": "*|USER_PROFILE_IMG|*"
  }, {
    "name": "donate_url",
    "content": "*|DONATE_URL|*"
  }];

  finalobjectmandril.merge_vars = [{
    "name": "USER_FULL_NAME",
    "content": obj.user_full_name
  }, {
    "name": "SUBJECT",
    "content": "Help " + obj.originalCampaignTitle + " campaign on WonderWe"
  }, {
    "name": "TEAM_NAME",
    "content": obj.title
  }, {
    "name": "CAMPAIGN_NAME",
    "content": obj.originalCampaignTitle
  }, {
    "name": "CAMPAIGN_IMAGE",
    "content": obj.code_picture_url
  }, {
    "name": "TEAM_GOAL",
    "content": obj.currency_symbol + numeral(obj.goal).format('0,0')
  }, {
    "name": "USER_EMAIL_ADDRESS",
    "content": obj.email
  }, {
    "name": "PERSONAL_MESSAGE",
    "content": obj.personal_message
  }, {
    "name": "TEAM_CONTENT",
    "content": obj.description
  }, {
    "name": "CAMPAIGN_URL",
    "content": props.domain + '/' + obj.slug
  }, {
    "name": "USER_PROFILE_IMG",
    "content": obj.profile_pic_url
  }, {
    "name": "DONATE_URL",
    "content": props.domain + '/' + obj.slug + '?donate=true'
  }];

  utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, reuslt);
    }
  });
};


exports.campaignMembersCreation = function(obj, callback) {
  if (obj.members) {
    var members = obj.members.split(',');
    var me = this;

    async.eachSeries(members, function(singleObj, eachCallback) {
      //var email = singleObj.email.toLowerCase().trim();
      var email = singleObj.toLowerCase().trim();
      var name = singleObj.split('@')[0];
      /*  if (!singleObj.firstname && !singleObj.lastname) {
          var name = singleObj.email.split('@')[0];
        } else {
          var name = singleObj.firstname + ' ' + singleObj.lastname;
        } */

      pool.query('select * from user_tbl where email=?', [email], function(err, userResult) {
        if (err) {
          eachCallback(null);
        } else {

          if (userResult && userResult.length > 0) {
            var memberObj = {};
            memberObj.user_id = userResult[0].id;
            memberObj.code_id = obj.alias_code_id;
            memberObj.created_user = 'no';
            pool.query('INSERT INTO team_campaign_members_tbl SET ?', memberObj, function(err, teamResult) {
              me.teamInviteMembersEmail(obj, email, function(err, emailResult) {});
              eachCallback(null);
            });
          } else {

            // We need to create a new user and use that user_id;
            charityService.checkUserEmailExistOrNot(email, name, function(err, userRegisterResult) {

              var memberObj = {};
              memberObj.user_id = userRegisterResult.id;
              memberObj.code_id = obj.alias_code_id;
              memberObj.created_user = 'no';
              pool.query('INSERT INTO team_campaign_members_tbl SET ?', memberObj, function(err, teamResult) {
                me.teamInviteMembersEmail(obj, email, function(err, emailResult) {});
                eachCallback(null);
              });
              //    eachCallback(null);
            });
          }
        }
      });
    }, function(err) {
      callback(null, 'DOne well..');
    });
  } else {
    callback(null, 'Done well');
  }

};
exports.getDonorTeams = function(userid, skip, limit, callback) {
  var skipVal, limitVal, objData = [];
  skipVal = parseInt(skip);
  limitVal = parseInt(limit);

  excuteQuery.queryForAll(sqlQueryMap['donorTeamCampaigns3'], [userid, userid, limitVal], callback);
}

exports.getDonorTeamDetails = function(codeid, userid, callback) {

  excuteQuery.queryForAll(sqlQueryMap['teamCampainInformation'], [userid, codeid], callback);
}

exports.checkIfTeamCampaign = function(codeid, callback) {

  excuteQuery.queryForAll(sqlQueryMap['isTeamCampaign'], [codeid], callback);
}



exports.updateDonorTeam = function(obj, codeid, callback) {
  //callback(null, obj);
  var me = this;
  obj.type = "update";
  obj.slug = uslug(obj.code_text);

  charityService.validateEntitySlug(obj, function(result) {

    if (result.data) {
      excuteQuery.queryForAll(sqlQueryMap['updateDonorTeamCampaigns'], [obj.team_name, obj.code_picture_url,obj.code_picture_url, obj.code_text, obj.goal, obj.code_text, obj.description, obj.codeid], callback);
      excuteQuery.queryForAll(sqlQueryMap['getEntity'], [obj.codeid, 'code'], function(err, rows) {
        var entityObj = {};
        entityObj.entity_id = obj.codeid;
        entityObj.entity_type = 'code';
        entityObj.id = rows[0].id;
        entityObj.slug = rows[0].slug;
        entityObj.update = 'update';
        //agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
        me.createCampaignUserCharityInElasticSearch(entityObj, function(err, result) {
          if (err) {
            console.log(err);
          } else {
            console.log(result);
          }
        });
      });
    } else {

      callback(new Error(JSON.stringify({
        'errors': ['WeCode already in use, choose different one'],
        status: 400
      })), null);
    }

  });
}

exports.campaignAnalyticsData = function(codeobj, callback) {
  // gets additional campaign data that is missing from state.campaign object
  excuteQuery.queryForAll(sqlQueryMap['augmentCampaignData'], [codeobj.codeid], function(err, additionalData) {
    if (err) {
      callback(new Error(err), null);
    } else {
      var data = {};
      data.additionalData = additionalData;

      // array of individual transactions
      excuteQuery.queryForAll(sqlQueryMap['getCampaignAnalytics'], [codeobj.codeid], function(err, transactionsData) {
        if (err) {
          callback(new Error(err), null);
        } else {
          data.transactionsData = transactionsData;

          excuteQuery.queryForAll(sqlQueryMap['getAverageCampTransaction'], [codeobj.codeid], function(err, avgtransactions) {
            if (err) {
              callback(new Error(err), null);
            } else {
              data.avgtransactions = avgtransactions;
              callback(null, data);
              // excuteQuery.queryForAll(sqlQueryMap['getIndividualCampFunding'], [codeobj.codeid], function(err, individualfunding) {
              //   if (err) {
              //     callback(new Error(err), null);
              //   } else {
              //     data.individualfunding = individualfunding;
              //     callback(null, data);
              //   }
              //  });
            }
          });
        }
      });
    }
  });

}

exports.campaignCharityClaim = function(charityid, callback) {
  // gets additional campaign data that is missing from state.campaign object

  excuteQuery.queryForAll(sqlQueryMap['getCharityByCampaign'], [charityid], function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, data);
    }
  });

}



/**
 * This function will gives the status of the campaign of a non profit organization  which is creating by the user
 * based on charity_claim_tbl values .If the record was exists for charity and approval_date is
 * also exists then the campaign status will be 'APPROVED'.
 * If the record exists and no approval_date then status will be 'PENDING'
 * If the record does not exists then the status will be 'NOT_CLAIMED'
 *
 * @param  {}   charity_id [description]
 * @param  {Function} callback   [description]
 * @return {Function} callback   [Return object type data in callback]
 */

exports.getCodeStatusFromCharity = function(charity_id, callback) {
  var data = {};
  console.log("chrieghb....")
  console.log(charity_id);
  excuteQuery.queryForAll(sqlQueryMap['checkCharityClaimById'], [charity_id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {

      if (result[0]) {
        if (result[0].approval_date) {
          data.code_status = 'published';
        } else {
          utility.nodeLogs('INFO', 'In pending status of the charity claim');
          data.code_status = 'draft';
        }
      } else {
        data.charity_status = 'NOT_CLAIMED';
        data.code_status = 'draft';
      }
      callback(null, data);
    }
  });
}


exports.teamCampaignTrackingData = function(codeobj, callback) {
  // Get team members

  // select * from team_campaign_members_tbl where code_id =? and created_user != 'yes';
  //excuteQuery.queryForAll(sqlQueryMap[''], [codeobj.codeid, codeobj.userid], function(err, data) {

  pool.query("select * from team_campaign_members_tbl where code_id =? and created_user != 'yes'", [codeobj.codeid], function(err, data) {
    if (err) {
      callback(new Error(err), null);
    } else {

      if (data && data.length > 0) {
        var userids = underscore.uniq(underscore.compact(underscore.pluck(data, 'user_id'))).join(',');
        excuteQuery.queryForAll(sqlQueryMap['teamCampaignTrack'], [codeobj.codeid, codeobj.codeid, codeobj.codeid, userids], function(err, trackingData) {
          if (err) {
            callback(new Error(err), null);
          } else {
            callback(err, trackingData);
          }
        });
      } else {
        callback(null, []);
      }
    }
  });
}

exports.getCodeById = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCodeById'], [codeId],
    function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else {
        if (result[0]) {
          callback(null, result[0]);
        } else {
          callback({
            error: 'Campaign not found '
          }, null);
        }
      }
    });
}

exports.updateCharityCodeStatus = function(charity_id, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['getdefaultcodedata'], [charity_id], function(err, codeInfo) {
    if (codeInfo && codeInfo.length > 0) {

      async.eachSeries(codeInfo, function(codeObj, codeCallback) {
        excuteQuery.queryForAll(sqlQueryMap['getEntity'], [codeObj.id, 'code'], function(err, entityInfo) {
          if (err) {
            callback(new Error(err), null);
          } else {
            var entityObj = {};
            entityObj.entity_id = codeObj.id;
            entityObj.entity_type = 'code';
            //entityObj.update = "update";
            if (entityInfo && entityInfo.length > 0) {
              entityObj.id = entityInfo[0].id;
              entityObj.slug = entityInfo[0].slug;
            }
            entityObj.update = true;
            me.createCampaignUserCharityInElasticSearch(entityObj, function(err, result) {
              if (err) {
                utility.nodeLogs('ERROR', {
                  message: 'Error in updating we code belongs to charity status in elastic ',
                  err: err,
                  codeObj: codeObj
                });
              } else {
                utility.nodeLogs('INFO', {
                  message: 'Successfully updated code status in elastic to publish after we pay ',
                  codeObj: codeObj
                });
              }

            });
            // agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
            codeCallback(null);
          }
        });
      }, function(err) {
        console.log('err', err);
        callback(null, codeInfo);
      });
    } else {
      console.log('No codes found');
      callback(null, codeInfo);
    }
  });
}
exports.getUserCampaigns = function(userId, callback) {
  console.log("In service");
  var parentCampaigns = []

  excuteQuery.queryForAll(sqlQueryMap['getUserCampaigns'], [userId, userId],
    function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else {
        console.log("hellodear")
        console.log(result);
        if (result && result.length) {
          console.log("Im inbbfbdsbsfj")
          async.each(result, function(teamData, eachCallback) {
            console.log(teamData);
            if (teamData.team_id && teamData.team_campaign == "no") {
              excuteQuery.queryForAll(sqlQueryMap['getParentCampDetails'], [teamData.team_id], function(err, result) {
                console.log("hello there....");
                console.log(result);
                if (result && result.length) {
                  teamData.teamParentOfflineDeny = result[0].team_offline_deny;
                  parentCampaigns.push(teamData);
                }
                eachCallback(null)

              })
            } else {
              parentCampaigns.push(teamData);
              eachCallback(null)
            }
          }, function(err) {
            console.log(parentCampaigns.length);
            callback(err, parentCampaigns);
          });
        } else {
          callback(null, result);

        }
      }
    });
}



//  send mails to p2p admins
exports.sendMailsTop2pAdmins = function(codeId, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCodeById'], [codeId], function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', 'error occured while getting the campaignName');
    } else {
      if (result && result[0]) {
        var mainCampaignName = result[0].title;

        excuteQuery.queryForAll(sqlQueryMap['sendMailsTop2pAdmins'], [codeId], function(err, result) {
          if (err) {
            utility.nodeLogs('ERROR', 'error occured in while getting p2p admin details');
          } else {
            if (result && result[0]) {
              async.each(result, function(eachObject, eachCallback) {
                eachObject.mainCampaignName = mainCampaignName;
                var mandrilObject = {};
                mandrilObject.from = props.fromemail;
                mandrilObject.text = "";
                mandrilObject.subject = mainCampaignName + " has been unpublished";
                mandrilObject.template_name = "Alert to p2p campaign admin";
                mandrilObject.email = eachObject.email;
                var current_year = moment.utc().format('YYYY');

                mandrilObject.template_content = [{
                  "name": "name",
                  "content": "*|NAME|*"
                }, {
                  "name": "maincampaignname",
                  "content": "*|MAIN_CAMPAIGN|*"
                }, {
                  "name": "campaingslug",
                  "content": "*|CAMPAIGN_URL|*"
                }, {
                  "name": "current_year",
                  "content": "*|CURRENT_YEAR|*"
                }];
                mandrilObject.merge_vars = [{
                  "name": "NAME",
                  "content": eachObject.name
                }, {
                  "name": "MAIN_CAMPAIGN",
                  "content": eachObject.mainCampaignName
                }, {
                  "name": "CAMPAIGN_URL",
                  content: props.domain
                }, {
                  "name": "CURRENT_YEAR",
                  "content": current_year
                }];
                utility.mandrillTemplate(mandrilObject, function(err, result) {
                  if (err) {
                    eachCallback();
                    utility.nodeLogs('ERROR', {
                      message: 'error occured in while send the mail to p2p admin'
                    });
                  } else {
                    eachCallback();
                    utility.nodeLogs('INFO', {
                      message: 'Mail sent successfully'
                    });
                  }
                });
              }, function(err) {
                callback(err, null);
              });
            } else {
              utility.nodeLogs('INFO', {
                message: 'No p2p campaigns for this campaign',
                code_id: codeId
              });
              callback(null, {
                message: 'No p2p campaigns for this campaign',
                code_id: codeId
              });
            }
          }
        });
      } else {
        utility.nodeLogs('INFO', 'campaign name is not available');
        callback(null, {
          message: 'Campaign name is not available',
          code_id: codeId
        });
      }
    }
  });
}
exports.addApprovalTeams = function(teamid, callback) {
  var dataObject = {};
  //excuteQuery.queryForAll(sqlQueryMap['checkApproval'], [obj.userId, obj.code_id], function(err, result) {}

}
exports.addApprovalTeamCampaign = function(obj, callback) {
  var resultObject = {};
  /*<<<<<<< HEAD
    excuteQuery.queryForAll(sqlQueryMap['checkApproval'], [obj.userId, obj.code_id], function(err, result) {
      if (err) {
        callback(new Error(err), null);
      } else {
        if (result[0] && result.length > 0) {
          if (result[0].approved_by && result[0].date_deleted) {
            resultObject.deletedby = result[0].name;
            callback(null, resultObject);
          } else if (result[0].approved_by) {
            resultObject.approvedby = result[0].name;
            callback(null, resultObject);
          } else {
            console.log("updateApproverId");
            excuteQuery.queryForAll(sqlQueryMap['updateApproverId'], [obj.userId, obj.code_id], function(err, result1) {
              if (err) {
                callback(new Error(err), null);
              } else {
                if (obj.type == 'approve') {
                  excuteQuery.queryForAll(sqlQueryMap['updateCodeStatus'], ['published', obj.code_id], function(err, result1) {
                    if (err) {
                      callback(new Error(err), null);
                    } else {
                      resultObject.newApprovedby = result[0].name;
                      callback(null, resultObject);
  =======*/
  excuteQuery.queryForAll(sqlQueryMap['checkApproval'], [obj.userId, obj.code_id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (result[0] && result.length > 0) {
        if (result[0].approved_by && result[0].date_deleted) {
          resultObject.deletedby = result[0].name;
          callback(null, resultObject);
        } else if (result[0].approved_by) {
          resultObject.approvedby = result[0].name;
          callback(null, resultObject);
        } else {
          excuteQuery.queryForAll(sqlQueryMap['updateApproverId'], [obj.userId, obj.code_id], function(err, result1) {
            if (err) {
              callback(new Error(err), null);
            } else {
              if (obj.type == 'approve') {
                excuteQuery.queryForAll(sqlQueryMap['updateCodeStatus'], ['published', obj.code_id], function(err, result1) {
                  if (err) {
                    callback(new Error(err), null);
                  } else {
                    resultObject.newApprovedby = result[0].name;
                    excuteQuery.queryForAll(sqlQueryMap['getEntity'], [obj.code_id, 'code'], function(err, rows) {
                      callback(null, resultObject);
                      var entityObj = {};
                      entityObj.entity_id = obj.code_id;
                      entityObj.entity_type = 'code';
                      entityObj.id = rows[0].id;
                      entityObj.slug = rows[0].slug;
                      entityObj.update = 'update';
                      agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
                    });
                  }
                });

              } else if (obj.type == 'delete') {
                excuteQuery.queryForAll(sqlQueryMap['updateDeleterId'], [obj.code_id], function(err, result1) {
                  if (err) {
                    callback(new Error(err), null);
                  } else {
                    resultObject.newDeletedby = result[0].name;
                    callback(null, resultObject);
                  }
                });
              }
              /*>>>>>>> 1fa7b2bb939ba9de23f74818606c1c77c6039016
               */
            }
          });

        }
        /*else if (obj.type == 'delete') {
                       excuteQuery.queryForAll(sqlQueryMap['updateDeleterId'], [obj.code_id], function(err, result1) {
                         if (err) {
                           callback(new Error(err), null);
                         } else {
                           resultObject.newDeletedby = result[0].name;
                           callback(null, resultObject);
                         }
                       });
                     }*/
      }
      // });
    }
    // }
    //  }
  });
}

exports.checkP2pApproval = function(codeId, callback) {
  var resultObject = {};
  excuteQuery.queryForAll(sqlQueryMap['checkP2pApproval'], [codeId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      if (result.length) {
        resultObject.approvedby = result[0].approved_by;
        callback(null, resultObject);
      } else {
        callback(null, resultObject);
      }
    }
  });
}
exports.teamInviteesDelete = function(obj, callback) {
  var emailObj = {};
  obj.action_date = moment.utc().toDate();
  excuteQuery.queryForAll(sqlQueryMap['gettingTeamDetails'], [obj.teamid], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      if (result && result[0]) {
        emailObj.team_name = result[0].team_name;
        excuteQuery.queryForAll(sqlQueryMap['checkemailactteam'], [obj.teamid, result[0].tc_user_id], function(err, result) {
          if (err) {
            callback(err, null)
          } else {
            if (result && result[0]) {
              emailObj.invited_name = result[0].name;
              emailObj.invited_email = result[0].email;
              excuteQuery.queryForAll(sqlQueryMap['checkemailactteam'], [obj.teamid, obj.userid], function(err, result) {
                if (err) {
                  utility.nodeLogs('ERROR', 'Error occured in while getting the  user details')
                  callback(err, null)
                } else {
                  if (result && result[0]) {
                    emailObj.invitee_name = result[0].name;
                    var value = sqlQueryMap["checkTeamInvitee"];
                    value += ' and deleted_by is null';
                    excuteQuery.queryForAll(value, [obj.userid, obj.teamid, obj.userid], function(err, result) {
                      if (err) {
                        utility.nodeLogs('ERROR', 'error occured in while getting the team invitees');
                        callback(err, null)
                      } else {
                        if (result && result[0]) {
                          if (result[0].created == "yes") {
                            var denyObj = {};
                            denyObj.created = 'created';
                            callback(null, denyObj)
                          } else {

                            excuteQuery.queryForAll(sqlQueryMap['deleteTeamInvitee'], [obj.userid, obj.action_date, obj.teamid, obj.userid], function(err, deleteInvitee) {
                              if (err) {
                                callback(err, null)
                              } else {
                                var denyObj = {};
                                denyObj.denynow = 'now';
                                callback(null, denyObj)
                                agenda.now('rejection of team invitation', emailObj);
                              }
                            });
                          }
                        } else {
                          utility.nodeLogs('INFO', 'no information about team invitee');
                          var denyObj = {};
                          denyObj.denyalready = 'already';
                          callback(null, denyObj)
                        }
                      }
                    });
                  } else {
                    callback(null, null)
                  }
                }
              });
            } else {
              utility.nodeLogs('INFO', 'no user details found')
              callback(null, null)
            }
          }
        });
      } else {
        utility.nodeLogs('INFO', 'no team details found')
        var denyObj = {};
        denyObj.noTeam = 'yes';
        callback(null, denyObj)
      }
    }
  });

}

exports.getCurrencySymbol = function(id, callback) {
  excuteQuery.queryForAll(sqlQueryMap['getCampaignCurrency'], [id], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      console.log(result);
      callback(null, result);
    }
  });
};

exports.getCharityCodesWithPaymentId = function(obj, callback) {
  if (obj.type === 'charity') {
    var query = 'charityCodesWithPaymentId';
  } else {
    query = 'fundraiserwithPaymentId';
  }
  excuteQuery.queryForAll(sqlQueryMap[query], [obj.id], function(err, rows) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, rows);
    }
  });
};

exports.updateCampaignAdditional = function(obj, callback) {
   async.parallel({
    updateMaincampaign:function(callback){
    excuteQuery.queryForAll(sqlQueryMap['updateCampaignAdditional'], [obj.can_mailing_required, obj.donation_alert_required, obj.p2p_approval_required, obj.p2p_offlinedonation_deny, obj.donotallow_p2p_campaigns, obj.team_approve, obj.team_offline_deny, obj.donotallow_team_campaigns, obj.campaignid, obj.campaignid], function(err, result) {
    if (err) {
      callback(new Error(err), null)
    } else {
      utility.nodeLogs('INFO','updated main fundraiser');
      callback(null, result)
    }
    });
  },
    updateP2PCampaigns:function(callback){
     excuteQuery.queryForAll(sqlQueryMap['updateCampaignAdditionalToP2P'], [obj.p2p_offlinedonation_deny,obj.campaignid], function(err, result) {
    if (err) {
      callback(new Error(err), null)
    } else {
      utility.nodeLogs('INFO','updated p2p fundraisers');
      callback(null, result)
    }
  });
    },
    updateTeamFundraisers:function(callback){
    excuteQuery.queryForAll(sqlQueryMap['updateCampaignAdditionalToTeamFundraisers'], [obj.team_offline_deny,obj.campaignid], function(err, result) {
    if (err) {
      callback(new Error(err), null)
    } else {
      utility.nodeLogs('INFO','updated team fundraisers')
      callback(null, result)
    }
  });
    }
  },function(err,result){
    if(err){
      callback(err,null);
    }else{
      callback(null,result);
    }
  })
};

exports.reportCampaign = function(campaignObj, callback) {
  var me = this;
  var date_created = moment.utc().toDate();
  excuteQuery.queryForAll(sqlQueryMap['insertReportCampaign'], [campaignObj.codeid, campaignObj.email, campaignObj.fullname, campaignObj.phone, campaignObj.reason, date_created, campaignObj.evidence_picture_url, campaignObj.country], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      excuteQuery.queryForAll(sqlQueryMap['reportcampaigndetails'], [campaignObj.codeid], function(err, res) {
        if (err) {
          callback(new Error(err), null);
        } else {
          campaignObj.campaigndata = res[0];
          me.sendReportEmailToWWAdmins(campaignObj, function(err, res1) {
            if (err) {
              console.log(err);
              callback(new Error(err), null);
            } else {
              console.log(res1);
              callback(null)
            }
          });
        }
      });
    }
  });
};

exports.getUserDataWithId = function(userid, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['getUserProfile'], [userid], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      callback(null, result);
    }
  });
};

exports.sendReportEmailToWWAdmins = function(obj, callback) {
  excuteQuery.queryForAll(sqlQueryMap['charityAdminEmails'], function(err, result) {
    if (err) {
      console.log('error');
    } else {
      var newClaimObj = {};
      newClaimObj.email_address = underscore.pluck(result, 'email');
      async.each(newClaimObj.email_address, function(ele, eachCallback) {
        var finalobjectmandril = {};
        finalobjectmandril.from = props.fromemail;
        finalobjectmandril.email = ele;
        finalobjectmandril.text = "";
        finalobjectmandril.subject = obj.fullname + " reported the campaign " + obj.campaigndata.title;
        finalobjectmandril.template_name = "Reportcampaign information to ww admin";
        finalobjectmandril.template_content = [{
          "name": "first_name",
          "content": "*|FIRST_NAME|*"
        }, {
          "name": "campaign_creator",
          "content": "*|CAMPAIGN_CREATOR|*"
        }, {
          "name": "email",
          "content": "*|EMAIL|*"
        }, {
          "name": "campaignurl",
          "content": "*|CAMPAIGN_URL|*"
        }, {
          "name": "teamnname",
          "content": "*|TEAM_NAME|*"
        }, {
          "name": "campcreator_email",
          "content": "*|CAMPCREATOR_EMAIL|*"
        }, {
          "name": "report_count",
          "content": " *|REPORT_COUNT|*"
        }];

        finalobjectmandril.merge_vars = [{
          "name": "FIRST_NAME",
          "content": obj.fullname
        }, {
          "name": "CAMPAIGN_CREATOR",
          "content": obj.campaigndata.campaignowner
        }, {
          "name": "EMAIL",
          "content": obj.email
        }, {
          "name": "CAMPAIGN_URL",
          "content": props.domain + '/' + obj.campaigndata.code_text
        }, {
          "name": "TEAM_NAME",
          "content": obj.campaigndata.title
        }, {
          "name": "CAMPCREATOR_EMAIL",
          "content": obj.campaigndata.campemail
        }, {
          "name": "REPORT_COUNT",
          "content": obj.campaigndata.reportcount
        }];

        utility.mandrillTemplate(finalobjectmandril, function(err, reuslt) {
          if (err) {
            eachCallback(err, null);
          } else {
            eachCallback(null, reuslt);
          }
        });
      }, function(err) {
        callback(err, true);
      });
    }
  });
};

exports.sendMail = function(obj, callback) {
    var me = this;
    me.sendMailToFriends(obj, function(err, result) {
      if (err) {
        console.log("error")
      } else {
        callback(null, { 'status': 'sucess' })
      }
    });
  },

  exports.checkAndSetAsCharityDefault = function(data, callback) {
    async.waterfall([
      function(callback) {
        excuteQuery.queryForAll(sqlQueryMap['checkCharityHasDefault'], [data.charity_id], function(err, result) {
          if (err) {
            callback(err, null);
          } else if (result[0]) {
            console.log(result[0]);
            callback({ error: 'Exists' }, null);
          } else {
            callback(null, true);
          }
        });
      },
      function(done, callback) {
        excuteQuery.queryForAll(sqlQueryMap['checkUserOwnerForCharity'], [data.user_id, data.charity_id], function(err, result) {
          if (err) {
            callback(err, null);
          } else if (result[0]) {
            callback(null, true);
          } else {
            callback({ error: 'Not owner' }, null);
          }
        });
      },
      function(done, callback) {
        excuteQuery.update(sqlQueryMap['setAsCharityDefault'], [data.id], function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, { message: 'Campiagn set as charity default ', data: JSON.stringify(data) });
          }
        });
      }
    ], function(err, result) {
      if (err) {
        if (err.error === 'Exists') {
          callback(null, { message: 'Charity already have default campaign' });
        } else if (err.error === 'Not owner') {
          callback(null, { message: 'Campiagn creator is not owner' });
        } else {
          callback(err, null);
        }
      } else {
        callback(null, result);
      }
    });
  };

//code
exports.sendMailToFriends = function(codeObjects, callback) {
  async.each(codeObjects.invitedusers, function(singleObj, eachCallback) {
    var mandrilObject = {};
    mandrilObject.from = props.fromemail;
    mandrilObject.text = "";
    mandrilObject.subject = "Mail from WonderWe";
    mandrilObject.email = singleObj.email;
    mandrilObject.reply = codeObjects.email;
    mandrilObject.template_name = "Send Invitation Mail To Friend";
    mandrilObject.template_content = [{
      "name": "message",
      "content": "*|MESSAGE|*"
    }, {
      "name": "linktohome",
      "content": "*|HOMEPAGE|*"
    }];
    mandrilObject.merge_vars = [{
      "name": "MESSAGE",
      "content": codeObjects.message
    }, {
      "name": "HOMEPAGE",
      "content": props.domain
    }];
    utility.mandrillTemplate(mandrilObject, function(err, result) {
      if (err) {
        eachCallback(null);
        utility.nodeLogs('ERROR', {
          message: 'Error in send mail to friends',
          error: err
        });
      } else {
        eachCallback(null);
        utility.nodeLogs('INFO', {
          message: 'Successfully sent mail to friends',
          result: result
        });
      }
    });

  }, function(err) {
    utility.nodeLogs({
      message: 'Successfully sent total messages'
    });
    callback(null, {
      success: true
    });
  });

};
exports.addWePayEmail = function(codeObject, callback) {
  excuteQuery.queryForAll(sqlQueryMap['checkAdminEmail'], [codeObject.wePayEmailData.email], function(err, userRecord) {
    if (err) {
      console.log(err);
      callback1(err);
    } else {
      //for existing user
      if (userRecord && userRecord.length > 0 && userRecord[userRecord.length - 1].date_deleted === null) {
        //checking while edit
        codeObject.weEmailId = userRecord[userRecord.length - 1].id;
        console.log("camehre .......in charity caaljhsjh");
        console.log(codeObject.weEmailId);
        if (codeObject.from == "charity") {
          pagesService.charitySignUp(codeObject, callback)

        } else {
          charityService.addCharityClaim(codeObject, callback);
        }
      } else {
        var senderEmailName = codeObject.wePayEmailData.firstname + '' + codeObject.wePayEmailData.lastname;
        var verification_key = uuid.v4() + "-" + uslug(senderEmailName);
        var date = moment.utc().toDate();
        excuteQuery.insertAndReturnKey(sqlQueryMap['importdata'], [senderEmailName, codeObject.wePayEmailData.email, verification_key, date], function(err, userId) {
          if (err) {
            callback1(err);
          } else {
            async.parallel({
              enitycreation: function(callback) {
                console.log("entitycreation")
                var userEntity = {};
                userEntity.entity_id = userId;
                userEntity.entity_type = "user";

                var count = 1;
                var usrSlug = uslug(senderEmailName);
                var originlSlug = uslug(senderEmailName);
                console.log(originlSlug);
                var userDetailsObject = {
                  count: 1,
                  name: senderEmailName
                };
                charityService.entitySlugCreation(userEntity, usrSlug, userDetailsObject, originlSlug, function(err, userEntityId) {
                  if (err) {
                    callback(err, null);
                  } else {
                    console.log("userid");
                    userEntity.id = userEntityId;
                    callback(null, userId);
                  }
                });
              },
              updateUserprofile: function(callback) {
                console.log("userlkjkj")
                var timezone_id = 381;
                excuteQuery.queryForAll(sqlQueryMap['useIdAddToUserProfile'], [userId, timezone_id], function(err, userResult) {
                  if (err) {
                    callback(err, null);
                  } else {
                    console.log("updateuserprofile")
                    callback(null, userId);
                  }
                });
              },
              insertIntoClaim: function(callback) {
                console.log("insert intio claim");
                console.log(userId);
                codeObject.weEmailId = userId;
                if (codeObject.from == "charity") {
                  pagesService.charitySignUp(codeObject, callback)

                } else {
                  charityService.addCharityClaim(codeObject, callback);
                }

              }
            }, function(err, results) {
              console.log("ayncasbnsnparalleel")
              if (err) {
                utility.log('error', "userDataStore from page route - ");
                callback(err, null);
              } else {
                callback(null, results);
              }
            });
          }
        })
      }
    }
  })
}
exports.deAuthoriseFacebook = function(userData, callback) {
  var request = require('request');
  request({
    url: 'https://graph.facebook.com/v2.8/' + userData.facebook_id + '/permissions?access_token=' + userData.provider_access_token,
    method: 'Delete'
  }, function(error, response, body) {
    console.log(error);
    console.log("deAuthoriseFacebook");
  });
}

exports.getShareCountsOfCampaigns = function(data, callback) {

  pool.query("select slug from entity_tbl where entity_type='code' ", function(err, entityResult) {
    if (err) {
      utility.nodeLogs('ERROR', { message: 'Error in running background job for getting facebook share count', error: err });
      callback(err, null);
    } else {

      async.each(entityResult, function(singleObj, eachCallback) {
        var url = 'http://free.sharedcount.com/?url=' + props.domain + '/' + singleObj.slug + '&apikey=' + props.shared_count_key;
        request.get({
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          url: url
        }, function(error, response, body, url) {
          if (error) {
            utility.nodeLogs('ERROR', { message: 'Error in getting share count', error: error });
            eachCallback(null, null);
          } else {
            body = JSON.parse(body);
            if (singleObj && singleObj.slug) {
              var fb_count;
              if (typeof body.Facebook === 'object') {
                fb_count = body.Facebook.total_count;
              } else {
                fb_count = body.Facebook;
              }

              pool.query('UPDATE entity_tbl SET facebook_shares= ?, tweets= ?, linkedin= ?, google_plus= ?, pinterest= ? where slug= ?', [fb_count, body.Delicious, body.GooglePlusOne, body.LinkedIn, body.Pinterest, singleObj.slug], function(err, entityResult) {
                if (err) {
                  utility.nodeLogs('INFO', { message: 'Error in updating entity slug' });
                  eachCallback(null, null);
                } else {
                  utility.nodeLogs('INFO', { message: 'Successfully upated facebook information to entity', entity: singleObj });
                  eachCallback(null, null);
                }
              });

            } else {
              eachCallback(null, null);
            }
          }
        });
      }, function(err) {
        if (err) {
          utility.nodeLogs('ERROR', { message: 'Error in async', error: err });
          callback(err, 'done');
        } else {
          callback(err, 'done');
        }
      });
    }
  });
};
