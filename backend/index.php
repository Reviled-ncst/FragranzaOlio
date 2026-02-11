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
        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
    }
} else {
    // API documentation / health check
    echo json_encode([
        'success' => true,
        'message' => 'Fragranza Olio API',
        'version' => '1.0.0',
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
