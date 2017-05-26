// External Modules Import Here
express = require('express')
var path = require('path')
var Agenda = require('agenda')
var agendaUI = require('agenda-ui')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var sanitizeHtml = require('sanitize-html')
var striptags = require('striptags');



mandrill = require('mandrill-api/mandrill')
moment = require('moment')
passport = require('passport');
Strategy = require('passport-facebook');
GoogleStrategy = require('passport-google-oauth').OAuth2Strategy; 

md5 = require('MD5')
uuid = require('node-uuid')
jwt = require('jwt-simple')
exphbs = require('express-handlebars')
mysql = require('mysql')
redis = require('redis')
crypto = require('crypto')
async = require('async')
db_template = require('db-template')
underscore = require('underscore')
var fs = require('fs')
var parser = require('xml2json')
pathmodule = require('path')
uslug = require('uslug')
var multer = require('multer')
request = require('request')
wepay = require('wepay').WEPAY
slugController = require('./services/slug-controller.js')
donationController=require('./services/donations.js')

numeral = require('numeral')
elasticsearch = require('elasticsearch')
gcm = require('node-gcm')
apn = require('apn')
http = require('http')
url = require('url')
props = require('config').props

if(props.environment_type === 'production'){
  require('@risingstack/trace');
}

stripe = require('stripe')(props.stripe_secret_key);
var router = express.Router()
device = require('device')
google = require('googleapis');
//ogs = require('open-graph-scraper');
//ogp=require('og-parser');
og = require('open-graph')

router.use(function(req, res, next) {

  if (req.method === 'GET') {

    if (req.originalUrl == '/404') {
      var obj = {
        layout: 'pages',
        metadata: { seoTitle: 404 }
      };
      /* if (req.cookies.loadFrom != 'charity' && req.cookies.token) {
         obj.donornav = 'donor'
       } else if (req.cookies.loadFrom == 'charity' && req.cookies.token) {
         obj.charitynav = 'a'
       } else {
         obj.nav = ''
       }*/
      res.status(404);
      res.render('./pages/404.hbs', obj);
    } else {

      var slugUrlContruction = req.originalUrl
      var data = slugUrlContruction.split('/')

      if (req.originalUrl == '/code/' || req.originalUrl == '/feed/') {
        data = []
      }

      if (underscore.compact(data).length === 1) {
        var splitedSlug = underscore.compact(data)[0]

        if (splitedSlug.indexOf('?') + 1) {
          req.params.slug = uslug(underscore.compact(splitedSlug.split('?'))[0])
        } else {
          req.params.slug = uslug(splitedSlug)
        }

        slugCheckUp(req, res, function(err, result) {
          next()
        })

      } else {
        next()
      }
      // app.use('/:slug', slugController)
    }

  } else {
    next()
  }
  // TODO check two slus for campaign if not found just pass next() method
  // UnAuthenticated Routes


  if (req.method === 'POST') {}
  //Authentication Process.
});


//Internal Modules Import Here - TODO: We have to move these to respective routes.
validationController = require('./services/validator');
utility = require('./utils/util');
auth = require('./routes/auth');
code = require('./routes/code');
feed = require('./routes/feed');
charity = require('./routes/charity');
analytics = require('./routes/analytics');
transaction = require('./routes/transaction');
donors = require('./routes/donors');
follower = require('./routes/follower');
settings = require('./routes/settings');
pages = require('./routes/pages');
donations = require('./routes/donations');
search = require('./routes/search');
elastic = require('./routes/elastic');
wepayController = require('./routes/wepay');
stripeController = require('./routes/stripe');
seo = require('./routes/seo');
scripts = require('./scripts/auto-elastic-scripts');
embeded = require('./routes/embeded');
features = require('./routes/features');
team = require('./routes/team');
mail = require('./mail');
imgDimension = require('./config/img-dimensions');
stripeService = require('./services/stripe.js');


//Converted the JSON Array into a SQL Map so that Queries can be looked up using Key Value Pairs.

var content = fs.readFileSync(__dirname + '/sql-queries.xml');

var json = parser.toJson(content, {
    sanitize: false
  })
  // returns a string containing the JSON structure by default
