'use strict';

const express = require('express');
const router = express.Router();

const db = require('../services/db.service');
const hat = require('../services/hat.service');
const market = require('../services/market.service');
const update = require('../services/update.service');
const errors = require('../errors');
const helpers = require('../helpers');
const config = require('../config');

const accountStats = require('../views/accountStats.marko');

router.use(helpers.authMiddleware);

router.get('/main', (req, res, next) => {
  market.connectHat(req.session.hat.domain, (err) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      req.dataplug = { statusCode: '502' };
      return next();
    }

    hat.getAccessToken(req.session.hat.domain, (err, hatAccessToken) => {
      if (err) {
        console.log(`[ERROR][${new Date()}]`, err);
        req.dataplug = { statusCode: '401' };
        return next();
      }

      req.session.hat.accessToken = hatAccessToken;

      db.getCalendarsByDomain(req.session.hat.domain, (err, calendars) => {
        return res.marko(accountStats, {
          dataStats: calendars,
          hat: req.session.hat
        });
      });
    });
  });
}, errors.renderErrorPage);

module.exports = router;
