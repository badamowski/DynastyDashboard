const https = require('https')
const FormData = require('form-data');

exports.handler = function(event, context, callback) {
  if(event.path == "/.netlify/functions/dynasty-101-search" && event.httpMethod == "POST"){
    var body = JSON.parse(event.body);

    if(body.entry){
      console.log("dynasty-101-search", body.entry);

      var form = new FormData();
      form.append('entry', body.entry);

      form.submit( 'https://dynasty101.com/calculator/loadEntry.php', function(err, response) {
        var combined = "";

        response.on("data", data => {
          combined += data.toString("utf8");
        });

        response.on("end", function(){
          if(combined){
            var returnObject = {
              name: combined.split(">")[1].split("</p")[0]
            };

            callback(null, {
              statusCode: 200,
              body: JSON.stringify(returnObject)
            });
          }else{
            callback(null, {
              statusCode: 500,
              body: "uh oh"
            });
          }
        });
      });
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