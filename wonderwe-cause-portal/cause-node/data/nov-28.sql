CREATE TABLE `wonderwe_development`.`offer_organization_tbl` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(45) NOT NULL,
  `type` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`));


ALTER TABLE `wonderwe_development`.`offer_organization_tbl` 
CHANGE COLUMN `name` `organization_name` VARCHAR(255) NOT NULL ;
