<?php
/**
 * OJT Tasks API
 * Handles task creation, assignment, submission, and review
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
    if (preg_match('#/ojt_tasks\.php(/.*)?$#', $uri, $matches)) {
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
    if ($id === 'submit') {
        handleSubmission($conn, $method);
    } elseif ($id === 'review') {
        handleReview($conn, $method);
    } elseif ($id === 'my-tasks') {
        handleMyTasks($conn, $method);
    } elseif ($action === 'submit') {
        handleTaskSubmission($conn, $method, $id);
    } elseif ($action === 'review') {
        handleTaskReview($conn, $method, $id);
    } else {
        // Standard CRUD
        switch ($method) {
            case 'GET':
                if ($id && is_numeric($id)) {
                    getTask($conn, $id);
                } else {
                    getTasks($conn);
                }
                break;
            case 'POST':
                createTask($conn);
                break;
            case 'PUT':
            case 'PATCH':
                if ($id && is_numeric($id)) {
                    updateTask($conn, $id);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'Task ID is required']);
                }
                break;
            case 'DELETE':
                if ($id && is_numeric($id)) {
                    deleteTask($conn, $id);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'Task ID is required']);
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('OJT Tasks error: ' . $e->getMessage());
    echo json_encode(['error' => 'An internal error occurred']);
}

/**
 * Expand file_path JSON arrays into individual submission entries
 * When multiple files are uploaded, they're stored as JSON in file_path
 */
function expandFilePathSubmissions($submissions) {
    $expanded = [];
    
    foreach ($submissions as $submission) {
        $filePath = $submission['file_path'];
        
        // Check if file_path is a JSON array (starts with '[')
        if ($filePath && substr(trim($filePath), 0, 1) === '[') {
            $files = json_decode($filePath, true);
            if (is_array($files)) {
                // Create a submission entry for each file
                foreach ($files as $file) {
                    $newSubmission = $submission;
                    $newSubmission['file_path'] = $file['path'] ?? null;
                    $newSubmission['file_name'] = $file['name'] ?? null;
                    $newSubmission['file_size'] = $file['size'] ?? null;
                    $newSubmission['file_type'] = $file['type'] ?? null;
                    $expanded[] = $newSubmission;
                }
                continue;
            }
        }
        
        // Single file or no file - add as-is
        $expanded[] = $submission;
    }
    
    return $expanded;
}

/**
 * Get all tasks (with filters)
 */
