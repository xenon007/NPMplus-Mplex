const express = require('express');
const mikrotik = require('../lib/mikrotik');
const log = require('../logger').mikrotik;

const router = express.Router({
        caseSensitive: true,
        strict: true,
        mergeParams: true,
});

// Список интерфейсов
router.get('/interfaces', async (req, res) => {
        try {
                const data = await mikrotik.getInterfaces();
                res.json(data);
        } catch (err) {
                log.error('Ошибка получения интерфейсов', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

// Список контейнеров
router.get('/containers', async (req, res) => {
        try {
                const data = await mikrotik.getContainers();
                res.json(data);
        } catch (err) {
                log.error('Ошибка получения контейнеров', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

// Создание контейнера
router.post('/containers', async (req, res) => {
        try {
                await mikrotik.createContainer(req.body || {});
                res.json({ status: 'ok' });
        } catch (err) {
                log.error('Ошибка создания контейнера', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

// Управление томами
router.get('/volumes', async (req, res) => {
        try {
                const data = await mikrotik.getVolumes();
                res.json(data);
        } catch (err) {
                log.error('Ошибка получения томов', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

router.post('/volumes', async (req, res) => {
        try {
                await mikrotik.createVolume(req.body || {});
                res.json({ status: 'ok' });
        } catch (err) {
                log.error('Ошибка создания тома', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

// Управление envlist
router.get('/envlists', async (req, res) => {
        try {
                const data = await mikrotik.getEnvLists();
                res.json(data);
        } catch (err) {
                log.error('Ошибка получения envlist', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

router.post('/envlists', async (req, res) => {
        try {
                await mikrotik.createEnvList(req.body.name, req.body.vars || {});
                res.json({ status: 'ok' });
        } catch (err) {
                log.error('Ошибка создания envlist', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

router.put('/envlists/:name', async (req, res) => {
        try {
                await mikrotik.updateEnvList(req.params.name, req.body.vars || {});
                res.json({ status: 'ok' });
        } catch (err) {
                log.error('Ошибка обновления envlist', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

// Управление veth интерфейсами
router.get('/veth', async (req, res) => {
        try {
                const data = await mikrotik.getVeth();
                res.json(data);
        } catch (err) {
                log.error('Ошибка получения veth', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

router.post('/veth', async (req, res) => {
        try {
                await mikrotik.createVeth(req.body || {});
                res.json({ status: 'ok' });
        } catch (err) {
                log.error('Ошибка создания veth', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

router.post('/veth/:name/interface-list', async (req, res) => {
        try {
                await mikrotik.addInterfaceList(req.params.name, req.body.list);
                res.json({ status: 'ok' });
        } catch (err) {
                log.error('Ошибка добавления в interface list', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

router.post('/veth/:name/bridge', async (req, res) => {
        try {
                await mikrotik.addBridgePort(req.params.name, req.body.bridge);
                res.json({ status: 'ok' });
        } catch (err) {
                log.error('Ошибка добавления в bridge', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

router.post('/veth/:name/address', async (req, res) => {
        try {
                await mikrotik.assignIp(req.params.name, req.body.address);
                res.json({ status: 'ok' });
        } catch (err) {
                log.error('Ошибка назначения адреса', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

// Правила файрвола
router.get('/firewall', async (req, res) => {
        try {
                const data = await mikrotik.getFirewall();
                res.json(data);
        } catch (err) {
                log.error('Ошибка получения правил', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

// Firewall filter rules
router.get('/firewall/filter', async (req, res) => {
        try {
                const data = await mikrotik.getFirewallFilter();
                res.json(data);
        } catch (err) {
                log.error('Ошибка получения firewall filter', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

router.post('/firewall/filter', async (req, res) => {
        try {
                await mikrotik.addFirewallFilter(req.body || {});
                res.json({ status: 'ok' });
        } catch (err) {
                log.error('Ошибка добавления firewall filter', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

// NAT rules
router.get('/firewall/nat', async (req, res) => {
        try {
                const data = await mikrotik.getNatRules();
                res.json(data);
        } catch (err) {
                log.error('Ошибка получения NAT', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

router.post('/firewall/nat', async (req, res) => {
        try {
                await mikrotik.addNatRule(req.body || {});
                res.json({ status: 'ok' });
        } catch (err) {
                log.error('Ошибка добавления NAT', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

// Access list
router.get('/firewall/access-list', async (req, res) => {
        try {
                const data = await mikrotik.getAccessList();
                res.json(data);
        } catch (err) {
                log.error('Ошибка получения access list', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

router.post('/firewall/access-list', async (req, res) => {
        try {
                await mikrotik.addAccessList(req.body || {});
                res.json({ status: 'ok' });
        } catch (err) {
                log.error('Ошибка добавления access list', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

// Добавление в blacklist
router.post('/firewall/blacklist', async (req, res) => {
        const addr = req.body && req.body.address;
        if (!addr) {
                return res.status(400).send({ error: 'address required' });
        }
        try {
                await mikrotik.addToBlacklist(addr);
                res.json({ status: 'ok' });
        } catch (err) {
                log.error('Ошибка добавления в blacklist', err);
                res.status(500).send({ error: 'mikrotik error' });
        }
});

// Работа с учётными данными
router.get('/credentials', (req, res) => {
        res.json(mikrotik.loadCredentials());
});

router.post('/credentials', (req, res) => {
        mikrotik.saveCredentials(req.body || {});
        res.json({ status: 'ok' });
});

module.exports = router;
