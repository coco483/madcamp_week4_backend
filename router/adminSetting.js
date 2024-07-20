const express = require("express");
const router = express.Router();
const connection = require('../DBconnection')
const tokenManager = require('../tokenManager')
const crypto = require("crypto")

const find_last_class_id = 
  "SELECT * FROM class ORDER BY class_id DESC LIMIT 1;"
function getNewClassId(res, callback) {
	connection.query(find_last_class_id, (err, result) =>{
    if (err) {
      console.log(err)
      return res.status(500).send('Internal Server Error')
    } else {
      const newClassId = (result[0].class_id + 1).toString();
      callback(newClassId);
    }
  })
}
const add_class_query =
  "INSERT INTO class (class_id, review_is_open, review_week) VALUES (?, false, 1);"
router.get('/addclass', tokenManager.authenticateAdminToken, function (req, res) {
  getNewClassId(res, (newClassId) => {
    connection.query(add_class_query, [newClassId], (err, result) => {
      if (err) {
        console.log('[/admin/addclass] class db query error')
        return res.status(500).send('Internal Server Error')
      } else {
        return res.status(200).json({new_class_id: newClassId})
      }
    })
  })
  
})

const find_last_student_id = 
  "SELECT * FROM student ORDER BY student_id DESC LIMIT 1;"
function getNewStudentId(res, callback) {
  connection.query(find_last_student_id, (err, result) =>{
    if (err) {
      console.log(err)
      return res.status(500).send('Internal Server Error')
    } else {
      const newStudentId = (result[0].student_id + 1).toString();
      callback(newStudentId);
    }
  })
}

const add_student_query = 
  "INSERT INTO student (student_id, class_id, name, login_id, password, dropped) VALUES (?, ?, ?, ?, ?, false);"
router.get('/addstudent', tokenManager.authenticateAdminToken, function (req, res) {
  var class_id = req.body.class_id
  var student_name = req.body.student_name
  if (class_id == null) {
    return res.status(400).send('class_id is empty');
  } else if (student_name == null) {
    return res.status(400).send('student_name is empty');
  }
  getNewStudentId(res, (newStudentId) => {
    var initial_login_id = "madcamp" + newStudentId;
    var initial_password = crypto.randomBytes(4).toString('hex')
    connection.query(add_student_query, [newStudentId, class_id, student_name, initial_login_id, initial_password], (err, result) => {
      if (err) {
        console.log(err)
        return res.status(500).send('Internal Server Error')
      } else {
        return res.status(200).json({
          initial_login_id: initial_login_id,
          initial_password: initial_password
        })
      }
    })
  })
})

module.exports = router