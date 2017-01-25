'use strict';

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const ObjectId = require('mongoose').Types.ObjectId;
const moment = require('moment');
const Promise = require('bluebird');
const VError = require('verror');
const _ = require('lodash');

const expense = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  amount: { type: Number, index: true },
  datetime: { type: Date, default: Date.now, index: true },
  description: { type: String, index: 'text' },
  comment: { type: String, default: null, index: 'text' },
});

function toObject(res) {
  if (! res) return res;
  const obj = _.hasIn(res, 'toObject') ? res.toObject() : _.cloneDeep(res);
  if (! obj) return obj;
  obj.id = obj._id; // eslint-disable-line
  delete obj.__v; // eslint-disable-line
  delete obj._id; // eslint-disable-line
  return obj;
}

function toObjects(res) {
  return _.map(res, toObject);
}

function _replaceDateAndTimeWithDatetime(params) {
  if (! params) return params;
  const date = moment.utc(params.date).format('YYYY-MM-DD');
  const time = moment.utc(params.time, 'HH:mm:ss').format('HH:mm:ss');
  delete params.date;
  delete params.time;
  params.datetime = new Date(`${date}T${time}Z`);
  return params;
}

function _replaceDatetimeWithDateAndTime(params) {
  if (! params) return params;
  const m = moment.utc(params.datetime);
  params.date = m.format('YYYY-MM-DD');
  params.time = m.format('HH:mm:ss');
  delete params.datetime;
  return params;
}

/**
 * Find expenses by different optional params.
 *
 * @param {Object} params - parameters object
 * @param {string} [params.userId] - userId of owner
 * @param {number} [params.minAmount] - number with min amount
 * @param {number} [params.maxAmount] - number with max amount
 * @param {Object} [params.minDate] - momentjs object with min date
 * @param {Object} [params.maxDate] - momentjs object with max date
 * @param {string} [params.description] - string that must be found in description
 * @param {string} [params.comment] - string that must be found in comment
 */
expense.statics.findBy = function(params) {
  return Promise.fromCallback(cb => {
    const stage1 = { $match: {} };
    const stage2 = {
      $project: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$datetime' } },
        time: { $dateToString: { format: '%H-%M-%S', date: '$datetime' } },
        amount: 1,
        datetime: 1,
        description: 1,
        comment: 1,
        userId: 1,
      },
    };
    if (params.userId) {
      stage1.$match.userId = new ObjectId(params.userId);
    }
    if (params.minDate || params.maxDate) {
      stage1.$match.datetime = {};
    }
    if (params.minDate) {
      const dateStr = moment.utc(params.minDate).toISOString();
      stage1.$match.datetime.$gte = new Date(dateStr);
    }
    if (params.maxDate) {
      const dateStr = moment.utc(params.maxDate).toISOString();
      stage1.$match.datetime.$lte = new Date(dateStr);
    }
    if (params.minAmount || params.maxAmount) {
      stage1.$match.amount = {};
    }
    if (params.minAmount) {
      stage1.$match.amount.$gte = params.minAmount;
    }
    if (params.maxAmount) {
      stage1.$match.amount.$lte = params.maxAmount;
    }
    if (params.description) {
      stage1.$match.description = {
        $text: {
          $search: params.description,
          $language: 'english',
        },
      };
    }
    if (params.comment) {
      stage1.$match.comment = {
        $text: {
          $search: params.comment,
          $language: 'english',
        },
      };
    }
    this.aggregate([stage1, stage2], cb);
  })
  .then(toObjects);
};
expense.statics.deleteById = function(id) {
  return Promise.fromCallback(cb =>
    this.remove({ _id: new ObjectId(id) }, cb)
  )
  .then(res => _.get(res, 'result.n'));
};
expense.statics.findById = function(id) {
  return Promise.fromCallback(cb =>
    this.findOne({ _id: new ObjectId(id) }, cb)
  )
  .then(toObject)
  .then(_replaceDatetimeWithDateAndTime);
};
expense.statics.updateById = function(id, keyValues) {
  return Promise.fromCallback(cb => {
    if (_.has(keyValues._id)) delete keyValues._id;
    this.where({ _id: id }).update(keyValues, cb);
  })
  .then(res => _.get(res, 'n'));
};
expense.statics.create = function(keyValues) {
  return Promise.fromCallback(cb => {
    let valid = true;
    const newExpense = new this();
    // set given values
    if (keyValues.date) {
      newExpense.date = keyValues.date;
    }
    if (keyValues.time) {
      newExpense.time = keyValues.time;
    }
    if (keyValues.userId) newExpense.userId = keyValues.userId;
    else valid = false;
    if (keyValues.amount) newExpense.amount = keyValues.amount;
    else valid = false;
    if (keyValues.description) newExpense.description = keyValues.description;
    else valid = false;
    if (keyValues.comment) newExpense.comment = keyValues.comment;
    if (keyValues.id) newExpense._id = new ObjectId(keyValues.id); // eslint-disable-line
    // only save if valid values given
    if (valid) {
      _replaceDateAndTimeWithDatetime(newExpense);
      newExpense.save(cb);
    } else {
      throw new VError('Invalid input parameters');
    }
  })
  .then(toObject)
  .then(_replaceDatetimeWithDateAndTime);
};

module.exports = mongoose.model('Expense', expense);
