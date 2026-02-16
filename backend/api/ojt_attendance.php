<?php
/**
 * OJT Attendance API
 * Handles clock in/out, breaks, overtime with photo, location, and face verification
 */

// Send CORS headers immediately
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Email, Accept, Origin");
header("Access-Control-Max-Age: 86400");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// Set timezone to Philippines
date_default_timezone_set('Asia/Manila');

// OJT Schedule Configuration
define('OJT_START_TIME', 9);      // 9:00 AM
define('OJT_END_TIME', 18);       // 6:00 PM  
define('OJT_EARLY_CLOCK_IN', 30); // Can clock in 30 minutes before start
define('OJT_LUNCH_START', 12);    // 12:00 PM
define('OJT_LUNCH_END', 13);      // 1:00 PM
define('OJT_LUNCH_DURATION', 1);  // 1 hour lunch (auto-deducted)
define('OJT_DAILY_HOURS', 8);     // Target hours per day

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';

if (empty($path) && isset($_SERVER['REQUEST_URI'])) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('#/ojt_attendance\.php(/.*)?$#', $uri, $matches)) {
        $path = isset($matches[1]) ? $matches[1] : '';
    }
}

$path = trim($path, '/');

try {
    $conn = Database::getInstance()->getConnection();
    
    switch ($method) {
        case 'GET':
            handleGet($conn, $path);
            break;
        case 'POST':
            handlePost($conn, $path);
            break;
        case 'PUT':
            handlePut($conn, $path);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function handleGet($conn, $path) {
    switch ($path) {
        case 'today':
            getTodayAttendance($conn);
            break;
        case 'status':
            getClockStatus($conn);
            break;
        case 'history':
            getAttendanceHistory($conn);
            break;
        case 'pending-overtime':
            getPendingOvertime($conn);
            break;
        case 'pending-late-requests':
            getPendingLateRequests($conn);
            break;
        case 'check-late-permission':
            checkLatePermission($conn);
            break;
        default:
            getAttendance($conn);
    }
}

function handlePost($conn, $path) {
    switch ($path) {
        case 'clock-in':
            clockIn($conn);
            break;
        case 'clock-out':
            clockOut($conn);
            break;
        case 'break-start':
            breakStart($conn);
            break;
        case 'break-end':
            breakEnd($conn);
            break;
        case 'request-late-permission':
            requestLatePermission($conn);
            break;
        case 'grant-late-permission':
            grantLatePermission($conn);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid endpoint']);
    }
}

function handlePut($conn, $path) {
    switch ($path) {
        case 'approve-overtime':
            approveOvertime($conn);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid endpoint']);
    }
}

function getClockStatus($conn) {
    $traineeId = isset($_GET['trainee_id']) ? intval($_GET['trainee_id']) : 0;
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Trainee ID required']);
        return;
    }
    
    $today = date('Y-m-d');
    
    $stmt = $conn->prepare("
        SELECT * FROM ojt_attendance 
        WHERE trainee_id = ? AND attendance_date = ?
        LIMIT 1
    ");
    $stmt->execute([$traineeId, $today]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $status = [
        'has_record' => !!$record,
        'clocked_in' => $record && $record['time_in'] && !$record['time_out'],
        'clocked_out' => $record && $record['time_out'],
        'on_break' => $record && $record['break_start'] && !$record['break_end'],
        'record' => $record
    ];
    
    echo json_encode(['success' => true, 'data' => $status]);
}

function getTodayAttendance($conn) {
    $traineeId = isset($_GET['trainee_id']) ? intval($_GET['trainee_id']) : 0;
    $supervisorId = isset($_GET['supervisor_id']) ? intval($_GET['supervisor_id']) : 0;
    $today = date('Y-m-d');
    
    if ($supervisorId) {
        // Get all trainees' attendance for supervisor
        $stmt = $conn->prepare("
            SELECT a.*, u.first_name, u.last_name, u.email
            FROM ojt_attendance a
            JOIN users u ON a.trainee_id = u.id
            WHERE a.supervisor_id = ? AND a.attendance_date = ?
            ORDER BY a.time_in DESC
        ");
        $stmt->execute([$supervisorId, $today]);
    } else if ($traineeId) {
        $stmt = $conn->prepare("
            SELECT * FROM ojt_attendance 
            WHERE trainee_id = ? AND attendance_date = ?
        ");
        $stmt->execute([$traineeId, $today]);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Trainee ID or Supervisor ID required']);
        return;
    }
    
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $records]);
}

function getAttendanceHistory($conn) {
    $traineeId = isset($_GET['trainee_id']) ? intval($_GET['trainee_id']) : 0;
    $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01');
    $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-t');
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Trainee ID required']);
        return;
    }
    
    $stmt = $conn->prepare("
        SELECT * FROM ojt_attendance 
        WHERE trainee_id = ? AND attendance_date BETWEEN ? AND ?
        ORDER BY attendance_date DESC
    ");
    $stmt->execute([$traineeId, $startDate, $endDate]);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $records]);
}

function getAttendance($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $traineeId = isset($_GET['trainee_id']) ? intval($_GET['trainee_id']) : 0;
    
    if ($id) {
        $stmt = $conn->prepare("SELECT * FROM ojt_attendance WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'data' => $stmt->fetch(PDO::FETCH_ASSOC)]);
        return;
    }
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID or Trainee ID required']);
        return;
    }
    
    $stmt = $conn->prepare("
        SELECT * FROM ojt_attendance 
        WHERE trainee_id = ?
        ORDER BY attendance_date DESC
        LIMIT 30
    ");
    $stmt->execute([$traineeId]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function getPendingOvertime($conn) {
    $supervisorId = isset($_GET['supervisor_id']) ? intval($_GET['supervisor_id']) : 0;
    
    if (!$supervisorId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Supervisor ID required']);
        return;
    }
    
    // Get attendance records with overtime for trainees assigned to this supervisor
    $stmt = $conn->prepare("
        SELECT 
            a.*,
            u.first_name,
            u.last_name,
            u.email as trainee_email,
            CONCAT(u.first_name, ' ', u.last_name) as trainee_name
        FROM ojt_attendance a
        JOIN users u ON a.trainee_id = u.id
        JOIN ojt_assignments oa ON a.trainee_id = oa.trainee_id AND oa.supervisor_id = ?
        WHERE a.overtime_hours > 0
        ORDER BY a.overtime_approved ASC, a.attendance_date DESC
    ");
    $stmt->execute([$supervisorId]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function clockIn($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $traineeId = intval($data['trainee_id'] ?? 0);
    $supervisorId = intval($data['supervisor_id'] ?? 0);
    $latitude = $data['latitude'] ?? null;
    $longitude = $data['longitude'] ?? null;
    $location = $data['location'] ?? null;
    $photoBase64 = $data['photo'] ?? null;
    $faceVerified = $data['face_verified'] ?? false;
    $lateMinutes = intval($data['late_minutes'] ?? 0);
    $penaltyHours = floatval($data['penalty_hours'] ?? 0);
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Trainee ID required']);
        return;
    }
    
    // Validate clock-in window: 8:30 AM to 6:00 PM
    $currentHour = (int)date('G');
    $currentMinute = (int)date('i');
    $currentTimeMinutes = ($currentHour * 60) + $currentMinute;
    
    $earliestClockIn = (OJT_START_TIME * 60) - OJT_EARLY_CLOCK_IN; // 8:30 AM = 510 minutes
    $latestClockIn = OJT_END_TIME * 60; // 6:00 PM = 1080 minutes
    
    if ($currentTimeMinutes < $earliestClockIn) {
        $earlyTime = sprintf('%d:%02d AM', floor($earliestClockIn / 60), $earliestClockIn % 60);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "Clock-in not available yet. You can clock in starting at $earlyTime."]);
        return;
    }
    
    if ($currentTimeMinutes >= $latestClockIn) {
        // Check if trainee has permission to clock in late
        $today = date('Y-m-d');
        $stmt = $conn->prepare("
            SELECT id FROM ojt_late_permissions 
            WHERE trainee_id = ? AND permission_date = ? AND used_at IS NULL
        ");
        $stmt->execute([$traineeId, $today]);
        $hasPermission = $stmt->fetch();
        
        if (!$hasPermission) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'error' => 'Clock-in window has closed for today (after 6:00 PM). Request permission from your supervisor to clock in.',
                'requires_permission' => true
            ]);
            return;
        }
        
        // Mark permission as used
        $conn->prepare("UPDATE ojt_late_permissions SET used_at = NOW() WHERE id = ?")->execute([$hasPermission['id']]);
    }
    
    // Get supervisor if not provided
    if (!$supervisorId) {
        $stmt = $conn->prepare("SELECT supervisor_id FROM ojt_assignments WHERE trainee_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1");
        $stmt->execute([$traineeId]);
        $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
        $supervisorId = $assignment['supervisor_id'] ?? null;
    }
    
    // If still no supervisor, try to get from user's supervisor_id field
    if (!$supervisorId) {
        $stmt = $conn->prepare("SELECT supervisor_id FROM users WHERE id = ?");
        $stmt->execute([$traineeId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $supervisorId = $user['supervisor_id'] ?? null;
    }
    
    // Convert 0 to null for foreign key constraint
    if ($supervisorId === 0 || $supervisorId === '0') {
        $supervisorId = null;
    }
    
    $today = date('Y-m-d');
    
    // Check if already clocked in today
    $stmt = $conn->prepare("SELECT id FROM ojt_attendance WHERE trainee_id = ? AND attendance_date = ?");
    $stmt->execute([$traineeId, $today]);
    
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Already clocked in today']);
        return;
    }
    
    // Save photo if provided
    $photoPath = null;
    if ($photoBase64) {
        $photoPath = saveAttendancePhoto($photoBase64, $traineeId, 'in');
    }
    
    // Determine if late (after 8:00 AM - using penalty passed from frontend)
    $status = $lateMinutes > 0 ? 'late' : 'present';
    
    $stmt = $conn->prepare("
        INSERT INTO ojt_attendance (
            trainee_id, supervisor_id, attendance_date, time_in, status,
            photo_in, latitude_in, longitude_in, location_in, face_verified,
            late_minutes, penalty_hours
        ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $traineeId, $supervisorId, $today, $status,
        $photoPath, $latitude, $longitude, $location, $faceVerified ? 1 : 0,
        $lateMinutes, $penaltyHours
    ]);
    
    $attendanceId = $conn->lastInsertId();
    
    // Create notification
    createAttendanceNotification($conn, $traineeId, 'Clocked In', 
        'You clocked in at ' . date('h:i A') . ($status === 'late' ? ' (Late)' : ''));
    
    echo json_encode([
        'success' => true,
        'message' => 'Clock in successful',
        'data' => [
            'id' => $attendanceId,
            'time_in' => date('Y-m-d H:i:s'),
            'status' => $status
        ]
    ]);
}

function clockOut($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $traineeId = intval($data['trainee_id'] ?? 0);
    $latitude = $data['latitude'] ?? null;
    $longitude = $data['longitude'] ?? null;
    $location = $data['location'] ?? null;
    $photoBase64 = $data['photo'] ?? null;
    $faceVerified = $data['face_verified'] ?? false;
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Trainee ID required']);
        return;
    }
    
    $today = date('Y-m-d');
    
    // Get today's record
    $stmt = $conn->prepare("
        SELECT id, time_in, break_start, break_end 
        FROM ojt_attendance 
        WHERE trainee_id = ? AND attendance_date = ? AND time_out IS NULL
    ");
    $stmt->execute([$traineeId, $today]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$record) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Not clocked in or already clocked out']);
        return;
    }
    
    // Check if on break
    if ($record['break_start'] && !$record['break_end']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Please end your break first']);
        return;
    }
    
    // Save photo if provided
    $photoPath = null;
    if ($photoBase64) {
        $photoPath = saveAttendancePhoto($photoBase64, $traineeId, 'out');
    }
    
    // Calculate hours
    $clockIn = new DateTime($record['time_in']);
    $clockOut = new DateTime();
    $totalMinutes = ($clockOut->getTimestamp() - $clockIn->getTimestamp()) / 60;
    
    // Calculate tracked break hours (if user used break button)
    $trackedBreakMinutes = 0;
    if ($record['break_start'] && $record['break_end']) {
        $breakStart = new DateTime($record['break_start']);
        $breakEnd = new DateTime($record['break_end']);
        $trackedBreakMinutes = ($breakEnd->getTimestamp() - $breakStart->getTimestamp()) / 60;
    }
    
    // Auto-deduct 1 hour lunch (12-1 PM) if shift spans lunch period
    $clockInHour = (int)$clockIn->format('H');
    $clockOutHour = (int)$clockOut->format('H');
    $autoLunchDeduct = 0;
    
    // If clocked in before/during lunch AND clocked out after lunch, deduct 1 hour
    if ($clockInHour < OJT_LUNCH_END && $clockOutHour >= OJT_LUNCH_END) {
        $autoLunchDeduct = OJT_LUNCH_DURATION * 60; // 60 minutes
    }
    
    // Total break = tracked breaks + auto lunch deduction (avoid double-counting)
    // If user tracked a break during 12-1pm range, don't auto-deduct
    $breakHourWasTracked = false;
    if ($record['break_start']) {
        $trackedBreakStart = new DateTime($record['break_start']);
        $trackedHour = (int)$trackedBreakStart->format('H');
        if ($trackedHour >= OJT_LUNCH_START && $trackedHour < OJT_LUNCH_END) {
            $breakHourWasTracked = true;
        }
    }
    
    $breakMinutes = $breakHourWasTracked ? $trackedBreakMinutes : ($trackedBreakMinutes + $autoLunchDeduct);
    
    $workMinutes = $totalMinutes - $breakMinutes;
    $workHours = round($workMinutes / 60, 2);
    $breakHours = round($breakMinutes / 60, 2);
    $totalHours = round($totalMinutes / 60, 2);
    
    // Calculate overtime (after 8 hours of work)
    $overtimeHours = max(0, $workHours - OJT_DAILY_HOURS);
    
    $stmt = $conn->prepare("
        UPDATE ojt_attendance SET
            time_out = NOW(),
            photo_out = ?,
            latitude_out = ?,
            longitude_out = ?,
            location_out = ?,
            face_verified_out = ?,
            total_hours = ?,
            work_hours = ?,
            break_hours = ?,
            overtime_hours = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $photoPath, $latitude, $longitude, $location,
        $faceVerified ? 1 : 0, $totalHours, $workHours, $breakHours, $overtimeHours, $record['id']
    ]);
    
    // Create notification
    $message = sprintf('You clocked out at %s. Total work: %.1f hrs', date('h:i A'), $workHours);
    if ($overtimeHours > 0) {
        $message .= sprintf('. Overtime: %.1f hrs (pending approval)', $overtimeHours);
    }
    createAttendanceNotification($conn, $traineeId, 'Clocked Out', $message);
    
    echo json_encode([
        'success' => true,
        'message' => 'Clock out successful',
        'data' => [
            'time_out' => date('Y-m-d H:i:s'),
            'work_hours' => $workHours,
            'break_hours' => $breakHours,
            'overtime_hours' => $overtimeHours
        ]
    ]);
}

function breakStart($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $traineeId = intval($data['trainee_id'] ?? 0);
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Trainee ID required']);
        return;
    }
    
    $today = date('Y-m-d');
    
    $stmt = $conn->prepare("
        SELECT id, break_start, break_end FROM ojt_attendance 
        WHERE trainee_id = ? AND attendance_date = ? AND time_out IS NULL
    ");
    $stmt->execute([$traineeId, $today]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$record) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Not clocked in']);
        return;
    }
    
    // If currently on break (break_start set but no break_end), don't allow another
    if ($record['break_start'] && !$record['break_end']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Already on break']);
        return;
    }
    
    // If previous break was completed, reset it to start a new break
    if ($record['break_start'] && $record['break_end']) {
        $stmt = $conn->prepare("UPDATE ojt_attendance SET break_start = NOW(), break_end = NULL WHERE id = ?");
        $stmt->execute([$record['id']]);
        
        createAttendanceNotification($conn, $traineeId, 'Break Started', 'New break started at ' . date('h:i A'));
        
        echo json_encode([
            'success' => true,
            'message' => 'New break started (previous break reset)',
            'data' => ['break_start' => date('Y-m-d H:i:s')]
        ]);
        return;
    }
    
    $stmt = $conn->prepare("UPDATE ojt_attendance SET break_start = NOW() WHERE id = ?");
    $stmt->execute([$record['id']]);
    
    createAttendanceNotification($conn, $traineeId, 'Break Started', 'Break started at ' . date('h:i A'));
    
    echo json_encode([
        'success' => true,
        'message' => 'Break started',
        'data' => ['break_start' => date('Y-m-d H:i:s')]
    ]);
}

