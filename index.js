console.log("Hello worldss")

const express = require('express')
const app = express()
const cors = require('cors')
const body_parser = require('body-parser')
const jwt = require('jsonwebtoken');
app.use(cors());
app.use(express.json());
const dotenv = require('dotenv');
dotenv.config();



// connect to mysql server
const mysql = require("mysql2")

const db_info = {
  host: "localhost",
  port: "3306",
  user: "root",
  password: "1234",
  database: "db_week4"
}

const connection = mysql.createConnection({
  host: db_info.host,
  port: db_info.port,
  user: db_info.user,
  password: db_info.password,
  database: db_info.database
})

connection.connect();



// manage tokens
function generateAccessToken(userid) {
  return jwt.sign({userid: userid}, process.env.TOKEN_SECRET, { expiresIn: '3600s' });
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401).send('Token required')
  jwt.verify(token, process.env.TOKEN_SECRET, (err, parse_result) => {
    console.log(err)
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).send('Token expired');
      }
      return res.sendStatus(403).send('Invalid Token');
    }
    req.userid = parse_result.userid
    next()
  })
}


app.get('/', function (req, res) {
  res.send('Hello World 19:08:08')
})



// 로그인 
const check_user_login_query = "SELECT * FROM student WHERE login_id = ? AND password = ? ";
app.post('/login', function (req, res) {
    var body = req.body
    var params = [body.login_id, body.password]
    console.log(params)
    connection.query(check_user_login_query, params, (error, rows) => {
      if(error) throw error;
      else if (rows.length>1) { 
        throw(rows)
      }
      else if (rows.length == 1) {
        const token = generateAccessToken(rows[0].id)
        console.log('token generated: ', token)
        res.status(200).json({'username': rows[0].name, 'token': token, 'is_admin': false});
      }
      else {
        res.status(404).send('cannot find user information')
      }
    })
  })


// 회원 정보 관리
const find_student_query = "SELECT * FROM student WHERE student_id = ?";
function find_student_and_update(req, res, update_query, params) {
  connection.query(find_student_query, [req.userid], (error, results) => {
    if (error) {
      res.status(500).send('Internal Server Error');
    } else if (results.length === 0) {
      res.status(404).send('Student not found');
    } else {
      connection.query(update_query, params, (error, rows) => {
        if (error) {
          res.status(500).send('Internal Server Error');
        } else {
          res.status(200).send('Successful update');
        }
      });
    }
  });
}

const update_loginid_query = "UPDATE student SET login_id = ? WHERE student_id = ?";
app.put('/user/changeid', authenticateToken, function(req, res) {
  const params = [req.body.new_login_id, req.userid]
  find_student_and_update(req, res, update_loginid_query, params)
})

const update_password_query = "UPDATE student SET password = ? WHERE student_id = ?";
app.put('/user/changepassword', authenticateToken, function(req, res) {
  const params = [req.body.new_password, req.userid]
  find_student_and_update(req, res, update_password_query, params)
})

app.listen(8080)