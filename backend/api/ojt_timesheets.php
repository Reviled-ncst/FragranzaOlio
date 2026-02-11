<?php
/**
 * OJT Timesheets API
 * Handles timesheet creation, submission, approval, and reporting
 */

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

// Get the request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';

// Fallback to REQUEST_URI if PATH_INFO is empty
if (empty($path) && isset($_SERVER['REQUEST_URI'])) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('#/ojt_timesheets\.php(/.*)?$#', $uri, $matches)) {
        $path = isset($matches[1]) ? $matches[1] : '';
    }
}

$path = trim($path, '/');
$pathParts = $path ? explode('/', $path) : [];

try {
    $conn = Database::getInstance()->getConnection();
    
    // Route handling
    $id = $pathParts[0] ?? null;
    $action = $pathParts[1] ?? null;
    
    // Check for special routes
    if ($id === 'pending') {
        getPendingTimesheets($conn);
    } elseif ($id === 'my-timesheets') {
        getMyTimesheets($conn);
    } elseif ($id === 'current-week') {
        getCurrentWeekTimesheet($conn);
    } elseif ($id === 'get-assignment') {
        getTraineeAssignment($conn);
    } elseif ($action === 'approve') {
        approveTimesheet($conn, $id);
    } elseif ($action === 'reject') {
        rejectTimesheet($conn, $id);
    } elseif ($action === 'submit') {
        submitTimesheet($conn, $id);
    } elseif ($action === 'entries') {
        handleEntries($conn, $method, $id);
    } else {
        // Standard CRUD
        switch ($method) {
            case 'GET':
                if ($id && is_numeric($id)) {
                    getTimesheet($conn, $id);
                } else {
                    getTimesheets($conn);
                }
                break;
            case 'POST':
                createTimesheet($conn);
                break;
            case 'PUT':
            case 'PATCH':
                if ($id && is_numeric($id)) {
                    updateTimesheet($conn, $id);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'Timesheet ID is required']);
                }
                break;
            case 'DELETE':
                if ($id && is_numeric($id)) {
                    deleteTimesheet($conn, $id);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'Timesheet ID is required']);
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Get all timesheets (with filters)
 */
