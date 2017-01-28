'use strict';

const config = require('../../config/config');
const VError = require('verror');
const _ = require('lodash');

function sanitize(req) {
  if (req.body.email) {
    req.body.email = _.trim(req.body.email);
  }
  if (req.body.role) {
    req.body.role = parseInt(req.body.role);
  }
  if (req.body.password) {
    delete req.body.password;
  }
  return req;
}

function checkEmail(req) {
  if (req.body.email) {
    // minimum version from http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
    const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i; // eslint-disable-line
    if (! emailRegex.exec(req.body.email)) {
      return new VError(new VError('invalid email'), '400');
    }
  }
  return null;
}
function checkRole(req) {
  if (_.has(req.body, 'role')) {
    const validRoles = [config.roles.user, config.roles.manager, config.roles.admin];
    if (validRoles.indexOf(req.body.role) < 0) {
      return new VError(new VError(`role has to be one of ${validRoles}`), '400');
    }
  }
  return null;
}
function checkNotEmpty(req) {
  if (! req.body.email && ! _.has(req.body, 'role')) {
    return new VError(new VError('patch request is empty'), '400');
  }
}


function check(req) {
  const saneReq = sanitize({
    body: _.cloneDeep(req.body),
  });
  return checkEmail(saneReq) ||
    checkRole(saneReq) ||
    checkNotEmpty(saneReq) ||
    null;
}

module.exports = {
  check,
  sanitize,
};
