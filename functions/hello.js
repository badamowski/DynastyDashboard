// this uses the callback syntax, however, we encourage you to try the async/await syntax shown in async-dadjoke.js
export function handler(event, context, callback) {
  console.log('queryStringParameters', event.queryStringParameters);
  console.log('body', event.body);
  console.log('httpMethod', event.httpMethod);
  console.log('path', event.path);
  console.log('headers', event.headers);
  console.log('isBase64Encoded', event.isBase64Encoded);
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({ msg: 'Hello, World!' }),
  })
}