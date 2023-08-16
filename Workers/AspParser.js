'use strict';

// Dante Souto em 26/07/2023
// Definindo o novo método compare no protótipo da Array
Array.prototype.compare = function (outraArray, indiceInicioThis = 0, indiceInicioOutraArray = 0, length = -1) {

    // Converter a outraArray em uma array, caso seja uma string
    if (typeof outraArray === 'string') {
        outraArray = outraArray.split('');
    }

    // Verificar se a outraArray é uma array
    if (!Array.isArray(outraArray)) {
        return false;
    }

    if (length === -1) {
        length = this.length;
    }


    for (let i = 0; i < length; i++) {
        if (this[indiceInicioThis + i] !== outraArray[indiceInicioOutraArray + i]) {
            return false; // Se os elementos não forem iguais, as arrays não são iguais
        }
    }

    return true;
};

const fs = require('fs');
const path = require('path');

const defCrlF = ['\r', '\n'];
const defIncludeVirtual = ("include virtual=").split('');
const defIncludeFile = ("include file=").split('');
const defOpenResponseWrite = ("Response.Write(").split('');
const defCloseResponseWrite = (");\r\n").split('');

const SearchFor = {
    openImportTag: ["<", "!", "-", "-", "#"],
    closeImportTag: ["-", "-", ">"],
    openTag: ["<", "%"],
    openWriteTag: ["<", "%", "="],
    openParameterTag: ["<", "%", "@"],
    closeTag: ["%", ">"]
}

const TipoTAG = {
    None: 0,
    OpenImportTAG: 1,
    OpenTag: 3,
    OpenWriteTag: 4,
    OpenParameterTag: 5,
    CloseImportTag: 2,
    CloseTag: 6
}

function IsLineBreak(offSet, source) {

    if (source[offSet] === '\r' && source[offSet + 1] === '\n') {
        return 2;
    }

    if (source[offSet] === '\n' && source[offSet + 1] === '\r') {
        return 2;
    }

    if (source[offSet] === '\n') {
        return 1;
    }

    if (source[offSet] === '\r') {
        return 1;
    }

    return 0; // Se nenhum dos casos acima for satisfeito, retorna 0.

}

function safeCompareBytes(offSet, search, source) {

    if (offSet + search.length > source.length) {
        return false; // Verificação de limites
    }

    for (let i = 0; i < search.length; i++) {
        if (source[offSet + i] !== search[i]) {
            return false;
        }
    }

    return true;
}

function unsafeCompareBytes(offSet, search, source) {

    for (let i = 0; i < search.length; i++) {
        if (source[offSet + i] !== search[i]) {
            return false;
        }
    }

    return true;
}

function FindOpenTag(offSet, source) {

    // tags de abertura, procura da maior para a menor
    if (safeCompareBytes(offSet, SearchFor.openImportTag, source)) {
        // "<!--#"
        return TipoTAG.OpenImportTAG;
    }

    if (safeCompareBytes(offSet, SearchFor.openParameterTag, source)) {
        // "<%@"
        return TipoTAG.OpenParameterTag;
    }

    if (safeCompareBytes(offSet, SearchFor.openWriteTag, source)) {
        // <%=
        return TipoTAG.OpenWriteTag;
    }

    if (safeCompareBytes(offSet, SearchFor.openTag, source)) {
        // <%
        return TipoTAG.OpenTag;
    }

    return TipoTAG.None

}

function FindCloseTag(offSet, tag, source) {

    try {
        let lenght = -1;

        while (true) {
            lenght++;
            if (unsafeCompareBytes(offSet, tag, source)) {
                return lenght;
            }
            offSet++;
        }

    } catch (err) {
        throw new Error("?;?;'" + tag.join('') + "' faltando.");
    }
}

