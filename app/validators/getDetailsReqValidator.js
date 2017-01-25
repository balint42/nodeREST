'use strict';

const ObjectId = require('mongoose').Types.ObjectId;
const VError = require('verror');
const _ = require('lodash');

function sanitize(req) {
  if (req.params.id) {
    req.params.id = _.trim(_.toString(req.params.id));
  }
  return req;
}

// REQUIRED attribute
function checkId(req) {
  if (_.isEmpty(req.params.id)) {
    return new VError(new VError('id required'), '400');
  }
  if (! ObjectId.isValid(req.params.id)) {
    return new VError(new VError('invalid id'), '400');
  }
  return null;
}

function check(req) {
  const saneReq = sanitize({
    params: _.cloneDeep(req.params),
  });
  return checkId(saneReq) ||
    null;
}

module.exports = {
  check,
  sanitize,
};
