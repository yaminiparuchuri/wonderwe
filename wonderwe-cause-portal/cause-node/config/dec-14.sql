#Adding application fee for monthly donations 
ALTER TABLE `wonderwe_development`.`recurring_gift_tbl` 
ADD COLUMN `app_fee` DECIMAL(10,2) NULL DEFAULT NULL AFTER `code_level_id`;

#Add alter query for recurring_gift_id to transaction_tbl\
ALTER TABLE `wonderwe_qa`.`transaction_tbl` 
ADD COLUMN `recurring_gift_id` INT(10) NULL DEFAULT NULL AFTER `donor_comment`;


#Add facebook shares, linkedin, tweets	
ALTER TABLE `wonderwe_development`.`entity_tbl` 
ADD COLUMN `facebook_shares` INT(10) NULL DEFAULT NULL COMMENT '' AFTER `date_deleted`,
ADD COLUMN `tweets` INT(10) NULL DEFAULT NULL COMMENT '' AFTER `facebook_shares`,
ADD COLUMN `linkedin` INT(10) NULL DEFAULT NULL COMMENT '' AFTER `tweets`,
ADD COLUMN `google_plus` INT(10) NULL DEFAULT NULL COMMENT '' AFTER `linkedin`,
ADD COLUMN `pinterest` INT(10) NULL DEFAULT NULL COMMENT '' AFTER `google_plus`;


CREATE TABLE `wonderwe_development`.`recurring_gift_status_tbl` (
  `id` INT NOT NULL,
  `month` INT(10) NULL DEFAULT NULL,
  `year` INT(10) NULL DEFAULT NULL,
  `recurring_id` INT(10) NULL DEFAULT NULL,
  `status` VARCHAR(45) NULL DEFAULT NULL,
  `date_created` DATETIME NULL DEFAULT NOW(),
  `date_updated` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`));

ALTER TABLE `wonderwe_development`.`teams_tbl` 
ADD  COLUMN `support_multiple_campaigns` ENUM('yes', 'no') NULL DEFAULT 'no'  AFTER `approved_date`;

ALTER TABLE `wonderwe_development`.`team_campaigns_tbl` 
ADD COLUMN `team_id` INT(11) NULL AFTER `approved_by`;

ALTER TABLE `wonderwe_development`.`teams_tbl` 
ADD COLUMN `check_p2p` ENUM('yes', 'no') NULL DEFAULT 'no' AFTER `support_multiple_campaigns`;


ALTER TABLE `wonderwe_development`.`team_invitees_tbl` 
ADD COLUMN `code_id` INT(10) NULL DEFAULT NULL AFTER `invited_date`;