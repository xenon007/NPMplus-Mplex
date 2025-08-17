const Mn  = require('backbone.marionette');
const App = require('../main');
const tpl = require('./edit.ejs');

require('jquery-serializejson');

const categories = ['news', 'music', 'talk', 'other'];

module.exports = Mn.View.extend({
    template:  tpl,
    className: 'modal-dialog',

    ui: {
        form:    'form',
        buttons: '.modal-footer button'
    },

    events: {
        'submit @ui.form': 'onSubmit'
    },

    templateContext: function () {
        return {
            categories: categories
        };
    },

    onSubmit: function (e) {
        e.preventDefault();
        const data = this.ui.form.serializeJSON();
        // если выбрана опция скрытия токена, не используем token_mask
        data.token_mask = data.hide_token ? '' : (this.model.get('token_mask') || '?token={token}');
        delete data.hide_token;

        const view = this;
        this.ui.buttons.prop('disabled', true).addClass('btn-disabled');

        fetch(`/api/audio-streams/${this.model.get('id')}`, {
            method:  'PUT',
            headers: {'Content-Type': 'application/json'},
            body:    JSON.stringify(data)
        })
            .then(res => res.json())
            .then(result => {
                view.trigger('saved', result);
                App.UI.closeModal();
            })
            .catch(err => {
                console.error('Failed to update stream', err);
                view.ui.buttons.prop('disabled', false).removeClass('btn-disabled');
            });
    }
});
