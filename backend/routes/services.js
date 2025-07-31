const express = require('express');
const fs = require('fs');
const path = require('path');
const log = require('../logger').global;

const router = express.Router({
        caseSensitive: true,
        strict: true,
        mergeParams: true,
});

const servicesFile = path.join(__dirname, '..', 'services.json');

function loadServices() {
        try {
                const raw = fs.readFileSync(servicesFile, 'utf8');
                return JSON.parse(raw);
        } catch (err) {
                log.warn('Не удалось прочитать services.json', err);
                return [];
        }
}

function findService(id) {
        return loadServices().find(s => s.id === id);
}

router.get('/', (req, res) => {
        res.json(loadServices());
});

router.get('/:id/config', (req, res) => {
        const service = findService(req.params.id);
        if (!service) {
                return res.status(404).send({ error: 'service not found' });
        }

        fs.readFile(service.config, 'utf8', (err, data) => {
                if (err) {
                        log.error(`Ошибка чтения файла ${service.config}: ${err.message}`);
                        return res.status(500).send({ error: 'read failed' });
                }
                res.json({ content: data });
        });
});

router.post('/:id/config', (req, res) => {
        const service = findService(req.params.id);
        if (!service) {
                return res.status(404).send({ error: 'service not found' });
        }

        const content = req.body && req.body.content ? req.body.content : '';
        fs.writeFile(service.config, content, 'utf8', err => {
                if (err) {
                        log.error(`Ошибка записи файла ${service.config}: ${err.message}`);
                        return res.status(500).send({ error: 'write failed' });
                }
                log.info(`Конфигурация для ${service.id} сохранена`);
                res.json({ status: 'ok' });
        });
});

module.exports = router;
