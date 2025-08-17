const migrate_name = 'add-audio-stream-table';
const logger = require('../logger').migrate;

exports.up = function (knex) {
    logger.info('[' + migrate_name + '] Migrating Up...');
    return knex.schema
        .createTable('audio_stream', (table) => {
            table.increments().primary();
            table.dateTime('created_on').notNull();
            table.dateTime('modified_on').notNull();
            table.integer('is_deleted').notNull().unsigned().defaultTo(0);
            table.string('name').notNull();
            table.string('alias').notNull();
            table.string('url').notNull();
            table.string('format').notNull().defaultTo('');
            table.integer('bitrate').notNull().unsigned().defaultTo(0);
            table.string('token_type').notNull().defaultTo('not_used');
            table.string('token').notNull().defaultTo('');
            table.string('token_mask').notNull().defaultTo('');
            table.integer('buffer').notNull().unsigned().defaultTo(0);
            table.string('category').notNull().defaultTo('');
        })
        .then(() => {
            logger.info('[' + migrate_name + '] audio_stream Table created');
        });
};

exports.down = function (knex) {
    logger.info('[' + migrate_name + '] Migrating Down...');
    return knex.schema.dropTable('audio_stream');
};
