var mysql=require('mysql');
//var moment = require('moment');
props = require('config').props
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
pool.query('select user_tbl.id,user_tbl.email,transaction_tbl.transaction_date,transaction_tbl.amount from user_tbl inner join transaction_tbl on user_tbl.id=transaction_tbl.user_id where transaction_date>="2016-06-11"',
	function(err, result)

{
	
	if(result.length==0)
	{
	
		       console.log("no records.....");
 
	}
	else
	{
		console.log(result.length);

		for(var i=0;i<result.length;i++)
		{
		console.log(result[i]);

		console.log("email send sucessfully....");
     	}
     	var name=["deepthi","bujji","deepu","deepika"];
       console.log(name.length);
         //var first=console.log(name[0]);
         var first = name.shift();
         //var pos = name.indexOf("Banana");
         //var shallowCopy = name.slice();
         var fname=name.push("deepthi12");
         //var newLength = name.push("pragathi");
         //var last=console.log(name[name.length-1]);
         //var newLength = name.unshift("bajji");
         //var last = name.pop();
         name.forEach(function (item, index, array) 
         {
          console.log(item, index);
         });
     	console.log("The Names are:................... "+name);
     	console.log(name[2]);
      //name.forEach(function (myString1, myString2)
      //{
        //console.log(myString1,myString2);
      //}
     	//console.log("<br><br><br>");
     	  var myString1="Hello";
        var myString2="All Are Welcome";
        var myString3="To Scriptbees";
        var Result=myString1 +" Everyone "+ myString2 +" "+ myString3 +" Company ";
        console.log(Result);   
        //alert(Result);  	
	}
	
});
//"'+moment().format('YYYY-MM-DD')+'"'
/*pool.query('select code_tbl.user_id,code_tbl.id,code_tbl.charity_id,code_tbl.code_slug,charity_tbl.name_tmp,charity_tbl.ein,charity_tbl.email from code_tbl inner join charity_tbl on code_tbl.charity_id=charity_tbl.id and DATE(code_tbl.date_created)>=CURDATE()',
  function(err, result){
    if(err){
      console.log(err);
    }else{
      if(result.length){
        console.log(result);
      }else{
        console.log('Sorry no results today');
      }
    }
  
  
});

pool.query('delete from code_tbl where id=''',
  function(err, result){
if(err){
      console.log(err);
    }else{
      if(result.length){
        console.log(result);
        console.log('Compaign deleted sucessfully.....');
      }else{
        console.log('Sorry,no data for information.....');
      }
    }
});

*/