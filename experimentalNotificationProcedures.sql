DROP PROCEDURE IF EXISTS update_lastSentToSalesforce; 

DELIMITER $$

CREATE PROCEDURE update_lastSentToSalesforce (
	dbClockTime VARCHAR(40),
	idList VARCHAR(300),
	OUT dbClockTime2 VARCHAR(40)
)
BEGIN
	DECLARE dbClockTimeParsed TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

	IF dbClockTime IS NULL
    THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing dbClockTime.';
	ELSE
		SET dbClockTimeParsed = TIMESTAMP(dbClockTime);
	END IF;

	UPDATE notification AS n
	SET n.lastSentToSalesforce = dbClockTimeParsed,
		n.lastModifiedTime = dbClockTimeParsed
	WHERE n.lastModifiedTime <= dbClockTimeParsed; 

	SET dbClockTime2 = DATE_FORMAT(dbClockTimeParsed, '%Y-%m-%d %H:%i:%s.%f');
	SELECT dbClockTime2 AS q;

END;
$$
DELIMITER ;