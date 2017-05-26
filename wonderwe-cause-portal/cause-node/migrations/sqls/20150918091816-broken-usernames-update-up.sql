/* Replace with your SQL commands */

CREATE TABLE `updated_usernames` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '',
  `previous_slug` VARCHAR(255) NULL DEFAULT NULL COMMENT '',
  `updated_slug` VARCHAR(255) NULL DEFAULT NULL COMMENT '',
  `created_date` DATETIME NULL DEFAULT NULL COMMENT '',
  `entity_id` INT(10) NULL DEFAULT NULL COMMENT '',
  PRIMARY KEY (`id`)  COMMENT '');