<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$serverName = $_SERVER['SERVER_NAME'] ?? 'not set';
$isNgrok = strpos($serverName, 'ngrok') !== false;
$isLocalhost = in_array($serverName, ['localhost', '127.0.0.1']);

echo json_encode([
    'server_name' => $serverName,
    'is_ngrok' => $isNgrok,
    'is_localhost' => $isLocalhost,
    'http_host' => $_SERVER['HTTP_HOST'] ?? 'not set',
    'all_server' => [
        'SERVER_NAME' => $_SERVER['SERVER_NAME'] ?? null,
        'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? null,
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? null,
    ]
], JSON_PRETTY_PRINT);
