'use strict';
class ManualResetEvent {
    constructor(initialState = false) {
        this.state = initialState;
        this.promiseResolver = null;
        this.promise = new Promise((resolve) => {
            this.promiseResolver = resolve;
            if (this.state) {
                this.promiseResolver();
            }
        });
    }

    set() {
        this.state = true;
        if (this.promiseResolver) {
            this.promiseResolver();
        }
    }

    reset() {
        this.state = false;
    }

    async wait() {
        if (!this.state) {
            await this.promise;
        }
    }
}

async function minhaFuncao(arg, funcao_ok, funcao_nok) {
    // Simulação de uma operação assíncrona
    setTimeout(() => {
        const resultado = Math.random() < 0.5; // Simulação de um resultado

        if (resultado) {
            funcao_ok("Sucesso!"); // Chamada da função de sucesso
        } else {
            funcao_nok("Erro!"); // Chamada da função de erro
        }
    }, 1000);
}

function promisifiedMinhaFuncao(arg) {
    return new Promise((resolve, reject) => {
        minhaFuncao(arg, resolve, reject);
    });
}

async function main() {
    const manualResetEvent = new ManualResetEvent();

    /*
    promisifiedMinhaFuncao("meus argumentos")
        .then((resultado) => {
            console.log("Resultado:", resultado);
            manualResetEvent.set(); // Defina o evento quando a operação assíncrona é concluída
        })
        .catch((error) => {
            console.error("Erro:", error);
            manualResetEvent.set(); // Defina o evento quando a operação assíncrona é concluída
        });
    */
    try {
        const resultado = await promisifiedMinhaFuncao("meus argumentos");
        console.log("Resultado:", resultado);
    } catch (error) {
        console.error("Erro:", error);
    } finally {
        manualResetEvent.set(); // Defina o evento após a conclusão do bloco main
    }

    await manualResetEvent.wait(); // Aguarde até que o evento seja definido
}

// Chama a função principal
console.log("entrando...");
main();
console.log("saindo...");





















/*
const VSF = require("./Util/VSF");

var myVSF = new VSF();

function getFileOnSuccess(file) {
    const stringValue = file.bytes.toString('utf8');
    console.log(stringValue);
}

function getFileError(message) {
    console.log(message);
}

myVSF.getFile("GSilva\\index.asp", getFileOnSuccess, getFileError);

*/

/*
var fcgi = require('node-fastcgi');
const fs = require("fs");
const cp = require("child_process");


const defaultConfig = {
    "port": "/tmp/nodejs-server-pages.sock",
    "ip": void 0,
    "db": "nodejs-server-pages.db"
};

// Create a NODE_PATH variable so that the runner can use the *main* modules
const childNodePath = (function () {
    let nodePath = ((process.env.NODE_PATH + ":") || "");
    nodePath += (require.main || module).paths.join(":");
    return nodePath;
})();

// Add that to the environment
const childEnv = (function () {
    let env = {};
    for (const v in process.env)
        env[v] = process.env[v];
    env.NODE_PATH = childNodePath;
    return env;
})();

// Threads ready to run server requests
let readyThreads = [];

// Threads currently running server requests
let busyThreads = 0;

function createServer(config) {
    config = config || {};

    // If we're listening to a UNIX-domain socket, delete any old one
    let port = config.port || defaultConfig.port;
    if (typeof port === "string") {
        try {
            fs.unlinkSync(port);
        } catch (ex) { }
    }

    // Then create the server
    return fcgi.createServer((req, res) => {
        function go(body) {
            
        }
        if (req.method === "GET") {
            go();

        } else if (req.method === "POST") {
            let body = new Buffer(0);
            req.on("data", (chunk) => {
                body = Buffer.concat([body, chunk]);
            });
            req.on("end", () => {
                go(body.toString("binary"));
            });

        } else {
            res.writeHead(501);
            res.end();

        }
    }).listen(port, config.ip || defaultConfig.ip);
}


function spawnThread(error) {
    const controller = new AbortController();
    const { signal } = controller;

    let c = cp.fork(__dirname + "/runner.js", { env: childEnv, signal });
    c.res = null;



    c.on("message", (msg) => {
        if (!c.res) return;

        try {
            switch (msg.c) {
                case "h":
                    c.res.writeHead(msg.x, msg.h);
                    break;
                case "w":
                    if (msg.d)
                        c.res.write(msg.d);
                    else
                        c.res.write(Buffer.from(msg.x, "binary"));
                    break;
                case "x":
                    if (error)
                        error(msg.p, msg.f, msg.e);
                    break;
                case "e":
                    c.res.end();
                    c.res = null;
                    readyThreads.push(c);
                    busyThreads--;
                    unspawnThreads();
                    break;
            }
        } catch (ex) {
            console.error(ex.stack + "");
        }
    });

    c.on("exit", () => {
        // Make sure we don't consider a dead thread to be ready or busy
        let i = readyThreads.indexOf(c);
        if (i === -1)
            busyThreads--;
        else
            readyThreads.splice(i, 1);

        // And end the response if needed
        if (c.res) {
            c.res.end();
            c.res = null;
        }
    });

    readyThreads.push(c);
}


function unspawnThreads() {
    function vmSize(pid) {
        try {
            let status = fs.readFileSync(`/proc/${pid}/status`).split("\n");
            for (let s of status) {
                let parts = s.split(":");
                if (parts[0] === "VmSize")
                    return parseInt(parts[1]);
            }
        } catch (ex) {
            return 0;
        }
    }

    let bt = busyThreads;
    while (readyThreads.length > bt + 2) {
        // Choose the process with the greatest VM size
        let maxIdx = 0;
        let max = 0;
        for (let i = 0; i < readyThreads.length; i++) {
            let pid = readyThreads[i].pid;
            let sz = vmSize(pid);
            if (sz > max) {
                maxIdx = i;
                max = sz;
            }
        }

        // Kill it
        readyThreads[maxIdx].send({ c: "t" });
        readyThreads.splice(maxIdx, 1);
        busyThreads++;
    }
}
*/