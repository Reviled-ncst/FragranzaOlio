<?php
/**
 * Admin Activity Logs API
 * Fragranza Olio - Audit Trail for Admin Actions (PDO Version)
 */

// Send CORS headers immediately
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Email, Accept, Origin");
header("Access-Control-Max-Age: 86400");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// Include CORS middleware
require_once __DIR__ . '/../middleware/cors.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';

class AdminLogsAPI {
    private $conn;
    private $currentAdmin = null;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Verify admin authentication
     */
    private function verifyAdmin() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        // Method 1: Try Bearer token (from user_sessions table)
        if (!empty($authHeader) && str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
            
            $query = "SELECT u.id, u.email, u.first_name, u.last_name, u.role 
                      FROM user_sessions s 
                      JOIN users u ON s.user_id = u.id 
                      WHERE s.session_token = ? AND s.expires_at > NOW() AND u.status = 'active'";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$token]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && in_array($user['role'], ['admin', 'ojt_supervisor', 'sales_representative'])) {
                $this->currentAdmin = $user;
                return true;
            }
        }
        
        // Method 2: Try email from query param or header (for Supabase auth)
        $email = $_GET['admin_email'] ?? $headers['X-Admin-Email'] ?? null;
        if ($email) {
            $query = "SELECT id, email, first_name, last_name, role 
                      FROM users 
                      WHERE email = ? AND status = 'active'";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && in_array($user['role'], ['admin', 'ojt_supervisor', 'sales_representative'])) {
                $this->currentAdmin = $user;
                return true;
            }
        }
        
        return false;
    }

    /**
     * Log an admin action
     */
    public function logAction($data) {
        $query = "INSERT INTO admin_logs 
                  (admin_id, admin_name, admin_email, action_type, target_type, target_id, target_name, description, old_values, new_values, ip_address, user_agent) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        
        $adminName = $data['admin_name'] ?? '';
        $adminEmail = $data['admin_email'] ?? '';
        $actionType = $data['action_type'] ?? 'other';
        $targetType = $data['target_type'] ?? 'system';
        $targetId = $data['target_id'] ?? null;
        $targetName = $data['target_name'] ?? null;
        $description = $data['description'] ?? '';
        $oldValues = isset($data['old_values']) ? json_encode($data['old_values']) : null;
        $newValues = isset($data['new_values']) ? json_encode($data['new_values']) : null;
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        
        return $stmt->execute([
            $data['admin_id'],
            $adminName,
            $adminEmail,
            $actionType,
            $targetType,
            $targetId,
            $targetName,
            $description,
            $oldValues,
            $newValues,
            $ipAddress,
            $userAgent
        ]);
    }

    /**
     * Get activity logs with filters
     */
    public function getLogs($filters = []) {
        $page = isset($filters['page']) ? max(1, intval($filters['page'])) : 1;
        $limit = isset($filters['limit']) ? min(100, max(1, intval($filters['limit']))) : 50;
        $offset = ($page - 1) * $limit;

        $whereConditions = [];
        $params = [];

        // Filter by action type
        if (!empty($filters['action_type'])) {
            $whereConditions[] = "al.action_type = ?";
            $params[] = $filters['action_type'];
        }

        // Filter by target type
        if (!empty($filters['target_type'])) {
            $whereConditions[] = "al.target_type = ?";
            $params[] = $filters['target_type'];
        }

        // Filter by admin
        if (!empty($filters['admin_id'])) {
            $whereConditions[] = "al.admin_id = ?";
            $params[] = intval($filters['admin_id']);
        }

        // Filter by date range
        if (!empty($filters['start_date'])) {
            $whereConditions[] = "DATE(al.created_at) >= ?";
            $params[] = $filters['start_date'];
        }
        if (!empty($filters['end_date'])) {
            $whereConditions[] = "DATE(al.created_at) <= ?";
            $params[] = $filters['end_date'];
        }

        // Search
        if (!empty($filters['search'])) {
            $searchTerm = "%" . $filters['search'] . "%";
            $whereConditions[] = "(al.description LIKE ? OR al.target_name LIKE ? OR al.admin_name LIKE ?)";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = !empty($whereConditions) ? "WHERE " . implode(" AND ", $whereConditions) : "";

        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM admin_logs al $whereClause";
        $countStmt = $this->conn->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Get logs
        $query = "SELECT al.*, 
                         u.first_name as admin_first_name, 
                         u.last_name as admin_last_name
                  FROM admin_logs al
                  LEFT JOIN users u ON al.admin_id = u.id
                  $whereClause
                  ORDER BY al.created_at DESC
                  LIMIT $limit OFFSET $offset";

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Parse JSON fields
        foreach ($logs as &$row) {
            $row['old_values'] = $row['old_values'] ? json_decode($row['old_values'], true) : null;
            $row['new_values'] = $row['new_values'] ? json_decode($row['new_values'], true) : null;
        }

        return [
            'logs' => $logs,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => intval($total),
                'totalPages' => ceil($total / $limit)
            ]
        ];
    }

    /**
     * Get log statistics
     */
    public function getStats($days = 30) {
        $stats = [];

        // Total actions in period
        $query = "SELECT COUNT(*) as total FROM admin_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$days]);
        $stats['totalActions'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Actions by type
        $query = "SELECT action_type, COUNT(*) as count 
                  FROM admin_logs 
                  WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                  GROUP BY action_type";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$days]);
        $stats['byActionType'] = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $stats['byActionType'][$row['action_type']] = intval($row['count']);
        }

        // Actions by target type
        $query = "SELECT target_type, COUNT(*) as count 
                  FROM admin_logs 
                  WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                  GROUP BY target_type";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$days]);
        $stats['byTargetType'] = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $stats['byTargetType'][$row['target_type']] = intval($row['count']);
        }

        // Most active admins
        $query = "SELECT admin_id, admin_name, admin_email, COUNT(*) as action_count 
                  FROM admin_logs 
                  WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                  GROUP BY admin_id, admin_name, admin_email
                  ORDER BY action_count DESC
                  LIMIT 10";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$days]);
        $stats['mostActiveAdmins'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Daily activity (last 7 days)
        $query = "SELECT DATE(created_at) as date, COUNT(*) as count 
                  FROM admin_logs 
                  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                  GROUP BY DATE(created_at)
                  ORDER BY date ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $stats['dailyActivity'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $stats;
    }

    /**
     * Handle GET request
     */
    public function handleGet() {
        if (!$this->verifyAdmin()) {
            http_response_code(401);
            return ['success' => false, 'message' => 'Unauthorized. Admin access required.'];
        }

        $path = $_SERVER['PATH_INFO'] ?? '';
        
        // Get stats
        if ($path === '/stats') {
            $days = isset($_GET['days']) ? intval($_GET['days']) : 30;
            $stats = $this->getStats($days);
            return ['success' => true, 'data' => $stats];
        }

        // Get logs with filters
        $filters = [
            'page' => $_GET['page'] ?? 1,
            'limit' => $_GET['limit'] ?? 50,
            'action_type' => $_GET['action_type'] ?? null,
            'target_type' => $_GET['target_type'] ?? null,
            'admin_id' => $_GET['admin_id'] ?? null,
            'start_date' => $_GET['start_date'] ?? null,
            'end_date' => $_GET['end_date'] ?? null,
            'search' => $_GET['search'] ?? null,
        ];

        $result = $this->getLogs($filters);
        return ['success' => true, 'data' => $result];
    }
}

// Initialize database connection
$db = Database::getInstance()->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$api = new AdminLogsAPI($db);

// Route request
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $response = $api->handleGet();
        break;
    default:
        http_response_code(405);
        $response = ['success' => false, 'message' => 'Method not allowed'];
}

header('Content-Type: application/json');
echo json_encode($response);
