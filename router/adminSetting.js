const express = require("express");
const router = express.Router();
const connection = require('../DBconnection').connection
const tokenManager = require('../tokenManager')
const crypto = require("crypto");
const { execQuery } = require("../DBconnection");

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
  "INSERT INTO class (class_id, review_is_open, curr_week) VALUES (?, false, 1);"
router.post('/addclass', tokenManager.authenticateAdminToken, function (req, res) {
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
router.post('/addstudent', tokenManager.authenticateAdminToken, function (req, res) {
  var class_id = req.body.class_id
  var student_name = req.body.student_name
  console.log("[admin/setting/addstudent]", class_id, student_name)
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

const get_all_class_query = 
"SELECT * FROM class;"
router.get('/classes', tokenManager.authenticateAdminToken, function (req, res) {
  console.log("[admin/setting/classes]")
  execQuery(res, get_all_class_query, [], (classRows) => {
    const class_id_list = classRows.map(row => row.class_id)
    return res.status(200).json({"class_id_list": class_id_list})
  })
})

const get_all_student_query = 
"SELECT * FROM student WHERE (class_id =? AND dropped = false);"
router.get('/studentlist', tokenManager.authenticateAdminToken, function (req, res){
  console.log("[admin/setting/studentlist]", req.body.class_id)
  if (req.body.class_id == null) {
    return res.status(400).send('class_id is empty');
  }
  execQuery(res, get_all_student_query, [req.body.class_id], (studentRows) => {
    const students = studentRows.map(row => ({
      student_id: row.student_id,
      name: row.name,
      login_id: row.login_id,
      password: row.password
    }));
    return res.status(200).json({"students": students});
  })
})

const drop_student_query = 
  "UPDATE student SET dropped = true WHERE (student_id = ?);"
router.put('/dropstudent', tokenManager.authenticateAdminToken, function (req, res){
  console.log("[admin/setting/deletestudent]", req.body.student_id)
  if (req.body.student_id == null) {
    return res.status(400).send('class_id is empty');
  }
  execQuery(res, drop_student_query, [req.body.student_id], (rows) => {
    return res.status(200).send('successful update')
  })
})

module.exports = router