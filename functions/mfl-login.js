const https = require('https')

exports.handler = function(event, context, callback) {
  if(event.path == "/.netlify/functions/mfl-login" && event.httpMethod == "POST"){
    var body = JSON.parse(event.body);

    if(body.mflUsername && body.mflPassword){
      console.log("Logging In", body.mflUsername);

      var options = {
        hostname: "api.myfantasyleague.com",
        path: `/2021/login?USERNAME=${body.mflUsername}&PASSWORD=${body.mflPassword}&XML=1`,
        method: "POST",
        port: 443,
      };

      const req = https.request(options, response => {
        response.on("data", data => {
          callback(null, {
            statusCode: 200,
            body: JSON.stringify(response.headers["set-cookie"])
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