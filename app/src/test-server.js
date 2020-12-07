var PORT = process.argv[2] || 8080;

var restify = require("restify");
var server = restify.createServer();

var post_handler = function(req, res, next) {
	//setTimeout(function(){
		res.send(req.body);
	//}, 1000);
};

server.use(restify.bodyParser());
server.post(".*", post_handler);

server.get(".*", restify.serveStatic({
	directory: __dirname,
	maxAge: 0
}));

var server_up = function() {
	console.log("Server listening on Port: " + PORT);
};

server.listen(PORT, server_up);
