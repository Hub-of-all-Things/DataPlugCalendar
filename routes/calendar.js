var express = require('express');
var request = require('request');
var router = express.Router();
var Accounts = require('../models/accounts');
var appConfig = require('../config');
var middleware = require('../middleware/icalToHat');
var fbConfig = require('../config/icalHatModels');
var scheduler = require('../scheduler/agenda');

function getProviderAuthToken(req, res, next) {
  Accounts.findOne({ hat_token: appConfig.hatAccessToken }, function(err, account) {
    if (err) return next(err);
    req.account = account;
    req.query.hat_token = account.hat_token;
    next();
  });
}

function updateDatabase(req, res, next) {
  var databaseUpdateKey = {};
  databaseUpdateKey['last_'+req.params.nodeName+'_update'] = req.session['last_'+req.params.nodeName+'_update'];
  Accounts.findOneAndUpdate(
    { hat_token: req.query.hat_token },
    databaseUpdateKey,
    function(err, account) {
      if (err) return next(err);
      scheduler.addJob(req.params.nodeName, req.query.hat_token);
      res.send("Cool, we're done.");
    });
}

function initialRun(req, res, next) {
  middleware.initialRun(req.params.nodeName, req.query.hat_token, req.query.ical, req, next);
}

function postDataSourceModelRun(req, res, next) {
  middleware.postDataSourceModel(req.params.nodeName, req.query.hat_token, req, res, next);
}

router.get('/:nodeName/init', 
  getProviderAuthToken, 
  postDataSourceModelRun);

router.get('/:nodeName/update', 
  getProviderAuthToken, 
  initialRun,
  updateDatabase);

module.exports = router;