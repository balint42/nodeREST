'use strict';

const config = require('../config/config');
const winston = require('winston');
const expressWinston = require('express-winston');

const logger = expressWinston.logger({
  transports: [
    new (winston.transports.Console)({
      level: config.logLevel,
    }),
    new (winston.transports.File)({
      filename: `${config.root}/log/all.log`,
      name: 'file.all',
      level: config.logLevel,
    }),
    new (winston.transports.File)({
      filename: `${config.root}/log/error.log`,
      name: 'file.error',
      level: 'error',
    }),
  ],
  meta: true, // whether to log meta data about request
  msg: 'HTTP {{req.method}} {{req.url}} {{req.processId}}', // default logging format
});

module.exports = logger;
