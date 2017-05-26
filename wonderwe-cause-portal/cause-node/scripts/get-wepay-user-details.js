var props = require('config').props;
var wepay = require('wepay').WEPAY

var wepay_settings = {
    'client_id': props.client_id,
    'client_secret': props.client_secret,
    'access_token':'PRODUCTION_d7d6571c986753eb79ef93d2fd9ac95c4de3da920f0313bf81b8390d2b9b8b58'
};

var wp = new wepay(wepay_settings);
	if(props.environment_type  === 'production'){
		console.log('In production');
		wp.use_production();
	}else{
		wp.use_stage();
	}
wp.call('/user',{},function(response){
	console.log(response);
 	var buffer = new Buffer(response);
    var responseObj = JSON.parse(buffer.toString('utf-8'));
    console.log(responseObj);
});