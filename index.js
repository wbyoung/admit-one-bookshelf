'use strict';

module.exports = function(options) {
  var User = options.bookshelf.modelClass;
  var relation = new User().tokens();
  var relatedData = relation.relatedData;
  var Token = relatedData.target;

  var create = function(attributes) {
    return User.forge(attributes).save();
  };

  var find = function(query) {
    return User.where(query).fetch();
  };

  var findByToken = function(token) {
    return Token.where({ value: token }).fetch({ withRelated: 'user' }).then(function(token) {
      return token && token.related('user');
    });
  };

  var addToken = function(user, digest) {
    return Token.forge({ user_id: user.get('id'), value: digest }).save();
  };

  var removeToken = function(user, digest) {
    return Token.where({ user_id: user.get('id'), value: digest }).fetch().then(function(token) {
      return token && token.destroy();
    });
  };

  var adapter = {};

  adapter.users = {
    create: create,
    find: find,
    findByToken: findByToken,
    addToken: addToken,
    removeToken: removeToken
  };

  adapter.attrs = {
    all: function(user) { return user.toJSON(); }
  };

  return adapter;
};