function breakEnd($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $traineeId = intval($data['trainee_id'] ?? 0);
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Trainee ID required']);
        return;
    }
    
    $today = date('Y-m-d');
    
    $stmt = $conn->prepare("
        SELECT id, break_start, break_end FROM ojt_attendance 
        WHERE trainee_id = ? AND attendance_date = ? AND time_out IS NULL
    ");
    $stmt->execute([$traineeId, $today]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$record || !$record['break_start']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Not on break']);
        return;
    }
    
    if ($record['break_end']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Break already ended']);
        return;
    }
    
    $stmt = $conn->prepare("UPDATE ojt_attendance SET break_end = NOW() WHERE id = ?");
    $stmt->execute([$record['id']]);
    
    // Calculate break duration
    $breakStart = new DateTime($record['break_start']);
    $breakEnd = new DateTime();
    $breakMinutes = round(($breakEnd->getTimestamp() - $breakStart->getTimestamp()) / 60);
    
    createAttendanceNotification($conn, $traineeId, 'Break Ended', 
        sprintf('Break ended at %s. Duration: %d minutes', date('h:i A'), $breakMinutes));
    
    echo json_encode([
        'success' => true,
        'message' => 'Break ended',
        'data' => [
            'break_end' => date('Y-m-d H:i:s'),
            'break_minutes' => $breakMinutes
        ]
    ]);
}

