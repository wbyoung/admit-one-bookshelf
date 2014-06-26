'use strict';

var expect = require('chai').expect;
var admit = require('..');
var path = require('path');
var bluebird = require('bluebird'), Promise = bluebird;

describe('admit-one-bookshelf', function() {
  before(function(done) {
    var knex = require('knex')({
      client: 'sqlite3',
      connection: {
        filename: path.join(__dirname, '.test.sqlite3')
      }
    });
    var bookshelf = require('bookshelf')(knex);
    var Token, User;
    Token = this.tokenClass = bookshelf.Model.extend({
      user: function() {
        return this.belongsTo(User);
      },
      tableName: 'tokens'
    });
    User = this.userClass = bookshelf.Model.extend({
      tokens: function() {
        return this.hasMany(Token);
      },
      tableName: 'users'
    });

    this.admit = admit({
      bookshelf: { modelClass: User }
    });
    this.users = this.admit._options._users;
    this.attrs = this.admit._options._attrs;

    Promise.resolve()
    .then(function() { return knex.schema.dropTableIfExists('tokens') })
    .then(function() { return knex.schema.dropTableIfExists('users') })
    .then(function() {
      return knex.schema.createTable('users', function(table) {
        table.increments();
        table.string('username');
        table.string('passwordDigest');
      });
    })
    .then(function() {
      return knex.schema.createTable('tokens', function(table) {
        table.increments();
        table.integer('user_id').references('user.id')
        table.string('value');
      });
    })
    .done(function() { done(); }, done);
  });

  afterEach(function(done) {
    var User = this.userClass;
    var Token = this.tokenClass;
    Promise.resolve()
    .then(function() { return User.fetchAll(); })
    .then(function(users) { return users.invokeThen('destroy'); })
    .then(function() { return Token.fetchAll(); })
    .then(function(tokens) { return tokens.invokeThen('destroy'); })
    .done(function() { done(); }, done);
  });

  it('creates users', function(done) {
    var User = this.userClass;
    Promise.resolve()
    .then(function() {
      return this.users.create('someone', 'digest012');
    }.bind(this))
    .then(function() {
      return User.where({ username: 'someone' }).fetch();
    })
    .then(function(user) { expect(user.get('username')).to.eql('someone'); })
    .done(function() { done(); }, done);
  });

  it('finds users', function(done) {
    var User = this.userClass;
    Promise.resolve()
    .then(function() {
      return User.forge({ username: 'john', passwordDigest: 'digest' }).save();
    })
    .then(function() {
      return this.users.find('john');
    }.bind(this))
    .then(function(user) { expect(user.get('username')).to.eql('john'); })
    .done(function() { done(); }, done);
  });

  it('fails gracefully when failing to find users', function(done) {
    var User = this.userClass;
    Promise.resolve()
    .then(function() {
      return User.forge({ username: 'john', passwordDigest: 'digest' }).save();
    })
    .then(function() {
      return this.users.find('johnny');
    }.bind(this))
    .then(function(user) { expect(user).to.not.exist; })
    .done(function() { done(); }, done);
  });

  it('gets passwordDigest from users', function() {
    var User = this.userClass;
    var user = User.forge({ passwordDigest: '293sf9fasli' });
    expect(this.attrs.passwordDigest(user)).to.eql('293sf9fasli');
  });

  it('finds users by token', function(done) {
    var User = this.userClass;
    var Token = this.tokenClass;
    Promise.resolve()
    .then(function() {
      return User.forge({ username: 'mary', passwordDigest: 'digest432' }).save();
    })
    .then(function(user) {
      return Token.forge({ user_id: user.get('id'), value: 'token123' }).save();
    })
    .then(function() {
      return this.users.findByToken('token123');
    }.bind(this))
    .then(function(user) { expect(user.get('username')).to.eql('mary'); })
    .done(function() { done(); }, done);
  });

  it('fails gracefully when failing to find tokens', function(done) {
    var User = this.userClass;
    var Token = this.tokenClass;
    Promise.resolve()
    .then(function() {
      return User.forge({ username: 'mary', passwordDigest: 'digest432' }).save();
    })
    .then(function(user) {
      return Token.forge({ user_id: user.get('id'), value: 'token123' }).save();
    })
    .then(function() {
      return this.users.findByToken('tokenXYZ');
    }.bind(this))
    .then(function(token) { expect(token).to.not.exist; })
    .done(function() { done(); }, done);
  });

  it('adds tokens', function(done) {
    var User = this.userClass;
    var Token = this.tokenClass;
    Promise.resolve()
    .then(function() {
      return User.forge({ username: 'jerry', passwordDigest: 'digest938' }).save();
    })
    .then(function(user) {
      return this.users.addToken(user, 'token492');
    }.bind(this))
    .then(function(result) { expect(result).to.exist; })
    .then(function(user) {
      return Token.where({ value: 'token492' }).fetch({ withRelated: 'user' });
    })
    .then(function(token) {
      expect(token.get('value')).to.eql('token492');
      expect(token.related('user').get('username')).to.eql('jerry');
    })
    .done(function() { done(); }, done);
  });

  it('removes tokens', function(done) {
    var User = this.userClass;
    var Token = this.tokenClass;
    var user;
    Promise.resolve()
    .then(function() {
      return User.forge({ username: 'mary', passwordDigest: 'digest432' }).save();
    })
    .then(function(_user) {
      user = _user;
      return Token.forge({ user_id: user.get('id'), value: 'token123' }).save();
    })
    .then(function() {
      return this.users.removeToken(user, 'token123');
    }.bind(this))
    .then(function(result) { expect(result).to.exist; })
    .then(function() { return Token.where({ value: 'token123' }).fetch(); })
    .then(function(token) { expect(token).to.not.exist; })
    .done(function() { done(); }, done);
  });

  it('fails gracefully when failing to remove tokens', function(done) {
    var User = this.userClass;
    var Token = this.tokenClass;
    var user;
    Promise.resolve()
    .then(function() {
      return User.forge({ username: 'mary', passwordDigest: 'digest432' }).save();
    })
    .then(function(_user) {
      user = _user;
      return Token.forge({ user_id: user.get('id'), value: 'token123' }).save();
    })
    .then(function() {
      return this.users.removeToken(user, 'tokenXYZ');
    }.bind(this))
    .done(function() { done(); }, done);
  });
});
