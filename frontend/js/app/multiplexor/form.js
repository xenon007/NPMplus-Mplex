const $ = require('jquery');
// Загрузка менеджера сервисов мультиплексора
require('./services');
const services = window.multiplexorServices;

/**
 * Добавляет строку для правила в форму
 * @param {string} [match=''] шаблон
 * @param {string} [forward=''] перенаправление
 */
function addRuleRow(match = '', forward = '', serviceId = null) {
    const row = $('<div class="form-row rule-row mb-2"></div>');
    if (serviceId) {
        row.attr('data-service-id', serviceId);
    }
    row.append(`<div class="col"><input type="text" class="form-control rule-match" placeholder="match" value="${match}" ${serviceId ? 'readonly' : ''} /></div>`);
    row.append(`<div class="col"><input type="text" class="form-control rule-forward" placeholder="forward" value="${forward}" /></div>`);
    if (!serviceId) {
        row.append('<div class="col-auto"><button type="button" class="btn btn-danger remove-rule">&times;</button></div>');
    }
    $('#rules').append(row);
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
            services.loadServices().then(() => {
                const active = [];
                (cfg.rules || []).forEach(rule => {
                    const svc = services.getServiceByMatch(rule.match);
                    if (svc) {
                        active.push(svc.id);
                        addRuleRow(svc.match, rule.forward || svc.defaultForward, svc.id);
                    } else {
                        addRuleRow(rule.match, rule.forward);
                    }
                });
                const container = document.getElementById('services');
                services.createServiceCards(container, active, (service, enabled) => {
                    if (enabled) {
                        addRuleRow(service.match, service.defaultForward, service.id);
                    } else {
                        $('#rules').find(`[data-service-id="${service.id}"]`).remove();
                    }
                });
            });
        });
    }

    // Сбор данных формы и отправка на сервер
    $('#mplex-form').on('submit', function (e) {
        e.preventDefault();
        const config = {
            listen: $('#listen').val().trim(),
            rules: []
        };
        $('#rules .rule-row').each(function () {
            const match = $(this).find('.rule-match').val().trim();
            const forward = $(this).find('.rule-forward').val().trim();
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
        $(this).closest('.rule-row').remove();
    });

    loadConfig();
};
