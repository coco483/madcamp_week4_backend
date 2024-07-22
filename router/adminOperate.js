const express = require("express");
const router = express.Router();
const promisePool = require('../DBconnection').promisePool
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
const get_team_members = 
  `SELECT s.name 
  FROM teammember ts 
  JOIN student s ON ts.student_id = s.student_id 
  WHERE ts.team_id = ?`
router.get('/calculate', tokenManager.authenticateAdminToken, function (req, res){
  const class_id = req.body.class_id
  const week = req.body.week
  if (class_id == null) {
    return res.status(400).send("class_id is empty")
  } else if (week == null) {
    return res.status(400).send("week is empty")
  }
  execQuery(res, get_all_review_query, [class_id, week], async (reviews) => {
    const studentScores = {};
    reviews.forEach(review => {
      if (!studentScores[review.student_id]) {
        studentScores[review.student_id] = { 1: [], 2: [], 3: [], 4: [] };
      }
      studentScores[review.student_id][1].push(review.criteria1);
      studentScores[review.student_id][2].push(review.criteria2);
      studentScores[review.student_id][3].push(review.criteria3);
      studentScores[review.student_id][4].push(review.criteria4);
    });
    const aves = {};
    const stds = {};
    // Calculate mean and standard deviation for each student
    Object.keys(studentScores).forEach(student_id => {
      aves[student_id] = {};
      stds[student_id] = {};
      for (let n = 1; n <= 4; n++) {
        const scores = studentScores[student_id][n];
        const mean = calculateMean(scores);
        const stdDev = calculateStandardDeviation(scores, mean);
        aves[student_id][n] = mean;
        stds[student_id][n] = stdDev;
      }
    });
    const teamScores = {};
    reviews.forEach(review => {
      if (!teamScores[review.team_id]){
        teamScores[review.team_id] = 0;
      }
      const student_id = review.student_id
      const team_id = review.team_id
      const criteria = [review.criteria1, review.criteria2, review.criteria3, review.criteria4];
      const score = criteria.reduce((total, criterion, index) => {
        return total + standardize(criterion, aves[student_id][index + 1], stds[student_id][index + 1]);
      }, 0);
      teamScores[team_id] += score;
    })
    let sortedTeams = Object.entries(teamScores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([team_id, score]) => ({ team_id, score }));
    let connection;
    try {
      connection = await promisePool.getConnection();
      await connection.beginTransaction();
  
      const queries = sortedTeams.map(async (team) => {
        const [rows] = await connection.query(get_team_members, [team.team_id]);
        team.team_member_list = rows.map(obj => obj.name);
        return team;
      });
  
      sortedTeams = await Promise.all(queries);
      await connection.commit();
  
      res.status(200).json({ sortedTeams });
    } catch (err) {
      if (connection) {
        await connection.rollback();
      }
      res.status(500).json({ error: "Failed to fetch team members", details: err });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  })
})

module.exports = router