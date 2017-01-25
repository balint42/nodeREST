'use strict';

const VError = require('verror');
const moment = require('moment');
const _ = require('lodash');

function sanitize(req) {
  if (req.body.amount) {
    req.body.amount = Math.round(parseFloat(req.body.amount) * 100) / 100;
  }
  if (req.body.description) {
    req.body.description = _.trim(req.body.description);
  }
  if (req.body.comment) {
    req.body.comment = _.trim(req.body.comment);
  }
  if (req.body.date) {
    req.body.date = _.trim(req.body.date);
  }
  if (req.body.time) {
    req.body.time = _.trim(req.body.time);
  }
  return req;
}

// REQUIRED attribute
function checkAmount(req) {
  if (_.has(req.body, 'amount')) {
    if (req.body.amount < 0 || _.isNaN(req.body.amount)) {
      return new VError(new VError('amount hast to be a number >= 0'), '400');
    }
  }
  return null;
}
// REQUIRED attribute
function checkDescription(req) {
  if (_.has(req.body, 'description')) {
    if (_.isEmpty(req.body.description)) {
      return new VError(new VError('description is required'), '400');
    }
  }
  return null;
}
const dateRegex = /[0-9]{4}-[0-1][0-9]-[0-3][0-9]/i;
function checkDate(req) {
  if (req.body.date) {
    const isValid = dateRegex.exec(req.body.date);
    if (! isValid || ! moment(req.body.date).isValid()) {
      return new VError(new VError('invalid date'), '400');
    }
  }
  return null;
}
const timeRegex = /[0-2][0-9]:[0-5][0-9]:[0-5][0-9]/i;
function checkTime(req) {
  if (req.body.time) {
    const isValid = timeRegex.exec(req.body.time);
    if (! isValid || ! moment(`2017-01-01T${req.body.time}`).isValid()) {
      return new VError(new VError('invalid time'), '400');
    }
  }
  return null;
}

function check(req) {
  const saneReq = sanitize({
    body: _.cloneDeep(req.body),
  });
  return checkAmount(saneReq) ||
    checkDescription(saneReq) ||
    checkDate(saneReq) ||
    checkTime(saneReq) ||
    null;
}

module.exports = {
  check,
  sanitize,
};
