const mysql = require('mysql2')
const db_info = {
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '1234',
  database: 'db_week4'
}
const pool = mysql.createPool({
  host: db_info.host,
  user: db_info.user,
  password: db_info.password,
  database: db_info.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
const promisePool = pool.promise();
const connection = mysql.createConnection({
  host: db_info.host,
  port: db_info.port,
  user: db_info.user,
  password: db_info.password,
  database: db_info.database
})
connection.connect()

async function execQuery(res, query, params, next) {
  try {
    const [rows, fields] = await promisePool.query(query, params);
    next(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = {connection, execQuery, promisePool}