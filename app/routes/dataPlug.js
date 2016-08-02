'use strict';

const express = require('express');
const router = express.Router();

const db = require('../services/db.service');
const hat = require('../services/hat.service');
const market = require('../services/market.service');
const update = require('../services/update.service');
const errors = require('../errors');
const config = require('../config');

router.get('/', (req, res, next) => {
  return res.render('dataPlugLanding', { hatHost: req.query.hat });
});

router.post('/hat', (req, res, next) => {
  if (!req.body['hat_url']) return res.render('dataPlugLanding', { hatHost: req.query.hat });

  req.session.hatUrl = req.body['hat_url'];

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
      return res.render('calendarLinkForm');
    } else {
      return res.render('dataPlugStats');
    }
  });
}, errors.renderErrorPage);

router.post('/config', (req, res, next) => {
  if (!req.body['calendar-url']) return res.render('calendarLinkForm');

  const calendarLink = req.body['calendar-url'];

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
        return res.render('confirmation');
      });

  });
}, errors.renderErrorPage);

module.exports = router;
