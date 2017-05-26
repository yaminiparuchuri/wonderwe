var mysql = require('mysql');
var props = require('config').props;
var async = require('async');
var request = require('request');
var pool = mysql.createPool({
  host: props.host,
  port:props.port,
  user: props.username,
  password: props.password,
  database: props.database,
  connectionLimit: props.connectionLimit,
  debug: props.dbdebug,
  connectTimeout: props.connectTimeout
});


pool.getConnection (function(err) {
	console.log('Error'+err);
	if (err) {
		console.error(err);
	}						
  pool.query("select slug from entity_tbl where entity_type='user' LIMIT 0,4", function(err, entityResult){
  	if(err){
  		console.error(err);      		
    }else{
      async.each(entityResult,function(singleObj, eachCallback) {  
         var url='http://free.sharedcount.com/?url='+props.domain+'/'+singleObj.slug+'&apikey='+props.shared_count_key;  
            request.get({
              headers: {
                'content-type' : 'application/x-www-form-urlencoded'
              },
              url:url
              },function(error,response,body,url){

              body = JSON.parse(body);                

        			if(singleObj && singleObj.slug){   			
          			var fb_count;
          			if(typeof body.Facebook === 'object'){
          				fb_count = body.Facebook.total_count;
          			}else{
          				fb_count = body.Facebook;
          			}        		
        				pool.query('UPDATE entity_tbl SET facebook_shares= ?, tweets= ?, linkedin= ?, google_plus= ?, pinterest= ? where slug= ?' ,[fb_count,body.Delicious,body.GooglePlusOne,body.LinkedIn,body.Pinterest,singleObj.slug],function(err, entityResult){
        					if (err){
                    console.log(err);
                  }else{
                    console.log(result);
                  }       					
        				});
        			}else{
        				eachCallback(null);
        			}
        		});
 
        		 },

        		function(err){
        			callback(err,'done');
        		}); 
        	}
        });
});

