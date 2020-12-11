const https = require('https')

exports.handler = function(event, context, callback) {
  if(event.path == "/.netlify/functions/mfl-export" && event.httpMethod == "POST"){
    var body = JSON.parse(event.body);

    if(body.mflCookies && event.queryStringParameters.TYPE){
      console.log("Export call", event.queryStringParameters);

      var leagueQueryParams = "";
      Object.keys(event.queryStringParameters).forEach(function(key,index) {
	    leagueQueryParams += key + "=" + event.queryStringParameters[key] + "&";
	  });
	  leagueQueryParams += "JSON=1";

      var path = `/2020/export?${leagueQueryParams}`;

      var options = {
        hostname: "api.myfantasyleague.com",
        path: path,
        method: "GET",
        port: 443,
        headers: {"Cookie": body.mflCookies}
      };

      const req = https.request(options, response => {
        response.on("data", data => {
        	console.log("HERE");
        	console.log(data);
        	var returnValue;
        	if(Buffer.isBuffer(data)){
        		returnValue = data.toString("utf-8");
        	}else{
        		returnValue = JSON.stringify(data);
        	}
        	console.log(returnValue);
          callback(null, {
            statusCode: 200,
            body: returnValue
          });
        })
      });

      req.on("error", error => {
      	console.log(error);
        callback(null, {
        	statusCode: 500,
        	body: error
        });
      });

      req.end()

    }else{
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "invalid request"
        })
      };
    }
  }else{
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "invalid request"
      })
    };
  }
}