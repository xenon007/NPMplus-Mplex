const fs = require('fs');
const path = require('path');
const parser = require('./multiplexor-parser');
const logger = require('../logger').express;

// Директория для файлов конфигурации мультиплексора
const CONFIG_DIR = path.join(__dirname, '../../services');

// Сопоставление типа мультиплексора и имени файла
const FILES = {
    caddy: 'Caddyfile',
    protoplex: 'protoplex.toml',
    shoes: 'shoes.yaml',
    singbox: 'singbox.json',
    sslh: 'sslh.cfg'
};

/**
 * Возвращает полный путь к файлу конфигурации по типу
 * @param {string} type тип мультиплексора
 * @returns {string}
 */
function getFilePath(type) {
    const name = FILES[type];
    if (!name) {
        throw new Error(`Unknown multiplexor type: ${type}`);
    }
    return path.join(CONFIG_DIR, name);
}

/**
 * Генерирует содержимое конфигурации для конкретного мультиплексора
 * @param {string} type тип мультиплексора
 * @param {{ip:string, port:string, rules:Array<{match:string, forward:string}>}} data
 * @returns {string}
 */
function generateContent(type, data) {
    const listen = `${data.ip}:${data.port}`;
    switch (type) {
        case 'caddy':
            return `${listen} {\n${data.rules.map((r, i) => `    @rule${i} host ${r.match}\n    reverse_proxy @rule${i} ${r.forward}\n`).join('')}\n}`;
        case 'protoplex':
            return `listen = "${listen}"\n${data.rules.map(r => `[[service]]\nmatch = "${r.match}"\nforward = "${r.forward}"\n`).join('')}`;
        case 'shoes':
            // Используем существующий парсер для генерации YAML
            parser.saveConfig(getFilePath(type), { listen, rules: data.rules });
            return null; // файл уже записан парсером
        case 'singbox':
            return JSON.stringify({
                inbounds: [{ type: 'mixed', listen: data.ip, listen_port: parseInt(data.port, 10) }],
                routing: { rules: data.rules }
            }, null, 2);
        case 'sslh':
            return `verbose: false\nforeground: false\nlisten: ${listen}\n${data.rules.map(r => `protocols:\n  - name: ${r.match}\n    host: ${r.forward}\n`).join('')}`;
        default:
            throw new Error(`Unsupported multiplexor type: ${type}`);
    }
}

/**
 * Сохраняет конфигурацию мультиплексора в соответствующий файл
 * @param {string} type тип мультиплексора
 * @param {{ip:string, port:string, rules:Array}} data данные формы
 */
function saveConfig(type, data) {
    const filePath = getFilePath(type);
    const content = generateContent(type, data);
    if (content !== null) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
    logger.info(`Config for ${type} saved to ${filePath}`);
}

module.exports = { getFilePath, saveConfig };
