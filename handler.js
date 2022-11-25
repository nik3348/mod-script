'use strict';
const { Pool } = require('pg')
const AWS = require("aws-sdk")
AWS.config = {
    region:"us-west-2"
};

module.exports.run = async (event, context, callback) => {
  var username_params = {
    Name: '/green/workplace-squad/moderate/demo/database-username', 
    WithDecryption: true 
  };
  var password_params = {
    Name: '/green/workplace-squad/moderate/demo/database-password', 
    WithDecryption: true 
  };

  const ssm = new AWS.SSM({apiVersion: '2014-11-06'});
  const url = 'moderatedemodb.czzi4jdmsqzz.us-west-2.rds.amazonaws.com'
  const username = await ssm.getParameter(username_params).promise()
  const password = await ssm.getParameter(password_params).promise()

  console.log(username.Parameter.Value)
  console.log(password.Parameter.Value)
  const pool = new Pool({
    user: username.Parameter.Value,
    host: url,
    database: 'wpappdb',
    password: password.Parameter.Value,
    port: 5432,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 0,
  })
  pool.connect().then(async client => {
    try {
      console.log("DB CONNECTED")

      await client.query(`SELECT COUNT(*) FROM pcr_event`, (err, res) => {
        if (err) {
          console.log(err.stack)
        } else {
          console.log(res)
        }
      })
      // await client.query(`CREATE TEMPORARY TABLE temp_pcr_id(id VARCHAR(255))`, (err, res) => {
      //   if (err) {
      //     console.log(err.stack)
      //   } else {
      //     console.log(res)
      //   }
      // })

      // await client.query(`
      //   INSERT INTO temp_pcr_id
      //   SELECT pcr.pcr_id
      //   FROM post_comment_reply pcr
      //   LEFT JOIN (
      //       SELECT v_alert_pcr_id , count(1) as v_alert_count FROM activity_event
      //       GROUP BY v_alert_pcr_id
      //   ) e on e.v_alert_pcr_id = pcr.pcr_id
      //   LEFT JOIN (
      //       SELECT pcr_id, SUM(CASE WHEN e.pcr_event_id IS NULL THEN 0 ELSE 1 END) as pcr_event_count FROM pcr_event p
      //       LEFT JOIN activity_event e ON p.event_id = e.pcr_event_id
      //       GROUP BY pcr_id
      //   ) e2 on e2.pcr_id = pcr.pcr_id
      //   LEFT JOIN (
      //       SELECT pcr_id, MAX(time_notified) as time_notified FROM pcr_event
      //       GROUP BY pcr_id
      //   ) n on n.pcr_id = pcr.pcr_id
      //   LEFT JOIN user_tracking_rule utr on pcr.author_id = utr.user_id AND preserve_old_pcrs = true
      //   WHERE 
      //   COALESCE(v_alert_count, 0) = 0 AND
      //   COALESCE(pcr_event_count, 0) = 0 AND
      //   DATE_PART('day', now() - time_notified ) > 31 AND
      //   utr.user_id IS NULL
      //   LIMIT 10
      // `, (err, res) => {
      //   if (err) {
      //     console.log(err.stack)
      //   } else {
      //     console.log(res)
      //   }
      // })

      // await client.query(`
      //   DELETE FROM pcr_event where pcr_id in (
      //     SELECT id from temp_pcr_id
      //   );
      // `, (err, res) => {
      //   if (err) {
      //     console.log(err.stack)
      //   } else {
      //     console.log(res)
      //   }
      // })

      // await client.query(`
      //   DELETE FROM pcr_velocity_count_history where pcr_id in (
      //     SELECT id from temp_pcr_id
      //   );
      // `, (err, res) => {
      //   if (err) {
      //     console.log(err.stack)
      //   } else {
      //     console.log(res)
      //   }
      // })

      // await client.query(`
      //   DELETE FROM post_comment_reply where pcr_id in (
      //     SELECT id from temp_pcr_id
      //   );
      // `, (err, res) => {
      //   if (err) {
      //     console.log(err.stack)
      //   } else {
      //     console.log(res)
      //   }
      // })
    } catch (err) {
      console.log(err)
    } finally {
      client.release();
    }
  })

  await pool.end()

  return callback(null)
};
