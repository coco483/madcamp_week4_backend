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

const http = require('http')

// Create the server
const server = http.createServer((req, res) => {
    // Set the response header
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    // Send the response body
    res.end('Hello, World!\n');
});

// Start the server and listen on the defined port
server.listen(3000, () => {
    console.log(`Server is running and listening on port 3000`);
});