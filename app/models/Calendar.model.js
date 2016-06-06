'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CalendarSchema = new Schema({
  dataSource:             { type: Schema.Types.ObjectId, ref: 'HatDataSource' },
  url:                    { type: String },
  repeatInterval:         { type: Number },
  newestRecordTimestamp:  { type: String },
  createdAt:              { type: Date },
  lastModifiedAt:         { type: Date },
  lastRunAt:              { type: Date },
  nextRunAt:              { type: Date },
  lastSuccessAt:          { type: Date },
  lastFailureAt:          { type: Date },
  lockedAt:               { type: Date }
});

module.exports = mongoose.model('Calendar', CalendarSchema);