var sqlQueries = JSON.parse(json)['sql-queries']['sql-query']
sqlQueryMap = {}
for (var i = 0; i < sqlQueries.length; i++) {
  sqlQueryMap[sqlQueries[i]['id']] = sqlQueries[i]['$t']
}
// Created Redis Client For Authentication Tokens. TODO: Fix Logger Messages.
redisClient = redis.createClient(props.redisport, props.redishost, {})
redisClient.auth(props.redispass);
/*redisClient = redis.createClient(props.redisport, props.redishost, {});
redisClient.auth('sbwe@2013');*/

redisClient.on('error', function(err) {

})

redisClient.on('connect', function() {

})

app = express()
  /*require('devmetrics')({
    'app': app,
    'uncaughtException': true,
    'app_id': props.devmetrics_app_id
  })*/

// TODO:Need to Implement the Logger

app.use(multer({
  dest: './uploads/'
}))
app.use(bodyParser.json({
  limit: '50mb'
}))
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new Strategy({
    clientID: props.facebook_client_id,
    clientSecret: props.facebook_secret_id,
    profileFields: ['id', 'email', 'bio', 'picture.type(large)', 'name', 'about', 'location', 'hometown', 'birthday'],
    scope: ['publish_page', 'user_about_me']
  },
  function(accessToken, refreshToken, profile, cb) {
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    profile.access_token = accessToken;
    return cb(null, profile);
  }));

passport.use(new GoogleStrategy({
    clientID: props.google_client_id,
    clientSecret: props.google_client_secret,
    callbackURL:props.domain+'/auth/social/google/callback'
  },
  function(token, tokenSecret, profile, done) {
      
      done(null,profile);
  }
));


passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


app.set('jwtTokenSecret', 'WonderWe');
app.use(cookieParser())
app.enable('trust proxy')

var os = require('os')
var systemname = os.hostname()

router.use(function(req, res, next) {
  // To track the logs
  // Loggs Object to track the
  var logsObj = {};
  logsObj.userAgent = req.headers['user-agent'];
  logsObj.ip = req.ip;
  var userDevice = device(req.headers['user-agent']);
  logsObj.userDeviceIsPhone = userDevice.is('phone');
  logsObj.frontEndData = req.body || req.query || req.params;
  logsObj.createdDate = moment().toDate();
  logsObj.token = (req.body && req.body.token) || (req.query && req.query.token) || req.headers['x-access-token'];
  req.logsObj = logsObj;
  next();
});


app.use('/', router)
app.use('/elastic', elastic)
  /*
   var logopts = {
   console : props.logtoconsole,
   level : props.loglevel,
   name : "wonderlog",
   logstash : {
   redis : true, // or send directly over UDP
   host : props.logstashhost, // defaults to localhost
   port : 6379, // defaults to 6379 for redis, 9999 for udp
   key : 'logstash', // defaults to 'bucker', this is only used for the redis transport
   channel : false, // use redis pubsub
   list : true, // use a redis list *NOTE* if channel is false, list usage is forced
   source_host : systemname
   }
   };*/

// var bucker = require('bucker')
// Making the logger global variable, it works with all levels.
// logger = bucker.createLogger(logopts)
pool = mysql.createPool({
  host: props.host,
  user: props.username,
  password: props.password,
  port: props.port,
  database: props.database,
  connectionLimit: props.connectionLimit,
  debug: props.dbdebug,
  connectTimeout: props.connectTimeout
    //  acquireTimeout : 30000
});
excuteQuery = db_template(pool)
app.set('views', path.join(__dirname, 'views'))

elasticClient = new elasticsearch.Client({
  host: props.elasticServer,
  log: props.elasticSearchlog
})

elasticClient.ping({
  // ping usually has a 3000ms timeout
  requestTimeout: Infinity,
  hello: 'elasticsearch!'
}, function(err) {
  if (err) {
    var logsObj = {};
    logsObj.error = err;
    logsObj.stack = new Error().stack;
    logsObj.message = 'Failed connect to elasticsearch - cause-node/app.js -259'
    utility.nodeLogs('ERROR', logsObj);
  }
})

