'use strict';

const HatDataSource = require('../models/HatDataSource.model');
const Calendar = require('../models/Calendar.model');
const calendarHatModels = require('../config/calendarHatModels');

const config = require('../config');

exports.countDataSources = (hatUrl, callback) => {
  return HatDataSource.count({ hatHost: hatUrl }, (err, count) => {
    if (err) return callback(err);
    return callback(null, count);
  });
};

exports.findDueJobs = (onQueueJobs, callback) => {
  return Calendar.find({ nextRunAt: { $lt: new Date() },
                          _id: { $nin: onQueueJobs } })
                   .populate('dataSource')
                   .exec(callback);
};

exports.createDataSources = (names, source, hatUrl, hatAT, sourceAT, callback) => {
  if (typeof names === 'string') names = [names];

  const newDbEntries = names.map((name) => {
    return {
      hatHost: hatUrl,
      hatAccessToken: hatAT,
      name: name,
      source: source,
      sourceAccessToken: sourceAT,
      dataSourceModel: calendarHatModels[name],
      dataSourceModelId: null,
      hatIdMapping: null
    };
  });

  return HatDataSource.create(newDbEntries, callback);
};

exports.createCalendar = (url, dataSources, callback) => {
  if (!Array.isArray(dataSources)) dataSources = [dataSources];

  const currentTime = new Date();

  const newDbEntries = dataSources.map((dataSource) => {
    return {
      dataSource: dataSource._id,
      url: url,
      repeatInterval: config.updateIntervals[dataSource.name],
      createdAt: currentTime,
      lastModifiedAt: currentTime,
      lastRunAt: null,
      nextRunAt: new Date(currentTime.getTime() + 60 * 1000),
      lastSuccessAt: null,
      lastFailureAt: null,
      lockedAt: null
    };
  });

  return Calendar.create(newDbEntries, callback);
};