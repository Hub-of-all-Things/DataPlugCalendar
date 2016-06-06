'use strict';

const request = require('request');
const qs = require('qs');
const ical = require('ical.js');
const _ = require('lodash');

let internals = {};

exports.getCalendarData = (url, lastUpdated, callback) {

  const reqOptions = { url: url, json: false };

  request(reqOptions, (err, res, body) => {
    if (err) return callback(err);

    const calendarData = internals.icalToJson(body, lastUpdated);
    const lastUpdatedTimestamp = parseInt(lastUpdated);

    const newCalendarData = _.filter(calendarData, function(item) {

      const isNew = true;

      if (_.isUndefined(lastUpdated)) {
        isNew = true;
      } else {
        const d = new Date(item.lastUpdated);
        const timestamp = d.getTime() / 1000;
        isNew = timestamp >= lastUpdated;
      }

      return isNew;
    });

    console.log(newCalendarData);

    const newLastUpdated = Math.trunc(Date.now() / 1000).toString();

    return callback(null, newCalendarData, newLastUpdated);
  });
};

internals.icalToJson = (iCalData, lastUpdated) => {
  const jcalData = ical.parse(iCalData);
  const vcalendar = new ical.Component(jcalData);
  const vevents = vcalendar.getAllSubcomponents('vevent');

  const calName = _.flatten(_.filter(vcalendar.jCal[1], function(d){
    return d[0] === 'x-wr-calname';
  }))[3];

  const calendarEvents = _.map(vevents, (vevent) => {

    const calendarEvent = new ical.Event(vevent);

    const data = {
      "calendarName": calName,
      "startDate": vevent.getFirstPropertyValue('dtstart').toString(),
      "endDate": vevent.getFirstPropertyValue('dtend').toString(),
      "lastUpdated": vevent.getFirstPropertyValue('last-modified').toString(),
      "location": vevent.getFirstPropertyValue('location'),
      "attendees": _.map(_.pluck(calendarEvent.attendees, 'jCal'), function(cal){
        var component = new ical.Component(cal);
        return component.jCal[1].cn;
      }),
      "summary": vevent.getFirstPropertyValue('summary'),
      "description": vevent.getFirstPropertyValue('description'),
      "organizer": vevent.getFirstPropertyValue('organizer')
    }

    return data;

  });

  const updatedEvents = _.filter(calendarEvents, (event) => {
    return calendarEvents.lastUpdated < lastUpdated;
  });

  return calendarEvents;
};