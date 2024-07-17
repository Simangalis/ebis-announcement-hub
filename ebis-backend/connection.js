const mysql = require('mysql');
require('dotenv').config();
const dayjs = require('dayjs');
const localizedFormat = require('dayjs/plugin/localizedFormat');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');


dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

// Setting Johannesburg Time Zone
const johannesburgTimeZone = 'Africa/Johannesburg';

// Function to convert date to Johannesburg time zone
const convertToJohannesburgTime = (date) => {
    return dayjs(date).tz(johannesburgTimeZone).format('YYYY-MM-DD HH:mm:ss');
};

var connection = mysql.createConnection({
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: ['DATE', 'DATETIME'],
    timezone: 'africa/johannesburg'
});

// Set the time zone for the current session
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return;
    }
    console.log("Connected to ebis database");

    connection.query('SET time_zone="+02:00";', err => {
        if (err) {
            console.error('Error setting time zone: ' + err.stack);
            return;
        }
        console.log('Time zone set successfully');
    });
});

// Export the connection
module.exports = connection;

// Export the function to convert to Johannesburg time zone
module.exports.convertToJohannesburgTime = convertToJohannesburgTime;
