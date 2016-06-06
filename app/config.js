'use strict';

const PRODUCTION = process.env.NODE_ENV === 'production';
const TEST = process.env.NODE_ENV === 'test';

let config = {};

config.currentEnv = process.env.NODE_ENV || 'development';

config.webServer = {
  host: process.env.HOST || 'localhost',
  port: normalizePort(process.env.PORT || 3000),
};

config.mongodb = {
  host: process.env.MONGODB_HOST || 'localhost',
  port: process.env.MONGODB_PORT || 27017,
  db: 'data_plug_calendar'
};

config.market = {
  host: 'marketsquare.hubofallthings.net',
  id: process.env.MARKET_ID,
  accessToken: process.env.MARKET_ACCESS_TOKEN
};

config.hat = {
  username: process.env.HAT_USER,
  password: process.env.HAT_PASSWORD
};

config.updateIntervals = {
  events: 24 * 60 * 60 * 1000
};

config.updateService = {
  dbCheckInterval: 2 * 60 * 1000,
  repeatInterval: 60 * 1000
};

if (TEST) config.webServer.port = 5525;

config.webServerURL = 'http://' + config.webServer.host + ':' + config.webServer.port;

config.dbURL = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port +
'/' + config.mongodb.db + '_' + config.currentEnv;

config.market.url = 'http://' + config.market.host + '/api/dataplugs/' + config.market.id +
'/connect';

module.exports = config;

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}