function getTasks($conn) {
    $supervisorId = $_GET['supervisor_id'] ?? null;
    // Accept both trainee_id and assigned_to for compatibility
    $traineeId = $_GET['trainee_id'] ?? $_GET['assigned_to'] ?? null;
    $status = $_GET['status'] ?? null;
    $priority = $_GET['priority'] ?? null;
    $search = $_GET['search'] ?? '';
    
    $query = "
        SELECT 
            t.*,
            CONCAT(assignee.first_name, ' ', assignee.last_name) as assignee_name,
            assignee.email as assignee_email,
            assignee.email as assignee_email_2,
            CONCAT(assigner.first_name, ' ', assigner.last_name) as assigner_name
        FROM ojt_tasks t
        JOIN users assignee ON t.assigned_to = assignee.id
        JOIN users assigner ON t.assigned_by = assigner.id
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($supervisorId) {
        $query .= " AND t.assigned_by = ?";
        $params[] = $supervisorId;
    }
    
    if ($traineeId) {
        $query .= " AND t.assigned_to = ?";
        $params[] = $traineeId;
    }
    
    if ($status) {
        if ($status === 'active') {
            $query .= " AND t.status IN ('pending', 'in_progress', 'under_review')";
        } else {
            $query .= " AND t.status = ?";
            $params[] = $status;
        }
    }
    
    if ($priority) {
        $query .= " AND t.priority = ?";
        $params[] = $priority;
    }
    
    if ($search) {
        $query .= " AND (t.title LIKE ? OR t.description LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    $query .= " ORDER BY 
        CASE t.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 
        END,
        t.due_date ASC,
        t.created_at DESC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get submissions for each task
    foreach ($tasks as &$task) {
        $stmt = $conn->prepare("
            SELECT * FROM ojt_task_submissions 
            WHERE task_id = ? 
            ORDER BY submitted_at DESC
        ");
        $stmt->execute([$task['id']]);
        $rawSubmissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $task['submissions'] = expandFilePathSubmissions($rawSubmissions);
    }
    
    echo json_encode([
        'success' => true,
        'data' => $tasks
    ]);
}

/**
 * Get single task
 */
function getTask($conn, $id) {
    $stmt = $conn->prepare("
        SELECT 
            t.*,
            CONCAT(assignee.first_name, ' ', assignee.last_name) as assignee_name,
            assignee.email as assignee_email,
            assignee.email as assignee_email_2,
            CONCAT(assigner.first_name, ' ', assigner.last_name) as assigner_name
        FROM ojt_tasks t
        JOIN users assignee ON t.assigned_to = assignee.id
        JOIN users assigner ON t.assigned_by = assigner.id
        WHERE t.id = ?
    ");
    $stmt->execute([$id]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$task) {
        http_response_code(404);
        echo json_encode(['error' => 'Task not found']);
        return;
    }
    
    // Get submissions
    $stmt = $conn->prepare("
        SELECT * FROM ojt_task_submissions 
        WHERE task_id = ? 
        ORDER BY submitted_at DESC
    ");
    $stmt->execute([$id]);
    $rawSubmissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $task['submissions'] = expandFilePathSubmissions($rawSubmissions);
    
    echo json_encode([
        'success' => true,
        'data' => $task
    ]);
}

/**
 * Create new task
 */
function createTask($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['title', 'assigned_to', 'assigned_by'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => ucfirst($field) . ' is required']);
            return;
        }
    }
    
    $stmt = $conn->prepare("
        INSERT INTO ojt_tasks (title, description, assigned_to, assigned_by, priority, status, due_date)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
    ");
    
    $stmt->execute([
        $input['title'],
        $input['description'] ?? null,
        $input['assigned_to'],
        $input['assigned_by'],
        $input['priority'] ?? 'medium',
        $input['due_date'] ?? null
    ]);
    
    $taskId = $conn->lastInsertId();
    
    // Fetch the created task
    $stmt = $conn->prepare("
        SELECT 
            t.*,
            CONCAT(assignee.first_name, ' ', assignee.last_name) as assignee_name,
            assignee.email as assignee_email,
            CONCAT(assigner.first_name, ' ', assigner.last_name) as assigner_name
        FROM ojt_tasks t
        JOIN users assignee ON t.assigned_to = assignee.id
        JOIN users assigner ON t.assigned_by = assigner.id
        WHERE t.id = ?
    ");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Create notification for the trainee
    createNotificationRecord($conn, [
        'user_id' => $input['assigned_to'],
        'type' => 'task',
        'title' => 'New Task Assigned',
        'message' => "You have been assigned a new task: \"{$task['title']}\"",
        'link' => '/ojt/tasks',
        'reference_id' => $taskId,
        'reference_type' => 'task',
        'action_type' => 'new_task'
    ]);
    
    // Log activity
    logActivity($conn, $input['assigned_by'], 'create', 'task', $taskId, "Created task: {$task['title']}");
    
    echo json_encode([
        'success' => true,
        'message' => 'Task created successfully',
        'data' => $task
    ]);
}

/**
 * Update task
 */
function updateTask($conn, $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Build dynamic update query
    $updates = [];
    $params = [];
    
    $allowedFields = ['title', 'description', 'assigned_to', 'priority', 'status', 'due_date', 'feedback', 'score'];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $params[] = $input[$field];
        }
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        return;
    }
    
    // Handle status change to completed
    if (isset($input['status']) && $input['status'] === 'completed') {
        $updates[] = "completed_at = NOW()";
    }
    
    $params[] = $id;
    
    $query = "UPDATE ojt_tasks SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    
    // Fetch updated task
    $stmt = $conn->prepare("
        SELECT 
            t.*,
            CONCAT(assignee.first_name, ' ', assignee.last_name) as assignee_name,
            assignee.email as assignee_email,
            CONCAT(assigner.first_name, ' ', assigner.last_name) as assigner_name
        FROM ojt_tasks t
        JOIN users assignee ON t.assigned_to = assignee.id
        JOIN users assigner ON t.assigned_by = assigner.id
        WHERE t.id = ?
    ");
    $stmt->execute([$id]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Task updated successfully',
        'data' => $task
    ]);
}

/**
 * Delete task
 */
function deleteTask($conn, $id) {
    $stmt = $conn->prepare("DELETE FROM ojt_tasks WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Task not found']);
        return;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Task deleted successfully'
    ]);
}

/**
 * Handle task submission (trainee submitting work)
 */
