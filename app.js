'use strict';

const DEBUG = false;

if (DEBUG) {
    console.time('ALL');
}

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const minimist = require('./Util/minimist');
const BroadCaster = require('./Workers/BroadCaster');
const AsynchronousSocketListener = require('./Util/AsynchronousSocketListener');

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
const ProcessRequest = require('./Util/ProcessRequest');
const { clearTimeout } = require('timers');
const Logger = require('./Util/Logger');
const { error } = require('console');

if (DEBUG) {
    // Adicionar função write ao console
    console.write = function (buffer) {
        process.stdout.write(buffer);
    };
}

function getStartSettings(args) {
    const options = minimist(args, {
        alias: {
            k: 'key',
            n: 'name',
            i: 'id',
            p: 'port',
            e: 'extencion',
            b: 'broadcast',
            t: 'broadcastport',
        },
        default: {
            key: 'suitels',
            name: 'LSGW',
            id: 'LSGW_01',
            port: '29400',
            extencion: 'jsx',
            broadcast: '255.255.255.255',
            broadcastport: '29200'
        }
    });
    return options;
}

function main() {

    const args = process.argv.slice(2);
    const startOptions = getStartSettings(args);

    const listener = new AsynchronousSocketListener();
    const broadCaster = new BroadCaster(startOptions);

    // Start Listener
    listener.startListening('0.0.0.0', parseInt(startOptions.port), (state) => {
        //const result = new Promise((resolve, reject) => {
        const bytes = state.bytes;
        console.log("bytes[0]=", bytes[0], " length=", bytes.length);
        const socket = state.workSocket;
        const worker = new Worker(__filename, {
            workerData: bytes
        });

        worker.on('message', data => {
            if (typeof data === 'string') {
                if (data == "END") {
                    if (socket.writable) {
                        socket.end();
                    }
                    worker.terminate();
                } else {
                    console.log(data);
                }
            } else {
                socket.write(data);
            }
        });

        worker.on('error', error => {
            if (socket.writable) {
                socket.end();
            }
        });
        worker.on('close', () => {
            if (socket.writable) {
                socket.end();
            }
        });
        worker.on('exit', code => {
            if (socket.writable) {
                socket.end();
            }
        });

    }).then((successMessage) => {
        // Start BroadCaster
        broadCaster.startBroadCast();
        console.log(successMessage);
    }).catch((errorMessage) => {
        console.log("errorMessage", errorMessage);
    });
}

if (isMainThread) {
    main();
} else {
    (async () => {
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
            const myData = Buffer.from(workerData);
            parentPort.postMessage("VM bytes[0]=" + myData[0] + " length=" + myData.length);
            processRequest = Extensions.toProcessRequest(myData);

            ErrorMessage = "Bad Cookies";
            const mapServerVariables = processRequest.Params;
            const sCookies = Extensions.getValueOrDefault(mapServerVariables, "LSAPP_HTTP_COOKIES", "");
            let mapCookies;
            if (sCookies && sCookies.trim() != "") {
                mapCookies = Extensions.getCookies(sCookies);
            }
            else {
                mapCookies = new Map();
            }

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

            sScript = aspParser.Code;

            // remover
            const fs = require('fs');
            try {
                fs.writeFileSync('c:\\Temp\\debug.js', sScript);
                console.log('Arquivo escrito com sucesso.');
            } catch (error) {
                console.error('Ocorreu um erro ao escrever o arquivo:', error);
            }

            ErrorMessage = "Can't Build Response";

            if (DEBUG) {
                Response = new Response_(mapCookies, Config, aspParser.SourceData, console);
            } else {
                Response = new Response_(mapCookies, Config, aspParser.SourceData, (bytes_to_send) => {
                    const int_message_size = bytes_to_send.length;
                    if (int_message_size > 0) {
                        parentPort.postMessage(bytes_to_send);
                    }
                });
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
                + ex.message;
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

                        // Response.Clear();
                        Response.Status = 500;
                        Response.ContentType = "text/html";
                        Response.Write(ErrorMessage);

                    } else {
                        if (DEBUG) {
                            console.log("ok");
                        }
                    }
                }
            } else {
                console.log("ErrorMessage: ", ErrorMessage);
                try {
                    Response.Clear();
                    Response.Status = 500;
                    Response.ContentType = "text/html";
                    Response.Write(ErrorMessage);

                    if (DEBUG) {
                        console.log(ErrorMessage);
                    } else {
                        let bMessage = Buffer.from(ErrorMessage);
                        SendBack(bMessage);
                    }
                } catch (ex) {
                    // nada a fazer.. provavelmente o usuário cancelou
                }
            }
            try {

                Response.Flush();

            } catch (ex) {
                // nada
                reject(false);
            } finally {
                parentPort.postMessage("END");
            }
        }
    })();

}