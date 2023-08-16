// https://github.com/Level-2/Synket
const spawn = require('child_process').spawn;

const net = require('net');

class Operations {
	start(sockdef, module) {

		var tries = 0;
		var int = setInterval(function () {
			var socket = net.connect(sockdef, function (one, two) {
				clearInterval(int);
				process.exit();

			});

			socket.once('error', function () {
				//On the first try, start the server
				//Then keep trying to connect until it's up
				if (tries == 0) {
					spawn('node', [__dirname + '/Server.js', JSON.stringify(sockdef), module], {
						detached: true
					}).unref();

				}
				tries++;
			});

			if (tries > 1000) {
				console.log('Could not connect to socket');
				clearInterval(int);
				process.exit();
			}
		}, 1);
	}

	send(socket, data) {
		var socket = net.connect(socket, function () {
			socket.write(data);

			socket.on('data', function (data) {
				console.log(new Buffer.from(data).toString()); // .from
				process.exit();
			})
		});
	}

	sendB(socket, data) {
		var socket = net.connect(socket, function () {
			let myData = Buffer.from(data, "ascii");
			socket.write(myData);

			socket.on('data', function (data) {
				console.log(new Buffer.from(data).toString("ascii")); // .from
				process.exit();
			})
		});
	}
}


var ops = new Operations();

if (process.argv[3]) {
	var args = JSON.parse(process.argv[3]).args;
}
else args = [];

ops[process.argv[2]].apply(ops, args);
