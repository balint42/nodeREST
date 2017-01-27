'use strict';

// the node environment, can be "test", "development", "production"
const env = process.env.NODE_ENV || 'development';
const path = require('path');
const rootPath = path.normalize(path.join(__dirname, '..'));
const _ = require('lodash');

// load env vars from ".env" files
require('dotenv').load({
  path: `config/${env}.env`,
  silent: true,
});

const commonConfig = {
  env,
  root: rootPath,
  port: process.env.PORT || 3000,
  logLevel: process.env.LOG_LEVEL || 'debug',
  mongoUrl: process.env.MONGO_URL,
  mongooseOpt: {
    server: {
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000,
      socketOptions: { keepAlive: 120 },
    },
    replset: {
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000,
      socketOptions: { keepAlive: 120 },
    },
  },
  roles: {
    user: 1,
    manager: 2,
    admin: 3,
  },
  adminId: '57543795c5e18d4310a7db1f',
  adminMail: process.env.ADMIN_MAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  accessTokenExpiresIn: '10s',
  refreshTokenExpiresIn: '30d',
  tokenIssuer: 'expensesApp',
  passwordLength: 8,
};

const config = {
  development: {},
  test: {},
  production: {},
};

module.exports = _.extend(commonConfig, config[env]);
