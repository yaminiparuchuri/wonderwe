

exports.saveOrganizationDetails = function(organization){

	excuteQuery.insertAndReturnKey(sqlQueryMap['saveOrganization'],[organization.name,organization.email,oganization.phone_number,'giving_season'],
		function(err,result){
			if(err){
				callback(err,null);
			}else{	
				callback(null,{
					message:'Successfully stored'
				});
			}
	});

};