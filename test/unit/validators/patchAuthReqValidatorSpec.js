'use strict';

const patchReqValidator = require('../../../app/validators/patchAuthReqValidator');
const expect = require('chai').expect;
const _ = require('lodash');

describe('test/unit/validators/patchAuthReqValidator check', function() { // eslint-disable-line
  let req = {};
  beforeEach(() => {
    req = {
      token: 'dummyToken',
    };
  });
  it('should accept only req with token', () => {
    let error = patchReqValidator.check(req);
    expect(_.toString(error)).to.be.empty;
    delete req.token;
    error = patchReqValidator.check(req);
    expect(_.toString(error)).to.be.equal('VError: 400: token is required');
  });
});
