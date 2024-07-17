const express = require("express");
const connection = require("../connection");
const router = express.Router();
const auth = require("../services/authentication");

// Middleware for handling database query errors
function handleQueryError(res, err) {
  console.error(err);
  return res.status(500).json({ error: "Internal Server Error" });
}

router.get("/details", auth.authenticateToken, (req, res, next) => {
  // Ensure the database connection is established before executing queries

  // Define SQL queries
  const categoryQuery = "SELECT COUNT(id) AS categoryCount FROM category";
  const announcementQuery = "SELECT COUNT(id) AS announcementCount FROM announcement";
  const billQuery = "SELECT COUNT(id) AS billCount FROM invoice";

  // Execute queries in parallel using Promise.all
  Promise.all([
    new Promise((resolve, reject) => {
      connection.query(categoryQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].categoryCount);
      });
    }),
    new Promise((resolve, reject) => {
      connection.query(announcementQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].announcementCount);
      });
    }),
    new Promise((resolve, reject) => {
      connection.query(billQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].billCount);
      });
    })
  ])
    .then(([categoryCount, announcementCount, billCount]) => {
      // Send response with data
      res.status(200).json({ category: categoryCount, announcement: announcementCount, bill: billCount });
    })
    .catch(err => handleQueryError(res, err));
});

module.exports = router;
