<?php
/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing headers
 */

// Allow from localhost (development) and production domains
$allowed_origins = [
    // Local development
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    // Production (Vercel)
    'https://fragranza-olio.vercel.app',
    'https://frontend-xi-woad-90.vercel.app',
    'https://frontend-reviled-ncsts-projects.vercel.app'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif (strpos($origin, 'vercel.app') !== false) {
    // Allow any Vercel preview deployments
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Default to localhost:3000 for non-browser requests
    header("Access-Control-Allow-Origin: http://localhost:3000");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400"); // Cache preflight for 24 hours
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
