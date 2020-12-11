const https = require('https')

exports.handler = function(event, context, callback) {
  if(event.path == "/.netlify/functions/mfl-export" && event.httpMethod == "POST"){
    var body = JSON.parse(event.body);

    if(body.mflCookies && event.queryStringParameters.TYPE){
      console.log("Export call", event.queryStringParameters);

      var leagueQueryParam = "";
      if(event.queryStringParameters.L){
        leagueQueryParam = "&L=" + event.queryStringParameters.L;
      }

      var path = `/2020/export?TYPE=${event.queryStringParameters.TYPE}${leagueQueryParam}&JSON=1`;

      var options = {
        hostname: "api.myfantasyleague.com",
        path: path,
        method: "GET",
        port: 443,
        headers: {"Cookie": body.mflCookies}
      };

      const req = https.request(options, response => {
        response.on("data", data => {
          callback(null, {
            statusCode: 200,
            body: data.toString("utf-8")
          });
        })
      });

      req.on("error", error => {
        callback(Error(error));
      });

      req.write("");
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