var fs = require('fs');
var xml2json = require("node-xml2json");



var content = fs.readFileSync(__dirname + '/sql-queries.xml');

var XMLMapping = require('xml-mapping');
 
 var json = XMLMapping.load('<key>value</key>');
var xml  = XMLMapping.dump(json);
//var json = XMLMapping.tojson(content);

//var json     = xml2json.parser( content,'CDATA' );
//['sql-queries']['sql-query'];


var xml2json = require('broccoli-xml2json');
var json = xml2json(content, {});

/*sqlQueryMap = {};
for (var i = 0; i < sqlQueries.length; i++) {
  sqlQueryMap[sqlQueries[i]['id']] = sqlQueries[i]['$t'];
}*/
var naptanParse = require('./naptan.js');
fs.createReadStream(__dirname + '/sql-queries.xml').pipe(naptanParse()).pipe(fs.createWriteStream('./naptan.json'));
var content = fs.readFileSync('./naptan.json');
