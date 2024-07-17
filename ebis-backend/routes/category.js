
const express = require('express');
const connection = require('../connection');
const router = express.Router();
var auth = require('../services/authentication');
var checkRole = require('../services/checkRole');

router.post("/addNewCategory",auth.authenticateToken,checkRole.checkRole,(req,res,next)=>{
    let category = req.body;
    query = "insert into category (name) values(?)";
    connection.query(query,[category.name],(err,results)=>{
        if(!err){
            return res.status(200).json({message:"Category Added Successfully"});
        }
        else{
            return res.status(500).json(err);

        }
    })
})

router.get('/getAllCategory',(req,res,next)=>{
    var query = "select *from category order by name";
    connection.query(query,(err,results)=>{
        if(!err){
            return res.status(200).json(results);
        }
        else{
            return res.status(500).json(err);
        }
    })

})

router.get('/getAllCategoryById/:id',auth.authenticateToken,(req,res,next)=>{
    const id = req.params.id;
    var query = 'SELECT * FROM category WHERE id = ?';
    connection.query(query, [id], (err, results) => {
        if (!err) {
            if (results.length === 0) {
                return res.status(404).json({ message: "Category ID does not found" });
            }
            return res.status(200).json(results);
          }
          else {
            return res.status(500).json(err);
        }
        });
})

router.patch("/updateCategory", auth.authenticateToken,checkRole.checkRole,(req, res, next) => {
    let category = req.body;
    var query = "update category set name=? where id=?";
    connection.query(query, [category.name, category.id], (err, results) => {
      if (!err) {
        if (results.affectedRows == 0) {
          return res.status(404).json({ message: "Category ID does not found" });
        }
        return res.status(200).json({ message: "Category Updated Successfully" });
      } else {
        return res.status(500).json(err);
      }
    });
  });
  

module.exports = router;
