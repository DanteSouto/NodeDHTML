'use strict';

'use strict';

module.exports = class ProcessRequest {
    constructor(mybuffer) {

        this.Extencao = '';
        this.Params = new Map();
        this.data = null;
        this.SessionIP = '';
        this.SessionPort = 0;
        this.SessionKey = '';
        this.FileSystemIP = '';
        this.FileSystemPort = 0;
        this.FileSystemKey = '';
        this.Comando = '';
    }
}
