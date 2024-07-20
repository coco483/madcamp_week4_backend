const express = require("express");
const router = express.Router();
const connection = require('../DBconnection')
const tokenManager = require('../tokenManager')

const find_student_query = 'SELECT * FROM student WHERE (student_id = ? AND dropped = false)'
function find_student_and_update (req, res, update_query, params) {
  connection.query(find_student_query, [req.userid], (error, rows) => {
    if (error) {
      console.log(error)
      return res.status(500).send('Internal Server Error')
    } else if (rows.length == 0) {
      return res.status(404).send('Student not found')
    } else {
      connection.query(update_query, params, (error, rows) => {
        if (error) {
          console.log(error)
          return res.status(500).send('Internal Server Error')
        } else {
          return res.status(200).send('Successful update')
        }
      })
    }
  })
}

const update_loginid_query =
  'UPDATE student SET login_id = ? WHERE student_id = ?'
router.put('/changeid', tokenManager.authenticateToken, function (req, res) {
  if (req.body.new_login_id == null) {
    return res.status(400).send('new_login_id is empty')
  }
  const params = [req.body.new_login_id, req.userid]
  return find_student_and_update(req, res, update_loginid_query, params)
})

const update_password_query =
  'UPDATE student SET password = ? WHERE student_id = ?'
router.put('/changepassword', tokenManager.authenticateToken, function (req, res) {
  if (req.body.new_password == null) {
    return res.status(400).send('new_login_id is empty')
  }
  const params = [req.body.new_password, req.userid]
  return find_student_and_update(req, res, update_password_query, params)
})

// 유저 정보 불러오기 =======================================================================
const find_class_query = 'SELECT * FROM class WHERE class_id = ?'
const find_teammate_query =
  'SELECT * FROM TEAM WHERE (week = ? AND (student1_id = ? OR student2_id = ?))'
router.get('/info', tokenManager.authenticateToken, function (req, res) {
  connection.query(find_student_query, [req.userid], (error, student_rows) => {
    if (error) {
      console.log('[/user/info] student db query error')
      return res.status(500).send('Internal Server Error')
    } else if (student_rows.length == 0) {
      console.log('[/user/info] Student not found')
      return res.status(404).send('Student not found')
    } else {
      connection.query(
        find_class_query,
        student_rows[0].class_id,
        (error, class_rows) => {
          if (error) {
            console.log('[/user/info] class db query error')
            return res.status(500).send('Internal Server Error')
          } else if (class_rows[0].length == 0) {
            console.log('[/user/info] class not found')
            return res.status(404).send('Internal Database Error')
          } else {
            return res.status(200).json({
              username: student_rows[0].student_id,
              login_id: student_rows[0].login_id,
              class_id: student_rows[0].class_id,
              week: class_rows[0].review_week,
              teammate: 'teammate'
            })
          }
        }
      )
    }
  })
})

module.exports = router;