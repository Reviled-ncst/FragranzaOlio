<?php
/**
 * Debug API - DISABLED IN PRODUCTION
 */
header('Content-Type: application/json');

// SECURITY: Only allow access from localhost
$remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '';
$serverName = $_SERVER['SERVER_NAME'] ?? '';
$isLocal = in_array($remoteAddr, ['127.0.0.1', '::1']) && 
           in_array($serverName, ['localhost', '127.0.0.1']);

if (!$isLocal) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Debug endpoint disabled in production']);
    exit;
}

echo json_encode([
    'status' => 'ok',
    'environment' => 'local',
    'timestamp' => date('Y-m-d H:i:s')
], JSON_PRETTY_PRINT);
