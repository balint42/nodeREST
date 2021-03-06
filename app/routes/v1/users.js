'use strict';

const getDetailsUserReqValidator = require('../../validators/getDetailsReqValidator');
const patchUserReqValidator = require('../../validators/patchUserReqValidator');
const postUserReqValidator = require('../../validators/postUserReqValidator');
const deleteUserReqValidator = require('../../validators/deleteReqValidator');
const userService = require('../../services/userService');
const passport = require('../../utils/passport');
const utils = require('../../utils/utils');
const logger = require('../../../utils/logger');
const config = require('../../../config/config');
const express = require('express');
const router = express.Router();
const _ = require('lodash');

function createCheck(validator) {
  return (req, res, next) => {
    const error = validator.check(req);
    if (! error) {
      validator.sanitize(req);
      next();
    } else {
      next(error);
    }
  };
}

const setMinimumRole = (req, res, next) => {
  // in case of no current user require admin - requireRole will reject
  if (! req.user.id) {
    req.minRole = config.roles.admin;
    return next();
  }
  // in case of no user to be modified (list view) require manager
  if (! req.params.userId) {
    req.minRole = config.roles.manager;
    return next();
  }
  // in cases of specific user to be modified
  const isOwn = _.toString(req.params.userId) === _.toString(req.user.id);
  if (isOwn) {
    // user has to have min the role he tries to update to
    req.minRole = _.max([req.body.role, config.roles.user]);
    return next();
  }
  // find user trying to modify
  userService.findById(req.params.userId)
    .then(user => {
      req.minRole = _.max([
        config.roles.manager, // min manager role
        req.body.role,        // min role trying to patch to
        user.role,            // min role trying to modify
      ]);
      next();
    })
    .catch(next);
};
const passportOpt = { failureFlash: false, session: false };

// create new user
router.route('/users')
  .post(createCheck(postUserReqValidator))
  .post(
    passport.authenticate('local-signup', passportOpt),
    (req, res) => {
      res.status(200).json(req.user);
    }
  );

// get users
router.route('/users')
  .get(
    passport.authenticate('jwt-access', passportOpt),
    setMinimumRole,
    utils.requireRole(),
    (req, res) => {
      userService.findAll()
        .then(users => {
          res.json(users);
        })
        .catch(err => {
          if (utils.isClientError(err)) {
            return res.status(404).send();
          }
          logger.error(`Error getting users: ${utils.errorToString(err)}`);
          res.status(500).send();
        });
    }
  );

// get user
router.route('/users/:userId')
  .get(createCheck(getDetailsUserReqValidator))
  .get(
    passport.authenticate('jwt-access', passportOpt),
    setMinimumRole,
    utils.requireRole(),
    (req, res) => {
      userService.findById(req.params.userId)
        .then(user => {
          res.json(user);
        })
        .catch(err => {
          if (utils.isClientError(err)) {
            return res.status(404).send();
          }
          logger.error(`Error getting user: ${utils.errorToString(err)}`);
          res.status(500).send();
        });
    }
  );

// update user
router.route('/users/:userId')
  .patch(createCheck(patchUserReqValidator))
  .patch(
    passport.authenticate('jwt-access', passportOpt),
    setMinimumRole,
    utils.requireRole(),
    (req, res) => {
      // no setting users to higher level than own level
      if (config.env !== 'test') {
        if (req.body.role > req.user.role) {
          delete req.body.role;
        }
      }
      userService.updateById(req.params.userId, req.body)
        .then(() => {
          res.status(204).send();
        })
        .catch(err => {
          if (utils.isClientError(err)) {
            return res.status(404).send();
          }
          logger.error(`Error updating user: ${utils.errorToString(err)}`);
          res.status(500).send();
        });
    }
  );

// delete user
router.route('/users/:userId')
  .delete(createCheck(deleteUserReqValidator))
  .delete(
    passport.authenticate('jwt-access', passportOpt),
    setMinimumRole,
    utils.requireRole(),
    (req, res) => {
      userService.deleteById(req.params.userId)
        .then(() => {
          res.status(204).send();
        })
        .catch(err => {
          if (utils.isClientError(err)) {
            return res.status(404).send();
          }
          logger.error(`Error deleting user: ${utils.errorToString(err)}`);
          res.status(500).send();
        });
    }
  );

module.exports.router = router;
