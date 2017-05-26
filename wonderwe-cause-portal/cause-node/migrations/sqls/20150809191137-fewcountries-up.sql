/* Replace with your SQL commands */
ALTER TABLE `countries_tbl` 
ADD COLUMN `country_code` VARCHAR(3) NULL AFTER `name`,
ADD COLUMN `data_status_code` INT NULL AFTER `country_code`,
ADD COLUMN `modified_date` DATETIME NULL AFTER `data_status_code`,
ADD COLUMN `modified_user` VARCHAR(256) NULL AFTER `modified_date`;

update `countries_tbl` set data_status_code=0;

update `countries_tbl` set data_status_code=1 where name='United States';

update `countries_tbl` set data_status_code=1 where name='India';

update `countries_tbl` set data_status_code=1 where name='United Kingdom';

update `countries_tbl` set data_status_code=1 where name='Australia';

update `countries_tbl` set data_status_code=1 where name='Canada';
	


