const Mn    = require('backbone.marionette');
const App   = require('../main');
const template = require('./edit.ejs');

module.exports = Mn.View.extend({
    template:  template,
    className: 'modal-dialog',

    ui: {
        textarea: 'textarea',
        save: '.save',
        dimmer: '.dimmer'
    },

    events: {
        'click @ui.save': 'saveConfig'
    },

    saveConfig: function () {
        const content = this.ui.textarea.val();
        const view = this;
        this.ui.dimmer.addClass('active');
        App.Api.Services.saveConfig(this.model.get('id'), content)
            .then(() => {
                App.UI.closeModal();
            })
            .catch(err => {
                console.error(err);
                view.ui.dimmer.removeClass('active');
            });
    }
});
