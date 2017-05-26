var request = require('request-promise');
var domain = 'http://localhost:3005';



var options = {
	method:'POST',
	uri:domain+'/pages/charity/signup/claim',
	body:{
		"first_name":"Anjelica",
		"last_name":" ",
		"charity_name":"Girls Youth Basketball",
		"address":{
			"city":"",
			"state":"Nevada",
			"country":"US",
			"postal_code":""
		},
			"org_logo_url":"",
			"phone":"6619931280	",
			"email":"anjelica@gyblv.com"
		},
		"ein":"47-3498943",
		json:true
};

function addCharityClaim(){

request(options)
	.then(function(result){
		console.log(result);
	})
	.error(function(err,result){
		console.log(err);
		console.log(result);
	});

}



function checkUserEmailAndCreate(){
	var options = {
		method:'GET',
		url:domain+'/pages/email/presence/anjelica@gyblv.com/Anjelica'
	};

	request(options)
		.then(function(result){
			console.log(result);
		})
		.catch(function(err){
			console.log(err);
		});
}

function sendSetPasswordEmail(){
	var options = {
		method:'GET',
		url:domain+'/auth/resetpassword/anjelica@gyblv.com?setPassword=yes'
	};
	request(options)
		.then(function(result){
			console.log(result);
		})
		.catch(function(err){
			console.log(err);
		})
}


function createWepay(){
	var options = {
		method:'POST',
		url:domain+'/wepay/create/accoount',
		json:true,
		body:{
			"id":310,
			"original_ip":"49.207.171.153",
			"original_device":"153.171.207.49-ras.beamtele.net",
			"user_id":2978,
			"charity_id":2677612
		}
	};

	request(options)
		.then(function(result){
			console.log(result);
		})
		.catch(function(err){
			console.log('in fail');
			console.log(err);
		});
}

//addCharityClaim();
//checkUserEmailAndCreate();
//sendSetPasswordEmail();



createWepay();

