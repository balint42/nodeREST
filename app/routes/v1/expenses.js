'use strict';

const getDetailsExpenseReqValidator = require('../../validators/getDetailsReqValidator');
const patchExpenseReqValidator = require('../../validators/patchExpenseReqValidator');
const postExpenseReqValidator = require('../../validators/postExpenseReqValidator');
const deleteExpenseReqValidator = require('../../validators/deleteReqValidator');
const expenseService = require('../../services/expenseService');
const passport = require('../../utils/passport');
const utils = require('../../utils/utils');
const logger = require('../../../utils/logger');
const config = require('../../../config/config');
const express = require('express');
const router = express.Router();
const _ = require('lodash');

function createCheck(validator) {
  return (req, res, next) => {
    const error = validator.check(req);
    if (! error) {
      validator.sanitize(req);
      next();
    } else {
      next(error);
    }
  };
}

const setMinimumRole = (req, res, next) => {
  expenseService.findById(req.params.id)
    .then(expense => {
      if (! expense) {
        res.status(404).send();
      }
      // set required minimum role
      if (expense.userId == req.user.id) { // eslint-disable-line
        req.minRole = config.roles.user;
      } else {
        req.minRole = config.roles.admin;
      }
    })
    .catch(err => {
      if (utils.isClientError(err)) {
        res.status(404).send();
      }
      logger.error(`Error getting expense: ${utils.errorToString(err)}`);
      res.status(500).send();
    })
    .asCallback(next);
};
const passportOpt = { failureFlash: false, session: false };

// create new expense
router.route('/expenses')
  .post(createCheck(postExpenseReqValidator))
  .post(
    passport.authenticate('jwt-access', passportOpt),
    utils.requireRole(config.roles.user),
    (req, res) => {
      expenseService.createExpense(
        {
          id: req.body.id,
          comment: req.body.comment,
          description: req.body.description,
          amount: req.body.amount,
          date: req.body.date,
          time: req.body.time,
          userId: req.user.id,
        },
        req.user
      )
      .then(newExpense => {
        res.json(newExpense);
      })
      .catch(err => {
        if (utils.isClientError(err)) {
          return res.status(400).send();
        }
        logger.error(`Error creating expense: ${utils.errorToString(err)}`);
        res.status(500).send();
      });
    }
  );

// get expenses
router.route('/expenses').get(
  passport.authenticate('jwt-access', passportOpt),
  (req, res) => {
    expenseService.findBy(req.query, req.user)
      .then(expenses => {
        res.json(expenses);
      })
      .catch(err => {
        if (utils.isClientError(err)) {
          return res.status(400).send();
        }
        logger.error(`Error finding expenses: ${utils.errorToString(err)}`);
        res.status(500).send();
      });
  }
);

// get expense
router.route('/expenses/:id')
  .get(createCheck(getDetailsExpenseReqValidator))
  .get(
    passport.authenticate('jwt-access', passportOpt),
    setMinimumRole,
    utils.requireRole(),
    (req, res) => {
      expenseService.findById(req.params.id).tap(expense => {
        if (! expense) {
          return res.status(404).send();
        }
      })
      .then(expense => {
        return expenseService.extendWithUsers([expense])
          .then(_.first)
          .then(exp => res.json(exp))
          .catch(error => {
            logger.error(`Error extending expense with user: ${utils.errorToString(error)}`);
            res.json(expense);
          });
      })
      .catch(err => {
        if (utils.isClientError(err)) {
          return res.status(404).send();
        }
        logger.error(`Error getting expense: ${utils.errorToString(err)}`);
        res.status(500).send();
      });
    }
  );

// update expense
router.route('/expenses/:id')
  .patch(createCheck(patchExpenseReqValidator))
  .patch(
    passport.authenticate('jwt-access', passportOpt),
    setMinimumRole,
    utils.requireRole(),
    (req, res) => {
      expenseService.updateById(req.params.id, req.body).then(() => {
        res.status(204).send();
      })
      .catch(err => {
        if (utils.isClientError(err)) {
          return res.status(404).send();
        }
        logger.error(`Error updating expense: ${utils.errorToString(err)}`);
        res.status(500).send();
      });
    }
  );

// delete expense
router.route('/expenses/:id')
  .delete(createCheck(deleteExpenseReqValidator))
  .delete(
    passport.authenticate('jwt-access', passportOpt),
    setMinimumRole,
    utils.requireRole(),
    (req, res) => {
      expenseService.deleteById(req.params.id).then(() => {
        res.status(204).send();
      })
      .catch(err => {
        if (utils.isClientError(err)) {
          return res.status(404).send();
        }
        logger.error(`Error deleting expense: ${utils.errorToString(err)}`);
        res.status(500).send();
      });
    }
  );

module.exports.router = router;