var hbs = exphbs.create({
  // Specify helpers which are only registered on this instance.
  helpers: {
    constructUrl: function(url, size, options) {
      if (url) {
        var extRemovalUrl = url.slice(0, url.lastIndexOf('.'))
        var ext = url.split('.').pop();

        return extRemovalUrl + '-size' + size + '.' + ext

      } else {
        return url
      }
    },

    convertToHyphenSlug: function(text) {
      if (text) {
        return text
          .toLowerCase()
          .replace(/ /g, '-');
      } else {
        return text;
      }
      //.replace(/[^\w-]+/g, '');
    },

    ifconcat: function(value1, value2, options) {
      if (value1 && value2) {
        return value1 + ', ' + value2
      } else {
        if (value1 || value2) {
          var returnvalue = value1 ? value1 : value2
          returnvalue = value2 ? value2 : value1
          return returnvalue
        }
      }
    },
    equal: function(lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error('Handlebars Helper equal needs 2 parameters')
      if (lvalue != rvalue) {
        return options.inverse(this)
      } else {
        return options.fn(this)
      }
    },
    equaltoo: function(lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error('Handlebars Helper equal needs 2 parameters')
      if (lvalue === rvalue) {
        return options.fn(this)
      } else {
        return options.inverse(this)
      }
    },
    notequal: function(lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error('Handlebars Helper equal needs 2 parameters')
      if (lvalue != rvalue) {
        return options.fn(this)
      } else {
        return options.inverse(this)
      }
    },
    greater: function(value1, value2, options) {
      if (value1) {
        if (value1.length > value2) {
          return value1.slice(0, value2) + '...'
        } else {
          return value1
        }
      } else {
        return value1
      }

    },

    plaintext: function(value1, value2, options) {
      if (value1) {
        var plaintextvalue = value1.replace(/<(?:.|\n)*?>/gm, '')
        if (plaintextvalue.length > value2) {
          return plaintextvalue.slice(0, value2) + '...'
        } else {
          return plaintextvalue
        }
      } else {
        return value1
      }

    },

    toJson: function(inputObject, options) {
      return escape(JSON.stringify(inputObject))
    },
    difference: function(value1, value2, oprions) {
      return parseInt(value1) - parseInt(value2)
    },
    formatdate: function(value1, value2, options) {
      return moment.utc(value1).format(value2)
    },
    disable: function(value1, value2, options) {
      if (parseInt(value1) - parseInt(value2) === 0) {
        return 'disabled'
      } else {
        return ''
      }
    },
    link: function(value1, value2, options) {
      if (value1 > 0) {
        return '<a class="js-signedup-volunteers" data-shift_id="' + value2 + '">' + value1 + ' People</a>';
      } else {
        return '0 People';
      }
    },
    widthAdjustment: function(value1, value2, options) {
      if (value1 > 100) {
        return 100;
      } else {
        return value1;
      }
    },
    numberFormat: function(number, options) {
      return numeral(number).format('0,0');
    },
    greaterthan: function(value, options) {
      if (value > 25) {
        return 'commentclick';
      } else {
        return '';
      }
    },
    stringReturn: function(value1, value2, options) {
      if (value1.length > value2) {
        return value1.substring(value2, value1.length);
      } else {
        return '';
      }
    },
    stringReturnLimit: function(value, options) {
      if (value) {
        if (value.length > 25) {
          return value.substring(0, 25);
        } else {
          return value;
        }
      } else {
        return '';
      }
    },
    currencyFormat: function(symbol, amount, options) {
      if (!symbol) {
        symbol = '$';
      }
      return symbol + numeral(amount).format('0,0');;
    },
    stripTagsGreater: function(value1, value2, options) {
      try {
        if (value1) {
          if (value1.length > value2) {
            return striptags(value1).substring(0, value2) + '...';
          } else {
            return striptags(value1);
          }
        } else {
          return striptags(value1);
        }

      } catch (err) {
        return null;
      }
    }
  },
  defaultLayout: 'main'
})
app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')

app.post('/wonderwe/logs', function(req, res) {
  setTimeout(function() {
    utility.log(req.body.level, JSON.stringify(req.body));
  }, 1000);
  //  utility.log(req.body.level.name, req.body.message)
  res.send({
    data: 'success'
  })
});
app.post('/remove/redis/data', function(req, res) {
  var token = (req.body && req.body.token) || (req.query && req.query.token) || req.headers['x-access-token'];
  console.log(token)
  redisClient.del('token', function(err, result) {
    console.log(result);
    res.send({ msg: 'done well' });
  })

});

app.post('/tracking/wonderwe', function(req, res) {
  res.send({
    data: 'success'
  })
})

