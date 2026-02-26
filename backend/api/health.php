<?php
/**
 * Health Check - Railway Diagnostic
 * Returns connection status without leaking credentials
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Load config
require_once __DIR__ . '/../config/database.php';

$result = [
    'status' => 'checking',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'pdo_drivers' => PDO::getAvailableDrivers(),
    'env' => [
        'RAILWAY_ENVIRONMENT' => !empty(getenv('RAILWAY_ENVIRONMENT')) ? 'set' : 'not set',
        'MYSQLHOST' => !empty(DB_HOST) ? substr(DB_HOST, 0, 15) . '...' : 'empty',
        'MYSQLPORT' => DB_PORT,
        'MYSQLDATABASE' => DB_NAME,
        'isRailway' => defined('RAILWAY_ENV') ? RAILWAY_ENV : false,
    ]
];

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 10,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
    ];
    
    $conn = new PDO($dsn, DB_USER, DB_PASS, $options);
    $result['status'] = 'connected';
    $result['server_info'] = $conn->getAttribute(PDO::ATTR_SERVER_VERSION);
    
    // Check if database exists
    $stmt = $conn->query("SHOW DATABASES LIKE '" . DB_NAME . "'");
    $result['database_exists'] = $stmt->rowCount() > 0;
    
    if ($result['database_exists']) {
        $conn->exec("USE `" . DB_NAME . "`");
        $stmt = $conn->query("SHOW TABLES");
        $result['table_count'] = $stmt->rowCount();
    }
} catch (PDOException $e) {
    $result['status'] = 'error';
    $result['error'] = $e->getMessage();
    $result['error_code'] = $e->getCode();
}

echo json_encode($result, JSON_PRETTY_PRINT);
