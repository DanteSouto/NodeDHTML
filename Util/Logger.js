'use strict';

const fs = require('fs');
const path = require('path');

class Logger {
    static logFilePath = path.join(__dirname, 'LSWJS.log');
    static lockFilePath = path.join(__dirname, 'LSWJS.log.lock');

    static async log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;

        try {
            await Logger.acquireLock();
            await Logger.appendToFile(logMessage);
        } catch (error) {
            console.error('Erro ao gravar no arquivo de log:', error);
        } finally {
            Logger.releaseLock();
        }
    }

    static async acquireLock() {
        return new Promise((resolve, reject) => {
            fs.open(Logger.lockFilePath, 'wx', (err, fd) => {
                if (err) {
                    return reject(err);
                }
                fs.close(fd, (closeErr) => {
                    if (closeErr) {
                        console.error('Erro ao fechar arquivo de trava:', closeErr);
                    }
                    resolve();
                });
            });
        });
    }

    static releaseLock() {
        fs.unlink(Logger.lockFilePath, (err) => {
            if (err) {
                console.error('Erro ao remover arquivo de trava:', err);
            }
        });
    }

    static async appendToFile(message) {
        return new Promise((resolve, reject) => {
            fs.appendFile(Logger.logFilePath, message, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
}

module.exports = Logger;
