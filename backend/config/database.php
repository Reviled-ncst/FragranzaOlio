<?php
/**
 * Database Configuration
 * Fragranza Olio - Database Connection Settings
 * 
 * For InfinityFree: Update these values from your control panel
 * Control Panel → MySQL Databases
 */

// Check if we're in production (InfinityFree) or local (XAMPP)
$isProduction = !in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1']);

if ($isProduction) {
    // ============================================
    // INFINITYFREE PRODUCTION SETTINGS
    // ============================================
    define('DB_HOST', 'sql311.infinityfree.com');
    define('DB_NAME', 'if0_41131668_fragranza');
    define('DB_USER', 'if0_41131668');
    define('DB_PASS', 'Revengeme1@');
} else {
    // ============================================
    // LOCAL DEVELOPMENT (XAMPP)
    // ============================================
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'fragranza_db');
    define('DB_USER', 'root');
    define('DB_PASS', '');
}

define('DB_CHARSET', 'utf8mb4');

class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            // First, connect without database to check/create it
            $dsnNoDB = "mysql:host=" . DB_HOST . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $tempConn = new PDO($dsnNoDB, DB_USER, DB_PASS, $options);
            
            // Create database if it doesn't exist
            $tempConn->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` 
                            CHARACTER SET utf8mb4 
                            COLLATE utf8mb4_unicode_ci");
            
            // Now connect to the database
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            
            // Create tables if they don't exist
            $this->createTables();
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed',
                'error' => $e->getMessage()
            ]);
            exit;
        }
    }
    
    /**
     * Create required tables if they don't exist
     */
    private function createTables() {
        // Users table
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                birth_date DATE,
                gender ENUM('male', 'female', 'other') DEFAULT NULL,
                phone VARCHAR(20),
                address VARCHAR(255),
                city VARCHAR(100),
                province VARCHAR(100),
                zip_code VARCHAR(10),
                password_hash VARCHAR(255) NOT NULL,
                subscribe_newsletter BOOLEAN DEFAULT FALSE,
                status ENUM('active', 'inactive', 'suspended', 'pending_verification') DEFAULT 'pending_verification',
                email_verified BOOLEAN DEFAULT FALSE,
                email_verification_token VARCHAR(100),
                email_verification_expires DATETIME,
                password_reset_token VARCHAR(100),
                password_reset_expires DATETIME,
                google_id VARCHAR(100),
                facebook_id VARCHAR(100),
                last_login DATETIME,
                login_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_users_email (email),
                INDEX idx_users_status (status),
                INDEX idx_users_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // User sessions table
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                session_token VARCHAR(255) NOT NULL UNIQUE,
                ip_address VARCHAR(45),
                user_agent TEXT,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_session_token (session_token),
                INDEX idx_session_user (user_id),
                INDEX idx_session_expires (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // User activity log table
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS user_activity_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                activity_type ENUM('login', 'logout', 'register', 'password_change', 'profile_update', 'password_reset') NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_activity_user (user_id),
                INDEX idx_activity_type (activity_type),
                INDEX idx_activity_date (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    // Prevent cloning
    private function __clone() {}

    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
