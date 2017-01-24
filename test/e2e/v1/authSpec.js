'use strict';

const supertest = require('supertest');
const server = require('../../../server');
const expect = require('chai').expect;
const config = require('../../../config/config');
const utils = require('../../../utils/utils');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const app = server.app;

describe('/v1/auth', function() {
  this.timeout(5000);
  describe('valid requests', () => {
    const refreshToken = utils.getRefreshToken({ email: config.adminMail, role: config.roles.admin });
    const path1 = '/v1/auth';
    it(`PATCH ${path1} with refresh token should respond with valid access token`, done => {
      supertest(app)
        .patch(path1)
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) done(err);
          const auth = res.body;
          expect(auth).to.be.ok;
          expect(auth.accessToken).to.be.ok;
          expect(jwt.verify(auth.accessToken, config.accessTokenSecret)).to.be.ok;
          done();
        });
    });

    const path2 = '/v1/auth';
    const query2 = { email: config.adminMail, password: config.adminPassword };
    let testId = null;
    it(`POST ${path2} with admin user credentials should respond with 200`, done => {
      supertest(app)
        .post(path2)
        .send(query2)
        .expect(200)
        .end((err, res) => {
          if (err) done(err);
          const auth = res.body;
          expect(auth).to.be.ok;
          expect(auth.refreshToken).to.be.ok;
          expect(jwt.verify(auth.refreshToken, config.refreshTokenSecret)).to.be.ok;
          expect(auth.accessToken).to.be.ok;
          expect(jwt.verify(auth.accessToken, config.accessTokenSecret)).to.be.ok;
          done();
        });
    });
  });
  describe('invalid requests', () => {
    const refreshToken1 = jwt.sign(
      { iss: config.tokenIssuer, sub: 'refresh', aud: 'v1/auth' },
      config.refreshTokenSecret,
      { expiresIn: '1ms' }
    );
    const path1 = '/v1/auth';
    it(`PATCH ${path1} with expired refresh token should respond with 401`, done => {
      setTimeout(() => {
        supertest(app)
          .patch(path1)
          .set('Authorization', `Bearer ${refreshToken1}`)
          .expect(401)
          .end(done);
      }, 10);
    });

    const refreshToken2 = jwt.sign(
      // wrong aud!
      { iss: config.tokenIssuer, sub: 'refresh', aud: 'v1/users' },
      config.refreshTokenSecret,
      { expiresIn: '1ms' }
    );
    const path2 = '/v1/auth';
    it(`PATCH ${path2} with invalid refresh token audience should respond with 401`, done => {
      supertest(app)
        .patch(path2)
        .set('Authorization', `Bearer ${refreshToken2}`)
        .expect(401)
        .end(done);
    });

    const refreshToken3 = jwt.sign(
      // wrong iss!
      { iss: 'me', sub: 'refresh', aud: 'v1/users' },
      config.refreshTokenSecret,
      { expiresIn: '1ms' }
    );
    const path3 = '/v1/auth';
    it(`PATCH ${path3} with invalid refresh token issuer should respond with 401`, done => {
      supertest(app)
        .patch(path3)
        .set('Authorization', `Bearer ${refreshToken3}`)
        .expect(401)
        .end(done);
    });

    const refreshToken4 = jwt.sign(
      // wrong sub!
      { iss: 'me', sub: 'access', aud: 'v1/users' },
      config.refreshTokenSecret,
      { expiresIn: '1ms' }
    );
    const path4 = '/v1/auth';
    it(`PATCH ${path4} with invalid refresh token subject should respond with 401`, done => {
      supertest(app)
        .patch(path4)
        .set('Authorization', `Bearer ${refreshToken4}`)
        .expect(401)
        .end(done);
    });

    const path5 = '/v1/auth';
    const query5 = { email: `footest${_.random(1, 9999)}`, password: 'foobar57546859e1a36d1824e80cb9' };
    let testId = null;
    it(`POST ${path5} with invalid user credentials should respond with 403`, done => {
      supertest(app)
        .post(path5)
        .send(query5)
        .expect(401)
        .end(done);
    });
  });
});