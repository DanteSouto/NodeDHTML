'use strict';

const Arquivo = require('./Arquivo');
const FormFile = require('./FormFile');
const ProcessRequest = require('./ProcessRequest');

function findPosition(buffer, searchString, start) {
    const searchBuffer = Buffer.from(searchString);
    for (let i = start; i <= buffer.length - searchBuffer.length; i++) {
        if (buffer.compare(searchBuffer, 0, searchBuffer.length, i, i + searchBuffer.length) === 0) {
            return i;
        }
    }
    return -1;
}

///
/// Processando ContentType.Multipart
///
function BuildMultipartData(strData) {

    var sBound = "";

    try {

        // Pegando Boundary
        if (sData.indexOf("--") = 0) {

            var data = sData;
            var dados = "";
            var header = "";
            var pos = 0;
            var sSpl;
            var sNome;
            var sForm;
            var sCrLf;
            var sFileName;
            var sContentType;
            var iFormFile;
            var buffer;
            var bData = [];

            while (true) {

                pos = data.IndexOf("\r\n");
                sBound = data.substring(0, pos);

                if (sBound.substring(sBound.length - 2) == "--") {
                    break;
                }

                pos = pos + 2;
                header = data.substring(pos, (data.indexOf("\r\n\r\n") - pos));
                pos = data.indexOf(vbCrLf & vbCrLf) + 4;
                dados = data.substring(pos, data.indexOf("\r\n" + sBound) - pos);

                if (header.indexOf(vbCrLf) == -1) {
                    // dados é Form
                    sSpl = header.split(";");
                    sNome = "";
                    for (var i = 0; i < sSpl.length; i++) {
                        sForm = sSpl[i].split("=");
                        switch (sForm[0].trim()) {
                            case "name":
                                sNome = sForm[1].trim();
                                break;
                            case "Content-Disposition":
                                // nada
                                break;
                            case "Content-Length":
                                // nada
                                break;
                        }
                    }

                    if (sNome != "") {
                        sNome = sNome.replace(String.fromCharCode(34), "");
                        MapFM.set(sNome, dados);
                    }

                } else {
                    // dados é File
                    sCrLf = header.split("\r\n");

                    sSpl = sCrLf[0].split(";");
                    sNome = "";
                    sFileName = "";
                    sContentType = "";

                    for (var i = 0; i < sSpl.length; i++) {
                        sForm = sSpl[i].split("=");
                        switch (sForm[0].trim) {
                            case "name":
                                sNome = sForm[1].trim();
                                break;
                            case "filename":
                                sFileName = sForm[1].trim();
                                break;
                            case "Content-Type":
                                sContentType = sForm[1].trim();
                        }
                    }

                    try {

                        sSpl = sCrLf[1].split(":");
                        if (sSpl[0].trim() = "Content-Type") {
                            sContentType = sSpl[1].trim();
                        }

                    } catch (ex) {

                    }

                    if (sContentType != "") {

                        sNome = sNome.replace(String.fromCharCode(34), "");
                        sFileName = sFileName.replace(String.fromCharCode(34), "");
                        sContentType = sContentType.replace(String.fromCharCode(34), "");

                        iFormFile = new Object();
                        iFormFile.Name = sNome;
                        iFormFile.FileName = sFileName;
                        iFormFile.ContentType = sContentType;
                        iFormFile.ByteArray = new Int8Array(Buffer.from(dados));

                        MapFL.set(sNome, iFormFile);
                        MapFM.set(sNome, sFileName);

                    }

                }

                data = data.substring(data.indexOf("\r\n" + sBound) + 2);

            }

        }

    } catch (ex) {
        try {
            /*
            Dim file As System.IO.StreamWriter
            Dim strFile As String = "c:\temp\ProcessMultipart.txt"
            file = My.Computer.FileSystem.OpenTextFileWriter(strFile, True)
            file.Write("Erro:" & ex.Message & vbCrLf & vbCrLf)
            file.Close()
            */
        } catch (msgerr) {
            // nada
        }
    }

}

