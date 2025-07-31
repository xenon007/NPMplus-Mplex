const express = require('express');

// Простая реализация API для аудио стримов
// Пока что возвращает статический список для разработки
let router = express.Router({
        caseSensitive: true,
        strict: true,
        mergeParams: true,
});

/**
 * /api/audio-streams
 */
router
        .route('/')
        .get((req, res) => {
                res.status(200).send([
                        {
                                id: 1,
                                name: 'Demo Stream',
                                url: 'http://example.com/stream',
                                format: 'mp3',
                                bitrate: 128,
                                token_type: 'not_used',
                                token: '',
                                token_mask: '',
                                buffer: 0,
                        },
                ]);
        });

module.exports = router;
