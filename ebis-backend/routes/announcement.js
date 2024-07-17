const express = require("express");
const connection = require("../connection");
const router = express.Router();
var auth = require("../services/authentication");
var checkRole = require("../services/checkRole");
const sanitizeHTML = require("sanitize-html");
const mysql = require('mysql2'); // Make sure to use mysql2/promise for async/await support
const ExcelJS = require('exceljs');



router.post(
  "/addNewAnnouncement",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res) => {
    let announcement = req.body;
    
    // Sanitize HTML content
    announcement.content = sanitizeHTML(announcement.content, {
      allowedTags: [],
      allowedAttributes: {},
    });

    var query =
      "insert into announcement(title,content,categoryId,publication_date,expiry_date,Price,status)Values(?,?,?,?,?,?,?)";
    connection.query(
      query,
      [
        announcement.title,
        announcement.content,
        announcement.categoryId,
        announcement.publication_date,
        announcement.expiry_date, 
        announcement.Price,
        announcement.status,
      ],
      (err, results) => {
        if (!err) {
          return res
            .status(200)
            .json({ message: "Announcement Added Successfully" });
        } else {
          return res.status(500).json(err);
        }
      }
    );
  }
);

router.get("/getAllAnnouncement", auth.authenticateToken, (req, res) => {
  var query =
    "select a.id,a.title,a.content,a.publication_date,a.expiry_date,a.Price,a.status,c.id as categoryId,c.name as categoryName from announcement as a inner join category as c where a.categoryId = c.id";
  connection.query(query, (err, results) => {
    if (!err) {
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  });
});


router.get("/getByCategory/:id", auth.authenticateToken, (req, res, next) => {
  const id = req.params.id;
  var query = "select id,title from announcement where categoryId= ?";
  connection.query(query, [id], (err, results) => {
    if (!err) {
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  });
});

router.get("/getById/:id", auth.authenticateToken, (req, res, next) => {
  const id = req.params.id;
  var query =
    "select id,title,content,publication_date,expiry_date,Price from announcement where id = ?";
  connection.query(query, [id], (err, results) => {
    if (!err) {
      return res.status(200).json(results[0]);
    } else {
      return res.status(500).json(err);
    }
  });
});

router.get(
  "/getAnnContentById/:id",
  auth.authenticateToken,
  (req, res, next) => {
    const id = req.params.id;
    var query = "select id,content,Price from announcement where id = ?";
    connection.query(query, [id], (err, results) => {
      if (!err) {
        return res.status(200).json(results[0]);
      } else {
        return res.status(500).json(err);
      }
    });
  }
);

router.get(
  "/getAllPublishedAnnouncement",
  auth.authenticateToken,
  (req, res) => {
    var query =
      "select a.id,a.title,a.content,a.publication_date,a.expiry_date,a.Price,a.status,c.id as categoryId,c.name as categoryName from announcement as a inner join category as c where a.categoryId = c.id and a.status='published'";
    connection.query(query, (err, results) => {
      if (!err) {
        return res.status(200).json(results);
      } else {
        return res.status(500).json(err);
      }
    });
  }
);

router.get(
  "/getAllExpiredAnnouncements",
  auth.authenticateToken,
  (req, res) => {
    var currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    var query =
      "SELECT a.id, a.title, a.content, a.publication_date, a.expiry_date, a.Price, a.status, c.id AS categoryId, c.name AS categoryName FROM announcement AS a INNER JOIN category AS c ON a.categoryId = c.id WHERE a.expiry_date < ? AND a.status = 'published'";
    connection.query(query, [currentDate], (err, results) => {
      if (!err) {
        return res.status(200).json(results);
      } else {
        return res.status(500).json(err);
      }
    });
  }
);

router.get(
  "/archiveExpiredAnnouncements",
  auth.authenticateToken,
  (req, res) => {
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const archiveQuery =
      "UPDATE announcement SET status = 'archived' WHERE expiry_date < ? AND status = 'published'";
    connection.query(archiveQuery, [currentDate], (err, results) => {
      if (!err) {
        const affectedRows = results.affectedRows || 0;
        return res.status(200).json({ message: `${affectedRows} announcements archived.` });
      } else {
        return res.status(500).json({ error: err });
      }
    });
  }
); 



router.get("/notExpiredAnnouncements", (req, res) => {
  var query =
    "select a.id,a.title,a.content,a.publication_date,a.expiry_date,a.Price,a.status,c.id as categoryId,c.name as categoryName from announcement as a inner join category as c where a.categoryId = c.id and a.status='published'";
  // Create SQL query to retrieve not expired announcements
  const sql =
    "SELECT * FROM announcement WHERE expiry_date IS NULL OR expiry_date > NOW()";

  // Execute the query
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching announcements: " + err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Filter out expired announcements
    const notExpiredAnnouncements = results.filter(
      (announcement) =>
        !announcement.expiry_date ||
        new Date(announcement.expiry_date) > new Date()
    );

    return res.status(200).json(notExpiredAnnouncements);
  });
});

router.delete("/removeExpiredAnnouncements", (req, res) => {
  // Create SQL query to delete expired announcements
  const sql =
    "DELETE FROM announcement WHERE expiry_date IS NOT NULL AND expiry_date <= NOW()";

  // Execute the query
  connection.query(sql, (err, result) => {
    if (err) {
      console.error("Error deleting expired announcements: " + err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    return res.status(200).json({
      message: "Expired announcements removed successfully",
      affectedRows: result.affectedRows,
    });
  });
});

router.get(
  "/AllPublishedActiveAnnouncements",
  (req, res) => {
    // Create SQL query to retrieve published and not expired announcements
    const sql =
      'select a.id,a.title,a.content,a.publication_date,a.expiry_date,a.Price,a.status,c.id as categoryId,c.name as categoryName from announcement as a inner join category as c where a.categoryId = c.id and a.status = "published" AND (expiry_date IS NULL OR expiry_date > NOW())';

    // Execute the query
    connection.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching announcements: " + err.message);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      return res.status(200).json(results);
    });
  }
);

