'use strict';

const userModel = require('../../../app/models/userModel');
const expenseModel = require('../../../app/models/expenseModel');
const expenseService = require('../../../app/services/expenseService');
const ObjectId = require('mongoose').Types.ObjectId;
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const moment = require('moment');
const Promise = require('bluebird');
const _ = require('lodash');
chai.use(chaiAsPromised);


describe('test/unit/services/expenseServiceSpec', function() { // eslint-disable-line
  this.timeout(3000);
  let userObj;
  let expenseObj;
  let expenseParams;
  beforeEach(() => {
    userObj = {
      id: (new ObjectId()).toString(),
      role: 1,
      email: 'foo',
      password: 'foobar42',
    };
  });
  describe('createExpense', () => {
    beforeEach(() => {
      expenseObj = {
        id: (new ObjectId()).toString(),
        amount: 10.5,
        date: '2017-01-01',
        time: '23:00:00',
        userId: userObj.id,
        description: 'foo',
        comment: 'foobar',
      };
      expenseParams = {
        amount: 10.5,
        date: moment.utc('2017-01-01'),
        time: moment.utc('23:00:00', 'HH:mm:ss'),
        userId: userObj.id,
        description: 'foo',
        comment: 'foobar',
      };
    });
    afterEach(() => {
      userModel.findById.restore();
      expenseModel.create.restore();
    });
    it('should return new expense object', () => {
      sinon.stub(userModel, 'findById', id => Promise.resolve(_.extend(userObj, { id })));
      sinon.stub(expenseModel, 'create', () => Promise.resolve(expenseObj));
      const servicePromise = expenseService.createExpense(expenseParams, userObj);
      return expect(servicePromise).to.eventually.deep.equal(expenseObj);
    });
    it('should reject to create new expense if user missing', () => {
      sinon.stub(userModel, 'findById', id => Promise.resolve(_.extend(userObj, { id })));
      sinon.stub(expenseModel, 'create', () => Promise.resolve(expenseObj));
      const servicePromise = expenseService.createExpense(expenseParams);
      return expect(servicePromise).to.be.rejected;
    });
  });
  describe('findBy', () => {
    beforeEach(() => {
      expenseObj = {
        id: (new ObjectId()).toString(),
        amount: 10.5,
        date: '2017-01-01',
        time: '23:00:00',
        userId: userObj.id,
        description: 'foo',
        comment: 'foobar',
      };
    });
    afterEach(() => {
      expenseModel.findBy.restore();
    });
    it('should return expense object', () => {
      sinon.stub(expenseModel, 'findBy', () => Promise.resolve([expenseObj]));
      const servicePromise = expenseService.findBy({ id: expenseObj.id }, userObj);
      const expectedResult = [_.extend(expenseObj, { user: userObj })];
      return expect(servicePromise).to.eventually.deep.equal(expectedResult);
    });
    it('should return empty array if nothing found', () => {
      sinon.stub(expenseModel, 'findBy', () => Promise.resolve([]));
      const servicePromise = expenseService.findBy({ id: expenseObj.id }, userObj);
      return expect(servicePromise).to.eventually.deep.equal([]);
    });
  });
  describe('findById', () => {
    beforeEach(() => {
      expenseObj = {
        id: (new ObjectId()).toString(),
        amount: 10.5,
        date: '2017-01-01',
        time: '23:00:00',
        userId: userObj.id,
        description: 'foo',
        comment: 'foobar',
      };
    });
    afterEach(() => {
      expenseModel.findById.restore();
    });
    it('should return expense object', () => {
      sinon.stub(expenseModel, 'findById', () => Promise.resolve(expenseObj));
      const servicePromise = expenseService.findById(expenseObj.id);
      return expect(servicePromise).to.eventually.deep.equal(expenseObj);
    });
    it('should reject if not found', () => {
      sinon.stub(expenseModel, 'findById', () => Promise.resolve(null));
      const servicePromise = expenseService.findById(expenseObj.id);
      return expect(servicePromise).to.be.rejectedWith(Error, '404');
    });
  });
  describe('updateById', () => {
    beforeEach(() => {
      expenseObj = {
        id: (new ObjectId()).toString(),
        amount: 10.5,
        date: '2017-01-01',
        time: '23:00:00',
        userId: userObj.id,
        description: 'foo',
        comment: 'foobar',
      };
    });
    afterEach(() => {
      expenseModel.updateById.restore();
    });
    it('should be resolved', () => {
      sinon.stub(expenseModel, 'updateById', () => Promise.resolve(1));
      const servicePromise = expenseService.updateById(expenseObj.id, expenseObj);
      return expect(servicePromise).to.be.fulfilled;
    });
    it('should reject if not found', () => {
      sinon.stub(expenseModel, 'updateById', () => Promise.resolve(0));
      const servicePromise = expenseService.updateById(expenseObj.id, expenseObj);
      return expect(servicePromise).to.be.rejectedWith(Error, '404');
    });
  });
  describe('deleteById', () => {
    beforeEach(() => {
      expenseObj = {
        id: (new ObjectId()).toString(),
        amount: 10.5,
        date: '2017-01-01',
        time: '23:00:00',
        userId: userObj.id,
        description: 'foo',
        comment: 'foobar',
      };
    });
    afterEach(() => {
      expenseModel.deleteById.restore();
    });
    it('should be resolved', () => {
      sinon.stub(expenseModel, 'deleteById', () => Promise.resolve(1));
      const servicePromise = expenseService.deleteById(expenseObj.id);
      return expect(servicePromise).to.be.fulfilled;
    });
    it('should reject if not found', () => {
      sinon.stub(expenseModel, 'deleteById', () => Promise.resolve(0));
      const servicePromise = expenseService.deleteById(expenseObj.id);
      return expect(servicePromise).to.be.rejectedWith(Error, '404');
    });
  });
});
