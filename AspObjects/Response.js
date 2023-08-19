'use strict';

const superMap = require("../Util/SuperMap");
const SkipError = require("../Util/SkipError");

module.exports = class Response {

    constructor(_MapCK, _config, _sourceBytes, _dataCallBack) {

        // this.cookies = require("./Cookies");

        this.MapStatusCodeName = LoadStatusCode();

        this.Cookies = _MapCK;
        this._Config = _config;
        this._SourceBytes = _sourceBytes;

        this._data_sended = false;
        this._buffer = false;
        this._cacheControl = "";
        this._expires = "";
        this._status = STATUS_CODE_OK;               // STATUS_CODE.OK
        this._contentType = "text/html";
        this._charset = "";                          // "ISO-8859-1"

        this._Header = new superMap(new Map());
        this._OutputStream = null;                   // Buffer
        this._Flushed = false;
        this.dataCallBack = _dataCallBack;
        this._Data = [];
    }

    WriteData(offset, length) {
        this._Data.push(...this._SourceBytes.slice(offset, offset + length));
    }

    Write(value) {
        if (value !== null && value !== undefined) {
            try {
                const stringValue = String(value); // Converta para string
                const bData = stringValue.split('').map(char => char.charCodeAt(0)); // Converta para array de bytes
                this._Data.push(...bData);

                if (this._buffer) {
                    this.Flush();
                }
            } catch (ex) {
                // não conseguiu converter
            }
        }
    }

    BinaryWrite(value) {
        if (value !== null && value !== undefined) {
            if (Array.isArray(value)) { // Se for um array
                const bData = new Uint8Array(value); // Converte para array de bytes
                this._Data.push(...bData);

            } else if (typeof value === 'number') { // Se for um número
                const bData = new Uint8Array([value]); // Converte para array de bytes
                this._Data.push(...bData);

            } else { // Qualquer outro caso (strings, etc.)
                const stringValue = String(value); // Converta para string
                const bData = stringValue.split('').map(char => char.charCodeAt(0)); // Converte para array de bytes usando TextEncoder
                this._Data.push(...bData);
            }

            if (mBuffer) {
                flush();
            }
        }
    }

    get OutputStream() {
        return Buffer.from(this._Data);
    }

    get CacheControl() {
        return this._cacheControl;
    }
    set CacheControl(value) {
        this._cacheControl = value;
    }

    get Expires() {
        return this._expires;
    }
    set Expires(value) {
        this._expires = value;
    }

    get Buffer() {
        return this._buffer;
    }
    set Buffer(value) {
        this._buffer = value;
    }
    
    get Status() {
        return this._status;
    }
    set Status(value) {
        this._status = parseInt(value);
    }
    
    get ContentType() {
        return this._contentType;
    }
    set ContentType(value) {
        this._contentType = value;
    }
    
    get Charset() {
        return this._charset;
    }
    set Charset(value) {
        this._charset = value;
    }

    get IsClientConnected() {
        return true;
    }

    AddHeader(strNome, strValor) {
        this._Header[strNome] = strValor;
    }

    AppendHeader(strNome, strValor) {
        let tmp = this._Header[strNome];
        if ((tmp == null || tmp == undefined) || tmp == "") {
            this._Header[strNome] = strValor;
        } else {
            tmp = tmp + " ;" + strValor;
            this._Header[strNome] = tmp;
        }
    }

    Clear() {
        this._Data = [];
    }

    Redirect(value) {
        this.Clear();
        this._status = STATUS_CODE_ObjectMoved;
        this._Header["Location"] = value;
        this.End();
    }

    End() {
        this.Flush();
        throw new SkipError("End");
    }

    Flush() {

        if (!this._Flushed) {
            
            // Write Status Code
            let sHeader = "";
            let sStatusCodeName = this.MapStatusCodeName.get(this._status);

            sHeader += "HTTP/1.0 " + this._status.toString() + " " + sStatusCodeName + "\r\n";

            if ((this._contentType != null && this._contentType != undefined) && this._contentType != "") {
                if ((this._charset != null && this._charset != undefined) && this._charset != "") {
                    sHeader += "Content-Type: " + this._contentType + "; charset=" + this._charset + "\r\n";
                } else {
                    sHeader += "Content-Type: " + this._contentType + "\r\n";
                }
            }

            if ((this._expires != null && this._expires != undefined) && this._expires != "") {
                sHeader += "Expires: " + this._expires + "\r\n";
            }

            if ((this._cacheControl != null && this._cacheControl != undefined) && this._cacheControl != "") {
                //public, max-age=31536000
                //no-cache
                sHeader += "Cache-Control: " & this._cacheControl & "\r\n";
            }

            // https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Statements/for...of
            for (const [key, value] of this.Cookies) {
                
                const path = "/";

                const dt = new Date();
                dt.setDate(dt.getDate() + 1);
                const sDt = dt.toISOString();

                const maxAge = 24 * 3600; // Um dia em segundos

                sHeader += `Set-Cookie: ${key}=${value}; Path=${path}; max-age=${maxAge}\r\n`;


            }

            for (const [key, value] of this._Header.Item) {
                sHeader += key + ":" + value + "\r\n";
            }

            for (var i = 0; i < this._Config.customHeaders.length; i++) {
                sHeader += this._Config.customHeaders[i].nome + ":" + this._Config.customHeaders[i].valor + "\r\n";
            }

            // this.WriteToConsole("format: hex\r\n");

            sHeader += "\r\n";
            let buffer = Buffer.from(sHeader);
            this.dataCallBack(buffer);

            this._Flushed = true;

        }

        if (this._Data.length !== 0) {
            let buffer = Buffer.from(this._Data); 
            this.dataCallBack(buffer);
            this.Clear();
        }

    }
}