app.get('/:slug/donation',function(req,res){
  var slug=req.params.slug;
  pool.query('select * from entity_tbl where slug =? AND date_deleted IS NULL', [slug], function(err, result) {
      if (err) {
        callback(err, null)
      } else {
        if (result && result.length > 0) {
          var type = result[result.length-1].entity_type;
          var resObj=result[result.length-1];
          if (type === 'code') {
            var entityObj={
              'id':resObj.id,
              'type':resObj.type,
              'codeId':resObj.entity_id
            }
            donationController.codeDonationPage(req, res,entityObj);
          }else if(type === 'charity'){
            var entityObj={
              'id':resObj.id,
              'type':resObj.type,
              'charityId':resObj.entity_id
            }
            donationController.charityDonationPage(req, res,entityObj);
          }
        }
      }
    });
//res.render('./pages/donationpage.hbs', obj);
})

/*app.get('/stripe/cancelaccount', function(req, res) {
  console.log("dxcfgvhbnjkm")
  stripeService.cancelStripeForalreadyexpiredCampaigns({}, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log("success");
    }
  })

})*/

function slugCheckUp(req, res, callback) {
  // res.send(req.params.slug)
  var mobileLoginDonorId;
  var slug = req.params.slug;
  var api = req.query.api;
  var userDevice = device(req.headers['user-agent']);
  var userDeviceIsPhone = userDevice.is('phone');
  //Added for desktop user profile view... in mobile....
  if ((api == 'true') && !userDeviceIsPhone) {
    userDeviceIsPhone = true
  }
  //Added this one for req.cookies.token value from mobile...
  if ((api === 'true') || userDeviceIsPhone) {
    req.cookies.token = req.headers['x-access-token'];
  }

  redisClient.get(req.cookies.token, function(err, redisResult) {

    if (redisResult) {

      redisResult = JSON.parse(redisResult);
      req.query.logindonorid = redisResult.id;
      //Added this for mobile user profile purpose is_following case
      mobileLoginDonorId = redisResult.id
    }
    /*else {
         mobileLoginDonorId = req.query.logindonorid;
       }*/
    /*
      redisClient.get(slug, function(err, result) {
        if (err) {
          console.log(err);
        } else {
          console.log(result);
          var data = JSON.parse(result);

          if (data.type === 'code') {

            req.params.codeId = data.id
            if (userDeviceIsPhone && (!api && !mobileLoginDonorId)) {
              res.redirect(props.mobileredirect + '/campaignProfile' + req.originalUrl);
            } else {
              slugController.publicCampaignProfile(req, res);
            }
          } else if (data.type === 'charity') {

          } else if (data.type === 'user') {} else {

          }
        }

      });

    */

    pool.query('select * from entity_tbl where slug =? AND date_deleted IS NULL', [slug], function(err, result) {
      if (err) {
        callback(err, null)
      } else {
        if (result && result.length > 0) {
          var type = result[result.length-1].entity_type;
          if (type === 'user') {
            if (!req.cookies.token && !userDeviceIsPhone && !mobileLoginDonorId) {

              var obj = {};
              obj.outsideUserSlug = result[result.length-1].slug;

              redisClient.set(req.cookies.visitedUser, JSON.stringify(obj), function(err, redisTokenResult) {
                if (err) {
                  callback(err, null);
                } else {
                  if (redisTokenResult) {
                    res.redirect('/signup');
                  }
                }
              })
            } else {
              var userObject = {}
              req.params.userId = result[result.length-1].entity_id;
              if ((req.cookies && req.cookies.logindonorid) || mobileLoginDonorId) {
                if (mobileLoginDonorId) {
                  req.query.entityId = mobileLoginDonorId;
                } else {
                  req.query.entityId = req.cookies.logindonorid;
                }
              } else {
                //result[0].id is changed to result[0].entity_id as entity id is passed insted of userid ie., entity_id
                //In user profile mobile side followingpeople is_following getting 0 as i'm follwing it should be userid so changing the below to entity_id
                req.query.entityId = result[result.length-1].entity_id
              }

              if (userDeviceIsPhone && (!api && !mobileLoginDonorId)) {
                res.redirect(props.mobileredirect + '/user/other/profile' + req.originalUrl + '?value=redirectProfile');
              } else {
                slugController.publicUserProfile(req, res);
              }
            }

          } else if (type === 'charity') {
            req.params.charityId = result[result.length-1].entity_id
            if (userDeviceIsPhone && (!api && !mobileLoginDonorId)) {
              res.redirect(props.mobileredirect + '/charity' + req.originalUrl + '?value=redirectCharity');
            } else {
              slugController.publicCharityProfile(req, res)
            }

          } else if (type === 'code') {

            req.params.codeId = result[result.length-1].entity_id
            if (userDeviceIsPhone && (!api && !mobileLoginDonorId)) {
              res.redirect(props.mobileredirect + '/campaignProfile' + req.originalUrl + '?value=redirectCamp');
            } else {
              slugController.publicCampaignProfile(req, res);
            }

          } else if (type == 'team') {
            req.params.team_id = result[result.length-1].entity_id;
            slugController.publicTeamProfile(req, res);
          } else if (type == 'event') {
            req.params.eventId = result[result.length-1].entity_id
            slugController.publicEventProfile(req, res);
          }
        } else {
          pool.query('select * from entity_tbl where id in (select entity_id from slug_manager_tbl where previous_slug=? ORDER BY created_date desc) and date_deleted is NULL', [slug], function(err, slugResult) {
            if (err) {
              callback(err, null)
            } else {
              if (slugResult && slugResult.length > 0) {
                // req.params.slug = slugResult[0].updated_slug
                // slugCheckUp(req, res, callback)
                console.log("camehere");
                res.redirect('/' + slugResult[0].slug)
              } else {
                res.redirect('/404')
              }
            }
          });
        }
      }
    });

  });
}


