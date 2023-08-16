'use strict';
class SkipError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SkipError';
    }
}

module.exports = SkipError;