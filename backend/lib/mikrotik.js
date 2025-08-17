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
                const payload = {
                        name: opts.name,
                        'remote-image': opts.image,
                        'root-dir': opts.rootDir || `/var/lib/${opts.name}`,
                        interface: opts.interface,
                        start: 'yes',
                };
                if (opts.envlist) {
                        payload.envlist = opts.envlist;
                }
                if (opts.mounts && opts.mounts.length) {
                        payload.mounts = opts.mounts.join(',');
                }
                return this._withClient(client => client.menu('/container').add(payload));
        }

        /**
         * Список томов (mounts)
         */
        async getVolumes() {
                log.info('Запрос списка томов');
                return this._withClient(client => client.menu('/container/mounts').getAll());
        }

        /**
         * Создание тома
         * @param {{name:string, src:string, dst:string}} opts
         */
        async createVolume(opts) {
                log.info('Создание тома %s', opts.name);
                return this._withClient(client => client.menu('/container/mounts').add({
                        name: opts.name,
                        src: opts.src,
                        dst: opts.dst,
                }));
        }

        /**
         * Получить envlist'ы
         */
        async getEnvLists() {
                log.info('Запрос envlist');
                return this._withClient(client => client.menu('/container/envs').getAll());
        }

        /**
         * Создать envlist
         * @param {string} name
         * @param {{[key:string]:string}} vars
         */
        async createEnvList(name, vars) {
                log.info('Создание envlist %s', name);
                return this._withClient(async client => {
                        const menu = client.menu('/container/envs');
                        for (const [key, value] of Object.entries(vars)) {
                                await menu.add({ name, key, value });
                        }
                });
        }

        /**
         * Обновить envlist (пересоздание)
         */
        async updateEnvList(name, vars) {
                log.info('Обновление envlist %s', name);
                return this._withClient(async client => {
                        const menu = client.menu('/container/envs');
                        const items = await menu.where('name', name).getAll();
                        for (const item of items) {
                                await menu.remove(item['.id']);
                        }
                        for (const [key, value] of Object.entries(vars)) {
                                await menu.add({ name, key, value });
                        }
                });
        }

        /**
         * Список veth интерфейсов
         */
        async getVeth() {
                log.info('Запрос veth интерфейсов');
                return this._withClient(client => client.menu('/interface/veth').getAll());
        }

        /**
         * Создание veth интерфейса
         */
        async createVeth(opts) {
                log.info('Создание veth %s', opts.name);
                return this._withClient(client => client.menu('/interface/veth').add({
                        name: opts.name,
                        address: opts.address,
                        gateway: opts.gateway,
                }));
        }

        /**
         * Добавление интерфейса в Interface List
         */
        async addInterfaceList(iface, list) {
                log.info('Добавление %s в список %s', iface, list);
                return this._withClient(client => client.menu('/interface/list/member').add({
                        interface: iface,
                        list,
                }));
        }

        /**
         * Добавление интерфейса в бридж
         */
        async addBridgePort(iface, bridge) {
                log.info('Добавление %s в бридж %s', iface, bridge);
                return this._withClient(client => client.menu('/interface/bridge/port').add({
                        interface: iface,
                        bridge,
                }));
        }

        /**
         * Назначение IP адресу интерфейса
         */
        async assignIp(iface, address) {
                log.info('Назначение IP %s интерфейсу %s', address, iface);
                return this._withClient(client => client.menu('/ip/address').add({
                        interface: iface,
                        address,
                }));
        }

        /**
         * Получение правил файрвола, NAT и access list
         */
        async getFirewallFilter() {
                log.info('Запрос firewall filter rules');
                return this._withClient(client => client.menu('/ip/firewall/filter').getAll());
        }

        async addFirewallFilter(rule) {
                log.info('Добавление firewall filter rule');
                return this._withClient(client => client.menu('/ip/firewall/filter').add(rule));
        }

        async getNatRules() {
                log.info('Запрос NAT правил');
                return this._withClient(client => client.menu('/ip/firewall/nat').getAll());
        }

        async addNatRule(rule) {
                log.info('Добавление NAT правила');
                return this._withClient(client => client.menu('/ip/firewall/nat').add(rule));
        }

        async getAccessList() {
                log.info('Запрос address-list');
                return this._withClient(client => client.menu('/ip/firewall/address-list').getAll());
        }

        async addAccessList(entry) {
                log.info('Добавление в address-list');
                return this._withClient(client => client.menu('/ip/firewall/address-list').add(entry));
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
