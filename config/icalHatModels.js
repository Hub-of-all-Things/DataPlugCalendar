var hatDataSourceConfig = {
  events: {
    name: "events",
    source: "calendar",
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