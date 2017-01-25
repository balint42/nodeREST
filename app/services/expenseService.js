'use strict';

const logger = require('../../utils/logger');
const utils = require('../utils/utils');
const expenseModel = require('../models/expenseModel');
const userModel = require('../models/userModel');
const config = require('../../config/config');
const VError = require('verror');
const Promise = require('bluebird');
const _ = require('lodash');

// try to extend all expenses with owners
function extendWithUsers(expenses) {
  const ownerIds = _.uniq(_.map(expenses, 'userId'));
  const owners = {};
  const promises = [];
  _.forEach(ownerIds, ownerId => {
    promises.push(
      userModel.findById(ownerId).then(user => {
        if (user) {
          owners[user.id] = user;
        }
      }).catch(err =>
        logger.error(`Error getting owner: ${utils.errorToString(err)}`)
      )
    );
  });
  const extendWithUser = exp => _.extend(exp, { user: owners[exp.userId] || null });
  return Promise.all(promises)
    .then(() => _.map(expenses, extendWithUser));
}

function findBy(query, user) {
  if (! user) return Promise.reject(new VError('user required'));
  const params = {};
  const findOnlyOwn = user.role !== config.roles.admin;
  if (findOnlyOwn) {
    params.userId = user.id;
  }
  if (query.minDate) {
    params.minDate = query.minDate;
  }
  if (query.maxDate) {
    params.minDate = query.minDate;
  }
  if (query.minAmount) {
    params.minAmount = query.minAmount;
  }
  if (query.maxAmount) {
    params.maxAmount = query.maxAmount;
  }
  const extendWithUser = _.partialRight(_.map,
    _.partialRight(_.extend, { user })
  );
  return expenseModel.findBy(params)
    .then(findOnlyOwn ? extendWithUser : extendWithUsers);
}

function createExpense(params, user) {
  if (! user) return Promise.reject(new VError('user required'));
  params.userId = user.id;
  const extendWithUser = _.partialRight(_.extend, { user });
  return expenseModel.create(params)
    .then(extendWithUser);
}

function findById(id) {
  return expenseModel.findById(id)
    .tap(expense => {
      if (! expense) {
        throw new VError('404');
      }
    });
}

function updateById(id, updObj) {
  return expenseModel.updateById(id, updObj)
    .then(n => {
      if (n === 0) {
        throw new VError('404');
      }
    });
}

function deleteById(id) {
  return expenseModel.deleteById(id)
    .then(n => {
      if (n === 0) {
        throw new VError('404');
      }
    });
}

module.exports = {
  extendWithUsers,
  findBy,
  createExpense,
  findById,
  updateById,
  deleteById,
};
