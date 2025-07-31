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
