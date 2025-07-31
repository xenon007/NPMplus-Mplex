const fs = require('fs');
const yaml = require('js-yaml');
const logger = require('../logger').express;

/**
 * Загружает конфигурацию мультиплексора из YAML-файла
 * @param {string} filePath путь к файлу конфигурации
 * @returns {object} объект конфигурации
 */
function loadConfig(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(raw) || {};
        logger.info(`Loaded multiplexor config from ${filePath}`);
        return data;
    } catch (err) {
        logger.error(`Failed to read multiplexor config: ${err.message}`);
        return {};
    }
}

/**
 * Сохраняет объект конфигурации в YAML-файл
 * @param {string} filePath путь к файлу конфигурации
 * @param {object} data данные для сохранения
 * @returns {boolean} успех операции
 */
function saveConfig(filePath, data) {
    try {
        const content = yaml.dump(data, { noRefs: true });
        fs.writeFileSync(filePath, content, 'utf8');
        logger.info(`Saved multiplexor config to ${filePath}`);
        return true;
    } catch (err) {
        logger.error(`Failed to write multiplexor config: ${err.message}`);
        return false;
    }
}

module.exports = {
    loadConfig,
    saveConfig
};
