<?php
/**
 * OJT Achievements API
 * Handles trainee achievements, badges, and progress tracking
 */

// CORS & security headers handled by middleware
require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../config/database.php';

date_default_timezone_set('Asia/Manila');

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_SERVER['PATH_INFO']) ? trim($_SERVER['PATH_INFO'], '/') : '';

if (empty($path) && isset($_SERVER['REQUEST_URI'])) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('#/ojt_achievements\.php(/.*)?$#', $uri, $matches)) {
        $path = isset($matches[1]) ? trim($matches[1], '/') : '';
    }
}

try {
    $conn = Database::getInstance()->getConnection();
    
    switch ($method) {
        case 'GET':
            if ($path === 'definitions') {
                getAchievementDefinitions($conn);
            } elseif ($path === 'user') {
                getUserAchievements($conn);
            } elseif ($path === 'progress') {
                getAchievementProgress($conn);
            } elseif ($path === 'check') {
                checkAndAwardAchievements($conn);
            } elseif ($path === 'leaderboard') {
                getLeaderboard($conn);
            } else {
                getUserAchievements($conn);
            }
            break;
            
        case 'POST':
            if ($path === 'award') {
                awardAchievement($conn);
            } elseif ($path === 'check-all') {
                checkAndAwardAchievements($conn);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid endpoint']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('OJT Achievements error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'An internal error occurred']);
}

function getAchievementDefinitions($conn) {
    $category = $_GET['category'] ?? null;
    
    $sql = "SELECT * FROM ojt_achievement_definitions WHERE is_active = 1";
    $params = [];
    
    if ($category) {
        $sql .= " AND category = ?";
        $params[] = $category;
    }
    
    $sql .= " ORDER BY category, points";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $achievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $achievements]);
}

function getUserAchievements($conn) {
    $userId = intval($_GET['user_id'] ?? 0);
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID required']);
        return;
    }
    
    // Get earned achievements
    $stmt = $conn->prepare("
        SELECT 
            ua.*,
            ad.code, ad.name, ad.description, ad.icon, ad.badge_color, 
            ad.category, ad.points, ad.requirement_value
        FROM ojt_user_achievements ua
        JOIN ojt_achievement_definitions ad ON ua.achievement_id = ad.id
        WHERE ua.user_id = ?
        ORDER BY ua.earned_at DESC
    ");
    $stmt->execute([$userId]);
    $achievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate total points
    $totalPoints = array_sum(array_column($achievements, 'points'));
    
    echo json_encode([
        'success' => true,
        'data' => [
            'achievements' => $achievements,
            'total_points' => $totalPoints,
            'achievement_count' => count($achievements)
        ]
    ]);
}

function getAchievementProgress($conn) {
    $userId = intval($_GET['user_id'] ?? 0);
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID required']);
        return;
    }
    
    // Get all achievements with user progress
    $stmt = $conn->prepare("
        SELECT 
            ad.*,
            ua.earned_at,
            ua.progress,
            CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as is_earned
        FROM ojt_achievement_definitions ad
        LEFT JOIN ojt_user_achievements ua ON ad.id = ua.achievement_id AND ua.user_id = ?
        WHERE ad.is_active = 1
        ORDER BY ad.category, ad.points
    ");
    $stmt->execute([$userId]);
    $achievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get current progress stats
    $stats = calculateUserStats($conn, $userId);
    
    // Calculate progress for each achievement
    foreach ($achievements as &$achievement) {
        if (!$achievement['is_earned']) {
            $achievement['current_progress'] = calculateProgress($achievement, $stats);
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'achievements' => $achievements,
            'stats' => $stats
        ]
    ]);
}

