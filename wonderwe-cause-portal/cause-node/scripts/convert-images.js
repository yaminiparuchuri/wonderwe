imgDimension = require('./../config/img-dimensions');
var uuid = require('node-uuid');
var async = require('async');
var uslug = require('uslug');
var request = require('request');
var fs = require('fs');
var mysql = require('mysql');
// var pool = mysql.createPool({
//   host: '104.131.114.107',
//   user: 'root',
//   password: 'wonderwe1$',
//   database: "wonderwe_prod"
// });

// Default images for production

// https://wonderwe-prod.s3.amazonaws.com/profile/1c105613-9f90-4b4f-a72e-e915ee6d661a-default-campaignpng.png
// https://wonderwe-prod.s3.amazonaws.com/profile/f87e09bd-ce96-442b-83de-8ef867f86811-default-charitypng.png
// https://wonderwe-prod.s3.amazonaws.com/profile/265772b8-20b4-4275-8952-a18e586d0859-default-userpng.png

//http://www.guidestar.org/ViewEdoc.aspx?eDocId=2304424&approved=true
//
var config = {
  provider: 'amazon',
  key: 'sTrYWOCVyRlcTfY1Ju8pOCvwQHvvkgPCVrRWxpWv', // secret key
  keyId: 'AKIAITPV5X4X2BWSCQUA', // access key id
  region: 'us-east-1' // region
};
var pathmodule = require('path');


var logosDir = '/home/sbees/ssh-git/wonderwe-cause-portal/logos';

fs.readdir(logosDir, function(err, files) {
  if (err) throw err;
  var c = 0;
  var samplefiles = [];
  samplefiles.push(files[2]);
  //samplefiles.forEach(function(file) {

  async.eachSeries(files, function(file, fileCallback) {

    var path = logosDir + '/' + file;
    console.log(file);
    var filename = 'profile/' + uuid.v4() + '-' + uslug(file);
    var ext = pathmodule.extname(file);
    name = filename + ext;
    console.log(path);
    var readStream = fs.createReadStream(path);

    //    var ein= (file.split('.jpg')[0]).split('-').join('');
    //console.log(ein);

    storeInAmazon(readStream, name, function(err, url) {

      var jsonRes = {};
      jsonRes.success = true;
      jsonRes.url = url;
      var type = 'org_logo';

      urlStoreInRackspace(url, filename, ext, type, function(err, dimensionCallback) {
        var ein = (file.split('.jpg')[0]).split('-').join('');

        var sql = "SELECT * from charity_tbl where ein=" + ein;
        console.log(ein);
        pool.getConnection(function(err, connection) {
          if (err) {
            console.log('error connection error');
            console.log(err);
            fileCallback(null);
          } else {

            connection.query(sql, function(err, guideStarEins) {
              connection.release();
              if (err) {
                console.log('error sql query');
                console.log(err);
                fileCallback(null);
              } else {
                
                if (guideStarEins && guideStarEins.length > 0) {
console.log(guideStarEins[0].id);
                  var orgid = guideStarEins[0].organization_id;
                  console.log(orgid);
                  console.log(url);
                  var updateQuery = "UPDATE organization_tbl SET profile_pic_url=? where id= ?";

                  connection.query(updateQuery, [url, orgid], function(err, updateUrlResult) {
                    console.log(err);
                  //  console.log(updateUrlResult);

                    fileCallback(null);
                  });
                } else {
                  console.log('No charity found');
                  fileCallback(null);
                }
              }
            });
          }
        });
      });
    });

  }, function(err) {
    console.log('Finished Up Well...');
  });

  // });
});


function urlStoreInRackspace(path, name, ext, type, dimensionCallback) {

  var client = require('pkgcloud').storage.createClient(config);

  /* if (process.env.NODE_ENV == 'production') {
     
   } else {*/
  var container = "wonderwe-prod";
  // }
//  console.log(type);
  for (var i in imgDimension) {

    if (i == type) {

      async.each(imgDimension[i].dimensions, function(eachDimension, dimesionCallback) {

        var writeStream = client.upload({
          container: container,
          remote: name + '-size' + eachDimension + ext
        });
      //  console.log(name + '-size' + eachDimension + ext);
        request.get({
          url: 'http://thumbor.scriptbees.com/unsafe/' + eachDimension + '/' + path,
        }).pipe(writeStream);

        dimesionCallback(null);

      }, function(err) {
        console.log('Done well...');
        dimensionCallback(null, 'done');

      });
    } else {
      console.log('Dimentions are not mateched...');
    }
  }
}

function storeInAmazon(readStream, name, callback) {
  var client = require('pkgcloud').storage.createClient(config);

  /*  if (process.env.NODE_ENV == 'production') {
      
    } else {
  */
  var amazonContainer = "wonderwe-prod";
  //  }


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
    var cdnurl = 'https://wonderwe-prod.s3.amazonaws.com/'; //'https://wonderwe-prod.s3.amazonaws.com';
    console.log(cdnurl);
    callback(null, cdnurl + name);
  });
}







/*async.parallel({
    organization: function(callback) {
      //body
      var sql = "SELECT * from organization_tbl";

      pool.getConnection(function(err, connection) {
        if (err) {
          console.log('error');
          console.log(err);
        } else {
          connection.query(sql, function(err, guideStarEins) {




          });
        }
      });

    },
    campaign: function(callback) {
      //body



    },
  },
  function(err, results) {
    // results now equals: {one: 1, two: 2}

  });*/














/*
var sql = "SELECT * from organization_tbl";
pool.getConnection(function(err, connection) {
  if (err) {
    callback(err);
  } else {
    connection.query(sql, function(err, guideStarEins) {
      if (err) {
        callback(err);
      } else {
        //

        var client = require('pkgcloud').storage.createClient(config);
        var filename = 'profile/' + uuid.v4() + '-' + uslug('charitylogo');

        var writeStream = client.upload({
          container: 'wonderwe',
          remote: filename + '.jpg'
        });
        request.get(
          'https://www.guidestar.org/ViewEdoc.aspx?eDocId=2304424&approved=true'
        ).pipe(writeStream);

        writeStream.on('success', function(file) {
          // success, file will be a File model
          console.log('Done well');
          console.log(file);

        });

        writeStream.on('error', function(err) {
          // handle your error case
          console.log(err);

        });
        async.eachSeries(guideStarEins, function(singleObj, callback) {


           var client = require('pkgcloud').storage.createClient(config);

           if (process.env.NODE_ENV == 'production') {
             var container = "wonderwe-prod";
           } else {
             var container = "wonderwe";
           }

           for (var i in imgDimension) {

             if (i == 'org_logo') {

               async.each(imgDimension[i].dimensions, function(eachDimension, dimesionCallback) {


                 var filename = 'profile/' + uuid.v4() + '-' + uslug(req.files.qqfile.originalname);

                 var writeStream = client.upload({
                   container: container,
                   remote: name + '-size' + eachDimension + ext
                 });
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
         }, function(err) {

         });

      }
    });
  }
});
*/
