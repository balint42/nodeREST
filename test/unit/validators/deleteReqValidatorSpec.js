'use strict';

const deleteReqValidator = require('../../../app/validators/deleteReqValidator');
const expect = require('chai').expect;
const _ = require('lodash');

describe('test/unit/validators/deleteReqValidator check', function() { // eslint-disable-line
  it('should require a valid id', () => {
    const paramsEmpty = { params: {} };
    let error = deleteReqValidator.check(paramsEmpty) || '';
    expect(error.toString()).to.be.equal('VError: 400: id required');
    const paramsNullId = {
      params: {
        id: '',
      },
    };
    error = deleteReqValidator.check(paramsNullId) || '';
    expect(error.toString()).to.be.equal('VError: 400: id required');
    let paramsId = {
      params: {
        id: '2cdc234qreq',
      },
    };
    error = deleteReqValidator.check(paramsId);
    expect(error.toString()).to.be.equal('VError: 400: invalid id');
    paramsId = {
      params: {
        id: '57543795c5e18d4310a7db1f',
      },
    };
    error = deleteReqValidator.check(paramsId);
    expect(_.toString(error)).to.be.empty;
  });
});
describe('test/unit/validators/deleteReqValidator sanitize', function() { // eslint-disable-line
  const sanitizedReq = {
    params: {
      id: '57543795c5e18d4310a7db1f',
    },
  };
  it('should sanitize params', () => {
    const params1 = {
      params: {
        id: ' 57543795c5e18d4310a7db1f ',
      },
    };
    deleteReqValidator.sanitize(params1);
    expect(params1).to.be.deep.equal(sanitizedReq);
  });
});
