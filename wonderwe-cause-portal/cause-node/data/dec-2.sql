ALTER TABLE `wonderwe_qa`.`credit_card_tbl`
ADD COLUMN `stripe_card_country` VARCHAR(45) NULL DEFAULT NULL AFTER `wepay_token`;

ALTER TABLE `wonderwe_qa`.`teams_tbl` 
ADD COLUMN `approved_by` VARCHAR(45) NULL DEFAULT NULL AFTER `status`;

ALTER TABLE `wonderwe_development`.`teams_tbl` 
ADD COLUMN `approved_date` DATETIME NULL DEFAULT NULL AFTER `approved_by`;
