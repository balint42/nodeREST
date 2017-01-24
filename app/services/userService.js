'use strict';

const userModel = require('../models/userModel');
const config = require('../../config/config');
const Promise = require('bluebird');
const VError = require('verror');
const _ = require('lodash');

function createUser(email, password) {
  return userModel.findByEmail(email)
    .then(user => {
      if (user) {
        throw new VError(new VError('email is already taken'), '400');
      }
      if (_.size(password) < config.passwordLength) {
        throw new VError(new VError('invalid password'), '400');
      }
      return userModel.createUser({ email, password });
    });
}

function validateUser(email, password) {
  return userModel.validateUser(email, password)
    .tap(result => {
      if (! result) {
        throw new VError(new VError('wrong email or password'), '403');
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
