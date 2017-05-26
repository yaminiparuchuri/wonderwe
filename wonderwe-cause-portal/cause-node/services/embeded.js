

exports.getEmbedSlug = function(slug,callback){
	var me = this;
	console.log('In get embeded call');
	excuteQuery.queryForAll(sqlQueryMap['validateEntitySlug'],[slug],function(err,result){
		if(err){			
			callback(new Error(err),null);
		}else{
			console.log(result);
			if(result.length){
				result = result[0];
				if(result.entity_type === 'code'){
					me.getCampaignCardData(slug,callback);
				}else if(result.entity_type === 'charity'){
					me.getCharityCardData(slug,callback);
				}else{
					callback('Not found',null);
				}
			}else{
				callback(null,null);
			}
		}
	});
};

exports.getCampaignCardData = function(slug,callback){
	console.log('In get campagin data');
	excuteQuery.queryForAll(sqlQueryMap['getCampaignCardInfo'],[slug],function(err,result){
		if(err){
			utility.nodeLogs({
				message:'Error in getting card details',
				error:err
			});
			callback(new Error(err),null);
 		}else{
 			if(result[0]){
 				if(result[0].donation_progress > 100){
 					donation_progress = 100;
 				}	
				result[0].donatePer = parseInt((parseFloat(result[0].donation) / parseFloat(result[0].goal)) * 100);				
			}
			callback(null,result[0]);
		}
	});
};

exports.getCharityCardData = function(slug,callback){
	var me = this;
	excuteQuery.queryForAll(sqlQueryMap['getCharityDefaultCampaign'],[slug],function(err,result){
		if(err){
			console.log(err);
			utility.nodeLogs({
				message:'Error in getting card details',
				error:err
			});
			callback(new Error(err),null);
		}else{		
			if(result[0]){
				excuteQuery.queryForAll(sqlQueryMap['getEntity'],[result[0].id,'code'],function(err,result){
					if(err){
						utility.nodeLogs({
							message:'Error in getting card details',
							error:err
						});
						callback(new Error(err),null);
					}else{
						me.getCampaignCardData(result[0].slug,callback);
					}
				});
			}else{
				callback({error:'Does not have default campaign'},null);
			}
		}
	});	
};