'use strict';

const config = require('../../config/config');
const VError = require('verror');
const _ = require('lodash');

function sanitize(req) {
  if (req.body.email) {
    req.body.email = _.trim(req.body.email);
  }
  if (req.body.password) {
    req.body.password = _.trim(req.body.password);
  }
  return req;
}

// REQUIRED attribute
function checkEmail(req) {
  // minimum version from http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
  const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i; // eslint-disable-line
  if (_.isEmpty(req.body.email)) {
    return new VError(new VError('email is required'), '400');
  } 
  if (! emailRegex.exec(req.body.email)) {
    return new VError(new VError('valid email is required'), '400');
  }
  return null;
}
// REQUIRED attribute
function checkPassword(req) {
  if (_.isEmpty(req.body.password)) {
    return new VError(new VError('password is required'), '400');
  }
  if (_.size(req.body.password) < config.passwordLength) {
    return new VError(new VError(`password has to have min ${config.passwordLength} chars`), '400');
  }
  return null;
}


function check(req) {
  const saneReq = sanitize({
    body: _.cloneDeep(req.body),
  });
  return checkEmail(saneReq) ||
    checkPassword(saneReq) ||
    null;
}

module.exports = {
  check,
  sanitize,
};
