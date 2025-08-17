const express = require('express');
const http = require('http');
const https = require('https');
const logger = require('../logger').audio;
const AudioStream = require('../models/audio_stream');

let router = express.Router({
        caseSensitive: true,
        strict: true,
        mergeParams: true,
});

function buildUrl(stream) {
        let target = stream.url;
        if (stream.token && stream.token_mask) {
                target = stream.url + stream.token_mask.replace('{token}', stream.token);
        }
        return target;
}

router
        .route('/')
        .get(async (req, res) => {
                const items = await AudioStream.query().where('is_deleted', 0);
                res.status(200).send(items);
        })
        .post(express.json(), async (req, res) => {
                try {
                        const body = req.body || {};
                        const stream = await AudioStream.query().insert({
                                name: body.name || 'Stream',
                                alias: body.alias || (body.name ? body.name.replace(/\s+/g, '').toLowerCase() : 'stream'),
                                url: body.url || '',
                                format: body.format || '',
                                bitrate: typeof body.bitrate === 'number' ? body.bitrate : 0,
                                token_type: body.token_type || 'not_used',
                                token: body.token || '',
                                token_mask: body.token_mask || '',
                                buffer: typeof body.buffer === 'number' ? body.buffer : 0,
                                category: body.category || '',
                        });
                        logger.info('Добавлен поток: %s', stream.name);
                        res.status(201).send(stream);
                } catch (err) {
                        logger.error('Ошибка добавления потока: %s', err.message);
                        res.status(500).send({ error: 'failed to add stream' });
                }
        });

router.post('/import', express.json(), async (req, res) => {
        const items = Array.isArray(req.body) ? req.body : [];
        const added = [];
        for (const item of items) {
                const stream = await AudioStream.query().insert({
                        name: item.name || 'Stream',
                        alias: item.alias || (item.name ? item.name.replace(/\s+/g, '').toLowerCase() : 'stream'),
                        url: item.url || '',
                        format: item.format || '',
                        bitrate: typeof item.bitrate === 'number' ? item.bitrate : 0,
                        token_type: item.token_type || 'not_used',
                        token: item.token || '',
                        token_mask: item.token_mask || '',
                        buffer: typeof item.buffer === 'number' ? item.buffer : 0,
                        category: item.category || '',
                });
                added.push(stream);
        }
        res.status(200).send(added);
});

router
        .route('/:id')
        .get(async (req, res) => {
                const id = Number(req.params.id);
                const stream = await AudioStream.query().findById(id);
                if (!stream || stream.is_deleted) {
                        return res.sendStatus(404);
                }
                res.status(200).send(stream);
        })
        .put(express.json(), async (req, res) => {
                const id = Number(req.params.id);
                const stream = await AudioStream.query().findById(id);
                if (!stream) {
                        return res.sendStatus(404);
                }
                const updated = await AudioStream.query().patchAndFetchById(id, req.body || {});
                logger.info('Обновлен поток: %s', updated.name);
                res.status(200).send(updated);
        })
        .delete(async (req, res) => {
                const id = Number(req.params.id);
                await AudioStream.query().deleteById(id);
                logger.info('Удален поток ID %s', id);
                res.sendStatus(204);
        });

router.get('/:id/play', async (req, res) => {
        const id = Number(req.params.id);
        const stream = await AudioStream.query().findById(id);
        if (!stream) {
                return res.sendStatus(404);
        }
        const targetUrl = buildUrl(stream);
        logger.info('Проксирование потока: %s -> %s', stream.alias, targetUrl);
        try {
                const parsed = new URL(targetUrl);
                const client = parsed.protocol === 'https:' ? https : http;
                const proxy = client.get(parsed, (r) => {
                        res.writeHead(r.statusCode, r.headers);
                        r.pipe(res);
                });
                proxy.on('error', (err) => {
                        logger.error('Ошибка проксирования: %s', err.message);
                        if (!res.headersSent) {
                                res.sendStatus(502);
                        } else {
                                res.end();
                        }
                });
        } catch (err) {
                logger.error('Некорректный URL: %s', err.message);
                res.sendStatus(500);
        }
});

module.exports = router;
