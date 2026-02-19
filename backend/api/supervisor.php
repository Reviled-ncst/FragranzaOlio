<?php
/**
 * Supervisor API
 * Handles all supervisor-related operations including trainees, dashboard, etc.
 */

// CORS & security headers handled by middleware\nrequire_once __DIR__ . '/../middleware/cors.php';\nrequire_once __DIR__ . '/../config/database.php';

// Get the request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';

// Fallback to REQUEST_URI if PATH_INFO is empty
if (empty($path) && isset($_SERVER['REQUEST_URI'])) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('#/supervisor\.php(/.*)?$#', $uri, $matches)) {
        $path = isset($matches[1]) ? $matches[1] : '';
    }
}

$path = trim($path, '/');
$pathParts = $path ? explode('/', $path) : [];

try {
    $conn = Database::getInstance()->getConnection();
    
    // Route handling
    $resource = $pathParts[0] ?? '';
    $id = $pathParts[1] ?? null;
    
    switch ($resource) {
        case 'dashboard':
            handleDashboard($conn, $method);
            break;
        case 'trainees':
            handleTrainees($conn, $method, $id);
            break;
        case 'stats':
            handleStats($conn, $method);
            break;
        case 'performance':
            handlePerformance($conn, $method, $id);
            break;
        default:
            // Default: return supervisor info
            handleDashboard($conn, $method);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('Supervisor API error: ' . $e->getMessage());
    echo json_encode(['error' => 'An internal error occurred']);
}

/**
 * Handle Dashboard Data
 */
function handleDashboard($conn, $method) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $supervisorId = $_GET['supervisor_id'] ?? null;
    
    if (!$supervisorId) {
        http_response_code(400);
        echo json_encode(['error' => 'Supervisor ID is required']);
        return;
    }
    
    // Get total trainees
    $stmt = $conn->prepare("
        SELECT COUNT(*) as total 
        FROM ojt_assignments oa
        JOIN users u ON oa.trainee_id = u.id
        WHERE oa.supervisor_id = ? AND oa.status = 'active' AND u.status = 'active'
    ");
    $stmt->execute([$supervisorId]);
    $totalTrainees = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get pending timesheets
    $stmt = $conn->prepare("
        SELECT COUNT(*) as total 
        FROM ojt_timesheets 
        WHERE supervisor_id = ? AND status = 'submitted'
    ");
    $stmt->execute([$supervisorId]);
    $pendingTimesheets = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get pending tasks
    $stmt = $conn->prepare("
        SELECT COUNT(*) as total 
        FROM ojt_tasks 
        WHERE assigned_by = ? AND status = 'under_review'
    ");
    $stmt->execute([$supervisorId]);
    $pendingTasks = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get total hours this week
    $weekStart = date('Y-m-d', strtotime('monday this week'));
    $stmt = $conn->prepare("
        SELECT COALESCE(SUM(total_hours), 0) as total 
        FROM ojt_timesheets 
        WHERE supervisor_id = ? AND week_start >= ? AND status = 'approved'
    ");
    $stmt->execute([$supervisorId, $weekStart]);
    $totalHours = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get recent trainees with progress and task counts
    $stmt = $conn->prepare("
        SELECT 
            u.id,
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            u.email,
            u.university,
            u.course,
            oa.department,
            oa.start_date,
            oa.total_required_hours,
            COALESCE(SUM(ot.total_hours), 0) as completed_hours,
            (SELECT COUNT(*) FROM ojt_tasks WHERE assigned_to = u.id AND status = 'completed') as tasks_completed,
            (SELECT COUNT(*) FROM ojt_tasks WHERE assigned_to = u.id) as total_tasks,
            (SELECT COUNT(*) FROM ojt_tasks WHERE assigned_to = u.id AND status = 'under_review') as tasks_pending_review
        FROM ojt_assignments oa
        JOIN users u ON oa.trainee_id = u.id
        LEFT JOIN ojt_timesheets ot ON ot.trainee_id = u.id AND ot.status = 'approved'
        WHERE oa.supervisor_id = ? AND oa.status = 'active' AND u.status = 'active'
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.university, u.course, oa.department, oa.start_date, oa.total_required_hours
        LIMIT 5
    ");
    $stmt->execute([$supervisorId]);
    $trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate progress percentage and task completion rate
    foreach ($trainees as &$trainee) {
        $trainee['progress'] = $trainee['total_required_hours'] > 0 
            ? round(($trainee['completed_hours'] / $trainee['total_required_hours']) * 100, 1)
            : 0;
        $trainee['task_completion_rate'] = $trainee['total_tasks'] > 0
            ? round(($trainee['tasks_completed'] / $trainee['total_tasks']) * 100, 1)
            : 0;
    }
    
    // Get pending timesheet approvals
    $stmt = $conn->prepare("
        SELECT 
            ot.id,
            ot.trainee_id,
            CONCAT(u.first_name, ' ', u.last_name) AS trainee_name,
            ot.week_start,
            ot.week_end,
            ot.total_hours,
            ot.submitted_at,
            'timesheet' as type
        FROM ojt_timesheets ot
        JOIN users u ON ot.trainee_id = u.id
        WHERE ot.supervisor_id = ? AND ot.status = 'submitted'
        ORDER BY ot.submitted_at DESC
        LIMIT 5
    ");
    $stmt->execute([$supervisorId]);
    $pendingTimesheetApprovals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get pending task approvals (tasks submitted for review)
    $stmt = $conn->prepare("
        SELECT 
            t.id,
            t.assigned_to as trainee_id,
            CONCAT(u.first_name, ' ', u.last_name) AS trainee_name,
            t.title,
            t.description,
            t.priority,
            t.submitted_at,
            t.submission_notes,
            t.submission_files,
            'task' as type
        FROM ojt_tasks t
        JOIN users u ON t.assigned_to = u.id
        WHERE t.assigned_by = ? AND t.status = 'under_review'
        ORDER BY t.submitted_at DESC
        LIMIT 5
    ");
    $stmt->execute([$supervisorId]);
    $pendingTaskApprovals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Combine and sort all pending approvals
    $pendingApprovals = array_merge($pendingTimesheetApprovals, $pendingTaskApprovals);
    usort($pendingApprovals, function($a, $b) {
        return strtotime($b['submitted_at']) - strtotime($a['submitted_at']);
    });
    $pendingApprovals = array_slice($pendingApprovals, 0, 5);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'stats' => [
                'totalTrainees' => (int)$totalTrainees,
                'pendingTimesheets' => (int)$pendingTimesheets,
                'pendingTasks' => (int)$pendingTasks,
                'totalHoursThisWeek' => (float)$totalHours
            ],
            'trainees' => $trainees,
            'pendingApprovals' => $pendingApprovals
        ]
    ]);
}

/**
 * Handle Trainees
 */
function handleTrainees($conn, $method, $id) {
    $supervisorId = $_GET['supervisor_id'] ?? null;
    
    switch ($method) {
        case 'GET':
            if ($id) {
                getTraineeDetail($conn, $supervisorId, $id);
            } else {
                getTrainees($conn, $supervisorId);
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
}

function getTrainees($conn, $supervisorId) {
    if (!$supervisorId) {
        http_response_code(400);
        echo json_encode(['error' => 'Supervisor ID is required']);
        return;
    }
    
    $status = $_GET['status'] ?? 'active';
    $search = $_GET['search'] ?? '';
    $department = $_GET['department'] ?? '';
    
    $query = "
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            u.email,
            u.phone,
            u.university,
            u.course,
            oa.department,
            oa.start_date,
            oa.end_date,
            oa.status as assignment_status,
            oa.total_required_hours,
            COALESCE(SUM(ot.total_hours), 0) as completed_hours,
            (SELECT COUNT(*) FROM ojt_tasks WHERE assigned_to = u.id AND status = 'completed') as tasks_completed,
            (SELECT COUNT(*) FROM ojt_tasks WHERE assigned_to = u.id) as total_tasks,
            (SELECT COUNT(*) FROM ojt_attendance WHERE trainee_id = u.id AND status = 'present') as days_present,
            (SELECT COUNT(*) FROM ojt_attendance WHERE trainee_id = u.id) as total_days
        FROM ojt_assignments oa
        JOIN users u ON oa.trainee_id = u.id
        LEFT JOIN ojt_timesheets ot ON ot.trainee_id = u.id AND ot.status = 'approved'
        WHERE oa.supervisor_id = ? AND u.status = 'active'
    ";
    
    $params = [$supervisorId];
    
    if ($status) {
        $query .= " AND oa.status = ?";
        $params[] = $status;
    }
    
    if ($search) {
        $query .= " AND (CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR u.email LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    if ($department) {
        $query .= " AND oa.department = ?";
        $params[] = $department;
    }
    
    $query .= " GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.university, u.course, oa.department, oa.start_date, oa.end_date, oa.status, oa.total_required_hours";
    $query .= " ORDER BY u.first_name, u.last_name ASC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate progress and attendance
    foreach ($trainees as &$trainee) {
        $trainee['progress'] = $trainee['total_required_hours'] > 0 
            ? round(($trainee['completed_hours'] / $trainee['total_required_hours']) * 100, 1)
            : 0;
        $trainee['attendance'] = $trainee['total_days'] > 0 
            ? round(($trainee['days_present'] / $trainee['total_days']) * 100, 1)
            : 100;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $trainees
    ]);
}

function getTraineeDetail($conn, $supervisorId, $traineeId) {
    // Get trainee basic info
    $stmt = $conn->prepare("
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            u.email,
            u.phone,
            u.university,
            u.course,
            u.created_at,
            oa.department,
            oa.start_date,
            oa.end_date,
            oa.status as assignment_status,
            oa.total_required_hours,
            oa.notes
        FROM users u
        JOIN ojt_assignments oa ON oa.trainee_id = u.id
        WHERE u.id = ? AND oa.supervisor_id = ?
    ");
    $stmt->execute([$traineeId, $supervisorId]);
    $trainee = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$trainee) {
        http_response_code(404);
        echo json_encode(['error' => 'Trainee not found']);
        return;
    }
    
    // Get completed hours
    $stmt = $conn->prepare("
        SELECT COALESCE(SUM(total_hours), 0) as total
        FROM ojt_timesheets 
        WHERE trainee_id = ? AND status = 'approved'
    ");
    $stmt->execute([$traineeId]);
    $trainee['completed_hours'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get task stats
    $stmt = $conn->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
        FROM ojt_tasks WHERE assigned_to = ?
    ");
    $stmt->execute([$traineeId]);
    $trainee['tasks'] = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get recent tasks
    $stmt = $conn->prepare("
        SELECT id, title, status, priority, due_date, created_at
        FROM ojt_tasks 
        WHERE assigned_to = ?
        ORDER BY created_at DESC
        LIMIT 5
    ");
    $stmt->execute([$traineeId]);
    $trainee['recent_tasks'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get attendance stats
    $stmt = $conn->prepare("
        SELECT 
            COUNT(*) as total_days,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
        FROM ojt_attendance WHERE trainee_id = ?
    ");
    $stmt->execute([$traineeId]);
    $trainee['attendance'] = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get weekly hours (last 4 weeks)
    $stmt = $conn->prepare("
        SELECT week_start, total_hours, status
        FROM ojt_timesheets 
        WHERE trainee_id = ?
        ORDER BY week_start DESC
        LIMIT 4
    ");
    $stmt->execute([$traineeId]);
    $trainee['weekly_hours'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $trainee['progress'] = $trainee['total_required_hours'] > 0 
        ? round(($trainee['completed_hours'] / $trainee['total_required_hours']) * 100, 1)
        : 0;
    
    echo json_encode([
        'success' => true,
        'data' => $trainee
    ]);
}

/**
 * Handle Stats
 */
function handleStats($conn, $method) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $supervisorId = $_GET['supervisor_id'] ?? null;
    
    if (!$supervisorId) {
        http_response_code(400);
        echo json_encode(['error' => 'Supervisor ID is required']);
        return;
    }
    
    // Weekly hours by trainee (for charts)
    $stmt = $conn->prepare("
        SELECT 
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            ot.week_start,
            ot.total_hours
        FROM ojt_timesheets ot
        JOIN users u ON ot.trainee_id = u.id
        JOIN ojt_assignments oa ON oa.trainee_id = u.id AND oa.supervisor_id = ?
        WHERE ot.status = 'approved'
        ORDER BY ot.week_start DESC
        LIMIT 50
    ");
    $stmt->execute([$supervisorId]);
    $weeklyHours = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Task completion rate
    $stmt = $conn->prepare("
        SELECT 
            u.id,
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            COUNT(*) as total_tasks,
            SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
            AVG(t.rating) as avg_rating
        FROM ojt_tasks t
        JOIN users u ON t.assigned_to = u.id
        JOIN ojt_assignments oa ON oa.trainee_id = u.id AND oa.supervisor_id = ?
        GROUP BY u.id, u.first_name, u.last_name
    ");
    $stmt->execute([$supervisorId]);
    $taskStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate completion rates
    foreach ($taskStats as &$stat) {
        $stat['completion_rate'] = $stat['total_tasks'] > 0 
            ? round(($stat['completed_tasks'] / $stat['total_tasks']) * 100, 1)
            : 0;
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'weeklyHours' => $weeklyHours,
            'taskStats' => $taskStats
        ]
    ]);
}

/**
 * Handle Performance Reports
 */
function handlePerformance($conn, $method, $traineeId) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $supervisorId = $_GET['supervisor_id'] ?? null;
    
    if (!$supervisorId) {
        http_response_code(400);
        echo json_encode(['error' => 'Supervisor ID is required']);
        return;
    }
    
    // Get all trainees with performance data
    $query = "
        SELECT 
            u.id,
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            u.email,
            oa.department,
            COALESCE(SUM(ot.total_hours), 0) as total_hours,
            oa.total_required_hours,
            (SELECT COUNT(*) FROM ojt_tasks WHERE assigned_to = u.id AND status = 'completed') as tasks_completed,
            (SELECT COUNT(*) FROM ojt_tasks WHERE assigned_to = u.id) as total_tasks,
            (SELECT AVG(rating) FROM ojt_tasks WHERE assigned_to = u.id AND rating IS NOT NULL) as avg_rating,
            (SELECT COUNT(*) FROM ojt_attendance WHERE trainee_id = u.id AND status = 'present') as days_present,
            (SELECT COUNT(*) FROM ojt_attendance WHERE trainee_id = u.id) as total_days
        FROM ojt_assignments oa
        JOIN users u ON oa.trainee_id = u.id
        LEFT JOIN ojt_timesheets ot ON ot.trainee_id = u.id AND ot.status = 'approved'
        WHERE oa.supervisor_id = ? AND oa.status = 'active'
    ";
    
    $params = [$supervisorId];
    
    if ($traineeId) {
        $query .= " AND u.id = ?";
        $params[] = $traineeId;
    }
    
    $query .= " GROUP BY u.id, u.first_name, u.last_name, u.email, oa.department, oa.total_required_hours";
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $performance = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate metrics
    foreach ($performance as &$p) {
        $p['progress'] = $p['total_required_hours'] > 0 
            ? round(($p['total_hours'] / $p['total_required_hours']) * 100, 1)
            : 0;
        $p['task_completion'] = $p['total_tasks'] > 0 
            ? round(($p['tasks_completed'] / $p['total_tasks']) * 100, 1)
            : 0;
        $p['attendance_rate'] = $p['total_days'] > 0 
            ? round(($p['days_present'] / $p['total_days']) * 100, 1)
            : 100;
        $p['avg_rating'] = $p['avg_rating'] ? round($p['avg_rating'], 1) : null;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $performance
    ]);
}
