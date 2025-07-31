const Mn  = require('backbone.marionette');
const App = require('../main');
const tpl = require('./main.ejs');

// Представление страницы аудио стримов
module.exports = Mn.View.extend({
    id:       'audio-streams',
    template: tpl,

    ui: {
        list:        '#audio-stream-list',
        importBtn:   '.import-streams',
        importFile:  '#import-playlist',
        addBtn:      '.add-stream'
    },

    events: {
        'click @ui.importBtn': 'openImportDialog',
        'change @ui.importFile': 'handleImport',
        'click @ui.addBtn': 'handleAdd'
    },

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

    // Открывает диалог выбора файла
    openImportDialog: function (e) {
        e.preventDefault();
        this.getUI('importFile').click();
    },

    // Обрабатывает импорт плейлиста
    handleImport: function (e) {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        const view   = this;

        reader.onload = function (evt) {
            try {
                const parsed = view.parsePlaylist(evt.target.result);
                console.log('Parsed playlist', parsed);

                // Отправляем полученные данные на сервер
                fetch('/api/audio-streams/import', {
                    method:  'POST',
                    headers: {'Content-Type': 'application/json'},
                    body:    JSON.stringify(parsed)
                })
                    .then(res => res.json())
                    .then(data => {
                        view.streams = view.streams.concat(data);
                        view.renderStreams();
                    })
                    .catch(err => {
                        console.error('Failed to import playlist', err);
                    });
            } catch (err) {
                console.error('Failed to parse playlist', err);
            }
        };

        reader.readAsText(file);
        // сбрасываем значение input, чтобы можно было повторно выбирать тот же файл
        e.target.value = '';
    },

    // Простейший рендер списка потоков
    renderStreams: function () {
        const list = this.getUI('list')[0];
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

    // Парсер текстовых плейлистов (M3U/M3U8/PLS)
    parsePlaylist: function (text) {
        const streams = [];

        if (/^\s*\[playlist\]/im.test(text)) {
            // PLS формат
            const lines  = text.split(/\r?\n/);
            const titles = {};
            const files  = {};

            lines.forEach((line) => {
                let m = line.match(/^File(\d+)=(.+)$/i);
                if (m) {
                    files[m[1]] = m[2].trim();
                }

                m = line.match(/^Title(\d+)=(.+)$/i);
                if (m) {
                    titles[m[1]] = m[2].trim();
                }
            });

            Object.keys(files).forEach((idx) => {
                streams.push({
                    name: titles[idx] || 'Stream ' + idx,
                    url:  files[idx]
                });
            });
        } else {
            // M3U/M3U8 формат
            const lines = text.split(/\r?\n/);

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) {
                    continue;
                }

                if (line.startsWith('#EXTINF')) {
                    const name = line.split(',', 2)[1] || 'Stream';
                    const url  = lines[++i] ? lines[i].trim() : '';
                    if (url) {
                        streams.push({name: name, url: url});
                    }
                } else if (!line.startsWith('#')) {
                    streams.push({name: 'Stream', url: line});
                }
            }
        }

        return streams;
    },

    // Заглушка для ручного добавления стрима
    handleAdd: function (e) {
        e.preventDefault();
        console.log('Add stream clicked');
        // Здесь в будущем может открываться форма добавления
    }
});
