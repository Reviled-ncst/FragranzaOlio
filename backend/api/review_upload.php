<?php
/**
 * Review Media Upload API
 * Handles image and video uploads for product reviews
 * Supports multiple files upload
 * Uses Cloudinary CDN for storage (Railway has ephemeral filesystem)
 */

// CORS & security headers handled by middleware
require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../services/CloudinaryService.php';

// SECURITY: Require authenticated user for review uploads
$db = Database::getInstance()->getConnection();
requireAuth($db);

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Configuration
$allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
$maxImageSize = 10 * 1024 * 1024; // 10MB for images
$maxVideoSize = 50 * 1024 * 1024; // 50MB for videos
$maxImagesPerReview = 5;
$maxVideosPerReview = 2;

// Initialize Cloudinary
$cloudinary = new CloudinaryService();
$useCloudinary = $cloudinary->isConfigured();

// Local upload directories as fallback
$uploadBaseDir = __DIR__ . '/../uploads/reviews/';
$imageDir = $uploadBaseDir . 'images/';
$videoDir = $uploadBaseDir . 'videos/';
if (!$useCloudinary) {
    if (!is_dir($imageDir)) mkdir($imageDir, 0755, true);
    if (!is_dir($videoDir)) mkdir($videoDir, 0755, true);
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
            
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($tmpName);
            
            if (!in_array($mimeType, $allowedImageTypes)) {
                $errors[] = "Invalid image type for {$name}. Allowed: JPEG, PNG, WebP, GIF";
                continue;
            }
            
            if ($size > $maxImageSize) {
                $errors[] = "Image {$name} exceeds 10MB limit";
                continue;
            }
            
            if ($useCloudinary) {
                $result = $cloudinary->uploadFile($tmpName, 'reviews/images');
                if ($result['success']) {
                    $uploadedFiles['images'][] = [
                        'filename' => basename($result['url']),
                        'path' => $result['url'],
                        'url' => $result['url'],
                        'public_id' => $result['public_id'],
                        'size' => $size,
                        'type' => $mimeType
                    ];
                } else {
                    $errors[] = "Cloudinary upload failed for {$name}: " . ($result['error'] ?? 'Unknown');
                }
            } else {
                $imgMimeToExt = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
                $extension = $imgMimeToExt[$mimeType] ?? 'jpg';
                $filename = 'review_' . uniqid('', true) . '.' . $extension;
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
    }
    
    // Handle video uploads
    if (isset($_FILES['videos'])) {
        $videos = $_FILES['videos'];
        $videoCount = is_array($videos['name']) ? count($videos['name']) : 1;
        
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
                if ($error === UPLOAD_ERR_NO_FILE) continue;
                $errors[] = "Failed to upload video: {$name}";
                continue;
            }
            
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($tmpName);
            
            if (!in_array($mimeType, $allowedVideoTypes)) {
                $errors[] = "Invalid video type for {$name}. Allowed: MP4, WebM, MOV, AVI";
                continue;
            }
            
            if ($size > $maxVideoSize) {
                $errors[] = "Video {$name} exceeds 50MB limit";
                continue;
            }
            
            if ($useCloudinary) {
                $result = $cloudinary->uploadFile($tmpName, 'reviews/videos', 'video');
                if ($result['success']) {
                    $uploadedFiles['videos'][] = [
                        'filename' => basename($result['url']),
                        'path' => $result['url'],
                        'url' => $result['url'],
                        'public_id' => $result['public_id'],
                        'size' => $size,
                        'type' => $mimeType,
                        'duration' => null
                    ];
                } else {
                    $errors[] = "Cloudinary upload failed for {$name}: " . ($result['error'] ?? 'Unknown');
                }
            } else {
                $vidMimeToExt = ['video/mp4' => 'mp4', 'video/webm' => 'webm', 'video/quicktime' => 'mov', 'video/x-msvideo' => 'avi'];
                $extension = $vidMimeToExt[$mimeType] ?? 'mp4';
                $filename = 'review_' . uniqid('', true) . '.' . $extension;
                $destination = $videoDir . $filename;
                
                if (move_uploaded_file($tmpName, $destination)) {
                    $uploadedFiles['videos'][] = [
                        'filename' => $filename,
                        'path' => '/uploads/reviews/videos/' . $filename,
                        'url' => '/uploads/reviews/videos/' . $filename,
                        'size' => $size,
                        'type' => $mimeType,
                        'duration' => null
                    ];
                } else {
                    $errors[] = "Failed to save video: {$name}";
                }
            }
        }
    }
}

// Handle base64 JSON upload (for mobile apps or direct embedding)
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'application/json') !== false) {
    $jsonData = json_decode(file_get_contents('php://input'), true);
    
    if (isset($jsonData['images']) && is_array($jsonData['images'])) {
        foreach (array_slice($jsonData['images'], 0, $maxImagesPerReview) as $imgData) {
            if (empty($imgData['data'])) continue;
            
            $base64Data = $imgData['data'];
            $rawBase64 = $base64Data;
            
            // Strip data URL prefix for validation
            $stripped = $base64Data;
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $matches)) {
                $stripped = substr($base64Data, strpos($base64Data, ',') + 1);
            }
            
            $imageData = base64_decode($stripped);
            if ($imageData === false) {
                $errors[] = "Invalid base64 image data";
                continue;
            }
            
            $tmpFile = tempnam(sys_get_temp_dir(), 'review_upload_');
            file_put_contents($tmpFile, $imageData);
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($tmpFile);
            
            if (!in_array($mimeType, $allowedImageTypes)) {
                unlink($tmpFile);
                $errors[] = "Invalid image type detected: $mimeType";
                continue;
            }
            
            if (strlen($imageData) > $maxImageSize) {
                unlink($tmpFile);
                $errors[] = "Image exceeds 10MB limit";
                continue;
            }
            
            if ($useCloudinary) {
                $result = $cloudinary->uploadBase64($rawBase64, 'reviews/images');
                unlink($tmpFile);
                
                if ($result['success']) {
                    $uploadedFiles['images'][] = [
                        'filename' => basename($result['url']),
                        'path' => $result['url'],
                        'url' => $result['url'],
                        'public_id' => $result['public_id'],
                        'size' => strlen($imageData),
                        'type' => $mimeType
                    ];
                } else {
                    $errors[] = "Cloudinary upload failed: " . ($result['error'] ?? 'Unknown');
                }
            } else {
                unlink($tmpFile);
                $b64MimeToExt = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
                $extension = $b64MimeToExt[$mimeType] ?? 'jpg';
                $filename = 'review_' . uniqid('', true) . '.' . $extension;
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
