const Model = require('objection').Model;
const db = require('../db');
const helpers = require('../lib/helpers');
const now = require('./now_helper');

Model.knex(db);

const boolFields = ['is_deleted'];

class AudioStream extends Model {
    $beforeInsert() {
        this.created_on = now();
        this.modified_on = now();
    }

    $beforeUpdate() {
        this.modified_on = now();
    }

    $parseDatabaseJson(json) {
        json = super.$parseDatabaseJson(json);
        return helpers.convertIntFieldsToBool(json, boolFields);
    }

    $formatDatabaseJson(json) {
        json = helpers.convertBoolFieldsToInt(json, boolFields);
        return super.$formatDatabaseJson(json);
    }

    static get name() {
        return 'AudioStream';
    }

    static get tableName() {
        return 'audio_stream';
    }
}

module.exports = AudioStream;
