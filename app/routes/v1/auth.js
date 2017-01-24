'use strict';

const passport = require('../../utils/passport');
const config = require('../../../config/config');
const utils = require('../../../utils/utils');
const express = require('express');
const router = express.Router();

// create & update auth tokens
const passportOpt = { failureFlash: false, session: false };
router.route('/auth').patch(
  passport.authenticate('jwt-refresh', passportOpt),
  (req, res) => {
    if (req.isAuthenticated()) {
      res.status(200).json({ accessToken: utils.getAccessToken(req.user) });
    }
  }
);
router.route('/auth').post(
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
