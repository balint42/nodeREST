'use strict';

const supertest = require('supertest');
const server = require('../../../server');
const userModel = require('../../../app/models/userModel');
const expect = require('chai').expect;
const config = require('../../../config/config');
const utils = require('../../../utils/utils');
const _ = require('lodash');
const app = server.app;

describe('/v1/users', function() {
  this.timeout(5000);
  describe('valid requests', () => {
    const path1 = `/v1/users/${config.adminId}`;
    const accessToken = utils.getAccessToken({
      email: config.adminMail,
      role: config.roles.admin,
      id: config.adminId,
    });
    it(`GET ${path1} should respond with json`, done => {
      supertest(app)
        .get(path1)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.id).to.be.equal(config.adminId);
          expect(res.body.email).to.be.equal(config.adminMail);
          expect(res.body.role).to.be.equal(config.roles.admin);
          expect(res.body.password).to.be.not.ok;
          done();
        });
    });

    const path2 = `/v1/users/${config.adminId}`;
    const query2 = { email: config.adminMail };
    it(`PATCH ${path2} with ${JSON.stringify(query2)} should respond with 204`, done => {
      supertest(app)
        .patch(path2)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(query2)
        .expect(204)
        .end(done);
    });

    const path3 = '/v1/users';
    const query3 = {
      email: `footest${_.random(1, 9999)}@google.com`,
      password: 'foobar57546859e1a36d1824e80cb9',
    };
    let testId = null;
    it(`POST ${path3} with ${JSON.stringify(query3)} should respond with 200`, done => {
      supertest(app)
        .post(path3)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(query3)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.id).to.be.ok;
          testId = res.body.id;
          expect(res.body.email).to.be.equal(query3.email);
          expect(res.body.role).to.be.equal(1);
          expect(res.body.password).to.be.not.ok;
          done();
        });
    });

    const path4 = '/v1/users';
    it(`GET ${path4} should respond with json array`, done => {
      supertest(app)
        .get(path4)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.ok;
          expect(Array.isArray(res.body)).to.be.true;
          expect(res.body).to.have.length.above(0);
          done();
        });
    });

    const path5 = '/v1/users';
    it(`DELETE ${path5} should respond with 204`, done => {
      supertest(app)
        .delete(`${path5}/${testId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204)
        .end(done);
    });
  });
  describe('invalid requests', () => {
    const path1 = `/v1/users/${config.adminId}`;
    const accessToken = utils.getAccessToken({
      email: config.adminMail,
      role: config.roles.admin,
      id: config.adminId,
    });
    it(`GET ${path1} should respond with 401 without JWT token`, done => {
      supertest(app)
        .get(path1)
        .set('Accept', 'application/json')
        .expect(401)
        .end(done);
    });
    const path2 = '/v1/users/588928fbeab08838e5298906';
    it(`GET ${path2} should respond with 404 with wrong id`, done => {
      supertest(app)
        .get(path2)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .end(done);
    });

    const path3 = `/v1/users/${config.adminId}`;
    const query3 = { email: config.adminMail };
    it(`PATCH ${path3} with ${JSON.stringify(query3)} should respond 401, no JWT token`, done => {
      supertest(app)
        .patch(path3)
        .send(query3)
        .expect(401)
        .end(done);
    });
    const path4 = '/v1/users/588928fbeab08838e5298906';
    const query4 = { email: config.adminMail };
    it(`PATCH ${path4} with ${JSON.stringify(query4)} should respond 404, wrong id`, done => {
      supertest(app)
        .patch(path4)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(query4)
        .expect(404)
        .end(done);
    });

    const path5 = '/v1/users';
    const query5 = { email: config.adminMail, password: 'foobar57546859e1a36d1824e80cb9' };
    it(`POST ${path5} with ${JSON.stringify(query5)} should respond 400, duplicate email`, done => {
      supertest(app)
        .post(path5)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(query5)
        .expect(400)
        .end(done);
    });
    const path6 = '/v1/users';
    const query6 = { password: 'foobar57546859e1a36d1824e80cb9' };
    it(`POST ${path6} with ${JSON.stringify(query6)} should respond, 400 no email`, done => {
      supertest(app)
        .post(path6)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(query6)
        .expect(400)
        .end(done);
    });
    const path7 = '/v1/users';
    const query7 = { email: `footest${_.random(1, 9999)}` };
    it(`POST ${path7} with ${JSON.stringify(query7)} should respond 400, no password`, done => {
      supertest(app)
        .post(path7)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(query7)
        .expect(400)
        .end(done);
    });

    const path8 = '/v1/users/588928fbeab08838e5298906';
    it(`DELETE ${path8} should respond with 401 without JWT token`, done => {
      supertest(app)
        .delete(path8)
        .expect(401)
        .end(done);
    });
    const path9 = '/v1/users/588928fbeab08838e5298906';
    it(`DELETE ${path9} should respond with 404 with wrong id`, done => {
      supertest(app)
        .delete(path9)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .end(done);
    });

    const path10 = '/v1/users';
    it(`GET ${path10} should respond with 401 without JWT token`, done => {
      supertest(app)
        .get(path10)
        .expect(401)
        .end(done);
    });
  });
  describe('invalid requests due to wrong role', () => {
    before(() => {
      return userModel.createUser({
        id: '588928fbeab08838e0000000',
        role: config.roles.user,
        email: 'foobar',
        password: '08838e5298eab08838eXyV4403!',
      });
    });
    after(() => {
      return userModel.deleteById('588928fbeab08838e0000000');
    });
    const path1 = `/v1/users/${config.adminId}`;
    const accessToken = utils.getAccessToken({
      email: 'unknown',
      role: config.roles.user,
      id: '588928fbeab08838e0000000',
    });
    it(`GET ${path1} should respond with 403 with wrong JWT role`, done => {
      supertest(app)
        .get(path1)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403)
        .end(done);
    });
    const path2 = `/v1/users/${config.adminId}`;
    const query2 = { email: config.adminMail };
    it(`PATCH ${path2} with ${JSON.stringify(query2)} should respond 403, wrong JWT role`, done => {
      supertest(app)
        .patch(path2)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(query2)
        .expect(403)
        .end(done);
    });
    const path3 = `/v1/users/${config.adminId}`;
    it(`DELETE ${path3} should respond with 403 with wrong JWT role`, done => {
      supertest(app)
        .delete(path3)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403)
        .end(done);
    });
    const path4 = '/v1/users';
    it(`GET ${path4} should respond with 403 with wrong JWT role`, done => {
      supertest(app)
        .get(path4)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403)
        .end(done);
    });
  });
});
