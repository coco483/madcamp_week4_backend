const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

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

module.exports = {generateAccessToken, authenticateToken, generateAdminAccessToken, authenticateAdminToken}