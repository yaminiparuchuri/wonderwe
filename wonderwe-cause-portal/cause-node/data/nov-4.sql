ALTER TABLE `wonderwe_development`.`code_tbl`
ADD COLUMN `team_offline_deny` ENUM('yes','no') NULL DEFAULT 'no' AFTER `donotallow_team_campaigns`;

ALTER TABLE `wonderwe_development`.`teams_tbl`
ADD COLUMN `date_created` DATETIME NULL DEFAULT NULL AFTER `team_description`;

ALTER TABLE `wonderwe_development`.`teams_tbl`
ADD COLUMN `donot_allow_join` ENUM('yes','no') NULL DEFAULT 'no' AFTER `date_created`;

ALTER TABLE `wonderwe_development`.`teams_tbl` 
ADD COLUMN `status`  VARCHAR(45) NULL DEFAULT 'published'  AFTER 'donot_allow_join';

ALTER TABLE `wonderwe_development`.`team_invitees_tbl`
ADD COLUMN `action_date` DATETIME NULL AFTER `deleted_by`;

ALTER TABLE `wonderwe_development`.`team_invitees_tbl`
ADD COLUMN `invited_date` DATETIME NULL DEFAULT NULL AFTER `action_date`;



