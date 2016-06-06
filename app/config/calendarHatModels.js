'use strict';

const hatDataSourceConfig = {
  events: {
    name: "events",
    source: "ical",
    fields: [
      { name: 'calendarName'},
      { name: 'startDate'},
      { name: 'endDate'},
      { name: 'lastUpdated'},
      { name: 'location'},
      { name: 'attendees'},
      { name: 'summary'},
      { name: 'description'},
      { name: 'organizer'}
    ]
  }
}

module.exports = hatDataSourceConfig;