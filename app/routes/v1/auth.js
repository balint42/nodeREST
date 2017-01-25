'use strict';

const patchAuthReqValidator = require('../../validators/patchAuthReqValidator');
const postAuthReqValidator = require('../../validators/postAuthReqValidator');
const passport = require('../../utils/passport');
const utils = require('../../../utils/utils');
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

// update auth: give refresh token, get access-token
const passportOpt = { failureFlash: false, session: false };
router.route('/auth')
  .patch(createCheck(patchAuthReqValidator))
  .patch(
    passport.authenticate('jwt-refresh', passportOpt),
    (req, res) => {
      if (req.isAuthenticated()) {
        res.status(200).json({ accessToken: utils.getAccessToken(req.user) });
      }
    }
  );
// create auth: give credentials, get refresh- & access-token
router.route('/auth')
  .post(createCheck(postAuthReqValidator))
  .post(
    passport.authenticate('local-login', passportOpt),
    (req, res) => {
      if (req.isAuthenticated()) {
        res.status(200).json({
          refreshToken: utils.getRefreshToken(req.user),
          accessToken: utils.getAccessToken(req.user),
        });
      }
    }
  );

module.exports.router = router;
