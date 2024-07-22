const express = require("express");
const router = express.Router();
const connection = require('../DBconnection').connection
const tokenManager = require('../tokenManager')
const execQuery = require('../DBconnection').execQuery

const check_user_login_query =
  'SELECT * FROM student WHERE (login_id = ? AND password = ? AND dropped = false);'
router.post('/', (req, res) => {
    var login_id = req.body.login_id
    var password = req.body.password
    if (login_id == null) {
        return res.status(400).send('login_id missing in body')
    } else if (password == null) {
        return res.status(400).send('password missing in body')
    } else if (
        login_id == process.env.ADMIN_LOGIN_ID &&
        password == process.env.ADMIN_PASSWORD
    ) {
        var admin_token = tokenManager.generateAdminAccessToken()
        return res
        .status(200)
        .json({ username: 'admin', token: admin_token, is_admin: true })
    }
    var params = [login_id, password]
    console.log(params)
    execQuery(res, check_user_login_query, params, (rows) => {
        if (rows.length == 0) {
            return res.status(404).send('cannot find user information')
        }
        var token = tokenManager.generateAccessToken(rows[0].student_id)
        return res
            .status(200)
            .json({ username: rows[0].name, token: token, is_admin: false })
    })
})

module.exports = router;