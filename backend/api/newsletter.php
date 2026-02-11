<?php
/**
 * Newsletter API
 * Handles newsletter subscriptions
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
        subscribe($db);
        break;
    
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

/**
 * Subscribe to newsletter
 */
function subscribe($db) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['email'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email is required']);
            return;
        }

        // Validate email
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid email address']);
            return;
        }

        $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);

        // Check if already subscribed
        $checkSql = "SELECT id, status FROM newsletter_subscribers WHERE email = :email";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([':email' => $email]);
        $existing = $checkStmt->fetch();

        if ($existing) {
            if ($existing['status'] === 'active') {
                echo json_encode([
                    'success' => true,
                    'message' => 'You are already subscribed to our newsletter.'
                ]);
                return;
            } else {
                // Reactivate subscription
                $updateSql = "UPDATE newsletter_subscribers SET status = 'active' WHERE id = :id";
                $updateStmt = $db->prepare($updateSql);
                $updateStmt->execute([':id' => $existing['id']]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Welcome back! Your subscription has been reactivated.'
                ]);
                return;
            }
        }

        // Insert new subscriber
        $sql = "INSERT INTO newsletter_subscribers (email) VALUES (:email)";
        $stmt = $db->prepare($sql);
        $stmt->execute([':email' => $email]);

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Thank you for subscribing! You will receive our latest updates.'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to subscribe', 'error' => $e->getMessage()]);
    }
}
