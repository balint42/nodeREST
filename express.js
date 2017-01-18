'use strict';

const config = require('./config/config');
const glob = require('glob');
const logger = require('./utils/logger');
const expressLogger = require('./utils/expressLogger');
const uuid = require('node-uuid');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const passport = require('passport');

// id to tag each process
const PROCESS_ID_HEADER = 'X-Process-Id';

module.exports = function(app) {
  // views path & engine
  app.set('views', `${config.root}/app/views`);
  app.set('view engine', 'ejs');

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
  app.use(flash());
  app.use(passport.initialize());

  // request and response logger
  app.use(expressLogger);

  // make sure all requests accept json
  app.use((req, res, next) => {
    if (! req.accepts('json')) {
      const err = new Error('Not Acceptable');
      err.status = 406;
      next(err);
    } else {
      next();
    }
  });

  // init pure API routes
  const versionRoot = `${config.root}/app/routes/v1`;
  const routes = glob.sync(`${versionRoot}/*.js`);
  routes.forEach((route) => {
    app.use('/v1', require(route).router);
  });

  // route to health check
  app.use(require(`${config.root}/app/routes/health`).router);
  // routes to views
  app.use(require(`${config.root}/app/routes/views`).router);

  // 404 handler
  // since this is last middleware assume 404 if we got until here
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handler
  // MUST specifiy all arguments to replace default error handler
  app.use((err, req, res, next) => { // eslint-disable-line
    const status = err.status || 500;
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
        message: err.message,
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
