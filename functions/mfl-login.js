const https = require('https')

exports.handler = function(event, context, callback) {
  if(event.path == "/.netlify/functions/mfl-login" && event.httpMethod == "POST"){
    var body = JSON.parse(event.body);

    if(body.mflUsername && body.mflPassword){
      console.log("Logging In", body.mflUsername);

      console.log('here4')
      var options = {
        hostname: "api.myfantasyleague.com",
        path: `/2020/login?USERNAME=${body.mflUsername}&PASSWORD=${body.mflPassword}&XML=1`,
        method: "POST",
        port: 443,
      };

      const req = https.request(options, response => {
        console.log("response", JSON.stringify(response));
        console.log("headers", JSON.stringify(response.headers));

        response.on("data", data => {
          console.log("data", JSON.stringify(data));
          callback(data, 200);
        })
      });

      req.on("error", error => {
        console.log(JSON.stringify(error));
        callback(error, 500);
      });

      req.write("");
      req.end()

    }else{
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "invalid request"
        }),
      };
    }
  }else{
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "invalid request"
      }),
    };
  }
  console.log('here8');
}