<?php
/**
 * Upload API
 * Handles file uploads for product images
 * Supports both multipart/form-data and base64 JSON uploads
 */

// Send CORS headers immediately
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Email, Accept, Origin");
header("Access-Control-Max-Age: 86400");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/../middleware/cors.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Configuration
$uploadDir = __DIR__ . '/../uploads/products/';
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$maxFileSize = 5 * 1024 * 1024; // 5MB

// Create upload directory if it doesn't exist
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Check for base64 JSON upload first
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'application/json') !== false) {
    $jsonData = json_decode(file_get_contents('php://input'), true);
    
    if (isset($jsonData['image_base64']) && isset($jsonData['filename'])) {
        // Base64 upload
        $base64Data = $jsonData['image_base64'];
        $originalFilename = $jsonData['filename'];
        
        // Remove data URL prefix if present
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $matches)) {
            $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
            $mimeType = 'image/' . $matches[1];
        } else {
            // Detect from extension
            $ext = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
            $mimeTypes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif'];
            $mimeType = $mimeTypes[$ext] ?? 'image/jpeg';
        }
        
        $imageData = base64_decode($base64Data);
        if ($imageData === false) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid base64 data']);
            exit;
        }
        
        // Check size
        if (strlen($imageData) > $maxFileSize) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'File size exceeds 5MB limit']);
            exit;
        }
        
        // Validate mime type
        if (!in_array($mimeType, $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid file type']);
            exit;
        }
        
        // Generate filename
        $extension = pathinfo($originalFilename, PATHINFO_EXTENSION) ?: 'jpg';
        $filename = uniqid('product_', true) . '.' . strtolower($extension);
        $destination = $uploadDir . $filename;
        
        // Save file
        if (file_put_contents($destination, $imageData) === false) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save file']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'File uploaded successfully',
            'data' => [
                'filename' => $filename,
                'path' => 'products/' . $filename,
                'url' => '/uploads/products/' . $filename,
                'size' => strlen($imageData),
                'type' => $mimeType
            ]
        ]);
        exit;
    }
}

// Traditional multipart/form-data upload
// Check if file was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $errorMessage = 'No file uploaded';
    if (isset($_FILES['image'])) {
        switch ($_FILES['image']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errorMessage = 'File is too large';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errorMessage = 'File was only partially uploaded';
                break;
            case UPLOAD_ERR_NO_FILE:
                $errorMessage = 'No file was uploaded';
                break;
        }
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $errorMessage]);
    exit;
}

$file = $_FILES['image'];

// Validate file type
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF']);
    exit;
}

// Validate file size
if ($file['size'] > $maxFileSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File size exceeds 5MB limit']);
    exit;
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid('product_', true) . '.' . strtolower($extension);
$destination = $uploadDir . $filename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save file']);
    exit;
}

// Return success response
echo json_encode([
    'success' => true,
    'message' => 'File uploaded successfully',
    'data' => [
        'filename' => $filename,
        'path' => 'products/' . $filename,
        'url' => '/uploads/products/' . $filename,
        'size' => $file['size'],
        'type' => $mimeType
    ]
]);
