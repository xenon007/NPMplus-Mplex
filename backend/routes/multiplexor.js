const express = require('express');
const os = require('os');
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const { saveConfig } = require('../lib/multiplexor-config');
const state = require('../lib/multiplexor-state');

const router = express.Router();

// Путь к описаниям сервисов
const SERVICES_PATH = path.join(__dirname, '../../services.json');

/**
 * Список доступных IP адресов контейнера
 */
router.get('/api/ips', (req, res) => {
    const nets = os.networkInterfaces();
    const ips = new Set(['0.0.0.0', '127.0.0.1']);
    Object.values(nets).forEach(ifaces => {
        ifaces.forEach(iface => {
            if (iface.family === 'IPv4') {
                ips.add(iface.address);
            }
        });
    });
    res.json(Array.from(ips));
});

/**
 * Получить текущую конфигурацию
 */
router.get('/api/config', (req, res) => {
    res.json(state.loadState());
});

/**
 * Список доступных сервисов
 */
router.get('/api/services', (req, res) => {
    try {
        const services = JSON.parse(fs.readFileSync(SERVICES_PATH, 'utf8'));
        res.json(services);
    } catch (err) {
        res.status(500).json({ services: [] });
    }
});

/**
 * Сохранить конфигурацию мультиплексора
 */
router.post('/api/config', express.json(), (req, res) => {
    try {
        state.saveState(req.body);
        saveConfig(req.body.type, req.body);
        childProcess.exec(`pkill -HUP ${req.body.type}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;
