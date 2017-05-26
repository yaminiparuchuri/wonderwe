var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var pathmodule = require('path')
var request = require('request');

var pool = mysql.createPool({
  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database
});

// Development SW3 credentials


var config = {
  provider: props.cloudProvide,
  key: props.cloudSecretKey, // secret key
  keyId: props.cloudAccessKey, // access key id
  region: 'us-east-1' // region
};

if (props.environment_type === "production") {
  // Producation SW3 Credentials
  var container = "wonderwe-prod";
} else {
  var container = "wonderwe";
}

var client = require('pkgcloud').storage.createClient(config);

var eachDimension = '900x675';



pool.query('select * from code_tbl where code_picture_url is not null', [], function(err, result) {
  if (err) {
    console.log('This is in error mode.');
    console.log(err);
  } else {
    async.each(result, function(singleObj, callback) {
    
      var originalImage = singleObj.code_picture_url; //'https://wonderwe.s3.amazonaws.com/profile/72fb651e-2854-461b-a56e-192f8c08f90a-0x600jpg.jpg';

      if (originalImage.indexOf('/profile/') != -1) {
        var typeOfImage = "profile";
        var namesArray = originalImage.split('/profile/')[1].split('.');
      } else {

        var typeOfImage = "direct";
        var splitedArray = originalImage.split('s3.amazonaws.com/');

        if (splitedArray && splitedArray.length > 1) {
          var namesArray = splitedArray[1].split('.');
        } else {
          var namesArray = [];
        }
      }

      if (namesArray && namesArray.length > 0) {

        var filename = namesArray[0];

        var ext = pathmodule.extname(originalImage);

        if (typeOfImage === 'profile') {
          var remoteDirectory = 'profile/' + filename + '-size' + eachDimension + ext;
        } else {
          var remoteDirectory = filename + '-size' + eachDimension + ext;
        }

        var writeStream = client.upload({
          container: container,
          remote: remoteDirectory
        });
        request.get({
          url: props.thumbor + eachDimension + '/' + originalImage,
        }).pipe(writeStream);

        writeStream.on('error', function(err) {
          // handle your error case
          console.log('Error data...');
          console.log(err);

          callback(null);
        });
        writeStream.on('success', function(file) {
          // success, file will be a File model
          console.log('Success');
          //console.log(file);
          callback(null);
        });

      } else {
        callback(null);
      }

    }, function(err) {
      console.log(err);
      console.log('Done well...');
    });
  }
});
