'use strict';

const config = require('../../config/config');
const VError = require('verror');
const _ = require('lodash');

function sanitize(req) {
  return req;
}

// REQUIRED attribute
function checkToken(req) {
  if (_.isEmpty(req.token)) {
    return new VError(new VError('token is required'), '400');
  } 
  return null;
}

function check(req) {
  return checkToken(req) ||
    null;
}

module.exports = {
  check,
  sanitize,
};
