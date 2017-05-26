/***
* Agenda :Converting xml file to html file
* node_xslt file
* npm install node_xslt
* Reports xml file created on reports folder .
* reports html file created on same reports folder as well. 
*/


var fs = require('fs');
var xslt = require('node_xslt');
var xmlstring = fs.readFileSync('reports/TEST-FrisbyTestRegisterUser.xml',{encoding:'utf8'});
var xslString = fs.readFileSync('default_xslt.xsl',{encoding:'utf8'});
var styleSheet = xslt.readXsltString(xslString);
var document = xslt.readXmlString(xmlstring);
var data = xslt.transform(styleSheet,document,[]);
fs.writeFileSync('../../website/out/test_reports/index.html',data);
console.log('file created successfully');