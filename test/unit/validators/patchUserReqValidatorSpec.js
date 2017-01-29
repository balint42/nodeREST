'use strict';

const patchReqValidator = require('../../../app/validators/patchUserReqValidator');
const config = require('../../../config/config');
const expect = require('chai').expect;
const _ = require('lodash');

describe('test/unit/validators/patchUserReqValidator check', function() { // eslint-disable-line
  let req = {};
  beforeEach(() => {
    req = {
      body: {
        email: 'foo@google.com',
        role: '3',
      },
    };
  });
  it('should accept only valid email', () => {
    let error = patchReqValidator.check(req);
    expect(_.toString(error)).to.be.empty;
    delete req.body.email;
    error = patchReqValidator.check(req);
    expect(_.toString(error)).to.be.empty;
    req.body.email = 'foo';
    error = patchReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: invalid email');
  });
  it('should accept only valid role', () => {
    const validRoles = [config.roles.user, config.roles.manager, config.roles.admin];
    let error = patchReqValidator.check(req);
    expect(_.toString(error)).to.be.empty;
    delete req.body.role;
    error = patchReqValidator.check(req);
    expect(_.toString(error)).to.be.empty;
    req.body.role = 'foo';
    error = patchReqValidator.check(req);
    expect(_.toString(error)).to.be.equal(
      `VError: 400: role has to be one of ${validRoles}`
    );
    req.body.role = '4';
    error = patchReqValidator.check(req);
    expect(_.toString(error)).to.be.equal(
      `VError: 400: role has to be one of ${validRoles}`
    );
  });
});

describe('test/unit/validators/patchUserReqValidator sanitize', function() { // eslint-disable-line
  let req = {};
  beforeEach(() => {
    req = {
      body: {
        email: ' foo@google.com     ',
        role: '3',
        password: 'foobarfoobar',
      },
    };
  });
  it('should sanitize req', () => {
    patchReqValidator.sanitize(req);
    expect(req.body).to.deep.equal({
      email: 'foo@google.com',
      role: 3,
    });
  });
});
