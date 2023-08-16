'use strict';

const Extensions = require('./Extensions');
const skClient = require('./SKClient');
const Arquivo = require('./Arquivo');

const CMD = {
    get POST() { return 10; },
    get GET() { return 11; },
    get DELETE() { return 12; },
    get RENAME() { return 13; },
    get DIR() { return 14; },
    get LIST() { return 15; },
    get FILE_EXIST() { return 16; },
    get DIRECTORY_EXIST() { return 17; },
    get ETAG() { return 18; },
    get GET_BUFFER() { return 19; },
    get SET_BUFFER() { return 20;  } 
}


const MODO = {
    get ON_FILESYSTEM() { return 1; },
    get ON_DB() { return 2; },
    get TRY_BOTH() { return 3; }
};

const RESULT = {
    get OK() { return 1; },
    get NOK() { return 0; }
};

module.exports = class VSF {

    constructor(_host = "127.0.0.1", _port = 29402, _key = "suitels") {
        this.key = _key
        this.myClient = new skClient(_host, _port);
    }

    get Port() {
        return this.port;
    }

    set Port(value) {
        this.port = value;
    }

    getFile(fullPAth, onSuccess, onError) {

        let outBuffer = Extensions.intToByteArray(CMD.GET);
        
        outBuffer = Extensions.concatWith(outBuffer, Extensions.intToByteArray(MODO.TRY_BOTH));
        outBuffer = Extensions.concatWith(outBuffer, Extensions.stringToByteArray(fullPAth));

        this.myClient.Send(outBuffer, function (inBuffer) {
            if (inBuffer) {
                if (inBuffer.length > 0) {
                    try {
                        let offset = 0;
                        const ret = Extensions.toInt32(inBuffer, offset);
                        offset += 4;
                        let sz = 0;
                        if (ret === RESULT.OK) {
                            const newFile = Extensions.bytesToArquivo(inBuffer, offset).value;
                            onSuccess(newFile);
                        } else {
                            onError("nok");
                        }
                    } catch (ex) {
                        onError(ex.message);
                    }
                }
            } else {
                onError('Falha no envio ou resposta não recebida.');
            }
        });
    }

    /*
    getFileAsync(fullPAth) {
        return new Promise((resolve, reject) => {
            this.getFile(fullPAth, resolve, reject);
        });
    }
    */

    async readFile(fullPath, encoding = "") {
        return new Promise((resolve, reject) => {
            this.getFile(fullPath, resolve, reject);
        }).then(file => {
            if (encoding == "") {
                if (Extensions.isUtf8(file.bytes)) {
                    encoding = 'utf8';
                } else {
                    encoding = 'ascii';
                }
            }
            return file.bytes.toString(encoding);
        });
    }

    /*
    readFileSync(fullPath, encoding = "") {
        let bytes = new Promise((resolve, reject) => {
            this.getFile(fullPath, resolve, reject);
        });

        if (encoding == "") {
            if (Extensions.isUtf8(bytes)) {
                encoding = 'utf8';
            } else {
                encoding = 'ascii';
            }
        }

        return data.toString(encoding);

    }
    */
}