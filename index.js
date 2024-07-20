console.log('Hello worldss')

const express = require('express')
const app = express()
const cors = require('cors')
const body_parser = require('body-parser')
const jwt = require('jsonwebtoken')
app.use(cors())
app.options('*', cors())
app.use(body_parser.json())
const dotenv = require('dotenv')
dotenv.config()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*') // Restrict to specific domain
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})

// connect to mysql server ===========================================================
const mysql = require('mysql2')
const db_info = {
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '1234',
  database: 'db_week4'
}
const connection = mysql.createConnection({
  host: db_info.host,
  port: db_info.port,
  user: db_info.user,
  password: db_info.password,
  database: db_info.database
})
connection.connect()


// manage tokens ======================================================================
function generateAccessToken (userid) {
  var payload = { userid: userid }
  return jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: '3600s'
  })
}
function authenticateToken (req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null)
    return res.sendStatus(401).json({ error: 'Token required' })
  jwt.verify(token, process.env.TOKEN_SECRET, (err, parse_result) => {
    if (err) {
      console.log(err)
      if (err.name === 'TokenExpiredError') {
        console.log('Token is expired')
        return res.status(403).json({ error: 'Token expired' })
      } else {
        console.log('invalid token')
        return res.status(403).json({ error: 'Invalid Token' })
      }
    }
    req.userid = parse_result.userid
    next()
  })
}
function generateAdminAccessToken () {
  var payload = { is_admin: true }
  return jwt.sign(payload, process.env.TOKEN_SECRET_ADMIN, {
    expiresIn: '3600s'
  })
}
function authenticateAdminToken (req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null)
    return res.sendStatus(401).json({ error: 'Admin Token required' })
  jwt.verify(token, process.env.TOKEN_SECRET_ADMIN, (err, parse_result) => {
    if (err) {
      console.log(err)
      if (err.name === 'TokenExpiredError') {
        console.log('Token is expired')
        return res.status(403).json({ error: 'Admin Token expired' })
      } else {
        console.log('invalid token')
        return res.status(403).json({ error: 'Invalid Admin Token' })
      }
    }
    next()
  })
}



app.get('/', function (req, res) {
  res.send('Hello World 19:08:15')
})


// 로그인 ===============================================================================
const check_user_login_query =
  'SELECT * FROM student WHERE login_id = ? AND password = ? '
app.post('/login', function (req, res) {
  var login_id = req.body.login_id
  var password = req.body.password
  if (login_id == null) {
    return res.status(400).send('login_id missing in body')
  } else if (password == null) {
    return res.status(400).send('password missing in body')
  } else if (login_id == process.env.ADMIN_LOGIN_ID && password == process.env.ADMIN_PASSWORD) {
    var admin_token = generateAdminAccessToken()
    return res
      .status(200)
      .json({username: "admin", token: admin_token, is_admin: true})
  }
  var params = [login_id, password]
  console.log(params)
  connection.query(check_user_login_query, params, (error, rows) => {
    if (error) throw error
    else if (rows.length > 1) {
      throw rows
    } else if (rows.length == 1) {
      var token = generateAccessToken(rows[0].student_id)
      return res
        .status(200)
        .json({ username: rows[0].name, token: token, is_admin: false })
    } else {
      return res.status(404).send('cannot find user information')
    }
  })
})


// 회원 정보 관리 ( 아이디/비번 변경 ) =====================================================
const find_student_query = 'SELECT * FROM student WHERE student_id = ?'
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
app.put('/user/changeid', authenticateToken, function (req, res) {
  if (req.body.new_login_id == null) {
    return res.status(400).send('new_login_id is empty')
  }
  const params = [req.body.new_login_id, req.userid]
  return find_student_and_update(req, res, update_loginid_query, params)
})

const update_password_query =
  'UPDATE student SET password = ? WHERE student_id = ?'
app.put('/user/changepassword', authenticateToken, function (req, res) {
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
app.get('/user/info', authenticateToken, function (req, res) {
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





app.listen(8080)
