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
      expiresIn: '30d',
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
      expiresIn: '1h',
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

function isClientError(err) {
  if (! isError(err)) return false;
  const is400 = str => (!! /^4[0-9][0-9]/.exec(str));
  let hasCause400 = is400(err.message);
  let subErr = err;
  while (! hasCause400 && _.hasIn(subErr, 'cause')) {
    subErr = subErr.cause();
    hasCause400 = is400(_.get(subErr, 'message'));
  }
  return hasCause400;
}

module.exports = {
  isError,
  errorToString,
  isClientError,
  getRefreshToken,
  getAccessToken,
};