app.get('/404', function(req, res) {

});

//io = require('socket.io').listen(http);

agenda = new Agenda({
  db: {
    address: props.agendadb,
    collection: props.agendaJobCollection
  }
});

app.use('/auth', auth);
app.use('/code', code);
app.use('/feed', feed);
app.use('/charity', charity);
app.use('/follower', follower);
app.use('/analytics', analytics);
app.use('/transaction', transaction);
app.use('/donors', donors);
app.use('/settings', settings);
app.use('/pages', pages);
app.use('/donations', donations);
app.use('/search', search);
app.use('/wepay', wepayController);
app.use('/stripe', stripeController);
app.use('/scripts', scripts);
app.use('/sitemap', seo);
app.use('/embeded', embeded);
app.use('/features', features);
app.use('/team', team);
app.get('/print/campaign/:codeid', utility.printCampaignCode)
app.post('/pic/upload', utility.picUpload)
app.get('/util/properties', utility.utilProperties)
app.post('/util/redis/campaign', utility.getRedisCodeData);
app.post('/util/update/redis/data', utility.updateRedisData);

function generate_xml_sitemap() {
  // this is the source of the URLs on your site, in this case we use a simple array, actually it could come from the database
  var urls
  urls = fs.readFileSync(props.sitemap_config_file, 'UTF-8')
  urls = JSON.parse(urls)
  urls = urls.urls

  // the root of your website - the protocol and the domain name with a trailing slash
  // XML sitemap generation starts here

  var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  var keys
  for (var i in urls) {
    keys = Object.keys(urls[i])
    xml += '<url>'
    for (var j = 0; j < keys.length; j++) {
      xml += '<' + keys[j] + '>' + urls[i][keys[j]] + '</' + keys[j] + '>'
    }
    xml += '</url>'
    i++
  }
  xml += '</urlset>'
  return xml
}
app.get('/sitemap.xml', function(req, res) {
  var slug = null;
  utility.getAllChampaigns(function(err, result) {
    var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    if (err) {
      res.statusCode = 500
      res.send(err)
    } else {
      for (var i = 0; i < result.length; i++) {
        slug = result[i].slug
        if (slug) {
          // slug = slug.replace('&','&amp;');
          xml += '<url>'
          xml += '<loc>' + props.domain + '/' + slug + '</loc>'
          xml += '<changefreq>monthly</changefreq>'
          xml += '<priority>0.5</priority>'
          xml += '</url>'
        }
      }
      xml += '</urlset>'
      res.header('Content-Type', 'text/xml')
      res.send(xml)
    }
  });
});

global.setDevHeaders = function(res) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization,x-access-token')
}

global.sendError = function(err, req, res) {
  res.send(err)
}

