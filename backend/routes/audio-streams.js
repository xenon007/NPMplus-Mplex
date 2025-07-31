const express = require('express');
// используем общий логгер для наглядности
const logger  = require('../logger').audio;

// Простая реализация API для аудио стримов
// На данном этапе данные хранятся только в памяти
let router = express.Router({
        caseSensitive: true,
        strict: true,
        mergeParams: true,
});

// Временное хранилище добавленных потоков
// В дальнейшем это будет заменено на базу данных
let streams = [
        {
                id:         1,
                name:       'Demo Stream',
                alias:      'demo-stream',
                url:        'http://example.com/stream',
                format:     'mp3',
                bitrate:    128,
                token_type: 'not_used',
                token:      '',
                token_mask: '',
                buffer:     0,
        },
];

// вспомогательная функция для поиска потока по id
function findStream(id) {
        return streams.find((s) => s.id === id);
}

/**
 * /api/audio-streams
 */
router
        .route('/')
        .get((req, res) => {
                // Возвращаем все сохраненные потоки
                res.status(200).send(streams);
        })

        // Создание нового аудио потока
        .post(express.json(), (req, res) => {
                const nextId = streams.length ? Math.max(...streams.map((s) => s.id)) + 1 : 1;
                const body   = req.body || {};
                const stream = {
                        id:         nextId,
                        name:       body.name || `Stream ${nextId}`,
                        alias:      body.alias || `stream${nextId}`,
                        url:        body.url || '',
                        format:     body.format || '',
                        bitrate:    typeof body.bitrate === 'number' ? body.bitrate : 0,
                        token_type: body.token_type || 'not_used',
                        token:      body.token || '',
                        token_mask: body.token_mask || '',
                        buffer:     typeof body.buffer === 'number' ? body.buffer : 0,
                };
                streams.push(stream);
                logger.info('Добавлен поток: %s', stream.name);
                res.status(201).send(stream);
        });

/**
 * Импорт аудио потоков из плейлистов
 * Принимает массив объектов {name, url}
 */
router.post('/import', express.json(), (req, res) => {
        const items = Array.isArray(req.body) ? req.body : [];
        const added = items.map((item, idx) => {
                // простое назначение id
                const stream = {
                        id:         streams.length + idx + 1,
                        name:       item.name || `Stream ${streams.length + idx + 1}`,
                        alias:      item.alias || `stream${streams.length + idx + 1}`,
                        url:        item.url || '',
                        format:     item.format || '',
                        bitrate:    item.bitrate || 0,
                        token_type: item.token_type || 'not_used',
                        token:      item.token || '',
                        token_mask: item.token_mask || '',
                        buffer:     typeof item.buffer === 'number' ? item.buffer : 0,
                };
                streams.push(stream);
                return stream;
        });

        res.status(200).send(added);
});

// CRUD операции над конкретным потоком
router
        .route('/:id')
        // Получить поток по ID
        .get((req, res) => {
                const id     = Number(req.params.id);
                const stream = findStream(id);
                if (!stream) {
                        return res.sendStatus(404);
                }
                res.status(200).send(stream);
        })
        // Обновить поток
        .put(express.json(), (req, res) => {
                const id     = Number(req.params.id);
                const stream = findStream(id);
                if (!stream) {
                        return res.sendStatus(404);
                }
                Object.assign(stream, req.body || {});
                logger.info('Обновлен поток: %s', stream.name);
                res.status(200).send(stream);
        })
        // Удалить поток
        .delete((req, res) => {
                const id = Number(req.params.id);
                const idx = streams.findIndex((s) => s.id === id);
                if (idx === -1) {
                        return res.sendStatus(404);
                }
                const removed = streams.splice(idx, 1)[0];
                logger.info('Удален поток: %s', removed.name);
                res.sendStatus(204);
        });

// Маршрут для воспроизведения потока по алиасу
router.get('/:id/play', (req, res) => {
        const id     = Number(req.params.id);
        const stream = findStream(id);
        if (!stream) {
                return res.sendStatus(404);
        }
        // Простейшая реализация проксирования через редирект
        logger.info('Запрос потока по алиасу: %s', stream.alias);
        res.redirect(stream.url);
});

module.exports = router;
