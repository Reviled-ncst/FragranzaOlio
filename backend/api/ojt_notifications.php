<?php
/**
 * OJT Notifications API
 * Handles user notifications for modules, documents, tasks, etc.
 */

// Send CORS headers immediately
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Email, Accept, Origin");
header("Access-Control-Max-Age: 86400");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';

if (empty($path) && isset($_SERVER['REQUEST_URI'])) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('#/ojt_notifications\.php(/.*)?$#', $uri, $matches)) {
        $path = isset($matches[1]) ? $matches[1] : '';
    }
}

$path = trim($path, '/');

try {
    $conn = Database::getInstance()->getConnection();
    
    switch ($method) {
        case 'GET':
            if ($path === 'unread-count') {
                getUnreadCount($conn);
            } elseif ($path === 'unread') {
                getUnreadNotifications($conn);
            } elseif ($path === 'activity') {
                getActivityLog($conn);
            } else {
                getNotifications($conn);
            }
            break;
            
        case 'POST':
            createNotification($conn);
            break;
            
        case 'PUT':
            if ($path === 'mark-read') {
                markAsRead($conn);
            } elseif ($path === 'mark-all-read') {
                markAllAsRead($conn);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid endpoint']);
            }
            break;
            
        case 'DELETE':
            if ($path === 'clear-all') {
                clearAllNotifications($conn);
            } else {
                deleteNotification($conn);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function getUnreadCount($conn) {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID required']);
        return;
    }
    
    // Get counts by type
    $stmt = $conn->prepare("
        SELECT type, COUNT(*) as count 
        FROM ojt_notifications 
        WHERE user_id = ? AND is_read = 0
        GROUP BY type
    ");
    $stmt->execute([$userId]);
    $counts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $result = [
        'total' => 0,
        'module' => 0,
        'document' => 0,
        'task' => 0,
        'timesheet' => 0,
        'attendance' => 0,
        'general' => 0,
        'system' => 0
    ];
    
    foreach ($counts as $row) {
        $result[$row['type']] = intval($row['count']);
        $result['total'] += intval($row['count']);
    }
    
    echo json_encode(['success' => true, 'data' => $result]);
}

function getUnreadNotifications($conn) {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID required']);
        return;
    }
    
    $stmt = $conn->prepare("
        SELECT * FROM ojt_notifications 
        WHERE user_id = ? AND is_read = 0
        ORDER BY created_at DESC
        LIMIT ?
    ");
    $stmt->execute([$userId, $limit]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $notifications]);
}

function getNotifications($conn) {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $type = isset($_GET['type']) ? $_GET['type'] : null;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID required']);
        return;
    }
    
    $sql = "SELECT * FROM ojt_notifications WHERE user_id = ?";
    $params = [$userId];
    
    if ($type) {
        $sql .= " AND type = ?";
        $params[] = $type;
    }
    
    $sql .= " ORDER BY created_at DESC LIMIT ?";
    $params[] = $limit;
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $notifications]);
}

function createNotification($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $userId = intval($data['user_id'] ?? 0);
    $type = $data['type'] ?? 'general';
    $title = $data['title'] ?? '';
    $message = $data['message'] ?? '';
    $link = $data['link'] ?? null;
    
    if (!$userId || !$title) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID and title required']);
        return;
    }
    
    $stmt = $conn->prepare("
        INSERT INTO ojt_notifications (user_id, type, title, message, link)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$userId, $type, $title, $message, $link]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Notification created',
        'id' => $conn->lastInsertId()
    ]);
}

function markAsRead($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Notification ID required']);
        return;
    }
    
    $stmt = $conn->prepare("
        UPDATE ojt_notifications 
        SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'message' => 'Notification marked as read']);
}

function markAllAsRead($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = intval($data['user_id'] ?? 0);
    $type = $data['type'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID required']);
        return;
    }
    
    $sql = "UPDATE ojt_notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ?";
    $params = [$userId];
    
    if ($type) {
        $sql .= " AND type = ?";
        $params[] = $type;
    }
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(['success' => true, 'message' => 'All notifications marked as read']);
}

function deleteNotification($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Notification ID required']);
        return;
    }
    
    $stmt = $conn->prepare("DELETE FROM ojt_notifications WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'message' => 'Notification deleted']);
}

function clearAllNotifications($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = intval($data['user_id'] ?? $_GET['user_id'] ?? 0);
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID required']);
        return;
    }
    
    $stmt = $conn->prepare("DELETE FROM ojt_notifications WHERE user_id = ?");
    $stmt->execute([$userId]);
    
    echo json_encode(['success' => true, 'message' => 'All notifications cleared']);
}

function getActivityLog($conn) {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    $entityType = isset($_GET['entity_type']) ? $_GET['entity_type'] : null;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    
    $query = "
        SELECT 
            a.*,
            CONCAT(u.first_name, ' ', u.last_name) as user_name,
            u.email as user_email,
            u.role as user_role
        FROM activity_log a
        JOIN users u ON a.user_id = u.id
        WHERE 1=1
    ";
    $params = [];
    
    if ($userId) {
        $query .= " AND a.user_id = ?";
        $params[] = $userId;
    }
    
    if ($entityType) {
        $query .= " AND a.entity_type = ?";
        $params[] = $entityType;
    }
    
    $query .= " ORDER BY a.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $activities]);
}
?>
