const https = require('https')

exports.handler = function(event, context, callback) {
  if(event.path == "/.netlify/functions/dynasty-101-value" && event.httpMethod == "POST"){
    var body = JSON.parse(event.body);

    if(body.info && body.QB){
      console.log("dynasty-101-value", body.info);

      var postData = "info:" + body.info + "\nQB:" + body.QB;
      console.log(postData);
      var options = {
        hostname: "dynasty101.com",
        path: "/calculator/loadData.php",
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': postData.length
        }
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

      req.write(postData);

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