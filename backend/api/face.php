<?php
require_once '../middleware/cors.php';
require_once '../middleware/sanitize.php';
require_once '../config/database.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

$action = $input['action'] ?? '';

$db = Database::getInstance()->getConnection();

// ─── Helper: compute Euclidean distance between two 128-dim descriptors ───
function euclidean(array $a, array $b): float {
    $sum = 0.0;
    for ($i = 0; $i < 128; $i++) {
        $diff = ($a[$i] ?? 0) - ($b[$i] ?? 0);
        $sum += $diff * $diff;
    }
    return sqrt($sum);
}

// ─── Helper: get and validate authenticated user from Bearer token ───────
function getAuthUser(PDO $db): ?array {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/i', $auth, $m)) return null;
    $token = $m[1];

    $stmt = $db->prepare(
        "SELECT u.id, u.email, u.first_name, u.last_name, u.role
         FROM users u
         INNER JOIN sessions s ON s.user_id = u.id
         WHERE s.token = ? AND s.expires_at > NOW() AND u.is_active = 1
         LIMIT 1"
    );
    $stmt->execute([$token]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

// ─── ACTION: enroll ───────────────────────────────────────────────────────
if ($action === 'enroll') {
    $user = getAuthUser($db);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required to enroll face']);
        exit;
    }

    $descriptor = $input['descriptor'] ?? null;
    if (!is_array($descriptor) || count($descriptor) !== 128) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid face descriptor (must be 128-dim float array)']);
        exit;
    }

    // Ensure table exists
    $db->exec("CREATE TABLE IF NOT EXISTS face_descriptors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        descriptor TEXT NOT NULL COMMENT 'JSON-encoded 128-dim float array',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $jsonDescriptor = json_encode($descriptor);
    $stmt = $db->prepare("INSERT INTO face_descriptors (user_id, descriptor) VALUES (?, ?)
                          ON DUPLICATE KEY UPDATE descriptor = VALUES(descriptor), updated_at = NOW()");
    $stmt->execute([$user['id'], $jsonDescriptor]);

    echo json_encode(['success' => true, 'message' => 'Face ID enrolled successfully']);
    exit;
}

// ─── ACTION: face-login ──────────────────────────────────────────────────
if ($action === 'face-login') {
    $descriptor = $input['descriptor'] ?? null;
    if (!is_array($descriptor) || count($descriptor) !== 128) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid face descriptor']);
        exit;
    }

    // Ensure table exists
    $db->exec("CREATE TABLE IF NOT EXISTS face_descriptors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        descriptor TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Load all enrolled descriptors
    $stmt = $db->query(
        "SELECT fd.user_id, fd.descriptor,
                u.email, u.first_name, u.last_name, u.role, u.profile_photo
         FROM face_descriptors fd
         INNER JOIN users u ON u.id = fd.user_id
         WHERE u.is_active = 1"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($rows)) {
        echo json_encode(['success' => false, 'message' => 'No face IDs have been enrolled yet']);
        exit;
    }

    $THRESHOLD = 0.55; // Euclidean distance threshold (lower = stricter)
    $best = null;
    $bestDist = PHP_FLOAT_MAX;

    foreach ($rows as $row) {
        $stored = json_decode($row['descriptor'], true);
        if (!$stored || count($stored) !== 128) continue;
        $dist = euclidean($descriptor, $stored);
        if ($dist < $bestDist) {
            $bestDist = $dist;
            $best = $row;
        }
    }

    if (!$best || $bestDist > $THRESHOLD) {
        echo json_encode([
            'success' => false,
            'message' => 'Face not recognized. Please use email login or enroll your face first.',
            'debug_dist' => round($bestDist, 4),
        ]);
        exit;
    }

    // Create a session for the matched user
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
    $userId = $best['user_id'];

    // Ensure sessions table exists (it should by now)
    $stmt = $db->prepare("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$userId, $token, $expiresAt]);

    // Log the login
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $db->prepare("INSERT INTO login_attempts (user_id, ip_address, success, method) VALUES (?, ?, 1, 'face_id') ON DUPLICATE KEY UPDATE id=id")->execute([$userId, $ip]);
    } catch (\Exception $e) {
        // login_attempts logging is optional — don't fail on it
    }

    $user = [
        'id' => $userId,
        'email' => $best['email'],
        'first_name' => $best['first_name'],
        'last_name' => $best['last_name'],
        'role' => $best['role'],
        'profile_photo' => $best['profile_photo'],
    ];

    echo json_encode([
        'success' => true,
        'message' => 'Face authentication successful',
        'user' => $user,
        'token' => $token,
    ]);
    exit;
}

// ─── ACTION: verify-clock-in ──────────────────────────────────────────────
// Takes descriptor + trainee_id, verifies against that specific intern's enrolled face.
// Does NOT create a session — only returns match result for clock-in gating.
if ($action === 'verify-clock-in') {
    $descriptor = $input['descriptor'] ?? null;
    $traineeId  = intval($input['trainee_id'] ?? 0);

    if (!is_array($descriptor) || count($descriptor) !== 128) {
        http_response_code(400);
        echo json_encode(['success' => false, 'verified' => false, 'message' => 'Invalid face descriptor']);
        exit;
    }
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'verified' => false, 'message' => 'trainee_id required']);
        exit;
    }

    try {
        $stmt = $db->prepare("SELECT descriptor FROM face_descriptors WHERE user_id = ?");
        $stmt->execute([$traineeId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (\Exception $e) {
        // Table doesn't exist yet
        echo json_encode(['success' => true, 'verified' => false, 'not_enrolled' => true,
            'message' => 'No Face ID enrolled. Please set up Face ID in your profile first.']);
        exit;
    }

    if (!$row) {
        echo json_encode(['success' => true, 'verified' => false, 'not_enrolled' => true,
            'message' => 'No Face ID enrolled. Please set up Face ID in your profile first.']);
        exit;
    }

    $stored = json_decode($row['descriptor'], true);
    if (!$stored || count($stored) !== 128) {
        echo json_encode(['success' => false, 'verified' => false, 'message' => 'Corrupted enrollment data. Please re-enroll.']);
        exit;
    }

    $dist = euclidean($descriptor, $stored);
    $THRESHOLD = 0.55;
    $similarity = max(0, min(100, round((1 - $dist) * 100)));

    if ($dist <= $THRESHOLD) {
        echo json_encode([
            'success'    => true,
            'verified'   => true,
            'similarity' => $similarity,
            'distance'   => round($dist, 4),
            'message'    => "Face verified ({$similarity}% match)",
        ]);
    } else {
        echo json_encode([
            'success'    => true,
            'verified'   => false,
            'similarity' => $similarity,
            'distance'   => round($dist, 4),
            'message'    => "Face does not match ({$similarity}% — below threshold). Please try again.",
        ]);
    }
    exit;
}

// ─── ACTION: delete-enrollment (for OJT users to remove their face ID) ───
if ($action === 'delete-enrollment') {
    $user = getAuthUser($db);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required']);
        exit;
    }

    $stmt = $db->prepare("DELETE FROM face_descriptors WHERE user_id = ?");
    $stmt->execute([$user['id']]);

    echo json_encode(['success' => true, 'message' => 'Face ID enrollment removed']);
    exit;
}

// ─── ACTION: check-enrollment ─────────────────────────────────────────────
if ($action === 'check-enrollment') {
    $user = getAuthUser($db);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required']);
        exit;
    }

    try {
        $stmt = $db->prepare("SELECT id, updated_at FROM face_descriptors WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'enrolled' => (bool)$row, 'updated_at' => $row['updated_at'] ?? null]);
    } catch (\Exception $e) {
        echo json_encode(['success' => true, 'enrolled' => false]);
    }
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Unknown action']);
