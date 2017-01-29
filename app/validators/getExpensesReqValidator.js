'use strict';

const VError = require('verror');
const moment = require('moment');
const _ = require('lodash');

function sanitize(req) {
  if (req.query.minAmount) {
    req.query.minAmount = Math.round(parseFloat(req.query.minAmount) * 100) / 100;
  }
  if (req.query.maxAmount) {
    req.query.maxAmount = Math.round(parseFloat(req.query.maxAmount) * 100) / 100;
  }
  if (req.query.text) {
    req.query.text = _.trim(req.query.text);
  }
  if (req.query.minDate) {
    req.query.minDate = _.trim(req.query.minDate);
  }
  if (req.query.minTime) {
    req.query.minTime = _.trim(req.query.minTime);
  }
  if (req.query.maxTime) {
    req.query.maxTime = _.trim(req.query.maxTime);
  }
  return req;
}

function checkAmount(req) {
  if (req.query.minAmount) {
    if (req.query.minAmount < 0 || _.isNaN(req.query.minAmount)) {
      return new VError(new VError('minAmount hast to be a number >= 0'), '400');
    }
  }
  if (req.query.maxAmount) {
    if (req.query.maxAmount < 0 || _.isNaN(req.query.maxAmount)) {
      return new VError(new VError('maxAmount hast to be a number >= 0'), '400');
    }
  }
  return null;
}
const minDateRegex = /[0-9]{4}-[0-1][0-9]-[0-3][0-9]/i;
function checkDate(req) {
  if (req.query.minDate) {
    const isValid = minDateRegex.exec(req.query.minDate);
    if (! isValid || ! moment(req.query.minDate).isValid()) {
      return new VError(new VError('invalid minDate'), '400');
    }
  }
  if (req.query.maxDate) {
    const isValid = minDateRegex.exec(req.query.maxDate);
    if (! isValid || ! moment(req.query.maxDate).isValid()) {
      return new VError(new VError('invalid maxDate'), '400');
    }
  }
  return null;
}
const timeRegex = /[0-2][0-9]:[0-5][0-9]:[0-5][0-9]/i;
function checkTime(req) {
  if (req.query.minTime) {
    const isValid = timeRegex.exec(req.query.minTime);
    if (! isValid || ! moment(`2017-01-01T${req.query.minTime}`).isValid()) {
      return new VError(new VError('invalid minTime'), '400');
    }
  }
  if (req.query.maxTime) {
    const isValid = timeRegex.exec(req.query.maxTime);
    if (! isValid || ! moment(`2017-01-01T${req.query.maxTime}`).isValid()) {
      return new VError(new VError('invalid maxTime'), '400');
    }
  }
  return null;
}

function check(req) {
  const saneReq = sanitize({
    query: _.cloneDeep(req.query),
  });
  return checkAmount(saneReq) ||
    checkDate(saneReq) ||
    checkTime(saneReq) ||
    null;
}

module.exports = {
  check,
  sanitize,
};
