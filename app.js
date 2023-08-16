'use strict';

const DEBUG = true;

if (DEBUG) {
    console.time('ALL');
}

const defTIMEOUT = 30;  // TIME OUT de execução do script em segundos
const TimeoutError = require('./Util/TimeoutError');
const SkipError = require('./Util/SkipError');

const fs = require('fs');
const he = require("./Util/he");
const vm = require('vm');
const Extensions = require('./Util/Extensions');
const AspParser = require("./Workers/AspParser");

// ASP OBJECTS
const VFS_ = require("./Util/VSF");
const Server_ = require("./AspObjects/Server");
const Request_ = require("./AspObjects/Request");
const Response_ = require("./AspObjects/Response");
const Session_ = require("./AspObjects/Session");
const PipeClient = require('./Util/PipeClient');
const ProcessRequest = require('./Util/ProcessRequest');
const { clearTimeout } = require('timers');
const Logger = require('./Util/Logger');


if (DEBUG) {
    // Adicionar função write ao console
    console.write = function (buffer) {
        process.stdout.write(buffer);
    };
}

// Criando uma instância do PipeClient
const pipeClient = new PipeClient();

// Definindo os callbacks para os eventos
pipeClient.on('connect', () => {
    if (DEBUG) {
        console.log('Conectado ao servidor!');
    }
});

pipeClient.on('dataReceived', (data) => {
    if (DEBUG) {
        console.log('recebendo dados');
        console.log(data.length + 'b recebidos');
        const filePath = 'c:\\Temp\\bufferData.bin';
        console.log('Salvando em "' + filePath + '"');
        fs.writeFileSync(filePath, data);
        console.log('Iniciando o processamento');
        processMyRequest(data);
        console.log('processamento concluído');
    } else {
        processMyRequest(data);
    }
    
});

pipeClient.on('close', () => {
    if (DEBUG) {
        console.log('Conexão fechada.');
    }
    process.exit(0);
});

pipeClient.on('error', (error) => {
    if (DEBUG) {
        console.log("Erro de conexão com o servidor.\n", error)
    }
    process.exit(0);
});


function main() {
    if (DEBUG) {
        const filePath = 'c:\\Temp\\bufferData.bin';
        const data = fs.readFileSync(filePath);
        processMyRequest(data);
    } else {
        const port = process.argv[2];
        pipeClient.connect('127.0.0.1', port);
    }
}

main();