function getTimesheets($conn) {
    $supervisorId = $_GET['supervisor_id'] ?? null;
    $traineeId = $_GET['trainee_id'] ?? null;
    $status = $_GET['status'] ?? null;
    $weekStart = $_GET['week_start'] ?? null;
    
    $query = "
        SELECT 
            t.*,
            CONCAT(trainee.first_name, ' ', trainee.last_name) as trainee_name,
            trainee.email as trainee_email,
            trainee.university as trainee_university,
            CONCAT(supervisor.first_name, ' ', supervisor.last_name) as supervisor_name,
            CONCAT(reviewer.first_name, ' ', reviewer.last_name) as reviewer_name
        FROM ojt_timesheets t
        JOIN users trainee ON t.trainee_id = trainee.id
        JOIN users supervisor ON t.supervisor_id = supervisor.id
        LEFT JOIN users reviewer ON t.reviewed_by = reviewer.id
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($supervisorId) {
        $query .= " AND t.supervisor_id = ?";
        $params[] = $supervisorId;
    }
    
    if ($traineeId) {
        $query .= " AND t.trainee_id = ?";
        $params[] = $traineeId;
    }
    
    if ($status) {
        $query .= " AND t.status = ?";
        $params[] = $status;
    }
    
    if ($weekStart) {
        $query .= " AND t.week_start = ?";
        $params[] = $weekStart;
    }
    
    $query .= " ORDER BY t.week_start DESC, t.submitted_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $timesheets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get entries for each timesheet
    foreach ($timesheets as &$timesheet) {
        $stmt = $conn->prepare("
            SELECT * FROM ojt_timesheet_entries 
            WHERE timesheet_id = ? 
            ORDER BY entry_date ASC
        ");
        $stmt->execute([$timesheet['id']]);
        $timesheet['entries'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode([
        'success' => true,
        'data' => $timesheets
    ]);
}

/**
 * Get single timesheet
 */
function getTimesheet($conn, $id) {
    $stmt = $conn->prepare("
        SELECT 
            t.*,
            CONCAT(trainee.first_name, ' ', trainee.last_name) as trainee_name,
            trainee.email as trainee_email,
            trainee.university as trainee_university,
            CONCAT(supervisor.first_name, ' ', supervisor.last_name) as supervisor_name,
            CONCAT(reviewer.first_name, ' ', reviewer.last_name) as reviewer_name
        FROM ojt_timesheets t
        JOIN users trainee ON t.trainee_id = trainee.id
        JOIN users supervisor ON t.supervisor_id = supervisor.id
        LEFT JOIN users reviewer ON t.reviewed_by = reviewer.id
        WHERE t.id = ?
    ");
    $stmt->execute([$id]);
    $timesheet = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$timesheet) {
        http_response_code(404);
        echo json_encode(['error' => 'Timesheet not found']);
        return;
    }
    
    // Get entries
    $stmt = $conn->prepare("
        SELECT * FROM ojt_timesheet_entries 
        WHERE timesheet_id = ? 
        ORDER BY entry_date ASC
    ");
    $stmt->execute([$id]);
    $timesheet['entries'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $timesheet
    ]);
}

/**
 * Create new timesheet
 */
function createTimesheet($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['trainee_id', 'supervisor_id', 'week_start', 'week_end'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
            return;
        }
    }
    
    // Check if timesheet already exists for this week
    $stmt = $conn->prepare("
        SELECT id FROM ojt_timesheets 
        WHERE trainee_id = ? AND week_start = ?
    ");
    $stmt->execute([$input['trainee_id'], $input['week_start']]);
    
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Timesheet already exists for this week']);
        return;
    }
    
    $stmt = $conn->prepare("
        INSERT INTO ojt_timesheets (trainee_id, supervisor_id, week_start, week_end, notes, status)
        VALUES (?, ?, ?, ?, ?, 'draft')
    ");
    
    $stmt->execute([
        $input['trainee_id'],
        $input['supervisor_id'],
        $input['week_start'],
        $input['week_end'],
        $input['notes'] ?? null
    ]);
    
    $timesheetId = $conn->lastInsertId();
    
    // Create entries for each day of the week
    if (isset($input['entries']) && is_array($input['entries'])) {
        foreach ($input['entries'] as $entry) {
            createEntry($conn, $timesheetId, $entry);
        }
    }
    
    // Update total hours
    updateTotalHours($conn, $timesheetId);
    
    // Fetch the created timesheet
    getTimesheet($conn, $timesheetId);
}

/**
 * Update timesheet
 */
function updateTimesheet($conn, $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if timesheet exists and is editable
    $stmt = $conn->prepare("SELECT status FROM ojt_timesheets WHERE id = ?");
    $stmt->execute([$id]);
    $timesheet = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$timesheet) {
        http_response_code(404);
        echo json_encode(['error' => 'Timesheet not found']);
        return;
    }
    
    if ($timesheet['status'] === 'approved') {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot edit approved timesheet']);
        return;
    }
    
    // Update notes if provided
    if (isset($input['notes'])) {
        $stmt = $conn->prepare("UPDATE ojt_timesheets SET notes = ? WHERE id = ?");
        $stmt->execute([$input['notes'], $id]);
    }
    
    // Update entries if provided
    if (isset($input['entries']) && is_array($input['entries'])) {
        // Delete existing entries
        $stmt = $conn->prepare("DELETE FROM ojt_timesheet_entries WHERE timesheet_id = ?");
        $stmt->execute([$id]);
        
        // Create new entries
        foreach ($input['entries'] as $entry) {
            createEntry($conn, $id, $entry);
        }
    }
    
    // Update total hours
    updateTotalHours($conn, $id);
    
    // Reset status to draft if it was rejected
    if ($timesheet['status'] === 'rejected') {
        $stmt = $conn->prepare("UPDATE ojt_timesheets SET status = 'draft', rejection_reason = NULL WHERE id = ?");
        $stmt->execute([$id]);
    }
    
    getTimesheet($conn, $id);
}

/**
 * Delete timesheet
 */
function deleteTimesheet($conn, $id) {
    $stmt = $conn->prepare("SELECT status FROM ojt_timesheets WHERE id = ?");
    $stmt->execute([$id]);
    $timesheet = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$timesheet) {
        http_response_code(404);
        echo json_encode(['error' => 'Timesheet not found']);
        return;
    }
    
    if ($timesheet['status'] === 'approved') {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot delete approved timesheet']);
        return;
    }
    
    $stmt = $conn->prepare("DELETE FROM ojt_timesheets WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Timesheet deleted successfully'
    ]);
}

