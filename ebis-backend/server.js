
const http = require('http');
const moment = require('moment-timezone');
const app = require('./index');

require('dotenv').config();

// Setting Johannesburg Time Zone
const johannesburgTimeZone = 'Africa/Johannesburg';

// Create HTTP server
const server = http.createServer(app);


// Function to convert date to Johannesburg time zone
function convertToJohannesburgTime(date) {
    return moment.tz(date, johannesburgTimeZone).format();
}

module.exports = server;
