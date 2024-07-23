const express = require("express");
const router = express.Router();
const { execQuery } = require("../DBconnection");

const get_all_teams_with_students_query = 
` SELECT team.team_id, student.name
  FROM team
  JOIN teammember ON team.team_id = teammember.team_id
  JOIN student ON student.student_id = teammember.student_id
  WHERE team.class_id = ? AND week = ?
  ORDER BY team.presentation_order;`;

router.put("/", (req, res) => {
  const week = req.body.week
  const class_id = req.body.class_id
	console.log("[/teamlist]", week, class_id)
  if (class_id == null) {
    return res.status(400).send("class_id is empty")
  } else if (week == null) {
    return res.status(400).send("week is empty")
  }
  execQuery(res, get_all_teams_with_students_query, [class_id, week], (rows) => {
    const teams = [];
    const teamMap = {};

    rows.forEach(row => {
      if (!teamMap[row.team_id]) {
        const newTeam = {
          team_id: row.team_id,
          student_name_list: []
        };
        teamMap[row.team_id] = newTeam;
        teams.push(newTeam);
      }
      teamMap[row.team_id].student_name_list.push(row.name);
    });
    return res.status(200).json({"team_list":teams});
  });
})


module.exports = router