/**
 * Submit timesheet for approval
 */
function submitTimesheet($conn, $id) {
    $stmt = $conn->prepare("
        UPDATE ojt_timesheets 
        SET status = 'submitted', submitted_at = NOW() 
        WHERE id = ? AND status IN ('draft', 'rejected')
    ");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Timesheet cannot be submitted']);
        return;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Timesheet submitted for approval'
    ]);
}

/**
 * Approve timesheet
 */
function approveTimesheet($conn, $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    $reviewerId = $input['reviewer_id'] ?? null;
    
    $stmt = $conn->prepare("
        UPDATE ojt_timesheets 
        SET status = 'approved', reviewed_at = NOW(), reviewed_by = ?
        WHERE id = ? AND status = 'submitted'
    ");
    $stmt->execute([$reviewerId, $id]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Timesheet cannot be approved']);
        return;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Timesheet approved successfully'
    ]);
}

/**
 * Reject timesheet
 */
function rejectTimesheet($conn, $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    $reviewerId = $input['reviewer_id'] ?? null;
    $reason = $input['reason'] ?? null;
    
    if (!$reason) {
        http_response_code(400);
        echo json_encode(['error' => 'Rejection reason is required']);
        return;
    }
    
    $stmt = $conn->prepare("
        UPDATE ojt_timesheets 
        SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ?, rejection_reason = ?
        WHERE id = ? AND status = 'submitted'
    ");
    $stmt->execute([$reviewerId, $reason, $id]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Timesheet cannot be rejected']);
        return;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Timesheet rejected'
    ]);
}

/**
 * Get pending timesheets for supervisor
 */
function getPendingTimesheets($conn) {
    $supervisorId = $_GET['supervisor_id'] ?? null;
    
    if (!$supervisorId) {
        http_response_code(400);
        echo json_encode(['error' => 'Supervisor ID is required']);
        return;
    }
    
    $_GET['status'] = 'submitted';
    getTimesheets($conn);
}

/**
 * Get timesheets for current trainee
 */
function getMyTimesheets($conn) {
    $traineeId = $_GET['trainee_id'] ?? null;
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['error' => 'Trainee ID is required']);
        return;
    }
    
    getTimesheets($conn);
}

/**
 * Get or create current week timesheet
 */
function getCurrentWeekTimesheet($conn) {
    $traineeId = $_GET['trainee_id'] ?? null;
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['error' => 'Trainee ID is required']);
        return;
    }
    
    $weekStart = date('Y-m-d', strtotime('monday this week'));
    $weekEnd = date('Y-m-d', strtotime('sunday this week'));
    
    // Check if timesheet exists
    $stmt = $conn->prepare("
        SELECT id FROM ojt_timesheets 
        WHERE trainee_id = ? AND week_start = ?
    ");
    $stmt->execute([$traineeId, $weekStart]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        getTimesheet($conn, $existing['id']);
        return;
    }
    
    // Get supervisor for this trainee
    $stmt = $conn->prepare("
        SELECT supervisor_id FROM ojt_assignments 
        WHERE trainee_id = ? AND status = 'active'
        LIMIT 1
    ");
    $stmt->execute([$traineeId]);
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$assignment) {
        http_response_code(400);
        echo json_encode(['error' => 'No active assignment found']);
        return;
    }
    
    // Create new timesheet
    $stmt = $conn->prepare("
        INSERT INTO ojt_timesheets (trainee_id, supervisor_id, week_start, week_end, status)
        VALUES (?, ?, ?, ?, 'draft')
    ");
    $stmt->execute([$traineeId, $assignment['supervisor_id'], $weekStart, $weekEnd]);
    
    $timesheetId = $conn->lastInsertId();
    
    // Create empty entries for each day
    $currentDate = new DateTime($weekStart);
    $endDate = new DateTime($weekEnd);
    
    while ($currentDate <= $endDate) {
        $stmt = $conn->prepare("
            INSERT INTO ojt_timesheet_entries (timesheet_id, entry_date)
            VALUES (?, ?)
        ");
        $stmt->execute([$timesheetId, $currentDate->format('Y-m-d')]);
        $currentDate->modify('+1 day');
    }
    
    getTimesheet($conn, $timesheetId);
}

/**
 * Handle timesheet entries
 */
function handleEntries($conn, $method, $timesheetId) {
    if ($method === 'GET') {
        $stmt = $conn->prepare("
            SELECT * FROM ojt_timesheet_entries 
            WHERE timesheet_id = ? 
            ORDER BY entry_date ASC
        ");
        $stmt->execute([$timesheetId]);
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $entries
        ]);
    } elseif ($method === 'POST' || $method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['entries']) && is_array($input['entries'])) {
            // Delete existing entries
            $stmt = $conn->prepare("DELETE FROM ojt_timesheet_entries WHERE timesheet_id = ?");
            $stmt->execute([$timesheetId]);
            
            // Create new entries
            foreach ($input['entries'] as $entry) {
                createEntry($conn, $timesheetId, $entry);
            }
            
            updateTotalHours($conn, $timesheetId);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Entries updated successfully'
        ]);
    }
}