function calculateUserStats($conn, $userId) {
    // Get attendance stats
    $stmt = $conn->prepare("
        SELECT 
            COUNT(*) as total_days,
            SUM(CASE WHEN late_minutes = 0 OR late_minutes IS NULL THEN 1 ELSE 0 END) as on_time_days,
            SUM(COALESCE(work_hours, 0)) as total_hours
        FROM ojt_attendance
        WHERE trainee_id = ?
    ");
    $stmt->execute([$userId]);
    $attendance = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get task stats
    $stmt = $conn->prepare("
        SELECT 
            COUNT(*) as total_tasks,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as approved_tasks
        FROM ojt_tasks
        WHERE assigned_to = ?
    ");
    $stmt->execute([$userId]);
    $tasks = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get assignment progress
    $stmt = $conn->prepare("
        SELECT 
            start_date, end_date, total_required_hours
        FROM ojt_assignments
        WHERE trainee_id = ?
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $programProgress = 0;
    if ($assignment && $assignment['total_required_hours'] > 0) {
        $programProgress = min(100, round(($attendance['total_hours'] / $assignment['total_required_hours']) * 100));
    }
    
    return [
        'total_days' => intval($attendance['total_days']),
        'on_time_days' => intval($attendance['on_time_days']),
        'total_hours' => floatval($attendance['total_hours']),
        'total_tasks' => intval($tasks['total_tasks']),
        'approved_tasks' => intval($tasks['approved_tasks']),
        'perfect_tasks' => 0, // Placeholder - rating tracking not implemented
        'first_try_tasks' => 0, // Placeholder - revision tracking not implemented
        'program_progress' => $programProgress
    ];
}

function calculateProgress($achievement, $stats) {
    $current = 0;
    $target = $achievement['requirement_value'];
    
    switch ($achievement['code']) {
        // Attendance achievements
        case 'first_clock_in':
            $current = min(1, $stats['total_days']);
            break;
        case 'perfect_week':
            $current = min($stats['on_time_days'], 5);
            break;
        case 'perfect_month':
            $current = min($stats['on_time_days'], 22);
            break;
        case 'attendance_50':
        case 'attendance_100':
        case 'attendance_200':
        case 'attendance_300':
            $current = $stats['total_hours'];
            break;
            
        // Task achievements
        case 'first_task':
            $current = min(1, $stats['approved_tasks']);
            break;
        case 'task_5':
        case 'task_10':
        case 'task_25':
            $current = $stats['approved_tasks'];
            break;
        case 'perfect_task':
            $current = min(1, $stats['perfect_tasks']);
            break;
        case 'no_revision':
            $current = $stats['first_try_tasks'];
            break;
            
        // Milestone achievements
        case 'halfway':
        case 'almost_done':
        case 'graduate':
            $current = $stats['program_progress'];
            break;
    }
    
    return [
        'current' => $current,
        'target' => $target,
        'percentage' => $target > 0 ? min(100, round(($current / $target) * 100)) : 0
    ];
}

function checkAndAwardAchievements($conn) {
    $userId = intval($_GET['user_id'] ?? $_POST['user_id'] ?? 0);
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID required']);
        return;
    }
    
    $stats = calculateUserStats($conn, $userId);
    $newAchievements = [];
    
    // Get all unearned achievements
    $stmt = $conn->prepare("
        SELECT ad.* 
        FROM ojt_achievement_definitions ad
        LEFT JOIN ojt_user_achievements ua ON ad.id = ua.achievement_id AND ua.user_id = ?
        WHERE ad.is_active = 1 AND ua.id IS NULL
    ");
    $stmt->execute([$userId]);
    $unearned = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($unearned as $achievement) {
        if (checkAchievementCriteria($achievement, $stats)) {
            // Award the achievement
            $stmt = $conn->prepare("
                INSERT INTO ojt_user_achievements (user_id, achievement_id, progress)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$userId, $achievement['id'], $achievement['requirement_value']]);
            
            // Create notification
            createAchievementNotification($conn, $userId, $achievement);
            
            $newAchievements[] = $achievement;
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => count($newAchievements) > 0 ? 'New achievements unlocked!' : 'No new achievements',
        'data' => [
            'new_achievements' => $newAchievements,
            'count' => count($newAchievements)
        ]
    ]);
}

function checkAchievementCriteria($achievement, $stats) {
    $target = $achievement['requirement_value'];
    
    switch ($achievement['code']) {
        case 'first_clock_in':
            return $stats['total_days'] >= 1;
        case 'perfect_week':
            return $stats['on_time_days'] >= 5;
        case 'perfect_month':
            return $stats['on_time_days'] >= 22;
        case 'attendance_50':
            return $stats['total_hours'] >= 50;
        case 'attendance_100':
            return $stats['total_hours'] >= 100;
        case 'attendance_200':
            return $stats['total_hours'] >= 200;
        case 'attendance_300':
            return $stats['total_hours'] >= 300;
        case 'first_task':
            return $stats['approved_tasks'] >= 1;
        case 'task_5':
            return $stats['approved_tasks'] >= 5;
        case 'task_10':
            return $stats['approved_tasks'] >= 10;
        case 'task_25':
            return $stats['approved_tasks'] >= 25;
        case 'perfect_task':
            return $stats['perfect_tasks'] >= 1;
        case 'no_revision':
            return $stats['first_try_tasks'] >= 5;
        case 'halfway':
            return $stats['program_progress'] >= 50;
        case 'almost_done':
            return $stats['program_progress'] >= 90;
        case 'graduate':
            return $stats['program_progress'] >= 100;
        default:
            return false;
    }
}

function createAchievementNotification($conn, $userId, $achievement) {
    $stmt = $conn->prepare("
        INSERT INTO ojt_notifications (user_id, type, title, message, link, action_type)
        VALUES (?, 'achievement', ?, ?, '/ojt/achievements', 'achievement_unlocked')
    ");
    
    $title = "🏆 Achievement Unlocked!";
    $message = "You earned \"{$achievement['name']}\"! {$achievement['description']} (+{$achievement['points']} points)";
    
    $stmt->execute([$userId, $title, $message]);
}

function awardAchievement($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $userId = intval($data['user_id'] ?? 0);
    $achievementCode = $data['achievement_code'] ?? '';
    
    if (!$userId || !$achievementCode) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'User ID and achievement code required']);
        return;
    }
    
    // Get achievement definition
    $stmt = $conn->prepare("SELECT * FROM ojt_achievement_definitions WHERE code = ?");
    $stmt->execute([$achievementCode]);
    $achievement = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$achievement) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Achievement not found']);
        return;
    }
    
    // Check if already earned
    $stmt = $conn->prepare("
        SELECT id FROM ojt_user_achievements 
        WHERE user_id = ? AND achievement_id = ?
    ");
    $stmt->execute([$userId, $achievement['id']]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Achievement already earned']);
        return;
    }
    
    // Award achievement
    $stmt = $conn->prepare("
        INSERT INTO ojt_user_achievements (user_id, achievement_id, progress)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$userId, $achievement['id'], $achievement['requirement_value']]);
    
    // Create notification
    createAchievementNotification($conn, $userId, $achievement);
    
    echo json_encode([
        'success' => true,
        'message' => 'Achievement awarded!',
        'data' => $achievement
    ]);
}

function getLeaderboard($conn) {
    $limit = intval($_GET['limit'] ?? 10);
    
    $stmt = $conn->prepare("
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            COUNT(ua.id) as achievement_count,
            COALESCE(SUM(ad.points), 0) as total_points
        FROM users u
        LEFT JOIN ojt_user_achievements ua ON u.id = ua.user_id
        LEFT JOIN ojt_achievement_definitions ad ON ua.achievement_id = ad.id
        WHERE u.role = 'ojt'
        GROUP BY u.id
        ORDER BY total_points DESC, achievement_count DESC
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    $leaderboard = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $leaderboard]);
}
?>
