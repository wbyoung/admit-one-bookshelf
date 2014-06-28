# Admit One Bookshelf

[![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url] [![Code Climate][codeclimate-image]][codeclimate-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependencies][david-image]][david-url] [![devDependencies][david-dev-image]][david-dev-url]

[Bookshelf.js][bookshelf] extension for [Admit One][admit-one].

## Usage

```javascript
var User, Token;
User = bookshelf.Model.extend({
  tokens: function() {
    return this.hasMany(Token);
  },
  tableName: 'users'
});
Token = bookshelf.Model.extend({
  user: function() {
    return this.belongsTo(User);
  },
  tableName: 'tokens'
});

var admit = require('admit-one-bookshelf')({
  bookshelf: { modelClass: User }
});
```

Once you have created an instance, see the [main Admit One page][admit-one] for
details on how to set up your routes with Express.

## Migration

For quick reference, a basic migration to create a users table would look like
this:

```javascript
exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('username').notNullable();
    table.string('passwordDigest').notNullable();
  }).createTable('tokens', function(table) {
    table.increments('id').primary();
    table.integer('user_id').references('users.id');
    table.string('value').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('tokens').dropTable('users');
};
```

## API

### admit([options])

#### options.bookshelf.modelClass

Type: `Bookshelf.Model`  
Default: `undefined`


## License

This project is distributed under the MIT license.


[travis-url]: http://travis-ci.org/wbyoung/admit-one-mongo
[travis-image]: https://secure.travis-ci.org/wbyoung/admit-one-mongo.png?branch=master
[npm-url]: https://npmjs.org/package/admit-one-mongo
[npm-image]: https://badge.fury.io/js/admit-one-mongo.png
[codeclimate-image]: https://codeclimate.com/github/wbyoung/admit-one-mongo.png
[codeclimate-url]: https://codeclimate.com/github/wbyoung/admit-one-mongo
[coverage-image]: https://coveralls.io/repos/wbyoung/admit-one-mongo/badge.png
[coverage-url]: https://coveralls.io/r/wbyoung/admit-one-mongo
[david-image]: https://david-dm.org/wbyoung/admit-one-mongo.png?theme=shields.io
[david-url]: https://david-dm.org/wbyoung/admit-one-mongo
[david-dev-image]: https://david-dm.org/wbyoung/admit-one-mongo/dev-status.png?theme=shields.io
[david-dev-url]: https://david-dm.org/wbyoung/admit-one-mongo#info=devDependencies

[admit-one]: https://github.com/wbyoung/admit-one
[bookshelf]: http://bookshelfjs.org/
