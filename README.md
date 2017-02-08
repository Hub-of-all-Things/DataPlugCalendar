![Hub of All things](http://hubofallthings.com/wp-content/uploads/banner21.png)

# Calendar Data Plug for HAT

![HAT Calendar Synchronizer](https://Hub-of-all-Things.github.io/DataPlugCalendar/screenshot.png)

## Main features

- Minimalistic user interface with step-by-step setup process
- Integration with MarketSquare's authorisation processes
- Data synchronisation scheduler
- Build using Node (v4 LTS), MongoDB and Express framework

## Default settings

Currently the data plug supports synchronisation of the following data sources with given default intervals:

- cloud-hosted iCal files (synced every 24 hours)

Support for other data types and features will be added in the near future.

### Data fields

Extracts a simple set of calendar event information, using [ical.js](https://github.com/mozilla-comm/ical.js) library:

- calendarName
- startDate
- endDate
- lastUpdated
- location
- attendees
- summary
- description
- organizer

## Getting started

### Setting up environment variables

Data plug uses environment variables to configure security-sensitive parameters. Please have the following variables set up before starting the node process.

- MARKET_ID - plug's unique ID to login with MarketSquare (obtained from MS)
- MARKET\_ACCESS\_TOKEN - access token associated with the given MARKET_ID
- MARKET_DOMAIN - domain name used by the MarketSquare (currently marketsquare.hubofallthings.net)
- HAT_USER - username to login with HATs (configured *via* MarketSquare)
- HAT_PASSWORD - password associated with the current HAT username (configured *via* MarketSquare)
- NODE_ENV - can be set to either 'production' or 'development'
- SECURE - if set to 'true' will switch to https protocol for all communications
- HOST - webserver's domain name, defaults to 'localhost' if not set
- PORT - webserver's port, defaults to 3000 if not set
- MONGODB_HOST - Mongo database's domain name, defaults to 'localhost' if not set
- MONGODB_PORT - Monog database's port, defaults to 27017 if not set

### Configuration files

Amendments to the default synchronisation scheduler, data types and data fields being synchronised can be made in the app/config.js file and app/config/ folder.

### Starting the server

Clone the repository, install required npm modules and start the node server from the project root directory. Make sure that MongoDB instance is running and environment variables are set up correctly.

  ```bash
  git clone https://github.com/Hub-of-all-Things/DataPlugFacebook
  cd DataPlugFacebook/
  npm install
  node bin/www
  ```

Now the homepage can be accessed at http://localhost:3000 (assuming the default setup).

## Getting cloud-hosted iCal files

Data synchronisation is initialised by entering your ics calendar url into the form and submitting it. It depends on your calendar provider how the URL can be obtained. For example for Google calendar:

![Google Calendar ICS address](https://Hub-of-all-Things.github.io/DataPlugCalendar/calendar.png)

## License

This work is licensed under the Mozilla Public License Version 2.0. Please read the LICENSE file for further details.
