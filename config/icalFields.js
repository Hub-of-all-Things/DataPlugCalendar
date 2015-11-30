var icalFields = {
  events: {
    available: [
      'calendarName',
      'startDate',
      'endDate',
      'lastUpdated',
      'location',
      'attendees',
      'summary',
      'description',
      'organizer'
    ],
    used: [
      'calendarName',
      'startDate',
      'endDate',
      'lastUpdated',
      'location',
      'attendees',
      'summary',
      'description',
      'organizer'
    ]
  },

  getRequestUrl: function(url, lastUpdate) {
    var graphRequestUrl = url;
    return graphRequestUrl;
  }
};

module.exports = icalFields;