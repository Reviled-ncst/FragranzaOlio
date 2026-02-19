<?php
/**
 * HR API
 * Handles HR-specific operations: dashboard stats, interns list, supervisor linking
 */

// CORS & security headers handled by middleware
require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../config/database.php';

// Get the request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';

// Fallback to REQUEST_URI if PATH_INFO is empty
if (empty($path) && isset($_SERVER['REQUEST_URI'])) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('#/hr\.php(/.*)?$#', $uri, $matches)) {
        $path = isset($matches[1]) ? $matches[1] : '';
    }
}

$path = trim($path, '/');
$pathParts = $path ? explode('/', $path) : [];

try {
    $conn = Database::getInstance()->getConnection();

    $resource = $pathParts[0] ?? '';
    $id = $pathParts[1] ?? null;

    switch ($resource) {
        case 'dashboard':
            handleDashboard($conn);
            break;
        case 'interns':
            handleInterns($conn, $method, $id);
            break;
        case 'supervisors':
            getSupervisors($conn);
            break;
        default:
            handleDashboard($conn);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('HR API error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'An internal error occurred']);
}

/**
 * Dashboard stats for HR
 */
function handleDashboard($conn) {
    // Total employees (non-ojt, non-admin roles or all staff)
    $stmtEmployees = $conn->prepare("SELECT COUNT(*) as count FROM users WHERE role NOT IN ('ojt', 'admin') AND status = 'active'");
    $stmtEmployees->execute();
    $totalEmployees = (int)$stmtEmployees->fetch(PDO::FETCH_ASSOC)['count'];

    // Total interns
    $stmtInterns = $conn->prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ojt'");
    $stmtInterns->execute();
    $totalInterns = (int)$stmtInterns->fetch(PDO::FETCH_ASSOC)['count'];

    // Active today (clocked in today)
    $today = date('Y-m-d');
    $stmtActive = $conn->prepare("SELECT COUNT(DISTINCT trainee_id) as count FROM ojt_attendance WHERE attendance_date = ?");
    $stmtActive->execute([$today]);
    $activeToday = (int)$stmtActive->fetch(PDO::FETCH_ASSOC)['count'];

    // Total hours this month
    $monthStart = date('Y-m-01');
    $monthEnd = date('Y-m-t');
    $stmtHours = $conn->prepare("SELECT COALESCE(SUM(total_hours), 0) as total FROM ojt_attendance WHERE attendance_date BETWEEN ? AND ?");
    $stmtHours->execute([$monthStart, $monthEnd]);
    $totalHoursThisMonth = round((float)$stmtHours->fetch(PDO::FETCH_ASSOC)['total'], 2);

    // Pending approvals (pending overtime + pending late requests)
    $stmtPending = $conn->prepare("SELECT COUNT(*) as count FROM ojt_attendance WHERE (overtime_approved = 0 AND overtime_hours > 0)");
    $stmtPending->execute();
    $pendingApprovals = (int)$stmtPending->fetch(PDO::FETCH_ASSOC)['count'];

    // Total supervisors
    $stmtSupervisors = $conn->prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ojt_supervisor' AND status = 'active'");
    $stmtSupervisors->execute();
    $totalSupervisors = (int)$stmtSupervisors->fetch(PDO::FETCH_ASSOC)['count'];

    // Recent activity (last 10 attendance records)
    $stmtRecent = $conn->prepare("
        SELECT 
            a.id,
            CONCAT(u.first_name, ' ', u.last_name) as user_name,
            a.time_in,
            a.time_out,
            a.attendance_date,
            a.status
        FROM ojt_attendance a
        JOIN users u ON a.trainee_id = u.id
        ORDER BY a.attendance_date DESC, a.time_in DESC
        LIMIT 10
    ");
    $stmtRecent->execute();
    $recentRecords = $stmtRecent->fetchAll(PDO::FETCH_ASSOC);

    $recentActivity = [];
    foreach ($recentRecords as $record) {
        $type = $record['time_out'] ? 'clock_out' : 'clock_in';
        $time = $record['time_out'] ?? $record['time_in'];
        $timeFormatted = $time ? date('g:i A', strtotime($time)) : 'N/A';
        $message = $type === 'clock_in' ? 'Clocked in' : 'Clocked out';

        $recentActivity[] = [
            'id' => (int)$record['id'],
            'type' => $type,
            'user' => $record['user_name'],
            'message' => $message,
            'time' => $timeFormatted,
            'date' => $record['attendance_date']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'totalInterns' => $totalInterns,
                'activeToday' => $activeToday,
                'pendingPayouts' => 0,
                'totalHoursThisMonth' => $totalHoursThisMonth,
                'pendingApprovals' => $pendingApprovals,
                'totalSupervisors' => $totalSupervisors
            ],
            'recentActivity' => $recentActivity
        ]
    ]);
}

/**
 * Handle interns CRUD
 */
function handleInterns($conn, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                getInternDetail($conn, $id);
            } else {
                getInterns($conn);
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}

/**
 * Get all interns with supervisor assignments
 */
function getInterns($conn) {
    $status = $_GET['status'] ?? null;

    $query = "
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            u.university,
            u.course,
            u.status as user_status,
            u.created_at,
            oa.supervisor_id,
            oa.start_date,
            oa.end_date,
            oa.total_required_hours as required_hours,
            oa.status as assignment_status,
            COALESCE(CONCAT(s.first_name, ' ', s.last_name), 'Unassigned') as supervisor_name,
            COALESCE(
                (SELECT SUM(att.total_hours) FROM ojt_attendance att WHERE att.trainee_id = u.id),
                0
            ) as completed_hours
        FROM users u
        LEFT JOIN ojt_assignments oa ON u.id = oa.trainee_id AND oa.status = 'active'
        LEFT JOIN users s ON oa.supervisor_id = s.id
        WHERE u.role = 'ojt'
    ";

    $params = [];

    if ($status && $status !== 'all') {
        $query .= " AND oa.status = ?";
        $params[] = $status;
    }

    $query .= " ORDER BY u.last_name ASC, u.first_name ASC";

    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $interns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format for frontend
    $formatted = array_map(function($intern) {
        return [
            'id' => (int)$intern['id'],
            'firstName' => $intern['first_name'],
            'lastName' => $intern['last_name'],
            'email' => $intern['email'],
            'phone' => $intern['phone'],
            'university' => $intern['university'] ?? 'N/A',
            'course' => $intern['course'] ?? 'N/A',
            'supervisorName' => $intern['supervisor_name'],
            'startDate' => $intern['start_date'] ?? $intern['created_at'],
            'endDate' => $intern['end_date'],
            'requiredHours' => (int)($intern['required_hours'] ?? 500),
            'completedHours' => round((float)$intern['completed_hours'], 2),
            'status' => $intern['assignment_status'] ?? ($intern['user_status'] === 'active' ? 'active' : 'withdrawn')
        ];
    }, $interns);

    echo json_encode([
        'success' => true,
        'data' => $formatted
    ]);
}

/**
 * Get single intern detail
 */
function getInternDetail($conn, $internId) {
    $stmt = $conn->prepare("
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            u.university,
            u.course,
            u.status as user_status,
            u.created_at,
            oa.supervisor_id,
            oa.start_date,
            oa.end_date,
            oa.total_required_hours as required_hours,
            oa.status as assignment_status,
            COALESCE(CONCAT(s.first_name, ' ', s.last_name), 'Unassigned') as supervisor_name,
            s.email as supervisor_email,
            COALESCE(
                (SELECT SUM(att.total_hours) FROM ojt_attendance att WHERE att.trainee_id = u.id),
                0
            ) as completed_hours,
            (SELECT COUNT(*) FROM ojt_tasks t WHERE t.trainee_id = u.id AND t.status = 'completed') as tasks_completed,
            (SELECT COUNT(*) FROM ojt_tasks t WHERE t.trainee_id = u.id) as total_tasks
        FROM users u
        LEFT JOIN ojt_assignments oa ON u.id = oa.trainee_id AND oa.status = 'active'
        LEFT JOIN users s ON oa.supervisor_id = s.id
        WHERE u.id = ? AND u.role = 'ojt'
    ");
    $stmt->execute([(int)$internId]);
    $intern = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$intern) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Intern not found']);
        return;
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'id' => (int)$intern['id'],
            'firstName' => $intern['first_name'],
            'lastName' => $intern['last_name'],
            'email' => $intern['email'],
            'phone' => $intern['phone'],
            'university' => $intern['university'] ?? 'N/A',
            'course' => $intern['course'] ?? 'N/A',
            'supervisorName' => $intern['supervisor_name'],
            'supervisorEmail' => $intern['supervisor_email'],
            'startDate' => $intern['start_date'] ?? $intern['created_at'],
            'endDate' => $intern['end_date'],
            'requiredHours' => (int)($intern['required_hours'] ?? 500),
            'completedHours' => round((float)$intern['completed_hours'], 2),
            'tasksCompleted' => (int)$intern['tasks_completed'],
            'totalTasks' => (int)$intern['total_tasks'],
            'status' => $intern['assignment_status'] ?? ($intern['user_status'] === 'active' ? 'active' : 'withdrawn')
        ]
    ]);
}

/**
 * Get all supervisors
 */
function getSupervisors($conn) {
    $stmt = $conn->prepare("
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.status,
            (SELECT COUNT(*) FROM ojt_assignments oa WHERE oa.supervisor_id = u.id AND oa.status = 'active') as active_trainees
        FROM users u
        WHERE u.role = 'ojt_supervisor' AND u.status = 'active'
        ORDER BY u.last_name ASC, u.first_name ASC
    ");
    $stmt->execute();
    $supervisors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $supervisors
    ]);
}