module.exports = class Extensions {

    // Buffer
    static toInt32 = function(buffer, offset) {
        if (offset + 3 >= buffer.length) {
            throw new Error('Offset is out of range for a 4-byte integer.');
        }
        return buffer.readInt32LE(offset);
    };

    static fromByteArray = function(buffer, offset) {
        const sz = Extensions.toInt32(buffer, offset);
        const mybuffer = Buffer.alloc(sz);
        const totalSize = sz + 4;
        buffer.copy(mybuffer, 0, offset + 4, offset + 4 + sz);
        return { value: mybuffer, totalSize: totalSize };
    }

    static toStringWithSize = function(buffer, offset, encoding = "utf8") {
        const sizeBuffer = buffer.slice(offset, offset + 4);
        const sz = Extensions.toInt32(sizeBuffer, 0);

        if (offset + 4 + sz > buffer.length) {
            throw new Error('Offset is out of range for the given size.');
        }

        const dataBuffer = buffer.slice(offset + 4, offset + 4 + sz);
        const ret = dataBuffer.toString(encoding);

        return { value: ret, totalSize: sz + 4 };
    };

    static toSortedListOfString = function(buffer, offSet) {
        const encoding = 'utf8';
        const outList = new Map();

        let pos = offSet;
        const totalSize = Extensions.toInt32(buffer, pos);
        pos += 4;

        const target = totalSize + offSet;

        while (pos < target) {

            let ret = Extensions.toStringWithSize(buffer, pos, encoding);
            const chave = ret.value;
            pos += ret.totalSize;

            ret = Extensions.toStringWithSize(buffer, pos, encoding);
            const valor = ret.value;
            pos += ret.totalSize;

            outList.set(chave, valor);
        }

        return { list: outList, totalSize };
    }

    static concatWith = function (array1, array2) {
        const sz = array1.length + array2.length;
        const myBuffer = Buffer.alloc(sz);

        array1.copy(myBuffer, 0, 0, array1.length);
        array2.copy(myBuffer, array1.length, 0, array2.length);

        return myBuffer;
    };

    // Map
    // s1: map
    // key: string
    // defaultValue: any
    static getValueOrDefault = function(s1, key, defaultValue) {
        try {
            return s1.get(key);
        } catch (ex) {
            return defaultValue;
        }
    }

    // Int
    static intToByteArray = function(value) {
        const buffer = Buffer.alloc(4); // Criar um buffer de 4 bytes (32 bits) para armazenar o inteiro
        buffer.writeInt32LE(value, 0); // Escrever o inteiro no buffer como um número de 32 bits em ordem little-endian
        return buffer;
    };

    // String
    static stringToByteArray = function(value, encoding = 'utf8') {
        const bTexto = Buffer.from(value, encoding);
        const bTextoSz = Extensions.intToByteArray(bTexto.length);
        const sz = bTexto.length + bTextoSz.length;
        const myBuffer = Buffer.alloc(sz);
        bTextoSz.copy(myBuffer, 0, 0, bTextoSz.length);
        bTexto.copy(myBuffer, bTextoSz.length, 0, bTexto.length);
        return myBuffer;
    };

    // Arquivo
    static bytesToArquivo = function (mybuffer, offset) {
        const arquivo = new Arquivo();
        let size = Extensions.toInt32(mybuffer, offset);
        offset += 4;
        arquivo.Id = Extensions.toInt32(mybuffer, offset);
        offset += 4;
        arquivo.PastaId = Extensions.toInt32(mybuffer, offset);
        offset += 4;
        let tmp = Extensions.toStringWithSize(mybuffer, offset, "utf8");
        arquivo.Nome = tmp.value;
        offset += tmp.totalSize;
        tmp = Extensions.toStringWithSize(mybuffer, offset, "utf8");
        arquivo.CaminhoFisico = tmp.value;
        offset += tmp.totalSize;
        arquivo.Tamanho = Extensions.toInt32(mybuffer, offset);
        offset += 4;
        tmp = Extensions.toStringWithSize(mybuffer, offset, "utf8");
        arquivo.Tipo = tmp.value;
        offset += tmp.totalSize;
        arquivo.Criado = new Date(mybuffer.readDoubleLE(offset));
        offset += 8;
        arquivo.Modificado = new Date(mybuffer.readDoubleLE(offset));
        offset += 8;
        tmp = Extensions.fromByteArray(mybuffer, offset);
        arquivo.bytes = tmp.value;
        offset += tmp.totalSize;
        tmp = Extensions.toStringWithSize(mybuffer, offset, "utf8");
        arquivo.eTag = tmp.value;
        offset += tmp.totalSize;
        
        return { value: arquivo, totalSize: size };
    }

    // ProcessRequest
    static toProcessRequest = function(mybuffer, offSet = 0) {
        const encoding = 'utf-8';
        const proc = new ProcessRequest();

        let sz = 0;
        let pos = offSet;

        const totalSize = Extensions.toInt32(mybuffer, pos);
        pos += 4;

        let retString = Extensions.toStringWithSize(mybuffer, pos, encoding);
        proc.Extencao = retString.value;
        pos += retString.totalSize;

        let retMap = Extensions.toSortedListOfString(mybuffer, pos);
        proc.Params = retMap.list;
        pos += retMap.totalSize;

        let retByteArray = Extensions.fromByteArray(mybuffer, pos);
        proc.data = retByteArray.value;
        pos += retByteArray.totalSize;

        retString = Extensions.toStringWithSize(mybuffer, pos, encoding);
        proc.SessionIP = retString.value;
        pos += retString.totalSize;

        proc.SessionPort = Extensions.toInt32(mybuffer, pos);
        pos += 4;

        retString = Extensions.toStringWithSize(mybuffer, pos, encoding);
        proc.SessionKey = retString.value;
        pos += retString.totalSize;

        retString = Extensions.toStringWithSize(mybuffer, pos, encoding);
        proc.FileSystemIP = retString.value;
        pos += retString.totalSize;

        proc.FileSystemPort = Extensions.toInt32(mybuffer, pos);
        pos += 4;

        retString = Extensions.toStringWithSize(mybuffer, pos, encoding);
        proc.FileSystemKey = retString.value;
        pos += retString.totalSize;

        retString = Extensions.toStringWithSize(mybuffer, pos, encoding);
        proc.Comando = retString.value;

        return proc;
    }

    static toQueryString = function(sData) {
        const sSpl = sData.split("&");
        const queryStringMap = new Map();

        for (let i = 0; i < sSpl.length; i++) {
            const pos = sSpl[i].indexOf("=");
            if (pos === -1) {
                queryStringMap.set(sSpl[i], "");
            } else {
                const sKey = sSpl[i].substring(0, pos);
                const sVal = sSpl[i].substring(pos + 1);
                queryStringMap.set(sKey, sVal);
            }
        }

        return queryStringMap;
    }

    static get EnumContentType() {
        return {
            Multipart: 'Multipart',
            Application: 'Application',
            Unknown: 'Unknown'
        };
    }

    static getContentType = function(mContentType) {
        if (mContentType.indexOf('multipart') !== -1) {
            return Extensions.EnumContentType.Multipart;
        } else if (mContentType.indexOf('application') !== -1) {
            return Extensions.EnumContentType.Application;
        } else {
            return Extensions.EnumContentType.Unknown;
        }
    }

    static getFormData = function (buffer, encoding) {
        const sData = buffer.toString(encoding);
        const strSpl = sData.split("&");
        const formContentMap = new Map();

        for (let i = 0; i < strSpl.length; i++) {
            const strSpl2 = strSpl[i].split("=");
            try {
                const strParam = strSpl2[0];
                const strValue = decodeURIComponent(strSpl2[1]);
                formContentMap.set(strParam, strValue);
            } catch (ex) {
                // Nada
            }
        }

        return formContentMap;
    }

    static getMultipartFormData = function (buffer) {
        const formContentMap = new Map();
        const formFilesMap = new Map();

        try {
            const boundary = '\r\n' + buffer.slice(0, findPosition(buffer, '\r\n', 0)).toString();
            const data = buffer.slice(boundary.length + 2); // Remover o boundary inicial

            let pos = 0;
            while (pos < data.length) {
                const start = findPosition(data, '\r\n', pos) + 2;
                const end = findPosition(data, '\r\n' + boundary, start);
                if (end === -1) {
                    break;
                }

                const part = data.slice(start, end);
                const partStr = part.toString(); // Converter o buffer para uma string

                // Extrair o header e os dados
                const headerEnd = partStr.indexOf('\r\n\r\n');
                const header = partStr.substring(0, headerEnd);
                const dados = partStr.substring(headerEnd + 4);
                
                if (header.indexOf('\r\n') === -1) {
                    // Dados de formulário
                    let headerLines = header.split(';');
                    let sNome = '';
                    for (let i = 0; i < headerLines.length; i++) {
                        const sForm = headerLines[i].split('=');
                        switch (sForm[0].trim()) {
                            case 'name':
                                sNome = sForm[1].trim();
                                break;
                            case 'Content-Disposition':
                                break;
                            case 'Content-Length':
                                break;
                        }
                    }

                    if (sNome !== '') {
                        sNome = sNome.replace(/"/g, '');
                        formContentMap.set(sNome, dados);
                    } 
                } else {
                    // dados de arquivo
                    const sCrLf = header.split('\r\n');
                    let headerLines = sCrLf.split(';');
                    let sNome = '';
                    let sFileName = '';
                    let sContentType = '';
                    for (let i = 0; i < headerLines.length; i++) {
                        const sForm = headerLines[i].split('=');
                        switch (sForm[0].trim()) {
                            case 'name':
                                sNome = sForm[1].trim();
                                break;
                            case 'filename':
                                sFileName = sForm[1].trim();
                                break;
                            case 'Content-Type':
                                sContentType = sForm[1].trim();
                                break;
                        }
                    }
                    try {
                        headerLines = sCrLf.split(':');
                        if (headerLines[0].trim() == "Content-Type") {
                            sContentType = headerLines[1].trim();
                        }
                    } catch (tex) { }

                    if (sContentType !== "") {
                        sNome = sNome.replace(/"/g, '');
                        sFileName = sFileName.replace(/"/g, '');
                        sContentType = sContentType.replace(/"/g, '');

                        let formFile = new FormFile();          //Dim mFormFile As IFormFile = New IFormFile
                        formFile.name = sNome;                  //mFormFile.Name = sNome
                        formFile.fileName = sFileName;          //mFormFile.FileName = sFileName
                        formFile.contentType = sContentType;    //mFormFile.ContentType = sContentType
                        formFile.byteArray = part.slice(headerEnd + 4); //Dim bData(dados.Length - 1) As Byte //bData = ContentEncoding.GetBytes(dados) //mFormFile.ByteArray = bData

                        formFilesMap.set(sNome, formFile);
                        //mFiles.Add(mFormFile)
                        //mFormContent.m_Content.Add(sNome, mFormFile)
                    }
                }

                // Aqui você processaria a parte do multipart (part) que é um conjunto de bytes
                // Por exemplo, você pode gravar o conteúdo em um arquivo ou fazer outra operação

                pos = end + boundary.length + 4; // Pular para o próximo boundary
            }
        } catch (ex) {
            // Tratar o erro aqui
            // console.error(ex);
        }

        return { form: formContentMap, files: formFilesMap };

    }

    static getCookies = function (sData) {
        const cookies = new Map();
        const cookiesline = sData.split(";");
        for (let i = 0; i < cookiesline.length; i++) {
            const kvp = cookiesline[i].split(":");
            if (kvp.length == 1) {
                cookies.set(kvp[0], kvp[1]);
            }
        }
        return cookies;
    }
    // Exemplo de uso
    // const sData = Buffer.from('--boundary\r\nContent-Disposition: form-data; name="param1"\r\n\r\nvalue1\r\n--boundary\r\nContent-Disposition: form-data; name="file"; filename="file.txt"\r\nContent-Type: text/plain\r\n\r\nfile content\r\n--boundary--', 'utf-8');
    // processMultipartBytes(sData);

    static getDirectoryName = function (value) {
        value = value.replace(/\//g, "\\");

        const lastBackslashIndex = value.lastIndexOf("\\");
        if (lastBackslashIndex !== -1) {
            return value.substring(0, lastBackslashIndex);
        }

        return value;
    }
    static parseXML = function (sData) {
        let ret = "";
        let abreInicio = sData.indexOf("<");
        let UltimaChaveNome = "";
        let ArrayIniciado = false;
        let posInicioArray = -1;
        let posTerminoArray = -1;
        let plus = 0;

        if (abreInicio == -1) {
            if (sData.trim() == "") {
                ret = "null";
            }
            else {
                ret = '"' + sData + '"';
            }
        }
        else {
            ret = ret + "{";
            while (abreInicio != -1) {

                let fechaInicio = sData.indexOf(">");
                let ChaveNome = sData.substring(abreInicio + 1, fechaInicio);

                let FechaNome = "</" + ChaveNome + ">";
                let abreFinal = sData.indexOf(FechaNome);
                let fechaFinal = abreFinal + FechaNome.length;
                let TextoCorpo = sData.substring(fechaInicio + 1, abreFinal);

                if (ret != "{") {
                    ret = ret + ", ";
                    plus = 1;
                }
                if (UltimaChaveNome == ChaveNome) {
                    if (ArrayIniciado == false) {
                        ArrayIniciado = true;
                        ret = ret.substring(0, posInicioArray) + "[" + ret.substring(posInicioArray)
                    }
                    ret = ret + Extensions.parseXML(TextoCorpo);
                } else {
                    ret = ret + '"' + ChaveNome + '"' + ": ";
                    // ret = ret + ChaveNome + ": ";
                    posInicioArray = ret.length;
                    ret = ret + Extensions.parseXML(TextoCorpo);
                    if (ArrayIniciado == true) {
                        ArrayIniciado = false;
                        ret = ret.substring(0, posTerminoArray) + "]" + ret.substring(posTerminoArray)
                    }

                }
                posTerminoArray = ret.length;

                sData = sData.substring(fechaFinal);
                abreInicio = sData.indexOf("<");

                UltimaChaveNome = ChaveNome;
            }
            if (ArrayIniciado == true) {
                ret = ret + "]";
            }
            ret = ret + "}";
        }

        ret = ret.replace(/(?<!\\)\\(?!\\)/g, '\\\\');

        return ret;
    }

    static isUtf8 = function (buffer) {
        let i = 0;
        const length = buffer.length;

        while (i < length) {
            const byte = buffer[i];

            if (byte < 0x80) {
                // ASCII character (0x00 - 0x7F)
                i++;
            } else if ((byte & 0xE0) === 0xC0) {
                // 2-byte sequence (110xxxxx 10xxxxxx)
                if (i + 1 >= length || (buffer[i + 1] & 0xC0) !== 0x80) {
                    return false;
                }
                i += 2;
            } else if ((byte & 0xF0) === 0xE0) {
                // 3-byte sequence (1110xxxx 10xxxxxx 10xxxxxx)
                if (i + 2 >= length || (buffer[i + 1] & 0xC0) !== 0x80 || (buffer[i + 2] & 0xC0) !== 0x80) {
                    return false;
                }
                i += 3;
            } else if ((byte & 0xF8) === 0xF0) {
                // 4-byte sequence (11110xxx 10xxxxxx 10xxxxxx 10xxxxxx)
                if (i + 3 >= length || (buffer[i + 1] & 0xC0) !== 0x80 || (buffer[i + 2] & 0xC0) !== 0x80 || (buffer[i + 3] & 0xC0) !== 0x80) {
                    return false;
                }
                i += 4;
            } else {
                return false;
            }
        }

        return true;
    };

    static CheckSum = function (value) {
    const data = Buffer.from(value, 'utf8');
    let ret = 0;

    try {
        ret = data[0];
        for (let i = 1; i < data.length; i++) {
            ret ^= data[i];
        }
    } catch (ex) {
        // Trate a exceção aqui, se necessário.
    }

    return ret;
}
}