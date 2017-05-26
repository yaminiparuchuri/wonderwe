var widgetRouter = express.Router();
var offerService = require('../services/offers');

/**
 * [description]
 * @param  {[type]} req      [description]
 * @param  {[type]} res){} [description]
 * @return {[type]}          [description]
 */

widgetRouter.get('/widgets',function(req,res,next){
	var slug = req.query.slug;
	var obj = {};	
	obj.googleSLSearch = "googleSLSearch";
	obj.donornav = 'donor';
	obj.layout = 'pages';
	obj.empty = "empty";
	obj.domain = props.domain;
	obj.slug = slug;
	obj.size = 'blog';
	obj.color = 'orange';
	obj.width = 460;
	obj.height = 523;
	obj.metadata = {
		"seoTitle":"Widgets"
	}
	obj.sessionid = req.cookies.logindonorid;

	res.render('./pages/widgets',obj);	
});

widgetRouter.post('/save/organization',function(req,res,next){
	var organization = req.body;
	offerService.saveOrganizationDetails(organization,function(err,result){
		if(err){
			res.statusCode = 400;
			res.send(err);
		}else{
			res.send(result);
		}
	});
});

widgetRouter.get('/unsubscribe',function(err,result){
	obj.metadata = {
		"seoTitle":"unsubscribe features"
	}
	
});

module.exports = widgetRouter;