/**
 * Helper: Create timesheet entry
 */
function createEntry($conn, $timesheetId, $entry) {
    $hoursWorked = 0;
    
    if (!empty($entry['time_in']) && !empty($entry['time_out'])) {
        $timeIn = new DateTime($entry['time_in']);
        $timeOut = new DateTime($entry['time_out']);
        $diff = $timeOut->diff($timeIn);
        $hoursWorked = $diff->h + ($diff->i / 60);
        $hoursWorked -= floatval($entry['break_hours'] ?? 0);
        $hoursWorked = max(0, $hoursWorked);
    } else {
        $hoursWorked = floatval($entry['hours_worked'] ?? 0);
    }
    
    $stmt = $conn->prepare("
        INSERT INTO ojt_timesheet_entries 
        (timesheet_id, entry_date, time_in, time_out, break_hours, hours_worked, tasks_completed, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        time_in = VALUES(time_in),
        time_out = VALUES(time_out),
        break_hours = VALUES(break_hours),
        hours_worked = VALUES(hours_worked),
        tasks_completed = VALUES(tasks_completed),
        notes = VALUES(notes)
    ");
    
    $stmt->execute([
        $timesheetId,
        $entry['entry_date'],
        $entry['time_in'] ?? null,
        $entry['time_out'] ?? null,
        $entry['break_hours'] ?? 0,
        $hoursWorked,
        $entry['tasks_completed'] ?? null,
        $entry['notes'] ?? null
    ]);
}

/**
 * Helper: Update total hours
 */
function updateTotalHours($conn, $timesheetId) {
    $stmt = $conn->prepare("
        UPDATE ojt_timesheets 
        SET total_hours = (
            SELECT COALESCE(SUM(hours_worked), 0) 
            FROM ojt_timesheet_entries 
            WHERE timesheet_id = ?
        )
        WHERE id = ?
    ");
    $stmt->execute([$timesheetId, $timesheetId]);
}

/**
 * Get trainee's OJT assignment (supervisor info)
 */
function getTraineeAssignment($conn) {
    $traineeId = $_GET['trainee_id'] ?? null;
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['error' => 'trainee_id is required']);
        return;
    }
    
    $stmt = $conn->prepare("
        SELECT 
            oa.*,
            CONCAT(u.first_name, ' ', u.last_name) as supervisor_name
        FROM ojt_assignments oa
        LEFT JOIN users u ON oa.supervisor_id = u.id
        WHERE oa.trainee_id = ? 
        AND oa.status = 'active'
        ORDER BY oa.created_at DESC
        LIMIT 1
    ");
    $stmt->execute([$traineeId]);
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$assignment) {
        // Try to get from users table as fallback
        $stmt = $conn->prepare("
            SELECT 
                u.supervisor_id,
                CONCAT(s.first_name, ' ', s.last_name) as supervisor_name
            FROM users u
            LEFT JOIN users s ON u.supervisor_id = s.id
            WHERE u.id = ?
        ");
        $stmt->execute([$traineeId]);
        $userSupervisor = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($userSupervisor && $userSupervisor['supervisor_id']) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'supervisor_id' => $userSupervisor['supervisor_id'],
                    'supervisor_name' => $userSupervisor['supervisor_name']
                ]
            ]);
            return;
        }
        
        // Return success:false instead of 404 - no assignment is a valid state
        echo json_encode([
            'success' => false,
            'message' => 'No assignment found for this trainee',
            'data' => null
        ]);
        return;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $assignment
    ]);
}

