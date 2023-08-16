'use strict';

// https://stackoverflow.com/questions/32657516/how-to-properly-export-an-es6-class-in-node-4
module.exports = class SuperMap {
    constructor(value) {
        this.Item = value; //new Map();

        this.cacheItem = null;
        this.cacheValue = null;

        let self = this;
        return new Proxy(this, {
            get(target, prop) {
                if (prop != self.cacheItem) {
                    self.cacheItem = prop;
                    self.cacheValue = self.Item.get(prop);
                    if (self.cacheValue == null) {
                        self.cacheValue = "";
                    }
                }
                return self.cacheValue;
            },
            set(target, prop, value) {
                self.cacheItem = prop;
                self.cacheValue = value;
                self.Item.set(value);
                return true;
            }
        });

    }
}