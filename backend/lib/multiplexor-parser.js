const fs = require('fs');
const yaml = require('js-yaml');
const logger = require('../logger').express;

/**
 * Преобразует структуру Shoes Multiplexor в упрощённый объект формы
 * @param {Array|Object} data исходная структура из YAML
 * @returns {{listen: string, rules: Array}} объект формы
 */
function normalize(data) {
    const first = Array.isArray(data) ? data[0] : data || {};

    // Адрес прослушивания
    const listen = first.address || '';

    // Каждое правило сводим к {match, forward}
    const rules = (((first.protocol || {}).rules) || []).map(rule => ({
        match: (rule.lpn && rule.lpn[0]) || (rule.sni && rule.sni[0]) || '',
        forward: rule.target || ''
    }));

    return { listen, rules };
}

/**
 * Преобразует объект формы в структуру Shoes Multiplexor
 * @param {{listen: string, rules: Array}} formData данные формы
 * @returns {Array} структура для YAML
 */
function denormalize(formData) {
    return [{
        address: formData.listen || '',
        transport: 'tcp',
        protocol: {
            type: 'http',
            rules: (formData.rules || []).map(r => {
                const rule = {
                    name: r.match || 'rule',
                    target: r.forward || ''
                };

                // Выбираем тип сопоставления: SNI для доменов, LPN для остального
                if (r.match && r.match.includes('.')) {
                    rule.sni = [r.match];
                } else {
                    rule.lpn = [r.match];
                }

                return rule;
            })
        }
    }];
}

/**
 * Загружает конфигурацию мультиплексора из YAML-файла
 * @param {string} filePath путь к файлу конфигурации
 * @returns {object} объект конфигурации для формы
 */
function loadConfig(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const yamlData = yaml.load(raw) || {};
        const cfg = normalize(yamlData);
        logger.info(`Loaded multiplexor config from ${filePath}`);
        return cfg;
    } catch (err) {
        logger.error(`Failed to read multiplexor config: ${err.message}`);
        return { listen: '', rules: [] };
    }
}

/**
 * Сохраняет объект конфигурации в YAML-файл
 * @param {string} filePath путь к файлу конфигурации
 * @param {object} data данные формы для сохранения
 * @returns {boolean} успех операции
 */
function saveConfig(filePath, data) {
    try {
        const yamlData = denormalize(data);
        const content = yaml.dump(yamlData, { noRefs: true });
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
