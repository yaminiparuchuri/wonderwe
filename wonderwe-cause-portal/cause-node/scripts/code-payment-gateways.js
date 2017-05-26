var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var elasticsearch = require('elasticsearch');
var status;

var pool = mysql.createPool({
  host: props.host,
  port:props.port,
  user: props.username,
  password: props.password,
  database: props.database
});





function MigratePaymentGateways(){

	pool.query('SELECT * FROM code_tbl ORDER BY id DESC LIMIT 1000 OFFSET 1000',function(err,result){
		if(err){
			console.log(err);
			process.exit();
		}else{
			console.log('Total campaigns are:'+result.length);
			async.each(result,function(code,eachCallback){
				pool.query('INSERT INTO code_payment_gateways_tbl (code_id,user_id,charity_id,date_created,payment_gateway_id) VALUES (?,?,?,?,?)',[
					code.id,code.charity_id,code.user_id,code.date_created,code.payment_gateway_id
					],function(err,result){
						if(err){
							eachCallback(err);
						}else{
							console.log('Successfully inserted row:'+JSON.stringify(result));
							eachCallback(null);
						}
					})
			},function(err){
						console.log(err);
						process.exit();
					});
	}
	});

}//End of the function

console.log('Before going to payment gateways:');
MigratePaymentGateways();