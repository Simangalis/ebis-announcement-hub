
const express = require("express");
const cors = require("cors");
const http = require('http');
const moment = require('moment-timezone');
const app = express();
const server = http.createServer(app);

require('dotenv').config();

const connection = require("./connection");
const userRoute = require("./routes/user");
const categoryRoute = require("./routes/category");
const dashboardRoute = require("./routes/dashboard");
const announcementRoute = require("./routes/announcement");
const invoiceRoute = require("./routes/bill");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/user", userRoute);
app.use("/category", categoryRoute);
app.use("/dashboard", dashboardRoute);
app.use("/announcement", announcementRoute);
app.use("/bill", invoiceRoute);

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

// Setting Johannesburg Time Zone
const johannesburgTimeZone = 'Africa/Johannesburg';

// Function to convert date to Johannesburg time zone
const convertToJohannesburgTime = (date) => {
    return moment.tz(date, johannesburgTimeZone).format();
};

module.exports = { app, convertToJohannesburgTime };
