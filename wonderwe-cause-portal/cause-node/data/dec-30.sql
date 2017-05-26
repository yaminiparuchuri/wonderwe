#Storing wepay user id which will returns by /user/register

ALTER TABLE `wonderwe_development`.`report_campaigns_tbl` 
ADD COLUMN `country` INT(20) NULL AFTER `evidence_picture_url`;