async function processMyRequest(data) {

    let Session;
    let Request;
    let Response;
    let Server;

    let aspParser;
    let sScript;

    let HttpError = 400;
    let ErrorMessage = "";
    let ErrorLog = "";
    let CompileError = null;

    try {

        ErrorMessage = "Bad Process Request";
        let processRequest = new ProcessRequest();
        processRequest = Extensions.toProcessRequest(data);

        //if (DEBUG) {
        //    ErrorLog += '\r\nprocessRequest.Comando: ' + processRequest.Comando;
        //    ErrorLog += '\r\nprocessRequest.Extencao: ' + processRequest.Extencao;
        //    ErrorLog += '\r\nprocessRequest.FileSystemIP: ' + processRequest.FileSystemIP;
        //    ErrorLog += '\r\nprocessRequest.FileSystemPort: ' + processRequest.FileSystemPort;
        //    ErrorLog += '\r\nprocessRequest.FileSystemKey: ' + processRequest.FileSystemKey;
        //    ErrorLog += '\r\nprocessRequest.SessionIP: ' + processRequest.SessionIP;
        //    ErrorLog += '\r\nprocessRequest.SessionPort: ' + processRequest.SessionPort;
        //    ErrorLog += '\r\nprocessRequest.SessionKey: ' + processRequest.SessionKey;
        //    ErrorLog += '\r\nprocessRequest.data.length: ' + processRequest.data.length;
        //    ErrorLog += '\r\nprocessRequest.Params:';
        //    for (const [key, value] of processRequest.Params) {
        //        ErrorLog += `\r\n\t\tChave: ${key}, Valor: ${value}`;
        //    }
        //}

        ErrorMessage = "Bad Cookies";
        const mapServerVariables = processRequest.Params;
        const sCookies = Extensions.getValueOrDefault(mapServerVariables, "LSAPP_HTTP_COOKIES", "");
        const mapCookies = Extensions.getCookies(sCookies);

        ErrorMessage = "Bad Session";
        const sSessionKey = processRequest.SessionKey;
        let sSessionId = Extensions.getValueOrDefault(mapCookies, sSessionKey, "");
        Session = new Session_(processRequest.SessionPort, processRequest.SessionIP, sSessionId);

        sSessionId = Session.SessionId;
        
        if (sSessionId == null) {
            throw new Error("Can't generate new session id.");
        }

        mapCookies.set(sSessionKey, sSessionId);

        ErrorMessage = "Bad POST Message Format";
        const sContentEncoding = Extensions.getValueOrDefault(mapServerVariables, "LSAPP_CHARSET", "utf-8");    // 'latin1' é equivalente ao conjunto de caracteres Windows-1252 é o latin1 ou iso-8859-1
        const sRequestMethod = Extensions.getValueOrDefault(mapServerVariables, "REQUEST_METHOD", "");
        const sContentType = Extensions.getValueOrDefault(mapServerVariables, "CONTENT_TYPE", "");
        const mapFormData = new Map();
        const mapFileData = new Map();

        if (sRequestMethod == "POST") {
            switch (Extensions.getContentType(sContentType)) {
                case Extensions.EnumContentType.Application:
                case Extensions.EnumContentType.Unknown:
                    {
                        mapFormData = Extensions.getFormData(processRequest.data, sContentEncoding);
                    }
                    break;
                case Extensions.EnumContentType.Multipart:
                    {
                        let ret = Extensions.getMultipartFormData(processRequest.data);
                        mapFormData = ret.form;
                        mapFileData = ret.files;
                    }
                    break;
            }
            if (DEBUG) {
                console.log('processRequest (FORM DATA):');
                for (const [key, value] of mapFormData) {
                    console.log(`\t\tChave: ${key}, Valor: ${value}`);
                }
                console.log('');

                console.log('processRequest (FILE DATA):');
                for (const [key, value] of mapFileData) {
                    console.log(`\t\tChave: ${key}, Valor: ${value.fileName}`);
                }
                console.log('');
            }
        }

        ErrorMessage = "Bad QUERY Message Format";
        let mapQueryString = Extensions.toQueryString(Extensions.getValueOrDefault(processRequest.Params, "QUERY_STRING", ""));

        //if (DEBUG) {
        //    console.log('processRequest (QUERYSTRING):');
        //    for (const [key, value] of mapQueryString) {
        //        console.log(`\t\tChave: ${key}, Valor: ${value}`);
        //    }
        //    console.log('');
        //}

        ErrorMessage = "Can't Build Request";
        Request = new Request_(
            mapQueryString,         // QueryString
            mapFormData,            // Form
            mapFileData,            // Files
            mapCookies,             // Cookies
            processRequest.data     // InputStream
        );

        ErrorMessage = "Can't Build Config";
        const sConfig = Extensions.getValueOrDefault(processRequest.Params, "LSAPP_XML_CONFIG", "");
        const sJsonConfig = Extensions.parseXML(sConfig);
        const Config = JSON.parse(sJsonConfig);

        ErrorMessage = "Can't Build VirtualFileSystem";
        const VFS = new VFS_(processRequest.FileSystemIP, processRequest.FileSystemPort, processRequest.FileSystemKey);

        ErrorMessage = "Can't Build Server";
        
        const sRootPath = Extensions.getValueOrDefault(mapServerVariables, "LSAPP_ROOT_PATH", "");
        const sScriptFile = Extensions.getValueOrDefault(mapServerVariables, "LSAPP_FILE_PATH", "").replace(sRootPath, "");
        const sScriptPath = Extensions.getDirectoryName(sScriptFile);

        Server = new Server_(VFS, Config, sScriptPath, sRootPath);

        ErrorMessage = "Can't Build DHTML";
        aspParser = new AspParser(sRootPath, VFS);
        if (DEBUG) {
            console.time('Parse');
        }
        await aspParser.DoIt(sScriptFile);
        if (DEBUG) {
            console.timeEnd('Parse');
        }
        //sScript = aspParser.SourceData.join('');
        sScript = aspParser.Code; //.join('');

        ErrorMessage = "Can't Build Response";

        if (DEBUG) {
            Response = new Response_(mapCookies, Config, aspParser.SourceData, console);
        } else {
            Response = new Response_(mapCookies, Config, aspParser.SourceData, pipeClient);
        }

        ErrorMessage = "";

    } catch (ex) {

        if (ErrorMessage == "Bad Session") {
            if (Session.LastError() != null) {
                ErrorMessage = Session.LastError();
            }
        } else if (ErrorMessage == "Can't Build DHTML") {
            if (aspParser.LastError != null) {
                ErrorMessage = aspParser.LastError();
            }
        } else {
            ErrorMessage = "HTTP/1.0 400 Bad Request\r\n"
                + "Content-Type: text/html\r\n\r\n"
                + ErrorMessage + "'.\n";
            //Logger.log("\r\nAspManager->Desmontar\r\n" + readFileError.message + "\r\n" + readFileError.stack + "\r\n");
        }

        CompileError = ex;

    } finally {

        if (ErrorMessage == "") {
            try {
                // TimeOutIdCallBack

                ErrorMessage = "Can't Process DHTML";
                if (DEBUG) {
                    console.time('Run');
                }
                const script = new vm.Script(sScript);
                const context = vm.createContext({ Request, Response, Server, Session });
                const vmOptions = {
                    timeout: aspParser.Parameters.has('TIMEOUT') ? parseInt(aspParser.Parameters.get('TIMEOUT')) * 1000 : defTIMEOUT * 1000
                }
                script.runInContext(context, vmOptions);
                if (DEBUG) {
                    console.timeEnd('Run');
                }
                ErrorMessage = "";

            } catch (error) {
                if (error instanceof SkipError) {
                    ErrorMessage = "";
                } else if (error instanceof SyntaxError) {
                    ErrorMessage += '\n<br>Sintax Error';
                    ErrorMessage += '\n<br>' + he.encode(error.message);
                    if (error.lineNumber) {
                        ErrorMessage += '\n<br>On line: ' + error.lineNumber;
                    }
                    if (error.stack) {
                        const stackLines = error.stack.split('\n');
                        const offendingLine = stackLines[1]; // A segunda linha geralmente contém informações sobre o erro

                        if (offendingLine) {
                            ErrorMessage += '\n<br>Offending line: ' + he.encode(offendingLine);
                        }
                        ErrorMessage += '\n<br>' + he.encode(error.stack).replace(/\n/g, '<br>'); // Substitua as quebras de linha
                    }
                } else if (error instanceof TimeoutError) {
                    ErrorMessage += '\n<br>Script Time Out';
                } else {
                    ErrorMessage += '\n<br>Runtime Error';
                    ErrorMessage += '\n<br>' + he.encode(error.message);
                    if (error.lineNumber) {
                        ErrorMessage += '\n<br>On line: ' + error.lineNumber;
                    }
                    if (error.stack) {
                        const stackLines = error.stack.split('\n');
                        const offendingLine = stackLines[1]; // A segunda linha geralmente contém informações sobre o erro

                        if (offendingLine) {
                            ErrorMessage += '\n<br>Offending line: ' + he.encode(offendingLine);
                        }
                        ErrorMessage += '\n<br>' + he.encode(error.stack).replace(/\n/g, '<br>'); // Substitua as quebras de linha
                    }
                }
            } finally {
                if (ErrorMessage != "") {
                    ErrorMessage = "HTTP/1.0 500 Internal Server Error\r\n"
                        + "Content-Type: text/html\r\n\r\n"
                        + ErrorMessage + "'.\n";

                    if (DEBUG) {
                        console.log(ErrorMessage);
                    } else {
                        let bMessage = Buffer.from(ErrorMessage);
                        pipeClient.write(bMessage);
                    }
                } else {
                    if (DEBUG) {
                        console.log("ok");
                    }
                }
            }
        } else {
            ErrorMessage = "HTTP/1.0 500 Internal Server Error\r\n"
                + "Content-Type: text/html\r\n\r\n"
                + ErrorMessage + "'.\n";

            if (DEBUG) {
                console.log(ErrorMessage);
            } else {
                let bMessage = Buffer.from(ErrorMessage);
                pipeClient.write(bMessage);
            }
        }
        try {

            Response.Flush();

            if (!DEBUG) {
                pipeClient.disconnect();
            }

        } catch (ex) {
            // nada
        } finally {
            if (DEBUG) {
                console.timeEnd('ALL');
            }
            process.exit(0);
        }
    }
    
}
