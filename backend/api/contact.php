<?php
/**
 * Contact API
 * Handles contact form submissions
 */

// Send CORS headers immediately
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Email, Accept, Origin");
header("Access-Control-Max-Age: 86400");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        submitContact($db);
        break;
    
    case 'GET':
        // For admin - get all inquiries
        getInquiries($db);
        break;
    
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

/**
 * Submit a new contact inquiry
 */
function submitContact($db) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        $required = ['name', 'email', 'message'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Field '$field' is required"]);
                return;
            }
        }

        // Validate email format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid email address']);
            return;
        }

        // Sanitize input
        $name = htmlspecialchars(strip_tags($data['name']));
        $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
        $phone = isset($data['phone']) ? htmlspecialchars(strip_tags($data['phone'])) : null;
        $company = isset($data['company']) ? htmlspecialchars(strip_tags($data['company'])) : null;
        $inquiryType = $data['inquiry_type'] ?? $data['inquiryType'] ?? 'general';
        $message = htmlspecialchars(strip_tags($data['message']));

        $sql = "INSERT INTO contact_inquiries (name, email, phone, company, inquiry_type, message) 
                VALUES (:name, :email, :phone, :company, :inquiry_type, :message)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':phone' => $phone,
            ':company' => $company,
            ':inquiry_type' => $inquiryType,
            ':message' => $message,
        ]);

        $inquiryId = $db->lastInsertId();

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Your message has been sent successfully. We will get back to you soon.',
            'data' => ['id' => $inquiryId]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to submit inquiry', 'error' => $e->getMessage()]);
    }
}

/**
 * Get all inquiries (admin function)
 */
function getInquiries($db) {
    try {
        // Filter by status
        $status = $_GET['status'] ?? null;
        
        $sql = "SELECT * FROM contact_inquiries";
        $params = [];

        if ($status) {
            $sql .= " WHERE status = :status";
            $params[':status'] = $status;
        }

        $sql .= " ORDER BY created_at DESC";

        // Pagination
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(50, max(1, (int)$_GET['limit'])) : 20;
        $offset = ($page - 1) * $limit;

        $sql .= " LIMIT $limit OFFSET $offset";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $inquiries = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $inquiries
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch inquiries', 'error' => $e->getMessage()]);
    }
}
