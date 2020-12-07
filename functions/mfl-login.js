const https = require('https')

exports.handler = async function(event, context, callback) {

  console.log("Logging in", event.body.mflUsername);
  var options = {
    hostname: "api.myfantasyleague.com",
    path: `/2020/login?USERNAME=${event.body.mflUsername}&PASSWORD=${event.body.mflPassword}&XML=1`,
    method: "POST"
  };

  const req = https.request(options, response => {
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
}