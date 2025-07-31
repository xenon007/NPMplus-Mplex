const Mn   = require('backbone.marionette');
const App  = require('../main');
const tpl  = require('./main.ejs');

// Простое представление страницы аудио стримов
module.exports = Mn.View.extend({
    id:       'audio-streams',
    template: tpl,

    onRender: function () {
        // Логирование для отладки
        console.log('Audio Streams view rendered');
    }
});
