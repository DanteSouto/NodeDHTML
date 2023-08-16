'use strict';

const superMap = require("../Util/SuperMap");

module.exports = class Request {

    constructor(_MapQS, _MapFM, _MapFL, _MapSV, _MapCK, _InputBuffer) {



        this._queryString = new superMap(_MapQS);
        this.Form = new superMap(_MapFM);
        this.Files = new superMap(_MapFL);
        this.ServerVariables = new superMap(_MapSV);
        this.Cookies = _MapCK;  //new superMap(_MapCK);

        this.Item = new superMap(new Map());

        // privadas
        this._BinaryReadPoint = 0;
        this._StandardInput = _InputBuffer;


        this._ReadPost = false;
        this._ReadCokkies = false;

        this.ContentType = _MapSV.get("CONTENT_TYPE");

        this._Boundary = "";

        // Publicas
        this.ServerVariables = new Map();

        // cache
        this.cacheItem = null;
        this.cacheValue = null;
        let self = this;

        return new Proxy(this, {
            get(target, prop, receiver) {
                var ret;
                if (prop in target) {
                    ret = Reflect.get(self, prop, receiver);
                } else {
                    if (self.cacheItem != prop) {
                        self.cacheItem = prop;
                        self.cacheValue = self.Item[prop];
                    }
                    ret = self.cacheValue;
                }
                return ret;
            },
            set(target, prop, value, receiver) {
                var ret;
                if (prop in target) {
                    ret = Reflect.set(self, prop, value, receiver)
                } else {
                    self.cacheItem = prop;
                    self.Item[prop] = value;
                    self.cacheValue = value;
                    ret = true;
                }
                return ret;
            }
        });
    }

    QueryString(index) {
        return this._queryString[index];
    }

    HasEntityBody() {
        return this.ServerVariables["REQUEST_METHOD"];
    }

    ContentType() {
        return this.ServerVariables["CONTENT_TYPE"];
    }

    TotalBytes() {
        return this._StandardInput.length;
    }

    ContentLength() {
        return this._StandardInput.length;
    }
    
    ContentLength64() {
        return this._StandardInput.length;
    }

    StandardInput(bData) {
        // https://nodejs.org/api/buffer.html#buffer_buffer
        mStandardInput = Buffer.from(bData);
    }

    BinaryRead(count) {
        var bData; // = new Uint8Array(count - 1);
        if (this.ServerVariables["REQUEST_METHOD"] == "POST") {
            bData = new Int8Array(this._StandardInput, this._BinaryReadPoint, count);
            this._BinaryReadPoint = this._BinaryReadPoint + count;
        }
        return bData;
    }

    Cookies() {
        return mCookies;
    }
}
