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
const calendarRegisterForm = require('../views/calendarRegisterForm.marko');
const confirmationMarko = require('../views/setupConfirmation.marko');

router.use(helpers.authMiddleware);

router.post('/hat', (req, res, next) => {
  if (!req.body['hatDomain']) return res.marko(hatRegisterMarko, {
    hatDomainInput: null
  });

  req.session.hatUrl = req.body['hatDomain'];

  market.connectHat(req.session.hatUrl, (err) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      req.dataplug = { statusCode: '502' };
      return next();
    }

    hat.getAccessToken(req.session.hatUrl, (err, hatAccessToken) => {
      if (err) {
        console.log(`[ERROR][${new Date()}]`, err);
        req.dataplug = { statusCode: '401' };
        return next();
      }

      req.session.hatAccessToken = hatAccessToken;

      req.session.save(function (err) {
        return res.redirect('/dataplug/config');
      });
    });
  });
}, errors.renderErrorPage);

router.get('/config', (req, res, next) => {
  db.countDataSources(req.session.hatUrl, (err, count) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      req.dataplug = { statusCode: '500' };
      return next();
    }

    if (count === 0) {
      return res.marko(calendarRegisterForm);
    } else {
      return res.marko(accountStats);
    }
  });
}, errors.renderErrorPage);

router.post('/config', (req, res, next) => {
  if (!req.body['calendarUrl']) {
    return res.marko(calendarRegisterForm);
  }

  const calendarLink = req.body['calendarUrl'];

  db.createDataSources('events',
                       'ical',
                       req.session.hatUrl,
                       null,
                       (err, savedEntries) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      req.dataplug = { statusCode: '500' };
      return next();
    }

      db.createCalendar(calendarLink, savedEntries, (err, savedCalendar) => {
        if (err) {
          console.log(`[ERROR][${new Date()}]`, err);
          req.dataplug = { statusCode: '500' };
          return next();
        }

        update.addInitJob(savedEntries[0]);
        return res.marko(confirmationMarko, {
          rumpelLink: 'https://rumpel.hubofallthings.com/'
        });
      });

  });
}, errors.renderErrorPage);

module.exports = router;
