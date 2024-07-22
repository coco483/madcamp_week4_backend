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

module.exports = router