const STATUS_CODE_Continue = 100;
const STATUS_CODE_SwitchingProtocols = 101;
const STATUS_CODE_OK = 200;
const STATUS_CODE_Created = 201;
const STATUS_CODE_Accepted = 202;
const STATUS_CODE_NonAuthoritativeInformation = 203;
const STATUS_CODE_NoContent = 204;
const STATUS_CODE_ResetContent = 205;
const STATUS_CODE_PartialContent = 206;
const STATUS_CODE_MultipleChoices = 300;
const STATUS_CODE_MovedPermanently = 301;
const STATUS_CODE_ObjectMoved = 302;
const STATUS_CODE_SeeOther = 303;
const STATUS_CODE_NotModified = 304;
const STATUS_CODE_UseProxy = 305;
const STATUS_CODE_TemporaryRedirect = 307;
const STATUS_CODE_PermanentRedirect = 308;
const STATUS_CODE_BadRequest = 400;
const STATUS_CODE_Unauthorized = 401;
const STATUS_CODE_PaymentRequired = 402;
const STATUS_CODE_Forbidden = 403;
const STATUS_CODE_NotFound = 404;
const STATUS_CODE_MethodNotAllowed = 405;
const STATUS_CODE_NotAcceptable = 406;
const STATUS_CODE_ProxyAuthenticationRequired = 407;
const STATUS_CODE_RequestTimeout = 408;
const STATUS_CODE_Conflict = 409;
const STATUS_CODE_Gone = 410;
const STATUS_CODE_LengthRequired = 411;
const STATUS_CODE_PreconditionFailed = 412;
const STATUS_CODE_RequestEntityTooLarge = 413;
const STATUS_CODE_RequestURITooLarge = 414;
const STATUS_CODE_UnsupportedMediaType = 415;
const STATUS_CODE_RequestedRangeNotSatisfiable = 416;
const STATUS_CODE_ExpectationFailed = 417;
const STATUS_CODE_InternalServerError = 500;
const STATUS_CODE_NotImplemented = 501;
const STATUS_CODE_BadGateway = 502;
const STATUS_CODE_ServiceUnavailable = 503;
const STATUS_CODE_GatewayTimeOut = 504;
const STATUS_CODE_HTTPVersionNotSupported = 505;


