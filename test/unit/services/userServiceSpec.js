'use strict';

const userModel = require('../../../app/models/userModel');
const userService = require('../../../app/services/userService');
const ObjectId = require('mongoose').Types.ObjectId;
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const Promise = require('bluebird');
chai.use(chaiAsPromised);


describe('test/unit/services/userServiceSpec', function() { // eslint-disable-line
  this.timeout(3000);
  let userObj;
  describe('createUser', () => {
    beforeEach(() => {
      userObj = {
        id: new ObjectId(),
        role: 1,
        email: 'foo',
        password: 'foobar42',
      };
    });
    afterEach(() => {
      userModel.findByEmail.restore();
      userModel.createUser.restore();
    });
    it('should return new user object', () => {
      sinon.stub(userModel, 'findByEmail', () => Promise.resolve(null));
      sinon.stub(userModel, 'createUser', () => Promise.resolve(userObj));
      const servicePromise = userService.createUser('foo', 'foobar42');
      return expect(servicePromise).to.eventually.deep.equal(userObj);
    });
    it('should reject to create new user if email exists', () => {
      sinon.stub(userModel, 'findByEmail', () => Promise.resolve(userObj));
      sinon.stub(userModel, 'createUser', () => Promise.resolve(userObj));
      const servicePromise = userService.createUser('foo', 'foobar42');
      return expect(servicePromise).to.be.rejected;
    });
  });
  describe('validateUser', () => {
    beforeEach(() => {
      userObj = {
        id: new ObjectId(),
        role: 1,
        email: 'foo',
        password: 'foobar42',
      };
    });
    afterEach(() => {
      userModel.findOne.restore();
    });
    it('should return user object', () => {
      userObj.validatePassword = () => true;
      sinon.stub(userModel, 'findOne', (query, cb) => cb(null, userObj));
      const servicePromise = userService.validateUser('foo', 'foobar42');
      return expect(servicePromise).to.be.fulfilled;
    });
    it('should reject validation if wrong email', () => {
      sinon.stub(userModel, 'findOne', (query, cb) => cb(null, null));
      const servicePromise = userService.validateUser('foo', 'foobar42');
      return expect(servicePromise).to.be.rejected;
    });
    it('should reject validation if wrong password', () => {
      userObj.validatePassword = () => false;
      sinon.stub(userModel, 'findOne', (query, cb) => cb(null, userObj));
      const servicePromise = userService.validateUser('foo', 'foobar42');
      return expect(servicePromise).to.be.rejected;
    });
  });
  describe('findById', () => {
    beforeEach(() => {
      userObj = {
        id: new ObjectId(),
        role: 1,
        email: 'foo',
        password: 'foobar42',
      };
    });
    afterEach(() => {
      userModel.findById.restore();
    });
    it('should return user object', () => {
      sinon.stub(userModel, 'findById', () => Promise.resolve(userObj));
      const servicePromise = userService.findById(userObj.id);
      return expect(servicePromise).to.eventually.deep.equal(userObj);
    });
    it('should reject if not found', () => {
      sinon.stub(userModel, 'findById', () => Promise.resolve(null));
      const servicePromise = userService.findById(userObj.id);
      return expect(servicePromise).to.be.rejectedWith(Error, '404');
    });
  });
  describe('updateById', () => {
    beforeEach(() => {
      userObj = {
        role: 1,
        email: 'foo',
        password: 'foobar42',
      };
    });
    afterEach(() => {
      userModel.updateById.restore();
    });
    it('should be resolved', () => {
      sinon.stub(userModel, 'updateById', () => Promise.resolve(1));
      const servicePromise = userService.updateById(userObj.id, userObj);
      return expect(servicePromise).to.be.fulfilled;
    });
    it('should reject if not found', () => {
      sinon.stub(userModel, 'updateById', () => Promise.resolve(0));
      const servicePromise = userService.updateById(userObj.id, userObj);
      return expect(servicePromise).to.be.rejectedWith(Error, '404');
    });
  });
  describe('deleteById', () => {
    beforeEach(() => {
      userObj = {
        role: 1,
        email: 'foo',
        password: 'foobar42',
      };
    });
    afterEach(() => {
      userModel.deleteById.restore();
    });
    it('should be resolved', () => {
      sinon.stub(userModel, 'deleteById', () => Promise.resolve(1));
      const servicePromise = userService.deleteById(userObj.id);
      return expect(servicePromise).to.be.fulfilled;
    });
    it('should reject if not found', () => {
      sinon.stub(userModel, 'deleteById', () => Promise.resolve(0));
      const servicePromise = userService.deleteById(userObj.id);
      return expect(servicePromise).to.be.rejectedWith(Error, '404');
    });
  });
});
