'use strict';

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const session = require('express-session');
const bodyParser = require('body-parser');
require('marko/express');
require('marko/node-require').install();

const mongoose = require('./config/db');
const errors = require('./errors');
const config = require('./config');
const helpers = require('./helpers');

const updateSvc = require('./services/update.service');

let app = express();

app.disable('etag');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'very secret secret',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, '../public')));
app.use(helpers.createSessionData);

/* App routes */
const indexRoutes = require('./routes/index');
const calendarRoutes = require('./routes/calendar');
const hatRoutes = require('./routes/hat');
const dataPlugRoutes = require('./routes/dataPlug');

app.use('/', indexRoutes);
app.use('/hat', hatRoutes);
app.use('/calendar', calendarRoutes);
app.use('/dataplug', dataPlugRoutes);

// mongoose

var db = mongoose();

// catch 404 and forward to error handler
app.use(errors.notFound);

// error handlers
app.use(errors.catchAll);

module.exports = app;
