const express = require("express");
const connection = require("../connection");
const router = express.Router();
let ejs = require("ejs");
let pdf = require("html-pdf");
let path = require("path");
var fs = require("fs");
var uuid = require("uuid");
var auth = require("../services/authentication");
const moment = require('moment-timezone');


router.post("/generateReport", auth.authenticateToken, (req, res) => {
  const createAnnouncement = req.body;
  const name = createAnnouncement.name;
  const generatedUuid = `${name}_${uuid.v1()}`; // Include name in the UUID
  const announcementDetailsReport = JSON.parse(
    createAnnouncement.announcementDetails 
  );

  // Convert the invoice date to Africa/Johannesburg time zone
  const invoiceDate = moment.tz(createAnnouncement.invoice_date, 'Africa/Johannesburg').format('YYYY-MM-DD');

  const query =
    "INSERT INTO invoice (invoice_date, uuid, name, email, contactNumber, announcementDetails, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)";
  connection.query(
    query,
    [
      invoiceDate,
      generatedUuid,
      createAnnouncement.name,
      createAnnouncement.email,
      createAnnouncement.contactNumber,
      createAnnouncement.announcementDetails,
      res.locals.email,
    ],
    (err, results) => {
      if (!err) {
        ejs.renderFile(
          path.join(__dirname, "", "report.ejs"),
          {
            announcementDetails: announcementDetailsReport,
            invoice_date: invoiceDate, // Use the converted invoice date
            name: createAnnouncement.name,
            email: createAnnouncement.email,
            contactNumber: createAnnouncement.contactNumber,
          },
          (err, results) => {
            if (err) {
              return res.status(500).json(err);
            } else {
              pdf.create(results).toFile(
                "./generated_pdf/" + generatedUuid + ".pdf",
                function (err, data) {
                  if (err) {
                    console.log(err);
                    return res.status(500).json(err);
                  } else {
                    return res.status(200).json({ uuid: generatedUuid });
                  }
                }
              );
            }
          }
        );
      } else {
        return res.status(500).json(err);
      }
    }
  );
}); 



router.post('/getPdf',auth.authenticateToken,function(req,res){
  const createAnnouncement = req.body;
  const pdfPath = './generated_pdf/'+createAnnouncement.uuid+'.pdf';
  if(fs.existsSync(pdfPath)){
    res.contentType("application/pdf");
    fs.createReadStream(pdfPath).pipe(res);
  }
  else{
    var announcementDetailsReport = JSON.parse(createAnnouncement.announcementDetails);
    if (!err) {
      ejs.renderFile(
        path.join(__dirname, "", "report.ejs"),
        {
          announcementDetails: announcementDetailsReport,
          invoice_date: createAnnouncement.invoice_date,
          name: createAnnouncement.name,
          email: createAnnouncement.email,
          contactNumber: createAnnouncement.contactNumber,
         
        },
        (err, results) => {
          if (err) {
            return res.status(500).json(err);
          } else {
            pdf
              .create(results)
              .toFile(
                "./generated_pdf/" + createAnnouncement.uuid + ".pdf",
                function (err, data) {
                  if (err) {
                    console.log(err);
                    return res.status(500).json(err);
                  } else {
                    res.contentType("application/pdf");
                    fs.createReadStream(pdfPath).pipe(res);
                  }
                }
              );
          }
        }
      );
    } 
    
  }
})

router.get('/getBills',auth.authenticateToken,(req,res,next)=>{
  var query = "select *from invoice order by id DESC";
  connection.query(query,(err,results)=>{
    if(!err){
      return res.status(200).json(results);
    }
    else{
      return res.status(500).json(err);
    }
  })
})

router.delete('/delete/:id',auth.authenticateToken,(req,res,next)=>{
  const id = req.params.id;
  var query = "delete from invoice where id=?";
  connection.query(query,[id],(err,results)=>{
    if(!err){
      if(results.affectedRows == 0){
        return res.status(404).json({message:"Invoice id does not found"})
      }
      return res.status(200).json({message:"Invoice Deleted Successfully"});

    }
    else{
      return res.status(500).json(err);
    }
  })
})




module.exports = router;
