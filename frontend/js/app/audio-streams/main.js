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
        'click @ui.addBtn': 'handleAdd',
        'click .delete-stream': 'handleDelete'
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
            li.className = 'd-flex justify-content-between align-items-center mb-1';
            li.innerHTML = `<span>${stream.name} - ${stream.url}</span>` +
                `<button class="btn btn-sm btn-link text-danger delete-stream" data-id="${stream.id}" title="${App.i18n('audio-streams','delete')}"><i class="fe fe-trash"></i></button>`;
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

    // Простое добавление нового стрима через prompt
    handleAdd: function (e) {
        e.preventDefault();
        const name = prompt('Название потока:');
        const url  = name ? prompt('URL потока:') : null;
        if (!name || !url) {
            return;
        }
        const view = this;
        fetch('/api/audio-streams', {
            method:  'POST',
            headers: {'Content-Type': 'application/json'},
            body:    JSON.stringify({name: name, url: url})
        })
            .then(res => res.json())
            .then(data => {
                view.streams.push(data);
                view.renderStreams();
            })
            .catch(err => {
                console.error('Failed to add stream', err);
            });
    },

    // Удаление стрима
    handleDelete: function (e) {
        e.preventDefault();
        const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        if (!id || !confirm(App.i18n('audio-streams','delete-confirm'))) {
            return;
        }
        const view = this;
        fetch(`/api/audio-streams/${id}`, {method: 'DELETE'})
            .then(() => {
                view.streams = view.streams.filter(s => s.id !== id);
                view.renderStreams();
            })
            .catch(err => {
                console.error('Failed to delete stream', err);
            });
    }
});
