'use strict';

const utils = require('../../utils/utils');
const _ = require('lodash');

function requireAuth(req, res, next) {
  if (arguments.length === 0) return requireAuth;
  if (! req.user || ! req.isAuthenticated()) {
    // FAIL: not authenticated
    req.message = 'please log-in or sign-up';
    res.status(401).send();
  } else {
    // SUCCESS
    next();
  }
}

function requireRole(fixedMinRole) {
  return (req, res, next) => {
    const minRole = fixedMinRole || req.minRole;
    if (! _.has(req.user, 'role')) {
      res.status(403).send();
    } else if (req.user.role < 1) {
      // FAIL: role < 1
      req.message = 'you have been banned';
      res.status(403).send();
    } else if (req.user.role < parseInt(minRole)) {
      // FAIL: role < minRole
      req.message = 'you do not have sufficient rights';
      res.status(403).send();
    } else {
      // SUCCESS
      next();
    }
  };
}

module.exports = _.extend(
  utils,
  {
    requireAuth,
    requireRole,
  }
);
