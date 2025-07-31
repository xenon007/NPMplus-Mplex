const express = require('express');

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
                url:        'http://example.com/stream',
                format:     'mp3',
                bitrate:    128,
                token_type: 'not_used',
                token:      '',
                token_mask: '',
                buffer:     0,
        },
];

/**
 * /api/audio-streams
 */
router
        .route('/')
        .get((req, res) => {
                // Возвращаем все сохраненные потоки
                res.status(200).send(streams);
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

module.exports = router;
