const fs = require('fs');
const path = require('path');
const { RouterOSClient } = require('node-routeros');
const { Client: SSHClient } = require('ssh2');
const log = require('../logger').mikrotik;

const dataDir = '/data/mikrotik';

/**
 * Простая обёртка для работы с Mikrotik через API или SSH
 */
class Mikrotik {
        constructor() {
                this.host = process.env.MIKROTIK_HOST || '127.0.0.1';
                this.port = parseInt(process.env.MIKROTIK_PORT || '8728', 10);
                this.username = process.env.MIKROTIK_USER || 'admin';
                this.password = process.env.MIKROTIK_PASS || '';
                this.ssl = process.env.MIKROTIK_SSL === 'true';
                this.sshPort = parseInt(process.env.MIKROTIK_SSH_PORT || '22', 10);
        }

        /**
         * Клиент RouterOS API
         */
        _apiClient() {
                return new RouterOSClient({
                        host: this.host,
                        user: this.username,
                        password: this.password,
                        port: this.port,
                        ssl: this.ssl,
                });
        }

        async _withClient(fn) {
                const client = this._apiClient();
                await client.connect();
                try {
                        return await fn(client);
                } finally {
                        client.close();
                }
        }

        /**
         * Список интерфейсов
         */
        async getInterfaces() {
                log.info('Запрос списка интерфейсов');
                return this._withClient(client => client.menu('/interface').getAll());
        }

        /**
         * Список контейнеров
         */
        async getContainers() {
                log.info('Запрос списка контейнеров');
                return this._withClient(client => client.menu('/container').getAll());
        }

        /**
         * Список правил файрвола
         */
        async getFirewall() {
                log.info('Запрос правил файрвола');
                return this._withClient(client => client.menu('/ip/firewall/filter').getAll());
        }

        /**
         * Добавление IP в чёрный список
         */
        async addToBlacklist(address) {
                log.info('Добавление %s в blacklist', address);
                return this._withClient(client => client.menu('/ip/firewall/address-list').add({
                        list: 'blacklist',
                        address: address,
                }));
        }

        /**
         * Создание нового контейнера
         */
        async createContainer(opts) {
                log.info('Создание контейнера %s', opts.name);
                return this._withClient(client => client.menu('/container').add({
                        name: opts.name,
                        'remote-image': opts.image,
                        'root-dir': opts.rootDir || `/var/lib/${opts.name}`,
                        interface: opts.interface,
                        start: 'yes',
                }));
        }

        /**
         * Выполнение произвольной команды по SSH
         */
        runSSH(cmd) {
                log.info('SSH команда: %s', cmd);
                return new Promise((resolve, reject) => {
                        const conn = new SSHClient();
                        const options = {
                                host: this.host,
                                port: this.sshPort,
                                username: this.username,
                                password: this.password,
                        };
                        const keyFile = path.join(dataDir, 'id_rsa');
                        if (fs.existsSync(keyFile)) {
                                options.privateKey = fs.readFileSync(keyFile);
                        }
                        conn.on('ready', () => {
                                conn.exec(cmd, (err, stream) => {
                                        if (err) {
                                                conn.end();
                                                return reject(err);
                                        }
                                        let data = '';
                                        stream.on('close', () => {
                                                conn.end();
                                                resolve(data);
                                        }).on('data', chunk => {
                                                data += chunk.toString();
                                        }).stderr.on('data', chunk => {
                                                log.warn('SSH stderr: %s', chunk.toString());
                                        });
                                });
                        }).on('error', reject).connect(options);
                });
        }

        saveCredentials(creds) {
                if (!fs.existsSync(dataDir)) {
                        fs.mkdirSync(dataDir, { recursive: true });
                }
                fs.writeFileSync(path.join(dataDir, 'credentials.json'), JSON.stringify(creds, null, 2), 'utf8');
        }

        loadCredentials() {
                try {
                        const raw = fs.readFileSync(path.join(dataDir, 'credentials.json'), 'utf8');
                        return JSON.parse(raw);
                } catch (err) {
                        return {};
                }
        }
}

module.exports = new Mikrotik();
