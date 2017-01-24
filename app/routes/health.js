'use strict';

const express = require('express');
const router = express.Router();

router.route('/health').get((req, res) => {
  // add checks for e.g. db
  res.status(200).json({
    status: 'OK',
  });
});

module.exports.router = router;
