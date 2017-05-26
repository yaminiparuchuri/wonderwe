exports.getZones = function(callback) {

  excuteQuery.queryForAll(sqlQueryMap['allzones'],[], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      callback(null, result);
    }
  });
};
exports.getZoneById = function(id,callback) {
 //As it only returns one returning the first Object
  excuteQuery.queryForAll(sqlQueryMap['getZoneById'],[id], function(err, result) {
    if (err) {
      callback(err, null);
    } else if (result) {
      callback(null, result);
    }
  });
};



