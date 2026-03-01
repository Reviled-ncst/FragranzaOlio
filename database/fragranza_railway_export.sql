-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: fragranza_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_logs`
--

DROP TABLE IF EXISTS `admin_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `admin_name` varchar(200) NOT NULL,
  `admin_email` varchar(255) NOT NULL,
  `action_type` enum('create','update','delete','login','logout','view','export','import','other') NOT NULL,
  `target_type` enum('user','product','inventory','order','category','settings','system') NOT NULL,
  `target_id` int(11) DEFAULT NULL,
  `target_name` varchar(255) DEFAULT NULL,
  `description` text NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_target_type` (`target_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_logs`
--

LOCK TABLES `admin_logs` WRITE;
/*!40000 ALTER TABLE `admin_logs` DISABLE KEYS */;
INSERT INTO `admin_logs` VALUES (1,5,'Renz Russel Bauto','newadmin@fragranza.com','create','user',7,'Maria Santos','Created new ojt_supervisor account for supervisor@fragranza.com',NULL,'{\"email\":\"supervisor@fragranza.com\",\"role\":\"ojt_supervisor\",\"department\":\"Operations\",\"position\":\"OJT Supervisor\",\"employeeId\":\"SUP-2026-4411\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 13:37:26'),(2,5,'Renz Russel Bauto','newadmin@fragranza.com','create','user',11,'Juan Dela Cruz','Created new ojt account for ojt12@fragranza.com',NULL,'{\"email\":\"ojt12@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\",\"employeeId\":\"OJT-2026-0527\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 13:56:36'),(3,5,'Renz Russel Bauto','newadmin@fragranza.com','delete','user',11,'Juan Dela Cruz','Deleted user ojt12@fragranza.com (Role: ojt)','{\"email\":\"ojt12@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\"}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 14:21:43'),(4,5,'Renz Russel Bauto','newadmin@fragranza.com','delete','user',11,'Juan Dela Cruz','Deleted user ojt12@fragranza.com (Role: ojt)','{\"email\":\"ojt12@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\"}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 14:21:47'),(5,5,'Renz Russel Bauto','newadmin@fragranza.com','delete','user',11,'Juan Dela Cruz','Deleted user ojt12@fragranza.com (Role: ojt)','{\"email\":\"ojt12@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\"}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 14:21:54'),(6,5,'Renz Russel Bauto','newadmin@fragranza.com','','user',8,'Juan Dela Cruz','Marked OJT training as completed','{\"status\":\"active\"}','{\"status\":\"active\",\"reason\":null}','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.7705','2026-02-12 14:36:11'),(7,5,'Renz Russel Bauto','newadmin@fragranza.com','','user',9,'Juan Dela Cruz','Suspended user account: Testing suspension feature','{\"status\":\"active\"}','{\"status\":\"suspended\",\"reason\":\"Testing suspension feature\"}','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.7705','2026-02-12 14:36:20'),(8,5,'Renz Russel Bauto','newadmin@fragranza.com','','user',9,'Juan Dela Cruz','Reactivated user account','{\"status\":\"suspended\"}','{\"status\":\"active\",\"reason\":null}','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.7705','2026-02-12 14:36:25'),(9,5,'Renz Russel Bauto','newadmin@fragranza.com','','user',11,'Juan Dela Cruz','Permanently deleted user ojt12@fragranza.com (Role: ojt)','{\"email\":\"ojt12@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\"}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 14:43:17'),(10,5,'Renz Russel Bauto','newadmin@fragranza.com','','user',10,'Juan Dela Cruz','Permanently deleted user ojt11@fragranza.com (Role: ojt)','{\"email\":\"ojt11@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\"}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 14:43:28'),(11,5,'Renz Russel Bauto','newadmin@fragranza.com','','user',9,'Juan Dela Cruz','Permanently deleted user ojt1@fragranza.com (Role: ojt)','{\"email\":\"ojt1@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\"}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 14:43:35'),(12,5,'Renz Russel Bauto','newadmin@fragranza.com','','user',8,'Juan Dela Cruz','Permanently deleted user ojt@fragranza.com (Role: ojt)','{\"email\":\"ojt@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\"}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 14:45:44'),(13,5,'Renz Russel Bauto','newadmin@fragranza.com','create','user',12,'Juan Dela Cruz','Created new ojt account for ojt@fragranza.com',NULL,'{\"email\":\"ojt@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\",\"employeeId\":\"OJT-2026-7662\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 14:45:51'),(14,5,'Renz Russel Bauto','newadmin@fragranza.com','','user',12,'Juan Dela Cruz','Permanently deleted user ojt@fragranza.com (Role: ojt)','{\"email\":\"ojt@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\"}',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 14:46:20'),(15,5,'Renz Russel Bauto','newadmin@fragranza.com','create','user',13,'Juan Dela Cruz','Created new ojt account for ojt@fragranza.com',NULL,'{\"email\":\"ojt@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\",\"employeeId\":\"OJT-2026-9214\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 14:46:28'),(16,5,'Renz Russel Bauto','newadmin@fragranza.com','create','user',14,'Renz Bauto','Created new ojt account for ojt2@fragranza.com',NULL,'{\"email\":\"ojt2@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\",\"employeeId\":\"OJT-2026-9503\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-12 20:08:10'),(17,5,'Renz Russel Bauto','newadmin@fragranza.com','create','user',15,'Juan Dela Cruz','Created new ojt account for ojt20@fragranza.com',NULL,'{\"email\":\"ojt20@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\",\"employeeId\":\"OJT-2026-6768\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-17 02:23:56'),(18,5,'Renz Russel Bauto','newadmin@fragranza.com','create','user',16,'AAA BBB','Created new ojt account for ojt21@fragranza.com',NULL,'{\"email\":\"ojt21@fragranza.com\",\"role\":\"ojt\",\"department\":\"Operations\",\"position\":\"OJT Trainee\",\"employeeId\":\"OJT-2026-9724\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-17 02:28:45'),(19,5,'Renz Russel Bauto','newadmin@fragranza.com','create','user',17,'Pedro Garcia','Created new sales account for sales@fragranza.com',NULL,'{\"email\":\"sales@fragranza.com\",\"role\":\"sales\",\"department\":\"Sales\",\"position\":\"Sales Representative\",\"employeeId\":\"SAL-2026-9444\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-17 08:09:57'),(20,5,'Renz Russel Bauto','newadmin@fragranza.com','create','user',18,'HR Test','Created new hr account for hrtest12@test.com',NULL,'{\"email\":\"hrtest12@test.com\",\"role\":\"hr\",\"department\":null,\"position\":null,\"employeeId\":\"HRD-2026-8849\"}','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.7705','2026-02-18 03:34:15'),(21,5,'Renz Russel Bauto','newadmin@fragranza.com','create','user',19,'HR Staff','Created new hr account for hr@fragranza.com',NULL,'{\"email\":\"hr@fragranza.com\",\"role\":\"hr\",\"department\":\"Human Resources\",\"position\":\"HR Officer\",\"employeeId\":\"HRD-2026-3879\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-18 04:43:02');
/*!40000 ALTER TABLE `admin_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branch_inventory`
--

DROP TABLE IF EXISTS `branch_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branch_inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `branch_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `variation_id` varchar(50) DEFAULT NULL,
  `quantity` int(11) DEFAULT 0,
  `min_quantity` int(11) DEFAULT 5,
  `max_quantity` int(11) DEFAULT 100,
  `last_restocked` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_branch_product_variation` (`branch_id`,`product_id`,`variation_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `branch_inventory_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `branch_inventory_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branch_inventory`
--

LOCK TABLES `branch_inventory` WRITE;
/*!40000 ALTER TABLE `branch_inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `branch_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `is_warehouse` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `parent_id` (`parent_id`),
  KEY `idx_slug` (`slug`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Women\'s Perfume','womens-perfume','Elegant fragrances for women',NULL,NULL,1,1,'2026-02-11 11:36:15','2026-02-11 11:36:15'),(2,'Men\'s Perfume','mens-perfume','Bold and sophisticated scents for men',NULL,NULL,2,1,'2026-02-11 11:36:15','2026-02-11 11:36:15'),(3,'Unisex','unisex','Universal fragrances for everyone',NULL,NULL,3,1,'2026-02-11 11:36:15','2026-02-11 11:36:15'),(4,'Body Mist','body-mist','Light and refreshing body sprays',NULL,NULL,4,1,'2026-02-11 11:36:15','2026-02-11 11:36:15'),(5,'Room Spray','room-spray','Home and car fragrances',NULL,NULL,5,1,'2026-02-11 11:36:15','2026-02-11 11:36:15'),(6,'Sanitizers','sanitizers','Scented alcohol sanitizers',NULL,NULL,6,1,'2026-02-11 11:36:15','2026-02-11 11:36:15'),(7,'Sets & Collections','sets-collections','Gift sets and bundles',NULL,NULL,7,1,'2026-02-11 11:36:15','2026-02-11 11:36:15');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_messages`
--

DROP TABLE IF EXISTS `complaint_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complaint_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) NOT NULL,
  `sender_type` enum('customer','staff') NOT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `sender_name` varchar(100) DEFAULT NULL,
  `message` text NOT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_complaint_messages_complaint` (`complaint_id`),
  CONSTRAINT `complaint_messages_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_messages`
--

LOCK TABLES `complaint_messages` WRITE;
/*!40000 ALTER TABLE `complaint_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complaints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(50) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `category` enum('product_quality','shipping','payment','service','return','refund','other') DEFAULT 'other',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('open','in_progress','waiting','resolved','closed') DEFAULT 'open',
  `subject` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `resolution` text DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `resolved_by` int(11) DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `order_id` (`order_id`),
  KEY `resolved_by` (`resolved_by`),
  KEY `assigned_to` (`assigned_to`),
  KEY `idx_complaints_ticket` (`ticket_number`),
  KEY `idx_complaints_status` (`status`),
  KEY `idx_complaints_priority` (`priority`),
  KEY `idx_complaints_customer` (`customer_id`),
  CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `complaints_ibfk_3` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `complaints_ibfk_4` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_inquiries`
--

DROP TABLE IF EXISTS `contact_inquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contact_inquiries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('new','read','replied','archived') DEFAULT 'new',
  `replied_at` datetime DEFAULT NULL,
  `replied_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_inquiries`
--

LOCK TABLES `contact_inquiries` WRITE;
/*!40000 ALTER TABLE `contact_inquiries` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_inquiries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `zip_code` varchar(10) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Philippines',
  `customer_type` enum('regular','vip','wholesale','reseller') DEFAULT 'regular',
  `total_orders` int(11) DEFAULT 0,
  `total_spent` decimal(12,2) DEFAULT 0.00,
  `average_order_value` decimal(10,2) DEFAULT 0.00,
  `last_order_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_customers_email` (`email`),
  KEY `idx_customers_user` (`user_id`),
  KEY `idx_customers_type` (`customer_type`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `failed_login_summary`
--

DROP TABLE IF EXISTS `failed_login_summary`;
/*!50001 DROP VIEW IF EXISTS `failed_login_summary`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `failed_login_summary` AS SELECT
 1 AS `email`,
  1 AS `ip_address`,
  1 AS `attempt_count`,
  1 AS `last_attempt`,
  1 AS `first_attempt` */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `branch_id` int(11) DEFAULT NULL,
  `product_id` int(11) NOT NULL,
  `variation_id` varchar(50) DEFAULT NULL,
  `transaction_type` enum('stock_in','stock_out','transfer','adjustment','return','damaged') NOT NULL,
  `quantity` int(11) NOT NULL,
  `quantity_before` int(11) DEFAULT 0,
  `quantity_after` int(11) DEFAULT 0,
  `source_branch_id` int(11) DEFAULT NULL,
  `destination_branch_id` int(11) DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `supplier` varchar(200) DEFAULT NULL,
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'completed',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_transactions_type` (`transaction_type`),
  KEY `idx_transactions_date` (`created_at`),
  KEY `idx_transactions_product` (`product_id`),
  KEY `idx_transactions_branch` (`branch_id`),
  CONSTRAINT `inventory_transactions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_transactions_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `inventory_transactions_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
INSERT INTO `inventory_transactions` VALUES (1,NULL,1,NULL,'stock_out',1,50,49,NULL,NULL,'FO-260218-0422','Sales Order',NULL,NULL,NULL,'Sold by: Sales Representative | Order: FO-260218-0422 | Product: mens','completed',6,'2026-02-18 07:33:20'),(2,NULL,1,NULL,'stock_out',1,49,48,NULL,NULL,'FO-260218-9533','Sales Order',NULL,NULL,NULL,'Sold by: Sales Representative | Order: FO-260218-9533 | Product: mens','completed',6,'2026-02-18 07:37:09'),(3,NULL,1,NULL,'stock_out',2,48,46,NULL,NULL,'FO-260218-5531','Sales Order',NULL,NULL,NULL,'Sold by: Sales Representative | Order: FO-260218-5531 | Product: mens','completed',6,'2026-02-18 07:40:03'),(4,NULL,1,NULL,'stock_out',1,46,45,NULL,NULL,'FO-260218-8363','Sales Order',NULL,NULL,NULL,'Sold by: System | Order: FO-260218-8363 | Product: mens','completed',NULL,'2026-02-18 07:58:22'),(5,NULL,1,NULL,'stock_out',1,46,45,NULL,NULL,'FO-260218-8363','Sales Order',NULL,NULL,NULL,'Sold by: System | Order: FO-260218-8363 | Product: mens','completed',NULL,'2026-02-18 07:58:22'),(6,NULL,1,NULL,'stock_out',1,44,43,NULL,NULL,'FO-260218-8363','Sales Order',NULL,NULL,NULL,'Sold by: System | Order: FO-260218-8363 | Product: mens','completed',NULL,'2026-02-18 07:58:25'),(7,NULL,1,NULL,'stock_out',1,44,43,NULL,NULL,'FO-260218-8363','Sales Order',NULL,NULL,NULL,'Sold by: System | Order: FO-260218-8363 | Product: mens','completed',NULL,'2026-02-18 07:58:25'),(8,NULL,1,NULL,'stock_out',1,42,41,NULL,NULL,'FO-260218-8363','Sales Order',NULL,NULL,NULL,'Sold by: System | Order: FO-260218-8363 | Product: mens','completed',NULL,'2026-02-18 07:58:32'),(9,NULL,1,NULL,'stock_out',1,42,41,NULL,NULL,'FO-260218-8363','Sales Order',NULL,NULL,NULL,'Sold by: System | Order: FO-260218-8363 | Product: mens','completed',NULL,'2026-02-18 07:58:32');
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) NOT NULL,
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `status` enum('draft','sent','paid','partial','overdue','cancelled') DEFAULT 'draft',
  `subtotal` decimal(12,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL,
  `amount_paid` decimal(12,2) DEFAULT 0.00,
  `amount_due` decimal(12,2) NOT NULL,
  `issue_date` date NOT NULL,
  `due_date` date NOT NULL,
  `paid_date` date DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `terms` text DEFAULT NULL,
  `billing_name` varchar(200) DEFAULT NULL,
  `billing_email` varchar(100) DEFAULT NULL,
  `billing_phone` varchar(20) DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `customer_id` (`customer_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_invoices_number` (`invoice_number`),
  KEY `idx_invoices_order` (`order_id`),
  KEY `idx_invoices_status` (`status`),
  KEY `idx_invoices_due` (`due_date`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,'INV-260212-2500',7,NULL,'sent',684.00,0.00,0.00,838.00,0.00,0.00,'2026-02-12','2026-02-19',NULL,NULL,NULL,NULL,NULL,'Renz Russel Bauto','renzrusselbauto@gmail.com','09917648384','Paliparan, Dasmariñas, Cavite 4114',NULL,'2026-02-12 13:01:46','2026-02-12 13:01:46'),(2,'INV-260217-7131',8,NULL,'sent',684.00,0.00,0.00,838.00,0.00,0.00,'2026-02-17','2026-02-24',NULL,NULL,NULL,NULL,NULL,'Renz Russel Bauto','renzrusselbauto@gmail.com','09917648384','Paliparan, Dasmariñas, Cavite 4114',NULL,'2026-02-17 08:08:22','2026-02-17 08:08:22'),(3,'INV-260218-8335',9,NULL,'sent',2052.00,0.00,0.00,2052.00,0.00,0.00,'2026-02-18','2026-02-25',NULL,NULL,NULL,NULL,NULL,'Renz Russel Bauto','renzrusselbauto@gmail.com','09917648384','Paliparan, Dasmariñas, Cavite 4114',NULL,'2026-02-18 05:23:43','2026-02-18 05:23:43'),(4,'INV-260218-3593',10,NULL,'sent',1368.00,0.00,0.00,1522.00,0.00,0.00,'2026-02-18','2026-02-25',NULL,NULL,NULL,NULL,NULL,'Renz Russel Bauto','renzrusselbauto@gmail.com','09917648384','Paliparan, Dasmariñas, Cavite 4114',NULL,'2026-02-18 05:24:08','2026-02-18 05:24:08'),(5,'INV-260218-7342',11,NULL,'sent',684.00,0.00,0.00,838.00,0.00,0.00,'2026-02-18','2026-02-25',NULL,NULL,NULL,NULL,NULL,'Renz Russel Bauto','renzrusselbauto@gmail.com','09917648384','Paliparan, Dasmariñas, Cavite 4114',NULL,'2026-02-18 05:39:45','2026-02-18 05:39:45'),(6,'INV-260218-0689',12,NULL,'sent',1368.00,0.00,0.00,1522.00,0.00,0.00,'2026-02-18','2026-02-25',NULL,NULL,NULL,NULL,NULL,'Renz Russel Bauto','renzrusselbauto@gmail.com','09917648384','Paliparan, Dasmariñas, Cavite 4114',NULL,'2026-02-18 05:56:25','2026-02-18 05:56:25');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_attempts`
--

DROP TABLE IF EXISTS `login_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT 0,
  `failure_reason` varchar(100) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_login_attempts_email` (`email`),
  KEY `idx_login_attempts_ip` (`ip_address`),
  KEY `idx_login_attempts_created` (`created_at`),
  KEY `idx_login_attempts_success` (`success`),
  KEY `idx_login_attempts_user` (`user_id`),
  CONSTRAINT `login_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_attempts`
--

LOCK TABLES `login_attempts` WRITE;
/*!40000 ALTER TABLE `login_attempts` DISABLE KEYS */;
INSERT INTO `login_attempts` VALUES (1,'newadmin@fragranza.com',5,1,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',NULL,'2026-02-26 07:22:03');
/*!40000 ALTER TABLE `login_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newsletter_subscribers`
--

DROP TABLE IF EXISTS `newsletter_subscribers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `newsletter_subscribers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletter_subscribers`
--

LOCK TABLES `newsletter_subscribers` WRITE;
/*!40000 ALTER TABLE `newsletter_subscribers` DISABLE KEYS */;
/*!40000 ALTER TABLE `newsletter_subscribers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ojt_achievement_definitions`
--

DROP TABLE IF EXISTS `ojt_achievement_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ojt_achievement_definitions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(50) DEFAULT '????',
  `badge_color` varchar(50) DEFAULT 'gold',
  `category` enum('attendance','tasks','milestones','special') DEFAULT 'milestones',
  `requirement_type` enum('count','streak','percentage','single') DEFAULT 'count',
  `requirement_value` int(11) DEFAULT 1,
  `points` int(11) DEFAULT 10,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ojt_achievement_definitions`
--

LOCK TABLES `ojt_achievement_definitions` WRITE;
/*!40000 ALTER TABLE `ojt_achievement_definitions` DISABLE KEYS */;
INSERT INTO `ojt_achievement_definitions` VALUES (1,'first_clock_in','First Day','Clock in for the first time','????','blue','attendance','single',1,10,1,'2026-02-13 13:35:44'),(2,'perfect_week','Perfect Week','No late arrivals for a full week (5 days)','???','gold','attendance','streak',5,50,1,'2026-02-13 13:35:44'),(3,'early_bird','Early Bird','Clock in 15+ minutes early 5 times','????','orange','attendance','count',5,30,1,'2026-02-13 13:35:44'),(4,'perfect_month','Perfect Month','No late arrivals for a full month','????','purple','attendance','streak',22,100,1,'2026-02-13 13:35:44'),(5,'attendance_50','50 Hours Completed','Complete 50 hours of OJT','???','teal','attendance','count',50,50,1,'2026-02-13 13:35:44'),(6,'attendance_100','100 Hours Completed','Complete 100 hours of OJT','????','emerald','attendance','count',100,100,1,'2026-02-13 13:35:44'),(7,'attendance_200','200 Hours Completed','Complete 200 hours of OJT','????','gold','attendance','count',200,200,1,'2026-02-13 13:35:44'),(8,'attendance_300','300 Hours Completed','Complete 300 hours of OJT','????','amber','attendance','count',300,300,1,'2026-02-13 13:35:44'),(9,'first_task','Getting Started','Complete your first task','????','green','tasks','single',1,10,1,'2026-02-13 13:35:44'),(10,'task_5','Task Achiever','Complete 5 tasks','???','green','tasks','count',5,25,1,'2026-02-13 13:35:44'),(11,'task_10','Task Master','Complete 10 tasks','???????','blue','tasks','count',10,50,1,'2026-02-13 13:35:44'),(12,'task_25','Task Champion','Complete 25 tasks','????','gold','tasks','count',25,100,1,'2026-02-13 13:35:44'),(13,'perfect_task','Perfectionist','Get a 5/5 score on a task','????','purple','tasks','single',1,25,1,'2026-02-13 13:35:44'),(14,'no_revision','First Try','Complete 5 tasks with no revisions needed','????','emerald','tasks','count',5,40,1,'2026-02-13 13:35:44'),(15,'week_1','Week 1 Complete','Complete your first week of OJT','????','blue','milestones','single',1,20,1,'2026-02-13 13:35:44'),(16,'halfway','Halfway There','Reach 50% of your OJT program','????','amber','milestones','percentage',50,75,1,'2026-02-13 13:35:44'),(17,'almost_done','Almost Done','Reach 90% of your OJT program','????','gold','milestones','percentage',90,100,1,'2026-02-13 13:35:44'),(18,'graduate','Graduate','Complete your OJT program','????','purple','milestones','percentage',100,200,1,'2026-02-13 13:35:44'),(19,'quick_learner','Quick Learner','Complete first module in record time','???','yellow','special','single',1,30,1,'2026-02-13 13:35:44'),(20,'team_player','Team Player','Receive positive feedback from supervisor','????','pink','special','single',1,25,1,'2026-02-13 13:35:44'),(21,'dedicated','Dedicated','Log in on a weekend (optional)','????','red','special','single',1,15,1,'2026-02-13 13:35:44');
/*!40000 ALTER TABLE `ojt_achievement_definitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ojt_assignments`
--

DROP TABLE IF EXISTS `ojt_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ojt_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supervisor_id` int(11) NOT NULL,
  `trainee_id` int(11) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('active','completed','terminated') DEFAULT 'active',
  `total_required_hours` int(11) DEFAULT 600,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_assignment` (`supervisor_id`,`trainee_id`,`start_date`),
  KEY `trainee_id` (`trainee_id`),
  CONSTRAINT `ojt_assignments_ibfk_1` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ojt_assignments_ibfk_2` FOREIGN KEY (`trainee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ojt_assignments`
--

LOCK TABLES `ojt_assignments` WRITE;
/*!40000 ALTER TABLE `ojt_assignments` DISABLE KEYS */;
INSERT INTO `ojt_assignments` VALUES (5,7,13,'Operations','2026-02-12','2026-04-30','active',500,NULL,'2026-02-12 14:46:28','2026-02-12 19:33:52'),(6,7,14,'Operations','2026-02-12',NULL,'active',500,NULL,'2026-02-12 20:08:10','2026-02-12 20:08:10'),(7,7,15,'Operations','2026-02-17',NULL,'active',500,NULL,'2026-02-17 02:23:56','2026-02-17 02:23:56'),(8,7,16,'Operations','2026-02-17',NULL,'active',500,NULL,'2026-02-17 02:28:45','2026-02-17 02:28:45');
/*!40000 ALTER TABLE `ojt_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ojt_attendance`
--

DROP TABLE IF EXISTS `ojt_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ojt_attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trainee_id` int(11) NOT NULL,
  `supervisor_id` int(11) DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `time_in` datetime DEFAULT NULL,
  `time_out` datetime DEFAULT NULL,
  `break_start` datetime DEFAULT NULL,
  `break_end` datetime DEFAULT NULL,
  `face_verified` tinyint(1) DEFAULT 0,
  `face_verified_out` tinyint(1) DEFAULT 0,
  `total_hours` decimal(5,2) DEFAULT 0.00,
  `work_hours` decimal(5,2) DEFAULT 0.00,
  `break_hours` decimal(5,2) DEFAULT 0.00,
  `overtime_hours` decimal(5,2) DEFAULT 0.00,
  `overtime_approved` tinyint(1) DEFAULT 0,
  `status` enum('present','absent','late','half_day','leave') DEFAULT 'present',
  `late_minutes` int(11) DEFAULT 0,
  `penalty_hours` decimal(5,2) DEFAULT 0.00,
  `photo_in` text DEFAULT NULL,
  `photo_out` text DEFAULT NULL,
  `location_in` text DEFAULT NULL,
  `latitude_in` decimal(10,8) DEFAULT NULL,
  `longitude_in` decimal(11,8) DEFAULT NULL,
  `location_out` text DEFAULT NULL,
  `latitude_out` decimal(10,8) DEFAULT NULL,
  `longitude_out` decimal(11,8) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendance` (`trainee_id`,`attendance_date`),
  KEY `idx_ojt_attendance_trainee` (`trainee_id`),
  KEY `idx_ojt_attendance_date` (`attendance_date`),
  KEY `supervisor_id` (`supervisor_id`),
  CONSTRAINT `ojt_attendance_ibfk_1` FOREIGN KEY (`trainee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ojt_attendance_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ojt_attendance`
--

LOCK TABLES `ojt_attendance` WRITE;
/*!40000 ALTER TABLE `ojt_attendance` DISABLE KEYS */;
INSERT INTO `ojt_attendance` VALUES (1,13,7,'2026-02-13','2026-02-13 03:07:22','2026-02-13 03:11:24','2026-02-13 03:08:45','2026-02-13 03:08:47',0,0,0.07,0.07,0.00,0.00,0,'present',0,0.00,'uploads/attendance/13_in_20260213_030722.jpg','uploads/attendance/13_out_20260213_031124.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-12 19:07:22','2026-02-12 19:33:38'),(2,14,7,'2026-02-13','2026-02-13 04:10:02',NULL,NULL,NULL,0,0,0.00,0.00,0.00,0.00,0,'present',0,0.00,'uploads/attendance/14_in_20260213_041002.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-12 20:10:02','2026-02-12 20:10:02'),(4,13,7,'2026-02-16','2026-02-16 22:49:37',NULL,NULL,NULL,0,0,0.00,0.00,0.00,0.00,0,'late',829,4.00,'uploads/attendance/13_in_20260216_224937.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-16 14:49:37','2026-02-16 14:49:37'),(5,13,7,'2026-02-17','2026-02-17 10:05:58',NULL,NULL,NULL,0,0,0.00,0.00,0.00,0.00,0,'late',65,0.50,'uploads/attendance/13_in_20260217_100558.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-17 02:05:58','2026-02-17 02:05:58'),(6,15,7,'2026-02-17','2026-02-17 10:24:21','2026-02-17 10:26:53',NULL,NULL,0,0,0.04,0.04,0.00,0.00,0,'late',84,0.50,'uploads/attendance/15_in_20260217_102421.jpg','uploads/attendance/15_out_20260217_102653.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-17 02:24:21','2026-02-17 02:26:53'),(7,16,7,'2026-02-17','2026-02-17 10:31:10','2026-02-17 10:35:47',NULL,NULL,0,0,0.08,0.08,0.00,0.00,0,'late',91,0.50,'uploads/attendance/16_in_20260217_103110.jpg','uploads/attendance/16_out_20260217_103547.jpg','San Dionisio Street, San Dionisio, Bagong Bayan, Dasmariñas, Cavite, Calabarzon, 4115, Philippines',14.34097487,120.95301981,NULL,NULL,NULL,NULL,NULL,'2026-02-17 02:31:10','2026-02-17 02:35:47'),(8,16,7,'2026-02-19','2026-02-19 13:25:24',NULL,NULL,NULL,0,0,0.00,0.00,0.00,0.00,0,'late',265,4.00,'uploads/attendance/16_in_20260219_132524.jpg',NULL,'Town & Country Homes Bridge, Nazareth Street, Town & Country Homes, Burol 1, Bagong Bayan, Dasmariñas, Cavite, Calabarzon, 4115, Philippines',14.33000000,120.96000000,NULL,NULL,NULL,NULL,NULL,'2026-02-19 05:25:24','2026-02-19 05:25:24');
/*!40000 ALTER TABLE `ojt_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ojt_documents`
--

DROP TABLE IF EXISTS `ojt_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ojt_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trainee_id` int(11) NOT NULL,
  `document_type` enum('resume','endorsement','moa','waiver','evaluation','certificate','other') NOT NULL,
  `title` varchar(200) NOT NULL,
  `file_path` text NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `uploaded_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `trainee_id` (`trainee_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `ojt_documents_ibfk_1` FOREIGN KEY (`trainee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ojt_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ojt_documents`
--

LOCK TABLES `ojt_documents` WRITE;
/*!40000 ALTER TABLE `ojt_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `ojt_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ojt_late_permissions`
--

DROP TABLE IF EXISTS `ojt_late_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ojt_late_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trainee_id` int(11) NOT NULL,
  `granted_by` int(11) NOT NULL,
  `permission_date` date NOT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','approved','denied') DEFAULT 'pending',
  `approved_at` timestamp NULL DEFAULT NULL,
  `denied_reason` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_permission` (`trainee_id`,`permission_date`),
  KEY `granted_by` (`granted_by`),
  CONSTRAINT `ojt_late_permissions_ibfk_1` FOREIGN KEY (`trainee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ojt_late_permissions_ibfk_2` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ojt_late_permissions`
--

LOCK TABLES `ojt_late_permissions` WRITE;
/*!40000 ALTER TABLE `ojt_late_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `ojt_late_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ojt_module_progress`
--

DROP TABLE IF EXISTS `ojt_module_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ojt_module_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trainee_id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
  `progress_percent` int(11) DEFAULT 0,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `score` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_progress` (`trainee_id`,`module_id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `ojt_module_progress_ibfk_1` FOREIGN KEY (`trainee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ojt_module_progress_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `ojt_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ojt_module_progress`
--

LOCK TABLES `ojt_module_progress` WRITE;
/*!40000 ALTER TABLE `ojt_module_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `ojt_module_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ojt_modules`
--

DROP TABLE IF EXISTS `ojt_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ojt_modules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `content` text DEFAULT NULL,
  `duration_hours` int(11) DEFAULT 1,
  `order_index` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ojt_modules`
--

LOCK TABLES `ojt_modules` WRITE;
/*!40000 ALTER TABLE `ojt_modules` DISABLE KEYS */;
/*!40000 ALTER TABLE `ojt_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ojt_notifications`
--

DROP TABLE IF EXISTS `ojt_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ojt_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('task','timesheet','attendance','document','module','general','system') DEFAULT 'general',
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `link` varchar(500) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `action_type` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_is_read` (`is_read`),
  KEY `idx_notifications_created_at` (`created_at`),
  CONSTRAINT `ojt_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ojt_notifications`
--

LOCK TABLES `ojt_notifications` WRITE;
/*!40000 ALTER TABLE `ojt_notifications` DISABLE KEYS */;
INSERT INTO `ojt_notifications` VALUES (1,13,'task','New Task Assigned','You have been assigned a new task: \"asdasd\"','/ojt/tasks',1,'task','new_task',0,NULL,'2026-02-12 14:46:56'),(2,7,'task','Task Submitted for Review','Juan Dela Cruz has submitted \"asdasd\" for review.','/supervisor/tasks',1,'task','task_submitted',0,NULL,'2026-02-12 15:47:37'),(3,7,'task','Task Submitted for Review','Juan Dela Cruz has submitted \"asdasd\" for review.','/supervisor/tasks',1,'task','task_submitted',0,NULL,'2026-02-12 15:54:14'),(4,7,'task','Task Submitted for Review','Juan Dela Cruz has submitted \"asdasd\" for review.','/supervisor/tasks',1,'task','task_submitted',0,NULL,'2026-02-12 16:10:53'),(5,13,'task','Task Approved! 🎉','Your task \"asdasd\" has been approved.','/ojt/tasks',1,'task','task_approved',0,NULL,'2026-02-12 16:14:33'),(6,13,'task','New Task Assigned','You have been assigned a new task: \"asdasd\"','/ojt/tasks',2,'task','new_task',0,NULL,'2026-02-12 16:16:53'),(7,7,'task','Task Submitted for Review','Juan Dela Cruz has submitted \"asdasd\" for review.','/supervisor/tasks',2,'task','task_submitted',0,NULL,'2026-02-12 16:18:07'),(8,7,'task','Task Submitted for Review','Juan Dela Cruz has submitted \"asdasd\" for review.','/supervisor/tasks',2,'task','task_submitted',0,NULL,'2026-02-12 16:38:24'),(9,13,'task','Task Rejected','Your task \"asdasd\" has been rejected. Feedback: asdasdasdasas a sdsadasd','/ojt/tasks',2,'task','task_rejected',0,NULL,'2026-02-12 16:41:15'),(10,13,'task','New Task Assigned','You have been assigned a new task: \"asdasda\"','/ojt/tasks',3,'task','new_task',0,NULL,'2026-02-12 17:10:04'),(11,7,'task','Task Submitted for Review','Juan Dela Cruz has submitted \"asdasda\" for review.','/supervisor/tasks',3,'task','task_submitted',0,NULL,'2026-02-12 17:10:20'),(12,13,'task','Task Rejected','Your task \"asdasda\" has been rejected. Feedback: Some parts need improvement. See feedback for details.','/ojt/tasks',3,'task','task_rejected',0,NULL,'2026-02-12 17:10:40'),(13,7,'task','Task Submitted for Review','Juan Dela Cruz has submitted \"asdasd\" for review.','/supervisor/tasks',2,'task','task_submitted',0,NULL,'2026-02-12 17:49:22'),(14,13,'task','Task Approved! 🎉','Your task \"asdasd\" has been approved.','/ojt/tasks',2,'task','task_approved',0,NULL,'2026-02-12 17:49:35'),(15,13,'attendance','Clocked In','You clocked in at 03:07 AM','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-12 19:07:22'),(16,13,'attendance','Break Started','Break started at 03:08 AM','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-12 19:08:01'),(17,13,'attendance','Break Ended','Break ended at 03:08 AM. Duration: 0 minutes','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-12 19:08:12'),(18,13,'attendance','Break Started','New break started at 03:08 AM','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-12 19:08:45'),(19,13,'attendance','Break Ended','Break ended at 03:08 AM. Duration: 0 minutes','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-12 19:08:47'),(20,13,'attendance','Clocked Out','You clocked out at 03:11 AM. Total work: 0.1 hrs','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-12 19:11:24'),(21,14,'attendance','Clocked In','You clocked in at 04:10 AM','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-12 20:10:02'),(22,1,'attendance','Clocked In','You clocked in at 10:48 PM','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-16 14:48:45'),(23,13,'attendance','Clocked In','You clocked in at 10:49 PM (Late)','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-16 14:49:37'),(24,13,'attendance','Clocked In','You clocked in at 10:05 AM (Late)','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-17 02:05:58'),(25,15,'attendance','Clocked In','You clocked in at 10:24 AM (Late)','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-17 02:24:21'),(26,15,'attendance','Clocked Out','You clocked out at 10:26 AM. Total work: 0.0 hrs','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-17 02:26:53'),(27,16,'attendance','Clocked In','You clocked in at 10:31 AM (Late)','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-17 02:31:10'),(28,16,'attendance','Clocked Out','You clocked out at 10:35 AM. Total work: 0.1 hrs','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-17 02:35:47'),(29,16,'attendance','Clocked In','You clocked in at 01:25 PM (Late)','/ojt/timesheet',NULL,NULL,NULL,0,NULL,'2026-02-19 05:25:24');
/*!40000 ALTER TABLE `ojt_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ojt_task_submissions`
--

DROP TABLE IF EXISTS `ojt_task_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ojt_task_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `trainee_id` int(11) NOT NULL,
  `file_path` text DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `submission_type` enum('text','file','link') DEFAULT 'text',
  `submission_text` text DEFAULT NULL,
  `submission_link` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `trainee_id` (`trainee_id`),
  CONSTRAINT `ojt_task_submissions_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `ojt_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ojt_task_submissions_ibfk_2` FOREIGN KEY (`trainee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ojt_task_submissions`
--

LOCK TABLES `ojt_task_submissions` WRITE;
/*!40000 ALTER TABLE `ojt_task_submissions` DISABLE KEYS */;
INSERT INTO `ojt_task_submissions` VALUES (1,1,13,NULL,NULL,NULL,NULL,'text','test',NULL,NULL,'2026-02-12 15:47:03'),(2,1,13,NULL,NULL,NULL,NULL,'text','test',NULL,NULL,'2026-02-12 15:47:12'),(3,1,13,NULL,NULL,NULL,NULL,'text','test',NULL,NULL,'2026-02-12 15:47:37'),(4,1,13,'[{\"path\":\"uploads\\/tasks\\/task_1_698df7a6b14cb.png\",\"name\":\"42.png\",\"size\":805475,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_1_698df7a6b17e9.png\",\"name\":\"43.png\",\"size\":420208,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_1_698df7a6b1a77.png\",\"name\":\"44.png\",\"size\":782911,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_1_698df7a6b1cf3.png\",\"name\":\"45.png\",\"size\":1597263,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_1_698df7a6b1f82.png\",\"name\":\"b5.png\",\"size\":621103,\"type\":\"image\\/png\"}]','42.png','image/png',805475,'file','sadasdasda',NULL,NULL,'2026-02-12 15:54:14'),(5,1,13,'[{\"path\":\"uploads\\/tasks\\/task_1_698dfb8d90b11.png\",\"name\":\"42.png\",\"size\":805475,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_1_698dfb8d90e18.png\",\"name\":\"43.png\",\"size\":420208,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_1_698dfb8d910e6.png\",\"name\":\"44.png\",\"size\":782911,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_1_698dfb8d9172f.png\",\"name\":\"45.png\",\"size\":1597263,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_1_698dfb8d9199a.png\",\"name\":\"b5.png\",\"size\":621103,\"type\":\"image\\/png\"}]','42.png','image/png',805475,'file','sadasdasda',NULL,NULL,'2026-02-12 16:10:53'),(6,2,13,'[{\"path\":\"uploads\\/tasks\\/task_2_698dfd3fdc70b.png\",\"name\":\"42.png\",\"size\":805475,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_2_698dfd3fdca22.png\",\"name\":\"43.png\",\"size\":420208,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_2_698dfd3fdccaa.png\",\"name\":\"44.png\",\"size\":782911,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_2_698dfd3fdcf0b.png\",\"name\":\"45.png\",\"size\":1597263,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_2_698dfd3fdd1b7.png\",\"name\":\"b1.png\",\"size\":1804823,\"type\":\"image\\/png\"}]','42.png','image/png',805475,'file','asdsadasd',NULL,NULL,'2026-02-12 16:18:07'),(7,2,13,NULL,NULL,NULL,NULL,'text','test submission',NULL,NULL,'2026-02-12 16:38:24'),(8,3,13,'[{\"path\":\"uploads\\/tasks\\/task_3_698e097cc4d9c.png\",\"name\":\"42.png\",\"size\":805475,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_3_698e097cc501d.png\",\"name\":\"43.png\",\"size\":420208,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_3_698e097cc51c9.png\",\"name\":\"44.png\",\"size\":782911,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_3_698e097cc578b.png\",\"name\":\"45.png\",\"size\":1597263,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_3_698e097cc5a62.png\",\"name\":\"b1.png\",\"size\":1804823,\"type\":\"image\\/png\"}]','42.png','image/png',805475,'file','asdasdas dassada',NULL,NULL,'2026-02-12 17:10:20'),(9,2,13,'[{\"path\":\"uploads\\/tasks\\/task_2_698e12a224565.png\",\"name\":\"b3.png\",\"size\":1282334,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_2_698e12a224802.png\",\"name\":\"b4.png\",\"size\":2118621,\"type\":\"image\\/png\"},{\"path\":\"uploads\\/tasks\\/task_2_698e12a224a2f.png\",\"name\":\"b5.png\",\"size\":621103,\"type\":\"image\\/png\"}]','b3.png','image/png',1282334,'file','asdasdasdasd',NULL,NULL,'2026-02-12 17:49:22');
/*!40000 ALTER TABLE `ojt_task_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ojt_tasks`
--

DROP TABLE IF EXISTS `ojt_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ojt_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `assigned_to` int(11) NOT NULL,
  `assigned_by` int(11) NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('pending','in_progress','submitted','under_review','revision','approved','rejected') DEFAULT 'pending',
  `due_date` date DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `submission_notes` text DEFAULT NULL,
  `submission_files` text DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `score` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `assigned_by` (`assigned_by`),
  KEY `idx_ojt_tasks_assigned_to` (`assigned_to`),
  KEY `idx_ojt_tasks_status` (`status`),
  CONSTRAINT `ojt_tasks_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ojt_tasks_ibfk_2` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ojt_tasks`
--

LOCK TABLES `ojt_tasks` WRITE;
/*!40000 ALTER TABLE `ojt_tasks` DISABLE KEYS */;
INSERT INTO `ojt_tasks` VALUES (1,'asdasd','asdasd',13,7,'medium','approved','2026-02-15','2026-02-13 00:14:33','2026-02-13 00:10:53','sadasdasda',NULL,'Good work',NULL,'2026-02-12 14:46:56','2026-02-12 16:44:37'),(2,'asdasd','asdasda',13,7,'medium','approved','2026-02-15','2026-02-13 01:49:35','2026-02-13 01:49:22','asdasdasdasd',NULL,'',NULL,'2026-02-12 16:16:53','2026-02-12 17:49:35'),(3,'asdasda','asdasd',13,7,'high','rejected','2026-11-01',NULL,'2026-02-13 01:10:20','asdasdas dassada',NULL,'Some parts need improvement. See feedback for details.',NULL,'2026-02-12 17:10:04','2026-02-12 17:10:40');
/*!40000 ALTER TABLE `ojt_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ojt_timesheets`
--

DROP TABLE IF EXISTS `ojt_timesheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ojt_timesheets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trainee_id` int(11) NOT NULL,
  `supervisor_id` int(11) DEFAULT NULL,
  `week_start` date NOT NULL,
  `week_end` date NOT NULL,
  `total_hours` decimal(6,2) DEFAULT 0.00,
  `overtime_hours` decimal(5,2) DEFAULT 0.00,
  `status` enum('draft','submitted','approved','rejected') DEFAULT 'draft',
  `submitted_at` datetime DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_timesheet` (`trainee_id`,`week_start`),
  KEY `supervisor_id` (`supervisor_id`),
  CONSTRAINT `ojt_timesheets_ibfk_1` FOREIGN KEY (`trainee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ojt_timesheets_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ojt_timesheets`
--

LOCK TABLES `ojt_timesheets` WRITE;
/*!40000 ALTER TABLE `ojt_timesheets` DISABLE KEYS */;
/*!40000 ALTER TABLE `ojt_timesheets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ojt_user_achievements`
--

DROP TABLE IF EXISTS `ojt_user_achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ojt_user_achievements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `achievement_id` int(11) NOT NULL,
  `earned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `progress` int(11) DEFAULT 0,
  `is_notified` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_achievement` (`user_id`,`achievement_id`),
  KEY `achievement_id` (`achievement_id`),
  CONSTRAINT `ojt_user_achievements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ojt_user_achievements_ibfk_2` FOREIGN KEY (`achievement_id`) REFERENCES `ojt_achievement_definitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ojt_user_achievements`
--

LOCK TABLES `ojt_user_achievements` WRITE;
/*!40000 ALTER TABLE `ojt_user_achievements` DISABLE KEYS */;
/*!40000 ALTER TABLE `ojt_user_achievements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `product_sku` varchar(100) DEFAULT NULL,
  `variation` varchar(100) DEFAULT NULL,
  `variation_id` varchar(50) DEFAULT NULL,
  `variation_name` varchar(100) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `total_price` decimal(10,2) NOT NULL,
  `product_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`product_snapshot`)),
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed` tinyint(1) DEFAULT 0,
  `review_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  KEY `idx_order_items_product` (`product_id`),
  KEY `fk_order_items_review` (`review_id`),
  CONSTRAINT `fk_order_items_review` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (5,7,1,'mens',NULL,'100ml',NULL,NULL,1,684.00,0.00,684.00,'{\"image\":\"https:\\/\\/fragranza-web.vercel.app\\/api\\/image?path=%2Fuploads%2Fproducts%2Fproduct_698db6ea3cbb35.57784261.png\",\"original_price\":684,\"variation\":\"100ml\"}',NULL,'2026-02-12 13:01:46',0,NULL),(6,8,1,'mens',NULL,'100ml',NULL,NULL,1,684.00,0.00,684.00,'{\"image\":\"https:\\/\\/fragranza-web.vercel.app\\/api\\/image?path=%2Fuploads%2Fproducts%2Fproduct_698db6ea3cbb35.57784261.png\",\"original_price\":684,\"variation\":\"100ml\"}',NULL,'2026-02-17 08:08:22',0,NULL),(7,9,1,'mens',NULL,'200ml',NULL,NULL,1,1368.00,0.00,1368.00,'{\"image\":\"https:\\/\\/fragranza-web.vercel.app\\/api\\/image?path=%2Fuploads%2Fproducts%2Fproduct_698db6ea5507c9.72617188.png\",\"original_price\":1368,\"variation\":\"200ml\"}',NULL,'2026-02-18 05:23:43',0,NULL),(8,9,1,'mens',NULL,'100ml',NULL,NULL,1,684.00,0.00,684.00,'{\"image\":\"https:\\/\\/fragranza-web.vercel.app\\/api\\/image?path=%2Fuploads%2Fproducts%2Fproduct_698db6ea3cbb35.57784261.png\",\"original_price\":684,\"variation\":\"100ml\"}',NULL,'2026-02-18 05:23:43',0,NULL),(9,10,1,'mens',NULL,'100ml',NULL,NULL,2,684.00,0.00,1368.00,'{\"image\":\"https:\\/\\/fragranza-web.vercel.app\\/api\\/image?path=%2Fuploads%2Fproducts%2Fproduct_698db6ea3cbb35.57784261.png\",\"original_price\":684,\"variation\":\"100ml\"}',NULL,'2026-02-18 05:24:08',0,NULL),(10,11,1,'mens',NULL,'100ml',NULL,NULL,1,684.00,0.00,684.00,'{\"image\":\"https:\\/\\/fragranza-web.vercel.app\\/api\\/image?path=%2Fuploads%2Fproducts%2Fproduct_698db6ea3cbb35.57784261.png\",\"original_price\":684,\"variation\":\"100ml\"}',NULL,'2026-02-18 05:39:45',0,NULL),(11,12,1,'mens',NULL,'200ml',NULL,NULL,1,1368.00,0.00,1368.00,'{\"image\":\"https:\\/\\/fragranza-web.vercel.app\\/api\\/image?path=%2Fuploads%2Fproducts%2Fproduct_698db6ea5507c9.72617188.png\",\"original_price\":1368,\"variation\":\"200ml\"}',NULL,'2026-02-18 05:56:25',0,NULL);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('pending','ordered','confirmed','ready','paid_waiting_approval','cod_waiting_approval','paid_ready_pickup','processing','in_transit','waiting_client','shipped','delivered','picked_up','completed','cancelled','return_requested','return_approved','returned','refund_requested','refunded') DEFAULT 'pending',
  `payment_status` enum('pending','paid','partial','refunded','failed') DEFAULT 'pending',
  `payment_method` enum('cod','store_pickup','gcash','bank_transfer','credit_card') DEFAULT 'cod',
  `subtotal` decimal(12,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `discount_code` varchar(50) DEFAULT NULL,
  `shipping_amount` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL,
  `shipping_fee` decimal(10,2) DEFAULT 0.00,
  `shipping_address` text DEFAULT NULL,
  `shipping_first_name` varchar(100) DEFAULT NULL,
  `shipping_last_name` varchar(100) DEFAULT NULL,
  `shipping_email` varchar(100) DEFAULT NULL,
  `shipping_city` varchar(100) DEFAULT NULL,
  `shipping_province` varchar(100) DEFAULT NULL,
  `shipping_zip` varchar(10) DEFAULT NULL,
  `shipping_zip_code` varchar(20) DEFAULT NULL,
  `shipping_phone` varchar(20) DEFAULT NULL,
  `shipping_notes` text DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `internal_notes` text DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `tracking_url` text DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `cancelled_reason` text DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `billing_name` varchar(200) DEFAULT NULL,
  `billing_email` varchar(100) DEFAULT NULL,
  `billing_phone` varchar(20) DEFAULT NULL,
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `customer_verified_at` datetime DEFAULT NULL,
  `shop_rated` tinyint(1) DEFAULT 0,
  `shop_rating_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `user_id` (`user_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `idx_orders_number` (`order_number`),
  KEY `idx_orders_customer` (`customer_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_payment` (`payment_status`),
  KEY `idx_orders_created` (`created_at`),
  KEY `fk_orders_shop_rating` (`shop_rating_id`),
  CONSTRAINT `fk_orders_shop_rating` FOREIGN KEY (`shop_rating_id`) REFERENCES `shop_ratings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (7,'FO-260212-7173',NULL,2,'','paid','cod',684.00,0.00,NULL,0.00,0.00,838.00,154.00,'Paliparan, Dasmariñas, Cavite 4114','Renz','Russel Bauto','renzrusselbauto@gmail.com','Dasmariñas','Cavite',NULL,'4114','09917648384','Shipping: delivery (motorcycle)',NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-12 21:35:24',NULL,NULL,NULL,'2026-02-12 13:01:46','2026-02-17 08:04:53',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL),(8,'FO-260217-8617',NULL,2,'','pending','cod',684.00,0.00,NULL,0.00,0.00,838.00,154.00,'Paliparan, Dasmariñas, Cavite 4114','Renz','Russel Bauto','renzrusselbauto@gmail.com','Dasmariñas','Cavite',NULL,'4114','09917648384','Shipping: delivery (motorcycle)',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-17 08:08:22','2026-02-17 08:49:01',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL),(9,'FO-260218-8363',NULL,2,'completed','paid','cod',2052.00,0.00,NULL,0.00,0.00,2052.00,0.00,'Paliparan, Dasmariñas, Cavite 4114','Renz','Russel Bauto','renzrusselbauto@gmail.com','Dasmariñas','Cavite',NULL,'4114','09917648384','Shipping: store_pickup',NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-18 15:58:32',NULL,NULL,NULL,'2026-02-18 05:23:43','2026-02-19 02:38:47',NULL,NULL,NULL,NULL,NULL,'2026-02-19 10:38:47',0,NULL),(10,'FO-260218-5531',NULL,2,'completed','paid','cod',1368.00,0.00,NULL,0.00,0.00,1522.00,154.00,'Paliparan, Dasmariñas, Cavite 4114','Renz','Russel Bauto','renzrusselbauto@gmail.com','Dasmariñas','Cavite',NULL,'4114','09917648384','Shipping: delivery (motorcycle)',NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-18 15:40:03',NULL,NULL,NULL,'2026-02-18 05:24:08','2026-02-18 07:58:20',NULL,NULL,NULL,6,'2026-02-18 15:40:03',NULL,0,NULL),(11,'FO-260218-9533',NULL,2,'completed','paid','cod',684.00,0.00,NULL,0.00,0.00,838.00,154.00,'Paliparan, Dasmariñas, Cavite 4114','Renz','Russel Bauto','renzrusselbauto@gmail.com','Dasmariñas','Cavite',NULL,'4114','09917648384','Shipping: delivery (motorcycle)',NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-18 15:37:09',NULL,NULL,NULL,'2026-02-18 05:39:45','2026-02-18 07:58:16',NULL,NULL,NULL,6,'2026-02-18 15:37:09',NULL,0,NULL),(12,'FO-260218-0422',NULL,2,'completed','pending','',1368.00,0.00,NULL,0.00,0.00,1522.00,154.00,'Paliparan, Dasmariñas, Cavite 4114','Renz','Russel Bauto','renzrusselbauto@gmail.com','Dasmariñas','Cavite',NULL,'4114','09917648384','Shipping: delivery (motorcycle)',NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-18 15:45:06',NULL,NULL,NULL,'2026-02-18 05:56:25','2026-02-19 02:49:17',NULL,NULL,NULL,6,'2026-02-18 15:33:20',NULL,1,1);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `order_item_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `customer_email` varchar(100) DEFAULT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `title` varchar(200) DEFAULT NULL,
  `review` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `videos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`videos`)),
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `is_verified_purchase` tinyint(1) DEFAULT 0,
  `helpful_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_reviews_product` (`product_id`),
  KEY `idx_reviews_order` (`order_id`),
  KEY `idx_reviews_user` (`user_id`),
  KEY `idx_reviews_rating` (`rating`),
  KEY `idx_reviews_status` (`status`),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `product_reviews_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_reviews` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER IF NOT EXISTS update_product_rating_after_insert
AFTER INSERT ON product_reviews
FOR EACH ROW
BEGIN
    IF NEW.status = 'approved' THEN
        UPDATE products 
        SET 
            average_rating = (SELECT AVG(rating) FROM product_reviews WHERE product_id = NEW.product_id AND status = 'approved'),
            review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = NEW.product_id AND status = 'approved')
        WHERE id = NEW.product_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER IF NOT EXISTS update_product_rating_after_update
AFTER UPDATE ON product_reviews
FOR EACH ROW
BEGIN
    UPDATE products 
    SET 
        average_rating = (SELECT AVG(rating) FROM product_reviews WHERE product_id = NEW.product_id AND status = 'approved'),
        review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = NEW.product_id AND status = 'approved')
    WHERE id = NEW.product_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER IF NOT EXISTS update_product_rating_after_delete
AFTER DELETE ON product_reviews
FOR EACH ROW
BEGIN
    UPDATE products 
    SET 
        average_rating = COALESCE((SELECT AVG(rating) FROM product_reviews WHERE product_id = OLD.product_id AND status = 'approved'), 0),
        review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = OLD.product_id AND status = 'approved')
    WHERE id = OLD.product_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `compare_price` decimal(10,2) DEFAULT NULL,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `image_main` text DEFAULT NULL,
  `image_gallery` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`image_gallery`)),
  `volume` varchar(50) DEFAULT NULL,
  `concentration` varchar(50) DEFAULT NULL,
  `ingredients` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `notes_top` text DEFAULT NULL,
  `notes_middle` text DEFAULT NULL,
  `notes_base` text DEFAULT NULL,
  `stock_quantity` int(11) DEFAULT 0,
  `stock_status` enum('in_stock','out_of_stock','low_stock','coming_soon') DEFAULT 'in_stock',
  `low_stock_threshold` int(11) DEFAULT 10,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_new` tinyint(1) DEFAULT 0,
  `is_on_sale` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `rating` decimal(2,1) DEFAULT 0.0,
  `review_count` int(11) DEFAULT 0,
  `variations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`variations`)),
  `meta_title` varchar(200) DEFAULT NULL,
  `meta_description` varchar(500) DEFAULT NULL,
  `weight` decimal(10,2) DEFAULT NULL,
  `dimensions` varchar(100) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `average_rating` decimal(2,1) DEFAULT 0.0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `sku` (`sku`),
  KEY `idx_category` (`category_id`),
  KEY `idx_slug` (`slug`),
  KEY `idx_sku` (`sku`),
  KEY `idx_featured` (`is_featured`),
  KEY `idx_price` (`price`),
  KEY `idx_stock` (`stock_status`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'mens','mens','A luxurious scent that embodies femininity and grace. Perfect for any occasion, from daily wear to special events.','An elegant and captivating fragrance for the modern woman',2,380.00,460.00,NULL,'WP-MENS-001',NULL,'/uploads/products/product_698db6e72615a9.68275286.png','[]','50ml','Eau de Parfum',NULL,NULL,'Bergamot, Pink Pepper, Pear','Rose, Jasmine, Peony','Musk, Vanilla, Sandalwood',40,'in_stock',10,0,1,0,1,0.0,0,'[{\"id\":\"var-1770894898945\",\"volume\":\"100ml\",\"price\":684,\"comparePrice\":790,\"stock\":50,\"sku\":\"WP-MENS-001-100ML\",\"image\":\"\\/uploads\\/products\\/product_698db6ea3cbb35.57784261.png\",\"description\":null,\"isDefault\":true},{\"id\":\"var-1770894904060\",\"volume\":\"200ml\",\"price\":1368,\"comparePrice\":1575,\"stock\":50,\"sku\":\"WP-MENS-001-200ML\",\"image\":\"\\/uploads\\/products\\/product_698db6ea5507c9.72617188.png\",\"description\":null,\"isDefault\":false}]',NULL,NULL,NULL,NULL,0,'2026-02-12 11:18:03','2026-02-18 07:58:32',0.0);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_rating_stats`
--

DROP TABLE IF EXISTS `shop_rating_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shop_rating_stats` (
  `id` int(11) NOT NULL DEFAULT 1,
  `total_ratings` int(11) DEFAULT 0,
  `average_rating` decimal(3,2) DEFAULT 0.00,
  `average_service` decimal(3,2) DEFAULT 0.00,
  `average_delivery` decimal(3,2) DEFAULT 0.00,
  `average_packaging` decimal(3,2) DEFAULT 0.00,
  `recommend_percentage` decimal(5,2) DEFAULT 0.00,
  `rating_5_count` int(11) DEFAULT 0,
  `rating_4_count` int(11) DEFAULT 0,
  `rating_3_count` int(11) DEFAULT 0,
  `rating_2_count` int(11) DEFAULT 0,
  `rating_1_count` int(11) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_rating_stats`
--

LOCK TABLES `shop_rating_stats` WRITE;
/*!40000 ALTER TABLE `shop_rating_stats` DISABLE KEYS */;
INSERT INTO `shop_rating_stats` VALUES (1,1,5.00,5.00,4.00,5.00,100.00,1,0,0,0,0,'2026-02-19 02:49:17');
/*!40000 ALTER TABLE `shop_rating_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_ratings`
--

DROP TABLE IF EXISTS `shop_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shop_ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `customer_email` varchar(100) DEFAULT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `service_rating` tinyint(4) DEFAULT NULL CHECK (`service_rating` >= 1 and `service_rating` <= 5),
  `delivery_rating` tinyint(4) DEFAULT NULL CHECK (`delivery_rating` >= 1 and `delivery_rating` <= 5),
  `packaging_rating` tinyint(4) DEFAULT NULL CHECK (`packaging_rating` >= 1 and `packaging_rating` <= 5),
  `feedback` text DEFAULT NULL,
  `would_recommend` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order_rating` (`order_id`),
  KEY `idx_shop_rating` (`rating`),
  KEY `idx_shop_user` (`user_id`),
  KEY `idx_shop_created` (`created_at`),
  CONSTRAINT `shop_ratings_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `shop_ratings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_ratings`
--

LOCK TABLES `shop_ratings` WRITE;
/*!40000 ALTER TABLE `shop_ratings` DISABLE KEYS */;
INSERT INTO `shop_ratings` VALUES (1,12,NULL,NULL,NULL,5,5,4,5,'Great service!',1,'2026-02-19 02:49:17','2026-02-19 02:49:17');
/*!40000 ALTER TABLE `shop_ratings` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER IF NOT EXISTS update_shop_stats_after_insert
AFTER INSERT ON shop_ratings
FOR EACH ROW
BEGIN
    UPDATE shop_rating_stats SET
        total_ratings = (SELECT COUNT(*) FROM shop_ratings),
        average_rating = (SELECT AVG(rating) FROM shop_ratings),
        average_service = (SELECT AVG(service_rating) FROM shop_ratings WHERE service_rating IS NOT NULL),
        average_delivery = (SELECT AVG(delivery_rating) FROM shop_ratings WHERE delivery_rating IS NOT NULL),
        average_packaging = (SELECT AVG(packaging_rating) FROM shop_ratings WHERE packaging_rating IS NOT NULL),
        recommend_percentage = (SELECT (SUM(would_recommend) / COUNT(*)) * 100 FROM shop_ratings),
        rating_5_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 5),
        rating_4_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 4),
        rating_3_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 3),
        rating_2_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 2),
        rating_1_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 1)
    WHERE id = 1;
    
    
    IF NEW.order_id IS NOT NULL THEN
        UPDATE orders SET shop_rated = TRUE, shop_rating_id = NEW.id WHERE id = NEW.order_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER IF NOT EXISTS update_shop_stats_after_update
AFTER UPDATE ON shop_ratings
FOR EACH ROW
BEGIN
    UPDATE shop_rating_stats SET
        total_ratings = (SELECT COUNT(*) FROM shop_ratings),
        average_rating = (SELECT AVG(rating) FROM shop_ratings),
        average_service = (SELECT AVG(service_rating) FROM shop_ratings WHERE service_rating IS NOT NULL),
        average_delivery = (SELECT AVG(delivery_rating) FROM shop_ratings WHERE delivery_rating IS NOT NULL),
        average_packaging = (SELECT AVG(packaging_rating) FROM shop_ratings WHERE packaging_rating IS NOT NULL),
        recommend_percentage = (SELECT (SUM(would_recommend) / COUNT(*)) * 100 FROM shop_ratings),
        rating_5_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 5),
        rating_4_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 4),
        rating_3_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 3),
        rating_2_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 2),
        rating_1_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 1)
    WHERE id = 1;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER IF NOT EXISTS update_shop_stats_after_delete
AFTER DELETE ON shop_ratings
FOR EACH ROW
BEGIN
    UPDATE shop_rating_stats SET
        total_ratings = (SELECT COUNT(*) FROM shop_ratings),
        average_rating = COALESCE((SELECT AVG(rating) FROM shop_ratings), 0),
        average_service = COALESCE((SELECT AVG(service_rating) FROM shop_ratings WHERE service_rating IS NOT NULL), 0),
        average_delivery = COALESCE((SELECT AVG(delivery_rating) FROM shop_ratings WHERE delivery_rating IS NOT NULL), 0),
        average_packaging = COALESCE((SELECT AVG(packaging_rating) FROM shop_ratings WHERE packaging_rating IS NOT NULL), 0),
        recommend_percentage = COALESCE((SELECT (SUM(would_recommend) / COUNT(*)) * 100 FROM shop_ratings), 0),
        rating_5_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 5),
        rating_4_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 4),
        rating_3_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 3),
        rating_2_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 2),
        rating_1_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 1)
    WHERE id = 1;
    
    
    IF OLD.order_id IS NOT NULL THEN
        UPDATE orders SET shop_rated = FALSE, shop_rating_id = NULL WHERE id = OLD.order_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `stock_alerts`
--

DROP TABLE IF EXISTS `stock_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_alerts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `alert_type` enum('low_stock','out_of_stock','overstock') NOT NULL,
  `current_quantity` int(11) DEFAULT NULL,
  `threshold_quantity` int(11) DEFAULT NULL,
  `is_resolved` tinyint(1) DEFAULT 0,
  `resolved_at` datetime DEFAULT NULL,
  `resolved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `stock_alerts_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_alerts`
--

LOCK TABLES `stock_alerts` WRITE;
/*!40000 ALTER TABLE `stock_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_activity_log`
--

DROP TABLE IF EXISTS `user_activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_activity_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `activity_type` enum('login','logout','register','password_change','profile_update','password_reset') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_activity_user` (`user_id`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_activity_date` (`created_at`),
  CONSTRAINT `user_activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_activity_log`
--

LOCK TABLES `user_activity_log` WRITE;
/*!40000 ALTER TABLE `user_activity_log` DISABLE KEYS */;
INSERT INTO `user_activity_log` VALUES (1,2,'register','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"action\":\"register\",\"firstName\":\"Renz Russel\",\"lastName\":\"Bauto\",\"email\":\"renzrusselbauto@gmail.com\",\"password\":\"Test@1234\",\"confirmPassword\":\"Test@1234\",\"role\":\"customer\",\"birthDate\":\"1995-06-15\",\"gender\":\"male\",\"phone\":\"09171234567\",\"address\":\"123 Rizal Street, Brgy. San Antonio\",\"city\":\"Makati City\",\"province\":\"Metro Manila\",\"zipCode\":\"1200\",\"subscribeNewsletter\":true,\"supervisorId\":null,\"university\":null,\"course\":null,\"department\":null,\"requiredHours\":500}','2026-02-11 11:50:20'),(2,3,'register','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"action\":\"register\",\"firstName\":\"Renz Russel\",\"lastName\":\"Bauto\",\"email\":\"vendor0qw@gmail.com\",\"password\":\"Test@1234\",\"confirmPassword\":\"Test@1234\",\"role\":\"admin\",\"birthDate\":\"1995-06-15\",\"gender\":\"male\",\"phone\":\"09171234567\",\"address\":\"123 Rizal Street, Brgy. San Antonio\",\"city\":\"Makati City\",\"province\":\"Metro Manila\",\"zipCode\":\"1200\",\"subscribeNewsletter\":true,\"supervisorId\":null,\"university\":null,\"course\":null,\"department\":null,\"requiredHours\":500}','2026-02-11 11:54:50'),(3,3,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-11 11:54:58'),(4,1,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-11 12:38:51'),(5,4,'register','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"action\":\"register\",\"firstName\":\"Renz Russel\",\"lastName\":\"Bauto\",\"email\":\"superv@gmail.com\",\"password\":\"Test@1234\",\"confirmPassword\":\"Test@1234\",\"role\":\"ojt_supervisor\",\"birthDate\":\"1995-06-15\",\"gender\":\"male\",\"phone\":\"09171234567\",\"address\":\"123 Rizal Street, Brgy. San Antonio\",\"city\":\"Makati City\",\"province\":\"Metro Manila\",\"zipCode\":\"1200\",\"subscribeNewsletter\":true,\"supervisorId\":null,\"university\":null,\"course\":null,\"department\":null,\"requiredHours\":500}','2026-02-11 16:26:21'),(6,4,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-11 16:29:05'),(7,4,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-11 18:31:41'),(8,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-11 19:43:15'),(9,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-11 19:45:57'),(10,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-11 19:49:47'),(11,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-12 07:15:35'),(12,5,'register','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"action\":\"register\",\"firstName\":\"Renz Russel\",\"lastName\":\"Bauto\",\"email\":\"newadmin@fragranza.com\",\"password\":\"Test@1234\",\"confirmPassword\":\"Test@1234\",\"role\":\"admin\",\"birthDate\":\"1995-06-15\",\"gender\":\"male\",\"phone\":\"09171234567\",\"address\":\"123 Rizal Street, Brgy. San Antonio\",\"city\":\"Makati City\",\"province\":\"Metro Manila\",\"zipCode\":\"1200\",\"subscribeNewsletter\":false,\"supervisorId\":null,\"university\":null,\"course\":null,\"department\":null,\"requiredHours\":500}','2026-02-12 07:21:20'),(13,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-12 07:21:27'),(14,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-12 07:26:15'),(15,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-12 07:46:25'),(16,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-12 07:50:58'),(17,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-12 07:52:24'),(18,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','{\"ip\":\"::1\"}','2026-02-12 07:52:29'),(19,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 08:14:27'),(20,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 08:14:51'),(21,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 10:57:08'),(22,6,'register','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"action\":\"register\",\"firstName\":\"Sales\",\"lastName\":\"Representative\",\"email\":\"vendor0qw2@gmail.com\",\"password\":\"Test@1234\",\"confirmPassword\":\"Test@1234\",\"role\":\"sales\",\"birthDate\":\"1999-09-09\",\"gender\":\"male\",\"phone\":\"09917648384\",\"address\":\"paliparan 2\",\"city\":\"asdasd\",\"province\":\"assadas\",\"zipCode\":\"4114\",\"subscribeNewsletter\":false,\"supervisorId\":null,\"university\":null,\"course\":null,\"department\":null,\"requiredHours\":500}','2026-02-12 10:58:22'),(23,6,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 10:58:30'),(24,6,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 11:06:12'),(25,6,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 11:14:33'),(26,6,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 11:22:22'),(27,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 11:30:28'),(28,6,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 11:30:40'),(29,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 11:32:27'),(30,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 12:15:02'),(31,6,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 12:19:32'),(32,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 12:35:20'),(33,6,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 13:11:42'),(34,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 13:36:55'),(36,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 13:58:35'),(37,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 14:21:34'),(39,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 14:44:14'),(40,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 14:44:29'),(41,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 14:45:32'),(42,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 14:46:11'),(43,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 14:46:34'),(44,13,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 14:47:21'),(45,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 16:11:15'),(46,13,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 16:15:32'),(47,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 16:16:01'),(48,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 16:16:24'),(49,13,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 16:17:11'),(50,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 16:40:54'),(51,13,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 16:41:32'),(52,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 17:09:34'),(53,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 20:07:00'),(54,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 20:07:45'),(55,14,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 20:08:38'),(56,13,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-12 20:08:58'),(57,13,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-13 13:23:43'),(58,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-13 16:11:46'),(59,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-16 14:18:41'),(60,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-16 14:18:56'),(61,13,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-16 14:27:29'),(62,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:05:27'),(63,13,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:05:42'),(64,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:06:34'),(65,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:09:03'),(66,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:21:17'),(67,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:23:39'),(68,15,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:24:12'),(69,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:24:33'),(70,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:27:56'),(71,16,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:28:57'),(72,16,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:30:55'),(73,16,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:35:29'),(74,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:36:27'),(75,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 02:41:52'),(76,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 04:47:13'),(77,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 07:23:57'),(78,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 08:09:43'),(79,17,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 08:10:19'),(80,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 09:20:01'),(81,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-17 09:20:20'),(82,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 02:46:39'),(83,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 02:55:23'),(84,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 03:03:59'),(85,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 03:07:47'),(86,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 03:08:06'),(87,17,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 03:08:51'),(88,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 03:17:19'),(89,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 03:22:18'),(90,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 03:22:37'),(91,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 04:43:50'),(92,19,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 04:44:34'),(93,19,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 04:59:46'),(94,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 05:17:16'),(95,17,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 05:54:04'),(96,17,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-18 07:12:12'),(97,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-19 01:42:45'),(98,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-19 02:36:23'),(99,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-19 04:13:02'),(100,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-19 05:13:19'),(101,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-19 05:18:05'),(102,19,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-19 05:19:57'),(103,16,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-19 05:20:30'),(104,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-19 05:44:16'),(105,19,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-19 06:07:56'),(106,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-19 06:24:38'),(107,2,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-22 13:43:21'),(108,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-26 06:53:45'),(109,7,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-26 06:54:32'),(110,5,'login','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','{\"ip\":\"::1\"}','2026-02-26 07:22:03');
/*!40000 ALTER TABLE `user_activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `idx_session_token` (`session_token`),
  KEY `idx_session_user` (`user_id`),
  KEY `idx_session_expires` (`expires_at`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
INSERT INTO `user_sessions` VALUES (1,3,'c0fcfaacfd59d5ed68f9e8d2eada5e55b09df21878e98fd4f714be2da6a5aff5','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-18 12:54:58','2026-02-11 11:54:58'),(2,1,'d298466b4c40cab395b9d08448be47f314297dad032f46402e3a79232bb13a22','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-18 13:38:51','2026-02-11 12:38:51'),(3,4,'2a808e1c5b56565759ef781cc81e42ebb6b33c56b995d11cefd55dbf192a0b75','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-18 17:29:05','2026-02-11 16:29:05'),(4,4,'4f1de1f9831e9f9149824cfd04431803921c147109729be8b3921944912fa911','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-18 19:31:41','2026-02-11 18:31:41'),(5,2,'483f7bcff7f0b4d4919d25a35c3464db475a58b40ac240aa3afa06c08b2cc083','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-18 20:43:15','2026-02-11 19:43:15'),(6,2,'0245d54473c7e7098d558720d9104ddbbd66ff2bf7aab930e222eec4214413d2','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-18 20:45:57','2026-02-11 19:45:57'),(7,2,'92498d15b912db3522e1b21d99d54b0011eb9c8715efa30d4a453828026c1e0d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-18 20:49:47','2026-02-11 19:49:47'),(8,2,'f7bd01dc1c4b6e6bd4c47b437b1a6d1543e919596678bfdc9c96bd91afd3c5ae','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-19 08:15:35','2026-02-12 07:15:35'),(9,5,'1705da6b90642d90b2b9d39d8916e3c6ba1af3aeac965c8b5c8ef6b5f2490d9e','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-19 08:21:27','2026-02-12 07:21:27'),(10,5,'a317bdf0c75bf820778f9bc6e7b0926a89d82dc2a7cdf861ab471f583669ab70','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-19 08:26:15','2026-02-12 07:26:15'),(11,2,'523c87ff0cfd3b6fb4c311c6e6cc724ca1bd9af99806d98486ad3f4e99c91c17','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-19 08:46:25','2026-02-12 07:46:25'),(12,2,'c02456dbc30692289a8c28bd75300448fcd388be89ccef14cf3a55cdfaece07f','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-19 08:50:58','2026-02-12 07:50:58'),(13,2,'c98485238c45993ac499aaa03aa4b8a571179ddf86c0ff25a8a97a7482b53538','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-19 08:52:24','2026-02-12 07:52:24'),(14,2,'dcc2d8415721c7b2b451239ef2fe0c37e933b03b2606f6410a710f601dd2e517','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0','2026-02-19 08:52:29','2026-02-12 07:52:29'),(15,2,'68a84ad4a138e6abd0bbcc00cd5e7aeda3d8c93068172f2e982f9fc388c60a32','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 09:14:27','2026-02-12 08:14:27'),(16,5,'0c450223089dd3093341d86438c3c2ed544ac960f109fa40dfbf7fa0db22acd8','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 09:14:51','2026-02-12 08:14:51'),(17,2,'b1d63c7c228cefd7cdbf313dd93c31256c4d66022b8871c7535d1b57cb488ea4','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 11:57:08','2026-02-12 10:57:08'),(18,6,'6c9fc923f52e3b400a3644dded153dbd5ac3359ff2703b858bfbdd7bdeed1c14','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 11:58:30','2026-02-12 10:58:30'),(19,6,'b39814e03898a044226ba9964c00df9dfadd3c0066b82ad959c5a0e601b99bbc','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 12:06:12','2026-02-12 11:06:12'),(20,6,'81cc43a046dc101264b005c2e8fe93a9bfe4de5a59782bf33ac2b7b216c245ec','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 12:14:33','2026-02-12 11:14:33'),(21,6,'3e0202f90c7ad101364d99b3c2efd26cd6f03abb05e42c99c31292e2feeb10e3','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 12:22:22','2026-02-12 11:22:22'),(22,2,'0538c773359ba908cf620144ef44a1f4e6f705311842f3fc5a8306527fba382a','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 12:30:28','2026-02-12 11:30:28'),(23,6,'341992173af916464946a53661c3d93cd127d922c8ef9f75e9bb34d11f47abf8','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 12:30:40','2026-02-12 11:30:40'),(24,5,'7861ff9e94c47b13f7229ebb4192260b00c685a22358eef9d35bf96eb1552be0','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 12:32:27','2026-02-12 11:32:27'),(25,2,'e5f275a45991bdbfbdf497edfbb9036ef23fc31b4d2ab7679900a08db2566939','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 13:15:02','2026-02-12 12:15:02'),(26,6,'7e3503683ef0f343b6d6adc28a3da02a7a2004e1e186386812e01d791d0b4aa9','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 13:19:32','2026-02-12 12:19:32'),(27,2,'822bc11270c0c2287ced1ad56f995762d2eacb27d6daecf31285d0185aab0dfb','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 13:35:20','2026-02-12 12:35:20'),(28,6,'c329f2d5b8b5e2df21877775729e3697858af8f15702b88a6bb61f937f357a17','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 14:11:42','2026-02-12 13:11:42'),(29,5,'faee6e76993da2b89a51a7657223408cdf9830fd45a3066900dcc096f66d9cb9','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 14:36:55','2026-02-12 13:36:55'),(31,7,'249d76e1674c35c3933f5e76e67edc30d2540a49fff05d215c43a783251410a6','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 14:58:34','2026-02-12 13:58:34'),(32,5,'d66cd96e90eb69462f0413551e4a4fece1c68150e4640fe16fd2eea9b6727c3d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 15:21:34','2026-02-12 14:21:34'),(34,5,'7445ad3820c5736b61c8cf60d266632e7c588bdffc7a4c1fa9b20cf81108f2a6','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 15:44:14','2026-02-12 14:44:14'),(35,7,'426ff8fed20c5b0bde2bfcb94211a4df00e6bb01bac23cdc6522a315bfa65c25','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 15:44:29','2026-02-12 14:44:29'),(36,5,'6a7495d134d67c956a2c86cba012525cce5e459b6ed5b4087928bd6f7fa38c68','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 15:45:32','2026-02-12 14:45:32'),(37,5,'3cfda0b79b5ffc716543dc72f855dc3e275934c3c095170be031b0248af37815','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 15:46:11','2026-02-12 14:46:11'),(38,7,'80d3fecbee9c6adef7627b35356b49ce411f189143c358259a22240a34eae57f','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 15:46:34','2026-02-12 14:46:34'),(39,13,'99851b0ba9adf55311ab727dda146c7958811274b2fa54e8f26c2fb20e1b4638','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 15:47:21','2026-02-12 14:47:21'),(40,7,'066fb01ce4e6259a119e429c168acba5cbc0488db09aeb809af182c04790fe14','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 17:11:15','2026-02-12 16:11:15'),(41,13,'4c969f56a1468f4cf89d3e99cb6bead4145e285c66a586f593cb63d94925dab1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 17:15:32','2026-02-12 16:15:32'),(42,7,'044265d40b5c3d264d5db989d3c655dd4b50fbe2b23d96ddb2459cc8e2452aa4','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 17:16:01','2026-02-12 16:16:01'),(43,7,'dad295d78a924a0d35a9ce328e57f4d6a87c424d802167a82d066a1d0c7fe9ae','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 17:16:24','2026-02-12 16:16:24'),(44,13,'31651002f214149b52b8cf80814bcf29547678776033e0ebb4f1f71bfd6de1c8','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 17:17:11','2026-02-12 16:17:11'),(45,7,'90985801dbac90e22eee29c1a7cfb90c6008bd0ed536aedbb881f0075be63843','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 17:40:54','2026-02-12 16:40:54'),(46,13,'d2e64541c29d956b79cdb1f8bac9a46b4c036927b5687c64cba7e57cbf206c25','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 17:41:32','2026-02-12 16:41:32'),(47,7,'b9ba4482dfe76eb085b81ca9b1b34837a1b5a0285bf7cb9de7f2dff36ae9f5e3','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 18:09:34','2026-02-12 17:09:34'),(48,7,'a1f78ee6fec401fb71dd2b235fafa2526e74f7f2c4406aba918ae6d39a86a49f','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 21:07:00','2026-02-12 20:07:00'),(49,5,'fa6bf8ea6f7cf54022f80cc53b3e7f6c6f7d43d5efb5f47118d8103fbb346249','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 21:07:45','2026-02-12 20:07:45'),(50,14,'25cc7c300256a06e958cc819f53265fa5a238cb2e73df2a326de8a3652917aa6','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 21:08:38','2026-02-12 20:08:38'),(51,13,'61af6534b864806a4b60a836399d9cf3db4fd538e5cb1e1209b680641c50690d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-19 21:08:58','2026-02-12 20:08:58'),(52,13,'4064e2f5bdaafab1aa8de14f2a802171e905112b3d1efd2cf9fc14bb1f183085','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-20 14:23:43','2026-02-13 13:23:43'),(53,2,'c1cf5006f3a034809dad474fa3a488bcf5f239ebc49dcc5a451d9ba7c279c6db','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-20 17:11:46','2026-02-13 16:11:46'),(54,2,'445e669b4cb20d70290272742f491ffcc37250e0e80d499a538d82386ffc83b1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-23 15:18:41','2026-02-16 14:18:41'),(55,7,'f43161775d73d4c21881722b01cccdbbe3034519f6e1b533357ebc62b29018ee','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-23 15:18:56','2026-02-16 14:18:56'),(56,13,'f604fa52fd63689ff0df7b2b1b456da4c703c144f3218bee118b53a410aa0996','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-23 15:27:29','2026-02-16 14:27:29'),(57,2,'4cafda2df17d6fdc90985f16a5f99c8d50968cbe42174cc57508f5bfbbd883b7','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:05:27','2026-02-17 02:05:27'),(58,13,'50cff008316b0bec0cefe82a59f9b1c79bb273059a02b1dabe31198261695b31','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:05:42','2026-02-17 02:05:42'),(59,7,'602856d0c38393ddfe4c9414feae061d3dd1904b68ca3c573d6ba56fa7f27ecb','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:06:34','2026-02-17 02:06:34'),(60,5,'a1be0b746f93c3a90a37b0a9c2874d42dc46607ea99d76db06f0a2cf4c766db9','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:09:03','2026-02-17 02:09:03'),(61,5,'714d54cadffe0251660960b5828b2f1e4abf14af12d2206441e8ec35d2645d75','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:21:17','2026-02-17 02:21:17'),(62,5,'7ed394ce4de464718273f1a44706f44e217b0b07bd7ec27a32caf99ad6d51830','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:23:39','2026-02-17 02:23:39'),(63,15,'224cae7bde85b81dcc55fe11502910eaadfebf1f88e6aa094d10d7b2165463b1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:24:12','2026-02-17 02:24:12'),(64,7,'9df874389f9af66b9106aa93b379d0467ae60161c3bf40e3dfce351df959dca7','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:24:33','2026-02-17 02:24:33'),(65,5,'0783801574ed1d1ced24b019037b91b0999f86c86b6d8418709f014fcac86ec9','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:27:56','2026-02-17 02:27:56'),(66,16,'8922de02677ea1f3c66e8479c675fad5ae26bc17b9ad7eb591e1e20ae2908fe8','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:28:57','2026-02-17 02:28:57'),(67,16,'28592b5e97bbde0dea55d10273f081b3c91740d4e46ad1a9067ccdc7dd3829ac','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:30:55','2026-02-17 02:30:55'),(68,16,'8f934b087f3bed2fd57f8ddef33f0013c4788453d5d4fab21e5f46fdfcb62f9e','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:35:29','2026-02-17 02:35:29'),(69,7,'6b1407ae21b8283d5a7c8582ff484ed7ea6fe334a30ba895ef674ab371922208','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:36:27','2026-02-17 02:36:27'),(70,7,'af24173395c2a421ce15c86204f31a5738c2c75f425c1dee2b9b0d3bc9132d7c','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 03:41:52','2026-02-17 02:41:52'),(71,2,'458cd08dfa52208fc2d26d5d09f9758192feecd31474f9962a5d0ee0a1873cca','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 05:47:12','2026-02-17 04:47:12'),(72,2,'20242a02eb25b84b373722e47e11444147f30293f79bb7d2b12bbcd61e81a2f3','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 08:23:57','2026-02-17 07:23:57'),(73,5,'f2952620c4fccde692ffe3fe1d3d80b18092a6214e2b78c346c9cfecad8e0b72','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 09:09:43','2026-02-17 08:09:43'),(74,17,'3faf2af14a28da7df09540f9cd7cf013649b82d71d05f5ce2f358a7602b219e5','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 09:10:19','2026-02-17 08:10:19'),(75,5,'d7d8955c9044bc71e6efa95933ff27b8b62ca5499e0d02297f61cc5bd73ff49c','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 10:20:01','2026-02-17 09:20:01'),(76,2,'59fe0053e64c6142e0756097e4ae06a432c89b8fe9b1ee868a73d8cbd22567bd','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-24 10:20:20','2026-02-17 09:20:20'),(77,2,'5150b040271b05c50a0d22c493decbd702a352fc1b1e601e1fdae3fb471873a3','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 03:46:39','2026-02-18 02:46:39'),(78,2,'c4ab594c1aeca8bb3e9593589a4821d19a114292ff8b981152cc5941b8c05911','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 03:55:23','2026-02-18 02:55:23'),(79,5,'86c317822a97b0a94919e5f52013c099fd182f5cf5e3123e545c185de188bc87','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 04:03:59','2026-02-18 03:03:59'),(80,2,'fad0618fa0dae58cc1b23f1c97bb4a5766d0d90620e2f2e9c5dc4b0aa11ca61a','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 04:07:47','2026-02-18 03:07:47'),(81,2,'6237465d88eabb684dba8d93532d5145cca20f82b07fd90133b974ca14546b87','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 04:08:06','2026-02-18 03:08:06'),(82,17,'2372bdd5b7b65f3962b7396dad2720c9b10805a7bf181e42f81a1a90a819cecd','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 04:08:50','2026-02-18 03:08:50'),(83,5,'079c7f2c783444ce8918eb05ed5e23cfb6cef0c305269b4a7bb3ef816d476c53','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 04:17:19','2026-02-18 03:17:19'),(84,2,'8ddfde6870ce0ef09c90a54e84e42d9fd85388ddaea9d845d7c2af0a2842793a','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 04:22:18','2026-02-18 03:22:18'),(85,5,'8b165257b44d730360a77a9ab006ae71c7f52aa0f2d37856b0c46154ab84fd3c','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 04:22:37','2026-02-18 03:22:37'),(86,5,'ebbba7dc92e4fd08e73837498454907fe04ff891aa273470e6d7bf7c64963ea3','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 05:43:50','2026-02-18 04:43:50'),(87,19,'d636b0107c0de4b2cfc9a23996c12edec93544db0f2e600cea2fd4ddbe2c8e16','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 05:44:34','2026-02-18 04:44:34'),(88,19,'6faa4f68272a96f28928b73c9adf559d2deba2bc08ebffb4dd8fa0f91f44d4e1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 05:59:46','2026-02-18 04:59:46'),(89,2,'d8dad3cb1ffa5af6dc27f661176559718e75ffd4c93dfff3e19897a2782e7086','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 06:17:16','2026-02-18 05:17:16'),(90,17,'293322dda589cf3b2a7fd58d985816f1f21b6bee92c935587a43195c947bae91','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 06:54:04','2026-02-18 05:54:04'),(91,17,'984509ad69b301f88c2d6ed239cc03d1f7b29c096f9db72cf251af593cb6f5ac','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-25 08:12:12','2026-02-18 07:12:12'),(92,2,'52377ecca8d8fd61b1bbe5315d1a3b21563e7842fbcd85a0a9fc511357ac3b6d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-26 02:42:45','2026-02-19 01:42:45'),(93,2,'fbc04c7ef7472f357b2f4829dbaf734e7fdc91f5e2e7a3408e5e680456df8da6','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-26 03:36:23','2026-02-19 02:36:23'),(94,2,'487a3fca6487395dc24f4e161e2e4dc25208af37b34036802641c466505013b1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-26 05:13:02','2026-02-19 04:13:02'),(95,2,'4ed279309b6ecc5dbab18e3d770a2613a4f2edce24b43d9fe4f462d2f21fb6be','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-26 06:13:19','2026-02-19 05:13:19'),(96,2,'89f437bdd027ccab55a882de1248b11533db3f50ff141d9acfc23af84f377bf0','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-26 06:18:05','2026-02-19 05:18:05'),(97,19,'e796c1ce0ec09938dc9c724a61d5ce1097ad610aeecbfb6f39d17445fba5000d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-26 06:19:57','2026-02-19 05:19:57'),(98,16,'12ae2fa228521cd560edb6a451ba7086c6cb80d52f2240c7d8abe3ab29e8e0b3','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-26 06:20:30','2026-02-19 05:20:30'),(99,7,'a41f5bf57ad02a16d14fe09eb782a8bd319c0278db342f22012fc32c967451ad','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-26 06:44:16','2026-02-19 05:44:16'),(100,19,'db59886a18abaea47054a51fafe2062dedb16d3d8eef80a9c1761cabf1965af9','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-26 07:07:56','2026-02-19 06:07:56'),(101,2,'09c10b09815a3c4558f4111a78b2324e3c539e3b28b5d78a2f370485cee8f911','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-02-26 07:24:38','2026-02-19 06:24:38'),(102,2,'e3aaa86762c6f545843b48fe4b0eb0e502eaca36be58c41c69d355c805dc2b06','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-03-01 14:43:21','2026-02-22 13:43:21'),(103,5,'dec322f02383318700fd18dc279ed056d926b7858f6dabe53e2db62a030b817d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-03-05 07:53:45','2026-02-26 06:53:45'),(104,7,'cc7abc15bec9177c7687548bb47638e983a8cc14dafa2839982bc79d2f226f08','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-03-05 07:54:32','2026-02-26 06:54:32'),(105,5,'16cd6d4efe9403aed13d8f8fec9a6833c9fff851027a8f4791a6becfc99c296a','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2026-03-05 08:22:02','2026-02-26 07:22:02');
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_settings`
--

DROP TABLE IF EXISTS `user_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `theme` enum('light','dark','system') DEFAULT 'dark',
  `language` varchar(10) DEFAULT 'en',
  `notifications_email` tinyint(1) DEFAULT 1,
  `notifications_push` tinyint(1) DEFAULT 1,
  `notifications_sms` tinyint(1) DEFAULT 0,
  `dashboard_layout` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dashboard_layout`)),
  `sidebar_collapsed` tinyint(1) DEFAULT 0,
  `items_per_page` int(11) DEFAULT 10,
  `date_format` varchar(20) DEFAULT 'MM/DD/YYYY',
  `time_format` varchar(10) DEFAULT '12h',
  `currency` varchar(3) DEFAULT 'PHP',
  `timezone` varchar(50) DEFAULT 'Asia/Manila',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_settings_user` (`user_id`),
  CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_settings`
--

LOCK TABLES `user_settings` WRITE;
/*!40000 ALTER TABLE `user_settings` DISABLE KEYS */;
INSERT INTO `user_settings` VALUES (1,5,'dark','en',1,1,0,NULL,0,10,'MM/DD/YYYY','12h','PHP','Asia/Manila','2026-02-12 07:41:21','2026-02-12 07:41:21');
/*!40000 ALTER TABLE `user_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('customer','sales','ojt','ojt_supervisor','hr','admin') DEFAULT 'customer',
  `birth_date` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `zip_code` varchar(10) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `supervisor_id` int(11) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `university` varchar(200) DEFAULT NULL,
  `course` varchar(200) DEFAULT NULL,
  `required_hours` int(11) DEFAULT 500,
  `render_hours` int(11) DEFAULT 24,
  `hours_completed` decimal(10,2) DEFAULT 0.00,
  `ojt_start_date` date DEFAULT NULL,
  `ojt_end_date` date DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `subscribe_newsletter` tinyint(1) DEFAULT 0,
  `status` enum('active','inactive','suspended','pending_verification') DEFAULT 'pending_verification',
  `email_verified` tinyint(1) DEFAULT 0,
  `email_verification_token` varchar(100) DEFAULT NULL,
  `email_verification_expires` datetime DEFAULT NULL,
  `password_reset_token` varchar(100) DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL,
  `google_id` varchar(100) DEFAULT NULL,
  `facebook_id` varchar(100) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `login_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_status` (`status`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_supervisor` (`supervisor_id`),
  KEY `idx_users_created` (`created_at`),
  KEY `idx_password_reset_token` (`password_reset_token`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'System','Administrator','admin@fragranza.com','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,500,24,0.00,NULL,NULL,NULL,'$2y$12$fwEhwVFe4pbFb.xJEkQ5tepOf8EF6vdsq02JhpwQ3nAkFVsIMEU3C',0,'active',1,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-11 20:38:51',1,'2026-02-11 11:36:15','2026-02-11 12:38:51'),(2,'Renz Russel','Bauto','renzrusselbauto@gmail.com','customer','1995-06-15','male','09171234567','123 Rizal Street, Brgy. San Antonio','Makati City','Metro Manila','1200',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,500,24,0.00,NULL,NULL,NULL,'$2y$12$nyJ8DH0OJKToT1cck64z8Olg0ox9sb2DW55z/IdYDAfkItlRMnHU6',1,'active',1,'67089828c26a5c88d6eb071873b41249d4b57cedba968a24488ecb5802b22bfa','2026-02-12 12:50:20',NULL,NULL,NULL,NULL,'2026-02-22 21:43:21',32,'2026-02-11 11:50:20','2026-02-22 13:43:21'),(3,'Renz Russel','Bauto','vendor0qw@gmail.com','admin','1995-06-15','male','09171234567','123 Rizal Street, Brgy. San Antonio','Makati City','Metro Manila','1200',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,500,24,0.00,NULL,NULL,NULL,'$2y$12$iIAdrsc96oNmRnCXRG0e8u2RJKiLTsp6QOH10fCXgDM6rfKW0aKsy',1,'pending_verification',0,'ffebe31745f2297d653271edf8e70b503f0ac0a6aaedc0fbddb765445d1e1c36','2026-02-12 12:54:50',NULL,NULL,NULL,NULL,'2026-02-11 19:54:58',1,'2026-02-11 11:54:50','2026-02-11 11:54:58'),(4,'Renz Russel','Bauto','superv@gmail.com','ojt_supervisor','1995-06-15','male','09171234567','123 Rizal Street, Brgy. San Antonio','Makati City','Metro Manila','1200',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,500,24,0.00,NULL,NULL,NULL,'$2y$12$2eKiS.73rMkMvVMhUytpLeGGvoGUMMiMdyUo8U2gz8ITbHWqfarZi',1,'pending_verification',0,'c443b3e9e1f3d2b6087e82c0352d27577a3f490b04a055f494ebea9884141e24','2026-02-12 17:26:21',NULL,NULL,NULL,NULL,'2026-02-12 02:31:41',2,'2026-02-11 16:26:21','2026-02-11 18:31:41'),(5,'Renz Russel','Bauto','newadmin@fragranza.com','admin','1995-06-15','male','09171234567','123 Rizal Street, Brgy. San Antonio','Makati City','Metro Manila','1200',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,500,24,0.00,NULL,NULL,NULL,'$2y$12$/AKsHgZrwgsvsWX5KQ/fdOOa2A5i2T4X57q820zyvtPb8HFEravHO',0,'active',0,'7da7e0f978b33398c92e8bcd9913fc5aa438b7aba7cfd0d0eecc4def677b4330','2026-02-13 08:21:20',NULL,NULL,NULL,NULL,'2026-02-26 15:22:02',22,'2026-02-12 07:21:20','2026-02-26 07:22:02'),(6,'Sales','Representative','vendor0qw2@gmail.com','sales','1999-09-09','male','09917648384','paliparan 2','asdasd','assadas','4114',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,500,24,0.00,NULL,NULL,NULL,'$2y$12$ffvmJRlmqe/RWOC7GOsgzO0.uiBleXwyBHSk59ajiY6NoxL2lawJO',0,'pending_verification',0,'94b8a6599bae5850b1f8ca6a58b677f70b9efc777ca9e1b3b682f198d203e6d4','2026-02-13 11:58:22',NULL,NULL,NULL,NULL,'2026-02-12 21:11:42',7,'2026-02-12 10:58:22','2026-02-12 13:11:42'),(7,'Maria','Santos','supervisor@fragranza.com','ojt_supervisor',NULL,NULL,'09181234567',NULL,NULL,NULL,NULL,'Operations','OJT Supervisor','SUP-2026-4411',NULL,'2026-02-12','Supervises OJT trainees',NULL,NULL,500,24,0.00,NULL,NULL,5,'$2y$12$/xznmNaP8.980e8zyE1/WOaAzdqt7u0CPhneSlmyDPZ7WIhNkZx9i',0,'active',1,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-26 14:54:32',16,'2026-02-12 13:37:26','2026-02-26 06:54:32'),(13,'Juan','Dela Cruz','ojt@fragranza.com','ojt',NULL,NULL,'09171234567',NULL,NULL,NULL,NULL,'Operations','OJT Trainee','OJT-2026-9214',7,'2026-02-12','Student trainee',NULL,NULL,500,24,0.00,NULL,NULL,5,'$2y$12$UHtqtIK4NS.iRWUYcGwJZuRVG2vTjtbglVNUuPQYpEjZiQ96jKXUK',0,'active',1,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-17 10:05:42',8,'2026-02-12 14:46:28','2026-02-17 02:05:42'),(14,'Renz','Bauto','ojt2@fragranza.com','ojt',NULL,NULL,'09171234567',NULL,NULL,NULL,NULL,'Operations','OJT Trainee','OJT-2026-9503',7,'2026-02-12','Student trainee',NULL,NULL,500,24,0.00,NULL,NULL,5,'$2y$12$bYYmnXQiATyHF00CaQyNbOpZUGw2ESXdEyQd7IrqkccXUw11VsRTS',0,'active',1,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-13 04:08:38',1,'2026-02-12 20:08:10','2026-02-12 20:08:38'),(15,'Juan','Dela Cruz','ojt20@fragranza.com','ojt',NULL,NULL,'09171234567',NULL,NULL,NULL,NULL,'Operations','OJT Trainee','OJT-2026-6768',7,'2026-02-17','Student trainee',NULL,NULL,500,24,0.00,NULL,NULL,5,'$2y$12$rpBfHk4Gn.S1pvnwRC5E6ek8JLApg9myH9FB8BPvFZq2D9QCZr/7S',0,'active',1,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-17 10:24:12',1,'2026-02-17 02:23:56','2026-02-17 02:24:12'),(16,'AAA','BBB','ojt21@fragranza.com','ojt',NULL,NULL,'09171234567',NULL,NULL,NULL,NULL,'Operations','OJT Trainee','OJT-2026-9724',7,'2026-02-17','Student trainee',NULL,NULL,500,24,0.00,NULL,NULL,5,'$2y$12$/366zr5EBKrZsXMmbCBM8u3t/q7i7JTLlSo83RaZR3xU/YpMk6zhW',0,'active',1,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-19 13:20:30',4,'2026-02-17 02:28:45','2026-02-19 05:20:30'),(17,'Pedro','Garcia','sales@fragranza.com','sales',NULL,NULL,'09191234567',NULL,NULL,NULL,NULL,'Sales','Sales Representative','SAL-2026-9444',NULL,'2026-02-17','Sales team member',NULL,NULL,500,24,0.00,NULL,NULL,5,'$2y$12$HOG9to4vaDSR8pWSQmrxHePIzjEDV49XW.YGZI7AZdyi.H7M1tsVK',0,'active',1,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-18 15:12:12',4,'2026-02-17 08:09:57','2026-02-18 07:12:12'),(19,'HR','Staff','hr@fragranza.com','hr',NULL,NULL,'09211234567',NULL,NULL,NULL,NULL,'Human Resources','HR Officer','HRD-2026-3879',NULL,'2026-02-18','HR department staff - manages employees and interns',NULL,NULL,500,24,0.00,NULL,NULL,5,'$2y$12$W8ecb72vQj6lkZxNEj7J9e8Lf2ijXG356QId6UCuwwhV1oSBTAkfa',0,'active',1,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-19 14:07:56',4,'2026-02-18 04:43:02','2026-02-19 06:07:56');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'fragranza_db'
--

--
-- Final view structure for view `failed_login_summary`
--

/*!50001 DROP VIEW IF EXISTS `failed_login_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `failed_login_summary` AS select `login_attempts`.`email` AS `email`,`login_attempts`.`ip_address` AS `ip_address`,count(0) AS `attempt_count`,max(`login_attempts`.`created_at`) AS `last_attempt`,min(`login_attempts`.`created_at`) AS `first_attempt` from `login_attempts` where `login_attempts`.`success` = 0 and `login_attempts`.`created_at` > current_timestamp() - interval 24 hour group by `login_attempts`.`email`,`login_attempts`.`ip_address` having count(0) >= 3 order by count(0) desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-26 16:00:45
