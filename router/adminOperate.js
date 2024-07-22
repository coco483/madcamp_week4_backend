const express = require("express");
const router = express.Router();
const tokenManager = require('../tokenManager')
const { execQuery } = require("../DBconnection");


const get_all_teams_query
  = "SELECT team_id FROM team WHERE (class_id = ? AND week = ?)" 
const update_team_order_query
  = "UPDATE team SET presentation_order = ? WHERE team_id = ?;"
router.put('/setorder', tokenManager.authenticateAdminToken, function (req, res){
  const week = req.body.week
  const class_id = req.body.class_id
  if (class_id == null) {
    return res.status(400).send("class_id is empty")
  } else if (week == null) {
    return res.status(400).send("week is empty")
  }
  execQuery(res, get_all_teams_query, [class_id, week], (teams) => {
    if (teams.length === 0) {
      return res.status(404).send({ error: "No teams found" });
    }
    const shuffledTeams = teams.map(team => team.team_id).sort(() => Math.random() - 0.5);

    const queries = shuffledTeams.map((team_id, index) => ({
      query: update_team_order_query,
      params: [index + 1, team_id]
    }));

    // Execute update queries in series or parallel
    Promise.all(queries.map(q => execQuery(res, q.query, q.params, (rows)=>{})))
      .then(() => res.status(200).json({ message: "Presentation order assigned successfully" }))
      .catch(err => res.status(500).json({ error: "Failed to update presentation order", details: err }));
  });
})

const set_review_open_query = 
  "UPDATE class SET review_is_open = true, curr_week = ? WHERE (class_id = ?);"
router.put("/startreview", tokenManager.authenticateAdminToken, function (req, res){
  const class_id = req.body.class_id
  const week = req.body.week
  if (class_id == null) {
    return res.status(400).send("class_id is empty")
  } else if (week == null) {
    return res.status(400).send("week is empty")
  }
  execQuery(res, set_review_open_query, [week, class_id], (rows) => {
    return res.status(200).send('review is available now')
  })
})

const get_all_review_query = 
  ` SELECT * 
  FROM review r
  JOIN team t ON t.team_id = r.team_id 
  WHERE (t.class_id = ? AND t.week = ?) ;`
function standardize(value, mean, standardDeviation) {
  if (standardDeviation === 0) {
    return 0
  }
  return (value - mean) / standardDeviation;
}
function calculateMean(scores) {
  const sum = scores.reduce((a, b) => a + b, 0);
  return sum / scores.length;
}
function calculateStandardDeviation(scores, mean) {
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  return Math.sqrt(variance);
}
router.get('/calculate', tokenManager.authenticateAdminToken, function (req, res){
  const class_id = req.body.class_id
  const week = req.body.week
  if (class_id == null) {
    return res.status(400).send("class_id is empty")
  } else if (week == null) {
    return res.status(400).send("week is empty")
  }
  execQuery(res, get_all_review_query, [class_id, week], (reviews) => {
    const studentScores = {};
    reviews.forEach(review => {
      if (!studentScores[review.student_id]) {
        studentScores[review.student_id] = { score1: [], score2: [] };
      }
      studentScores[review.student_id].score1.push(review.score1);
      studentScores[review.student_id].score2.push(review.score2);
    });
    const statistics = {};
    // Calculate mean and standard deviation for each student
    Object.keys(studentScores).forEach(student_id => {
      const scores1 = studentScores[student_id].score1;
      const scores2 = studentScores[student_id].score2;

      const mean1 = calculateMean(scores1);
      const mean2 = calculateMean(scores2);

      const stdDev1 = calculateStandardDeviation(scores1, mean1);
      const stdDev2 = calculateStandardDeviation(scores2, mean2);

      statistics[student_id] = {
        mean_score1: mean1,
        stdDev_score1: stdDev1,
        mean_score2: mean2,
        stdDev_score2: stdDev2,
      };
    })
  })
})

module.exports = router