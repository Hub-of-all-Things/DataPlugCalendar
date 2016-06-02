'use strict';

const express = require('express');
const router = express.Router();
const errors = require('../errors');
const config = require('../config');

router.get('/', (req, res, next) => {
  return res.render('dataPlugLanding', { hatHost: req.query.hat });
});

module.exports = router;