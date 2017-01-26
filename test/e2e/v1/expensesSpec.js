'use strict';

const supertest = require('supertest');
const server = require('../../../server');
const expenseModel = require('../../../app/models/expenseModel');
const expect = require('chai').expect;
const config = require('../../../config/config');
const utils = require('../../../utils/utils');
const _ = require('lodash');
const app = server.app;

let userObj = null;
let expenseObj = null;
let expenseParams = null;
beforeEach(() => {
  userObj = {
    id: config.adminId,
    role: config.roles.admin,
    email: config.adminMail,
  };
  expenseParams = {
    amount: 10.5,
    date: '2017-01-01',
    time: '22:00:00',
    userId: userObj.id,
    description: 'foo',
    comment: 'foobar',
    user: userObj,
  };
  expenseObj = _.cloneDeep(expenseParams);
});

describe('/v1/expenses', function() {
  this.timeout(5000);
  let testId = null;
  beforeEach(done => {
    expenseModel.create(expenseParams)
      .tap(newExpense => { testId = newExpense.id.toString(); })
      .tap(() => done());
  });
  afterEach(() => {
    return expenseModel.deleteById(testId);
  });
  describe('valid requests', () => {
    const accessToken = utils.getAccessToken({
      id: config.adminId,
      email: config.adminMail,
      role: config.roles.admin,
    });

    const path1 = '/v1/expenses';
    it(`POST ${path1} should respond with new expense json`, done => {
      supertest(app)
        .post(path1)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(expenseParams)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.ok;
          expect(res.body.id).to.be.ok;
          expenseObj.id = res.body.id;
          expect(res.body).to.deep.equal(expenseObj);
          done();
        });
    });

    it('GET /v1/expenses/:id should respond with json', done => {
      supertest(app)
        .get(`/v1/expenses/${testId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expenseObj.id = testId;
          expect(res.body).to.deep.equal(expenseObj);
          done();
        });
    });

    const query3 = { amount: 1 };
    it(`PATCH /v1/expenses/:id with ${JSON.stringify(query3)} should respond with 204`, done => {
      supertest(app)
        .patch(`/v1/expenses/${testId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(query3)
        .expect(204)
        .end(done);
    });

    it('DELETE /v1/expenses/:id should respond with 204', done => {
      supertest(app)
        .delete(`/v1/expenses/${testId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204)
        .end(done);
    });
  });
  describe('invalid requests', () => {
    const accessToken = utils.getAccessToken({
      email: config.adminMail,
      role: config.roles.admin,
    });
    it('GET /v1/expenses/:id should respond with 401 without JWT token', done => {
      supertest(app)
        .get(`/v1/expenses/${testId}`)
        .set('Accept', 'application/json')
        .expect(401)
        .end(done);
    });
    const path2 = '/v1/expenses/588928fbeab08838e5298906';
    it(`GET ${path2} should respond with 404 with wrong id`, done => {
      supertest(app)
        .get(path2)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .end(done);
    });

    const query3 = { amount: 2 };
    const query3str = JSON.stringify(query3);
    it(`PATCH /v1/expenses/:id with ${query3str} should respond 401, no JWT token`, done => {
      supertest(app)
        .patch(`/v1/expenses/${testId}`)
        .send(query3)
        .expect(401)
        .end(done);
    });
    const path4 = '/v1/expenses/588928fbeab08838e5298906';
    const query4 = { amount: 2 };
    it(`PATCH ${path4} with ${JSON.stringify(query4)} should respond 404, wrong id`, done => {
      supertest(app)
        .patch(path4)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(query4)
        .expect(404)
        .end(done);
    });

    const path5 = '/v1/expenses';
    const query5 = { amount: 1 };
    it(`POST ${path5} with ${JSON.stringify(query5)} should respond 400, no description`, done => {
      supertest(app)
        .post(path5)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(query5)
        .expect(400)
        .end(done);
    });
    const path6 = '/v1/expenses';
    const query6 = { description: 'foobar' };
    it(`POST ${path6} with ${JSON.stringify(query6)} should respond 400, no amount`, done => {
      supertest(app)
        .post(path6)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(query6)
        .expect(400)
        .end(done);
    });
    const path7 = '/v1/expenses';
    const query7 = { description: 'foobar', amount: -1 };
    it(`POST ${path7} with ${JSON.stringify(query7)} should respond 400,negative amount`, done => {
      supertest(app)
        .post(path7)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(query7)
        .expect(400)
        .end(done);
    });

    it('DELETE /v1/expenses/:id should respond with 401 without JWT token', done => {
      supertest(app)
        .delete(`/v1/expenses/${testId}`)
        .expect(401)
        .end(done);
    });
    const path9 = '/v1/expenses/588928fbeab08838e5298900';
    it(`DELETE ${path9} should respond with 404 with wrong id`, done => {
      supertest(app)
        .delete(path9)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .end(done);
    });
  });
});
