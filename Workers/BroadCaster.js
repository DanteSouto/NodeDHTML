'use strict';

const dgram = require('dgram');
const Extensions = require('../Util/Extensions');

function randomDelay(min, max) {
    return Math.random() * (max - min) + min;
}

class BroadCaster {
    constructor(opitions) {
        const tmp_message = `${opitions.key};${opitions.name};${opitions.id};${opitions.port};${opitions.extencion}`;
        const check = Extensions.CheckSum(tmp_message);
        this.message = `${tmp_message};${check}`;
        this.broadcastAddress = opitions.broadcast;
        this.port = parseInt(opitions.broadcastport);
    }

    startBroadCast() {
        this.getNextUpdate();
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

    getNextUpdate() {
        const minDelay = 9000;
        const maxDelay = 10000;
        const delay = randomDelay(minDelay, maxDelay);

        setTimeout(() => {
            this.sendBroadcastMessage();
            // Chame a função novamente para agendar a próxima atualização
            this.getNextUpdate();
        }, delay);
    }

}

module.exports = BroadCaster;