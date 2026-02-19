<?php
/**
 * OJT Modules API
 * Handles learning modules and trainee progress
 */

// CORS & security headers handled by middleware
require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = Database::getInstance()->getConnection();
    
    switch ($method) {
        case 'GET':
            if (isset($_GET['trainee_id'])) {
                // Get modules with trainee progress
                $traineeId = intval($_GET['trainee_id']);
                
                $stmt = $pdo->prepare("
                    SELECT 
                        m.*,
                        COALESCE(mp.status, 'not_started') as progress_status,
                        COALESCE(mp.progress_percent, 0) as progress_percent,
                        mp.started_at,
                        mp.completed_at,
                        mp.score
                    FROM ojt_modules m
                    LEFT JOIN ojt_module_progress mp ON m.id = mp.module_id AND mp.trainee_id = ?
                    ORDER BY m.order_index ASC
                ");
                $stmt->execute([$traineeId]);
                $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Calculate overall progress
                $totalModules = count($modules);
                $completedModules = 0;
                $totalProgress = 0;
                $totalScore = 0;
                $scoredModules = 0;
                
                foreach ($modules as $module) {
                    if ($module['progress_status'] === 'completed') {
                        $completedModules++;
                    }
                    $totalProgress += $module['progress_percent'];
                    if ($module['score'] !== null) {
                        $totalScore += $module['score'];
                        $scoredModules++;
                    }
                }
                
                $overallProgress = $totalModules > 0 ? round($totalProgress / $totalModules) : 0;
                $averageScore = $scoredModules > 0 ? round($totalScore / $scoredModules) : null;
                
                echo json_encode([
                    'success' => true,
                    'modules' => $modules,
                    'summary' => [
                        'total_modules' => $totalModules,
                        'completed_modules' => $completedModules,
                        'overall_progress' => $overallProgress,
                        'average_score' => $averageScore
                    ]
                ]);
            } else if (isset($_GET['id'])) {
                // Get single module
                $moduleId = intval($_GET['id']);
                $stmt = $pdo->prepare("SELECT * FROM ojt_modules WHERE id = ?");
                $stmt->execute([$moduleId]);
                $module = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($module) {
                    echo json_encode(['success' => true, 'module' => $module]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Module not found']);
                }
            } else {
                // Get all modules
                $stmt = $pdo->query("SELECT * FROM ojt_modules ORDER BY order_index ASC");
                $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'modules' => $modules]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (isset($data['action']) && $data['action'] === 'update_progress') {
                // Update trainee module progress
                $traineeId = intval($data['trainee_id']);
                $moduleId = intval($data['module_id']);
                $status = $data['status'] ?? 'in_progress';
                $progressPercent = intval($data['progress_percent'] ?? 0);
                $score = isset($data['score']) ? intval($data['score']) : null;
                
                // Check if progress record exists
                $stmt = $pdo->prepare("SELECT id FROM ojt_module_progress WHERE trainee_id = ? AND module_id = ?");
                $stmt->execute([$traineeId, $moduleId]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    // Update existing progress
                    $sql = "UPDATE ojt_module_progress SET 
                            status = ?, 
                            progress_percent = ?,
                            updated_at = CURRENT_TIMESTAMP";
                    
                    $params = [$status, $progressPercent];
                    
                    if ($status === 'completed') {
                        $sql .= ", completed_at = CURRENT_TIMESTAMP";
                    }
                    if ($score !== null) {
                        $sql .= ", score = ?";
                        $params[] = $score;
                    }
                    
                    $sql .= " WHERE trainee_id = ? AND module_id = ?";
                    $params[] = $traineeId;
                    $params[] = $moduleId;
                    
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                } else {
                    // Insert new progress record
                    $stmt = $pdo->prepare("
                        INSERT INTO ojt_module_progress (trainee_id, module_id, status, progress_percent, started_at, score)
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
                    ");
                    $stmt->execute([$traineeId, $moduleId, $status, $progressPercent, $score]);
                }
                
                echo json_encode(['success' => true, 'message' => 'Progress updated']);
            } else {
                // Create new module (admin only)
                $stmt = $pdo->prepare("
                    INSERT INTO ojt_modules (title, description, content, duration_hours, order_index, is_active)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['title'],
                    $data['description'] ?? null,
                    $data['content'] ?? null,
                    $data['duration_hours'] ?? 1,
                    $data['order_index'] ?? 0,
                    $data['is_active'] ?? 1
                ]);
                
                $moduleId = $pdo->lastInsertId();
                echo json_encode(['success' => true, 'module_id' => $moduleId, 'message' => 'Module created']);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $moduleId = intval($_GET['id'] ?? $data['id'] ?? 0);
            
            if (!$moduleId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Module ID required']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                UPDATE ojt_modules SET 
                    title = COALESCE(?, title),
                    description = COALESCE(?, description),
                    content = COALESCE(?, content),
                    duration_hours = COALESCE(?, duration_hours),
                    order_index = COALESCE(?, order_index),
                    is_active = COALESCE(?, is_active)
                WHERE id = ?
            ");
            $stmt->execute([
                $data['title'] ?? null,
                $data['description'] ?? null,
                $data['content'] ?? null,
                $data['duration_hours'] ?? null,
                $data['order_index'] ?? null,
                $data['is_active'] ?? null,
                $moduleId
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Module updated']);
            break;
            
        case 'DELETE':
            $moduleId = intval($_GET['id'] ?? 0);
            
            if (!$moduleId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Module ID required']);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM ojt_modules WHERE id = ?");
            $stmt->execute([$moduleId]);
            
            echo json_encode(['success' => true, 'message' => 'Module deleted']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log('OJT Modules DB error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A database error occurred']);
} catch (Exception $e) {
    http_response_code(500);
    error_log('OJT Modules error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'An internal error occurred']);
}
?>
