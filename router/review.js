const express = require("express");
const router = express.Router();
const tokenManager = require('../tokenManager')
const { execQuery } = require("../DBconnection");

const insert_review_query = 
  "INSERT INTO review (student_id, team_id, criteria1, criteria2, criteria3, criteria4) "
	+ "VALUES (?, ?, ?, ?, ?, ?);";
router.post('/', tokenManager.authenticateToken, function (req, res){
	const reviewList = req.body.review_list;
  if (!Array.isArray(reviewList) || reviewList.length === 0) {
    return res.status(400).json({ error: "review_list is empty or not an array" });
	}
	
})

module.exports = router