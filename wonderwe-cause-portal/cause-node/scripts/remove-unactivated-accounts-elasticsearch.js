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

/*   elasticClient = new elasticsearch.Client({
     host: props.elasticServer,
     log: props.elasticSearchlog
   })*/
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
   pool.query('select * from user_tbl where active is NULL', function(err, entityResult) {
     if (err) {
       console.error(err);
     } else {
       async.each(entityResult, function(entityObj, entityCallback) {
         //console.log(entityObj);
         if (entityObj && entityObj.id) {
           pool.query('select * from entity_tbl where entity_id=? and entity_type=?', [entityObj.id, 'user'], function(err, entityData) {
             if (err) {
               entityCallback(err);
             } else {
               console.log(entityData);
               if (entityData && entityData.length > 0) {
                 elasticClient.delete({
                   index: props.elastic_index,
                   type: 'entity',
                   id: entityData[0].id
                 }, function(error, response) {
                   if (error) {
                     entityCallback(error);
                   } else {
                     console.log(response);
                     entityCallback(null);
                   }
                 });
               } else {
                 entityCallback(null);
               }
             }
           })
         } else {
           entityCallback(null);
         }
       }, function(err) {
         if (err) {
           console.log(err);
         } else {
           console.log('.......Done........');
         }
       });
     }
   });
