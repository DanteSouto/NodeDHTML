'use strict';
// https://stackoverflow.com/questions/32657516/how-to-properly-export-an-es6-class-in-node-4

module.exports = class Cookies {

    constructor() {

        this.Name = "";
        this.Value = "";
        this.Path = "/";
        this.MaxAge = "86400";    // 24 horas - 24 * 3600
        this.Expires = "0";
        this.Item = "";
        this.Domain = "";
        this.Port = "";
        this.Secure = "";
        this.Expires = "";
        this.Expired = "";
        this.TimeStamp = "";
        this.Discard = "";
        this.Comment = "";
        this.CommentUri = "";
        this.Version = "";

    }
       
    ToString() {

        var ret = this.Name + "=" + this.Value;

        if (this.Path != "") {
            ret = ret + "; Path=" + this.Path; 
        }

        if (this.MaxAge != "") {
            ret = ret + "; max-age=" + this.MaxAge; 
        }
        if (this.Expires != "") {
            ret = ret + "; expires=" + this.Expires; 
        }

        return ret;

    }
     
}