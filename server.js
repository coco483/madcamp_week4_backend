console.log('Hello worldss')

const express = require('express')
const http = require("http");
const cors = require('cors')
const body_parser = require('body-parser')
const dotenv = require('dotenv')

dotenv.config()
const app = express()
app.use(cors({
  origin: '*', // Replace '*' with your frontend domain if possible
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type, Authorization',
}));
app.use(body_parser.json())



app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*') // Restrict to specific domain
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization', 'ngrok-skip-browser-warning')
  next()
})

const loginRouter = require('./router/login');
const userRouter = require('./router/user')
const adminSettingRouter = require('./router/adminSetting')
const teamRouter = require('./router/team')
const adminOperateRouter = require('./router/adminOperate')
const reviewRouter = require('./router/review')
const teamlistRouter = require('./router/teamlist')

app.get('/', function (req, res) {
  res.send('Hello World 19:11:15')
})


const server = http.createServer(app)
const PORT = 8000;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
app.use("/login", loginRouter)
app.use("/user", userRouter)
app.use("/admin/setting", adminSettingRouter)
app.use("/team", teamRouter)
app.use('/admin/operate', adminOperateRouter)
app.use('/review', reviewRouter)
app.use('/teamlist', teamlistRouter)