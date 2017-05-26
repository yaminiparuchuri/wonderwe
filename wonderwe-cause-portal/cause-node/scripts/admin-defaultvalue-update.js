var mysql = require('mysql');
var pool = mysql.createPool({
  host: '104.236.69.222',
  user: 'root',
  password: 'scriptbees1$',
  database: "wonderwe_development"
});
var async = require('async');
pool.getConnection(function(err, connection) {
  if (err) {
    console.log(err);
  } else {
    connection.query("select id from charity_tbl", function(err, charityresult) {
      if (err) {
        console.log(err);
      } else {
        async.each(charityresult, function(singleobject, eachcallback) {
          var charity_id = singleobject.id;
          connection.query("select * from charity_admin_tbl where charity_id =? and default_value=1", [charity_id], function(err, result) {
            if (err) {
              console.log(err);
              eachcallback(err);
            } else {
            	
              if (result && result.length > 0 &&result[0].default_value&&result[0].default_value == 1) {
                console.log(".................................................1");
                eachcallback(null);
              } else {
                connection.query("select * from charity_admin_tbl where charity_id =?", [charity_id], function(err, defaultresult) {
                  if (err) {
                    console.log(err);
                    eachcallback(err);
                  } else {

                    if (defaultresult && defaultresult.length > 0) {
                      console.log("............null.......");
                      console.log(defaultresult);
                      connection.query("UPDATE charity_admin_tbl set default_value=1 where charity_id=? limit 1; ", [charity_id], function(err, result) {
                              if (err) {
                              	console.log(err);
                              } else {
                              	console.log("updated successfully");
                              }
                         	});
                      eachcallback(null);
                    }else{
                    	console.log("............new.......");
                    	eachcallback(null);
                    }
                  }
                });
              }
            }

          });
        }, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log(".......done..............");
          }
        });
      }
    });
  }
});
