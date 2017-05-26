ALTER TABLE `wonderwe_development`.`credit_card_tbl` 
ADD COLUMN `stripe_card_country` VARCHAR(45) NULL DEFAULT NULL AFTER `wepay_token`;

ALTER TABLE `wonderwe_development`.`charity_claim_tbl` 
CHANGE COLUMN `email_address` `email_address` VARCHAR(255) NOT NULL ;

ALTER TABLE `wonderwe_development`.`track_tbl` 
ADD COLUMN `charity_id` VARCHAR(100) NULL DEFAULT NULL AFTER `amount`;

ALTER TABLE `wonderwe_qa`.`transaction_tbl` 
CHANGE COLUMN `type` `type` ENUM('one time','code','planned','gift','refund','withdrawal','group','charity') CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NULL DEFAULT NULL ;

ALTER TABLE `wonderwe_qa`.`code_tbl` 
ADD COLUMN `app_fee` INT(10) NULL DEFAULT '0' AFTER `team_offline_deny`;
