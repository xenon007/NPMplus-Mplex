const $          = require('jquery');
const Mn         = require('backbone.marionette');
const Controller = require('../../controller');
const Cache      = require('../../cache');
const template   = require('./main.ejs');

module.exports = Mn.View.extend({
    id:        'menu',
    className: 'header collapse d-lg-flex p-0',
    template:  template,

    ui: {
        links: 'a'
    },

    events: {
        // Обрабатываем клики по пунктам меню
        'click @ui.links': function (e) {
            const $target = $(e.currentTarget);
            const href = $target.attr('href');
            const external = $target.data('external');
            // Ссылки с data-external открываем обычным способом
            if (href !== '#' && !external) {
                e.preventDefault();
                Controller.navigate(href, true);
            } else if (external) {
                console.debug('Opening external link', href);
            }
        }
    },

    templateContext: {
        isAdmin: function () {
            return Cache.User.isAdmin();
        },

        canShow: function (perm) {
            return Cache.User.isAdmin() || Cache.User.canView(perm);
        }
    },

    initialize: function () {
        this.listenTo(Cache.User, 'change', this.render);
    }
});