module.exports = class AspParser {

    constructor(rootPath = undefined, vfs = undefined) {

        // membros privados
        if (rootPath === undefined) {
            rootPath = path.join(__dirname, "www");
        }
        
        if (vfs == undefined) {
            this._vfs = fs;
        } else {
            this._vfs = vfs;
        }
        
        this._rootPath = rootPath;
        this._outText = [];
        this._sourceData = [];
        this._outData = [];
        this._currentGlobalLine = 1;
        this.Parameters = new Map();
    }

    RootPath(value) {
        if (value == undefined) {
            return this._rootPath;
        }
        this._rootPath = value;
    }

    get SourceData() {
        const buffer = new ArrayBuffer(this._sourceData.length);
        const byteArray = new Uint8Array(buffer);
        for (let j = 0; j < this._sourceData.length; j++) {
            byteArray[j] = this._sourceData[j].charCodeAt(0);
        }
        return byteArray;
    }

    get Code() {
        return this._outData.join('');
    }

    async DoIt(virtualFilePath) {

        // console.log("processando:" + virtualFilePath);

        let fullFileName = path.join(this._rootPath, virtualFilePath);
        let currentPath = path.dirname(fullFileName);
        try {
            const data = await this._vfs.readFile(fullFileName, 'utf8');

            // processa o conteuto
            let source = data.split('');
            let pos = 0;
            let lineBreakLength = 0;
            let currentLine = 1;

            while (pos < source.length) {
                lineBreakLength = IsLineBreak(pos, source);
                if (lineBreakLength > 0) {
                    this._outText.push(...defCrlF);
                    currentLine++;
                    pos += lineBreakLength;
                } else {
                    switch (FindOpenTag(pos, source)) {
                        case TipoTAG.None:
                            this._outText.push(...source[pos]);
                            pos++;
                            break;
                        case TipoTAG.OpenImportTAG: {
                            if (this._outText.length > 0) {
                                this._outData.push(...("Response.WriteData(" + this._sourceData.length + ", " + this._outText.length + ");").split(''), ...defCrlF);
                                this._currentGlobalLine++;
                                this._sourceData.push(...this._outText);
                                this._outText = [];
                            }
                            pos = pos + SearchFor.openImportTag.length;
                            let length = FindCloseTag(pos, SearchFor.closeImportTag, source);
                            let tmpIncludeFileName;
                            if (source.compare(defIncludeVirtual, pos, 0, defIncludeVirtual.length)) {
                                tmpIncludeFileName = source.slice(pos + defIncludeVirtual.length + 1, pos + length - 1).join('');
                            } else if (source.compare(defIncludeFile, pos, 0, defIncludeFile.length)) {
                                tmpIncludeFileName = path.join(currentPath, source.slice(pos + defIncludeFile.length + 1, pos + length - 1).join(''));
                            } else {
                                throw new Error("Erro de sintaxe, sem suporte a inclusão do tipo " + source.slice(pos, pos + length).join(''));
                            }
                            // console.log("tmpIncludeFileName:'" + tmpIncludeFileName + "'");
                            this.DoIt(tmpIncludeFileName);
                            pos = pos + length + SearchFor.closeImportTag.length;
                            break;
                        }
                        case TipoTAG.OpenParameterTag: {
                            pos = pos + SearchFor.openParameterTag.length;
                            let length = FindCloseTag(pos, SearchFor.closeTag, source);
                            let idxCmd = source.indexOf("=", pos, length);
                            let arg0;
                            let arg1 = "true";
                            if (idxCmd > -1) {
                                arg0 = source.slice(pos, idxCmd).join('');
                                if (idxCmd < pos + length - 1) {
                                    arg1 = source.slice(idxCmd + 1, pos + length).join('');
                                }
                            }
                            this.Parameters[arg0.toUpperCase()] = arg1;

                            // console.log("arg0:'" + arg0 + "' arg1:'" + arg1 + "'");
                            pos = pos + length + SearchFor.closeTag.length;

                            break;
                        }
                        case TipoTAG.OpenWriteTag: {
                            if (this._outText.length > 0) {
                                this._outData.push(...("Response.WriteData(" + this._sourceData.length + ", " + this._outText.length + ");").split(''), ...defCrlF);
                                this._currentGlobalLine++;
                                this._sourceData.push(...this._outText);
                                this._outText = [];
                            }
                            pos = pos + SearchFor.openWriteTag.length;
                            let length = FindCloseTag(pos, SearchFor.closeTag, source);
                            this._outData.push(...defOpenResponseWrite);
                            this._outData.push(...source.splice(pos, length));
                            //this._outData.push(...source.splice(pos, pos + length));
                            this._outData.push(...defCloseResponseWrite);
                            pos = pos + length + SearchFor.closeTag.length;
                            break;
                        }
                        case TipoTAG.OpenTag: {
                            if (this._outText.length > 0) {
                                this._outData.push(...("Response.WriteData(" + this._sourceData.length + ", " + this._outText.length + ");").split(''), ...defCrlF);
                                this._currentGlobalLine++;
                                this._sourceData.push(...this._outText);
                                this._outText = [];
                            }
                            pos = pos + SearchFor.openTag.length;

                            try {
                                while (true) {
                                    while (true) {
                                        lineBreakLength = IsLineBreak(pos, source);
                                        if (lineBreakLength > 0) {
                                            this._outData.push(...defCrlF);
                                            currentLine++;
                                            pos += lineBreakLength;
                                        } else {
                                            break;
                                        }
                                    }
                                    if (unsafeCompareBytes(pos, SearchFor.closeTag, source)) {
                                        pos = pos + SearchFor.closeTag.length;
                                        break;
                                    }
                                    this._outData.push(...source[pos]);
                                    pos++;
                                }
                                this._outData.push(...defCrlF);

                            } catch (err) {
                                throw new Error(" Tag '%>'  faltando.")
                            }
                            break;
                        }
                        case TipoTAG.None: {
                            break;
                        }
                        default:
                    }
                }

            }
            if (this._outText.length > 0) {
                this._outData.push(...("Response.WriteData(" + this._sourceData.length + ", " + this._outText.length + ");").split(''), ...defCrlF);
                this._currentGlobalLine++;
                this._sourceData.push(...this._outText);
                this._outText = [];
            }

        } catch (readFileError) {
            throw new Error("O arquivo '" + virtualFilePath + "' não foi encontrado.\n" + readFileError.message);
        }
    }

}
