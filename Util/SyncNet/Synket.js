// https://github.com/Level-2/Synket
var childProcess = require('child_process');

module.exports = class {
	constructor(socket) {
		this.socket = socket;
	}

	startServer(module) {
		return childProcess.spawnSync('node', [__dirname + '/Client.js', 'start', JSON.stringify({ args: [this.socket, module] })]);
	}

	send(data, args) {
		if (args) {
			data = JSON.stringify({ message: data, args: args });
		}

		var result = childProcess.spawnSync('node', [__dirname + '/Client.js', 'send', JSON.stringify({
			args: [this.socket,
				data
			]
		})]);

		if (new Buffer.from(result.stderr).toString().trim("\n").length > 0) {	// .from
			throw new Error(new Buffer.from(result.stderr).toString());
		}
		return new Buffer.from(result.stdout).toString().trim("\n");
	}

	sendB(data) {

		const size = Buffer.alloc(8);
		size.writeBigInt64LE(BigInt(data.length));
		const combinedBuffer = Buffer.concat([size, data]);

		var result = childProcess.spawnSync('node', [__dirname + '/Client.js', 'sendB', JSON.stringify({
			args: [this.socket,
				combinedBuffer
			]
		})]);

		try {
			const resultB = new Buffer.from(result.stdout, "ascii");
			const resultSizeB = resultB.slice(0, 8);
			const bigIntValue = resultSizeB.readBigInt64LE();
			const resultSize = Number(bigIntValue);
			const fullResultB = resultB.slice(8, resultSize + 8);
			return fullResultB;
		} catch (ex) {
			if (new Buffer.from(result.stderr).toString().trim("\n").length > 0) {	// .from
				var ret = new Buffer.from(result.stderr).toString();
				throw new Error(new Buffer.from(result.stderr).toString());
			} else {
				throw ex;
			}
		}
	}
}
