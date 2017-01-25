'use strict';

const getDetailsReqValidator = require('./getDetailsReqValidator.js');

module.exports = {
  check: getDetailsReqValidator.check,
  sanitize: getDetailsReqValidator.sanitize,
};