function handleTaskSubmission($conn, $method, $taskId) {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $traineeId = $_POST['trainee_id'] ?? null;
    $submissionType = $_POST['submission_type'] ?? 'text';
    $submissionText = $_POST['submission_text'] ?? null;
    $submissionLink = $_POST['submission_link'] ?? null;
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['error' => 'Trainee ID is required']);
        return;
    }
    
    // Allowed file extensions and MIME types
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 
                          'mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv',
                          'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                          'txt', 'csv', 'zip', 'rar', '7z'];
    
    // Create upload directory if it doesn't exist
    $uploadDir = __DIR__ . '/../uploads/tasks/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Handle multiple file uploads
    $uploadedFiles = [];
    $filePaths = [];
    $fileNames = [];
    
    // Check for files with names: file, file0, file1, file2, etc.
    foreach ($_FILES as $key => $fileData) {
        if (strpos($key, 'file') === 0 && $fileData['error'] === UPLOAD_ERR_OK) {
            $fileName = $fileData['name'];
            $fileSize = $fileData['size'];
            $fileType = $fileData['type'];
            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            
            // Validate extension
            if (!in_array($extension, $allowedExtensions)) {
                http_response_code(400);
                echo json_encode(['error' => "File type .$extension is not allowed"]);
                return;
            }
            
            // Max file size: 50MB
            if ($fileSize > 50 * 1024 * 1024) {
                http_response_code(400);
                echo json_encode(['error' => "File $fileName exceeds 50MB limit"]);
                return;
            }
            
            $uniqueName = uniqid('task_' . $taskId . '_') . '.' . $extension;
            $filePath = 'uploads/tasks/' . $uniqueName;
            
            if (move_uploaded_file($fileData['tmp_name'], $uploadDir . $uniqueName)) {
                $uploadedFiles[] = [
                    'path' => $filePath,
                    'name' => $fileName,
                    'size' => $fileSize,
                    'type' => $fileType
                ];
                $filePaths[] = $filePath;
                $fileNames[] = $fileName;
            }
        }
    }
    
    // Determine submission type based on what was uploaded
    if (count($uploadedFiles) > 0) {
        $submissionType = 'file';
    }
    
    // For backwards compatibility, store first file in main columns
    $primaryFile = count($uploadedFiles) > 0 ? $uploadedFiles[0] : null;
    
    // Store all file paths as JSON if multiple files
    $allFilePaths = count($uploadedFiles) > 1 ? json_encode($uploadedFiles) : ($primaryFile ? $primaryFile['path'] : null);
    
    // Insert submission
    $stmt = $conn->prepare("
        INSERT INTO ojt_task_submissions 
        (task_id, trainee_id, submission_type, file_path, file_name, file_size, file_type, submission_text, submission_link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $taskId,
        $traineeId,
        $submissionType,
        $allFilePaths,
        $primaryFile ? $primaryFile['name'] : null,
        $primaryFile ? $primaryFile['size'] : null,
        $primaryFile ? $primaryFile['type'] : null,
        $submissionText,
        $submissionLink
    ]);
    
    // Update task status to under_review and add submitted_at timestamp
    $stmt = $conn->prepare("UPDATE ojt_tasks SET status = 'under_review', submission_notes = ?, submitted_at = NOW() WHERE id = ?");
    $stmt->execute([$submissionText, $taskId]);
    
    // Get task details and supervisor info
    $stmt = $conn->prepare("
        SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as trainee_name 
        FROM ojt_tasks t 
        JOIN users u ON t.assigned_to = u.id 
        WHERE t.id = ?
    ");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Notify the supervisor about the submission
    if ($task && $task['assigned_by']) {
        createNotificationRecord($conn, [
            'user_id' => $task['assigned_by'],
            'type' => 'task',
            'title' => 'Task Submitted for Review',
            'message' => "{$task['trainee_name']} has submitted \"{$task['title']}\" for review.",
            'link' => '/supervisor/tasks',
            'reference_id' => $taskId,
            'reference_type' => 'task',
            'action_type' => 'task_submitted'
        ]);
    }
    
    // Log activity
    logActivity($conn, $traineeId, 'submit', 'task', $taskId, "Submitted task: {$task['title']}");
    
    echo json_encode([
        'success' => true,
        'message' => 'Task submitted successfully'
    ]);
}

/**
 * Handle task review (supervisor reviewing submission)
 */
