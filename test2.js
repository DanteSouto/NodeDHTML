const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const vm = require('vm');

if (!isMainThread) {
    const context = vm.createContext({}); // Crie um novo contexto para o worker
    const scriptInstance = new vm.Script(workerData.script);

    try {
        const result = scriptInstance.runInContext(context, { timeout: workerData.timeout });
        parentPort.postMessage(result);
    } catch (error) {
        parentPort.postMessage({ error: error.message });
    }
}

async function runScriptWithTimeout(script, timeout) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
            workerData: { script, timeout }
        });

        worker.on('message', message => {
            if (message.error) {
                reject(new Error(message.error));
            } else {
                resolve(message);
            }
        });

        worker.on('error', error => {
            reject(error);
        });
    });
}

async function main() {
    const slowScript = `
    function fibonacci(n) {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }

    const result = fibonacci(40); // Calculating Fibonacci number for n = 40
    result;
  `;

    try {
        const result = await runScriptWithTimeout(slowScript, 5000); // Timeout de 5 segundos
        console.log('Resultado:', result);
    } catch (error) {
        console.error('Erro1:', error.message);
        process.exit(0);
    }
}

main();
