DROP TABLE IF EXISTS notification;

CREATE TABLE notification (
	id CHAR(36) NOT NULL,
	notificationStatus ENUM('Created', 'Cancelled', 'Sent', 'Received', 'Read', 'Responded') NOT NULL,
	lastSentToSalesforce TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 00:00:00.000',
	lastModifiedTime TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	refId CHAR(18)
);