function handleTaskReview($conn, $method, $taskId) {
    if ($method !== 'POST' && $method !== 'PUT') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $action = $input['action'] ?? null; // 'approve', 'reject', or 'revise'
    $feedback = $input['feedback'] ?? null;
    $score = $input['rating'] ?? $input['score'] ?? null;
    $supervisorId = $input['supervisor_id'] ?? $input['reviewed_by'] ?? null;
    
    if (!$action) {
        http_response_code(400);
        echo json_encode(['error' => 'Action is required (approve/reject/revise)']);
        return;
    }
    
    // Get task details before update
    $stmt = $conn->prepare("
        SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as assignee_name 
        FROM ojt_tasks t 
        JOIN users u ON t.assigned_to = u.id 
        WHERE t.id = ?
    ");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$task) {
        http_response_code(404);
        echo json_encode(['error' => 'Task not found']);
        return;
    }
    
    // Determine new status based on action
    $newStatus = 'pending';
    $notificationTitle = '';
    $notificationMessage = '';
    $actionType = '';
    
    switch ($action) {
        case 'approve':
            $newStatus = 'approved';
            $notificationTitle = 'Task Approved! 🎉';
            $notificationMessage = "Your task \"{$task['title']}\" has been approved" . ($score ? " with a score of $score/5" : "") . ".";
            $actionType = 'task_approved';
            break;
        case 'reject':
            $newStatus = 'rejected';
            $notificationTitle = 'Task Rejected';
            $notificationMessage = "Your task \"{$task['title']}\" has been rejected. " . ($feedback ? "Feedback: $feedback" : "Please contact your supervisor for more details.");
            $actionType = 'task_rejected';
            break;
        case 'revise':
            $newStatus = 'revision';
            $notificationTitle = 'Task Needs Revision';
            $notificationMessage = "Your task \"{$task['title']}\" requires revision. " . ($feedback ? "Feedback: $feedback" : "Please review and resubmit.");
            $actionType = 'task_revised';
            break;
        default:
            $newStatus = $action === 'approve' ? 'approved' : 'pending';
    }
    
    $query = "UPDATE ojt_tasks SET status = ?, feedback = ?, score = ?";
    $params = [$newStatus, $feedback, $score];
    
    if ($action === 'approve') {
        $query .= ", completed_at = NOW()";
    } else {
        $query .= ", completed_at = NULL";
    }
    
    $query .= " WHERE id = ?";
    $params[] = $taskId;
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    
    // Create notification for the trainee
    createNotificationRecord($conn, [
        'user_id' => $task['assigned_to'],
        'type' => 'task',
        'title' => $notificationTitle,
        'message' => $notificationMessage,
        'link' => '/ojt/tasks',
        'reference_id' => $taskId,
        'reference_type' => 'task',
        'action_type' => $actionType
    ]);
    
    // Log activity
    $actionDesc = ucfirst($action) . "d task: {$task['title']}";
    if ($supervisorId) {
        logActivity($conn, $supervisorId, $action, 'task', $taskId, $actionDesc);
    }
    
    $message = 'Task approved successfully';
    if ($action === 'reject') {
        $message = 'Task rejected';
    } elseif ($action === 'revise') {
        $message = 'Task sent back for revision';
    }
    
    echo json_encode([
        'success' => true,
        'message' => $message
    ]);
}

/**
 * Get tasks for current trainee
 */
function handleMyTasks($conn, $method) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $traineeId = $_GET['trainee_id'] ?? null;
    
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode(['error' => 'Trainee ID is required']);
        return;
    }
    
    $_GET['trainee_id'] = $traineeId;
    getTasks($conn);
}

/**
 * Handle general submission (for dropbox feature)
 */
function handleSubmission($conn, $method) {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // This handles the dropbox-style submission
    $taskId = $_POST['task_id'] ?? null;
    
    if (!$taskId) {
        http_response_code(400);
        echo json_encode(['error' => 'Task ID is required']);
        return;
    }
    
    handleTaskSubmission($conn, $method, $taskId);
}

/**
 * Handle general review
 */
function handleReview($conn, $method) {
    if ($method !== 'POST' && $method !== 'PUT') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $taskId = $input['task_id'] ?? null;
    
    if (!$taskId) {
        http_response_code(400);
        echo json_encode(['error' => 'Task ID is required']);
        return;
    }
    
    handleTaskReview($conn, $method, $taskId);
}

/**
 * Create a notification record
 */
function createNotificationRecord($conn, $data) {
    try {
        $stmt = $conn->prepare("
            INSERT INTO ojt_notifications (user_id, type, title, message, link, reference_id, reference_type, action_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['user_id'],
            $data['type'] ?? 'general',
            $data['title'],
            $data['message'] ?? '',
            $data['link'] ?? null,
            $data['reference_id'] ?? null,
            $data['reference_type'] ?? null,
            $data['action_type'] ?? null
        ]);
        return $conn->lastInsertId();
    } catch (Exception $e) {
        error_log("Failed to create notification: " . $e->getMessage());
        return false;
    }
}

/**
 * Log user activity
 */
function logActivity($conn, $userId, $action, $entityType, $entityId = null, $description = null, $oldValues = null, $newValues = null) {
    try {
        $stmt = $conn->prepare("
            INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, old_values, new_values, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $action,
            $entityType,
            $entityId,
            $description,
            $oldValues ? json_encode($oldValues) : null,
            $newValues ? json_encode($newValues) : null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
        return $conn->lastInsertId();
    } catch (Exception $e) {
        error_log("Failed to log activity: " . $e->getMessage());
        return false;
    }
}

