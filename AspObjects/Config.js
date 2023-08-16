'use strict';

class Config_ {
    constructor() {
        this.Name = '';
        this.Path = '';
        this.Root = '';
        this.Associacao = [];
        this.CustomReaders = [];
        this.Sessions = 0;
        this.PHP = '';
        this.TimeOut = 0;
        this.Xml = '';
    }

    parseXml = function(xml) {
        const xmlDoc = new DOMParser().parseFromString(xml, 'text/xml');
        const mainNode = xmlDoc.getElementsByTagName('main')[0];

        this.Name = this.getChildNodeText(mainNode, 'name');
        this.Path = this.getChildNodeText(mainNode, 'path');
        this.Root = this.getChildNodeText(mainNode, 'root');
        this.Sessions = parseInt(this.getChildNodeText(mainNode, 'sessions'), 10);
        this.PHP = this.getChildNodeText(mainNode, 'php');
        this.TimeOut = parseInt(this.getChildNodeText(mainNode, 'timeout'), 10) * 1000;

        this.Associacao = [];
        // Parse association nodes if needed

        this.CustomReaders = this.parseCustomReaders(mainNode);

        this.Xml = xml;
    }

    getChildNodeText = function(parentNode, tagName) {
        const node = parentNode.querySelector(tagName);
        return node ? node.textContent : '';
    }

    parseCustomReaders = function(parentNode) {
        const customReadersNodes = parentNode.querySelectorAll('customHeaders');
        const customReaders = [];

        customReadersNodes.forEach(node => {
            const nome = this.getChildNodeText(node, 'nome');
            const valor = this.getChildNodeText(node, 'valor');
            customReaders.push({ nome, valor });
        });

        return customReaders;
    }
}

const Config = new Config_();

module.exports = Config;

/*
// Exemplo de uso
const xmlData = '<main><name>MyApp</name><path>path/to/app</path>...</main>';
const config = new Config();
config.parseXml(xmlData);

console.log(config);
*/