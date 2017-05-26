var imgDimension = require('./../config/img-dimensions');
var async = require('async');
var uuid = require('node-uuid');
var uslug = require('uslug');
var pathmodule = require('path');
var request = require('request');
// Development SW3 credentials
// var props = {
//   cloudurl: "https://wonderwe.s3.amazonaws.com/",
//   cloudAccessKey: "AKIAITPV5X4X2BWSCQUA",
//   cloudSecretKey: "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",
//   cloudProvide: "amazon",
//   thumbor: "http://thumbor.scriptbees.com/unsafe/"
// };

// Producation SW3 Credentials

// var props = {
//   cloudurl: "https://wonderwe-prod.s3.amazonaws.com/",
//   cloudAccessKey: "AKIAITPV5X4X2BWSCQUA",
//   cloudSecretKey: "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",
//   cloudProvide: "amazon",
//   thumbor: "http://thumbor.scriptbees.com/unsafe/"
// };


// var config = {
//   provider: props.cloudProvide,
//   key: props.cloudSecretKey, // secret key
//   keyId: props.cloudAccessKey, // access key id
//   region: 'us-east-1' // region
// };


fs = require('fs');


// var defaultImages = [{
//   imagePath: '/Users/venkat/dev/git/wonderwe-cause-portal/website/out/images/default-charity-background.jpg',
//   imgType: 'org_banner'
// }];
[{
  imagePath: '/Users/venkat/dev/git/wonderwe-cause-portal/website/out/images/default-charity-background.jpg',
  imgType: 'org_banner'
}, {
  imagePath: '/Users/venkat/dev/git/wonderwe-cause-portal/website/out/images/default-campaign.png',
  imgType: 'campaign_pic'
}, {
  imagePath: '/Users/venkat/dev/git/wonderwe-cause-portal/website/out/images/default-charity.png',
  imgType: 'org_logo'
}, {
  imagePath: '/Users/venkat/dev/git/wonderwe-cause-portal/website/out/images/default-user.png',
  imgType: 'profile_pic'
}];

var uploadedImages = [];


async.eachSeries(defaultImages, function(singleImage, imageCallback) {

  var path = '',
    name = '';
  path = singleImage.imagePath; //__dirname + "/" + req.files.qqfile.path;
  var filename = 'profile/' + uuid.v4() + '-' + uslug(singleImage.imagePath.substring(singleImage.imagePath.lastIndexOf('/') + 1));
  var ext = pathmodule.extname(singleImage.imagePath.substring(singleImage.imagePath.lastIndexOf('/') + 1));
  name = filename + ext;

  var readStream = fs.createReadStream(path);
  storeInAmazon(readStream, name, function(err, url) {
    var jsonRes = {};
    jsonRes.success = true;
    jsonRes.url = url;
    var resize = '';

    var type = singleImage.imgType;

    jsonRes.originalUrl = url;

    urlStoreInRackspace(url, filename, ext, type);
    console.log(JSON.stringify(jsonRes));
    uploadedImages.push(jsonRes);
    imageCallback(null);
    //  res.send(JSON.stringify(jsonRes));
  });

}, function(err) {

  console.log('Done well..');
  //res.send(uploadedImages);

  console.log(uploadedImages);
});


function urlStoreInRackspace(path, name, ext, type) {

  var client = require('pkgcloud').storage.createClient(config);

  //if (process.env.NODE_ENV == 'production') {
  // Production S3 container
  // var container = "wonderwe-prod";
  //} else {
  // Development S3 container
  var container = "wonderwe";
  //}

  for (var i in imgDimension) {

    if (i == type) {

      async.each(imgDimension[i].dimensions, function(eachDimension, dimesionCallback) {

        var writeStream = client.upload({
          container: container,
          remote: name + '-size' + eachDimension + ext
        });
        console.log(name + '-size' + eachDimension + ext);
        request.get({
          url: props.thumbor + eachDimension + '/' + path,
        }).pipe(writeStream);

        dimesionCallback(null);

      }, function(err) {
        console.log('Done well...');
      });
    } else {
      console.log('Dimentions are not mateched...');
    }
  }

  //TODO: Need to come up with a way to track this information.
}


function storeInAmazon(readStream, name, callback) {
  var client = require('pkgcloud').storage.createClient(config);

  // if (process.env.NODE_ENV == 'production') {

  // Production S3 container
  // var amazonContainer = "wonderwe-prod";
  //} else {
  // Development S3 container
  var amazonContainer = "wonderwe";
  //}


  var writeStream = client.upload({
    container: amazonContainer,
    remote: name
  });
  readStream.pipe(writeStream);

  writeStream.on('error', function(err) {
    // handle your error case
    console.log(err);
    callback(err, null);
  });

  writeStream.on('success', function(file) {
    // success, file will be a File model
    var cdnurl = props.cloudurl;
    console.log(cdnurl);
    callback(null, cdnurl + name);
  });
}





/*var mysql = require('mysql');
var props = require('config').props;
var pool = mysql.createPool({
  host: props.host,
  user: props.username,
  password: props.password,
  database: props.database,
  connectionLimit: 1500,
  debug: props.dbdebug,
  acquireTimeout: 500000,
  connectTimeout: props.connectTimeout
});

var config = {
  provider: props.cloudProvide,
  key: props.cloudSecretKey, // secret key
  keyId: props.cloudAccessKey, // access key id
  region: 'us-east-1' // region
};
var client = require('pkgcloud').storage.createClient(config);
var container = "wonderwe";
pool.query('select code_picture_url as code_picture_url from code_tbl', function(err, result) {
  async.eachSeries(result, function(singleObj, callback) {
    if (singleObj.code_picture_url) {
      //console.log(singleObj.code_picture_url.slice(0,-4));
      //console.log(singleObj.code_picture_url.slice(-3));
      if (singleObj.code_picture_url.slice(-3) == 'png') {
        var str = singleObj.code_picture_url.slice(0, -4);
        var imgstr = str + '-size900x500.png';
        //console.log(imgstr);
        var name = imgstr.substring(imgstr.indexOf("/profile") + 1);
        console.log(name);
        var path = "http://thumbor.scriptbees.com/unsafe/900x500/" + singleObj.code_picture_url.replace(/\s/g, '');
        //console.log(singleObj.code_picture_url.split('.com'));
        //path.replace(/\s/g,'');
        console.log(path);

        var writeStream = client.upload({
          container: container,
          remote: name
        });
        request.get({
          url: path,
        }).pipe(writeStream);
        console.log('.................................................');
      } else {
        console.log('.................................................');
        var str = singleObj.code_picture_url.slice(0, -4);
        var imgstr = str + '-size900x500.jpg';
        //console.log(imgstr);
        //var str = "Abc: Lorem ipsum sit amet";
        var name = imgstr.substring(imgstr.indexOf("/profile") + 1);
        console.log(name);
        var path = "http://thumbor.scriptbees.com/unsafe/900x500/" + singleObj.code_picture_url.replace(/\s/g, '');
        //console.log(singleObj.code_picture_url.split('.com'));
        //path.replace(/\s/g,'');
        console.log(path);

        var writeStream = client.upload({
          container: container,
          remote: name
        });
        request.get({
          url: path,
        }).pipe(writeStream);

      }
    }
    //console.log(imgstr);

    callback(null);
  }, function(err) {
    console.log('done');
  })
});
*/