function approveOvertime($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $attendanceId = intval($data['attendance_id'] ?? 0);
    $approvedBy = intval($data['approved_by'] ?? 0);
    $approved = $data['approved'] ?? true;
    
    if (!$attendanceId || !$approvedBy) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Attendance ID and approver ID required']);
        return;
    }
    
    if ($approved) {
        $stmt = $conn->prepare("
            UPDATE ojt_attendance SET
                overtime_approved = 1,
                approved_by = ?,
                approved_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$approvedBy, $attendanceId]);
    } else {
        $stmt = $conn->prepare("
            UPDATE ojt_attendance SET overtime_hours = 0 WHERE id = ?
        ");
        $stmt->execute([$attendanceId]);
    }
    
    // Get trainee to notify
    $stmt = $conn->prepare("SELECT trainee_id, overtime_hours FROM ojt_attendance WHERE id = ?");
    $stmt->execute([$attendanceId]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($record) {
        $message = $approved 
            ? sprintf('Your overtime of %.1f hours has been approved', $record['overtime_hours'])
            : 'Your overtime request was not approved';
        createAttendanceNotification($conn, $record['trainee_id'], 
            $approved ? 'Overtime Approved' : 'Overtime Rejected', $message);
    }
    
    echo json_encode([
        'success' => true,
        'message' => $approved ? 'Overtime approved' : 'Overtime rejected'
    ]);
}

function saveAttendancePhoto($base64Data, $traineeId, $type) {
    $uploadDir = __DIR__ . '/../uploads/attendance/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Decode base64
    $data = explode(',', $base64Data);
    $imageData = isset($data[1]) ? base64_decode($data[1]) : base64_decode($data[0]);
    
    $filename = sprintf('%d_%s_%s.jpg', $traineeId, $type, date('Ymd_His'));
    $filepath = $uploadDir . $filename;
    
    file_put_contents($filepath, $imageData);
    
    return 'uploads/attendance/' . $filename;
}

function createAttendanceNotification($conn, $userId, $title, $message) {
    $stmt = $conn->prepare("
        INSERT INTO ojt_notifications (user_id, type, title, message, link)
        VALUES (?, 'attendance', ?, ?, '/ojt/timesheet')
    ");
    $stmt->execute([$userId, $title, $message]);
}

// Late Permission Functions

function checkLatePermission($conn) {
    $traineeId = isset($_GET['trainee_id']) ? intval($_GET['trainee_id']) : 0;
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Trainee ID required']);
        return;
    }
    
    $stmt = $conn->prepare("
        SELECT lp.*, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) as granted_by_name
        FROM ojt_late_permissions lp
        JOIN users u ON lp.granted_by = u.id
        WHERE lp.trainee_id = ? AND lp.permission_date = ?
    ");
    $stmt->execute([$traineeId, $date]);
    $permission = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'has_permission' => $permission ? true : false,
        'data' => $permission
    ]);
}

