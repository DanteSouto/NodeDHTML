'use strict';

const _Synket = require('../Util/SyncNet/Synket');
const Logger = require('../Util/Logger')

const CMD = {
    SET: Buffer.from([0]),
    GET: Buffer.from([1]),
    TIMEOUT: Buffer.from([2]),
    ABANDON: Buffer.from([3]),
    ALIVE: Buffer.from([4]),
    SESSSION: Buffer.from([5])
};

const CMD_Result = {
    NOK: 0,
    OK: 1
};

function sendReceive(conn, sessionId = "", comando, parametro = "", valor = "", encoding = "utf-8") {

    let ret = false;

    switch (comando) {
        case CMD.SET:
            {

                const bsessionId = Buffer.from(sessionId, 'utf-8');     // Dim bsessionId() As Byte = System.Text.Encoding.ASCII.GetBytes(sessionId)
                const header = Buffer.alloc(276);                       // Dim header(275) As Byte
                const bParam = Buffer.from(parametro, 'utf-8');         // Dim bParam() As Byte = System.Text.Encoding.ASCII.GetBytes(parametro)
                const bValor = Buffer.from(bValor, encoding);           // Dim bValor() As Byte = encoding.GetBytes(valor)
                bsessionId.copy(header, 0);                             // Buffer.BlockCopy(bsessionId, 0, header, 0, bsessionId.Length)
                CMD[comando].copy(header, 20);                          // header(20) = CMD.SET
                bParam.copy(header, 21);                                // Buffer.BlockCopy(bParam, 0, header, 21, bParam.Length)
                const outData = Buffer.concat([header, bValor]);        // Dim out As IO.MemoryStream = New IO.MemoryStream()
                // out.Write(header, 0, header.Length)
                // out.Write(bValor, 0, bValor.Length)
                // Dim outData() As Byte = out.ToArray()
                const inData = conn.sendB(outData);         // Dim inData() As Byte = NetSessionClient.Send(outData)

                bsessionId = Buffer.alloc(20);                          // bsessionId = New Byte(19) {}
                inData.copy(bsessionId, 0, 0, 20);                      // Buffer.BlockCopy(inData, 0, bsessionId, 0, 20)
                sessionId = bsessionId.toString('utf-8');               // sessionId = System.Text.Encoding.ASCII.GetString(bsessionId)

                if (inData[20] === CMD_Result.OK) {                     // If inData(20) = CMD_Result.OK Then ...
                    ret = true;
                }

                bParam = Buffer.alloc(255);                             // bParam = New Byte(254) { }
                inData.copy(bParam, 0, 21, 21 + 255);                   // Buffer.BlockCopy(inData, 21, bParam, 0, 255)
                parametro = bParam.toString('utf-8');                   // parametro = System.Text.Encoding.ASCII.GetString(bParam)

                bValor = Buffer.alloc(inData.length - 276);             // bValor = New Byte((inData.Length - 276) - 1) { }
                inData.copy(bValor, 0, 276);                            // Buffer.BlockCopy(inData, 276, bValor, 0, inData.Length - 276)
                valor = bValor.toString(encoding);                      // valor = encoding.GetString(bValor)

                return { result: ret, sessionId: sessionId, parametro: parametro, valor: valor };
            }
            break;
        case CMD.GET:
            {
                const bsessionId = Buffer.from(sessionId, 'utf-8');     // Dim bsessionId() As Byte = System.Text.Encoding.ASCII.GetBytes(sessionId)
                const header = Buffer.alloc(276);                       // Dim header(275) As Byte
                const bParam = Buffer.from(parametro, 'utf-8');         // Dim bParam() As Byte = System.Text.Encoding.ASCII.GetBytes(parametro)
                const bValor = Buffer.from(bValor, encoding);           // Dim bValor() As Byte = encoding.GetBytes(valor)
                bsessionId.copy(header, 0);                             // Buffer.BlockCopy(bsessionId, 0, header, 0, bsessionId.Length)
                CMD[comando].copy(header, 20);                          // header(20) = CMD.GET
                bParam.copy(header, 21);                                // Buffer.BlockCopy(bParam, 0, header, 21, bParam.Length)

                const inData = conn.sendB(header);         // Dim inData() As Byte = NetSessionClient.Send(header)

                bsessionId = Buffer.alloc(20);                          // bsessionId = New Byte(19) {}
                inData.copy(bsessionId, 0, 0, 20);                      // Buffer.BlockCopy(inData, 0, bsessionId, 0, 20)
                sessionId = bsessionId.toString('utf-8');               // sessionId = System.Text.Encoding.ASCII.GetString(bsessionId)

                if (inData[20] === CMD_Result.OK) {                     // If inData(20) = CMD_Result.OK Then ...
                    ret = true;
                }

                bParam = Buffer.alloc(255);                             // bParam = New Byte(254) { }
                inData.copy(bParam, 0, 21, 21 + 255);                   // Buffer.BlockCopy(inData, 21, bParam, 0, 255)
                parametro = bParam.toString('utf-8');                   // parametro = System.Text.Encoding.ASCII.GetString(bParam)

                bValor = Buffer.alloc(inData.length - 276);             // bValor = New Byte((inData.Length - 276) - 1) { }
                inData.copy(bValor, 0, 276);                            // Buffer.BlockCopy(inData, 276, bValor, 0, inData.Length - 276)
                valor = bValor.toString(encoding);                      // valor = encoding.GetString(bValor)

                return { result: ret, sessionId: sessionId, parametro: parametro, valor: valor };
            }
            break;
        case CMD.TIMEOUT:
            {
                const bsessionId = Buffer.from(sessionId, 'utf-8');     // Dim bsessionId() As Byte = System.Text.Encoding.ASCII.GetBytes(sessionId)
                const header = Buffer.alloc(276);                       // Dim header(275) As Byte
                const bParam = Buffer.from(parametro, 'utf-8');         // Dim bParam() As Byte = System.Text.Encoding.ASCII.GetBytes(parametro)
                bsessionId.copy(header, 0);                             // Buffer.BlockCopy(bsessionId, 0, header, 0, bsessionId.Length)
                CMD[comando].copy(header, 20);                          // header(20) = CMD.TIMEOUT
                bParam.copy(header, 21);                                // Buffer.BlockCopy(bParam, 0, header, 21, bParam.Length)

                const inData = conn.sendB(header);         // Dim inData() As Byte = NetSessionClient.Send(header)

                bsessionId = Buffer.alloc(20);                          // bsessionId = New Byte(19) {}
                inData.copy(bsessionId, 0, 0, 20);                      // Buffer.BlockCopy(inData, 0, bsessionId, 0, 20)
                sessionId = bsessionId.toString('utf-8');               // sessionId = System.Text.Encoding.ASCII.GetString(bsessionId)

                if (inData[20] === CMD_Result.OK) {                     // If inData(20) = CMD_Result.OK Then ...
                    ret = true;
                }

                bParam = Buffer.alloc(255);                             // bParam = New Byte(254) { }
                inData.copy(bParam, 0, 21, 21 + 255);                   // Buffer.BlockCopy(inData, 21, bParam, 0, 255)
                parametro = bParam.toString('utf-8');                   // parametro = System.Text.Encoding.ASCII.GetString(bParam)

                return { result: ret, sessionId: sessionId, parametro: parametro, valor: null };
            }
            break;
        case CMD.ABANDON:
            {
                const bsessionId = Buffer.from(sessionId, 'utf-8');     // Dim bsessionId() As Byte = System.Text.Encoding.ASCII.GetBytes(sessionId)
                const header = Buffer.alloc(276);                       // Dim header(275) As Byte
                bsessionId.copy(header, 0);                             // Buffer.BlockCopy(bsessionId, 0, header, 0, bsessionId.Length)
                CMD[comando].copy(header, 20);                          // header(20) = CMD.ABANDON

                const inData = conn.sendB(header);         // Dim inData() As Byte = NetSessionClient.Send(header)

                if (inData[20] === CMD_Result.OK) {                     // If inData(20) = CMD_Result.OK Then ...
                    ret = true;
                }

                return { result: ret, sessionId: null, parametro: null, valor: null };
            }
            break;
        case CMD.SESSSION:
            {
                let bsessionId = Buffer.from(sessionId, 'utf-8');     // Dim bsessionId() As Byte = System.Text.Encoding.ASCII.GetBytes(sessionId)
                const header = Buffer.alloc(276);                       // Dim header(275) As Byte
                bsessionId.copy(header, 0);                             // Buffer.BlockCopy(bsessionId, 0, header, 0, bsessionId.Length)
                CMD.SESSSION.copy(header, 20);                          // header(20) = CMD.SESSSION
                const inData = conn.sendB(header);         // Dim inData() As Byte = NetSessionClient.Send(header)
                if (inData[20] === CMD_Result.OK) {                     // If inData(20) = CMD_Result.OK Then ...
                    ret = true;
                }
                bsessionId = Buffer.alloc(20);                          // bsessionId = New Byte(19) {}
                inData.copy(bsessionId, 0, 0, 20);                      // Buffer.BlockCopy(inData, 0, bsessionId, 0, 20)
                sessionId = bsessionId.toString('utf-8');               // sessionId = System.Text.Encoding.ASCII.GetString(bsessionId)
                return { result: ret, sessionId: sessionId, parametro: null, valor: null };
            }
            break;
    }
}

