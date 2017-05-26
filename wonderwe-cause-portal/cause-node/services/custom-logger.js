module.exports = function(req, res, next){

	var method = req.method;
	var url = req.url;

	var startTime = +new Date();
	var stream = process.stdout;
	res.on('finish',function(){

		var duration = +new Date() - startTime;

	stream.write('Time Taken for method '+ duration +' ms \n\n url..'+ req.url + '\n\n');
	stream.write('....................ONE.................................');
	});

	next();

};