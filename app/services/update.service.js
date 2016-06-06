'use strict';

const async = require('async');
const db = require('../services/db.service');
const hat = require('../services/hat.service');
const config = require('../config');

let internals = {};

let queue = async.queue(work, 1);
let onQueueJobs = [];

setInterval(() => {
  console.log('Checking DB for tasks... ');

  db.findDueJobs(onQueueJobs, (err, results) => {
    console.log(results);
    const updateTasks = results.reduce((memo, result) => {
      if (result.dataSource.dataSourceModelId && result.dataSource.hatIdMapping) {
        memo.push({
          task: 'UPDATE_RECORDS',
          info: result
        });
      }

      return memo;
    }, []);
    console.log(updateTasks);
    return internals.addNewJobs(updateTasks);
  });
}, config.updateService.dbCheckInterval);

exports.addInitJob = (calendar) => {
  queue.unshift({ task: 'CREATE_MODEL', info: calendar }, (err) => {
    if (err) {
      console.log('Error occured when creating model.');
    } else {
      console.log('Model has been successfully created.');
    }

    onQueueJobs.shift();
  });

  onQueueJobs.unshift(calendar._id);
};

function work(item, cb) {
  if (item.task === 'UPDATE_RECORDS') {
    db.lockJob(item.info._id, (err, savedJob) => {
      if (err) {
        console.log(err);
        onQueueJobs.shift();
        return cb();
      }

      hat.updateDataSource(item.info, (err) => {
        const isSuccess = err ? false : true;

        db.updateCalendar(item.info, isSuccess, (err) => {
          cb();
        });
      });
    });
  } else if (item.task === 'CREATE_MODEL') {
    hat.mapOrCreateModel(item.info.dataSource, (err) => {
      const currentTime = new Date();

      const isSuccess = err ? false : true;

      const nextRunAt = new Date(currentTime.getTime() + config.updateService.repeatInterval);

      db.updateCalendar(item.info, isSuccess, nextRunAt, (err) => {
        cb();
      });
    });
  }
}

internals.addNewJobs = (jobs) => {
  async.eachSeries(jobs, (job, callback) => {
    queue.push(job, (err) => {
      if (err) {
        console.log('Error occured when processing job.');
      } else {
        console.log('Job has been completed.');
        console.log('ON QUEUE', queue.length());
        console.log('OnQueueArray', onQueueJobs.length);

        onQueueJobs.shift();
      }
    });

    onQueueJobs.push(job.info._id);

    return callback();
  }, () => {
    console.log('All tasks submitted to queue.');
  });
};