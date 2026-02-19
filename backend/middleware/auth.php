<?php
/**
 * Authentication Middleware
 * Fragranza Olio - Verifies session tokens for protected endpoints
 * 
 * Usage:
 *   require_once __DIR__ . '/../middleware/auth.php';
 *   $user = requireAuth($db);          // Returns user or sends 401 and exits
 *   $user = requireRole($db, 'admin'); // Returns admin user or sends 403 and exits  
 *   $user = optionalAuth($db);         // Returns user or null (no error)
 */

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(): ?string {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (!empty($authHeader) && str_starts_with($authHeader, 'Bearer ')) {
        $token = substr($authHeader, 7);
        return !empty($token) ? $token : null;
    }
    
    return null;
}

/**
 * Validate session token and return user data
 * Returns user array or null if invalid
 */
function validateSession(PDO $db, string $token): ?array {
    if (empty($token)) {
        return null;
    }
    
    try {
        $stmt = $db->prepare("
            SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.status
            FROM users u
            JOIN user_sessions s ON u.id = s.user_id
            WHERE s.session_token = ? AND s.expires_at > NOW() AND u.status = 'active'
        ");
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    } catch (PDOException $e) {
        error_log("Auth middleware error: " . $e->getMessage());
        return null;
    }
}

/**
 * Require authentication - sends 401 and exits if not authenticated
 * @return array User data
 */
function requireAuth(PDO $db): array {
    $token = extractBearerToken();
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required. Please provide a valid Bearer token.']);
        exit;
    }
    
    $user = validateSession($db, $token);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired session token.']);
        exit;
    }
    
    return $user;
}

/**
 * Require specific role - sends 403 if role doesn't match
 * @param string|array $roles Single role string or array of allowed roles
 * @return array User data
 */
function requireRole(PDO $db, string|array $roles): array {
    $user = requireAuth($db);
    
    $allowedRoles = is_array($roles) ? $roles : [$roles];
    
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Insufficient permissions. Required role: ' . implode(' or ', $allowedRoles)]);
        exit;
    }
    
    return $user;
}

/**
 * Optional authentication - returns user if valid token provided, null otherwise
 * Does NOT send error responses
 * @return array|null User data or null
 */
function optionalAuth(PDO $db): ?array {
    $token = extractBearerToken();
    
    if (!$token) {
        return null;
    }
    
    return validateSession($db, $token);
}
