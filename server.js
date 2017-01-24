'use strict';

const config = require('./config/config');
const logger = require('./utils/logger');
const utils = require('./utils/utils');
const express = require('express');
const mongoose = require('mongoose');
const userModel = require('./app/models/userModel');

const mongooseOpt = {
  server: { socketOptions: { keepAlive: 120 } },
  replset: { socketOptions: { keepAlive: 120 } },
};
mongoose.connect(config.mongoUrl, mongooseOpt);
mongoose.connection.on('connected', () => {
  logger.info(`Mongoose default connection open to ${config.mongoUrl}`);
  // make sure there is an admin user
  userModel.upsertAdmin(err => {
    logger.error(`Error creating admin user: ${utils.errorToString(err)}`);
  });
});
mongoose.connection.on('error', err => {
  logger.error(`Mongoose default connection error: ${utils.errorToString(err)}`);
});
mongoose.connection.on('disconnected', () => {
  logger.info('Mongoose default connection disconnected');
});
// if the node process ends through unconditional termination, close connection
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    logger.info('Mongoose default connection disconnected through app termination');
    // make the unconditional termination a normal exit
    process.exit(0);
  });
});

const app = express();
require('./express')(app);

logger.info('initialized', { config });

app.listen(config.port, () => {
  logger.info('listening on port %d', config.port);
});

exports.app = app;
