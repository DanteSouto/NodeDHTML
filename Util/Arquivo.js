const crypto = require('crypto');

module.exports = class Arquivo {
    constructor() {
        this.Id = 0;
        this.PastaId = 0;
        this.Nome = '';
        this.CaminhoFisico = '';
        this.Tamanho = 0;
        this.Tipo = '';
        this.Criado = new Date();
        this.Modificado = new Date();
        this.bytes = Buffer.from([]);
        this.eTag = '';
    }

    async getHash() {
        return new Promise((resolve, reject) => {
            const md5 = crypto.createHash('md5');
            md5.update(this.bytes);
            const buffer = md5.digest();
            const ret = buffer.toString('ascii');
            resolve(ret);
        });
    }
}

/*
// Exemplo de uso:
const arquivo = new Arquivo();
arquivo.bytes = Buffer.from('Olá, mundo!'); // Substitua por um buffer com o conteúdo do arquivo
arquivo.getHash().then((hash) => {
    console.log('Hash do arquivo:', hash);
});
*/