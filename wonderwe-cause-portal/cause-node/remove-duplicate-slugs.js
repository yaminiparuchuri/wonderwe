var mysql = require('mysql');
var async = require('async');
var props = require('config').props;
var elasticsearch = require('elasticsearch');

var pool = mysql.createPool({
  host: props.host,
  user: props.username,
  password: props.password,
  database: props.database
});

var client = new elasticsearch.Client({
  host: props.elasticServer,
  // log: 'trace'
});


/*
// To get the  Unwanted data from entity_tbl

select * from entity_tbl where id not in (
 select e.id from entity_tbl e 
 inner join charity_tbl c on c.id= e.entity_id and e.entity_type ='charity') and entity_type='charity';

// To delete the unwanted data from entity_tbl

delete ee.* from entity_tbl ee
where ee.entity_type='charity' and ee.id not in (
SELECT D.id FROM (
 select e.id from entity_tbl e 
 inner join charity_tbl c on c.id= e.entity_id and e.entity_type ='charity') as D);
*/
recurringMethod();

function recurringMethod() {

  pool.query("select * from ww_duplicate_slugs_tbl where status=? limit 100", ['np'], function(err, duplicateData) {
    console.log(err);
    if (duplicateData.length === 0) {
      process.exit(0);
    }
    console.log(duplicateData.length);

    if (duplicateData && duplicateData.length > 0) {
      async.eachSeries(duplicateData, function(duplicateObj, eachCallback) {
        //console.log(duplicateObj);
        pool.query('select * from entity_tbl where slug =? and entity_type=?', [duplicateObj.slug, 'charity'], function(err, charitySlugData) {
          if (err) {
            console.log('Inner Block error:' + JSON.stringify(err));
            eachCallback(null);
          } else {
            //console.log(charitySlugData);

            if (charitySlugData && charitySlugData.length > 1) {
              console.log('First Slug...');
              async.eachSeries(charitySlugData, function(singleObj, callback) {
                slugCheckupandUpdate(singleObj, function(err, result333) {
                  pool.query('update ww_duplicate_slugs_tbl set status =? where id=?', ['done', duplicateObj.id], function(err, sulugUpdateDone) {
                    callback(null);

                  });
                });
              }, function(err) {
                eachCallback(null);
              });
            } else {
              eachCallback(null)
            }
          }
        });
      }, function(err) {
        console.log('Done well..');
        recurringMethod();
      });
    } else {
      console.log('We are good with the entity data..');
    }
  });

}





function slugCheckupandUpdate(singleObj, callback) {
  // console.log(singleObj);
  pool.query('select * from entity_tbl where slug =? and entity_type=?', [singleObj.slug, 'charity'], function(err, entityResult) {
    if (err) {
      console.log('Error in entity slug check');
      callback(err, null);
    } else {
      console.log(entityResult);
      if (entityResult && entityResult.length > 1) {
        var slugQuery = "select e.id as entity_id, e.slug, c.id as charity_id, sst.abbreviation,c.ein from weprod.entity_tbl e inner join weprod.charity_tbl c on c.id= e.entity_id and e.entity_type='charity' left outer join weprod.states_tbl st on st.id= c.state left outer join weprod.state_tbl sst on sst.name = st.name where e.id =?"
        pool.query(slugQuery, [singleObj.id], function(err, charityDataResult) {
          if (err) {
            callback(err, null);
          } else {

            if (charityDataResult && charityDataResult.length > 0) {
              //  console.log('This is from first/second...');
              //  console.log(charityDataResult);
              if (charityDataResult[0].abbreviation) {
                var slug = charityDataResult[0].slug + '-' + charityDataResult[0].abbreviation.toLowerCase() + '-' + charityDataResult[0].ein;
              } else {
                var slug = charityDataResult[0].slug + '-' + charityDataResult[0].ein;
              }
              singleObj.slug = slug;
              console.log('Calling back to data...');
              slugCheckupandUpdate(singleObj, callback);
            } else {
              console.log('SOmething broken thing...');
              callback(null, null);
            }
          }
        });
      } else {
        console.log('Updated script for slug');
        console.log(singleObj);

        client.update({
            index: props.elastic_index + '_np',
            type: 'charity_for_fundraiser',
            id: singleObj.id,
            body: {
              doc: { username: singleObj.slug }
            }
          },
          function(err, result345) {
            console.log('Elastic server response..');
            console.log(err);
            console.log(result345);
          });

        // callback(null, null);
        pool.query('update entity_tbl set slug=? where id=?', [singleObj.slug, singleObj.id], callback);

      }
    }
  });
}
