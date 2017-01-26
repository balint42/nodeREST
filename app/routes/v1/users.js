'use strict';

const getDetailsUserReqValidator = require('../../validators/getDetailsReqValidator');
const postUserReqValidator = require('../../validators/postUserReqValidator');
const deleteUserReqValidator = require('../../validators/deleteReqValidator');
const userService = require('../../services/userService');
const passport = require('../../utils/passport');
const utils = require('../../utils/utils');
const logger = require('../../../utils/logger');
const config = require('../../../config/config');
const express = require('express');
const router = express.Router();

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
  // set required minimum role
  if (req.params.userId == req.user.id) { // eslint-disable-line
    req.minRole = config.roles.user;
  } else {
    req.minRole = config.roles.manager;
  }
  next();
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
router.route('/users/:userId').patch(
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
