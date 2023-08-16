// https://github.com/Level-2/Synket
var net = require('net');

const Server = require(process.argv[3]);

var serverops = new Server();



var server = net.createServer(function (sock) {

	sock.on('data', function (data) {

		data = new Buffer.from(data).toString();
		data = JSON.parse(data);

		serverops[data.message](sock, data.args);
	});


}).listen(JSON.parse(process.argv[2]));