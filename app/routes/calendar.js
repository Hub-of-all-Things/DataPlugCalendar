'use strict';

const express = require('express');
const router = express.Router();

const errors = require('../errors');
const helpers = require('../helpers');

const db = require('../services/db.service');
const update = require('../services/update.service');

const calendarRegisterForm = require('../views/calendarRegisterForm.marko');
const confirmationPage = require('../views/setupConfirmation.marko');

router.use(helpers.authMiddleware);

router.get('/', (req, res, next) => {
  return res.marko(calendarRegisterForm, {
    hat: req.session.hat
  });
}, errors.renderErrorPage);

router.post('/', (req, res, next) => {
  if (!req.body['calendarUrl']) {
    return res.marko(calendarRegisterForm, {
      hat: req.session.hat
    });
  }

  const calendarLink = req.body['calendarUrl'];

  db.createDataSources('events',
                       'ical',
                       req.session.hat.domain,
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

      return res.redirect('/calendar/confirm');
    });
  });
}, errors.renderErrorPage);

router.get('/confirm', (req, res, next) => {
  return res.marko(confirmationPage, {
    hat: req.session.hat,
    rumpelLink: 'https://rumpel.hubofallthings.com/',
    mainText: `The Data Plug has been set up to synchronize data between Calendar and your personal HAT.`,
    note: `It may take up to 5 minutes before the data appears on Rumpel.`
  });
});

module.exports = router;
