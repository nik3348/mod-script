CREATE TEMPORARY TABLE temp_pcr_id(
   id VARCHAR(255)
);

INSERT INTO temp_pcr_id
SELECT pcr.pcr_id
FROM post_comment_reply pcr
LEFT JOIN (
    SELECT v_alert_pcr_id , count(1) as v_alert_count FROM activity_event
    GROUP BY v_alert_pcr_id
) e on e.v_alert_pcr_id = pcr.pcr_id
LEFT JOIN (
    SELECT pcr_id, SUM(CASE WHEN e.pcr_event_id IS NULL THEN 0 ELSE 1 END) as pcr_event_count FROM pcr_event p
    LEFT JOIN activity_event e ON p.event_id = e.pcr_event_id
    GROUP BY pcr_id
) e2 on e2.pcr_id = pcr.pcr_id
LEFT JOIN (
    SELECT pcr_id, MAX(time_notified) as time_notified FROM pcr_event
    GROUP BY pcr_id
) n on n.pcr_id = pcr.pcr_id
LEFT JOIN user_tracking_rule utr on pcr.author_id = utr.user_id AND preserve_old_pcrs = true
WHERE 
 COALESCE(v_alert_count, 0) = 0 AND
 COALESCE(pcr_event_count, 0) = 0 AND
 DATE_PART('day', now() - time_notified ) > 31 AND
 utr.user_id IS NULL;

DELETE FROM pcr_event where pcr_id in (
    SELECT id from temp_pcr_id
);

DELETE FROM pcr_velocity_count_history where pcr_id in (
    SELECT id from temp_pcr_id
);

DELETE FROM post_comment_reply where pcr_id in (
    SELECT id from temp_pcr_id
);

DROP TABLE temp_pcr_id;
