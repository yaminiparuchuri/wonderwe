var mysql = require('mysql');
// var pool = mysql.createPool({
//     host: '104.236.69.222',
//     user: 'root',
//     password: 'scriptbees1$',
//     database: "wonderwe_development_v1"
// });


pool.getConnection(function (err, connection) {
    if (err) {
        callback(err);
    } else {

        async.parallel({
                charity: function (callback) {

                    connection.query("select * from charity_tbl", function (err, guideStarEins) {

                        //charityInfo.name_tmp = data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
                        if (err) {
                            console.error(err);
                        } else {

                            async.each(guideStarEins, function (singleObj, eachCallback) {

                                if (singleObj.name_tmp == singleObj.name_tmp.toUpperCase()) {
                                    var name_tmp = singleObj.name_tmp.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) {
                                        return txt.toUpperCase();
                                    });
                                } else {
                                    var name_tmp = singleObj.name_tmp;
                                }

                                connection.query("update charity_tbl SET name_tmp=? WHERE id=?", [name_tmp, singleObj.id], function (err, charityUpdate) {
                                    eachCallback(null);
                                });
                            }, function (err) {
                                callback(null, 'done');
                            });
                        }
                    });
                },
                organization: function (orgcallback) {

                    connection.query("select * from organization_tbl", function (err, organizations) {

                        //charityInfo.name_tmp = data.organization_name.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) { return txt.toUpperCase(); });
                        if (err) {
                            console.error(err);
                        } else {

                            async.each(organizations, function (singleOrg, orgEachCallback) {

                                if (singleOrg.name_tmp == singleOrg.name_tmp.toUpperCase()) {
                                    var name_tmp = singleOrg.name_tmp.toLowerCase().replace(/\b(\s\w|^\w)/g, function (txt) {
                                        return txt.toUpperCase();
                                    });
                                } else {
                                    var name_tmp = singleOrg.name_tmp;
                                }
                                var short_name = name_tmp.slice(0, 18);

                                connection.query("update organization_tbl SET title=?,short_name=? WHERE id=?", [name_tmp, short_name, singleOrg.id], function (err, organizationUpdate) {
                                    orgEachCallback(null);
                                });
                            }, function (err) {
                                orgcallback(null, 'done');
                            });
                        }
                    });
                },
                campaign: function (campaignCallback) {

                    connection.query("select * from code_tbl", function (err, campaigns) {

                        //codeObject.sort_name = charityInfo.name_tmp.slice(0, 18);
                        async.each(campaigns, function (campaignObj, campaignCallback) {

                            var sort_name = campaignObj.title.slice(0, 18);
                            connection.query("update code_tbl SET sort_name=? WHERE id=?", [sort_name, campaignObj.id], function (err, campaignUpdate) {
                                campaignCallback(null);
                            });
                        }, function (err) {
                            campaignCallback(null, 'done');
                        });
                    });
                }
            },
            function (err, results) {
                // results now equals: {one: 1, two: 2}
                console.log('Done well..');
            });
    }
});
