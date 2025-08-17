const fs = require('fs');
const path = require('path');
const logger = require('../logger').express;

const STATE_FILE = path.join(__dirname, '../../services/state.json');

/**
 * Загружает сохранённое состояние мультиплексора
 * @returns {{type:string, ip:string, port:string, rules:Array}}
 */
function loadState() {
    try {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        logger.warn(`State file missing, using defaults: ${e.message}`);
        return { type: 'caddy', ip: '0.0.0.0', port: '443', rules: [] };
    }
}

/**
 * Сохраняет состояние мультиплексора
 * @param {{type:string, ip:string, port:string, rules:Array}} state
 */
function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    logger.info(`State saved to ${STATE_FILE}`);
}

module.exports = { loadState, saveState };
