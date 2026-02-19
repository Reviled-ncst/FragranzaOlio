<?php
/**
 * Database Configuration
 * Fragranza Olio - Database Connection Settings
 * 
 * Credentials are loaded from backend/.env file
 * See backend/.env.example for the template
 */

/**
 * Load environment variables from .env file
 */
function loadEnvFile(): void {
    $envFile = __DIR__ . '/../.env';
    if (!file_exists($envFile)) {
        return; // Fall back to defaults if no .env file
    }
    
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (str_starts_with(trim($line), '#')) {
            continue;
        }
        
        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Don't override existing environment variables
            if (!isset($_ENV[$key]) && getenv($key) === false) {
                putenv("$key=$value");
                $_ENV[$key] = $value;
            }
        }
    }
}

// Load .env file
loadEnvFile();

// Check if we're in production (InfinityFree) or local (XAMPP/ngrok/Cloudflare tunnel)
$serverName = $_SERVER['SERVER_NAME'] ?? '';
$isLocal = in_array($serverName, ['localhost', '127.0.0.1']) || 
           strpos($serverName, 'ngrok') !== false ||
           strpos($serverName, 'ngrok-free.app') !== false ||
           strpos($serverName, 'trycloudflare.com') !== false;
$isProduction = !$isLocal;

if ($isProduction) {
    // ============================================
    // INFINITYFREE PRODUCTION SETTINGS
    // ============================================
    define('DB_HOST', getenv('PROD_DB_HOST') ?: 'localhost');
    define('DB_NAME', getenv('PROD_DB_NAME') ?: 'fragranza_db');
    define('DB_USER', getenv('PROD_DB_USER') ?: 'root');
    define('DB_PASS', getenv('PROD_DB_PASS') ?: '');
} else {
    // ============================================
    // LOCAL DEVELOPMENT (XAMPP)
    // ============================================
    define('DB_HOST', getenv('LOCAL_DB_HOST') ?: 'localhost');
    define('DB_NAME', getenv('LOCAL_DB_NAME') ?: 'fragranza_db');
    define('DB_USER', getenv('LOCAL_DB_USER') ?: 'root');
    define('DB_PASS', getenv('LOCAL_DB_PASS') ?: '');
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
            error_log('Database connection failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed'
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
