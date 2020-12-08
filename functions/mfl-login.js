const https = require('https')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
};

exports.handler = function(event, context, callback) {
  if(event.path == "/.netlify/functions/mfl-login" && event.httpMethod == "POST"){
    var body = JSON.parse(event.body);

    if(body.mflUsername && body.mflPassword){
      console.log("Logging In", body.mflUsername);

      var options = {
        hostname: "api.myfantasyleague.com",
        path: `/2020/login?USERNAME=${body.mflUsername}&PASSWORD=${body.mflPassword}&XML=1`,
        method: "POST",
        port: 443,
      };

      const req = https.request(options, response => {
        console.log(JSON.stringify(response.headers));
        console.log(JSON.stringify(response.headers["set-cookie"]));
        console.log(response.headers["set-cookie"]);
        response.on("data", data => {
          callback(null, {
            statusCode: 200,
            body: JSON.stringify(response.headers["set-cookie"]),
            headers: headers
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
        },
        headers: headers),
      };
    }
  }else{
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "invalid request"
      },
      headers: headers),
    };
  }
}