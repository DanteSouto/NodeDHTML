'use strict';

const superMap = require("../Util/SuperMap");
const he = require("../Util/he");
const Extensions = require('../Util/Extensions');

var fs = require('fs');
var path = require('path');

module.exports = class Server{
    constructor(_vfs, _oConfig, _path, _rootpath) {

        this.error = null;

        this.vfs = _vfs;

        this.Config = _oConfig;

        this._Path = _path;
        this._RootPath = _rootpath;
    }

    lastError = function() {
        return this.error;
    }

    get FSI() {
        return this.vfs;
    }

    CreateObject = function (value) {
        try {
            const ObjectClass = require(value);
            this.error = null;
            return new ObjectClass();
        } catch (ex) {
            this.error = ex;
            return null;
        }
    }

    GetObject = function (value) {
        try {
            this.error = null;
            return require(value);
        } catch (ex) {
            this.error = ex;
            return null;
        }
    }

    HTMLDecode = function (value) {
        return he.decode(value);
    }

    HTMLEncode = function (value) {
        return he.encode(value);
    }

    URLEncode = function (value) {
        return encodeURIComponent(value);
    }

    URLDecode = function (value) {
        return decodeURIComponent(value);
    }

    get Path() {
        return this._Path;
    }

    get RootPath(){
        return this._RootPath;
    }

    ParseXML = function (value) {
        return Extensions.parseXML(value);
    }

    MapPath(value) {
        var strTmp = "";
        var preservPath = false;
        var times = 0;

        if (value.indexOf(".\\") == 0) {
            preservPath = true;
        } else {
            preservPath = false;
        }

        if (this._Path == this._RootPath) {
            times = 1;
        }

        if (preservPath) {
            strTmp = this._Path + "\\" + value;
        } else {
            strTmp = this._RootPath + "\\" + value;
        }

        strTmp = strTmp.replace("/", "\\");

        strTmp = strTmp.replace(/\\\\/g, '\\');

        if (fs.existsSync(strTmp)) {
            if (fs.lstatSync(strTmp).isDirectory()) {
                strTmp = path.dirname(strTmp);
            } else {
                strTmp = path.join(path.dirname(strTmp), path.basename(strTmp));
            }
        } else {
            strTmp = "";
        }

        var sSpl = strTmp.split("\\");

        var sRet = sSpl[0];
        for (var i = 2; i < sSpl.length; i++) {
            if (i + 1 < sSpl.length - 1) {
                if (sSpl[i + 1] != "..") {
                    sRet = sRet + "\\" + sSpl[i - 1];
                } else {
                    if (times == 0) {
                        sRet = sRet + "\\" + sSpl[i - 1];
                    }
                    times = times + 1;
                }
            } else {
                if (sSpl[i] != "..") {
                    sRet = sRet + "\\" + sSpl[i - 1];
                } else {
                    if (times == 0) {
                        sRet = sRet + "\\" + sSpl[i - 1];
                    }
                    times = times + 1;
                }
            }
        }

        if (sSpl[sSpl.length - 1] != ".." || times == 0) {
            sRet = sRet + "\\" & sSpl[sSpl.Length - 1];
        }

        try {
            if (sRet.indexOf("\\.") == sRet.length - 2) {
                sRet = sRet.substring(0, sRet.length - 2);
            }
        } catch (ex) {
            if (sRet.trim() == "\\") {
                sRet = "";
            }
        }

        return sRet;

    }
}
