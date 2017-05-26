

// var mysql = require('mysql');
// var pool = mysql.createPool({
// 	host : '104.236.69.222',
// 	user : 'root',
// 	password : 'scriptbees1$',
// 	database : "wonderwe_development"
// });
var async = require('async');
pool.getConnection(function(err) {
	console.log('Error'+err);
	if (err) {
		console.error(err);
	} else {

		async.parallel({
			organization: function(callback){
        //body
        pool.query("select * from organization_tbl", function(err, codeResult) {
        	if(err){
        		console.error(err);
        	}else{

        		async.each(codeResult,function(singleObj, eachCallback){
        			if(singleObj && singleObj.title){
        				var short_name = singleObj.title.slice(0, 18);

        				pool.query("update organization_tbl set short_name=? where id=?",[short_name,singleObj.id], function(err, codeUpdateResult) {
        					eachCallback(null);
        				});
        			}else{
        				eachCallback(null);
        			}

        		},function(err){
        			callback(err,'done');
        		});
        	}
        });
    },
    charity: function(callback){
        //body
        pool.query("select * from charity_tbl", function(err, codeResult) {
        	if(err){
        		console.error(err);
        	}else{

        		async.each(codeResult,function(singleObj, eachCallback){

        			if(singleObj && singleObj.name_tmp){
        				var short_name = singleObj.name_tmp.slice(0, 18);

        				pool.query("update charity_tbl set short_name=? where id=?",[short_name,singleObj.id], function(err, codeUpdateResult) {
        					eachCallback(null);
        				});
        			}else{
        				eachCallback(null);
        			}

        		},function(err){
        			callback(err,'done');
        		});
        	}
        });
    },
    code: function(callback){
        //body
        pool.query("select * from code_tbl", function(err, codeResult) {
        	if(err){
        		console.error(err);
        	}else{
        		console.log(codeResult);

        		async.each(codeResult,function(singleObj, eachCallback){

        			if(singleObj && singleObj.title){

        				var short_name = singleObj.title.slice(0, 18);

        				pool.query("update code_tbl set short_name=? where id=?",[short_name,singleObj.id], function(err, codeUpdateResult) {
        					eachCallback(null);
        				});
        			}else{
        				eachCallback(null);
        			}
        		},function(err){
        			callback(err,'done');
        		});
        	}
        });
    }
},
function(err, results) {
    // results now equals: {one: 1, two: 2}
    console.log('Done well');
});
}
});
