var embededRouter = express.Router();
var embeded = require('../services/embeded');


embededRouter.get('/:slug/:color/:size',function(req,res){

	var data = {
		slug:req.params.slug,
		color:req.params.color,
		size:req.params.size
	};
	

	embeded.getEmbedSlug(data.slug,function(err,result){
		if(err){
			res.render('404');
		}else{			
			result.size = data.size;
			result.color = data.color;
			result.layout = 'embeded';
			result.domain = props.domain;
			res.set('Cache-Control', 'no-cache');
			res.render('./pages/new-embeded',result);
		}
	});

});



embededRouter.get('/:slug/:width/:height/:color',function(req,res){
	console.log('In the slug');
	var slug = req.params.slug;
	var width = req.params.width;
	var height = req.params.height;
	var color = req.params.color;

	if(color === 'light'){
		color = 'l';
	}else if(color === 'dark'){
		color = 'd';
	}

	var widgetId = width+'x'+height+'_'+color;

	embeded.getEmbedSlug(slug,function(err,result){
		if(err){
			res.render('404');
		}else{
			result.layout = 'embeded';
			result.width = width;
			result.height = height;
			result.color = color;
			result.widgetId = widgetId;
			result.domain = props.domain;
			res.set('Cache-Control', 'no-cache');
			res.render('./pages/embeded-campaign',result);
			//res.send(result);
		}
	});
});


module.exports = embededRouter;