module.exports = class Session {

    constructor(port, host, sId) {

        this.DEF_CHECK_SESSAO_ID = "SES";
        this.DEF_SET_ITEM_SESSAO = "SET";
        this.DEF_GET_ITEM_SESSAO = "GET";
        this.DEF_SET_TIME_SESSAO = "TIMEOUT";
        this.DEF_ABANDON_SESSION = "ABANDON";

        this._port = port;
        this._host = host;
        this._connection = new _Synket({ host: host, port: port });
        this._SessionId = sId;
        this._ConfirmSessionId = false;
        this._TimeOut = 20;
        this._LastError = null;
        this.CodePage = "";

        // buffer local da sessao
        this.Item = new Map();
        
        // chave para o objeto local
        let self = this;
        return new Proxy(this, {
            get(target, prop, receiver) {
                let ret;
                if (prop in target) {
                    ret = Reflect.get(self, prop, receiver);
                } else {
                    if (self.ConfirmSessionId()) {
                        ret = self.Item.get(prop);
                        if (ret == null) {
                            let recive = sendReceive(self._connection, self._SessionId, CMD.GET, prop);
                            if (recive.result) {
                                ret = recive.valor;
                                self.Item.set(prop, ret);
                            }
                        }
                    } else {
                        ret = false;
                    }
                }
                return ret;
            },
            set(target, prop, value, receiver) {
                let ret;
                if (prop in target) {
                    ret = Reflect.set(self, prop, value, receiver)
                } else {
                    ret = false;
                    if (self.ConfirmSessionId()) {
                        let recive = sendReceive(self._connection, self._SessionId, CMD.SET, prop, value);
                        if (recive.result) {
                            self.Item.set(prop, value);
                            ret = true;
                        }
                    }
                }
                return ret;
            }
        });
    }

    get SessionId() {
        if (this.ConfirmSessionId()) {
            return this._SessionId;
        }
        return null;
    }

    set TimeOut(value) {
        if (this.ConfirmSessionId()) {
            const ret = Session.sendReceive(this._connection, this._SessionId, CMD.TIMEOUT, value.toString());
            return ret.result;
        }
    }

    Abandon = function() {
        if (this.ConfirmSessionId()) {
            const ret = Session.sendReceive(this._connection, this._SessionId, CMD.ABANDON);
            return ret.result;
        }
        return false;
    }

    ConfirmSessionId = function () {
        if (!this._ConfirmSessionId) {
            try {
                let sSessionId = ""
                if (this._SessionId !== undefined) {
                    sSessionId = this._SessionId;
                }
                const ret = sendReceive(this._connection, this._SessionId, CMD.SESSSION);
                if (ret.result) {
                    this._SessionId = ret.sessionId;
                    this._ConfirmSessionId = true;
                }
            } catch (ex) {
                this._ConfirmSessionId = false;
                this._LastError = "HTTP/1.0 503 Service Unavailable\r\n"
                    + "Content-Type: text/html\r\n\r\n"
                    + "Nenhum controlador de sessão encontrado, contacte o suporte.\n";
                Logger.log("\r\nSession->ConfirmSessionId\r\n" + ex.message + "\r\n" + ex.stack + "\r\n");
            }
        }
        return this._ConfirmSessionId;
    }

    LastError = function () {
        return this._LastError;
    }
}