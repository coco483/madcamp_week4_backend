const express = require("express");
const router = express.Router();
const tokenManager = require('../tokenManager')
const execQuery = require('../DBconnection').execQuery

const find_student_query = 'SELECT * FROM student WHERE (student_id = ? AND (dropped = false))'
function find_student_and_update (req, res, update_query, params) {
  execQuery(res, find_student_query, [req.userid], (rows)=>{
    if (rows.length==0) {
      return res.status(404).send('Student not found')
    } else {
      execQuery(res, update_query, params, (rows) => {
        return res.status(201).send('Successful update')
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
  console.log('[/user/changepassword]', req.body.new_password)
  if (req.body.new_password == null) {
    return res.status(400).send('new_login_id is empty')
  }
  const params = [req.body.new_password, req.userid]
  return find_student_and_update(req, res, update_password_query, params)
})

// 유저 정보 불러오기 =======================================================================
const find_class_query = 'SELECT * FROM class WHERE class_id = ?'
const find_my_team_query =
` SELECT * 
  FROM teammember tm 
  JOIN team t ON tm.team_id = t.team_id 
  WHERE tm.student_id = ? AND t.week = ?;
`
const find_teammate_name_query = 
` SELECT * 
  FROM student s
  JOIN teammember tm ON tm.student_id = s.student_id 
  WHERE (tm.team_id = ? AND tm.student_id != ?) ;
`
router.get('/info', tokenManager.authenticateToken, function (req, res) {
  console.log('[/user/info]')
  execQuery(res, find_student_query, [req.userid], (student_rows)=>{
    if (student_rows.length === 0) {
      return res.status(404).send('Student not found')
    } 
    execQuery(res, find_class_query, [student_rows[0].class_id], (class_rows) => {
      if (class_rows[0].length == 0) {
        return res.status(404).send('Class not found')
      }
      execQuery(res, find_my_team_query, [req.userid, class_rows[0].curr_week], (my_team) => {
        if (my_team.length == 0){
          return res.status(404).send('cannot find team')
        } 
        const team_id = my_team[0].team_id
        execQuery(res, find_teammate_name_query, [team_id, req.userid], (teammateRows) =>{
          const teammateNames = teammateRows.map(row => row.name)
          // 나중에 teammate 찾아서 바꾸기
          return res.status(200).json({
            username: student_rows[0].name,
            login_id: student_rows[0].login_id,
            class_id: student_rows[0].class_id,
            week: class_rows[0].curr_week,
            teammate_name_list: teammateNames
          })
        })
      })
      
    })
    
  })
})

module.exports = router;