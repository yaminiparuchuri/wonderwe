#Storing wepay user id which will returns by /user/register

ALTER TABLE `wonderwe_development`.`payment_gateways_tbl` 
ADD COLUMN `wepay_user_id` VARCHAR(45) NULL DEFAULT NULL AFTER `personal_id_number`;

ALTER TABLE `wonderwe_dev_test`.`user_tbl` 
CHANGE COLUMN `facebook_id` `facebook_id` VARCHAR(255) NULL DEFAULT NULL ;
