# HAT Sync Tools

![HAT Calendar Synchronizer](https://www.dropbox.com/s/6z9oijy7dl1ddck/Screenshot%202015-11-30%2019.30.13.png?dl=0)

### How to use it

1. Install npm modules, make sure MongoDB is running and start node server from project root directory.

  ```bash
  npm install
  mongod
  node bin/www
  ```

2. Visit homepage passing in HAT access token as query parameter.

  ```
  http://localhost:3000?hat\_token=$HAT\_ACCESS_TOKEN
  ```

3. Click "Authorize with Facebook" to grant access rights and generate user access token.

4. Initialize Data Source Model for a particular node by visiting:

  ```
  http://localhost:3000/calendar/$NODE\_NAME/init?hat\_token=$HAT\_ACCESS_TOKEN
  ```

5. Data synchronisation is initialised by entering your ics calendar url into the form and submitting it. It depends on your calendar provider how you can obtain the URL. For example for Google calendar:

![Google Calendar ICS address](https://www.dropbox.com/s/l3zyvuqd6ozuux6/Screenshot%202015-11-30%2019.35.51.png?dl=0)

Currently extracts a simple set of calendar event information, using [ical.js](https://github.com/mozilla-comm/ical.js) library:

- calendarName
- startDate
- endDate
- lastUpdated
- location
- attendees
- summary
- description
- organizer