function LoadStatusCode() {

    var _map = new Map();

    _map.set(STATUS_CODE_Continue, "Continue")
    _map.set(STATUS_CODE_SwitchingProtocols, "Switching Protocols")
    _map.set(STATUS_CODE_OK, "OK")
    _map.set(STATUS_CODE_Created, "Created")
    _map.set(STATUS_CODE_Accepted, "Accepted")
    _map.set(STATUS_CODE_NonAuthoritativeInformation, "Non-Authoritative Information")
    _map.set(STATUS_CODE_NoContent, "No Content")
    _map.set(STATUS_CODE_ResetContent, "Reset Content")
    _map.set(STATUS_CODE_PartialContent, "Partial Content")
    _map.set(STATUS_CODE_MultipleChoices, "Multiple Choices")
    _map.set(STATUS_CODE_MovedPermanently, "Moved Permanently")
    _map.set(STATUS_CODE_ObjectMoved, "Found")
    _map.set(STATUS_CODE_SeeOther, "See Other")
    _map.set(STATUS_CODE_NotModified, "Not Modified")
    _map.set(STATUS_CODE_UseProxy, "Use Proxy")
    _map.set(STATUS_CODE_TemporaryRedirect, "Temporary Redirect")
    _map.set(STATUS_CODE_PermanentRedirect, "Permanent Redirect")
    _map.set(STATUS_CODE_BadRequest, "Bad Request")
    _map.set(STATUS_CODE_Unauthorized, "Unauthorized")
    _map.set(STATUS_CODE_PaymentRequired, "Payment Required")
    _map.set(STATUS_CODE_Forbidden, "Forbidden")
    _map.set(STATUS_CODE_NotFound, "Not Found")
    _map.set(STATUS_CODE_MethodNotAllowed, "Method Not Allowed")
    _map.set(STATUS_CODE_NotAcceptable, "Not Acceptable")
    _map.set(STATUS_CODE_ProxyAuthenticationRequired, "Proxy Authentication Required")
    _map.set(STATUS_CODE_RequestTimeout, "Request Timeout")
    _map.set(STATUS_CODE_Conflict, "Conflict")
    _map.set(STATUS_CODE_Gone, "Gone")
    _map.set(STATUS_CODE_LengthRequired, "Length Required")
    _map.set(STATUS_CODE_PreconditionFailed, "Precondition Failed")
    _map.set(STATUS_CODE_RequestEntityTooLarge, "Payload Too Large")
    _map.set(STATUS_CODE_RequestURITooLarge, "URI Too Long")
    _map.set(STATUS_CODE_UnsupportedMediaType, "Unsupported Media Type")
    _map.set(STATUS_CODE_RequestedRangeNotSatisfiable, "Range Not Satisfiable")
    _map.set(STATUS_CODE_ExpectationFailed, "Expectation Failed")
    _map.set(418, "I'm a teapot")
    _map.set(422, "Unprocessable Entity")
    _map.set(425, "Too Early")
    _map.set(426, "Upgrade Required")
    _map.set(428, "Precondition Required")
    _map.set(429, "Too Many Requests")
    _map.set(431, "Request Header Fields Too Large")
    _map.set(451, "Unavailable For Legal Reasons")
    _map.set(STATUS_CODE_InternalServerError, "Internal Server Error")
    _map.set(STATUS_CODE_NotImplemented, "Not Implemented")
    _map.set(STATUS_CODE_BadGateway, "Bad Gateway")
    _map.set(STATUS_CODE_ServiceUnavailable, "Service Unavailable")
    _map.set(STATUS_CODE_GatewayTimeOut, "Gateway Timeout")
    _map.set(STATUS_CODE_HTTPVersionNotSupported, "HTTP Version Not Supported")
    _map.set(511, "Network Authentication Required")

    return _map;
}