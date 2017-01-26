'use strict';

const postReqValidator = require('../../../app/validators/postExpenseReqValidator');
const expect = require('chai').expect;
const _ = require('lodash');

describe('test/unit/validators/postExpenseReqValidator check', function() { // eslint-disable-line
  let req = {};
  beforeEach(() => {
    req = {
      body: {
        amount: 1.5,
        description: 'foobarfoobar',
        comment: 'foo',
        date: '2017-01-01',
        time: '22:00:01',
      },
    };
  });
  it('should accept only valid amount', () => {
    let error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.empty;
    delete req.body.amount;
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: amount is required');
    req.body.amount = 'foo';
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: amount hast to be a number >= 0');
    req.body.amount = -0.1;
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: amount hast to be a number >= 0');
  });
  it('should accept require decription', () => {
    let error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.empty;
    delete req.body.description;
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: description is required');
    req.body.description = '';
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: description is required');
  });
  it('should accept only valid date', () => {
    let error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.empty;
    delete req.body.date;
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.empty;
    req.body.date = '217-01-01';
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: invalid date');
    req.body.date = '2017-13-01';
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: invalid date');
    req.body.date = '2017-12-32';
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: invalid date');
  });
  it('should accept only valid time', () => {
    let error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.empty;
    delete req.body.time;
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.empty;
    req.body.time = '2:00:01';
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: invalid time');
    req.body.time = '22:60:01';
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: invalid time');
    req.body.time = '22:00:60';
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: invalid time');
  });
});

describe('test/unit/validators/postExpenseReqValidator sanitize', function() { // eslint-disable-line
  let req = {};
  beforeEach(() => {
    req = {
      body: {
        amount: 1.508173098,
        description: '      foobarfoobar    ',
        comment: '   foo  ',
        date: '   2017-01-01  ',
        time: '  22:00:01   ',
      },
    };
  });
  it('should sanitize req', () => {
    postReqValidator.sanitize(req);
    expect(req.body).to.deep.equal({
      amount: 1.51,
      description: 'foobarfoobar',
      comment: 'foo',
      date: '2017-01-01',
      time: '22:00:01',
    });
  });
});
