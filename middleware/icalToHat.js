var request = require('request');
var qs = require('qs');
var async = require('async');
var ICAL = require('ical.js');
var _ = require('lodash');
var config = require('../config');
var icalFieldsConfig = require('../config/icalHatModels');
var icalReqGen = require('../config/icalFields');
var Accounts = require('../models/accounts');

module.exports = (function() {
  var publicObject = {};
  var state = {};

  publicObject.initialRun = function(node, hatAccessToken, icalUrl, req, next) {
    initialize(node, hatAccessToken, icalUrl);
    async.waterfall([
      publicObject.fetchData,
      publicObject.postRecords
    ], function(err) {
      if (err) return next(err);

      req.session['last_'+node+'_update'] = state.lastUpdated;

      return next();

    });
  }

  publicObject.updateRun = function(node, hatAccessToken, icalUrl, lastUpdated, done) {
    initialize(node, hatAccessToken, icalUrl, lastUpdated);
    async.waterfall([
      publicObject.fetchData,
      publicObject.postRecords
    ], function(err) {
      if (err) return done(err);

      console.log('update running');

      var databaseUpdateKey = {};
      databaseUpdateKey['last_'+node+'_update'] = state.lastUpdated;

      Accounts.findOneAndUpdate(
        { hat_token: hatAccessToken },
        databaseUpdateKey,
        function(err, account) {
          if (err) return next(err);
            done();
        });
    });
  }

  publicObject.postDataSourceModel = function(node, hatAccessToken, req, res, next) {
    initialize(node, hatAccessToken);
    console.log({
      url: config.hatBaseUrl+'/data/table',
      qs: { access_token: state.hatAccessToken },
      headers: config.hatHeaders,
      method: 'POST',
      json: true,
      body: icalFieldsConfig[req.params.nodeName]
    }
      )
    request({
      url: config.hatBaseUrl+'/data/table',
      qs: { access_token: state.hatAccessToken },
      headers: config.hatHeaders,
      method: 'POST',
      json: true,
      body: icalFieldsConfig[req.params.nodeName]
    }, function (err, response, body) {
      console.log("Post source model: ", err, response.statusCode, body);
      if (response.statusCode === 200) res.send(req.params.nodeName + ' source model was successfully created.');
      else return next(body);        
    });
  }

  publicObject.fetchData = function(callback) {
    async.parallel([getCalendarData, fetchHatInfo], function(err, results) {
      if (err) return callback(err);
      /* WARNING: executes asynchronously */
      results[0].forEach(function(node) {
        var convertedNode = transformIcalToHat(node, results[1], '');
        state.data.push(convertedNode);
      });

      return callback(null);
    });
  };

  publicObject.postRecords = function(callb) {
    async.forEachOfSeries(state.data,
      function(dataRecordSet, index, callback) {
        async.waterfall([
          async.apply(createNewRecord, state.node+index, dataRecordSet),
          postRecordValues
        ], function (err) {
          if (err) return callback(err);
          return callback(null);
        });
      }, function(err) {
        callb(null);
      });
  }

  function initialize(node, hatAccessToken, icalUrl, lastUpdated) {
    console.log("Initialize:", node, hatAccessToken, icalUrl, lastUpdated);
    state.node = node || '';
    state.hatAccessToken = hatAccessToken || '';
    state.icalUrl = icalUrl || '';
    state.lastUpdated = lastUpdated;
    state.data = [];
  };

  function createNewRecord(recordName, dataRecordSet, callback) {
      console.log('Created new HAT record '+recordName);
      var record = { name: recordName }
      return callback(null, record, dataRecordSet);
  }

  function postRecordValues(record, dataRecordSet, callback) {
    var recordValues = {
      record: record,
      values: dataRecordSet
    };
    var dataRequest = {
      url: config.hatBaseUrl+'/data/record/values',
      qs: { access_token: state.hatAccessToken },
      headers: config.hatHeaders,
      method: 'POST',
      body: JSON.stringify(recordValues)
    };
    console.log("Complete request:", dataRequest);
    request(dataRequest, function (err, response, body) {
      if (err) return callback(err);
      console.log('Updated values for '+record.name+' record');
      console.log(body);
      callback(null);
    });
  }

  function fetchHatInfo(cb) {
    async.waterfall([
      getDataSourceId,
      getDataSourceModel,
      function(dataSourceModel, callback) {
        var hatIdMapping = mapDataSourceModel(dataSourceModel, '');
        return callback(null, hatIdMapping);
      }
    ], function(err, hatIdMapping) {
      if (err) return cb(err);
      return cb(null, hatIdMapping);
    });
  }

  function hatJsonFormat(key, value) {
    if ((typeof value === 'number' && key !== 'id') || typeof value === 'boolean') {
      return value.toString();
    } else {
      return value;
    }
  }

  function getDataSourceId(callback) {
    request({
      url: config.hatBaseUrl+'/data/table',
      qs: {
        access_token: state.hatAccessToken,
        name: state.node,
        source: 'calendar'
      },
      headers: config.hatHeaders,
      method: 'GET',
      json: true
    }, function (err, response, body) {
      if (err) {
        return callback(err);
      } else if (response.statusCode === 404) {
        var newError = new Error('HAT resource \"calendar '+state.node+'\" not found');
        newError.status = response.statusCode;
        return callback(newError);
      }

      var dataSourceId = body.id;
      return callback(null, dataSourceId);
    });
  }

  function getDataSourceModel(dataSourceId, callback) {
    request({
      url: config.hatBaseUrl+'/data/table/'+dataSourceId,
      qs: {
        access_token: state.hatAccessToken
      },
      headers: config.hatHeaders,
      method: 'GET',
      json: true
    }, function (err, response, body) {
      if (err) {
        return callback(err);
      } else if (response.statusCode === 404) {
        var newError = new Error('HAT resource \"calendar '+state.node+'\" not found');
        newError.status = response.statusCode;
        return callback(newError);
      }

      return callback(null, body);
    });
  }

  function getCalendarData(callback) {
    request({
      url: icalReqGen.getRequestUrl(state.icalUrl, state.lastUpdated),
      method: 'GET',
      json: false
    }, function (err, response, body) {
      if (err) return callback(err);

      var calendarData = icalToCalendarJson(body, state.lastUpdated);

      state.lastUpdated = parseInt(Date.now() / 1000, 10).toString();

      console.log("New calendar data: ", calendarData);
      
      return callback(null, calendarData);
    });
  }

  function icalToCalendarJson(iCalendarData, lastUpdated) {
    var jcalData = ICAL.parse(iCalendarData);
    var vcalendar = new ICAL.Component(jcalData);
    var vevents = vcalendar.getAllSubcomponents('vevent');

    var calName = _.flatten(_.filter(vcalendar.jCal[1], function(d){
      return d[0] === 'x-wr-calname';
    }))[3];

    var calendarEvents = _.map(vevents, function(vevent) {
      var event = new ICAL.Event(vevent);
      var data = {
        "calendarName": calName,
        "startDate": vevent.getFirstPropertyValue('dtstart').toString(),
        "endDate": vevent.getFirstPropertyValue('dtend').toString(),
        "lastUpdated": vevent.getFirstPropertyValue('last-modified').toString(),
        "location": vevent.getFirstPropertyValue('location'),
        "attendees": _.map(_.pluck(event.attendees, 'jCal'), function(cal){ 
          var component = new ICAL.Component(cal); 
          return component.jCal[1].cn; 
        }),
        "summary": vevent.getFirstPropertyValue('summary'),
        "description": vevent.getFirstPropertyValue('description'),
        "organizer": vevent.getFirstPropertyValue('organizer')
      }
      return data;
    });

    var updatedEvents = _.filter(calendarEvents, function(event) {
      return event.lastUpdated < lastUpdated;
    })
    return calendarEvents;
  }

  function mapDataSourceModel(tree, prefix) {
    var hatIdMapping = {};
    /* WARNING: executes asynchronously */
    tree.fields.forEach(function(leaf) {
      hatIdMapping[prefix+'_'+leaf.name] = leaf.id;
    });

    /* WARNING: executes asynchronously */
    if (tree.subTables.length > 0){
      tree.subTables.forEach(function(subTree) {
        var mappedSubTree = mapDataSourceModel(subTree, subTree.name);
        hatIdMapping = _.defaults(hatIdMapping, mappedSubTree);
      });
    }
    return hatIdMapping;
  }

  function transformIcalToHat(node, hatIdMapping, prefix) {
    var convertedData = _.map(node, function(value, key) {
      if (typeof value === 'object') {
        return transformIcalToHat(value, hatIdMapping, key);
      } else {
        var hatValue = {
          value: value,
          field: {
            id: hatIdMapping[prefix+'_'+key],
            name: key
          }
        };
        return hatValue;
      }
    })

    var flatValues = _.flattenDeep(convertedData);
    var filtered = _.filter(flatValues, function(value){
      return (value.field && value.field.id && _.isNumber(value.field.id));
    });
    return filtered;
  }



  return publicObject;

}());