function getPendingLateRequests($conn) {
    $supervisorId = isset($_GET['supervisor_id']) ? intval($_GET['supervisor_id']) : 0;
    
    if (!$supervisorId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Supervisor ID required']);
        return;
    }
    
    // Get late permission requests for trainees assigned to this supervisor
    $stmt = $conn->prepare("
        SELECT 
            lp.*,
            u.first_name,
            u.last_name,
            u.email,
            CONCAT(u.first_name, ' ', u.last_name) as trainee_name,
            gb.first_name as granted_by_first,
            gb.last_name as granted_by_last
        FROM ojt_late_permissions lp
        JOIN users u ON lp.trainee_id = u.id
        LEFT JOIN users gb ON lp.granted_by = gb.id
        JOIN ojt_assignments oa ON lp.trainee_id = oa.trainee_id AND oa.supervisor_id = ?
        WHERE lp.permission_date >= CURDATE()
        ORDER BY lp.permission_date DESC, lp.created_at DESC
    ");
    $stmt->execute([$supervisorId]);
    
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function requestLatePermission($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $traineeId = intval($data['trainee_id'] ?? 0);
    $reason = $data['reason'] ?? '';
    $date = $data['date'] ?? date('Y-m-d');
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Trainee ID required']);
        return;
    }
    
    // Check if permission already exists for this date
    $stmt = $conn->prepare("SELECT id FROM ojt_late_permissions WHERE trainee_id = ? AND permission_date = ?");
    $stmt->execute([$traineeId, $date]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Permission request already exists for this date']);
        return;
    }
    
    // Get supervisor
    $stmt = $conn->prepare("
        SELECT supervisor_id FROM ojt_assignments 
        WHERE trainee_id = ? AND status = 'active' 
        ORDER BY id DESC LIMIT 1
    ");
    $stmt->execute([$traineeId]);
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
    $supervisorId = $assignment['supervisor_id'] ?? null;
    
    if (!$supervisorId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No supervisor found for this trainee']);
        return;
    }
    
    // Create permission request (granted_by is set to supervisor, but used_at is null until granted)
    $stmt = $conn->prepare("
        INSERT INTO ojt_late_permissions (trainee_id, granted_by, permission_date, reason)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$traineeId, $supervisorId, $date, $reason]);
    
    // Get trainee name for notification
    $stmt = $conn->prepare("SELECT first_name, last_name FROM users WHERE id = ?");
    $stmt->execute([$traineeId]);
    $trainee = $stmt->fetch(PDO::FETCH_ASSOC);
    $traineeName = $trainee['first_name'] . ' ' . $trainee['last_name'];
    
    // Notify supervisor
    createAttendanceNotification($conn, $supervisorId, 'Late Clock-in Request',
        "$traineeName is requesting permission to clock in late. Reason: $reason");
    
    echo json_encode([
        'success' => true,
        'message' => 'Permission request sent to your supervisor'
    ]);
}

function grantLatePermission($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $traineeId = intval($data['trainee_id'] ?? 0);
    $grantedBy = intval($data['granted_by'] ?? 0);
    $date = $data['date'] ?? date('Y-m-d');
    $approved = $data['approved'] ?? true;
    
    if (!$traineeId || !$grantedBy) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Trainee ID and Granted By ID required']);
        return;
    }
    
    // Verify granter is admin or supervisor
    $stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$grantedBy]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !in_array($user['role'], ['admin', 'supervisor', 'ojt_supervisor'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Only supervisors or admins can grant late clock-in permission']);
        return;
    }
    
    if ($approved) {
        // Insert or update permission
        $stmt = $conn->prepare("
            INSERT INTO ojt_late_permissions (trainee_id, granted_by, permission_date, reason)
            VALUES (?, ?, ?, 'Approved by supervisor')
            ON DUPLICATE KEY UPDATE granted_by = ?, reason = 'Approved by supervisor'
        ");
        $stmt->execute([$traineeId, $grantedBy, $date, $grantedBy]);
        
        // Notify trainee
        createAttendanceNotification($conn, $traineeId, 'Late Clock-in Approved',
            "Your request to clock in late has been approved. You can now clock in.");
        
        echo json_encode([
            'success' => true,
            'message' => 'Late clock-in permission granted'
        ]);
    } else {
        // Delete permission request
        $stmt = $conn->prepare("DELETE FROM ojt_late_permissions WHERE trainee_id = ? AND permission_date = ?");
        $stmt->execute([$traineeId, $date]);
        
        // Notify trainee
        createAttendanceNotification($conn, $traineeId, 'Late Clock-in Denied',
            "Your request to clock in late has been denied. You will be marked as absent.");
        
        echo json_encode([
            'success' => true,
            'message' => 'Late clock-in permission denied'
        ]);
    }
}
?>
