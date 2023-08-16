'use strict';

module.exports = class FormFile {
    constructor() {
        this.mValue = [];
        this.mName = '';
        this.mFilePath = '';
        this.mFileName = '';
        this.mContentType = '';
        this.mContentDisposition = '';
    }

    get contentDisposition() {
        return this.mContentDisposition;
    }
    set contentDisposition(value) {
        this.mContentDisposition = value;
    }

    get contentType() {
        return this.mContentType;
    }
    set contentType(value) {
        this.mContentType = value;
    }

    get fileName() {
        return this.mFileName;
    }
    set fileName(value) {
        this.mFileName = value;
    }

    get filePath() {
        return this.mFilePath;
    }
    set filePath(value) {
        this.mFilePath = value;
    }

    get fileExt() {
        try {
            return this.mFileName.substring(this.mFileName.lastIndexOf('.'));
        } catch (ex) {
            return '';
        }
    }
    set fileExt(value) {
        // Ignorar
    }

    get name() {
        return this.mName;
    }
    set name(value) {
        this.mName = value;
    }

    get length() {
        return this.mValue.length;
    }
    set length(value) {
        // Ignorar
    }

    get byteArray() {
        return this.mValue;
    }
    set byteArray(xvalue) {
        this.mValue = xvalue;
    }
}