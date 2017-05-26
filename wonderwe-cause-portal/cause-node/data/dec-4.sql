CREATE TABLE `cancel_user_tbl` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date_created` datetime DEFAULT NULL,
  `date_verified` datetime DEFAULT NULL,
  `verification_key` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `password_salt` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `password` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `active` enum('yes','no','banned') COLLATE utf8_unicode_ci DEFAULT 'yes',
  `name` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `default_card_id` int(10) unsigned DEFAULT NULL,
  `last_active_date` datetime DEFAULT NULL,
  `facebook_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `donoronboarding` tinyint(1) DEFAULT NULL,
  `access_token` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `provider_access_token` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `provider` varchar(45) COLLATE utf8_unicode_ci DEFAULT 'Wonderwe',
  `date_deleted` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `date_created` (`date_created`),
  KEY `email` (`email`,`password`,`active`),
  KEY `active` (`active`),
  KEY `email_2` (`email`,`name`,`active`),
  KEY `date_verified` (`date_verified`),
  KEY `verification_key` (`verification_key`),
  KEY `password` (`password`,`id`),
  KEY `default_card_id` (`default_card_id`),
  KEY `last_active_date` (`last_active_date`)
) ENGINE=InnoDB AUTO_INCREMENT=7114 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;