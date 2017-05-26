ALTER TABLE `wonderwe_dev_test`.`code_tbl`
ADD COLUMN `team_id` INT(10) NULL DEFAULT NULL AFTER `donotallow_p2p_campaigns`;

ALTER TABLE `wonderwe_dev_test`.`code_tbl`
ADD COLUMN `team_approve` ENUM('yes','no')  NULL DEFAULT 'no' AFTER 'team_id' ;

ALTER TABLE `wonderwe_dev_test`.`code_tbl`
ADD COLUMN `donotallow_team_campaigns` ENUM('yes','no') NULL DEFAULT 'no' AFTER `team_approve`;




#This is for reporting tool feature ( public campaign page)
CREATE TABLE `wonderwe_dev_test`.`report_campaigns_tbl` (
  `code_id` INT(10) NOT NULL,
  `email` VARCHAR(255) NULL,
  `name` VARCHAR(200) NULL,
  `cell_phone` VARCHAR(15) NULL,
  `description` VARCHAR(1024) NULL,
  `date_created` DATETIME NULL);

ALTER TABLE `wonderwe_dev_test`.`report_campaigns_tbl`
ADD COLUMN `evidence_picture_url` VARCHAR(255) NULL AFTER `date_created`;


#in code _tbl added team_id

ALTER TABLE `wonderwe_dev_test`.`code_tbl`
ADD COLUMN `team_id` INT(10) NULL AFTER `donotallow_p2p_campaigns`;

#new table:  teams_tbl

CREATE TABLE `wonderwe_dev_test`.`teams_tbl` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tc_user_id` INT(10) NULL DEFAULT NULL,
  `team_name` VARCHAR(40) NULL DEFAULT NULL,
  `team_logo` VARCHAR(255) NULL DEFAULT NULL,
  `team_description` LONGTEXT NULL,
  PRIMARY KEY (`id`));

#added another type in enity_tbl

ALTER TABLE `wonderwe_dev_test`.`entity_tbl`
CHANGE COLUMN `entity_type` `entity_type` ENUM('charity','user','group','code','event','team') CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NULL DEFAULT NULL ;

#new table: team_invitees tbl

CREATE TABLE `wonderwe_dev_test`.`team_invitees` (
  `id` INT NOT NULL,
  `team_id` INT(10) NULL DEFAULT NULL,
  `user_id` INT(10) NULL DEFAULT NULL,
  `created` VARCHAR(45) NULL DEFAULT 'no',
  `is_admin` VARCHAR(45) NULL DEFAULT 'no',
  PRIMARY KEY (`id`));

Change:
ALTER TABLE `wonderwe_dev_test`.`teams_tbl`
ADD COLUMN `code_id` INT(10) NULL DEFAULT NULL AFTER `tc_user_id`;

ALTER TABLE `wonderwe_dev_test`.`team_invitees`
CHANGE COLUMN `id` `id` INT(11) NOT NULL AUTO_INCREMENT ;

ALTER TABLE `wonderwe_dev_test`.`team_invitees`
RENAME TO  `wonderwe_dev_test`.`team_invitees_tbl`

#new column to team_invitees_tbl deleted_by

ALTER TABLE `wonderwe_dev_test`.`team_invitees_tbl`
ADD COLUMN `deleted_by` INT(10) NULL AFTER `is_admin`;

ALTER TABLE `recurring_gift_tbl` 
ADD COLUMN `card_id` INT(10) NULL AFTER `customer_id`
