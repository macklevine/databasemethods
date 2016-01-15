DROP PROCEDURE IF EXISTS sp_notification_bulk_update; 
DROP PROCEDURE IF EXISTS sp_notification_bulk_query;
DROP PROCEDURE IF EXISTS update_experimental;

DELIMITER $$

CREATE PROCEDURE sp_notification_bulk_update (
	dbClockTime VARCHAR(40),
	idList VARCHAR(1000),
	OUT rowsChanged INT
)
BEGIN
	DECLARE dbClockTimeParsed TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

	IF dbClockTime IS NULL
    THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing dbClockTime.';
	ELSE
		SET dbClockTimeParsed = TIMESTAMP(dbClockTime);
	END IF;

	SET @s = 'UPDATE notification AS n SET n.lastSentToSalesforce = ?, n.lastModifiedTime = ? WHERE n.lastModifiedTime <= ? AND FIND_IN_SET(n.id, ?)';

	-- UPDATE notification AS n
	-- SET n.lastSentToSalesforce = dbClockTimeParsed,
	-- 	n.lastModifiedTime = dbClockTimeParsed
	-- WHERE n.lastModifiedTime <= dbClockTimeParsed AND FIND_IN_SET(n.id, idList);
	SET @dbClockTimeParsed = dbClockTimeParsed;
	SET @idList = idList;

	PREPARE stmt FROM @s;
	EXECUTE stmt USING @dbClockTimeParsed, @dbClockTimeParsed, @dbClockTimeParsed, @idList;

	SET rowsChanged = ROW_COUNT();
	SELECT rowsChanged AS r;

END;

$$

CREATE PROCEDURE sp_notification_bulk_query (
)
BEGIN
	SELECT DATE_FORMAT(CURRENT_TIMESTAMP(3), '%Y-%m-%d %H:%i:%s.%f') AS n;
	SELECT * from notification WHERE lastModifiedTime > (SELECT MAX(lastSentToSalesforce));
END;

$$
DELIMITER ;