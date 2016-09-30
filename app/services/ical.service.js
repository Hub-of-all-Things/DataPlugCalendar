'use strict';

const request = require('request');
const qs = require('qs');
const ical = require('ical.js');
const _ = require('lodash');

var internals = {};

exports.validateCalendarLink = (url) => {
  let urlRegex = new RegExp("^(http:\/\/|https:\/\/){1}([0-9A-Za-z%-\/\.]+\.ics)$");

  return urlRegex.test(url);
};

exports.getCalendarData = (calendar, callback) => {

  const reqOptions = { url: calendar.url, json: false };

  request(reqOptions, (err, res, body) => {
    if (err) {
      console.log(`[ERROR] Could not retrieve iCal file`);
      return callback(err);
    }

    let newCalendarData;

    try {
      const calendarData = internals.icalToJson(body);
      const lastUpdatedTimestamp = parseInt(calendar.lastUpdated);
      newCalendarData = internals.filterNewEvents(calendarData, lastUpdatedTimestamp);
    } catch (e) {
      e.calendarUrl = calendar.url;
      return callback(e);
    }

    if (newCalendarData.length < 1) {
      console.log('[iCal] No data to process.')
      return callback(new Error('Nothing to update'));
    }

    return callback(null, newCalendarData);
  });
};

internals.icalToJson = (iCalData) => {
  const jcalData = ical.parse(iCalData);
  const vcalendar = new ical.Component(jcalData);
  const vevents = vcalendar.getAllSubcomponents('vevent');

  const calName = _.flatten(_.filter(vcalendar.jCal[1], function(d){
    return d[0] === 'x-wr-calname';
  }))[3];

  const calendarEvents = _.map(vevents, (vevent) => {

    const calendarEvent = new ical.Event(vevent);

    console.log('Calendar Event\n', calendarEvent);

    const data = {
      "calendarName": calName ? calName : '',
      "startDate": vevent.getFirstPropertyValue('dtstart') ? vevent.getFirstPropertyValue('dtstart').toString() : '',
      "endDate": vevent.getFirstPropertyValue('dtend') ? vevent.getFirstPropertyValue('dtend').toString() : '',
      "lastUpdated": vevent.getFirstPropertyValue('last-modified') ? vevent.getFirstPropertyValue('last-modified').toString() : '',
      "location": vevent.getFirstPropertyValue('location') ? vevent.getFirstPropertyValue('location') : '',
      "attendees": calendarEvent.attendees ? _.map(_.map(calendarEvent.attendees, 'jCal'), function(cal){ // pluck
        var component = new ical.Component(cal);
        return component.jCal[1].cn;
      }).toString() : '',
      "summary": vevent.getFirstPropertyValue('summary') ? vevent.getFirstPropertyValue('summary') : '',
      "description": vevent.getFirstPropertyValue('description') ? vevent.getFirstPropertyValue('description') : '',
      "organizer": vevent.getFirstPropertyValue('organizer') ? vevent.getFirstPropertyValue('organizer') : ''
    }

    console.log('DATA\n', data);

    return data;
  });

  return calendarEvents;
};

internals.filterNewEvents = (calendarData, lastUpdated) => {
 const newCalendarData = _.filter(calendarData, function(item) {
    let isNew = true;

    if (_.isUndefined(lastUpdated)) {
      isNew = true;
    } else {
      const d = new Date(item.lastUpdated);
      const timestamp = d.getTime() / 1000;
      isNew = timestamp >= lastUpdated;
    }

    return isNew;
  });

  return newCalendarData;
}