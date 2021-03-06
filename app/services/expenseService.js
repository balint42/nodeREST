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
  const ownerIds = _.uniq(_.map(expenses, exp => exp.userId.toString()));
  const expensesGroupedByUser = _.map(ownerIds, ownerId => {
    return userModel.findById(ownerId)
      .then(user => {
        if (! user) throw new VError('owner of expense not found');
        const expensesWithUser = _.map(
          _.filter(expenses, exp => _.toString(exp.userId) === _.toString(user.id)),
          exp => _.extend(exp, { user })
        );
        return expensesWithUser;
      })
      .catch(err => {
        logger.info(`Error getting owner: ${utils.errorToString(err)}`);
        const expensesWithoutUser = _.map(
          _.filter(expenses, exp => _.toString(exp.userId) === _.toString(ownerId)),
          exp => _.extend(exp, { user: {} })
        );
        return expensesWithoutUser;
      });
  });
  return Promise.all(expensesGroupedByUser)
    .then(_.flatten);
}

function findBy(query, user) {
  if (! user) return Promise.reject(new VError('user required'));
  const params = _.pick(
    query,
    'minDate',
    'maxDate',
    'minTime',
    'maxTime',
    'minAmount',
    'maxAmount',
    'text'
  );
  const findOnlyOwn = user.role !== config.roles.admin;
  if (findOnlyOwn) {
    params.userId = user.id;
  }
  const extendWithUser = expenses => _.map(expenses,
    exp => _.extend(exp, { user })
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
