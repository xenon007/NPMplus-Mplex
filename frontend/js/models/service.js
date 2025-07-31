const Backbone = require('backbone');

// Модель сервиса с путём к файлу конфигурации
const Service = Backbone.Model.extend({});

Service.Collection = Backbone.Collection.extend({
        model: Service
});

module.exports = Service;
