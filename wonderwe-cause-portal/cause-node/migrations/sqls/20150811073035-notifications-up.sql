/* Replace with your SQL commands */

CREATE TABLE user_notifications_tbl (id INT(10),entity_id INT(10),notification_type ENUM('follow','unfollow','accept','invite','mention','comment','share'),link_id INT(10),status TINYINT(1),date_notification DATETIME,user_id INT(10));
ALTER TABLE entity_tbl ADD notifications_count INT(10) NOT NULL DEFAULT 0;