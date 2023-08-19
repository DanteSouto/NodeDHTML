const dgram = require('dgram');

class Broadcaster {
    constructor(message, broadcastAddress, port) {
        this.message = message;
        this.broadcastAddress = broadcastAddress;
        this.port = port;

        this.server = dgram.createSocket('udp4');
        this.server.on('message', (message, remote) => {
            console.log(`Mensagem recebida de ${remote.address}:${remote.port}: ${message}`);
        });

        this.server.bind(this.port, () => {
            this.server.setBroadcast(true);
            this.startBroadcasting();
        });
    }

    sendBroadcastMessage() {
        const client = dgram.createSocket('udp4');
        client.bind(() => {
            client.setBroadcast(true);
            client.send(this.message, this.port, this.broadcastAddress, () => {
                client.close();
            });
        });
    }

    startBroadcasting() {
        this.sendBroadcastMessage();
        setInterval(() => {
            this.sendBroadcastMessage();
        }, 10000); // Enviar a cada 10 segundos
    }
}

// Uso da classe Broadcaster
const message = Buffer.from('Sua mensagem de broadcast aqui.');
const broadcastAddress = '255.255.255.255';
const port = 12345;

function main() {
    const broadcaster = new Broadcaster(message, broadcastAddress, port);
}

main();