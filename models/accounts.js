var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Accounts = new Schema({
  hat_token: String,
  last_events_update: String
});

module.exports = mongoose.model('Accounts', Accounts);