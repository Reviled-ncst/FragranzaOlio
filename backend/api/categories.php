<?php
/**
 * Categories API
 * Handles all category-related operations
 */

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getCategories($db);
        break;
    
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

/**
 * Get all categories with product count
 */
function getCategories($db) {
    try {
        $sql = "SELECT c.*, COUNT(p.id) as product_count 
                FROM categories c 
                LEFT JOIN products p ON c.id = p.category_id 
                GROUP BY c.id 
                ORDER BY c.name ASC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();

        $categories = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $categories
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch categories', 'error' => $e->getMessage()]);
    }
}
