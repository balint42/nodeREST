'use strict';

const postReqValidator = require('../../../app/validators/postAuthReqValidator');
const config = require('../../../config/config');
const expect = require('chai').expect;
const _ = require('lodash');

describe('test/unit/validators/postReqValidatorSpec check', function() { // eslint-disable-line
  let req = {};
  beforeEach(() => {
    req = {
      body: {
        email: 'foo@google.com',
        password: 'foobarfoobar',
      },
    };
  });
  it('should accept only valid email', () => {
    let error = postReqValidator.check(req);
    expect(error).to.be.equal(null);
    delete req.body.email;
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: email is required');
    req.body.email = 'foo';
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: valid email is required');
  });
  it('should accept only valid password', () => {
    let error = postReqValidator.check(req);
    expect(error).to.be.equal(null);
    delete req.body.password;
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: password is required');
    req.body.password = 'foo';
    error = postReqValidator.check(req);
    expect(_.toString(error)).to.be.equal(`VError: 400: password has to have min ${config.passwordLength} chars`);
  });
});

describe('test/unit/validators/postReqValidatorSpec sanitize', function() { // eslint-disable-line
  let req = {};
  beforeEach(() => {
    req = {
      body: {
        email: ' foo@google.com     ',
        password: '   foobarfoobar ',
      },
    };
  });
  it('should sanitize req', () => {
    postReqValidator.sanitize(req);
    expect(req.body).to.deep.equal({
      email: 'foo@google.com',
      password: 'foobarfoobar',
    });
  });
});
