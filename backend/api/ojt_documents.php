<?php
/**
 * OJT Documents API
 * Handles document upload, retrieval, and management for OJT trainees
 */

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';

if (empty($path) && isset($_SERVER['REQUEST_URI'])) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('#/ojt_documents\.php(/.*)?$#', $uri, $matches)) {
        $path = isset($matches[1]) ? $matches[1] : '';
    }
}

$path = trim($path, '/');
$pathParts = $path ? explode('/', $path) : [];

try {
    $conn = Database::getInstance()->getConnection();
    
    $id = $pathParts[0] ?? null;
    
    switch ($method) {
        case 'GET':
            if ($id && is_numeric($id)) {
                getDocument($conn, $id);
            } else {
                getDocuments($conn);
            }
            break;
        case 'POST':
            createDocument($conn);
            break;
        case 'PUT':
        case 'PATCH':
            if ($id && is_numeric($id)) {
                updateDocument($conn, $id);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Document ID is required']);
            }
            break;
        case 'DELETE':
            if ($id && is_numeric($id)) {
                deleteDocument($conn, $id);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Document ID is required']);
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Get all documents (with filters)
 */
function getDocuments($conn) {
    $traineeId = $_GET['trainee_id'] ?? null;
    $documentType = $_GET['document_type'] ?? null;
    $status = $_GET['status'] ?? null;
    
    $query = "
        SELECT 
            d.*,
            CONCAT(t.first_name, ' ', t.last_name) as trainee_name,
            CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
        FROM ojt_documents d
        LEFT JOIN users t ON d.trainee_id = t.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($traineeId) {
        $query .= " AND d.trainee_id = ?";
        $params[] = $traineeId;
    }
    
    if ($documentType) {
        $query .= " AND d.document_type = ?";
        $params[] = $documentType;
    }
    
    if ($status) {
        $query .= " AND d.status = ?";
        $params[] = $status;
    }
    
    $query .= " ORDER BY d.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $documents
    ]);
}

/**
 * Get single document
 */
function getDocument($conn, $id) {
    $stmt = $conn->prepare("
        SELECT 
            d.*,
            CONCAT(t.first_name, ' ', t.last_name) as trainee_name,
            CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
        FROM ojt_documents d
        LEFT JOIN users t ON d.trainee_id = t.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.id = ?
    ");
    $stmt->execute([$id]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$document) {
        http_response_code(404);
        echo json_encode(['error' => 'Document not found']);
        return;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $document
    ]);
}

/**
 * Create/Upload document
 */
function createDocument($conn) {
    // Check if it's a file upload or JSON data
    if (!empty($_FILES['file'])) {
        // File upload
        $file = $_FILES['file'];
        $traineeId = $_POST['trainee_id'] ?? null;
        $uploadedBy = $_POST['uploaded_by'] ?? $traineeId;
        $title = $_POST['title'] ?? $file['name'];
        $documentType = $_POST['document_type'] ?? 'other';
        $notes = $_POST['notes'] ?? null;
        
        if (!$traineeId) {
            http_response_code(400);
            echo json_encode(['error' => 'trainee_id is required']);
            return;
        }
        
        // Validate file
        $allowedTypes = ['application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 'image/png'];
        
        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG']);
            return;
        }
        
        if ($file['size'] > 10 * 1024 * 1024) { // 10MB limit
            http_response_code(400);
            echo json_encode(['error' => 'File too large. Maximum size: 10MB']);
            return;
        }
        
        // Create upload directory
        $uploadDir = __DIR__ . '/../uploads/documents/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'doc_' . $traineeId . '_' . time() . '.' . $extension;
        $filePath = '/uploads/documents/' . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save file']);
            return;
        }
        
        // Insert into database
        $stmt = $conn->prepare("
            INSERT INTO ojt_documents 
            (trainee_id, uploaded_by, document_type, title, file_path, file_name, file_size, file_type, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $traineeId,
            $uploadedBy,
            $documentType,
            $title,
            $filePath,
            $file['name'],
            $file['size'],
            $file['type'],
            $notes
        ]);
        
        $documentId = $conn->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'Document uploaded successfully',
            'data' => ['id' => $documentId, 'file_path' => $filePath]
        ]);
    } else {
        // JSON data (for creating document record without file)
        $input = json_decode(file_get_contents('php://input'), true);
        
        $traineeId = $input['trainee_id'] ?? null;
        $uploadedBy = $input['uploaded_by'] ?? $traineeId;
        
        if (!$traineeId) {
            http_response_code(400);
            echo json_encode(['error' => 'trainee_id is required']);
            return;
        }
        
        $stmt = $conn->prepare("
            INSERT INTO ojt_documents 
            (trainee_id, uploaded_by, document_type, title, file_path, file_name, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $traineeId,
            $uploadedBy,
            $input['document_type'] ?? 'other',
            $input['title'] ?? 'Untitled Document',
            $input['file_path'] ?? '',
            $input['file_name'] ?? '',
            $input['notes'] ?? null
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Document record created',
            'data' => ['id' => $conn->lastInsertId()]
        ]);
    }
}

/**
 * Update document (status, notes)
 */
function updateDocument($conn, $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $updates = [];
    $params = [];
    
    if (isset($input['status'])) {
        $updates[] = "status = ?";
        $params[] = $input['status'];
    }
    
    if (isset($input['notes'])) {
        $updates[] = "notes = ?";
        $params[] = $input['notes'];
    }
    
    if (isset($input['title'])) {
        $updates[] = "title = ?";
        $params[] = $input['title'];
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        return;
    }
    
    $params[] = $id;
    
    $stmt = $conn->prepare("
        UPDATE ojt_documents SET " . implode(', ', $updates) . " WHERE id = ?
    ");
    $stmt->execute($params);
    
    echo json_encode([
        'success' => true,
        'message' => 'Document updated successfully'
    ]);
}

/**
 * Delete document
 */
function deleteDocument($conn, $id) {
    // Get file path first
    $stmt = $conn->prepare("SELECT file_path FROM ojt_documents WHERE id = ?");
    $stmt->execute([$id]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$document) {
        http_response_code(404);
        echo json_encode(['error' => 'Document not found']);
        return;
    }
    
    // Delete file if exists
    $filePath = __DIR__ . '/..' . $document['file_path'];
    if (file_exists($filePath)) {
        unlink($filePath);
    }
    
    // Delete from database
    $stmt = $conn->prepare("DELETE FROM ojt_documents WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Document deleted successfully'
    ]);
}
