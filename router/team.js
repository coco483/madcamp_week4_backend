const express = require("express");
const router = express.Router();
const tokenManager = require('../tokenManager')
const execQuery = require('../DBconnection').execQuery

const find_team_query = "SELECT * FROM team WHERE (code = ?)"
const find_student_query = 'SELECT * FROM student WHERE (student_id = ? AND (dropped = false))'
const make_team_query = 
  "INSERT INTO team (class_id, week, code, teammate_num) VALUES (?, ?, ?, ?);"
const add_me_to_teammember = 
  "INSERT INTO teammember (team_id, student_id) VALUES (?, ?);"
// 팀 생성하기 =====================================================================================
router.post('/maketeam', tokenManager.authenticateToken, function (req, res) {
  console.log('[/teams/maketeam]', req.userid, req.body.week, req.body.code, req.body.teammate_num)
  const week = req.body.week
  const code = req.body.code
  const teammate_num = req.body.teammate_num
  if ( week == null) {
    return res.status(400).send('주차를 입력해 주세요')
  } else if ( code == null) {
    return res.status(400).send('팀명을 입력해 주세요')
  } else if ( teammate_num == null) {
    return res.status(400).send('인원수를 입력해 주세요')
  } 
  execQuery(res, find_team_query, [code], (team_using_code) => {
    if (team_using_code.length > 0){
      return res.status(403).send('누군가가 같은 팀명을 사용하고 있습니다')
    }
    execQuery(res, find_student_query, [req.userid], (studentRows)=> {
      if (studentRows.length == 0) {
        return res.status(404).send('Student not found')
      }
      execQuery(res, make_team_query, [studentRows[0].class_id, week, code, teammate_num], (teamRows) => {
        execQuery(res, add_me_to_teammember, [teamRows.insertId, req.userid], (rows) => {
          return res.status(201).send("successful update")
        })
      })
    })
  })
})

// 팀에 참여하기 =================================================================================
const get_teammates_query =
  'SELECT * FROM teammember WHERE team_id = ?';
router.post('/jointeam', tokenManager.authenticateToken, function (req, res) {
  console.log('[/teams/jointeam]', req.userid, req.body.code)
  const code = req.body.code
  if (code == null) {
    return res.status(400).send('코드를 입력해 주세요')
  }
  execQuery(res, find_team_query, [code], (team_using_code) => {
    if (team_using_code.length == 0) {
      return res.status(404).send('팀을 찾을 수 없습니다')
    } 
    const team_id = team_using_code[0].team_id
    execQuery(res, get_teammates_query, [team_id], (teammateRows)=> {
      if (teammateRows.length >= team_using_code[0].teammate_num) {
        return res.status(403).send('팀의 인원이 이미 가득 찼습니다.')
      }
      const userFound = teammateRows.some((key) => {
        if (key.student_id == req.userid) {
          res.status(403).send('이미 팀에 참여하셨습니다');
          return true;
        }
        return false;
      });
      if (userFound) {return;}
      console.log("--------------------")
      execQuery(res, add_me_to_teammember, [team_id, req.userid], (rows) => {
        return res.status(201).send("successful update")
      })
    })
  })
})

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
// 나의 팀메이트 목록 ==============================================================================
router.get('/teammates', tokenManager.authenticateToken, function (req, res) {
  const week = req.query.week
  console.log('[/teams/teammates]', req.userid, week)
  if (week == null) {
    return res.status(400).send('week is missing')
  }
  execQuery(res, find_my_team_query, [req.userid, week], (my_team) => {
    if (my_team.length == 0){
      return res.status(200).json({teammates: []})
    } 
    console.log("team name:", my_team[0].code)
    const team_id = my_team[0].team_id
    execQuery(res, find_teammate_name_query, [team_id, req.userid], (teammateRows) =>{
      const teammateNames = teammateRows.map(row => row.name)
      return res.status(200).json({teammates: teammateNames})
    })
  })
})

module.exports = router;