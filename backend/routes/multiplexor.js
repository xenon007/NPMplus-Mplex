const express = require('express');
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const parser = require('../lib/multiplexor-parser');

const router = express.Router();

// Имя используемого мультиплексора (по умолчанию shoes)
const MULTIPLEXOR_NAME = process.env.MULTIPLEXPOR_NAME || 'shoes';

// Путь к файлу конфигурации мультиплексора
const CONFIG_PATH = process.env.MPLEX_CONFIG_PATH ||
    path.join(__dirname, `../../mplex/config/${MULTIPLEXOR_NAME}.yaml`);

// Путь к описаниям сервисов
const SERVICES_PATH = path.join(__dirname, `../../mplex/${MULTIPLEXOR_NAME}/services.json`);

/**
 * Получить текущую конфигурацию
 */
router.get('/api/config', (req, res) => {
    const cfg = parser.loadConfig(CONFIG_PATH);
    res.json(cfg);
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
    const ok = parser.saveConfig(CONFIG_PATH, req.body);
    if (ok) {
        // Перезапускаем процесс мультиплексора, чтобы применить изменения
        childProcess.exec(`pkill -HUP ${MULTIPLEXOR_NAME}`);
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

module.exports = router;
