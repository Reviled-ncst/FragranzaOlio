<?php
/**
 * Products API
 * Handles all product-related operations
 */

// CORS & security headers handled by middleware
require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/sanitize.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Get product ID from URL if present (supports both /products/123 and ?id=123)
$requestUri = $_SERVER['REQUEST_URI'];
$productId = null;
if (preg_match('/\/products\/(\d+)/', $requestUri, $matches)) {
    $productId = (int)$matches[1];
} elseif (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $productId = (int)$_GET['id'];
}

switch ($method) {
    case 'GET':
        // Public: product listing and details
        if ($productId) {
            getProduct($db, $productId);
        } else {
            getProducts($db);
        }
        break;
    
    case 'POST':
        // SECURITY: Require admin role for product creation
        requireRole($db, 'admin');
        createProduct($db);
        break;
    
    case 'PUT':
        // SECURITY: Require admin role for product updates
        requireRole($db, 'admin');
        if ($productId) {
            updateProduct($db, $productId);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Product ID required']);
        }
        break;
    
    case 'DELETE':
        // SECURITY: Require admin role for product deletion
        requireRole($db, 'admin');
        if ($productId) {
            deleteProduct($db, $productId);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Product ID required']);
        }
        break;
    
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

/**
 * Get all products with optional filtering and sorting
 */
function getProducts($db) {
    try {
        $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE 1=1";
        $params = [];

        // Filter by category
        if (!empty($_GET['category'])) {
            $sql .= " AND c.slug = :category";
            $params[':category'] = $_GET['category'];
        }

        // Filter by featured
        if (isset($_GET['featured']) && $_GET['featured'] === 'true') {
            $sql .= " AND p.is_featured = 1";
        }

        // Filter by new
        if (isset($_GET['new']) && $_GET['new'] === 'true') {
            $sql .= " AND p.is_new = 1";
        }

        // Filter by stock status
        if (!empty($_GET['stock_status'])) {
            $sql .= " AND p.stock_status = :stock_status";
            $params[':stock_status'] = $_GET['stock_status'];
        }

        // Search by name
        if (!empty($_GET['search'])) {
            $sql .= " AND p.name LIKE :search";
            $params[':search'] = '%' . $_GET['search'] . '%';
        }

        // Sorting
        $sortBy = $_GET['sort'] ?? 'featured';
        switch ($sortBy) {
            case 'price-low':
                $sql .= " ORDER BY p.price ASC";
                break;
            case 'price-high':
                $sql .= " ORDER BY p.price DESC";
                break;
            case 'newest':
                $sql .= " ORDER BY p.is_new DESC, p.created_at DESC";
                break;
            case 'name':
                $sql .= " ORDER BY p.name ASC";
                break;
            case 'featured':
            default:
                $sql .= " ORDER BY p.is_featured DESC, p.created_at DESC";
        }

        // Pagination
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(50, max(1, (int)$_GET['limit'])) : 12;
        $offset = ($page - 1) * $limit;

        // Get total count - build separate count query
        $countSql = "SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1";
        if (!empty($_GET['category'])) {
            $countSql .= " AND c.slug = :category";
        }
        if (isset($_GET['featured']) && $_GET['featured'] === 'true') {
            $countSql .= " AND p.is_featured = 1";
        }
        if (isset($_GET['new']) && $_GET['new'] === 'true') {
            $countSql .= " AND p.is_new = 1";
        }
        if (!empty($_GET['stock_status'])) {
            $countSql .= " AND p.stock_status = :stock_status";
        }
        if (!empty($_GET['search'])) {
            $countSql .= " AND p.name LIKE :search";
        }
        
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $countResult = $countStmt->fetch();
        $total = $countResult ? (int)$countResult['total'] : 0;

        // Add pagination to main query
        $sql .= " LIMIT :limit OFFSET :offset";
        
        $stmt = $db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $products = $stmt->fetchAll();

        // Parse JSON gallery and variations for each product
        foreach ($products as &$product) {
            $product['image_gallery'] = json_decode($product['image_gallery'], true) ?? [];
            $product['variations'] = json_decode($product['variations'], true) ?? [];
            $product['featured'] = (bool)($product['is_featured'] ?? false);
            $product['is_new'] = (bool)$product['is_new'];
            $product['price'] = (float)$product['price'];
            $product['rating'] = (float)$product['rating'];
            $product['stock_quantity'] = (int)$product['stock_quantity'];
            // Add category object for frontend compatibility
            if ($product['category_name']) {
                $product['category'] = [
                    'id' => $product['category_id'],
                    'name' => $product['category_name'],
                    'slug' => $product['category_slug'] ?? null
                ];
            }
        }

        // Fetch categories
        $catStmt = $db->query("SELECT id, name, slug, description, image_url, parent_id, sort_order, is_active FROM categories WHERE is_active = 1 ORDER BY sort_order");
        $categories = $catStmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $products,
            'categories' => $categories,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'totalPages' => ceil($total / $limit)
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        error_log('Failed to fetch products: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch products']);
    }
}

/**
 * Get a single product by ID
 */
