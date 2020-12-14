const https = require('https')
const FormData = require('form-data');

exports.handler = function(event, context, callback) {
  if(event.path == "/.netlify/functions/dynasty-101-value" && event.httpMethod == "POST"){
    var body = JSON.parse(event.body);

    if(body.info && body.QB){
      console.log("dynasty-101-value", body.info);

      var form = new FormData();
      form.append('info', body.info);
      form.append('QB', body.QB);

      form.submit( 'https://dynasty101.com/calculator/loadData.php', function(err, response) {
        var combined = "";

        response.on("data", data => {
          combined += data.toString("utf8");
        });

        response.on("end", function(){
          var returnObject = {
            value: combined.split("</span>")[0].split(">")[1],
            tier: combined.split("</span>")[1].split(">")[1]
          };
          callback(null, {
            statusCode: 200,
            body: JSON.stringify(returnObject)
          });
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