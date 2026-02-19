<?php
/**
 * Review Media Upload API
 * Handles image and video uploads for product reviews
 * Supports multiple files upload
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
$uploadBaseDir = __DIR__ . '/../uploads/reviews/';
$imageDir = $uploadBaseDir . 'images/';
$videoDir = $uploadBaseDir . 'videos/';

$allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
$maxImageSize = 10 * 1024 * 1024; // 10MB for images
$maxVideoSize = 50 * 1024 * 1024; // 50MB for videos
$maxImagesPerReview = 5;
$maxVideosPerReview = 2;

// Create upload directories if they don't exist
if (!is_dir($imageDir)) {
    mkdir($imageDir, 0755, true);
}
if (!is_dir($videoDir)) {
    mkdir($videoDir, 0755, true);
}

$uploadedFiles = [
    'images' => [],
    'videos' => []
];
$errors = [];

// Handle multipart/form-data upload
if (!empty($_FILES)) {
    // Handle image uploads
    if (isset($_FILES['images'])) {
        $images = $_FILES['images'];
        $imageCount = is_array($images['name']) ? count($images['name']) : 1;
        
        // Limit number of images
        if ($imageCount > $maxImagesPerReview) {
            $errors[] = "Maximum {$maxImagesPerReview} images allowed per review";
            $imageCount = $maxImagesPerReview;
        }
        
        for ($i = 0; $i < $imageCount; $i++) {
            $name = is_array($images['name']) ? $images['name'][$i] : $images['name'];
            $tmpName = is_array($images['tmp_name']) ? $images['tmp_name'][$i] : $images['tmp_name'];
            $size = is_array($images['size']) ? $images['size'][$i] : $images['size'];
            $error = is_array($images['error']) ? $images['error'][$i] : $images['error'];
            
            if ($error !== UPLOAD_ERR_OK) {
                $errors[] = "Failed to upload image: {$name}";
                continue;
            }
            
            // Validate file type
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($tmpName);
            
            if (!in_array($mimeType, $allowedImageTypes)) {
                $errors[] = "Invalid image type for {$name}. Allowed: JPEG, PNG, WebP, GIF";
                continue;
            }
            
            // Validate size
            if ($size > $maxImageSize) {
                $errors[] = "Image {$name} exceeds 10MB limit";
                continue;
            }
            
            // Generate unique filename
            $extension = pathinfo($name, PATHINFO_EXTENSION);
            $filename = 'review_' . uniqid('', true) . '.' . strtolower($extension);
            $destination = $imageDir . $filename;
            
            if (move_uploaded_file($tmpName, $destination)) {
                $uploadedFiles['images'][] = [
                    'filename' => $filename,
                    'path' => '/uploads/reviews/images/' . $filename,
                    'url' => '/uploads/reviews/images/' . $filename,
                    'size' => $size,
                    'type' => $mimeType
                ];
            } else {
                $errors[] = "Failed to save image: {$name}";
            }
        }
    }
    
    // Handle video uploads
    if (isset($_FILES['videos'])) {
        $videos = $_FILES['videos'];
        $videoCount = is_array($videos['name']) ? count($videos['name']) : 1;
        
        // Limit number of videos
        if ($videoCount > $maxVideosPerReview) {
            $errors[] = "Maximum {$maxVideosPerReview} videos allowed per review";
            $videoCount = $maxVideosPerReview;
        }
        
        for ($i = 0; $i < $videoCount; $i++) {
            $name = is_array($videos['name']) ? $videos['name'][$i] : $videos['name'];
            $tmpName = is_array($videos['tmp_name']) ? $videos['tmp_name'][$i] : $videos['tmp_name'];
            $size = is_array($videos['size']) ? $videos['size'][$i] : $videos['size'];
            $error = is_array($videos['error']) ? $videos['error'][$i] : $videos['error'];
            
            if ($error !== UPLOAD_ERR_OK) {
                if ($error === UPLOAD_ERR_NO_FILE) continue; // Videos are optional
                $errors[] = "Failed to upload video: {$name}";
                continue;
            }
            
            // Validate file type
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($tmpName);
            
            if (!in_array($mimeType, $allowedVideoTypes)) {
                $errors[] = "Invalid video type for {$name}. Allowed: MP4, WebM, MOV, AVI";
                continue;
            }
            
            // Validate size
            if ($size > $maxVideoSize) {
                $errors[] = "Video {$name} exceeds 50MB limit";
                continue;
            }
            
            // Generate unique filename
            $extension = pathinfo($name, PATHINFO_EXTENSION);
            $filename = 'review_' . uniqid('', true) . '.' . strtolower($extension);
            $destination = $videoDir . $filename;
            
            if (move_uploaded_file($tmpName, $destination)) {
                $uploadedFiles['videos'][] = [
                    'filename' => $filename,
                    'path' => '/uploads/reviews/videos/' . $filename,
                    'url' => '/uploads/reviews/videos/' . $filename,
                    'size' => $size,
                    'type' => $mimeType,
                    'duration' => null // Could be extracted with ffprobe if needed
                ];
            } else {
                $errors[] = "Failed to save video: {$name}";
            }
        }
    }
}

// Handle base64 JSON upload (for mobile apps or direct embedding)
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'application/json') !== false) {
    $jsonData = json_decode(file_get_contents('php://input'), true);
    
    // Process base64 images
    if (isset($jsonData['images']) && is_array($jsonData['images'])) {
        foreach (array_slice($jsonData['images'], 0, $maxImagesPerReview) as $imgData) {
            if (empty($imgData['data'])) continue;
            
            $base64Data = $imgData['data'];
            $originalFilename = $imgData['filename'] ?? 'image.jpg';
            
            // Remove data URL prefix if present
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $matches)) {
                $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
                $mimeType = 'image/' . $matches[1];
            } else {
                $ext = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
                $mimeTypes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif'];
                $mimeType = $mimeTypes[$ext] ?? 'image/jpeg';
            }
            
            $imageData = base64_decode($base64Data);
            if ($imageData === false) {
                $errors[] = "Invalid base64 image data";
                continue;
            }
            
            if (strlen($imageData) > $maxImageSize) {
                $errors[] = "Image exceeds 10MB limit";
                continue;
            }
            
            $extension = pathinfo($originalFilename, PATHINFO_EXTENSION) ?: 'jpg';
            $filename = 'review_' . uniqid('', true) . '.' . strtolower($extension);
            $destination = $imageDir . $filename;
            
            if (file_put_contents($destination, $imageData) !== false) {
                $uploadedFiles['images'][] = [
                    'filename' => $filename,
                    'path' => '/uploads/reviews/images/' . $filename,
                    'url' => '/uploads/reviews/images/' . $filename,
                    'size' => strlen($imageData),
                    'type' => $mimeType
                ];
            }
        }
    }
}

// Return response
$totalUploaded = count($uploadedFiles['images']) + count($uploadedFiles['videos']);

if ($totalUploaded > 0) {
    echo json_encode([
        'success' => true,
        'message' => "{$totalUploaded} file(s) uploaded successfully",
        'data' => $uploadedFiles,
        'errors' => $errors
    ]);
} else if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'No files were uploaded',
        'errors' => $errors
    ]);
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'No files provided'
    ]);
}
