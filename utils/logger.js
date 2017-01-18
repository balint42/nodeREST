'use strict';

const config = require('../config/config');
const winston = require('winston');

const logger = new (winston.Logger)({
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
});

module.exports = logger;
