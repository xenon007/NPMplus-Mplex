const UserModel = require('../models/user');

let cache = {
    User:    new UserModel.Model(),
    locale:  navigator.languages[0].toLowerCase()
};

module.exports = cache;

