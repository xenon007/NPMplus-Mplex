const $ = require('jquery');

// Храним ссылки на элементы формы правил и контейнер с правилами
const ruleMap = [];
let $rules;

// Типы мультиплексоров
const TYPES = [
    { id: 'caddy', name: 'Caddy' },
    { id: 'protoplex', name: 'Protoplex' },
    { id: 'shoes', name: 'Shoes' },
    { id: 'singbox', name: 'Sing-Box' },
    { id: 'sslh', name: 'SSLH' }
];

/**
 * Добавляет строку для правила в форму
 * @param {string} [match=''] шаблон
 * @param {string} [forward=''] перенаправление
 */
function addRuleRow(match = '', forward = '') {
    const row = $('<div class="form-row rule-row mb-2"></div>');
    row.append(`<div class="col"><input type="text" class="form-control rule-match" placeholder="match" value="${match}" /></div>`);
    row.append(`<div class="col"><input type="text" class="form-control rule-forward" placeholder="forward" value="${forward}" /></div>`);
    row.append('<div class="col-auto"><button type="button" class="btn btn-danger remove-rule">&times;</button></div>');
    $rules.append(row);

    // Сохраняем ссылку на элементы для последующего чтения/удаления
    ruleMap.push({
        row,
        matchInput: row.find('.rule-match'),
        forwardInput: row.find('.rule-forward')
    });

    console.debug('Rule row added', { match, forward });
}

/**
 * Инициализация страницы мультиплексора
 * @param {HTMLElement} rootEl корневой DOM-элемент представления
 */
module.exports = function initForm(rootEl) {
    const $root = $(rootEl);
    const $form = $root.find('#mplex-form');
    const $listen = $root.find('#listen');
    const $ip = $root.find('#listen-ip');
    const $type = $root.find('#mplex-type');
    $rules = $root.find('#rules');
    const $addRule = $root.find('#add-rule');

    // Заполняем селектор типов
    TYPES.forEach(t => $type.append(`<option value="${t.id}">${t.name}</option>`));

    // Загрузка списка IP адресов
    $.get('/multiplexor/api/ips', ips => {
        ips.forEach(ip => $ip.append(`<option value="${ip}">${ip}</option>`));
    });

    // Загрузка текущей конфигурации
    function loadConfig() {
        $.get('/multiplexor/api/config', cfg => {
            console.debug('Loaded config', cfg);
            $listen.val(cfg.port || '');
            $ip.val(cfg.ip || '0.0.0.0');
            $type.val(cfg.type || 'caddy');
            $rules.empty();
            ruleMap.length = 0; // сбрасываем локальный массив
            if (cfg.rules && cfg.rules.length) {
                cfg.rules.forEach(rule => addRuleRow(rule.match, rule.forward));
            } else {
                // Добавляем пустое правило по умолчанию
                addRuleRow();
            }
        });
    }

    // Сбор данных формы и отправка на сервер
    $form.on('submit', function (e) {
        e.preventDefault();
        const config = {
            ip: $ip.val().trim(),
            port: $listen.val().trim(),
            type: $type.val(),
            rules: []
        };

        // Собираем данные из локальной карты правил
        ruleMap.forEach(item => {
            const match = item.matchInput.val().trim();
            const forward = item.forwardInput.val().trim();
            if (match && forward) {
                config.rules.push({ match, forward });
            }
        });
        console.debug('Saving config', config);
        $.ajax({
            url: '/multiplexor/api/config',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(config),
            success: () => alert('Конфигурация сохранена'),
            error: () => alert('Ошибка сохранения конфигурации')
        });
    });

    // Добавление/удаление правил
    $addRule.on('click', () => addRuleRow());
    $rules.on('click', '.remove-rule', function () {
        const row = $(this).closest('.rule-row');
        // Удаляем из DOM и из локального массива
        const idx = ruleMap.findIndex(r => r.row.is(row));
        if (idx >= 0) {
            ruleMap.splice(idx, 1);
        }
        row.remove();
        console.debug('Rule row removed', { index: idx });
    });

    loadConfig();
};
