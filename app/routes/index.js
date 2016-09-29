'use strict';

const express = require('express');
const router = express.Router();

const indexTemp = require('../views/index.marko');

router.get('/', (req, res, next) => {
  res.marko(indexTemp, {
    hat: req.session.hat
  });
});

module.exports = router;