//Added server code for push IOS
global.sendIosPushNotification = function(deviceToken, messageBody, actionUrl) {
  var myPhone = deviceToken;
  var myDevice = new apn.Device(myPhone);
  var note = new apn.Notification();
  note.badge = 1;
  note.sound = "notification-beep.wav";
  note.alert = {
    "body": messageBody,
    "action-loc-key": "Play",
    "launch-image": "mysplash.png",
    "link": actionUrl
  };
  note.payload = {
    'messageFrom': 'Holly'
  };

  note.device = myDevice;

  var callback = function(errorNum, notification) {

  }
  var options = {
    gateway: 'gateway.sandbox.push.apple.com', // this URL is different for Apple's Production Servers and changes when you go to production
    errorCallback: callback,
    cert: './services/pushdistrubitioncertnew.pem',
    key: './services/PushDistrubutionkeynew.pem',
    passphrase: 'wonderwe',
    port: 2195,
    enhanced: true,
    cacheLength: 100
  }
  var apnsConnection = new apn.Connection(options);
  apnsConnection.sendNotification(note);

};

//Added server code for push Android
global.sendAndroidPushNotification = function(messageBody, deviceToken, actionUrl) {

  var message = new gcm.Message();
  //API Server Key
  var sender = new gcm.Sender('AIzaSyBbhtBT73uEAhPg6IPu7qrIKCaSMFJ-vqU');
  var registrationIds = [];
  // Value the payload data to send...
  message.addData('message', messageBody);
  message.addData('title', 'Wonderwe');
  message.addData('msgcnt', '3'); // Shows up in the notification in the status bar when you drag it down by the time
  message.addData('click_action', actionUrl); // Shows up in the notification in the status bar when you drag it down by the time

  /*message.addNotification({
    title: 'Alert!!!',
    body: messageBody,
    icon: 'ic_launcher',
    click_action: 'wonderwe://register'
  });
*/
  //message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app - may not work
  //message.collapseKey = 'demo';
  //message.delayWhileIdle = true; //Default is false
  message.timeToLive = 3000; // Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.
  // At least one reg id/token is required
  registrationIds.push(deviceToken);
  sender.send(message, registrationIds, 4, function(result) {

  });

};

var config = {
  provider: props.cloudProvide,
  key: props.cloudSecretKey, // secret key
  keyId: props.cloudAccessKey, // access key id
  region: 'us-east-1' // region
}

var client = new elasticsearch.Client({
  host: props.elasticServer,
  // log: 'trace'
})

app.get('/elasticsea/new', function(req, res) {


  client.get({
      index: 'we_dev',
      type: 'entity',
      id: '3816331'
    },
    function(err, result4) {
      if (err) {
        res.send(err)
      } else {
        res.send(result4)
      }

    })
})

var qs = require('querystring');
var clientId = 'dj0yJmk9MXZjWTFyQmFVRUdqJmQ9WVdrOWNIY3daalJ2TXpJbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD1jYg--';
var clientSecret = '0150c9f391e7e03bce9d92852a4b87eb6a833195';
var redirectUri = 'http://dev.wonderwe.com/auth/yahoo/callback';
app.get('/auth/yahoo', function(req, res) {

  var authorizationUrl = 'https://api.login.yahoo.com/oauth2/request_auth';

  var queryParams = qs.stringify({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code'
  });

  res.redirect(authorizationUrl + '?' + queryParams);
});

app.get('/auth/yahoo/callback', function(req, res) {

  var accessTokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';

  var options = {
    url: accessTokenUrl,
    headers: {
      Authorization: 'Basic ' + new Buffer(clientId + ':' + clientSecret).toString('base64')
    },
    rejectUnauthorized: false,
    json: true,
    form: {
      code: req.query.code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }
  };

  // 1. Exchange authorization code for access token.
  request.post(options, function(err, response, body) {
    var guid = body.xoauth_yahoo_guid;
    var accessToken = body.access_token;
    var socialApiUrl = 'https://social.yahooapis.com/v1/user/' + guid + '/profile?format=json';

    var contactsApiUrl = 'https://social.yahooapis.com/v1/user/' + guid + '/contacts';

    var options1 = {
      url: contactsApiUrl,
      headers: {
        Authorization: 'Bearer ' + accessToken
      },
      rejectUnauthorized: false,
      json: true
    };

    request.get(options1, function(err, response, body) {
      var contacts = body.contacts.contact.map(function(contact) {
        return contact.fields[0];
      });

      res.send(contacts);
    });
  });
});

