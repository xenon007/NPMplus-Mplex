const Mn        = require('backbone.marionette');
const App       = require('../main');
const Service   = require('../../models/service');
const EditView  = require('./edit');
const template  = require('./main.ejs');

module.exports = Mn.View.extend({
    id:       'services',
    template: template,

    ui: {
        list:   '.services-list',
        dimmer: '.dimmer'
    },

    events: {
        'click .service-item': 'editService'
    },

    onRender: function () {
        const view = this;
        App.Api.Services.getAll()
            .then(response => {
                const collection = new Service.Collection(response);
                collection.each(model => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    li.innerHTML = `<a href="#" class="service-item" data-id="${model.get('id')}" data-name="${model.get('name')}">${model.get('name')}</a>`;
                    view.ui.list.append(li);
                });
            })
            .catch(err => {
                console.error(err);
            })
            .then(() => {
                view.ui.dimmer.removeClass('active');
            });
    },

    editService: function (e) {
        e.preventDefault();
        const id = e.currentTarget.getAttribute('data-id');
        const name = e.currentTarget.getAttribute('data-name');
        App.Api.Services.getConfig(id)
            .then(resp => {
                App.UI.showModalDialog(new EditView({model: new Service({id, name, content: resp.content})}));
            })
            .catch(err => console.error(err));
    }
});
