var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var elasticsearch = require('elasticsearch');

var pool = mysql.createPool({

  host: props.host,
  port: props.port,
  user: props.username,
  password: props.password,
  database: props.database
});

elasticClient = new elasticsearch.Client({
  host: props.elasticServer,
  log: props.elasticSearchlog
})

elasticClient.ping({
  // ping usually has a 3000ms timeout
  requestTimeout: Infinity,
  hello: "elasticsearch!"
}, function(error) {
  if (error) {
    console.trace('elasticsearch cluster is down!');
  } else {
    console.log('Elastic server is up..');
    console.log('All is well');
  }
});

recurringMethod();

function recurringMethod() {

  pool.query('SELECT ein, id as charity_id, COUNT(*) c FROM charity_tbl GROUP BY ein HAVING c > 1 limit 10', function(err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log(result.length);
      if (result.length === 0) {
        process.exit(0);
      }

      async.each(result, function(singleCharity, eachCallback) {

        pool.query('select id, organization_id,ein from charity_tbl where ein =?', [singleCharity.ein], function(err, charityResult) {
          if (err) {
            console.log(err);
          } else {

            if (charityResult && charityResult.length > 1) {

              var charityId = charityResult[0].id
              var orgid = charityResult[0].organization_id;

              var elasticQuery = "select * from entity_tbl where entity_id = ? and entity_type = 'charity'";

              //    var campaignsDelete = "delete e.*,c.*,uu.* from entity_tbl e inner join code_tbl c on c.id = e.entity_id and e.entity_type = 'code' left outer join slug_manager_tbl uu on uu.entity_id = e.id where e.entity_id in (select temp.id from (select id from code_tbl where charity_id = ?) as temp) and e.entity_type = 'code'";

              //  var charityDelete = "delete c.*,e.*,o.*,sutt.* from charity_tbl c inner join entity_tbl e on e.entity_id = c.id and e.entity_type = 'charity' inner join organization_tbl o on o.id = c.organization_id left outer join slug_manager_tbl sutt on sutt.entity_id=e.id where c.id = ?";

              pool.query(elasticQuery, [charityId, charityId], function(err, elasticResult) {
                if (err) {
                  console.error(err);
                  eachCallback(err);
                } else {
                  async.each(elasticResult, function(entityObj, elasticCallback) {

                    elasticClient.delete({
                      index: 'we_prod_np',
                      type: 'charity_for_fundraiser',
                      id: entityObj.id
                    }, function(error, response) {
                      if (error) {
                        console.error(error);
                        elasticCallback(error);
                      } else {
                        console.log(response);
                        elasticCallback(null);
                      }
                    });
                  }, function(err) {
                    if (err) {
                      eachCallback(err);
                    } else {
                      async.parallel({
                        charity: function(callback2) {
                          pool.query('delete from charity_tbl where id=?', [charityId], callback2);
                        },
                        entity: function(callback2) {
                          pool.query('delete from entity_tbl where entity_id=? and entity_type=?', [charityId, 'charity'], callback2);
                        },
                        entity: function(callback2) {
                          pool.query('delete from organization_tbl where id=?', [orgid], callback2);
                        }
                      }, function(err, asyncResult) {
                        if (err) {
                          console.log(err);
                          console.log('end of async result..');
                          eachCallback(err);
                        } else {
                          eachCallback(null);
                        }
                      });
                    }
                  });
                }
              });
            } else {
              console.log('else break');
              eachCallback(null);
            }
          }
        });
      }, function(error) {
        console.log(error);
        console.log('DOne wel...');
        //  recurringMethod();
      });
    }
  });
}
