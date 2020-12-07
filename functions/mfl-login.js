const https = require('https')

exports.handler = async function(event, context, callback) {
  if(event.path == "/.netlify/functions/mfl-login" && event.httpMethod == "POST"){
    var body = JSON.parse(event.body);

    if(body.mflUsername && body.mflPassword){
      console.log("Logging In", body.mflUsername);
      mflLogin(body).then(function(data){
        console.log('here');
        console.log(data);
        return {
          statusCode: 200,
          body: JSON.stringify(data)
        };
      }).catch(function(error){
        console.log('here2');
        console.log(error);
        return {
          statusCode: 500,
          body: JSON.stringify(error)
        };
      });

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

mflLogin = function(body){
  console.log('here3')
  return new Promise((resolve, reject) => {
      console.log('here4')
        var options = {
          hostname: "api.myfantasyleague.com",
          path: `/2020/login?USERNAME=${body.mflUsername}&PASSWORD=${body.mflPassword}&XML=1`,
          method: "POST"
        };

        const req = https.request(options, response => {
          console.log("response", response);
          console.log("headers", res.headers);

          res.on("data", data => {
            console.log("data", data);
            resolve(data);
          })
        });

        req.on("error", error => {
          console.error(error);
          reject(error);
        });

        req.write();

        req.end()
    });
}