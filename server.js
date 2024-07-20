console.log('Hello worldss')

const express = require('express')
const http = require("http");
const app = express()
const cors = require('cors')
const body_parser = require('body-parser')


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

const loginRouter = require('./router/login');
const userRouter = require('./router/user')
const adminSettingRouter = require('./router/adminSetting')
const connection = require('./DBconnection')
const tokenManager = require('./tokenManager')



app.get('/', function (req, res) {
  res.send('Hello World 19:08:15')
})


const server = http.createServer(app)
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
app.use("/login", loginRouter)
app.use("/user", userRouter)
app.use("/admin/setting", adminSettingRouter)