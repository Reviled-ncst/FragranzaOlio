<?php
/**
 * Fragranza Olio API
 * Main entry point and router
 */

require_once __DIR__ . '/middleware/cors.php';

// Get the request URI
$requestUri = $_SERVER['REQUEST_URI'];

// Remove base path if present
$basePath = '/fragranza/backend';
$requestUri = str_replace($basePath, '', $requestUri);

// Parse the path
$path = parse_url($requestUri, PHP_URL_PATH);
$path = trim($path, '/');
$segments = explode('/', $path);

// Route to appropriate API file
if (!empty($segments[0]) && $segments[0] === 'api' && isset($segments[1])) {
    $endpoint = $segments[1];
    
    switch ($endpoint) {
        case 'products':
            require_once __DIR__ . '/api/products.php';
            break;
        case 'categories':
            require_once __DIR__ . '/api/categories.php';
            break;
        case 'contact':
            require_once __DIR__ . '/api/contact.php';
            break;
        case 'upload':
            require_once __DIR__ . '/api/upload.php';
            break;
        case 'newsletter':
            require_once __DIR__ . '/api/newsletter.php';
            break;
        case 'sales':
            require_once __DIR__ . '/api/sales.php';
            break;
        case 'inventory':
            require_once __DIR__ . '/api/inventory.php';
            break;
        case 'auth':
            require_once __DIR__ . '/api/auth.php';
            break;
        case 'admin_users':
            require_once __DIR__ . '/api/admin_users.php';
            break;
        case 'face':
        case 'face.php':
            require_once __DIR__ . '/api/face.php';
            break;
        case 'hr':
        case 'hr.php':
            require_once __DIR__ . '/api/hr.php';
            break;
        case 'supervisor':
        case 'supervisor.php':
            require_once __DIR__ . '/api/supervisor.php';
            break;
        case 'admin_logs':
        case 'admin_logs.php':
            require_once __DIR__ . '/api/admin_logs.php';
            break;
        case 'ojt_timesheets':
        case 'ojt_timesheets.php':
            require_once __DIR__ . '/api/ojt_timesheets.php';
            break;
        case 'ojt_tasks':
        case 'ojt_tasks.php':
            require_once __DIR__ . '/api/ojt_tasks.php';
            break;
        case 'ojt_notifications':
        case 'ojt_notifications.php':
            require_once __DIR__ . '/api/ojt_notifications.php';
            break;
        case 'ojt_modules':
        case 'ojt_modules.php':
            require_once __DIR__ . '/api/ojt_modules.php';
            break;
        case 'ojt_documents':
        case 'ojt_documents.php':
            require_once __DIR__ . '/api/ojt_documents.php';
            break;
        case 'ojt_attendance':
        case 'ojt_attendance.php':
            require_once __DIR__ . '/api/ojt_attendance.php';
            break;
        case 'ojt_achievements':
        case 'ojt_achievements.php':
            require_once __DIR__ . '/api/ojt_achievements.php';
            break;
        case 'review_upload':
        case 'review_upload.php':
            require_once __DIR__ . '/api/review_upload.php';
            break;
        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
    }
} else {
    // API documentation / health check
    $apiFiles = array_map('basename', glob(__DIR__ . '/api/*.php') ?: []);
    echo json_encode([
        'success' => true,
        'message' => 'Fragranza Olio API',
        'version' => '1.0.0',
        'api_files' => $apiFiles,
        'endpoints' => [
            'GET /api/products' => 'Get all products',
            'GET /api/products/:id' => 'Get single product',
            'POST /api/products' => 'Create product',
            'PUT /api/products/:id' => 'Update product',
            'DELETE /api/products/:id' => 'Delete product',
            'GET /api/categories' => 'Get all categories',
            'POST /api/contact' => 'Submit contact form',
            'POST /api/upload' => 'Upload image',
            'POST /api/newsletter' => 'Subscribe to newsletter'
        ]
    ]);
}

// Deployed via GitHub Actions
# Auto-deploy timestamp: 2026-02-11 20:43:18
