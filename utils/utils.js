'use strict';

const config = require('../config/config');
const jwt = require('jsonwebtoken');
const VError = require('verror');
const _ = require('lodash');

function getRefreshToken(user) {
  return jwt.sign(
    {
      // non standard payload
      user,
      // payload claims as per RFC7519 - "expiresIn" will be "exp" claim
      iss: config.tokenIssuer,
      sub: 'refresh',
      aud: 'v1/auth',
    },
    config.refreshTokenSecret,
    {
      expiresIn: config.refreshTokenExpiresIn,
    }
  );
}

function getAccessToken(user) {
  return jwt.sign(
    {
      // non standard payload
      user,
      // payload claims as per RFC7519 - "expiresIn" will be "exp" claim
      iss: config.tokenIssuer,
      sub: 'access',
      aud: 'v1/users,v1/expenses',
    },
    config.accessTokenSecret,
    {
      expiresIn: config.accessTokenExpiresIn,
    }
  );
}

function isError(obj) {
  return obj &&
    (
      Object.prototype.toString.call(obj) === '[object Error]' ||
      (obj.constructor === VError && VError.prototype.isPrototypeOf(obj))
    );
}

function errorToString(err) {
  return _.hasIn(err, 'toString') ? err.toString() : '';
}

function getClientError(err) {
  if (! isError(err)) return false;
  const get400 = str => _.first(/^4[0-9][0-9]/.exec(str));
  let cause400 = get400(err.message);
  let subErr = err;
  while (! cause400 && _.hasIn(subErr, 'cause')) {
    subErr = subErr.cause();
    cause400 = get400(_.get(subErr, 'message'));
  }
  return cause400;
}

function isClientError(err) {
  return !! getClientError(err);
}

module.exports = {
  isError,
  errorToString,
  isClientError,
  getClientError,
  getRefreshToken,
  getAccessToken,
};