function getProduct($db, $id) {
    try {
        $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.id = :id";
        
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $product = $stmt->fetch();

        if (!$product) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Product not found']);
            return;
        }

        // Parse JSON gallery and variations
        $product['image_gallery'] = json_decode($product['image_gallery'], true) ?? [];
        $product['variations'] = json_decode($product['variations'], true) ?? [];
        $product['is_featured'] = (bool)$product['is_featured'];
        $product['is_new'] = (bool)$product['is_new'];
        $product['price'] = (float)$product['price'];
        $product['rating'] = (float)$product['rating'];
        // Add category object for frontend compatibility
        if ($product['category_name']) {
            $product['category'] = [
                'id' => $product['category_id'],
                'name' => $product['category_name'],
                'slug' => $product['category_slug'] ?? null
            ];
        }

        // Get related products (same category, exclude current)
        $relatedSql = "SELECT id, name, price, image_main, is_featured, is_new 
                       FROM products 
                       WHERE category_id = :category_id AND id != :id 
                       LIMIT 4";
        $relatedStmt = $db->prepare($relatedSql);
        $relatedStmt->bindValue(':category_id', $product['category_id'], PDO::PARAM_INT);
        $relatedStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $relatedStmt->execute();
        $product['related_products'] = $relatedStmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $product
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        error_log('Failed to fetch product: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch product']);
    }
}

/**
 * Create a new product
 */
function createProduct($db) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Sanitize input
        if (is_array($data)) {
            $data = sanitizeInput($data);
        }

        // Validate required fields
        $required = ['name', 'price', 'category_id'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Field '$field' is required"]);
                return;
            }
        }

        $sql = "INSERT INTO products (name, slug, description, short_description, category_id, price, compare_price, cost_price, 
                image_main, image_gallery, variations, ingredients, volume, concentration, sku, barcode,
                notes_top, notes_middle, notes_base, stock_quantity, stock_status, low_stock_threshold,
                is_featured, is_new, is_on_sale, is_active) 
                VALUES (:name, :slug, :description, :short_description, :category_id, :price, :compare_price, :cost_price,
                :image_main, :image_gallery, :variations, :ingredients, :volume, :concentration, :sku, :barcode,
                :notes_top, :notes_middle, :notes_base, :stock_quantity, :stock_status, :low_stock_threshold,
                :is_featured, :is_new, :is_on_sale, :is_active)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':name' => $data['name'],
            ':slug' => $data['slug'] ?? strtolower(preg_replace('/[^a-z0-9]+/', '-', strtolower($data['name']))),
            ':description' => $data['description'] ?? null,
            ':short_description' => $data['short_description'] ?? null,
            ':category_id' => $data['category_id'] ?? null,
            ':price' => $data['price'],
            ':compare_price' => $data['compare_price'] ?? null,
            ':cost_price' => $data['cost_price'] ?? null,
            ':image_main' => $data['image_main'] ?? null,
            ':image_gallery' => json_encode($data['image_gallery'] ?? []),
            ':variations' => json_encode($data['variations'] ?? []),
            ':ingredients' => $data['ingredients'] ?? null,
            ':volume' => $data['volume'] ?? null,
            ':concentration' => $data['concentration'] ?? null,
            ':sku' => $data['sku'] ?? null,
            ':barcode' => $data['barcode'] ?? null,
            ':notes_top' => $data['notes_top'] ?? null,
            ':notes_middle' => $data['notes_middle'] ?? null,
            ':notes_base' => $data['notes_base'] ?? null,
            ':stock_quantity' => $data['stock_quantity'] ?? 0,
            ':stock_status' => $data['stock_status'] ?? 'in_stock',
            ':low_stock_threshold' => $data['low_stock_threshold'] ?? 10,
            ':is_featured' => $data['is_featured'] ?? false,
            ':is_new' => $data['is_new'] ?? false,
            ':is_on_sale' => $data['is_on_sale'] ?? false,
            ':is_active' => $data['is_active'] ?? true,
        ]);

        $productId = $db->lastInsertId();

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => ['id' => $productId]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        error_log('Failed to create product: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to create product']);
    }
}

/**
 * Update an existing product
 */
function updateProduct($db, $id) {
    try {
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);
        
        // Sanitize input
        if (is_array($data)) {
            $data = sanitizeInput($data);
        }
        
        // Debug: log what we received
        error_log("Update product $id - Raw input: " . $rawInput);
        error_log("Update product $id - Parsed data: " . print_r($data, true));

        if ($data === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON data', 'raw' => substr($rawInput, 0, 500)]);
            return;
        }

        // Build dynamic update query
        $fields = [];
        $params = [':id' => $id];

        $allowedFields = ['name', 'slug', 'description', 'short_description', 'category_id', 'price', 
                          'compare_price', 'cost_price', 'image_main', 'ingredients', 'volume', 
                          'concentration', 'sku', 'barcode', 'notes_top', 'notes_middle', 'notes_base',
                          'stock_quantity', 'stock_status', 'low_stock_threshold',
                          'is_featured', 'is_new', 'is_on_sale', 'is_active'];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (isset($data['image_gallery'])) {
            $fields[] = "image_gallery = :image_gallery";
            $params[':image_gallery'] = json_encode($data['image_gallery']);
        }

        // Handle variations JSON
        if (isset($data['variations'])) {
            $fields[] = "variations = :variations";
            $params[':variations'] = json_encode($data['variations']);
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No fields to update', 'received' => $data]);
            return;
        }

        // Always update the updated_at timestamp
        $fields[] = "updated_at = NOW()";

        $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        echo json_encode([
            'success' => true,
            'message' => 'Product updated successfully'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        error_log('Failed to update product: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to update product']);
    }
}

/**
 * Delete a product
 */
function deleteProduct($db, $id) {
    try {
        $stmt = $db->prepare("DELETE FROM products WHERE id = :id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Product not found']);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        error_log('Failed to delete product: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to delete product']);
    }
}
