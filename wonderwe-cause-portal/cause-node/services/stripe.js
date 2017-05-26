var TOKEN_URI = 'https://connect.stripe.com/oauth/token';
var AUTHORIZE_URI = 'https://connect.stripe.com/oauth/authorize';
var donationService = require('./donations.js');
var wepayService = require('./wepay.js');
var feedBotSrevice = require('./feedBot');
var fs = require('fs');
var emoji = require('emojione');
var charityServices = require('./charity');

exports.stripeOAuth = function(stripeObj, callback) {
  var me = this;
  request.post({
    url: TOKEN_URI,
    form: {
      grant_type: 'authorization_code',
      client_id: props.stripe_client_id,
      code: stripeObj.code,
      client_secret: props.stripe_secret_key
    }
  }, function(err, r, body) {
    var reponseObj = JSON.parse(body);
    if (reponseObj.error) {

      callback({
        error: reponseObj.error_description
      }, null);

    } else {

      var gateWayObj = {};
      var splitArray = stripeObj.state.split('-');
      if (stripeObj.state.split('-')[1] === 'donor') {
        gateWayObj.user_id = splitArray[0];
        gateWayObj.charity_id = null;
      } else {
        gateWayObj.charity_id = splitArray[0];
        gateWayObj.user_id = splitArray[1];
      }

      gateWayObj.account_id = reponseObj.stripe_user_id;;
      gateWayObj.access_token = reponseObj.access_token;
      gateWayObj.payment_gateway = 'stripe';
      gateWayObj.account_status = 'active';


      excuteQuery.queryForAll(sqlQueryMap['vaidateExistingPaymentGateway'], [gateWayObj.access_token, gateWayObj.account_id, gateWayObj.user_id, gateWayObj.charity_id], function(err, paymentGatewaysResult) {
        if (err) {
          clalback(err, null);
        } else {
          if (paymentGatewaysResult && paymentGatewaysResult.length > 0) {
            if (splitArray[2]) {
              gateWayObj.code_id = splitArray[2];
            }
            gateWayObj.payment_gateway_id = paymentGatewaysResult[0].id;
            stripeObj.account_id = gateWayObj.account_id;
            stripeObj.state = 'active';
            stripeObj.wepay_account_state = 'active';
            if (gateWayObj.code_id && gateWayObj.payment_gateway_id) {
              wepayService.updateCampaignPaymentGateway(gateWayObj, function(err, updatePaymentResult) {});
            }else{
              donationService.updateCharityAndCampaignPaymentGateWays(gateWayObj,function(err,updatePaymentResult){
                console.log('In the success of the update charity and campaign payment gateways');
                console.log(err);
                console.log(result);
               });
            }
            stripeObj.code_id = gateWayObj.code_id;
            callback(null, stripeObj);
          } else {
            excuteQuery.insertAndReturnKey(sqlQueryMap['addPaymentGateWay'], gateWayObj, function(err, rows) {
              if (err) {
                callback(err, null);
              } else {
                gateWayObj.code_id = splitArray[2];
                gateWayObj.payment_gateway_id = rows;
                stripeObj.account_id = gateWayObj.account_id;
                stripeObj.state = 'active';
                stripeObj.wepay_account_state = 'active';
                stripeObj.code_id = gateWayObj.code_id;

                if (gateWayObj.code_id && gateWayObj.payment_gateway_id) {
                  wepayService.updateCampaignPaymentGateway(gateWayObj, function(err, updatePaymentResult) {});
                }else{
                  if(splitArray[1] === 'donor'){
                    donationService.updateMemberCampaignPaymentGateways(gateWayObj,function(err,result){
                      console.log(err);
                      console.log(result);
                    });
                  }else{ 
                    donationService.updateCharityAndCampaignPaymentGateWays(gateWayObj,function(err,updatePaymentResult){
                      console.log('In the success of the update charity and campaign payment gateways');
                      console.log(err);
                      console.log(updatePaymentResult);
                    });  
                  }
                  
                }

                callback(null, stripeObj);
              }
              if (gateWayObj.charity_id) {
                reponseObj.charity_id = gateWayObj.charity_id;
                me.insertStripeData(reponseObj, function(err, result4) {});
                //  me.updateElasticData(reponseObj, function(err, elasticresult) {});
              }
            });
          }
        }
      });
    }
  });
};

exports.updateElasticData = function(obj, callback) {

  pool.query('select * from entity_tbl where entity_type=? and entity_id=?', ['charity', obj.charity_id], function(err, entityResult) {
    var entityObj = {};
    entityObj.entity_id = obj.charity_id;
    entityObj.entity_type = 'charity';
    entityObj.slug = entityResult[0].slug;
    entityObj.id = entityResult[0].id;
    entityObj.update = 'update';
    agenda.now('create campaign/donor/charity in elasticsearch', entityObj);
    callback(null, entityObj);
  });
};


exports.insertStripeData = function(stripeObj, callback) {

  var stripeData = {};
  stripeData.charity_id = stripeObj.charity_id;
  stripeData.publishable_key = stripeObj.stripe_publishable_key;
  stripeData.payment_gateway = 'stripe';
  stripeData.stripe_json = JSON.stringify(stripeObj);

  pool.query('INSERT INTO payment_methods SET ?', stripeData, callback);

};