//API FOR GETTING ALL PUBLISHED ACTIVE ANNOUNCEMENT BY CATEGORY ID, IMPORTANT!!
router.get(
  "/AllPublishedActiveAnnouncements/:categoryId",
  (req, res) => {
    const { categoryId } = req.params;
    // Create SQL query to retrieve published and not expired announcements for a specific categoryId
    const sql = `
      SELECT 
        a.id,
        a.title,
        a.content,
        a.publication_date,
        a.expiry_date,
        a.Price,
        a.status,
        c.id AS categoryId,
        c.name AS categoryName 
      FROM 
        announcement AS a 
      INNER JOIN 
        category AS c 
      ON 
        a.categoryId = c.id 
      WHERE 
        a.categoryId = ? 
        AND a.status = "published" 
        AND (expiry_date IS NULL OR expiry_date > NOW())`;

    // Execute the query
    connection.query(sql, [categoryId], (err, results) => {
      if (err) {
        console.error("Error fetching announcements: " + err.message);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      return res.status(200).json(results);
    });
  }
);


router.patch(
  "/updateAnnouncement",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res) => {
    let announcement = req.body;
    var query =
      "update announcement set title=?,content=?,categoryId=?,publication_date=?,expiry_date=?,Price=?,status=? where id=?";
    connection.query(
      query,
      [
        announcement.title,
        announcement.content,
        announcement.categoryId,
        announcement.publication_date,
        announcement.expiry_date,
        announcement.Price,
        announcement.status,
        announcement.id,
      ],
      (err, results) => {
        if (!err) {
          if (results.affectedRows == 0) {
            return res
              .status(404)
              .json({ message: "Announcement id does not found" });
          }
          return res
            .status(200)
            .json({ message: "Announcement Updated Successfully" });
        } else {
          return res.status(500).json(err);
        }
      }
    );
  }
);

router.get(
  "/deleteAnnouncement/:id",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res) => {
    const id = req.params.id;
    var query = "delete from announcement where id=?";
    connection.query(query, [id], (err, results) => {
      if (!err) {
        if (results.affectedRows == 0) {
          return res
            .status(404)
            .json({ message: "Announcement id does not found" });
        }
        return res
          .status(200)
          .json({ message: "Announcement Deleted Successfully" });
      } else {
        return res.status(500).json(err);
      }
    });
  }
);

router.get(
  "/getAllPublishedAnnouncementsByMonth",
  auth.authenticateToken,
  (req, res) => {
    // Extract month and year from query parameters
    const { month, year } = req.query;
    
    // Validate input
    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required parameters" });
    }

    // Construct the start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Set to the last day of the month

    // Construct the SQL query to retrieve announcements for the specified month
    var query = `
      SELECT 
        a.id, a.title, a.content, a.publication_date, a.expiry_date, 
        a.price, a.status, c.id as categoryId, c.name as categoryName 
      FROM 
        announcement AS a 
        INNER JOIN category AS c ON a.categoryId = c.id 
      WHERE 
        a.status = 'published' AND 
        a.publication_date >= ? AND 
        a.publication_date <= ?`;
    
    // Execute the query with parameters
    connection.query(query, [startDate, endDate], (err, results) => {
      if (!err) {
        return res.status(200).json(results);
      } else {
        return res.status(500).json(err);
      }
    });
  }
);

router.get(
  "/getTotalPublishedAnnouncementsPerMonth",
  auth.authenticateToken,
  (req, res) => {
    // Query to get the total number of published announcements per month
    var query =
      "SELECT MONTH(publication_date) AS month, YEAR(publication_date) AS year, COUNT(*) AS total_announcements FROM announcement WHERE status = 'published' GROUP BY YEAR(publication_date), MONTH(publication_date)";

    connection.query(query, (err, results) => {
      if (!err) {
        return res.status(200).json(results);
      } else {
        return res.status(500).json(err);
      }
    });
  }
);

router.get("/getAllPublishedAnnouncementByMonth", auth.authenticateToken, (req, res) => {
  const [rows] =
      "SELECT MONTH(publication_date) AS month, COUNT(*) AS total_announcements FROM announcement WHERE status='published' GROUP BY MONTH(publication_date)";
  connection.query(query, (err, results) => {
      if (!err) {
          return res.status(200).json(results);
      } else {
          return res.status(500).json(err);
      }
  });
});


router.get('/exportAnnouncementsToExcel', auth.authenticateToken, async (req, res) => {
  try {
    const [rows, fields] = await connection.query(`
      SELECT a.id, a.title, a.content, a.publication_date, a.expiry_date, a.Price, a.status,
      c.id AS categoryId, c.name AS categoryName
      FROM announcement AS a
      INNER JOIN category AS c ON a.categoryId = c.id
    `);
   

    // Check if no rows are returned
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No announcements found' });
    }

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Announcements');

    // Define Excel headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Content', key: 'content', width: 50 },
      { header: 'Category ID', key: 'categoryId', width: 15 },
      { header: 'Category Name', key: 'categoryName', width: 20 },
      { header: 'Publication Date', key: 'publication_date', width: 20 },
      { header: 'Expiry Date', key: 'expiry_date', width: 20 },
      { header: 'Price', key: 'Price', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // Add data to Excel worksheet
    worksheet.addRows(rows);

    // Set response headers for Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=announcements.xlsx');

    // Send Excel file as response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting announcements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;
