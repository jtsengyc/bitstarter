#!/usr/bin/env node
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "";

var assertURLWorking = function(url){
	 rest.get(url).on('complete', response2console);

}
var assertFileExists = function(infile){
	var instr = infile.toString();
	if(!fs.existsSync(instr)){
		console.log("%s does not exist. Exiting.", instr);
		process.exit(1);
	}
	return instr;
};

var htmlFileString = function(htmlfile){
	return fs.readFileSync(htmlfile);
};

var loadChecks = function(checksfile){
	return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(htmlString, checksfile){
	$ = cheerio.load(htmlString);
	var checks = loadChecks(checksfile).sort();
	var out = {};
	for(var ii in checks){
		var present = $(checks[ii]).length > 0;
		out[checks[ii]] = present;
	}
	var outJson = JSON.stringify(out, null, 4);
        console.log(outJson);
};

var checkHtmlLink = function(url, responsefn){
        rest.get(url).on('complete', responsefn);
};

var buildresfn = function(checkfile){
	var responsefn = function(result, response){
		if(result instanceof Error){
			console.error('Error: ' + util.format(response.message));
		}else{
			checkHtml(result, checkfile);
		}
	};
	return responsefn;
};

var clone = function(fn){
	return fn.bind({});
};

if(require.main == module){
	program
		.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
		.option('-f, --file [html_file]', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
		.option('-u, --url [url_path]', 'Path to url' , "")
		.parse(process.argv);
	
	if(program.url.length === 0){
		checkHtml(htmlFileString(program.file), program.checks);
	}else{
		var responsefn = buildresfn(program.checks);
		checkHtmlLink(program.url, responsefn);
	}
}else{
	exports.checkHtml= checkHtml;
}

