var express = require('express');
var router = express.Router();
var indexService = require('../services/index');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/getcodecategories/:skip', function(req, res, next) {
  var obj = {};
  console.log(req.query.category_id);
  obj.skip=req.params.skip;
  if (req.query.category_id) {
    obj.categoryId = req.query.category_id;
  }
  indexService.getAllCampaignsBasedOnCategory(obj, function(err, result) {
    console.log(err);
    console.log(result);
    var obj={};
    //obj.layout="layout";
    console.log(result);
    obj.campaigns=JSON.stringify(result);
    console.log()
    res.render('index',obj);
  })

});

module.exports = router;
