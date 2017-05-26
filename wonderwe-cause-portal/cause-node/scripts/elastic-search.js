var props = require('config').props;
var elasticsearch = require('elasticsearch');
var elasticClient = new elasticsearch.Client({
  host: props.elasticServer,
  log: props.elasticSearchlog
});

elasticClient.get({
	index:props.elastic_index,
	type:'entity',
	id:3981799
},function(err,result){
	if(err){
		console.log(err);
	}else{
		console.log('Total:');
		console.log(result.hits.hits.length);
	}
});


