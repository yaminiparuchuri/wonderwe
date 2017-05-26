ALTER TABLE `wonderwe_development`.`giving_levels_tbl` 
ADD COLUMN `date_created` DATETIME NULL AFTER `quantity_left`;

ALTER TABLE `wonderwe_development`.`giving_levels_tbl` 
ADD COLUMN `date_modified` DATETIME NULL DEFAULT NULL AFTER `date_created`;

ALTER TABLE `wonderwe_dev_test`.`charity_tbl` 
ADD COLUMN `app_fee` INT(10) NULL AFTER `verified`;



