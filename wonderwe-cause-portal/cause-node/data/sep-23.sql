
# Added published date to campaign 
ALTER TABLE `wonderwe_development`.`code_tbl`
ADD COLUMN `published_date` DATETIME NULL DEFAULT NULL AFTER `p2p_offlinedonation_deny`;

#Query for default published code for existig campaigns
UPDATE code_tbl c
inner join code_tbl ct on ct.id=c.id
set c.published_date=c.date_created;

#End date added 
ALTER TABLE `wonderwe_development`.`code_payment_gateways_tbl` 
ADD COLUMN `end_date` DATETIME NULL DEFAULT NULL AFTER `account_id`;


#code campaign table
CREATE TABLE `code_payment_gateways_tbl` (
  `code_id` int(10) unsigned DEFAULT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `charity_id` int(10) unsigned DEFAULT NULL,
  `payment_gateway_id` int(10) unsigned DEFAULT NULL,
  `date_created` datetime DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `payment_gateway` varchar(45) DEFAULT NULL,
  `account_id` varchar(100) DEFAULT NULL,
  `end_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

#Features list 
CREATE TABLE `features_list_tbl` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `release_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

#Added a additional column about to features list
ALTER TABLE `wonderwe_development`.`features_list_tbl` 
ADD COLUMN `about` VARCHAR(255) NULL DEFAULT NULL AFTER `release_date`;

#Users features list table
CREATE TABLE `user_features_list_tbl` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(15) DEFAULT NULL,
  `charity_id` int(15) DEFAULT NULL,
  `feature_id` int(15) DEFAULT NULL,
  `date_created` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8;

#Updates to code_tbl
UPDATE code_tbl c
inner join code_tbl ct on ct.id=c.id
set c.published_date=c.date_created
