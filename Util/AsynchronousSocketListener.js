'use strict';

const net = require('net');
const Extensions = require('./Extensions');
const StateObject = require('./StateObject');

class AsynchronousSocketListener {
    constructor() {
        //
    }

    startListening(ip, port, _callBack) {
        return new Promise((resolve, reject) => {

            this.callBack = _callBack;

            const server = net.createServer((socket) => {

                this.acceptCallback(socket);

            });

            server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    reject(`Error: Port (${port}) is already in use.`);
                } else {
                    reject(`Error: ${error.message}`);
                }
            });

            server.listen(port, ip, () => {
                resolve(`Listening on ${ip}:${port}`);
            });
        });
        
    }

    //async acceptCallback(socket) {
    acceptCallback(socket) {

        const state = new StateObject(socket);

        socket.on('data', (data) => {
            try {
                const bytesRead = data.length;

                if (bytesRead > 0) {

                    if (state.size === -1) {

                        // const temp = data.slice(0, 8);
                        state.size = Number(this.bufferToLong(data));
                        state.bytes = Buffer.alloc(state.size);

                        state.bytesRead = bytesRead - 8;

                        if (bytesRead - 8 > 0) {

                            data.copy(state.bytes, 0, 8);

                            // state.ms.write(data.slice(8, bytesRead));
                        }
                    } else {
                        state.bytes = Extensions.concatWith(state.bytes, data);
                        //state.ms.write(data.slice(0, bytesRead));
                        state.bytesRead += bytesRead;
                    }

                    if (state.bytesRead >= state.size) {
                        this.processResponse(state);
                    }
                }
            } catch (error) {
                const sHeader = "HTTP/1.0 400 Bad Request\r\n"
                    + "Content-Type: text/html\r\n\r\n"
                    + error.message;
                const buffer = Buffer.from(sHeader);
                socket.write(buffer);
                socket.end();
            }
        });

        socket.on('error', (error) => {
            try {
                socket.end();
            } catch (error) {
                // nada
            }
        });
    }

    async readAsync(socket, buffer) {
        return new Promise((resolve, reject) => {
            socket.on('data', (data) => {
                const bytesRead = data.copy(buffer);
                resolve(bytesRead);
            });

            socket.on('error', (error) => {
                reject(error);
            });
        });
    }

    async processResponse(state) {
        this.callBack(state);
    }

    bufferToLong(buffer) {
        return buffer.readBigInt64LE();
    }
}

module.exports = AsynchronousSocketListener;