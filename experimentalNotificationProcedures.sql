DROP PROCEDURE IF EXISTS update_lastSentToSalesforce; 

DELIMITER $$

CREATE PROCEDURE update_lastSentToSalesforce (
	dbClockTime VARCHAR(40),
	idList VARCHAR(1000),
	OUT dbClockTime2 VARCHAR(40),
	OUT idListOut VARCHAR(1000)
	-- is it possible to have a second OUT variable so we can figure out what idList looks like internally?
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
	WHERE n.lastModifiedTime <= dbClockTimeParsed AND FIND_IN_SET(n.id, idList);


	-- try FIND_IN_SET above.
	-- n.id IN (idList);

	SET dbClockTime2 = DATE_FORMAT(dbClockTimeParsed, '%Y-%m-%d %H:%i:%s.%f');
	SET idListOut = idList;
	SELECT dbClockTime2 AS q, idListOut AS r;

END;
$$
DELIMITER ;