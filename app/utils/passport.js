'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const config = require('../../config/config');
const userService = require('../../app/services/userService');
const _ = require('lodash');

// use jwt strategy which checks for signature & expiration,
// we also check for subject and audience in payload
const jwtRefreshOptions = {
  jwtFromRequest: req => req.token,
  secretOrKey: config.refreshTokenSecret,
  issuer: config.tokenIssuer,
  passReqToCallback: true,
};
passport.use('jwt-refresh', new JwtStrategy(
  jwtRefreshOptions,
  (req, payload, done) => {
    if (payload.sub === 'refresh' && payload.aud === 'v1/auth') {
      return done(null, payload.user);
    }
    req.message = 'invalid token subject or audience';
    done(null, false);
  })
);
const jwtAccessOptions = _.cloneDeep(jwtRefreshOptions);
jwtAccessOptions.secretOrKey = config.accessTokenSecret;
passport.use('jwt-access', new JwtStrategy(
  jwtAccessOptions,
  (req, payload, done) => {
    const audiences = _.split(payload.aud, ',');
    const validAudiences = ['v1/users', 'v1/expenses'];
    const hasValidAudiences = _.isEmpty(_.difference(audiences, validAudiences));
    if (payload.sub === 'access' && hasValidAudiences) {
      return done(null, payload.user);
    }
    req.message = 'invalid token subject or audience';
    done(null, false);
  })
);
// use local strategy, which is mostly equivalent to HTTP
// basic auth but uses POST fields instead of header fields
const localOptions = {
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
};
passport.use('local-signup', new LocalStrategy(
  localOptions,
  (req, email, password, done) => {
    userService.createUser(email, password)
      .then(user => {
        done(null, user);
      })
      .catch(err => {
        req.message = err.message;
        done(err);
      });
  }
));
passport.use('local-login', new LocalStrategy(
  localOptions,
  (req, email, password, done) => {
    // defer until current stack is done to allow sign up to take effect
    process.nextTick(() => {
      userService.validateUser(email, password)
        .then(user => {
          done(null, user);
        })
        .catch(err => {
          req.message = err.message;
          done(err);
        });
    });
  }
));

module.exports = passport;
