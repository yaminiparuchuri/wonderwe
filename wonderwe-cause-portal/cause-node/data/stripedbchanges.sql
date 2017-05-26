CREATE TABLE `countries_currency` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '',
  `country_id` INT(20) NULL DEFAULT NULL COMMENT '',
  `currency_code` VARCHAR(6) NULL DEFAULT NULL COMMENT '',
  `currency_symbol` VARCHAR(3) NULL DEFAULT NULL COMMENT '',
  PRIMARY KEY (`id`)  COMMENT '');
  
  
  CREATE TABLE `payment_methods` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '',
  `charity_id` INT(10) UNSIGNED NULL DEFAULT NULL COMMENT '',
  `publishable_key` VARCHAR(100) NULL DEFAULT NULL COMMENT '',
  `payment_gateway` VARCHAR(45) NULL DEFAULT NULL COMMENT '',
  `stripe_json` LONGTEXT NULL DEFAULT NULL COMMENT '',
  PRIMARY KEY (`id`)  COMMENT '');
  
  
 ALTER TABLE `countries_tbl` ADD COLUMN `currency` VARCHAR(10) NULL DEFAULT NULL COMMENT '' AFTER `modified_user`;
  
  
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('1', '223', 'usd', '$');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('2', '224', 'cad', '$');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('3', '225', 'gbp', '£');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('4', '226', 'aud', '$');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('6', '217', 'NOK', 'kr');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('7', '214', 'SEK', 'kr');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('8', '213', 'DKK', 'kr');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('9', '209', 'EUR', '€');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('10', '208', 'EUR', '€');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('11', '207', 'EUR', '€');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('12', '206', 'EUR', '€');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('13', '200', 'EUR', '€');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('14', '197', 'EUR', '€');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('15', '182', 'EUR', '€');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('16', '169', 'EUR', '€');
INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('17', '151', 'EUR', '€');

  
  
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='EUR' WHERE `id`='197';
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='EUR' WHERE `id`='207';
UPDATE `countries_tbl` SET `currency`='USD' WHERE `id`='223';
UPDATE `countries_tbl` SET `currency`='CAD' WHERE `id`='224';
UPDATE `countries_tbl` SET `currency`='GBP' WHERE `id`='225';
UPDATE `countries_tbl` SET `currency`='AUD' WHERE `id`='226';
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='DKK' WHERE `id`='213';
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='EUR' WHERE `id`='218';
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='EUR' WHERE `id`='182';
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='EUR' WHERE `id`='200';
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='EUR' WHERE `id`='209';
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='EUR' WHERE `id`='169';
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='EUR' WHERE `id`='206';
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='EUR' WHERE `id`='208';
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='NOK' WHERE `id`='217';
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='EUR' WHERE `id`='151';
UPDATE `countries_tbl` SET `data_status_code`='1', `currency`='SEK' WHERE `id`='214';  


# Charity_tbl

ALTER TABLE `charity_tbl` ADD COLUMN `payment_gateway` VARCHAR(45) NULL DEFAULT 'stripe' COMMENT '' AFTER `charityonboarding`;
update charity_tbl set payment_gateway='wepay' where account_id is not null;
ALTER TABLE `charity_tbl` CHANGE COLUMN `account_id` `account_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '' ;

# recurring_gift_tbl

ALTER TABLE `recurring_gift_tbl` 
ADD COLUMN `payment_gateway` VARCHAR(45) NULL DEFAULT 'stripe' COMMENT '' AFTER `subscription_state`;

ALTER TABLE `recurring_gift_tbl` 
CHANGE COLUMN `card_token` `card_token` VARCHAR(100) NULL DEFAULT NULL COMMENT '';

ALTER TABLE `recurring_gift_tbl` 
CHANGE COLUMN `subscription_plan_id` `subscription_plan_id` VARCHAR(100) NULL DEFAULT '0' COMMENT '' ,
CHANGE COLUMN `subscription_id` `subscription_id` VARCHAR(100) NULL DEFAULT '0' COMMENT '' ;

ALTER TABLE `recurring_gift_tbl`ADD COLUMN `customer_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '' AFTER `payment_gateway`;



#credit_card_tbl

ALTER TABLE `credit_card_tbl` 
ADD COLUMN `payment_gateway` VARCHAR(45) NULL DEFAULT NULL COMMENT '' AFTER `card_name`,
ADD COLUMN `customer_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '' AFTER `payment_gateway`;

ALTER TABLE `credit_card_tbl` ADD COLUMN `stripe_card_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '' AFTER `customer_id`;
ALTER TABLE `credit_card_tbl` CHANGE COLUMN `token` `token` VARCHAR(100) NULL DEFAULT NULL COMMENT '' ;
#ALTER TABLE `credit_card_tbl` CHANGE COLUMN `token` `token` VARCHAR(100) NULL DEFAULT NULL COMMENT '' ;


# Transaction_tbl

ALTER TABLE `transaction_tbl` CHANGE COLUMN `account_id` `account_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '' ;
ALTER TABLE `transaction_tbl` CHANGE COLUMN `checkout_id` `checkout_id` VARCHAR(100) NULL DEFAULT NULL COMMENT '' ;


#

SET SQL_SAFE_UPDATES=0;
update credit_card_tbl set payment_gateway='wepay' where id is not null;
SET SQL_SAFE_UPDATES=1;


  SET SQL_SAFE_UPDATES=0;
update recurring_gift_tbl set payment_gateway='wepay' where id is not null;
SET SQL_SAFE_UPDATES=1;


#INSERT INTO `countries_currency` (`id`, `country_id`, `currency_code`, `currency_symbol`) VALUES ('5', '218', 'EUR', '€');




# Run database scripts to test the data

# node update-country-code.js

# Need to remove the ----       website/404/404.html


# Monthly subscription 

# Copy WePay data into excel sheets




  CREATE TABLE `user_mobile_device_token_tbl` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_token` varchar(2000) DEFAULT NULL,
  `device_type` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



SET SQL_SAFE_UPDATES=0;
update charity_tbl set account_id =null, access_token=null,wepay_account_state=null,payment_gateway=null where payment_gateway !='stripe';
SET SQL_SAFE_UPDATES=1;





#Note : No need to run this one...
SET SQL_SAFE_UPDATES=0;
delete from wonderwe_qa.credit_card_tbl where payment_gateway='wepay';

SET SQL_SAFE_UPDATES=1;



ALTER TABLE `transaction_tbl` ADD COLUMN `offline` VARCHAR(30) NULL DEFAULT 'no' COMMENT '' AFTER `hide_amount`;






  

  
  
  
  