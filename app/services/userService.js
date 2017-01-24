'use strict';

const userModel = require('../models/userModel');
const Promise = require('bluebird');
const VError = require('verror');
const _ = require('lodash');

function createUser(email, password) {
  return userModel.findOne({ email })
    .then(user => {
      if (user) {
        throw new VError(new VError('email is already taken'), '400');
      }
      if (_.size(password) < 8) {
        throw new VError(new VError('invalid password'), '400');
      }
      return userModel.createUser({ email, password });
    });
}

function validateUser(email, password) {
  return userModel.findOne({ email })
    .tap(user => {
      if (! user) {
        throw new VError('403');
      }
      if (! user.validatePassword(password)) {
        throw new VError(new VError('wrong password'), '403');
      }
    });
}

function findById(id) {
  return userModel.findById(id)
    .then(user => {
      if (! user) {
        throw new VError('404');
      }
      // model should do this but lets be sure
      delete user.password;
      return user;
    });
}

function updateById(id, updObj) {
  return userModel.updateById(id, updObj)
    .then(n => {
      if (n === 0) {
        throw new VError('404');
      }
    });
}

function deleteById(id) {
  return userModel.deleteById(id)
    .then(n => {
      if (n === 0) {
        throw new VError('404');
      }
    });
}

module.exports = {
  createUser,
  validateUser,
  findById,
  updateById,
  deleteById,
};
