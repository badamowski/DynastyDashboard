const https = require('https')

exports.handler = async function(event, context, callback) {
  if(event.path == "/.netlify/functions/mfl-login" && event.httpMethod == "POST"){
    var body = JSON.parse(event.body);

    if(body.mflUsername && body.mflPassword){
      console.log("Logging In", body.mflUsername);
      var options = {
        hostname: "api.myfantasyleague.com",
        path: `/2020/login?USERNAME=${body.mflUsername}&PASSWORD=${body.mflPassword}&XML=1`,
        method: "POST"
      };

      const req = await https.request(options, response => {
        console.log("response", response);
        console.log("headers", res.headers);

        res.on("data", data => {
          console.log("data", data);
          return {
            statusCode: 200,
            body: JSON.stringify(data),
          };
        })
      })

      req.on("error", error => {
        console.error(error);

        return {
          statusCode: 500,
          body: JSON.stringify(error),
        };
      })

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
}