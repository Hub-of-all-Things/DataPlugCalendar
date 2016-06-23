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

exports.lockJob = (jobId, callback) => {
  const docUpdate = {
    lastRunAt: new Date(),
    lockedAt: new Date()
  };

  return Calendar.findByIdAndUpdate(jobId, docUpdate, { new: true }, callback);
};

exports.createDataSources = (names, source, hatUrl, sourceAT, callback) => {
  if (typeof names === 'string') names = [names];

  const newDbEntries = names.map((name) => {
    return {
      hatHost: hatUrl,
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
      lastUpdated: '1',
      createdAt: currentTime,
      lastModifiedAt: currentTime,
      lastRunAt: null,
      nextRunAt: new Date(currentTime.getTime() + 2 * 60 * 1000),
      lastSuccessAt: null,
      lastFailureAt: null,
      lockedAt: null
    };
  });

  return Calendar.create(newDbEntries, callback);
};

exports.updateDataSource = (docUpdate, dataSource, callback) => {
  const dataSourceFindParams = {
    hatHost: dataSource.hatHost,
    name: dataSource.name,
    source: dataSource.source
  };

  return HatDataSource.findOneAndUpdate(dataSourceFindParams, docUpdate, { new: true }, callback);
};

exports.updateCalendar = (calendar, isSuccess, nextRunAt, callback) => {
  if (typeof callback === 'undefined') {
    callback = nextRunAt;
    nextRunAt = null;
  }

  const now = new Date();

  let docUpdate = {
    lastUpdated: calendar.lastUpdated,
    lockedAt: null
  };

  if (isSuccess) {
    docUpdate.lastSuccessAt = now;
    docUpdate.nextRunAt = new Date(now.getTime() + calendar.repeatInterval);
  } else {
    docUpdate.lastFailureAt = now;
    docUpdate.nextRunAt = new Date(now.getTime() + config.updateService.repeatInterval);
  }

  return Calendar.findByIdAndUpdate(calendar._id, docUpdate, { new: true }, callback);
};