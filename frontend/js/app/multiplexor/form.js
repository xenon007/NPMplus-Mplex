const $ = require('jquery');

// Храним ссылки на элементы формы правил, чтобы проще собирать данные
const ruleMap = [];

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
    $('#rules').append(row);

    // Сохраняем ссылку на элементы для последующего чтения/удаления
    ruleMap.push({
        row,
        matchInput: row.find('.rule-match'),
        forwardInput: row.find('.rule-forward')
    });
}

/**
 * Инициализация страницы мультиплексора
 */
module.exports = function initForm() {
    // Загрузка текущей конфигурации
    function loadConfig() {
        $.get('/multiplexor/api/config', cfg => {
            console.debug('Loaded config', cfg);
            $('#listen').val(cfg.listen || '');
            $('#rules').empty();
            ruleMap.length = 0; // сбрасываем локальный массив
            (cfg.rules || []).forEach(rule => addRuleRow(rule.match, rule.forward));
        });
    }

    // Сбор данных формы и отправка на сервер
    $('#mplex-form').on('submit', function (e) {
        e.preventDefault();
        const config = {
            listen: $('#listen').val().trim(),
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
    $('#add-rule').on('click', () => addRuleRow());
    $('#rules').on('click', '.remove-rule', function () {
        const row = $(this).closest('.rule-row');
        // Удаляем из DOM и из локального массива
        const idx = ruleMap.findIndex(r => r.row.is(row));
        if (idx >= 0) {
            ruleMap.splice(idx, 1);
        }
        row.remove();
    });

    loadConfig();
};
