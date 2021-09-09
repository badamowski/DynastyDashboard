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

      var path = `/2021/export?${leagueQueryParams}`;

      var hostname = "api.myfantasyleague.com";
      if(body.hostname){
      	hostname = body.hostname;
      }

      var method = "GET";
      if(body.method){
      	method = body.method;
      }

      var options = {
        hostname: hostname,
        path: path,
        method: method,
        headers: {"Cookie": body.mflCookies}
      };

      const req = https.request(options, response => {

        var combined = "";

        response.on("data", data => {
          combined += data.toString("utf8");
        });

        response.on("end", function(){
          callback(null, {
            statusCode: 200,
            body: combined
          });
        });
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