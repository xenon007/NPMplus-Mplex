const Mn  = require('backbone.marionette');
const App = require('../main');
const tpl = require('./main.ejs');

// Представление страницы аудио стримов
module.exports = Mn.View.extend({
    id:       'audio-streams',
    template: tpl,

    initialize: function () {
        // Список стримов будет храниться в памяти
        this.streams = [];
    },

    onRender: function () {
        const view = this;
        // Логирование для отладки
        console.log('Audio Streams view rendered');

        // Получаем список аудио потоков с API
        fetch('/api/audio-streams')
            .then((response) => response.json())
            .then((data) => {
                view.streams = data;
                view.renderStreams();
            })
            .catch((err) => {
                console.error('Failed to load audio streams', err);
            });
    },

    // Простейший рендер списка потоков
    renderStreams: function () {
        const list = this.el.querySelector('#audio-stream-list');
        if (!list) {
            return;
        }

        // Очищаем список
        list.innerHTML = '';

        this.streams.forEach((stream) => {
            const li = document.createElement('li');
            li.textContent = stream.name + ' - ' + stream.url;
            list.appendChild(li);
        });
    },
});