var base64 = require('node-base64-image')

app.post('/org/basecode/mobile', function(req, res) {
  var options = {
    filename: 'test'
  }
  var imageData = new Buffer(req.body.imageUrl, 'base64')
  base64.base64decoder(imageData, options, function(err, saved) {
    if (err) {

    }
    var path = __dirname + '/' + options.filename + '.jpg'
    var filename = 'profile/' + uuid.v4() + '-' + uslug(options.filename + '.jpg')
    var ext = pathmodule.extname(options.filename + '.jpg')
    name = filename + ext
    var readStream = fs.createReadStream(path)
    storeInAmazon(readStream, name, function(err, url) {
      var jsonRes = {}
      jsonRes.success = true
      jsonRes.url = url
      var resize = req.body.resizeto
      var type = req.body.pic_type
      if (resize !== 'none') {
        if (type == 'campaign_pic') {
          if (req.body.modeOfType == 'edit') {
            jsonRes.url = props.thumbor + '369x275/' + url
            jsonRes.originalUrl = url
          } else {
            jsonRes.url = props.thumbor + '299x150/' + url
            jsonRes.originalUrl = url
          }
        } else if (type == 'org_banner') {
          jsonRes.url = props.thumbor + '275x275/' + url
          jsonRes.originalUrl = url
        } else if (type == 'org_logo') {
          jsonRes.url = props.thumbor + '283x283/' + url
          jsonRes.originalUrl = url
        } else if (type == 'profile_pic') {
          jsonRes.url = props.thumbor + '283x283/' + url
          jsonRes.originalUrl = url
        } else {
          jsonRes.url = url
        }
      } else {
        jsonRes.url = props.thumbor + '477x477/' + url
        jsonRes.originalUrl = url
      }
      urlStoreInRackspace(url, filename, ext, type)
      res.send(JSON.stringify(jsonRes))
    })
  })
})

app.get('/redirect/hotmail', function(req, res) {

});

app.get('/get/unique/slug', utility.generateUniqueSlug);

app.post('/send/giving-season/email', utility.sendGivingSeasonEmail);



function urlStoreInRackspace(path, name, ext, type) {
  var client = require('pkgcloud').storage.createClient(config)

  if (process.env.NODE_ENV == 'production') {
    var container = 'wonderwe-prod'
  } else {
    var container = 'wonderwe'
  }

  for (var i in imgDimension) {
    if (i == type) {
      async.each(imgDimension[i].dimensions, function(eachDimension, dimesionCallback) {
        var writeStream = client.upload({
          container: container,
          remote: name + '-size' + eachDimension + ext
        })
        request.get({
          url: props.thumbor + eachDimension + '/' + path,
        }).pipe(writeStream)

        dimesionCallback(null)

      }, function(err) {

      })
    } else {

    }
  }

  // TODO: Need to come up with a way to track this information.
}

function storeInAmazon(readStream, name, callback) {
  var client = require('pkgcloud').storage.createClient(config)

  if (process.env.NODE_ENV == 'production') {
    var amazonContainer = 'wonderwe-prod'
  } else {
    var amazonContainer = 'wonderwe'
  }

  var writeStream = client.upload({
    container: amazonContainer,
    remote: name
  })
  readStream.pipe(writeStream)

  writeStream.on('error', function(err) {
    // handle your error case
    callback(err, null)
  })

  writeStream.on('success', function(file) {
    // success, file will be a File model
    var cdnurl = props.cloudurl
    callback(null, cdnurl + name)
  })
}

app.use(logErrors)
app.use(clientErrorHandler)
app.use(errorHandler)
app.use(catchErrorHandler)

// Catch all 404 errors...
function catchErrorHandler(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  if (req.xhr) {
    res.status(404)
  } else {
    res.status(404)
  }
}

function logErrors(err, req, res, next) {
  // Here we need to trace all the errors what we get
  next(err)
}

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({
      error: 'Something blew up!'
    })
  } else {
    next(err)
  }
}

function errorHandler(err, req, res, next) {
  res.status(err.status || 500)
  res.send({
    'error': err.message
  })

}

app.use('/agenda-ui', agendaUI(agenda, {
  poll: false
}));






module.exports = app
