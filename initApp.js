'use strict';

const config = require('./config/config');
const glob = require('glob');
const VError = require('verror');
const logger = require('./utils/logger');
const utils = require('./utils/utils');
const express = require('express');
const expressLogger = require('./utils/expressLogger');
const uuid = require('node-uuid');
const bodyParser = require('body-parser');
const passport = require('passport');
const bearerToken = require('express-bearer-token');
const _ = require('lodash');

// id to tag each process
const PROCESS_ID_HEADER = 'X-Process-Id';

module.exports = function(app) {
  // get bearer token as defined in RFC6750 & if found set it as req.token
  app.use(bearerToken());

  // views path & engine
  app.set('views', `${config.root}/app/views`);
  app.set('view engine', 'ejs');
  app.use(express.static(`${config.root}/app/files`));

  // disable etags for caching
  app.disable('etag');

  // important if using an SSH proxy in production
  if (config.env === 'production') {
    app.set('trust proxy', 1); // trust first proxy
  }

  app.use(require('express-domain-middleware'));

  // add processId to req and domain and response
  app.use((req, res, next) => {
    const processId = req.get(PROCESS_ID_HEADER) || uuid.v4();

    req.processId = processId;
    process.domain.processId = processId;
    res.setHeader(PROCESS_ID_HEADER, processId);

    next();
  });

  // needed for authentication via passport
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(passport.initialize());

  // request and response logger
  app.use(expressLogger);

  // make sure all requests accept json
  app.use((req, res, next) => {
    if (! req.accepts('json')) {
      const err = new VError('Not Acceptable');
      err.status = 406;
      return next(err);
    }
    next();
  });

  // init pure API routes
  _.forEach(
    glob.sync(`${config.root}/app/routes/v1/*.js`),
    route => app.use('/v1', require(route).router)
  );

  // route to health check
  app.use(require(`${config.root}/app/routes/health`).router);
  // routes to views
  app.use(require(`${config.root}/app/routes/views`).router);

  // 404 handler
  // since this is last middleware assume 404 if we got until here
  app.use((req, res, next) => {
    const err = new VError('Not Found');
    err.status = 404;
    next(err);
  });

  // error handler
  // MUST specifiy all arguments to replace default error handler
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    const status = err.status || utils.getClientError(err) || 500;
    logger.error(err.message, {
      status,
      processId: req.processId,
      stack: err.stack,
      name: err.name,
    });
    if (config.env === 'development' || config.env === 'test') {
      res.status(status).json({
        status,
        name: err.name,
        message: err.message || req.message,
      });
    } else {
      // be sure not to leak sensitive info in production
      res.status(status).json({
        status,
        name: err.name,
      });
    }
  });
};
