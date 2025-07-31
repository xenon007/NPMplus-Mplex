const Mn = require('backbone.marionette');
const template = require('./main.ejs');
const initForm = require('./form');

module.exports = Mn.View.extend({
    id: 'multiplexor',
    template: template,
    onRender: function () {
        // Инициализация формы после отображения шаблона
        initForm();
    }
});
