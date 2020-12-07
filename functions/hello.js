exports.handler = async function(event, context, callback) {
  console.log('queryStringParameters', event.queryStringParameters);
  console.log('body', event.body);
  console.log('httpMethod', event.httpMethod);
  console.log('path', event.path);
  console.log('headers', event.headers);
  console.log('isBase64Encoded', event.isBase64Encoded);
  return {
    statusCode: 200,
    body: JSON.stringify({ msg: 'Hello, World!' }),
  };
}