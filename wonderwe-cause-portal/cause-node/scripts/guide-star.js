var rp = require('request-promise');
var fs = require('fs');
var jsdom = require('jsdom');
var jquery = fs.readFileSync('jquery.js','utf8');
var mysql = require('mysql');
var props = require('config').props;
var json2csv = require('json2csv');
var async = require('async');

var charities = [];


pool = mysql.createPool({
  host: props.host,
  user: props.username,
  password: props.password,
  port: props.port,
  database: props.database,
  connectionLimit: props.connectionLimit,
  debug: props.dbdebug,
  connectTimeout: props.connectTimeout
    //  acquireTimeout : 30000
});

var headers = {
		'Proxy-Authorization':'Basic OWM0MmFiYmItYjY2ZC00Y2YwLTg0NjYtMDQ1ZjVjY2RiZDU3OmJjNzU1N2E0OWY4MGVlNDQ2ZWY4ZTU3MGQ5MTNiMTdkYTlhZWI3Mzk=',
		'X-Distil-Ajax':'suxzuwzbadedvqrarucqsu',
		'Cookie':'D_SID=49.207.162.148:JQ6n63Uzq1SBGDYsOMHj/3yd+IlI9X8aRlcmItb7E5o; hsfirstvisit=https%3A%2F%2Fwww.guidestar.org%2FHome.aspx|https%3A%2F%2Fwww.google.com%2F|1480448098983; __leadinmigrated=1; __leadinutk=cf1bd9236ba08a34a9713786115357b4; _vis_opt_exp_86_exclude=1; _vwo_uuid=6D7623C20F4DB718FE554A037657412E; _vis_opt_exp_87_combi=2; _vis_opt_exp_87_goal_3=1; _vis_opt_exp_87_goal_7=1; _vis_opt_exp_87_goal_8=1; _vis_opt_exp_87_goal_9=1; ASP.NET_SessionId=f022qng0kixlfcu1b5jdnggs; today=1; .gifAuth=D97FA24FE5802E26F57089AD9791CF909CDB5936869226AE185B7D1ED8D6BD4CDF961A0FD510ADE5D12F807D9622011EC2BB97C010AC18242AC7323D503E08C139994349AD7C908768B3584EEA993CAC99ED260B9077888AE0A18A71BDFE36E6A482B83B5FF5144F505B0E9C; _vis_opt_s=7%7C; _vis_opt_exp_87_split=2; _vis_opt_exp_87_goal_11=1; mp__mixpanel=%7B%22distinct_id%22%3A%20%22amar%40wonderwe.com%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Flearn.guidestar.org%2Fproducts%2Fbusiness-solutions%2Fguidestar-apis%22%2C%22%24initial_referring_domain%22%3A%20%22learn.guidestar.org%22%2C%22__mps%22%3A%20%7B%7D%2C%22__mpso%22%3A%20%7B%7D%2C%22__mpa%22%3A%20%7B%7D%2C%22__mpu%22%3A%20%7B%7D%2C%22__mpap%22%3A%20%5B%5D%2C%22%24email%22%3A%20%22amar%40wonderwe.com%22%2C%22%24first_name%22%3A%20%22Amaranadh%22%2C%22%24last_name%22%3A%20%22Meda%22%2C%22Market%20Segment%22%3A%20%22Technology%20Providers%22%2C%22Market%20Subsegment%22%3A%20%22Other%22%2C%22GX%20NPO%20Manager%22%3A%20%22No%22%2C%22Premium%22%3A%20%22No%22%2C%22Charity%20Check%22%3A%20%22No%22%2C%22Premium%20Pro%22%3A%20%22No%22%2C%22Financial%20SCAN%22%3A%20%22No%22%2C%22Company%20Name%22%3A%20%22WonderWe%22%7D; __atuvc=2%7C48%2C0%7C49%2C13%7C50; _vis_opt_test_cookie=1; _ga=GA1.2.626327253.1480448086; ki_t=1480448098915%3B1481469094156%3B1481503030147%3B6%3B149; ki_r=; D_PID=A5C388A2-CC0D-3B15-90AC-7DDC4CF3B728; D_IID=AB5A7AA8-2EF8-3D94-BD75-435A3D88179E; D_UID=2567EEDA-1742-356A-8764-9B1C7AA382AD; D_HID=INI3O8lKQ+XWk8Ao4SJkM8LgZH2o4nNsUJykJn27GWc; D_ZID=55DE710E-FABB-381E-9C98-1B5F895D8CC5; D_ZUID=240327B2-85BC-3E4B-96EA-D6E490E0B816; __hstc=126119634.cf1bd9236ba08a34a9713786115357b4.1480448098986.1481484329639.1481501968872.15; __hssrc=1; hubspotutk=cf1bd9236ba08a34a9713786115357b4; _vwo_uuid_v2=F3962F83C5629DE8D1638FB5B66F1C59|cf10b63946a85495766c64f53d9b471f; mp_5d9e4f46acaba87f5966b8c0d2e47e6e_mixpanel=%7B%22distinct_id%22%3A%20%22amar%40wonderwe.com%22%2C%22%24search_engine%22%3A%20%22google%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fwww.google.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22www.google.com%22%2C%22__mps%22%3A%20%7B%7D%2C%22__mpso%22%3A%20%7B%7D%2C%22__mpa%22%3A%20%7B%7D%2C%22__mpu%22%3A%20%7B%7D%2C%22__mpap%22%3A%20%5B%5D%2C%22%24email%22%3A%20%22amar%40wonderwe.com%22%2C%22%24first_name%22%3A%20%22Amaranadh%22%2C%22%24last_name%22%3A%20%22Meda%22%2C%22Company%20Name%22%3A%20%22WonderWe%22%2C%22Market%20Segment%22%3A%20%22Technology%20Providers%22%2C%22Market%20Subsegment%22%3A%20%22Other%22%2C%22GX%20NPO%20Manager%22%3A%20%22No%22%2C%22Premium%22%3A%20%22No%22%2C%22Charity%20Check%22%3A%20%22No%22%2C%22Premium%20Pro%22%3A%20%22No%22%2C%22Financial%20SCAN%22%3A%20%22No%22%7D; mp_mixpanel__c=1',
		'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36',
		'Content-Type':'multipart/form-data',
		'ASP.NET_SessionId':'f022qng0kixlfcu1b5jdnggs',
		'D_UID':'2567EEDA-1742-356A-8764-9B1C7AA382AD',
		'Referer':'http://www.guidestar.org/search',
		'Origin':'http://www.guidestar.org',
		'Proxy-Connection':'keep-alive',
		'X-Requested-With':'XMLHttpRequest'
	};