exports.stripeOneTimeCharge = function(donationObj, logsObj, callback) {

  var me = this;

  // var queryName = "getGateWayAccountDetails"
if(donationObj.code_id){
    var queryName = "getGateWayAccountDetails";
     var code_id=donationObj.code_id;
  }else{
    var queryName = "getCharityGateWayAccountDetails";
    var code_id = donationObj.charity_id;
    donationObj.code_id=null;
  }
  excuteQuery.queryForObject(sqlQueryMap[queryName], [code_id], function(err, charityResult) {

    if (err) {
      callback(new Error(err), null);
    } else {
      if (charityResult && charityResult.length > 0) {

        if (donationObj.fundraiser === 'fundraiser') {
          donationObj.charity_id = charityResult[0].charity_id;
        }

        donationObj.verified = charityResult[0].verified;
        var account_id = "";
        if (charityResult[0].account_id) {
          account_id = charityResult[0].account_id;
          donationObj.currency = charityResult[0].currency;
          donationObj.account_type = 'claimed';
        } else {
          if(donationObj.code_id){
          callback(new Error(JSON.stringify({ errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'], status: 400 })), null);
          return false;
        }else{
          callback(new Error(JSON.stringify({ errors: ['Your not able to donate to this charity because owner has submitted in sufficient details'], status: 400 })), null);
          return false;
        }
        }

        if (!donationObj.currency) {
          donationObj.currency = 'USD';
        }
        donationObj.charity_title = charityResult[0].name_tmp;
        donationObj.account_id = account_id;

        if (donationObj.savecard === 'yes') {

          pool.query('select * from credit_card_tbl where user_id=?', [donationObj.user_id], function(err, cardResult) {

            if (err) {
              callback(new Error(err), null);
            } else {

              if (cardResult && cardResult.length > 0 && cardResult[0].customer_id) {

                stripe.customers.createSource(cardResult[0].customer_id, {
                    source: donationObj.stripeToken
                  },
                  function(err, card) {
                    // asynchronously called
                    if (err) {
                      callback(new Error(JSON.stringify({ errors: [err.message], status: 400 })), null);


                    } else {

                      donationObj.stripe_card_id = card.id;

                      stripe.tokens.create({
                          customer: cardResult[0].customer_id,
                          card: donationObj.stripe_card_id
                        }, {
                          stripe_account: donationObj.account_id
                        }, // id of the connected account
                        function(err, token) {

                          if (err) {
                            console.log(err);
                            callback(new Error(JSON.stringify({ errors: [err.message], status: 400 })), null);

                          } else {
                            donationObj.stripeToken = token.id;
                            donationObj.exp_year = card.exp_year;
                            donationObj.last4 = card.last4;
                            donationObj.exp_month = card.exp_month;
                            donationObj.customer_id = cardResult[0].customer_id;
                            donationObj.stripe_card_name = card.brand + " xxxxxx" + card.last4;

                            me.chargeStripeCreditCard(donationObj, logsObj, callback);
                          }

                        });

                    }
                  });

              } else {

                stripe.customers.create({
                  description: 'Welcome to App ',
                  source: donationObj.stripeToken, // obtained with Stripe.js
                  email: donationObj.email,
                  metadata: {
                    charity_id: donationObj.charity_id,
                    user_id: donationObj.user_id,
                    charity_title: charityResult[0].name_tmp,
                    code_id: donationObj.code_id
                  }
                }, function(err, customer) {
                  // asynchronously called
                  if (err) {
                    callback(new Error(JSON.stringify({ errors: [err.message], status: 400 })), null);

                  } else {

                    stripe.tokens.create({
                        customer: customer.id
                          //card: CARD_ID
                      }, {
                        stripe_account: donationObj.account_id
                      }, // id of the connected account
                      function(err, token) {
                        if (err) {
                          callback(new Error(JSON.stringify({ errors: [err.message], status: 400 })), null);
                        } else {

                          donationObj.stripeToken = token.id;
                          donationObj.customer_id = customer.id;
                          donationObj.exp_year = donationObj['cc-year'];
                          donationObj.last4 = donationObj.last4;
                          donationObj.exp_month = donationObj['cc-month'];
                          //   donationObj.stripe_card_name = "Visa xxxxxx" + donationObj['cc-number'].slice(-4);
                          // donationObj.customer_id = cardResult[0].customer_id;
                          me.chargeStripeCreditCard(donationObj, logsObj, callback);

                        }
                      });
                  }
                });
              }
            }
          });

        } else {
          me.chargeStripeCreditCard(donationObj, logsObj, callback);
        }

      } else {
        callback(new Error(JSON.stringify({
          'errors': ['something broken'],
          status: 500
        })), null);
      }


    }
  });

}

exports.stripeExistingCardPayment = function(donationObj, logsObj, callback) {

  var me = this;
  /*  if (donationObj.fundraiser === 'fundraiser') {
      var queryName = "getFundariserAccount";
      var commonId = donationObj.fundraiser_userid;
    } else {
      var queryName = "getAccessToken";
      var commonId = donationObj.charity_id;
    } */
 if(donationObj.code_id){
    var queryName = "getGateWayAccountDetails";
     var code_id=donationObj.code_id;
  }else{
    var queryName = "getCharityGateWayAccountDetails";
    var code_id = donationObj.charity_id;
    donationObj.code_id=null;
  }
  excuteQuery.queryForObject(sqlQueryMap[queryName], [code_id], function(err, charityResult) {

    // excuteQuery.queryForObject(sqlQueryMap['getAccessToken'], [donationObj.charity_id], function(err, charityResult) {
    if (err) {
      callback(new Error(err), null);
    } else {

      if (charityResult && charityResult.length > 0) {
        var account_id = "";
        if (charityResult[0].account_id) {
          account_id = charityResult[0].account_id;
          donationObj.currency = charityResult[0].currency;
          donationObj.account_type = 'claimed';
        } else {
          callback(new Error(JSON.stringify({ errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'], status: 400 })), null);
          return false;
        }

        if (!donationObj.currency) {
          donationObj.currency = 'usd';
        }
        donationObj.verified = charityResult[0].verified;
        donationObj.charity_title = charityResult[0].name_tmp;
        donationObj.account_id = account_id;

        var cardPaymentObj = {};

        cardPaymentObj.customer = donationObj.customer_id;

        if (donationObj.card_id && donationObj.card_id != 'null') {
          cardPaymentObj.card = donationObj.card_id;
        }
        stripe.tokens.create(cardPaymentObj, {
            stripe_account: donationObj.account_id
          }, // id of the connected account
          function(err, token) {
            if (err) {
              callback(new Error(JSON.stringify({ errors: [err.message], status: 400 })), null);

            } else {

              donationObj.stripeToken = token.id;
              me.chargeStripeCreditCard(donationObj, logsObj, callback);
            }
          });

      } else {
        callback({
          'error': 'something broken'
        }, null);
      }
    }
  });
};

exports.chargeStripeCreditCard = function(donationObj, logsObj, callback) {
  // Create the charge on Stripe's servers - this will charge the user's card
  if (!donationObj.app_fee) {
    donationObj.app_fee = 0;
  }


  var chargeObject = {
    amount: new Number((new Number(donationObj.amount + (donationObj.app_fee * donationObj.amount)).toFixed(2)) * 100).toFixed(0), // amount in cents
    currency: donationObj.currency,
    description: "Stripe is in live to collect the money from " + donationObj.user_id + ' to ' + donationObj.code_id,
    application_fee: new Number((new Number(donationObj.app_fee * donationObj.amount).toFixed(2)) * 100).toFixed(0), // amount in cents
    receipt_email: donationObj.email
  };

  chargeObject.source = donationObj.stripeToken;
  chargeObject.metadata = {
    charity_title: donationObj.charity_title,
    user_id: donationObj.user_id,
    charity_id: donationObj.charity_id,
    code_id: donationObj.code_id
  };
  // chargeObject.customer = donationObj.customer_id;
  // chargeObject.card = donationObj.stripe_card_id;
  stripe.charges.create(chargeObject, {
      stripe_account: donationObj.account_id
    },
    function(err, charge) {
      // check for `err`
      if (err) {
        callback(new Error(JSON.stringify({ errors: [err.message], status: 400 })), null);
      } else {

        logsObj.message = "Stripe One time charge done well";
        logsObj.action = "Stripe One time charge done successflly -- Stripe Service : 411";
        utility.nodeLogs('INFO', logsObj);

        async.waterfall([
            function(cardCallback) {
              if (donationObj.savecard == 'yes') {
                // Insert card details into credit_card_tbl;
                var cardObj = {
                  last_four: donationObj.last4,
                  date_added: moment.utc().toDate(),
                  date_expires: null,
                  user_id: donationObj.user_id,
                  token: donationObj.stripeToken,
                  month: donationObj.exp_month,
                  year: donationObj.exp_year,
                  postal_code: donationObj.zip,
                  name: donationObj.name,
                  email: donationObj.email,
                  customer_id: donationObj.customer_id,
                  stripe_card_id: donationObj.stripe_card_id,
                  payment_gateway: 'stripe',
                  card_name: donationObj.brand + ' xxxxxx' + donationObj.last4,
                  stripe_card_country: donationObj.stripe_card_country
                };
                excuteQuery.insertAndReturnKey(sqlQueryMap['saveCreditCard'], cardObj, cardCallback);
              } else {
                cardCallback(null, null);
              }
            },
            function(cardid, tranCallback) {
              // arg1 now equals 'one' and arg2 now equals 'two'
              var transactionObj = {
                'group_donation_id': null,
                'transaction_date': moment.utc().format('YYYY-MM-DD HH:mm:ss'),
                'user_id': donationObj.user_id,
                'charity_id': donationObj.charity_id,
                'code_id': donationObj.code_id,
                'type': "code",
                'amount': donationObj.amount, //charge.amount / 100,
                'refunded_date': null,
                'refunded_amount': null,
                'refund_transaction_id': null,
                'processing_fee': getProcessingFee(donationObj.stripecountry, donationObj.app_fee, donationObj.amount, donationObj.countrycode),
                'wonderwe_fee': new Number(donationObj.app_fee * donationObj.amount).toFixed(2), //Math.round((donationObj.amount * donationObj.app_fee) * 100) / 100,
                'source': "app",
                'user_ip_address': donationObj.ip,
                'withdrawal_process_date': null,
                'transaction_key': null,
                'description': charge.description,
                'account_id': donationObj.account_id,
                'access_token': null,
                'checkout_id': charge.id,
                'checkout_state': charge.status,
                'anonymous': donationObj.anonymous,
                'hide_amount': donationObj.hide_amount,
                'created_date': donationObj.created_date
              };
              if (cardid) {
                transactionObj.card_id = cardid;
                donationObj.card_id = cardid;
              } else {
                transactionObj.card_id = donationObj.user_card_id;
              }
              //inserting the comment into transaction_tbl
              if (donationObj.donor_comment) {
                transactionObj.donor_comment = emoji.toShort(donationObj.donor_comment);
              } else {
                transactionObj.donor_comment = null;
              }
              if (donationObj.givingLevels && donationObj.givingLevels == 'yes') {
                transactionObj.code_level_id = donationObj.giving_id;
              } else {
                transactionObj.code_level_id = ''
              }
              //updating type in transaction tbl
                      if(donationObj.charity_id&&!donationObj.code_id){
                        transactionObj.type="charity";
                      }else{
                        transactionObj.type="code";
                      }
              excuteQuery.insertAndReturnKey(sqlQueryMap['saveDonationTransaction'], transactionObj, tranCallback)
            }
          ],
          function(err, result) {
            if (err) {
              callback(new Error(err), null);
            } else {
              callback(null, donationObj);
                if(donationObj.charity_id&&!donationObj.code_id){
                    donationService.updateCharityDonationEntity(donationObj,function(err,resultCharity){});
                      }else{
                    donationService.donationAmountUpdate(donationObj, function(err, result5) {});
                      }
              donationService.trackDonationData(donationObj, function(err, resulti) {});
              if (donationObj.givingLevels && donationObj.givingLevels == 'yes') {
                donationService.updateGivingLevels(donationObj, function(err, result) {});
              }
              if (donationObj.zip) {
                donationService.donorZipCodeUpdate({
                  user_id: donationObj.user_id,
                  zip: donationObj.zip
                }, function(err, updateDonorResult) {});
              }
              // agenda.now('sendAnEmailToDonater', donationObj);
           
              console.log('Before going to city ,state, country');
              if(donationObj.city && donationObj.state && donationObj.countryCode && donationObj.address_1 && donationObj.address_2){
                        console.log('Came to city state country address_1 address_2');
                        charityServices.checkingCanMailing({
                          userId:donationObj.user_id,
                          city:donationObj.city,
                          state:donationObj.state,
                          country:donationObj.countryCode,
                          address_2:donationObj.address_2,
                          address_1:donationObj.address_1,
                          postal_code:donationObj.zip
                        },function(err,result){
                        //  me.sendEmailToDonater(donationObj, function(err, data) {});
                          console.log('Background job started');
                        agenda.now('sendAnEmailToDonater', donationObj);
                        if(donationObj.code_id){
                        agenda.now('sendAnEmailToCampaignOwnersAndAdmins', donationObj);
                      }
                        });
                      }else{
                      //  me.sendEmailToDonater(donationObj, function(err, data) {});
                        console.log('Background job started');
                      agenda.now('sendAnEmailToDonater', donationObj);
                      if(donationObj.code_id){
                      agenda.now('sendAnEmailToCampaignOwnersAndAdmins', donationObj);
                    }
                      }
              // agenda.now('campaignReachedThresholds', { code_id: donationObj.code_id });
               if(donationObj.code_id){
              //    donationService.sendEmailToDonater(donationObj, function(err, data) {});
              feedBotSrevice.campaignReachedThresholds({ code_id: donationObj.code_id }, function(err, botResponse) {});
              agenda.now('Check fundraiser goal reached or not', { code_id: donationObj.code_id, user_id: donationObj.user_id });
            }
            
            }
          });
      }
    });

};

exports.monthlyDataStorage = function(donationObj, callback) {
  async.parallel({
    card_preference: function(cardCallback) {
      if (donationObj.savecard == 'yes') {
        // Insert card details into credit_card_tbl;
        var cardObj = {
          last_four: donationObj.last4,
          date_added: moment.utc().toDate(),
          date_expires: null,
          user_id: donationObj.user_id,
          token: donationObj.stripeToken,
          month: donationObj['cc-month'],
          year: donationObj['cc-year'],
          postal_code: donationObj.zip,
          name: donationObj.name,
          email: donationObj.email,
          payment_gateway: 'stripe',
          card_name: donationObj.brand + ' xxxxxx' + donationObj.last4,
          stripe_card_id: donationObj.card_id,
          customer_id: donationObj.customer_id
        };

        excuteQuery.insertAndReturnKey(sqlQueryMap['saveCreditCard'], cardObj, cardCallback);
      } else {
        cardCallback(null, null);
      }
    },
    reccurrence_gift: function(giftCallback) {
      // user_id, cahrity_id, amount, gift_interval, interval_value, date_created, date_deleted, code_id
      // gift_interval -- month (or) week
      var giftObj = {
        user_id: donationObj.user_id,
        charity_id: donationObj.charity_id,
        amount: donationObj.amount,
        gift_interval: 'month',
        interval_value: '30',
        date_created: moment.utc().toDate(),
        date_deleted: null,
        code_id: donationObj.code_id,
        subscription_id: donationObj.subscription_id,
        subscription_plan_id: donationObj.subscription_plan_id,
        card_token: donationObj.stripeToken,
        access_token: donationObj.access_token,
        subscription_state: donationObj.status,
        payment_gateway: 'stripe',
        customer_id: donationObj.client_customer_id,
        card_id: donationObj.card

      };
      if (donationObj.noofoccurences) {
        giftObj.noofoccurences = donationObj.noofoccurences;
      }
      console.log(giftObj);
      excuteQuery.insertAndReturnKey(sqlQueryMap['sendMonthlyGift'], giftObj, giftCallback);
      utility.log('info', "sending monthly gift callback Successful ");
    }

  }, function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      console.log(result)
        // Insert data into transaction table..
      console.log('Donation Object:', donationObj);
      var transactionObj = {
        'group_donation_id': null,
        'transaction_date': moment.utc().toDate(),
        'user_id': donationObj.user_id,
        'charity_id': donationObj.charity_id,
        'code_id': donationObj.code_id,
        'type': "code",
        'amount': donationObj.amount,
        'refunded_date': null,
        'refunded_amount': null,
        'refund_transaction_id': null,
        'processing_fee': getProcessingFee(donationObj.stripecountry, donationObj.app_fee, donationObj.amount, donationObj.countrycode),
        'wonderwe_fee': new Number(donationObj.app_fee * donationObj.amount).toFixed(2),
        'source': "app",
        'user_ip_address': donationObj.ip,
        'withdrawal_process_date': null,
        'transaction_key': null,
        'description': donationObj.short_description,
        'account_id': donationObj.account_id,
        'access_token': donationObj.access_token,
        'anonymous': donationObj.anonymous,
        'hide_amount': donationObj.hide_amount,
        'created_date': donationObj.created_date
      };

      if (result.card_preference) {
        transactionObj.card_id = result.card_preference;
        donationObj.card_id = result.card_preference;
      } else {
        transactionObj.card_id = donationObj.user_card_id;
      }
      //inserting the comment into transaction_tbl
      if (donationObj.donor_comment) {
        transactionObj.donor_comment = emoji.toShort(donationObj.donor_comment);
      } else {
        transactionObj.donor_comment = null;
      }
       //updating type in transaction tbl
                      if(donationObj.charity_id&&!donationObj.code_id){
                        transactionObj.type="charity";
                      }else{
                        transactionObj.type="code";
                      }
      excuteQuery.queryForAll(sqlQueryMap['recurrenceUpdate'], [transactionObj.card_id, result.reccurrence_gift], function(err, cardInsert) {

        excuteQuery.insertAndReturnKey(sqlQueryMap['saveDonationTransaction'], transactionObj, function(err, tranResult) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, donationObj);
             if(donationObj.charity_id&&!donationObj.code_id){
                    donationService.updateCharityDonationEntity(donationObj,function(err,resultCharity){});
                      }else{
                    donationService.donationAmountUpdate(donationObj, function(err, result3) {});
          }
            donationService.trackDonationData(donationObj, function(err, resulti) {});
            if (donationObj.zip) {
              donationService.donorZipCodeUpdate({
                user_id: donationObj.user_id,
                zip: donationObj.zip
              }, function(err, updateDonorResult) {});
            }
            //me.donationAmountUpdate(donationObj);
            //sendEmailToDonater(donationObj, function(err, data) {});
            if(donationObj.city && donationObj.state && donationObj.countryCode && donationObj.address_1 && donationObj.address_2){
              charityServices.checkingCanMailing({
                userId:donationObj.user_id,
                city:donationObj.city,
                state:donationObj.state,
                country:donationObj.countryCode,
                address_2:donationObj.address_2,
                address_1:donationObj.address_1,
                postal_code:donationObj.zip
              },function(err,result){                
                agenda.now('sendAnEmailToDonater', donationObj);
                if(donationObj.code_id){
                agenda.now('sendAnEmailToCampaignOwnersAndAdmins', donationObj);
              }
              // donationService.sendMonthlyEmailToDonater(donationObj, function(err, result) {
              //                   console.log(err);
              //                   console.log(result);
              //                 });
              //agenda.now('sendMonthlyEmailToDonater', donationObj);
              });
            }else{
              agenda.now('sendAnEmailToDonater', donationObj);
              if(donationObj.code_id){
              agenda.now('sendAnEmailToCampaignOwnersAndAdmins', donationObj);
            }
             // donationService.sendMonthlyEmailToDonater(donationObj, function(err, result) {
             //                    console.log(err);
             //                    console.log(result);
             //                  });
                          // agenda.now('sendMonthlyEmailToDonater', donationObj);

            }
            if(donationObj.code_id){
            agenda.now('Check fundraiser goal reached or not', { code_id: donationObj.code_id, user_id: donationObj.user_id });
            feedBotSrevice.campaignReachedThresholds({ code_id: donationObj.code_id }, function(err, botResponse) {
              console.log('This is from feed bot response');
              console.log(botResponse);
            });
          }
            //me.sendEmailToDonater(donationObj, function(err, data) {});
            console.log('Background job started');
          }
        });
      })
    }
  });
};

exports.saveNewCard = function(cardObj, callback) {

  var me = this;
  pool.query('select * from credit_card_tbl where user_id=? and payment_gateway =?', [cardObj.user_id, 'stripe'], function(err, cardResult) {
    if (err) {
      callback(new Error(err), null);
    } else {

      if (cardResult && cardResult.length > 0) {

        stripe.customers.createSource(cardResult[0].customer_id, {
          source: cardObj.stripeToken
        }, function(err, card) {
          if (err) {
            callback(new Error(JSON.stringify({ errors: [err.message], status: 400 })), null);
          } else {
            cardObj.stripe_card_id = card.id;
            cardObj.customer_id = cardResult[0].customer_id;
            cardObj.payment_gateway = 'stripe';

            me.saveCardData(cardObj, callback);
          }
        });
      } else {

        stripe.customers.create({
          description: 'Welcome to App ' + cardObj.email + ' & ' + cardObj.user_id,
          source: cardObj.stripeToken, // obtained with Stripe.js
          email: cardObj.email,
          metadata: {
            user_id: cardObj.user_id
          }
        }, function(err, customer) {

          if (err) {
            callback(new Error(JSON.stringify({ errors: [err.message], status: 400 })), null);
          } else {

            cardObj.customer_id = customer.id;
            cardObj.stripe_card_id = customer.default_source
            cardObj.payment_gateway = 'stripe';
            me.saveCardData(cardObj, callback);

          }
        });
      }
    }
  });

};


exports.saveCardData = function(donationObj, callback) {

  var cardObj = {
    last_four: donationObj.last4,
    date_added: moment.utc().toDate(),
    date_expires: null,
    user_id: donationObj.user_id,
    token: donationObj.stripeToken,
    month: donationObj['cc-month'],
    year: donationObj['cc-year'],
    postal_code: donationObj.zip,
    name: donationObj.name,
    email: donationObj.email,
    payment_gateway: donationObj.payment_gateway,
    customer_id: donationObj.customer_id,
    stripe_card_id: donationObj.stripe_card_id,
    card_name: donationObj.brand + ' xxxxxx' + donationObj.last4,
    wepay_token: donationObj.wepay_token

  };

  excuteQuery.insertAndReturnKey(sqlQueryMap['saveCreditCard'], cardObj, function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else {
      cardObj.id = result;
      callback(null, cardObj);

      var cardObject = {
        credit_card_id: donationObj.wepay_token,
        cardid: result
      };
      //   donationService.updateCreditCardName(cardObject);
      wepayService.authorizeCard(cardObject, function(err, authorResult) {});

    }
  });
};



exports.updateStripeSubscription = function(subscriptionUpdateObj, callback) {
  console.log("updateStripeSubscription");
  console.log(subscriptionUpdateObj);
  var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  // Payment for monthly pay subscription
  if(subscriptionUpdateObj.charity_id&&!subscriptionUpdateObj.code_id){
    console.log("only for charity donations")
    var value = 'getSubscriptionQueryForOnlyCharity';

  }
  else if (subscriptionUpdateObj.charity_id != ''&&subscriptionUpdateObj.code_id) {
    console.log("dcfgvbhnj....hi dear")
    var value = 'getSubscriptionQueryForCharity';

  } else {
    var value = 'getSubscriptionQueryForUser';

  }
  var finalNumber = numbers[Math.floor(Math.random() * numbers.length)];
  excuteQuery.queryForObject(sqlQueryMap[value], [subscriptionUpdateObj.id], function(err, charityResult) {

    if (err) {
      console.log(err);
      callback(err, null);
    } else {
      console.log("charityresult...");
      console.log(charityResult);

      if (charityResult && charityResult.length > 0) {

        subscriptionUpdateObj.access_token = charityResult[0].access_token;
        var account_id = "";
        if (charityResult[0].account_id) {
          account_id = charityResult[0].account_id;
          subscriptionUpdateObj.currency = charityResult[0].currency;
        } else {
          account_id = props.stripe_account_id;
          subscriptionUpdateObj.currency = 'usd';
        }

        if (!subscriptionUpdateObj.currency) {
          subscriptionUpdateObj.currency = 'usd';
        }

        subscriptionUpdateObj.account_id = account_id;

        stripe.plans.create({
          amount: subscriptionUpdateObj.amount * 100,
          interval: "month",
          name: charityResult[0].name_tmp + " monthly subscription",
          //currency: "usd",
          currency: subscriptionUpdateObj.currency,
          id: "monthly-" + subscriptionUpdateObj.amount + '-' + charityResult[0].charity_id + '-' + charityResult[0].code_id + '-' + charityResult[0].user_id + '-' + moment.utc().valueOf()
        }, {
          stripe_account: subscriptionUpdateObj.account_id
        }, function(err, plan) {
          // asynchronously called

          if (err) {
            console.log(err);
            callback(err, null);
          } else {
            console.log("success.........");
            console.log(plan.id);
            console.log(subscriptionUpdateObj);
            subscriptionUpdateObj.subscription_plan_id = plan.id;

            stripe.customers.updateSubscription(
              subscriptionUpdateObj.customer_id,
              subscriptionUpdateObj.subscription_id, {
                plan: plan.id,
                application_fee_percent: props.stripe_monthly_fee
              }, {
                stripe_account: subscriptionUpdateObj.account_id
              },
              function(err, subscription) {
                // asynchronously called
                if (err) {
                  console.log("secondeerr")
                  console.log(err);
                  callback(new Error(JSON.stringify({
                    errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'],
                    status: 400
                  })), null);
                  //  callback(err, null);
                } else {
                  console.log("secondsubscripion....");
                  console.log(subscription);

                  excuteQuery.update(sqlQueryMap['updateStripeSubscription'], [plan.id, subscriptionUpdateObj.amount, subscriptionUpdateObj.id], callback);
                }
              });

          }
        });

      }
    }
  });



};

exports.cancelStripeSubscription = function(subscriptionCancelObj, callback) {
  console.log(subscriptionCancelObj);
  console.log("subscriptionCancelObj");
  /*if (subscriptionCancelObj.charity_id) {
    var value = subscriptionCancelObj.charity_id
    var obj = 'charity_id = ? and id = ?'

  } else {
    var value = subscriptionCancelObj.user_id
    var obj = 'user_id=?  and id = ?'
  }*/

  pool.query('select account_id from payment_gateways_tbl where id = ?', [subscriptionCancelObj.paymentgatewayid], function(err, charityresult) {
    if (err) {
      console.log(err)
      callback(err, null);
    } else {
      if (charityresult && charityresult.length > 0) {

        var account_id = "";

        if (charityresult[0].account_id) {
          account_id = charityresult[0].account_id;
        } else {
          account_id = props.stripe_account_id;
        }

        stripe.customers.cancelSubscription(
          subscriptionCancelObj.customer_id,
          subscriptionCancelObj.subscription_id, {
            stripe_account: account_id
          },
          function(err, confirmation) {
            // asynchronously called
            if (err) {
              callback(err, null);
            } else {
              excuteQuery.update(sqlQueryMap['cancelStripeSubscription'], [moment.utc().toDate(), 'cancelled', subscriptionCancelObj.id], callback);
            }
          });
      } else {
        callback({
          error: "Something went wrong"
        });
      }
    }
  });
};


exports.createPlans = function(donationObj, callback) {


  var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0];
  // Payment for monthly pay subscription
  var finalNumber = numbers[Math.floor(Math.random() * numbers.length)];
  var amount = new Number((new Number(donationObj.amount + (donationObj.app_fee * donationObj.amount)).toFixed(2)) * 100).toFixed(0)
  stripe.plans.create({
    amount: amount,
    interval: "month",
    name: donationObj.charity_title + " monthly subscription",
    //currency: "usd",
    currency: donationObj.currency,
    id: "monthly-" + donationObj.amount + '-' + donationObj.charity_id + '-' + donationObj.code_id + '-' + donationObj.user_id + '-' + moment.utc().valueOf()
  }, {
    stripe_account: donationObj.account_id
  }, callback)

};

exports.createTokens = function(donationObj, callback) {

  var cardPaymentObj = {};

  cardPaymentObj.customer = donationObj.customer_id;

  if (donationObj.card_id && donationObj.card_id != 'null') {
    cardPaymentObj.card = donationObj.card_id;
  }

  stripe.tokens.create(cardPaymentObj, {
    stripe_account: donationObj.account_id
  }, callback);

};


exports.createCustomers = function(cardObj, type, callback) {

  if (type === 'platform') {
    stripe.customers.create({
      description: 'Welcome to App ' + cardObj.email + ' & ' + cardObj.user_id,
      source: cardObj.stripeToken, // obtained with Stripe.js
      email: cardObj.email,
      metadata: {
        user_id: cardObj.user_id,
      }
    }, callback);
  } else {
    stripe.customers.create({
      description: 'Welcome to App ' + cardObj.email + ' & ' + cardObj.user_id,
      source: cardObj.stripeToken, // obtained with Stripe.js
      email: cardObj.email,
      metadata: {
        user_id: cardObj.user_id,
      }
    }, {
      stripe_account: donationObj.account_id
    }, callback);
  }
};

exports.addCardToExistingCustomers = function(cardObj, callback) {

  stripe.customers.createSource(cardObj.customer_id, {
    source: cardObj.stripeToken
  }, callback);

};

exports.createCustomerAndSubscription = function(donationObj, callback) {
  if (!donationObj.app_fee) {
    donationObj.app_fee = 0;
  }

  stripe.customers.create({
    source: donationObj.client_token,
    plan: donationObj.subscription_plan_id,
    email: donationObj.email,
    application_fee_percent: donationObj.app_fee,
    metadata: {
      charity_id: donationObj.charity_id,
      user_id: donationObj.user_id,
      charity_title: donationObj.charity_title,
      code_id: donationObj.code_id
    }
  }, {
    stripe_account: donationObj.account_id
  }, callback);

};

exports.stripeMonthlySubscription = function(donationObj, callback) {

  var me = this;
  /*  if (donationObj.fundraiser === 'fundraiser') {
      var queryName = "getFundariserAccount";
      var commonId = donationObj.fundraiser_userid;
    } else {
      var queryName = "getAccessToken";
      var commonId = donationObj.charity_id;
    }
  */
  if(donationObj.code_id){
    var queryName = "getGateWayAccountDetails";
     var code_id=donationObj.code_id;
  }else{
    var queryName = "getCharityGateWayAccountDetails";
    var code_id = donationObj.charity_id;
    donationObj.code_id=null;
  }
  excuteQuery.queryForObject(sqlQueryMap[queryName], [code_id], function(err, charityResult) {
    console.log("charityresult...");
    console.log(charityResult)
      //excuteQuery.queryForObject(sqlQueryMap['getAccessToken'], [donationObj.charity_id], function(err, charityResult) {
    if (err) {
      callback(err, null);
    } else {

      if (charityResult && charityResult.length > 0) {

        donationObj.access_token = charityResult[0].access_token;
        var account_id = "";
        if (charityResult[0].account_id) {
          account_id = charityResult[0].account_id;
          donationObj.currency = charityResult[0].currency;
          donationObj.account_type = 'claimed';
        } else {
          var account_id = props.stripe_account_id;
          donationObj.currency = 'USD';
          donationObj.account_type = 'unclaimed';
          callback(new Error(JSON.stringify({ errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'], status: 400 })), null);
          return false;

        }
        donationObj.account_id = account_id;

        if (!donationObj.currency) {
          donationObj.currency = 'USD';
        }

        donationObj.charity_title = charityResult[0].name_tmp;
        donationObj.campaigntitle=charityResult[0].name_tmp;

        //'platform'

        if (donationObj.savecard === 'yes') {

          // Added new card to the existing customer...

          pool.query('select * from credit_card_tbl where user_id=?', [donationObj.user_id], function(err, cardResult) {

            if (err) {
              callback(err, null);
            } else {

              if (cardResult && cardResult.length > 0 && cardResult[0].customer_id) {

                async.parallel({
                  planCreation: function(planCallback) {
                    me.createPlans(donationObj, planCallback);
                  },
                  customerFlow: function(customerCallback) {

                    stripe.customers.createSource(cardResult[0].customer_id, {
                        source: donationObj.stripeToken
                      },
                      function(err, platfomCard) {
                        // asynchronously called
                        if (err) {
                          customerCallback(err, null);
                        } else {
                          donationObj.customer_id = cardResult[0].customer_id;
                          donationObj.card_id = platfomCard.id;
                          customerCallback(err, donationObj);
                        }
                      });
                  }
                }, function(err, connectedAccountResult) {
                  if (err) {
                    callback(err, null);
                  } else {

                    var newDonationObject = connectedAccountResult.customerFlow;
                    newDonationObject.subscription_plan_id = connectedAccountResult.planCreation.id;
                    newDonationObject.subscription_plan_name = connectedAccountResult.planCreation.name;
                    me.generateConnectedAccountToken(newDonationObject, callback);
                  }
                });

              } else {
                me.newMonthlySubscriptions(donationObj, callback);
              }
            }
          });

        } else {
          me.newMonthlySubscriptions(donationObj, callback);
        }
      } else {
        console.log("fvgbhn")
        callback(new Error(JSON.stringify({ errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'], status: 400 })), null);
        return false;

      }
    }
  });
};

exports.newMonthlySubscriptions = function(donationObj, callback) {
  var me = this;
  async.parallel({
    planCreation: function(planCallback) {
      me.createPlans(donationObj, planCallback);
    },
    customerFlow: function(customerCallback) {

      me.createCustomers(donationObj, 'platform', function(err, platfomCustomer) {
        if (err) {
          callback(err, null);
        } else {
          // Generate a toke for new customer...;

          donationObj.customer_id = platfomCustomer.id;
          donationObj.card_id = platfomCustomer.default_source;
          customerCallback(err, donationObj);

        }
      });
    }
  }, function(err, connectedAccountResult) {
    if (err) {
      callback(err, null);
    } else {

      var newDonationObject = connectedAccountResult.customerFlow;
      newDonationObject.subscription_plan_id = connectedAccountResult.planCreation.id;

      newDonationObject.subscription_plan_name = connectedAccountResult.planCreation.name;
      me.generateConnectedAccountToken(newDonationObject, callback);
    }
  });
};

exports.generateConnectedAccountToken = function(newDonationObject, callback) {
  var me = this;
  me.createTokens(newDonationObject, function(err, tokeResult) {

    if (err) {
      callback(err, null);
    } else {
      newDonationObject.client_token = tokeResult.id;
      newDonationObject.stripeToken = tokeResult.id;

      me.createCustomerAndSubscription(newDonationObject, function(err, subscriptionResult) {

        if (err) {
          callback(err, null);
        } else {

          newDonationObject.client_customer_id = subscriptionResult.id;
          newDonationObject.stripe_card_id = subscriptionResult.card_id;
          newDonationObject.subscription_id = subscriptionResult.subscriptions.data[0].id;
          newDonationObject.status = subscriptionResult.subscriptions.data[0].status;
          newDonationObject.short_description = newDonationObject.subscription_plan_name;

          me.monthlyDataStorage(newDonationObject, callback);
        }
      });
    }
  });

};

exports.existingCardMonthlySubscription = function(donationObj, callback) {

  var me = this;
  /*
    if (donationObj.fundraiser === 'fundraiser') {
      var queryName = "getFundariserAccount";
      var commonId = donationObj.fundraiser_userid;
    } else {
      var queryName = "getAccessToken";
      var commonId = donationObj.charity_id;
    } */   
  if(donationObj.code_id){
    var queryName = "getGateWayAccountDetails";
     var code_id=donationObj.code_id;
  }else{
    var queryName = "getCharityGateWayAccountDetails";
    var code_id = donationObj.charity_id;
    donationObj.code_id=null;
  }

  excuteQuery.queryForObject(sqlQueryMap[queryName], [code_id], function(err, charityResult) {
    // excuteQuery.queryForObject(sqlQueryMap['getAccessToken'], [donationObj.charity_id], function(err, charityResult) {

    if (err) {
      callback(err, null);
    } else {

      if (charityResult && charityResult.length > 0) {

        donationObj.access_token = charityResult[0].access_token;
        var account_id = "";
        if (charityResult[0].account_id) {
          account_id = charityResult[0].account_id;
          donationObj.currency = charityResult[0].currency;
          donationObj.account_type = 'claimed';
        } else {
          var account_id = props.stripe_account_id;
          donationObj.currency = 'usd';
          donationObj.account_type = 'unclaimed';
          callback(new Error(JSON.stringify({ errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'], status: 400 })), null);
          return false;
        }

        if (!donationObj.currency) {
          donationObj.currency = 'usd';
        }

        donationObj.account_id = account_id;
        donationObj.charity_title = charityResult[0].name_tmp;
        donationObj.campaigntitle=charityResult[0].name_tmp;
        me.createPlans(donationObj, function(err, planResult) {
          console.log("cfgvhbnj")
          if (err) {
            callback(err, null);
          } else {

            donationObj.subscription_plan_id = planResult.id;
            donationObj.subscription_plan_name = planResult.name;
            me.generateConnectedAccountToken(donationObj, callback);

          }
        });
      } else {
        callback(new Error(JSON.stringify({ errors: ['Your not able to donate to this campaign because owner has submitted in sufficient details'], status: 400 })), null);
        return false;

      }
    }
  });
};



exports.stripeManagedAccountRegistration = function(data, callback) {
  var me = this;
  console.log('Came to stripe managed account creation');
  'use strict';
  var paymentGateWay = {};
  async.waterfall([
    function(callback) {
      excuteQuery.queryForAll(sqlQueryMap['getUserInfo'], [data.user_id], function(err, result) {
        if (err) {
          callback(err, null);
        } else if (result[0]) {
          callback(null, result[0]);
        } else {
          callback({ error: 'No user found with user id' }, null);
        }
      });
    },
    function(user, callback2) {
      data.user_name = user.name;
      data.user_email = user.email;
      stripe.accounts.create({
        country: data.country_code,
        managed: false,
        email: user.email
      }, function(err, result) {
        if (err) {
          callback2(err, null);
        } else {
          callback2(null, result);
        }
      });
    }
  ], function(err, account) {
    if (err) {
      console.log(err);
      if (err.raw && err.raw.message === 'An account with this email already exists.'){
        //agenda.now('Create stripe connect for existing email', data);
        me.enableStripeAccount(data, function(err, result) {
          console.log(err);
          console.log(result);
        });
      }
      callback(new Error(JSON.stringify({ errors: [err.message], status: 400 })), null);
      var logsObj = data;
      logsObj.error = err;
      logsObj.action = "Got an error while create Stripe Account for user/charity -- stripe Service : 1150";
      utility.nodeLogs('ERROR', logsObj);
    } else {
      if (data.charity_id) {
        paymentGateWay.charity_id = data.charity_id;
      }

      if (data.user_id) {
        paymentGateWay.user_id = data.user_id;
      }

      paymentGateWay.access_token = account.keys.secret;
      paymentGateWay.account_id = account.id;
      paymentGateWay.payment_gateway = 'stripe';
      paymentGateWay.managed = false;
      paymentGateWay.account_status = 'action_required';

      excuteQuery.insertAndReturnKey(sqlQueryMap['addPaymentGateWay'], paymentGateWay, function(err, result) {
        if (err) {
          callback(new Error(err), null);
          data.error = err;
          data.action = "Got an error while insert the payment gateway detals into db -- Stripe service 1173";
          utility.nodeLogs('ERROR', data);
        } else {
          console.log('add payment gateway');
          callback(null, result);
        }
      });
    }
  });
};

exports.updateManageAccount = function(data, callback) {
  var updateData = data.stripe_details;
  var account_id;

  updateData.transfer_schedule = {
    "delay_days": 7,
    "interval": "weekly",
    "weekly_anchor": "friday"
  };
  var query;
  var refId;

  if (data.charity_id) {
    query = 'getStripeGatewayOnCharity';
    refId = data.charity_id;
  } else {
    query = 'getStripeGatewayOnUser';
    refId = data.user_id;
  }
  excuteQuery.queryForAll(sqlQueryMap[query], [refId], function(err, result) {
    if (err) {
      console.log(err);
      callback('Error in getting payment gateway details', null);
    } else if (result.length) {
      account_id = result[0].account_id;
      stripe.accounts.update(account_id, updateData, function(err, result) {
        if (err) {
          console.log(err.raw.message);
          callback(new Error(JSON.stringify({ errors: [err.raw.message], status: 400 })), null);
        } else {
          callback(null, result);
          excuteQuery.queryForAll(sqlQueryMap['updateBankAccount'], [updateData.external_account.account_number, updateData.legal_entity.business_tax_id,
            updateData.external_account.account_holder_name, updateData.legal_entity.personal_id_number, account_id
          ], function(err, result) {
            if (err) {
              callback(err, null);
            } else {
              console.log(result);
              utility.nodeLogs('INFO', { message: 'Added updated bank account' });
            }
          });
        }
      });
    } else {
      console.log('In the no length');
      callback('No payment gateway id found', null);
    }
  });



};

exports.getStripeAccount = function(data, callback) {
  var account_id;
  var query;
  var refId;

  if (data.charity_id) {
    query = 'getStripeGatewayOnCharity';
    refId = data.charity_id;
  } else {
    query = 'getStripeGatewayOnUser';
    refId = data.user_id;
  }
  excuteQuery.queryForAll(sqlQueryMap[query], [refId], function(err, result) {
    if (err) {
      callback(new Error(err), null);
    } else if (result.length) {
      if (result[0].bank_account) {

        callback(null, {
          bank_account_exists: true,
          bank_account: result[0].bank_account,
          bank_account_holder_name: result[0].bank_account_holder_name
        });
      } else {
        account_id = result[0].account_id
        stripe.accounts.retrieve(account_id, function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, result);
          }
        });
      }
    } else {
      callback('Payment gateway not created', null);
    }
  });
};

exports.getStripeAccountDetails = function(data, callback) {
  var account_id;
  var account_id;
  var query;
  var refId;

  if (data.charity_id) {
    query = 'getStripeGatewayOnCharity';
    refId = data.charity_id;
  } else {
    query = 'getStripeGatewayOnUser';
    refId = data.user_id;
  }
  excuteQuery.queryForAll(sqlQueryMap[query], [refId], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result.length) {
      account_id = result[0].account_id
      stripe.accounts.retrieve(account_id, function(err, stripeAccount) {
        if (err) {
          callback(err, null);
        } else {
          if (stripeAccount.external_accounts.data.length) {
            stripeAccount.external_accounts.data[0].account_number = result[0].bank_account;

            stripeAccount.legal_entity.business_tax_id = result[0].business_tax_id;
          }
          callback(null, stripeAccount);
        }
      });
    } else {
      callback('Error in getting stripe account', null);
    }
  });

};

exports.getStripeIdForCampaign = function(data, callback) {


  excuteQuery.queryForAll(sqlQueryMap['getGateWayAccountDetails'], [data.code_id], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      if (result.length) {
        callback(null, result);
      } else {
        callback({ message: 'No stripe id found to this user' }, null);

      }
    }
  });

};

/**
 * [transforAmountToAccount description]
 * @param  {object}   data
 * @param  {Function} callback [description]
 * @return {object}            [description]
 */
exports.transforAmountToAccount = function(data, callback) {

  var me = this;

  async.waterfall([
    function(callback) {
      me.getStripeIdForCampaign(data, callback);
    },
    function(result, callback) {
      console.log(result);
      stripe.transfers.create({
        amount: data.amount,
        currency: 'usd',
        destination: 'default_for_currency'
      }, {
        stripe_account: result[0].account_id
      }, function(err, result) {
        if (err) {
          console.log(err);
          callback({ error: err }, null);
        } else {
          callback(null, result);
        }
      });
    }
  ], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};


exports.stripeFileUpload = function(file, data, callback) {
  //console.log(data);
  //console.log(file);
  var fp = fs.readFileSync(file.path);
  console.log('This is response from file...');
  stripe.fileUploads.create({
    purpose: 'identity_document',
    file: {
      data: fp,
      name: file.originalname,
      type: file.mimetype
    }
  }, function(err, fileUpload) {


    if (err) {
      console.log("error")
      console.log(err)
      callback(new Error(JSON.stringify({ errors: [err.message], status: 400 })), null);
    } else {
      console.log("fileupload")
      console.log(fileUpload);
      callback(null, fileUpload);
    }
  });
};

exports.resendAccountClaimEmail = function(account, callback) {
  var mandrilObject = {};
  var user;
  mandrilObject.from = props.fromemail;
  mandrilObject.text = "";
  mandrilObject.subject = "Activate your stripe account";
  mandrilObject.template_name = "Resend stripe claim account link";
  mandrilObject.template_content = [{
    "name": "claimAccountUrl",
    "content": "*|CLAIM_ACCOUNT_URL|*"
  }, {
    "name": "current_year",
    "content": "*|current_year|*"
  }];
  mandrilObject.merge_vars = [{
    "name": "CLAIM_ACCOUNT_URL",
    "content": "https://dashboard.stripe.com/account/active?client_id=" + props.stripe_client_id + '&user_id=' + account.id
  }, {
    "name": "CURRENT_YEAR",
    "content": moment.utc().year()
  }];
  mandrilObject.email = account.email;
  utility.mandrillTemplate(mandrilObject, function(err, result) {
    if (err) {
      utility.nodeLogs('ERROR', err);
      callback(err, null);
    } else {
      utility.nodeLogs('INFO', result);
      callback(null, result);
    }
  });
};

exports.checkAccountsStatusAndSendActivationEmails = function(data, callback) {
  var me = this;
  stripe.accounts.list({}, function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result.data.length) {
      async.each(result.data, function(account, eachCallback) {
        if (account.details_submitted === false && account.managed === false) {
          me.resendAccountClaimEmail(account, function(err, result) {
            eachCallback(null);
          });
        } else {
          excuteQuery.queryForAll(sqlQueryMap['updateStripeAccountStatus'], ['active', account.id], function(err, result) {
            if (err) {
              eachCallback(null);
            } else {
              eachCallback(null);
            }
          });
        }
      }, function(err) {
        if (err) {
          utility.nodeLogs('ERROR', err);
        }
        callback(null, null);
      });
    } else {
      callback(null, null);
    }
  });
};

exports.enableStripeAccount = function(data, callback) {
  var me = this;
  excuteQuery.queryForAll(sqlQueryMap['enableStripeForUser'], [data.user_id], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      me.sendStripeAccountCreationFailedEmail(data, function(err, result) {});
      callback(null, result);
    }
  });
};

exports.cancelOccurenceExpiration = function(data, callback) {
  excuteQuery.queryForAll('SELECT * FROM recurring_gift_tbl WHERE payment_gateway="stripe" AND subscription_state="active" AND noofoccurences>0 ORDER BY id; ', [], function(err, stripeData) {
    if (err) {
      console.log(err);
      callback(err, null)
    } else {
      if (stripeData && stripeData.length) {
        async.eachSeries(stripeData, function(striperesult, eachCallback) {
          console.log("striperesult")
          if (striperesult && striperesult.date_created && striperesult.noofoccurences) {
            var futureDate = moment(striperesult.date_created).add(parseInt(striperesult.noofoccurences), 'M')
            if (futureDate._d <= moment().toDate()) {
              excuteQuery.queryForAll(sqlQueryMap['getDetailsForCancel'], [striperesult.customer_id, striperesult.subscription_id], function(err, subscriptionCancelObj) {
                console.log(subscriptionCancelObj);
                stripe.customers.cancelSubscription(
                  striperesult.customer_id,
                  striperesult.subscription_id, {
                    stripe_account: subscriptionCancelObj[0].account_id
                  },
                  function(err, confirmation) {
                    // asynchronously called
                    if (err) {
                      console.log("stripe cancel error");
                      eachCallback(err)
                    } else {
                      console.log("stripecancel suvcccess")
                      excuteQuery.update(sqlQueryMap['cancelStripeSubscription'], [moment.utc().toDate(), 'cancelled', subscriptionCancelObj[0].id], function(err, resultres) {
                        eachCallback(null);
                      });
                    }
                  });
              })
            } else {
              eachCallback(null);
            }
          } else {
            eachCallback(null);
          }
        }, function(err) {
          if (err) {
            console.log(err);
            callback(err, null);
          } else {
            callback(null, 'success');

          }
        })
      } else {
        callback(null, 'success');
      }
    }
  })
}
exports.cancelStripeForalreadyexpiredCampaigns = function(data, callback) {
  excuteQuery.queryForAll(sqlQueryMap['cancelStripeForExpiredCampaigns'], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      if (result && result.length > 0) {
        async.eachSeries(result, function(striperesult, eachCallback) {
          stripe.customers.cancelSubscription(
            striperesult.customer_id,
            striperesult.subscription_id, {
              stripe_account: striperesult.account_id
            },
            function(err, confirmation) {
              // asynchronously called
              if (err) {
                console.log("stripe cancel error");
                eachCallback(err)
              } else {
                console.log("stripecancel suvcccess")
                excuteQuery.update(sqlQueryMap['cancelStripeSubscription'], [moment.utc().toDate(), 'cancelled', striperesult.recurrenceid], function(err, resultres) {
                  eachCallback(null);
                });
              }
            });
        })

      } else {
        callback(null, null);
      }
    }
  });
}
exports.sendStripeAccountCreationFailedEmail = function(data, callback) {

  var mandrilObject = {};
  mandrilObject.email = data.user_email;
  mandrilObject.from = props.fromemail;

  mandrilObject.template_name = 'Stripe account creation fail email';

  //Condition to check whether it is coming from charity claim 
  //or campaign creation or campaign creation with claim request
  if(data.charityOnly){     
    mandrilObject.subject = 'Your stripe account creation failed for charity ' + data.title;  
  }else{
    mandrilObject.subject = 'Your stripe account creation failed for campaign ' + data.title;  
  }
  
  mandrilObject.template_content = [{
    "name": "user_name",
    "content": "*|USER_NAME|*"
  }, {
    "campiagn_title": "campaign_title",
    "content": "*|CAMPAIGN_TITLE|*"
  }, {
    "name": "user_email",
    "content": "*|USER_EMAIL|*"
  }, {
    "name": "login_url",
    "content": "*|LOGIN_URL|*"
  },{
    "name":"charity_only",
    "content":"*|CHARITY_ONLY|*"
  }];

  mandrilObject.merge_vars = [{
    "name": "USER_NAME",
    "content": data.user_name
  }, {
    "name": "CAMPAIGN_TITLE",
    "content": data.title
  }, {
    "name": "USER_EMAIL",
    "content": data.user_email
  }, {
    "name": "LOGIN_URL",
    "content": props.domain + '/login'
  },{
    "name":"CHARITY_ONLY",
    "content":data.charityOnly
  }];

  utility.mandrillTemplate(mandrilObject, function(err, result) {
    if (err) {
      console.log(err);
      utility.nodeLogs('ERROR', { message: 'Error in sending stripe account creation failed pro active email' });
      callback(err, null);
    } else {
      console.log(result);
      utility.nodeLogs('INFO', { message: 'Successfully sent stripe account creation failed pro active email' });
    }
  });
};

function getProcessingFee(stripecountry, appfee, amount, campcountry) {
  console.log("geprocessingfee............");
  console.log(campcountry + "" + appfee + "" + amount)
  var country = campcountry;
  var amountfee;
  if (country == "BE" || country == "CH" || country == "FI" || country == "IT" || country == "AT" || country == "LU" || country == "NL" || country == 'US') {
    amountfee = (((amount + appfee) * 2.9) / 100) + 0.30
  } else if (country == "IE") {
    amountfee = (((amount + appfee) * 2.4) / 100) + 0.24

  } else if (country == "FR") {
    if (stripecountry == 'FR') {
      amountfee = (((amount + appfee) * 1.8) / 100) + 0.25
    } else {
      amountfee = (((amount + appfee) * 2.9) / 100) + 0.25
    }
  } else if (country == "AU") {
    if (stripecountry == 'UK') {
      amountfee = (((amount + appfee) * 1.75) / 100) + 0.30
    } else {
      amountfee = (((amount + appfee) * 2.9) / 100) + 0.30
    }
  } else if (country == "GB") {
    if (stripecountry == 'UK') {
      amountfee = (((amount + appfee) * 1.9) / 100) + 0.24
    } else {
      amountfee = (((amount + appfee) * 2.9) / 100) + 0.20
    }
  } else if (country == "DE" || country == "ES") {
    amountfee = (((amount + appfee) * 2.9) / 100) + 0.20

  }
  return amountfee;
}
