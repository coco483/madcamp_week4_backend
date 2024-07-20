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
module.exports = connection