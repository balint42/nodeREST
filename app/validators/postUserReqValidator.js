'use strict';

const postAuthReqValidator = require('./postAuthReqValidator');

module.exports = {
  check: postAuthReqValidator.check,
  sanitize: postAuthReqValidator.sanitize,
};
