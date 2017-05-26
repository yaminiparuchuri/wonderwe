var express = require('express');
var seoRouter = express.Router();
var seoServices = require('../services/seo');

seoRouter.get('/cause-directory', function(req, res, next) {

  var object = {};  
  var pageSeoData = {}; 
  object.layout = 'pages';
  pageSeoData.seoTitle = "Sitemap"
  object.metadata = pageSeoData;
  seoServices.getSiteMapHome(function(err, smResult) {
    if (err) {
     console.log("error occured in creating home sitemap ->"+err);
    } else {
     object.sitemapData = smResult ;
     res.set('Cache-Control','no-cache');
     res.render('./pages/sitemaphome', object);
     }
  });

});


seoRouter.get('/:city/cause-directory', function(req, res, next) {

  var cityName = req.params.city;
  cityName = toTitleCase(cityName);
  var object = {};
  var pageSeoData = {};
  object.layout = 'pages';
  pageSeoData.seoTitle = cityName+" Sitemap";
  object.metadata = pageSeoData;
  object.city = cityName;
  seoServices.getSiteMapHomeCity(object.city,function(err, smResult) {
    if (err) {
     console.log("error occured in creating city sitemap ->"+err);
    } else {
     object.sitemapData = smResult ;
     res.set('Cache-Control','no-cache');
     res.render('./pages/sitemapcity', object);

    }
  });


});

var toTitleCase = function(str){
    str = str.replace(/-/g,' ');
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

module.exports = seoRouter;
