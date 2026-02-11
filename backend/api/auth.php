<?php
/**
 * Authentication API Endpoints
 * Fragranza Olio - User Registration & Login
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

class AuthController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Register a new user
     */
    public function register($data) {
        try {
            // Validate required fields
            $required = ['firstName', 'lastName', 'email', 'password', 'birthDate', 'gender', 'phone'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return $this->response(false, "Field '{$field}' is required", null, 400);
                }
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
            
            // Validate password confirmation
            if ($data['password'] !== $data['confirmPassword']) {
                return $this->response(false, 'Passwords do not match', null, 400);
            }
            
            // Validate birth date (must be at least 13 years old)
            $birthDate = new DateTime($data['birthDate']);
            $today = new DateTime();
            $age = $today->diff($birthDate)->y;
            if ($age < 13) {
                return $this->response(false, 'You must be at least 13 years old to register', null, 400);
            }
            
            // Hash password
            $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
            
            // Generate email verification token
            $verificationToken = bin2hex(random_bytes(32));
            $verificationExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));
            
            // Insert user
            $stmt = $this->db->prepare("
                INSERT INTO users (
                    first_name, last_name, email, birth_date, gender,
                    phone, address, city, province, zip_code,
                    password_hash, subscribe_newsletter,
                    email_verification_token, email_verification_expires,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_verification')
            ");
            
            $stmt->execute([
                trim($data['firstName']),
                trim($data['lastName']),
                strtolower(trim($data['email'])),
                $data['birthDate'],
                $data['gender'],
                $data['phone'],
                $data['address'] ?? null,
                $data['city'] ?? null,
                $data['province'] ?? null,
                $data['zipCode'] ?? null,
                $passwordHash,
                ($data['subscribeNewsletter'] ?? false) ? 1 : 0,
                $verificationToken,
                $verificationExpires
            ]);
            
            $userId = $this->db->lastInsertId();
            
            // Handle OJT intern role - assign to supervisor
            $role = $data['role'] ?? 'customer';
            if ($role === 'ojt' && !empty($data['supervisorId'])) {
                // Update user role
                $stmt = $this->db->prepare("UPDATE users SET role = 'ojt' WHERE id = ?");
                $stmt->execute([$userId]);
                
                // Create OJT assignment
                $stmt = $this->db->prepare("
                    INSERT INTO ojt_assignments (supervisor_id, trainee_id, department, start_date, total_required_hours, status)
                    VALUES (?, ?, ?, CURDATE(), ?, 'active')
                ");
                $stmt->execute([
                    $data['supervisorId'],
                    $userId,
                    $data['department'] ?? 'General',
                    $data['requiredHours'] ?? 500
                ]);
                
                // Update user with university/course info
                if (!empty($data['university']) || !empty($data['course'])) {
                    $stmt = $this->db->prepare("UPDATE users SET university = ?, course = ? WHERE id = ?");
                    $stmt->execute([
                        $data['university'] ?? null,
                        $data['course'] ?? null,
                        $userId
                    ]);
                }
            } elseif ($role === 'ojt_supervisor') {
                $stmt = $this->db->prepare("UPDATE users SET role = 'ojt_supervisor' WHERE id = ?");
                $stmt->execute([$userId]);
            } elseif ($role !== 'customer') {
                $stmt = $this->db->prepare("UPDATE users SET role = ? WHERE id = ?");
                $stmt->execute([$role, $userId]);
            }
            
            // Log activity
            $this->logActivity($userId, 'register', $data);
            
            // TODO: Send verification email
            // $this->sendVerificationEmail($data['email'], $verificationToken);
            
            return $this->response(true, 'Registration successful! Please check your email to verify your account.', [
                'userId' => $userId,
                'email' => $data['email']
            ], 201);
            
        } catch (PDOException $e) {
            error_log("Registration error: " . $e->getMessage());
            return $this->response(false, 'Registration failed. Please try again.', null, 500);
        }
    }
    
    /**
     * User login
     */
    public function login($data) {
        try {
            // Validate required fields
            if (empty($data['email']) || empty($data['password'])) {
                return $this->response(false, 'Email and password are required', null, 400);
            }
            
            // Find user by email
            $stmt = $this->db->prepare("
                SELECT id, first_name, last_name, email, password_hash, status, email_verified, role
                FROM users WHERE email = ?
            ");
            $stmt->execute([strtolower(trim($data['email']))]);
            $user = $stmt->fetch();
            
            if (!$user) {
                return $this->response(false, 'Invalid email or password', null, 401);
            }
            
            // Verify password
            if (!password_verify($data['password'], $user['password_hash'])) {
                return $this->response(false, 'Invalid email or password', null, 401);
            }
            
            // Check account status
            if ($user['status'] === 'suspended') {
                return $this->response(false, 'Your account has been suspended. Please contact support.', null, 403);
            }
            
            if ($user['status'] === 'inactive') {
                return $this->response(false, 'Your account is inactive. Please contact support.', null, 403);
            }
            
            // Generate session token
            $sessionToken = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
            
            // Store session
            $stmt = $this->db->prepare("
                INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $user['id'],
                $sessionToken,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null,
                $expiresAt
            ]);
            
            // Update last login
            $stmt = $this->db->prepare("
                UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?
            ");
            $stmt->execute([$user['id']]);
            
            // Log activity
            $this->logActivity($user['id'], 'login', ['ip' => $_SERVER['REMOTE_ADDR'] ?? null]);
            
            return $this->response(true, 'Login successful', [
                'user' => [
                    'id' => $user['id'],
                    'firstName' => $user['first_name'],
                    'lastName' => $user['last_name'],
                    'email' => $user['email'],
                    'emailVerified' => (bool)$user['email_verified'],
                    'role' => $user['role'] ?? 'customer'
                ],
                'token' => $sessionToken,
                'expiresAt' => $expiresAt
            ]);
            
        } catch (PDOException $e) {
            error_log("Login error: " . $e->getMessage());
            return $this->response(false, 'Login failed. Please try again.', null, 500);
        }
    }
    
    /**
     * Logout user
     */
    public function logout($token) {
        try {
            // If no token provided, just return success (user already logged out)
            if (empty($token)) {
                return $this->response(true, 'Logged out successfully');
            }
            
            // Get user from session
            $stmt = $this->db->prepare("
                SELECT user_id FROM user_sessions WHERE session_token = ?
            ");
            $stmt->execute([$token]);
            $session = $stmt->fetch();
            
            if ($session) {
                // Log activity
                $this->logActivity($session['user_id'], 'logout', null);
            }
            
            // Delete session
            $stmt = $this->db->prepare("DELETE FROM user_sessions WHERE session_token = ?");
            $stmt->execute([$token]);
            
            return $this->response(true, 'Logged out successfully');
            
        } catch (PDOException $e) {
            error_log("Logout error: " . $e->getMessage());
            return $this->response(false, 'Logout failed', null, 500);
        }
    }
    
    /**
     * Get current user from token
     */
    public function getCurrentUser($token) {
        try {
            if (empty($token)) {
                return $this->response(false, 'No session token provided', null, 401);
            }
            
            // Find valid session
            $stmt = $this->db->prepare("
                SELECT u.id, u.first_name, u.last_name, u.email, u.birth_date, u.gender,
                       u.phone, u.address, u.city, u.province, u.zip_code,
                       u.subscribe_newsletter, u.email_verified, u.status, u.created_at, u.role
                FROM users u
                JOIN user_sessions s ON u.id = s.user_id
                WHERE s.session_token = ? AND s.expires_at > NOW()
            ");
            $stmt->execute([$token]);
            $user = $stmt->fetch();
            
            if (!$user) {
                return $this->response(false, 'Invalid or expired session', null, 401);
            }
            
            return $this->response(true, 'User retrieved successfully', [
                'user' => [
                    'id' => $user['id'],
                    'firstName' => $user['first_name'],
                    'lastName' => $user['last_name'],
                    'email' => $user['email'],
                    'birthDate' => $user['birth_date'],
                    'gender' => $user['gender'],
                    'phone' => $user['phone'],
                    'address' => $user['address'],
                    'city' => $user['city'],
                    'province' => $user['province'],
                    'zipCode' => $user['zip_code'],
                    'subscribeNewsletter' => (bool)$user['subscribe_newsletter'],
                    'emailVerified' => (bool)$user['email_verified'],
                    'status' => $user['status'],
                    'createdAt' => $user['created_at'],
                    'role' => $user['role'] ?? 'customer'
                ]
            ]);
            
        } catch (PDOException $e) {
            error_log("Get user error: " . $e->getMessage());
            return $this->response(false, 'Failed to retrieve user', null, 500);
        }
    }
    
    /**
     * Verify email
     */
    public function verifyEmail($token) {
        try {
            $stmt = $this->db->prepare("
                SELECT id FROM users 
                WHERE email_verification_token = ? AND email_verification_expires > NOW()
            ");
            $stmt->execute([$token]);
            $user = $stmt->fetch();
            
            if (!$user) {
                return $this->response(false, 'Invalid or expired verification token', null, 400);
            }
            
            // Update user status
            $stmt = $this->db->prepare("
                UPDATE users SET 
                    email_verified = 1, 
                    status = 'active',
                    email_verification_token = NULL,
                    email_verification_expires = NULL
                WHERE id = ?
            ");
            $stmt->execute([$user['id']]);
            
            return $this->response(true, 'Email verified successfully! You can now login.');
            
        } catch (PDOException $e) {
            error_log("Email verification error: " . $e->getMessage());
            return $this->response(false, 'Verification failed', null, 500);
        }
    }
    
    /**
     * Check if email exists
     */
    public function checkEmail($email) {
        try {
            $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([strtolower(trim($email))]);
            $exists = $stmt->fetch() ? true : false;
            
            return $this->response(true, 'Email check completed', ['exists' => $exists]);
            
        } catch (PDOException $e) {
            return $this->response(false, 'Email check failed', null, 500);
        }
    }
    
    /**
     * Get list of available supervisors for OJT intern registration
     */
    public function getSupervisors() {
        try {
            $stmt = $this->db->prepare("
                SELECT id, CONCAT(first_name, ' ', last_name) AS name, email
                FROM users 
                WHERE role = 'ojt_supervisor' AND status = 'active'
                ORDER BY first_name, last_name
            ");
            $stmt->execute();
            $supervisors = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->response(true, 'Supervisors retrieved', $supervisors);
            
        } catch (PDOException $e) {
            error_log("Get supervisors error: " . $e->getMessage());
            return $this->response(false, 'Failed to get supervisors', null, 500);
        }
    }
    
    /**
     * Log user activity
     */
    private function logActivity($userId, $type, $details = null) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO user_activity_log (user_id, activity_type, ip_address, user_agent, details)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                $type,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null,
                $details ? json_encode($details) : null
            ]);
        } catch (PDOException $e) {
            error_log("Activity log error: " . $e->getMessage());
        }
    }
    
    /**
     * JSON response helper
     */
    private function response($success, $message, $data = null, $statusCode = 200) {
        http_response_code($statusCode);
        $response = [
            'success' => $success,
            'message' => $message
        ];
        if ($data !== null) {
            $response['data'] = $data;
        }
        echo json_encode($response);
        exit;
    }
}

// Route handling
$auth = new AuthController();
$method = $_SERVER['REQUEST_METHOD'];

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Get action from POST body or URL parameter
$action = $input['action'] ?? $_GET['action'] ?? '';

// Get authorization header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

switch ($method) {
    case 'POST':
        switch ($action) {
            case 'register':
                $auth->register($input);
                break;
            case 'login':
                $auth->login($input);
                break;
            case 'logout':
                $auth->logout($token);
                break;
            case 'check-email':
                $auth->checkEmail($input['email'] ?? '');
                break;
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'POST action not found', 'action' => $action]);
        }
        break;
        
    case 'GET':
        switch ($action) {
            case 'current-user':
            case 'me':
                // Get token from header, GET param, or localStorage key
                $sessionToken = $token ?: ($_GET['token'] ?? '');
                $auth->getCurrentUser($sessionToken);
                break;
            case 'verify-email':
                $auth->verifyEmail($_GET['token'] ?? '');
                break;
            case 'check-email':
                $auth->checkEmail($_GET['email'] ?? '');
                break;
            case 'get-supervisors':
                $auth->getSupervisors();
                break;
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Action not found', 'action' => $action]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