function getRequest(){

pool.query('SELECT * FROM charity_tbl WHERE id NOT IN (SELECT charity_id FROM charity_claim_tbl) AND state IN (select id FROM states_tbl WHERE country_id=223)  LIMIT 5 OFFSET 5',function(err,result){

if(err){
	console.log(err);
}else{

async.eachSeries(result,function(ele,eachCallback){



var formData = {
	CurrentPage:1,
	SearchType:'org',
	Keywords:ele.ein,
	incomeRangeLow:'$0',
	incomeRangeHigh:'high',
	PeopleZipRadius:'Zip Only',
	PeopleIncomeRangeLow:'$0',
	PeopleIncomeRangeHigh:'max',
	PeopleAssetsRangeLow:'$0',
	PeopleAssetsRangeHigh:'max'
};

getNewCookie(function(){


rp({
	url:'http://www.guidestar.org/search/SubmitSearch',
	method:'POST',
	formData:formData,
	headers:headers
	})
	.then(function(result){
		console.log(result);
		var ein = JSON.parse(result).Hits[0].Ein;
		console.log('http://www.guidestar.org/profile/'+ein);
		return rp({
			url:'http://www.guidestar.org/profile/'+ein,
			method:'GET',
			headers:headers
		});		
	})
	.then(function(result){

		jsdom.env({
			html:result,
			src:[jquery],
			done:function(err,window){
				if(err){
					console.log('Error in jsdom:');
					console.error(err);
				}else{
					var $ = window.$;					
					if(window.document.querySelector('.value.no-padding.hyphenate')){
						ele.email = window.document.querySelector('.value.no-padding.hyphenate').innerHTML;					
						charities.push(ele);
					}else{
						charities.push(ele);
					}
					setTimeout(function(){
						console.log('After 10 seconds')
						eachCallback(null);
					},15000);
					//eachCallback(null);
				}
			}
		});
	})
	.error(function(err){
		console.log('In the error:');
		console.log(err);
	});

	});
	},function(err){
		if(err){
			console.log(err);
			console.log(charities);
		}else{
			console.log('No error in the else');
			var charitiesCsv = json2csv({ data: charities});
			fs.writeFileSync('6-100.csv',charitiesCsv);
		}
	});

	}
});

}

 function getNewCookie(callback){
 	var chLength = charities.length;
	if(chLength=>3 && (charities.length%3 === 0)){
var request = require('request');
		request({
			url:'http://www.guidestar.org/ga.019219.js?PID=A5C388A2-CC0D-3B15-90AC-7DDC4CF3B728',
			method:'GET',
			headers:headers
		},function(error,response,body){
			if(error){
				//callback(error,null)
			}else{
				callback(null,null);
			}
		});
	}else{
		console.log()
		callback(null,null);
	}
} 

//getNewCookie();
getRequest();
