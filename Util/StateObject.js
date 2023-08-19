'use strict';

const MemoryStream = require('./memorystream');

class StateObject {
    constructor(socket) {
        this.workSocket = socket;
        this.BufferSize = 1024;
        this.buffer = Buffer.alloc(this.BufferSize);
        this.sb = [];
        this.ms = new MemoryStream();
        this.bytes;
        this.size = -1;
        this.bytesRead = 0;
    }
}

module.exports = StateObject;
