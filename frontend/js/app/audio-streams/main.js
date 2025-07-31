const Mn       = require('backbone.marionette');
const Backbone = require('backbone');
const App      = require('../main');
const tpl      = require('./main.ejs');
const EditView = require('./edit');

// Представление страницы аудио стримов
module.exports = Mn.View.extend({
    id:       'audio-streams',
    template: tpl,

    ui: {
        list:        '#audio-stream-list',
        importBtn:   '.import-streams',
        importFile:  '#import-playlist',
        addBtn:      '.add-stream',
        saveM3uBtn:  '.save-m3u',
        savePlsBtn:  '.save-pls',
        audioPlayer: '#audio-player'
    },

    events: {
        'click @ui.importBtn': 'openImportDialog',
        'change @ui.importFile': 'handleImport',
        'click @ui.addBtn': 'handleAdd',
        'click @ui.saveM3uBtn': 'downloadM3u',
        'click @ui.savePlsBtn': 'downloadPls',
        'click .delete-stream': 'handleDelete',
        'click .play-stream': 'handlePlay',
        'click .edit-stream': 'handleEdit'
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

    // Простейший рендер списка потоков в виде таблицы
    renderStreams: function () {
        const list = this.getUI('list')[0];
        if (!list) {
            return;
        }

        // Очищаем список
        list.innerHTML = '';

        this.streams.forEach((stream) => {
            const row        = document.createElement('tr');
            const aliasUrl   = this.getAliasUrl(stream);
            const aliasLabel = stream.alias || stream.name;
            row.innerHTML    =
                `<td><div class="wrap"><span class="tag host-link hover-purple" rel="${aliasUrl}">${aliasLabel}</span></div></td>` +
                `<td>${stream.category || ''}</td>` +
                `<td><div class="text-monospace"><span class="host-link" rel="${stream.url}">${stream.url}</span></div></td>` +
                `<td class="text-right"><div class="btn-list">` +
                `<button class="btn btn-sm btn-outline-secondary edit-stream mr-2" data-id="${stream.id}" title="${App.i18n('str','edit')}"><i class="fe fe-edit-2"></i></button>` +
                `<button class="btn btn-sm btn-outline-primary play-stream mr-2" data-id="${stream.id}" title="${App.i18n('audio-streams','play')}"><i class="fe fe-play"></i></button>` +
                `<button class="btn btn-sm btn-link text-danger delete-stream" data-id="${stream.id}" title="${App.i18n('audio-streams','delete')}"><i class="fe fe-trash"></i></button>` +
                `</div></td>`;
            list.appendChild(row);
        });
    },

    // Редактирование существующего стрима в модальном окне
    handleEdit: function (e) {
        e.preventDefault();
        const id     = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        const stream = this.streams.find(s => s.id === id);
        if (!stream) {
            return;
        }

        const view  = this;
        const model = new Backbone.Model(stream);
        const modal = new EditView({model: model});

        modal.on('saved', function (updated) {
            const idx = view.streams.findIndex(s => s.id === updated.id);
            if (idx !== -1) {
                view.streams[idx] = updated;
                view.renderStreams();
            }
        });

        App.UI.showModalDialog(modal);
    },

    // Получение URL алиаса или исходного адреса
    getAliasUrl: function (stream) {
        if (!stream || !stream.url) {
            return '';
        }
        return `/api/audio-streams/${stream.id}/play`;
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
        const name  = prompt('Название потока:');
        const url   = name ? prompt('URL потока:') : null;
        const alias = name && url ? prompt('Алиас (опционально):', name.replace(/\s+/g, '').toLowerCase()) : null;
        const category = name && url ? prompt('Категория (опционально):') : null;
        if (!name || !url) {
            return;
        }
        const view = this;
        fetch('/api/audio-streams', {
            method:  'POST',
            headers: {'Content-Type': 'application/json'},
            body:    JSON.stringify({name: name, url: url, alias: alias || undefined, category: category || ''})
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
    },

    // Воспроизведение выбранного потока
    handlePlay: function (e) {
        e.preventDefault();
        const id     = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        const stream = this.streams.find(s => s.id === id);
        if (!stream) {
            return;
        }
        const player = this.getUI('audioPlayer')[0];
        const url    = this.getAliasUrl(stream);
        player.src   = url;
        console.log('Playing stream', stream.name, url);
        player.play().catch(err => console.error('Cannot play stream', err));
    },

    // Генерация и скачивание плейлиста M3U
    downloadM3u: function (e) {
        e.preventDefault();
        const content = this.generateM3u();
        this.downloadFile(content, 'playlist.m3u');
    },

    // Генерация и скачивание плейлиста PLS
    downloadPls: function (e) {
        e.preventDefault();
        const content = this.generatePls();
        this.downloadFile(content, 'playlist.pls');
    },

    // Формирование текста M3U
    generateM3u: function () {
        let output = '#EXTM3U\n';
        this.streams.forEach((s) => {
            output += `#EXTINF:-1,${s.name}\n${this.getAliasUrl(s)}\n`;
        });
        return output;
    },

    // Формирование текста PLS
    generatePls: function () {
        const lines = ['[playlist]'];
        this.streams.forEach((s, idx) => {
            const num = idx + 1;
            lines.push(`File${num}=${this.getAliasUrl(s)}`);
            lines.push(`Title${num}=${s.name}`);
        });
        lines.push(`NumberOfEntries=${this.streams.length}`);
        lines.push('Version=2');
        return lines.join('\n');
    },

    // Скачивание файла в браузере
    downloadFile: function (content, filename) {
        const blob = new Blob([content], {type: 'text/plain'});
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Playlist saved', filename);
    }
});
