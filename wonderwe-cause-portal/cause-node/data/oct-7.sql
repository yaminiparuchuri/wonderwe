#Added donor_comment coloumn to transaction_tbl

ALTER TABLE `transaction_tbl`
ADD COLUMN  `donor_comment` VARCHAR(255)  NULL DEFAULT NULL AFTER `code_level_id`;

#Added donotallow_p2p_campaigns coloumn to code_tbl

ALTER TABLE `code_tbl`
ADD COLUMN `donotallow_p2p_campaigns` ENUM('yes','no') NULL DEFAULT 'no' AFTER `published_date`;

#Added messsage body for code admin table
ALTER TABLE `code_admin_tbl` 
CHANGE COLUMN `msg_body` `msg_body` VARCHAR(1024) NULL DEFAULT NULL ;