'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const ObjectId = require('mongoose').Types.ObjectId;
const config = require('../../config/config');
const Promise = require('bluebird');
const VError = require('verror');
const _ = require('lodash');

const user = mongoose.Schema({
  email: { type: String, index: true, unique: true },
  password: String,
  role: Number,
});

function toObject(res) {
  if (! res) return res;
  const obj = _.hasIn(res, 'toObject') ? res.toObject() : _.cloneDeep(res);
  if (! obj) return obj;
  obj.id = obj._id; // eslint-disable-line
  delete obj.password;
  delete obj.__v; // eslint-disable-line
  delete obj._id; // eslint-disable-line
  return obj;
}

function toObjects(res) {
  return _.map(res, toObject);
}

user.methods.hashPassword = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
user.methods.validatePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};
user.statics.validateUser = function(email, password) {
  return Promise.fromCallback(cb =>
    this.findOne({ email }, cb)
  )
  .then(userObj => {
    if (userObj) {
      return userObj.validatePassword(password) ? userObj : null;
    }
    return null;
  })
  .then(toObject)
  .catch(() => null);
};
user.statics.findByIdAndMinimumRole = function(id, role) {
  return Promise.fromCallback(cb =>
    this.findOne({ _id: new ObjectId(id), role: { $gte: parseInt(role) } }, cb)
  )
  .then(toObject);
};
user.statics.deleteById = function(id) {
  return Promise.fromCallback(cb =>
    this.remove({ _id: new ObjectId(id) }, cb)
  )
  .then(res => _.get(res, 'result.n'));
};
user.statics.findByEmail = function(email) {
  return Promise.fromCallback(cb =>
    this.findOne({ email }, cb)
  )
  .then(toObject);
};
user.statics.findById = function(id) {
  return Promise.fromCallback(cb =>
    this.findOne({ _id: new ObjectId(id) }, cb)
  )
  .then(toObject);
};
user.statics.findAll = function() {
  return Promise.fromCallback(cb =>
    this.find({}, cb)
  )
  .then(toObjects);
};
user.statics.updateById = function(id, keyValues) {
  return Promise.fromCallback(cb => {
    if (_.has(keyValues._id)) delete keyValues._id;
    this.where({ _id: id }).update(keyValues, cb);
  })
  .then(res => _.get(res, 'n'));
};
user.statics.createUser = function(keyValues) {
  return Promise.fromCallback(cb => {
    let valid = true;
    const newUser = new this();
    // set given values
    if (keyValues.email) newUser.email = keyValues.email;
    else valid = false;
    if (keyValues.password) newUser.password = newUser.hashPassword(keyValues.password);
    else valid = false;
    if (keyValues.role) newUser.role = keyValues.role;
    else newUser.role = config.roles.user;
    if (keyValues.id) newUser._id = new ObjectId(keyValues.id); // eslint-disable-line
    // only save if valid values given
    if (valid) {
      newUser.save(cb);
    } else {
      throw new VError('Invalid input parameters');
    }
  })
  .then(toObject);
};
user.statics.upsertAdmin = function() {
  const self = this;
  const co = Promise.coroutine(function* () {
    const userObj = yield self.findOne({ email: config.adminMail });
    if (userObj) {
      return self.updateById(userObj._id, {
        role: config.roles.admin,
        email: config.adminMail,
        password: userObj.hashPassword(config.adminPassword),
      });
    }
    return self.createUser({
      id: config.adminId,
      role: config.roles.admin,
      email: config.adminMail,
      password: config.adminPassword,
    });
  });
  return co()
    .tap(newUser => {
      if (! newUser) throw new VError('failed to create admin user');
    });
};


module.exports = mongoose.model('User', user);
