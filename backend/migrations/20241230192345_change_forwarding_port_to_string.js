const migrate_name = 'change_forwarding_port_to_string';
const logger = require('../logger').migrate;

/**
 * Migrate
 *
 * @see http://knexjs.org/#Schema
 *
 * @param   {Object} knex
 * @param   {Promise} Promise
 * @returns {Promise}
 */
exports.up = function (knex /*, Promise */) {
	logger.info('[' + migrate_name + '] Migrating Up...');

	return knex.schema
		.alterTable('stream', (table) => {
			table.string('forwarding_port', 12).notNull().alter();
		})
		.then(function () {
			logger.info('[' + migrate_name + '] stream Table altered');
		});
};

/**
 * Undo Migrate
 *
 * @param   {Object} knex
 * @param   {Promise} Promise
 * @returns {Promise}
 */
exports.down = function (knex /*, Promise */) {
	logger.info('[' + migrate_name + '] Migrating Down...');

	return knex.schema
		.alterTable('stream', (table) => {
			table.integer('forwarding_port').notNull().unsigned().alter();
		})
		.then(function () {
			logger.info('[' + migrate_name + '] stream Table altered');
		});
};
