'use strict';

const express = require('express');
const router = express.Router();

const hat = require('../services/hat.service');
const db = require('../services/db.service');
const config = require('../config');

const hatLoginForm = require('../views/hatLoginForm.marko');

router.get('/login', (req, res, next) => {
  // TODO: check HAT domain with regex
  return res.marko(hatLoginForm, { hatDomain: req.query['hat'] || null });
});

router.get('/authenticate', (req, res, next) => {
  if (!req.query['token']) {
    return res.send('No token detected!');
  }

  const jwtToken = req.query['token'];

  hat.verifyToken(jwtToken, (err, hatSessionInfo) => {
    if (err || hatSessionInfo.authenticated === false) {
      return res.send('Token could not be validated.');
    } else {
      req.session.hat = hatSessionInfo;

      return req.session.save(function (err) {
        return res.redirect('/dataPlug/config');
      });
    }
  });
});

module.exports = router;
