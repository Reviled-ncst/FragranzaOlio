<?php
/**
 * Admin Users API Endpoints
 * Fragranza Olio - User Management for Admin
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

class AdminUsersController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Log admin action for audit trail
     */
    private function logAction($admin, $actionType, $targetId, $targetName, $description, $oldValues = null, $newValues = null) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO admin_logs 
                (admin_id, admin_name, admin_email, action_type, target_type, target_id, target_name, description, old_values, new_values, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, 'user', ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $adminName = $admin['first_name'] . ' ' . $admin['last_name'];
            $oldJson = $oldValues ? json_encode($oldValues) : null;
            $newJson = $newValues ? json_encode($newValues) : null;
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
            
            $stmt->execute([
                $admin['id'],
                $adminName,
                $admin['email'],
                $actionType,
                $targetId,
                $targetName,
                $description,
                $oldJson,
                $newJson,
                $ipAddress,
                $userAgent
            ]);
        } catch (PDOException $e) {
            error_log("Failed to log admin action: " . $e->getMessage());
        }
    }
    
    /**
     * Verify admin authorization
     */
    private function verifyAdmin() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }
        
        $token = substr($authHeader, 7);
        
        $stmt = $this->db->prepare("
            SELECT u.id, u.role, u.email, u.first_name, u.last_name
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? AND s.expires_at > NOW() AND u.status = 'active'
        ");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        
        if (!$user || $user['role'] !== 'admin') {
            return null;
        }
        
        return $user;
    }
    
    /**
     * Get all users with optional filters
     */
    public function getUsers($filters = []) {
        $admin = $this->verifyAdmin();
        if (!$admin) {
            return $this->response(false, 'Unauthorized. Admin access required.', null, 401);
        }
        
        try {
            $where = [];
            $params = [];
            
            // Filter by role
            if (!empty($filters['role'])) {
                $where[] = "u.role = ?";
                $params[] = $filters['role'];
            }
            
            // Filter by status
            if (!empty($filters['status'])) {
                $where[] = "u.status = ?";
                $params[] = $filters['status'];
            }
            
            // Search by name or email
            if (!empty($filters['search'])) {
                $searchTerm = '%' . $filters['search'] . '%';
                $where[] = "(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.employee_id LIKE ?)";
                $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
            }
            
            $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';
            
            // Pagination
            $page = max(1, intval($filters['page'] ?? 1));
            $limit = min(100, max(10, intval($filters['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;
            
            // Get total count
            $countStmt = $this->db->prepare("SELECT COUNT(*) as total FROM users u LEFT JOIN users s ON u.supervisor_id = s.id $whereClause");
            $countStmt->execute($params);
            $total = $countStmt->fetch()['total'];
            
            // Get users
            $sql = "
                SELECT 
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.role,
                    u.phone,
                    u.address,
                    u.city,
                    u.province,
                    u.zip_code,
                    u.department,
                    u.position,
                    u.employee_id,
                    u.supervisor_id,
                    u.hire_date,
                    u.status,
                    u.email_verified,
                    u.last_login,
                    u.login_count,
                    u.created_at,
                    u.updated_at,
                    u.created_by,
                    s.first_name as supervisor_first_name,
                    s.last_name as supervisor_last_name
                FROM users u
                LEFT JOIN users s ON u.supervisor_id = s.id
                $whereClause
                ORDER BY u.created_at DESC
                LIMIT $limit OFFSET $offset
            ";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $users = $stmt->fetchAll();
            
            // Transform users
            $transformedUsers = array_map(function($user) {
                return [
                    'id' => $user['id'],
                    'firstName' => $user['first_name'],
                    'lastName' => $user['last_name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'phone' => $user['phone'],
                    'address' => $user['address'],
                    'city' => $user['city'],
                    'province' => $user['province'],
                    'zipCode' => $user['zip_code'],
                    'department' => $user['department'],
                    'position' => $user['position'],
                    'employeeId' => $user['employee_id'],
                    'supervisorId' => $user['supervisor_id'],
                    'supervisorName' => $user['supervisor_first_name'] 
                        ? $user['supervisor_first_name'] . ' ' . $user['supervisor_last_name'] 
                        : null,
                    'hireDate' => $user['hire_date'],
                    'status' => $user['status'],
                    'emailVerified' => (bool)$user['email_verified'],
                    'lastLogin' => $user['last_login'],
                    'loginCount' => (int)$user['login_count'],
                    'createdAt' => $user['created_at'],
                    'updatedAt' => $user['updated_at'],
                    'createdBy' => $user['created_by']
                ];
            }, $users);
            
            return $this->response(true, 'Users retrieved successfully', [
                'users' => $transformedUsers,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => (int)$total,
                    'totalPages' => ceil($total / $limit)
                ]
            ]);
            
        } catch (PDOException $e) {
            error_log("Get users error: " . $e->getMessage());
            return $this->response(false, 'Failed to retrieve users', null, 500);
        }
    }
    
    /**
     * Get a single user by ID
     */
    public function getUser($id) {
        $admin = $this->verifyAdmin();
        if (!$admin) {
            return $this->response(false, 'Unauthorized. Admin access required.', null, 401);
        }
        
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    u.*,
                    s.first_name as supervisor_first_name,
                    s.last_name as supervisor_last_name
                FROM users u
                LEFT JOIN users s ON u.supervisor_id = s.id
                WHERE u.id = ?
            ");
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            
            if (!$user) {
                return $this->response(false, 'User not found', null, 404);
            }
            
            return $this->response(true, 'User retrieved successfully', [
                'user' => [
                    'id' => $user['id'],
                    'firstName' => $user['first_name'],
                    'lastName' => $user['last_name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'birthDate' => $user['birth_date'],
                    'gender' => $user['gender'],
                    'phone' => $user['phone'],
                    'address' => $user['address'],
                    'city' => $user['city'],
                    'province' => $user['province'],
                    'zipCode' => $user['zip_code'],
                    'department' => $user['department'],
                    'position' => $user['position'],
                    'employeeId' => $user['employee_id'],
                    'supervisorId' => $user['supervisor_id'],
                    'supervisorName' => $user['supervisor_first_name'] 
                        ? $user['supervisor_first_name'] . ' ' . $user['supervisor_last_name'] 
                        : null,
                    'hireDate' => $user['hire_date'],
                    'notes' => $user['notes'],
                    'status' => $user['status'],
                    'emailVerified' => (bool)$user['email_verified'],
                    'lastLogin' => $user['last_login'],
                    'loginCount' => (int)$user['login_count'],
                    'createdAt' => $user['created_at'],
                    'updatedAt' => $user['updated_at']
                ]
            ]);
            
        } catch (PDOException $e) {
            error_log("Get user error: " . $e->getMessage());
            return $this->response(false, 'Failed to retrieve user', null, 500);
        }
    }
    
    /**
     * Create a new user (Admin creates accounts for OJT, OJT Supervisor, Sales)
     */
    public function createUser($data) {
        $admin = $this->verifyAdmin();
        if (!$admin) {
            return $this->response(false, 'Unauthorized. Admin access required.', null, 401);
        }
        
        try {
            // Validate required fields
            $required = ['firstName', 'lastName', 'email', 'password', 'role'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return $this->response(false, "Field '{$field}' is required", null, 400);
                }
            }
            
            // Validate role
            $allowedRoles = ['customer', 'sales', 'ojt', 'ojt_supervisor', 'admin'];
            if (!in_array($data['role'], $allowedRoles)) {
                return $this->response(false, 'Invalid role specified', null, 400);
            }
            
            // Validate email format
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return $this->response(false, 'Invalid email format', null, 400);
            }
            
            // Check if email already exists
            $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$data['email']]);
            if ($stmt->fetch()) {
                return $this->response(false, 'Email already registered', null, 409);
            }
            
            // Validate password strength
            if (strlen($data['password']) < 8) {
                return $this->response(false, 'Password must be at least 8 characters', null, 400);
            }
            
            // Hash password
            $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
            
            // Generate employee ID for non-customer roles
            $employeeId = null;
            if ($data['role'] !== 'customer') {
                $prefix = match($data['role']) {
                    'admin' => 'ADM',
                    'sales' => 'SAL',
                    'ojt' => 'OJT',
                    'ojt_supervisor' => 'SUP',
                    default => 'EMP'
                };
                $employeeId = $prefix . '-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            }
            
            // Insert user
            $stmt = $this->db->prepare("
                INSERT INTO users (
                    first_name, last_name, email, role, birth_date, gender,
                    phone, address, city, province, zip_code,
                    department, position, employee_id, supervisor_id, hire_date, notes,
                    university, course, required_hours, render_hours, ojt_start_date, ojt_end_date,
                    password_hash, status, email_verified, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, NOW())
            ");
            
            $stmt->execute([
                trim($data['firstName']),
                trim($data['lastName']),
                strtolower(trim($data['email'])),
                $data['role'],
                $data['birthDate'] ?? null,
                $data['gender'] ?? null,
                $data['phone'] ?? null,
                $data['address'] ?? null,
                $data['city'] ?? null,
                $data['province'] ?? null,
                $data['zipCode'] ?? null,
                $data['department'] ?? null,
                $data['position'] ?? null,
                $employeeId,
                $data['supervisorId'] ?? null,
                $data['hireDate'] ?? date('Y-m-d'),
                $data['notes'] ?? null,
                $data['university'] ?? null,
                $data['course'] ?? null,
                $data['requiredHours'] ?? 500,
                $data['renderHours'] ?? 24,
                $data['ojtStartDate'] ?? null,
                $data['ojtEndDate'] ?? null,
                $passwordHash,
                $admin['id']
            ]);
            
            $userId = $this->db->lastInsertId();
                        // If creating an OJT trainee with a supervisor, also create ojt_assignments record
            if ($data['role'] === 'ojt' && !empty($data['supervisorId'])) {
                $startDate = $data['ojtStartDate'] ?? date('Y-m-d');
                $endDate = $data['ojtEndDate'] ?? null;
                $requiredHours = $data['requiredHours'] ?? 500;
                $department = $data['department'] ?? 'General';
                
                $assignStmt = $this->db->prepare("
                    INSERT INTO ojt_assignments 
                    (supervisor_id, trainee_id, department, start_date, end_date, total_required_hours, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())
                ");
                $assignStmt->execute([
                    $data['supervisorId'],
                    $userId,
                    $department,
                    $startDate,
                    $endDate,
                    $requiredHours
                ]);
            }
                        // Log the action
            $targetName = trim($data['firstName']) . ' ' . trim($data['lastName']);
            $this->logAction(
                $admin,
                'create',
                $userId,
                $targetName,
                "Created new {$data['role']} account for {$data['email']}",
                null,
                [
                    'email' => $data['email'],
                    'role' => $data['role'],
                    'department' => $data['department'] ?? null,
                    'position' => $data['position'] ?? null,
                    'employeeId' => $employeeId
                ]
            );
            
            return $this->response(true, 'User created successfully', [
                'userId' => $userId,
                'email' => $data['email'],
                'employeeId' => $employeeId
            ], 201);
            
        } catch (PDOException $e) {
            error_log("Create user error: " . $e->getMessage());
            return $this->response(false, 'Failed to create user: ' . $e->getMessage(), null, 500);
        }
    }
    
    /**
     * Update a user
     */
    public function updateUser($id, $data) {
        $admin = $this->verifyAdmin();
        if (!$admin) {
            return $this->response(false, 'Unauthorized. Admin access required.', null, 401);
        }
        
        try {
            // Check if user exists and get current data for logging
            $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $existingUser = $stmt->fetch();
            
            if (!$existingUser) {
                return $this->response(false, 'User not found', null, 404);
            }
            
            // Store old values for logging
            $oldValues = [
                'email' => $existingUser['email'],
                'role' => $existingUser['role'],
                'status' => $existingUser['status'],
                'department' => $existingUser['department'],
                'position' => $existingUser['position']
            ];
            
            // If email is being changed, check for duplicates
            if (!empty($data['email']) && strtolower($data['email']) !== $existingUser['email']) {
                $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                $stmt->execute([strtolower($data['email']), $id]);
                if ($stmt->fetch()) {
                    return $this->response(false, 'Email already in use by another user', null, 409);
                }
            }
            
            // Build update query dynamically
            $updates = [];
            $params = [];
            
            $fieldMap = [
                'firstName' => 'first_name',
                'lastName' => 'last_name',
                'email' => 'email',
                'role' => 'role',
                'birthDate' => 'birth_date',
                'gender' => 'gender',
                'phone' => 'phone',
                'address' => 'address',
                'city' => 'city',
                'province' => 'province',
                'zipCode' => 'zip_code',
                'department' => 'department',
                'position' => 'position',
                'employeeId' => 'employee_id',
                'supervisorId' => 'supervisor_id',
                'hireDate' => 'hire_date',
                'notes' => 'notes',
                'status' => 'status',
                'university' => 'university',
                'course' => 'course',
                'requiredHours' => 'required_hours',
                'renderHours' => 'render_hours',
                'ojtStartDate' => 'ojt_start_date',
                'ojtEndDate' => 'ojt_end_date'
            ];
            
            foreach ($fieldMap as $camelCase => $snakeCase) {
                if (array_key_exists($camelCase, $data)) {
                    $updates[] = "$snakeCase = ?";
                    $value = $data[$camelCase];
                    if ($camelCase === 'email') {
                        $value = strtolower(trim($value));
                    }
                    $params[] = $value;
                }
            }
            
            // Handle password update separately
            if (!empty($data['password'])) {
                if (strlen($data['password']) < 8) {
                    return $this->response(false, 'Password must be at least 8 characters', null, 400);
                }
                $updates[] = "password_hash = ?";
                $params[] = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
            }
            
            if (empty($updates)) {
                return $this->response(false, 'No fields to update', null, 400);
            }
            
            $updates[] = "updated_at = NOW()";
            $params[] = $id;
            
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            
            // If this is an OJT trainee and supervisor is being changed, update ojt_assignments
            if ($existingUser['role'] === 'ojt' && isset($data['supervisorId'])) {
                $newSupervisorId = $data['supervisorId'];
                $oldSupervisorId = $existingUser['supervisor_id'];
                
                // Check if assignment exists
                $checkStmt = $this->db->prepare("SELECT id FROM ojt_assignments WHERE trainee_id = ? AND status = 'active'");
                $checkStmt->execute([$id]);
                $existingAssignment = $checkStmt->fetch();
                
                if ($existingAssignment) {
                    // Update existing assignment
                    $updateAssignStmt = $this->db->prepare("
                        UPDATE ojt_assignments 
                        SET supervisor_id = ?, 
                            department = COALESCE(?, department),
                            updated_at = NOW()
                        WHERE id = ?
                    ");
                    $updateAssignStmt->execute([
                        $newSupervisorId,
                        $data['department'] ?? null,
                        $existingAssignment['id']
                    ]);
                } elseif ($newSupervisorId) {
                    // Create new assignment
                    $startDate = $data['ojtStartDate'] ?? $existingUser['ojt_start_date'] ?? date('Y-m-d');
                    $endDate = $data['ojtEndDate'] ?? $existingUser['ojt_end_date'] ?? null;
                    $requiredHours = $data['requiredHours'] ?? $existingUser['required_hours'] ?? 500;
                    $department = $data['department'] ?? $existingUser['department'] ?? 'General';
                    
                    $insertAssignStmt = $this->db->prepare("
                        INSERT INTO ojt_assignments 
                        (supervisor_id, trainee_id, department, start_date, end_date, total_required_hours, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())
                    ");
                    $insertAssignStmt->execute([
                        $newSupervisorId,
                        $id,
                        $department,
                        $startDate,
                        $endDate,
                        $requiredHours
                    ]);
                }
            }
            
            // Log the action
            $targetName = $existingUser['first_name'] . ' ' . $existingUser['last_name'];
            $changedFields = array_keys($data);
            $this->logAction(
                $admin,
                'update',
                $id,
                $targetName,
                "Updated user {$existingUser['email']}: " . implode(', ', $changedFields),
                $oldValues,
                $data
            );
            
            return $this->response(true, 'User updated successfully', ['userId' => $id]);
            
        } catch (PDOException $e) {
            error_log("Update user error: " . $e->getMessage());
            return $this->response(false, 'Failed to update user', null, 500);
        }
    }
    
    /**
     * Delete a user
     */
    public function deleteUser($id) {
        $admin = $this->verifyAdmin();
        if (!$admin) {
            return $this->response(false, 'Unauthorized. Admin access required.', null, 401);
        }
        
        // Prevent admin from deleting themselves
        if ($admin['id'] == $id) {
            return $this->response(false, 'Cannot delete your own account', null, 400);
        }
        
        try {
            // Check if user exists
            $stmt = $this->db->prepare("SELECT id, email, role, first_name, last_name, department, position FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            
            if (!$user) {
                return $this->response(false, 'User not found', null, 404);
            }
            
            // Soft delete - set status to inactive instead of hard delete
            $stmt = $this->db->prepare("UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = ?");
            $stmt->execute([$id]);
            
            // Log the action
            $targetName = $user['first_name'] . ' ' . $user['last_name'];
            $this->logAction(
                $admin,
                'delete',
                $id,
                $targetName,
                "Deleted user {$user['email']} (Role: {$user['role']})",
                [
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'department' => $user['department'],
                    'position' => $user['position']
                ],
                null
            );
            
            return $this->response(true, 'User deleted successfully');
            
        } catch (PDOException $e) {
            error_log("Delete user error: " . $e->getMessage());
            return $this->response(false, 'Failed to delete user', null, 500);
        }
    }
    
    /**
     * Get users by role (for supervisor dropdown, etc.)
     */
    public function getUsersByRole($role) {
        $admin = $this->verifyAdmin();
        if (!$admin) {
            return $this->response(false, 'Unauthorized. Admin access required.', null, 401);
        }
        
        try {
            $stmt = $this->db->prepare("
                SELECT id, first_name, last_name, email, employee_id
                FROM users
                WHERE role = ? AND status = 'active'
                ORDER BY first_name, last_name
            ");
            $stmt->execute([$role]);
            $users = $stmt->fetchAll();
            
            $transformedUsers = array_map(function($user) {
                return [
                    'id' => $user['id'],
                    'firstName' => $user['first_name'],
                    'lastName' => $user['last_name'],
                    'email' => $user['email'],
                    'employeeId' => $user['employee_id'],
                    'fullName' => $user['first_name'] . ' ' . $user['last_name']
                ];
            }, $users);
            
            return $this->response(true, 'Users retrieved successfully', ['users' => $transformedUsers]);
            
        } catch (PDOException $e) {
            error_log("Get users by role error: " . $e->getMessage());
            return $this->response(false, 'Failed to retrieve users', null, 500);
        }
    }
    
    /**
     * Get dashboard stats
     */
    public function getDashboardStats() {
        $admin = $this->verifyAdmin();
        if (!$admin) {
            return $this->response(false, 'Unauthorized. Admin access required.', null, 401);
        }
        
        try {
            // Total users by role
            $stmt = $this->db->query("
                SELECT role, COUNT(*) as count 
                FROM users 
                WHERE status = 'active'
                GROUP BY role
            ");
            $roleStats = $stmt->fetchAll();
            
            $roleCounts = [];
            foreach ($roleStats as $stat) {
                $roleCounts[$stat['role']] = (int)$stat['count'];
            }
            
            // Total users by status
            $stmt = $this->db->query("
                SELECT status, COUNT(*) as count 
                FROM users 
                GROUP BY status
            ");
            $statusStats = $stmt->fetchAll();
            
            $statusCounts = [];
            foreach ($statusStats as $stat) {
                $statusCounts[$stat['status']] = (int)$stat['count'];
            }
            
            // Recent logins (last 7 days)
            $stmt = $this->db->query("
                SELECT COUNT(*) as count 
                FROM users 
                WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ");
            $recentLogins = $stmt->fetch()['count'];
            
            // New users this month
            $stmt = $this->db->query("
                SELECT COUNT(*) as count 
                FROM users 
                WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
            ");
            $newUsersThisMonth = $stmt->fetch()['count'];
            
            // Recent activity
            $stmt = $this->db->query("
                SELECT 
                    u.first_name, u.last_name, u.email, u.role,
                    a.activity_type, a.created_at
                FROM user_activity_log a
                JOIN users u ON a.user_id = u.id
                ORDER BY a.created_at DESC
                LIMIT 10
            ");
            $recentActivity = $stmt->fetchAll();
            
            return $this->response(true, 'Dashboard stats retrieved', [
                'totalUsers' => array_sum($roleCounts),
                'roleCounts' => $roleCounts,
                'statusCounts' => $statusCounts,
                'recentLogins' => (int)$recentLogins,
                'newUsersThisMonth' => (int)$newUsersThisMonth,
                'recentActivity' => array_map(function($a) {
                    return [
                        'userName' => $a['first_name'] . ' ' . $a['last_name'],
                        'email' => $a['email'],
                        'role' => $a['role'],
                        'activityType' => $a['activity_type'],
                        'createdAt' => $a['created_at']
                    ];
                }, $recentActivity)
            ]);
            
        } catch (PDOException $e) {
            error_log("Dashboard stats error: " . $e->getMessage());
            return $this->response(false, 'Failed to retrieve stats', null, 500);
        }
    }
    
    /**
     * Helper: Send JSON response
     */
    private function response($success, $message, $data = null, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }
}

// Route handling
$controller = new AdminUsersController();
$method = $_SERVER['REQUEST_METHOD'];

// Parse PATH_INFO - try multiple methods for compatibility
$pathInfo = '';
if (!empty($_SERVER['PATH_INFO'])) {
    $pathInfo = $_SERVER['PATH_INFO'];
} elseif (!empty($_SERVER['REQUEST_URI'])) {
    // Extract path info from REQUEST_URI
    $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $scriptName = $_SERVER['SCRIPT_NAME'];
    if (strpos($requestUri, $scriptName) === 0) {
        $pathInfo = substr($requestUri, strlen($scriptName));
    }
}

$pathParts = explode('/', trim($pathInfo, '/'));
$action = $pathParts[0] ?? '';
$id = $pathParts[1] ?? null;

// If action is numeric, it's actually the ID (e.g., /admin_users.php/6)
if (is_numeric($action)) {
    $id = $action;
    $action = '';
}

// Parse request body
$data = json_decode(file_get_contents('php://input'), true) ?? [];

// Merge query parameters for GET requests
if ($method === 'GET') {
    $data = array_merge($_GET, $data);
}

switch ($method) {
    case 'GET':
        if ($action === 'stats') {
            $controller->getDashboardStats();
        } elseif ($action === 'role' && $id) {
            $controller->getUsersByRole($id);
        } elseif ($id) {
            $controller->getUser($id);
        } else {
            $controller->getUsers($data);
        }
        break;
        
    case 'POST':
        $controller->createUser($data);
        break;
        
    case 'PUT':
        if ($id) {
            $controller->updateUser($id, $data);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID required']);
        }
        break;
        
    case 'DELETE':
        if ($id) {
            $controller->deleteUser($id);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID required']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
