'use strict';

const net = require("node:net");
const def_TIME_OUT = 5000;

module.exports = class SKClient {

    constructor(_ip = "", _port = 0) {
        this.response = [];
        this.send_result = false;
        this.recive_result = false;
        this.connect_result = false;
        this.ip = _ip;
        this.port = _port;
    }

    get IP() {
        return this.ip;
    }

    set IP(value) {
        this.ip = value;
    }

    get Port() {
        return this.port;
    }

    set Port(value) {
        this.port = value;
    }

    Conectar(callback) {

        this.mySocket = new net.Socket();

        this.mySocket.connect(this.port, this.ip, () => {
            // Conexão estabelecida com sucesso
            callback(true);
        });

        this.mySocket.on('error', (error) => {
            // Ocorreu um erro na conexão
            console.error('Erro na conexão:', error.message);
            callback(false);
        });

        this.mySocket.setTimeout(def_TIME_OUT, () => {
            // Timeout ocorreu antes da conexão ser estabelecida
            console.error('Timeout ao conectar.');
            //this.Socket.end(); // Encerra a conexão
            callback(false);
        });
    }

    Send(dataBuffer, callback) {
        
        if (!this.mySocket || !this.mySocket.writable) {
            this.Conectar(function (connectResult) {
                if (!connectResult) {
                    // Falha na conexão
                    callback(null);
                    return false;
                }
            });
        } 

        if (dataBuffer.length > 0) {
            const sizeBuffer = Buffer.alloc(8);
            sizeBuffer.writeBigInt64LE(BigInt(dataBuffer.length), 0);

            //const dataBuffer = Buffer.from(data);
            const sendData = Buffer.concat([sizeBuffer, dataBuffer]);

            const sendBufferSize = 1024; // StateObject.BufferSize;
            let position = 0;

            function sendPartialData(socket) {
                const sendEnd = Math.min(position + sendBufferSize, sendData.length);
                const outBytes = sendData.slice(position, sendEnd);
                socket.write(outBytes, function () {
                    position = sendEnd;
                    if (position < sendData.length) {
                        sendPartialData(socket);
                    } else {

                        let dataSize = -1; // Inicializa com tamanho de dados desconhecido
                        let receivedData = Buffer.alloc(0);

                        socket.on('data', (data) => {
                            receivedData = Buffer.concat([receivedData, data]);

                            while (dataSize === -1 && receivedData.length >= 8) {
                                // Verifica se há dados suficientes para ler o tamanho da mensagem
                                dataSize = Number(receivedData.readBigInt64LE(0));
                                receivedData = receivedData.slice(8);
                            }

                            if (dataSize !== -1 && receivedData.length >= dataSize) {
                                // Agora temos dados suficientes para a mensagem inteira
                                const message = receivedData.slice(0, dataSize);
                                callback(message);
                                // Limpa o buffer de dados para a próxima mensagem
                                receivedData = receivedData.slice(dataSize);
                                dataSize = -1;
                            }
                        });

                    }
                });
            }

            sendPartialData(this.mySocket);
            return true;
        } else {
            callback(null);
            return false;
        }
        /*
        // Exemplo de uso:
        const myData = Buffer.from('Olá, servidor!');
        Send(myData, function (response) {
          if (response) {
            console.log('Resposta do servidor:', response);
          } else {
            console.log('Falha no envio ou resposta não recebida.');
          }
        });
        */
    }
}