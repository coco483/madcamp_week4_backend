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

function execQuery(res, query, params, next) {
  connection.connect()
  connection.query(query, params, (error, rows)=> {
    if (error) {
      console.log(error)
      return res.status(500).send('Internal Server Error')
    }
    else {
      connection.destroy();
      next(rows)
    }
  } )
}

module.exports = {connection, execQuery}