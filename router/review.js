const express = require('express')
const router = express.Router()
const promisePool = require('../DBconnection').promisePool
const tokenManager = require('../tokenManager')
const { execQuery } = require('../DBconnection')

const insert_review_query =
  'INSERT INTO review (student_id, team_id, criteria1, criteria2, criteria3, criteria4) ' +
  'VALUES (?, ?, ?, ?, ?, ?);'
router.post('/', tokenManager.authenticateToken, async function (req, res) {
  const reviewList = req.body.review_list
	console.log("[/review(post)]", reviewList)
  if (!Array.isArray(reviewList) || reviewList.length === 0) {
    return res
      .status(400)
      .json({ error: 'review_list is empty or not an array' })
  }
	let connection;
  try {
    connection = await promisePool.getConnection();
    await connection.beginTransaction();
    const queries = reviewList.map(review => {
      return connection.query(insert_review_query, [
        req.userid,
        review.team_id,
        review.criteria1,
        review.criteria2,
        review.criteria3,
        review.criteria4
      ]);
    });
    await Promise.all(queries);
    await connection.commit();
    res.status(200).json({ message: "All reviews inserted successfully" });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({ error: "Failed to insert reviews", details: err });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

const check_review_open_query =
` SELECT * 
  FROM class c
  JOIN student s ON s.class_id = c.class_id 
  WHERE student_id = ? ;
`
router.get('/', tokenManager.authenticateToken, function (req, res){
  console.log("[/review(get)]")
	execQuery(res, check_review_open_query, [req.userid], ( row ) => {
		if (row.length == 0){
			return res.status(404).send('cannot find student')
		}
		const week = row[0].curr_week
		const class_id = row[0].class_id
		const review_is_open = row[0].review_is_open
    console.log("review get", week, class_id, review_is_open, row[0])
		res.status(200).json({review_is_open: review_is_open, week:week, class_id:class_id})
	})
})

module.exports = router
