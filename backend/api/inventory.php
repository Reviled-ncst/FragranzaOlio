<?php
/**
 * Inventory Management API
 * Handles stock-in, stock-out, transfers, and inventory queries
 */

// Send CORS headers immediately
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Email, Accept, Origin");
header("Access-Control-Max-Age: 86400");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'branches') {
                getBranches($db);
            } elseif ($action === 'stock-levels') {
                getStockLevels($db);
            } elseif ($action === 'transactions') {
                getTransactions($db);
            } elseif ($action === 'alerts') {
                getAlerts($db);
            } elseif ($action === 'dashboard') {
                getDashboardStats($db);
            } else {
                getInventoryOverview($db);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'stock-in') {
                stockIn($db, $data);
            } elseif ($action === 'stock-out') {
                stockOut($db, $data);
            } elseif ($action === 'transfer') {
                transferStock($db, $data);
            } elseif ($action === 'adjustment') {
                adjustStock($db, $data);
            } elseif ($action === 'branch') {
                createBranch($db, $data);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if ($action === 'complete-transfer') {
                completeTransfer($db, $data);
            } elseif ($action === 'cancel-transaction') {
                cancelTransaction($db, $data);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Generate unique transaction code
 */
function generateTransactionCode($type) {
    $prefix = [
        'stock_in' => 'SI',
        'stock_out' => 'SO',
        'transfer' => 'TR',
        'adjustment' => 'ADJ',
        'return' => 'RET',
        'damaged' => 'DMG'
    ];
    $code = $prefix[$type] ?? 'TXN';
    return $code . '-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
}

/**
 * Get all branches
 */
function getBranches($db) {
    $stmt = $db->query("SELECT * FROM branches WHERE is_active = TRUE ORDER BY is_warehouse DESC, name ASC");
    $branches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $branches]);
}

/**
 * Get stock levels (optionally filtered by branch)
 */
function getStockLevels($db) {
    $branchId = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : null;
    $productId = isset($_GET['product_id']) ? (int)$_GET['product_id'] : null;
    
    $sql = "SELECT 
                bi.id,
                bi.branch_id,
                b.name as branch_name,
                b.code as branch_code,
                b.is_warehouse,
                bi.product_id,
                p.name as product_name,
                p.sku as product_sku,
                p.image_main as product_image,
                p.price as product_price,
                bi.variation_id,
                bi.quantity,
                bi.min_quantity,
                bi.max_stock_level,
                bi.last_restocked,
                CASE 
                    WHEN bi.quantity = 0 THEN 'out_of_stock'
                    WHEN bi.quantity <= bi.min_quantity THEN 'low_stock'
                    WHEN bi.quantity >= bi.max_stock_level THEN 'overstock'
                    ELSE 'in_stock'
                END as stock_status
            FROM branch_inventory bi
            JOIN branches b ON bi.branch_id = b.id
            JOIN products p ON bi.product_id = p.id
            WHERE b.is_active = TRUE";
    
    $params = [];
    
    if ($branchId) {
        $sql .= " AND bi.branch_id = ?";
        $params[] = $branchId;
    }
    
    if ($productId) {
        $sql .= " AND bi.product_id = ?";
        $params[] = $productId;
    }
    
    $sql .= " ORDER BY b.name, p.name";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $stockLevels = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $stockLevels]);
}

/**
 * Get inventory transactions
 */
function getTransactions($db) {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $type = isset($_GET['type']) ? $_GET['type'] : null;
    $branchId = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : null;
    
    $sql = "SELECT 
                t.*,
                p.name as product_name,
                p.sku as product_sku,
                p.image_main as product_image,
                sb.name as source_branch_name,
                sb.code as source_branch_code,
                db.name as destination_branch_name,
                db.code as destination_branch_code,
                b.name as branch_name,
                b.code as branch_code
            FROM inventory_transactions t
            JOIN products p ON t.product_id = p.id
            LEFT JOIN branches sb ON t.source_branch_id = sb.id
            LEFT JOIN branches db ON t.destination_branch_id = db.id
            LEFT JOIN branches b ON t.branch_id = b.id
            WHERE 1=1";
    
    $params = [];
    
    if ($type) {
        $sql .= " AND t.transaction_type = ?";
        $params[] = $type;
    }
    
    if ($branchId) {
        $sql .= " AND (t.branch_id = ? OR t.source_branch_id = ? OR t.destination_branch_id = ?)";
        $params[] = $branchId;
        $params[] = $branchId;
        $params[] = $branchId;
    }
    
    $sql .= " ORDER BY t.created_at DESC LIMIT ?";
    $params[] = $limit;
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $transactions]);
}

/**
 * Stock In - Receive stock at a branch
 */
function stockIn($db, $data) {
    $required = ['branch_id', 'product_id', 'quantity'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            return;
        }
    }
    
    $db->beginTransaction();
    
    try {
        $transactionCode = generateTransactionCode('stock_in');
        
        // Insert transaction record
        $stmt = $db->prepare("INSERT INTO inventory_transactions 
            (transaction_code, transaction_type, product_id, variation_id, quantity, branch_id, 
             reference_type, reference_number, unit_cost, total_cost, supplier, remarks, reason, status, completed_at)
            VALUES (?, 'stock_in', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW())");
        
        $unitCost = isset($data['unit_cost']) ? $data['unit_cost'] : null;
        $totalCost = $unitCost ? $unitCost * $data['quantity'] : null;
        
        $stmt->execute([
            $transactionCode,
            $data['product_id'],
            $data['variation_id'] ?? null,
            $data['quantity'],
            $data['branch_id'],
            $data['reference_type'] ?? 'purchase_order',
            $data['reference_number'] ?? null,
            $unitCost,
            $totalCost,
            $data['supplier'] ?? null,
            $data['remarks'] ?? null,
            $data['reason'] ?? 'Stock received'
        ]);
        
        // Update or insert branch inventory
        $stmt = $db->prepare("INSERT INTO branch_inventory 
            (branch_id, product_id, variation_id, quantity, last_restocked)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
                quantity = quantity + VALUES(quantity),
                last_restocked = NOW()");
        
        $stmt->execute([
            $data['branch_id'],
            $data['product_id'],
            $data['variation_id'] ?? null,
            $data['quantity']
        ]);
        
        // Update main product stock (sum of all branches)
        updateMainProductStock($db, $data['product_id']);
        
        // Check and clear any out-of-stock alerts
        resolveStockAlerts($db, $data['branch_id'], $data['product_id']);
        
        $db->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Stock received successfully',
            'transaction_code' => $transactionCode,
            'quantity_added' => $data['quantity']
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Stock Out - Remove stock from a branch
 */
function stockOut($db, $data) {
    $required = ['branch_id', 'product_id', 'quantity', 'reason'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            return;
        }
    }
    
    $db->beginTransaction();
    
    try {
        // Check current stock
        $stmt = $db->prepare("SELECT quantity FROM branch_inventory 
            WHERE branch_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))");
        $stmt->execute([$data['branch_id'], $data['product_id'], $data['variation_id'] ?? null, $data['variation_id'] ?? null]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$current || $current['quantity'] < $data['quantity']) {
            $db->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Insufficient stock', 'available' => $current['quantity'] ?? 0]);
            return;
        }
        
        $transactionCode = generateTransactionCode('stock_out');
        
        // Insert transaction record
        $stmt = $db->prepare("INSERT INTO inventory_transactions 
            (transaction_code, transaction_type, product_id, variation_id, quantity, branch_id, 
             reference_type, reference_number, remarks, reason, status, completed_at)
            VALUES (?, 'stock_out', ?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW())");
        
        $stmt->execute([
            $transactionCode,
            $data['product_id'],
            $data['variation_id'] ?? null,
            $data['quantity'],
            $data['branch_id'],
            $data['reference_type'] ?? 'other',
            $data['reference_number'] ?? null,
            $data['remarks'] ?? null,
            $data['reason']
        ]);
        
        // Update branch inventory
        $stmt = $db->prepare("UPDATE branch_inventory 
            SET quantity = quantity - ? 
            WHERE branch_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))");
        
        $stmt->execute([
            $data['quantity'],
            $data['branch_id'],
            $data['product_id'],
            $data['variation_id'] ?? null,
            $data['variation_id'] ?? null
        ]);
        
        // Update main product stock
        updateMainProductStock($db, $data['product_id']);
        
        // Check for low stock alerts
        checkAndCreateAlerts($db, $data['branch_id'], $data['product_id']);
        
        $db->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Stock removed successfully',
            'transaction_code' => $transactionCode,
            'quantity_removed' => $data['quantity']
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Transfer Stock between branches
 */
function transferStock($db, $data) {
    $required = ['source_branch_id', 'destination_branch_id', 'product_id', 'quantity'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            return;
        }
    }
    
    if ($data['source_branch_id'] == $data['destination_branch_id']) {
        http_response_code(400);
        echo json_encode(['error' => 'Source and destination branches must be different']);
        return;
    }
    
    $db->beginTransaction();
    
    try {
        // Check source branch stock
        $stmt = $db->prepare("SELECT quantity FROM branch_inventory 
            WHERE branch_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))");
        $stmt->execute([$data['source_branch_id'], $data['product_id'], $data['variation_id'] ?? null, $data['variation_id'] ?? null]);
        $sourceStock = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$sourceStock || $sourceStock['quantity'] < $data['quantity']) {
            $db->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Insufficient stock at source branch', 'available' => $sourceStock['quantity'] ?? 0]);
            return;
        }
        
        $transactionCode = generateTransactionCode('transfer');
        $status = isset($data['immediate']) && $data['immediate'] ? 'completed' : 'in_transit';
        
        // Insert transfer transaction
        $stmt = $db->prepare("INSERT INTO inventory_transactions 
            (transaction_code, transaction_type, product_id, variation_id, quantity, 
             source_branch_id, destination_branch_id, reference_type, reference_number, remarks, reason, status, completed_at)
            VALUES (?, 'transfer', ?, ?, ?, ?, ?, 'transfer_order', ?, ?, ?, ?, ?)");
        
        $stmt->execute([
            $transactionCode,
            $data['product_id'],
            $data['variation_id'] ?? null,
            $data['quantity'],
            $data['source_branch_id'],
            $data['destination_branch_id'],
            $data['reference_number'] ?? $transactionCode,
            $data['remarks'] ?? null,
            $data['reason'] ?? 'Stock transfer between branches',
            $status,
            $status === 'completed' ? date('Y-m-d H:i:s') : null
        ]);
        
        // Deduct from source
        $stmt = $db->prepare("UPDATE branch_inventory 
            SET quantity = quantity - ? 
            WHERE branch_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))");
        
        $stmt->execute([
            $data['quantity'],
            $data['source_branch_id'],
            $data['product_id'],
            $data['variation_id'] ?? null,
            $data['variation_id'] ?? null
        ]);
        
        // If immediate transfer, add to destination
        if ($status === 'completed') {
            $stmt = $db->prepare("INSERT INTO branch_inventory 
                (branch_id, product_id, variation_id, quantity, last_restocked)
                VALUES (?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                    quantity = quantity + VALUES(quantity),
                    last_restocked = NOW()");
            
            $stmt->execute([
                $data['destination_branch_id'],
                $data['product_id'],
                $data['variation_id'] ?? null,
                $data['quantity']
            ]);
        }
        
        // Check alerts
        checkAndCreateAlerts($db, $data['source_branch_id'], $data['product_id']);
        
        $db->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => $status === 'completed' ? 'Stock transferred successfully' : 'Transfer initiated - awaiting confirmation',
            'transaction_code' => $transactionCode,
            'status' => $status,
            'quantity_transferred' => $data['quantity']
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Complete a pending transfer
 */
function completeTransfer($db, $data) {
    if (!isset($data['transaction_code'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Transaction code required']);
        return;
    }
    
    $db->beginTransaction();
    
    try {
        // Get transfer details
        $stmt = $db->prepare("SELECT * FROM inventory_transactions 
            WHERE transaction_code = ? AND transaction_type = 'transfer' AND status = 'in_transit'");
        $stmt->execute([$data['transaction_code']]);
        $transfer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$transfer) {
            $db->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Transfer not found or already completed']);
            return;
        }
        
        // Add to destination
        $stmt = $db->prepare("INSERT INTO branch_inventory 
            (branch_id, product_id, variation_id, quantity, last_restocked)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
                quantity = quantity + VALUES(quantity),
                last_restocked = NOW()");
        
        $stmt->execute([
            $transfer['destination_branch_id'],
            $transfer['product_id'],
            $transfer['variation_id'],
            $transfer['quantity']
        ]);
        
        // Update transfer status
        $stmt = $db->prepare("UPDATE inventory_transactions 
            SET status = 'completed', completed_at = NOW(), remarks = CONCAT(IFNULL(remarks, ''), ' | Received: ', ?)
            WHERE transaction_code = ?");
        $stmt->execute([$data['received_remarks'] ?? 'Confirmed', $data['transaction_code']]);
        
        // Resolve alerts at destination
        resolveStockAlerts($db, $transfer['destination_branch_id'], $transfer['product_id']);
        
        $db->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Transfer completed successfully'
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Adjust stock (for corrections/counts)
 */
function adjustStock($db, $data) {
    $required = ['branch_id', 'product_id', 'new_quantity', 'reason'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            return;
        }
    }
    
    $db->beginTransaction();
    
    try {
        // Get current quantity
        $stmt = $db->prepare("SELECT quantity FROM branch_inventory 
            WHERE branch_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))");
        $stmt->execute([$data['branch_id'], $data['product_id'], $data['variation_id'] ?? null, $data['variation_id'] ?? null]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        $currentQty = $current['quantity'] ?? 0;
        
        $difference = $data['new_quantity'] - $currentQty;
        
        if ($difference == 0) {
            echo json_encode(['success' => true, 'message' => 'No adjustment needed']);
            return;
        }
        
        $transactionCode = generateTransactionCode('adjustment');
        
        // Insert adjustment transaction
        $stmt = $db->prepare("INSERT INTO inventory_transactions 
            (transaction_code, transaction_type, product_id, variation_id, quantity, branch_id, 
             remarks, reason, status, completed_at)
            VALUES (?, 'adjustment', ?, ?, ?, ?, ?, ?, 'completed', NOW())");
        
        $stmt->execute([
            $transactionCode,
            $data['product_id'],
            $data['variation_id'] ?? null,
            $difference,
            $data['branch_id'],
            $data['remarks'] ?? "Adjusted from $currentQty to {$data['new_quantity']}",
            $data['reason']
        ]);
        
        // Update inventory
        $stmt = $db->prepare("INSERT INTO branch_inventory 
            (branch_id, product_id, variation_id, quantity)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = ?");
        
        $stmt->execute([
            $data['branch_id'],
            $data['product_id'],
            $data['variation_id'] ?? null,
            $data['new_quantity'],
            $data['new_quantity']
        ]);
        
        updateMainProductStock($db, $data['product_id']);
        checkAndCreateAlerts($db, $data['branch_id'], $data['product_id']);
        
        $db->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Stock adjusted successfully',
            'transaction_code' => $transactionCode,
            'previous_quantity' => $currentQty,
            'new_quantity' => $data['new_quantity'],
            'difference' => $difference
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Get dashboard statistics
 */
function getDashboardStats($db) {
    $stats = [];
    
    // Total stock value
    $stmt = $db->query("SELECT SUM(bi.quantity * p.price) as total_value, SUM(bi.quantity) as total_units
        FROM branch_inventory bi 
        JOIN products p ON bi.product_id = p.id");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['total_value'] = floatval($result['total_value'] ?? 0);
    $stats['total_units'] = intval($result['total_units'] ?? 0);
    
    // Stock status counts
    $stmt = $db->query("SELECT 
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN quantity > 0 AND quantity <= min_quantity THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN quantity > min_quantity THEN 1 ELSE 0 END) as in_stock
        FROM branch_inventory");
    $stats['stock_status'] = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Branch count
    $stmt = $db->query("SELECT COUNT(*) as count FROM branches WHERE is_active = TRUE");
    $stats['branch_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Recent transactions
    $stmt = $db->query("SELECT transaction_type, COUNT(*) as count 
        FROM inventory_transactions 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY transaction_type");
    $stats['recent_transactions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Pending transfers
    $stmt = $db->query("SELECT COUNT(*) as count FROM inventory_transactions 
        WHERE transaction_type = 'transfer' AND status = 'in_transit'");
    $stats['pending_transfers'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo json_encode(['success' => true, 'data' => $stats]);
}

/**
 * Get alerts
 */
function getAlerts($db) {
    $stmt = $db->query("SELECT 
        a.*,
        b.name as branch_name,
        b.code as branch_code,
        p.name as product_name,
        p.sku as product_sku
        FROM stock_alerts a
        JOIN branches b ON a.branch_id = b.id
        JOIN products p ON a.product_id = p.id
        WHERE a.is_resolved = FALSE
        ORDER BY a.created_at DESC");
    
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

/**
 * Get inventory overview
 */
function getInventoryOverview($db) {
    // Get all products with their total stock across branches
    $stmt = $db->query("SELECT 
        p.id,
        p.name,
        p.sku,
        p.image_main,
        p.price,
        p.stock_quantity as total_stock,
        c.name as category_name,
        (SELECT COUNT(DISTINCT branch_id) FROM branch_inventory WHERE product_id = p.id AND quantity > 0) as branches_with_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
        ORDER BY p.name");
    
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

/**
 * Update main product stock (sum of all branches)
 */
function updateMainProductStock($db, $productId) {
    $stmt = $db->prepare("UPDATE products SET 
        stock_quantity = (SELECT COALESCE(SUM(quantity), 0) FROM branch_inventory WHERE product_id = ?),
        stock_status = CASE 
            WHEN (SELECT COALESCE(SUM(quantity), 0) FROM branch_inventory WHERE product_id = ?) = 0 THEN 'out_of_stock'
            WHEN (SELECT COALESCE(SUM(quantity), 0) FROM branch_inventory WHERE product_id = ?) <= 5 THEN 'low_stock'
            ELSE 'in_stock'
        END
        WHERE id = ?");
    $stmt->execute([$productId, $productId, $productId, $productId]);
}

/**
 * Check and create stock alerts
 */
function checkAndCreateAlerts($db, $branchId, $productId) {
    $stmt = $db->prepare("SELECT * FROM branch_inventory WHERE branch_id = ? AND product_id = ?");
    $stmt->execute([$branchId, $productId]);
    $inventory = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$inventory) return;
    
    $alertType = null;
    if ($inventory['quantity'] == 0) {
        $alertType = 'out_of_stock';
    } elseif ($inventory['quantity'] <= $inventory['min_quantity']) {
        $alertType = 'low_stock';
    }
    
    if ($alertType) {
        // Check if unresolved alert already exists
        $stmt = $db->prepare("SELECT id FROM stock_alerts 
            WHERE branch_id = ? AND product_id = ? AND alert_type = ? AND is_resolved = FALSE");
        $stmt->execute([$branchId, $productId, $alertType]);
        
        if (!$stmt->fetch()) {
            $stmt = $db->prepare("INSERT INTO stock_alerts 
                (branch_id, product_id, variation_id, alert_type, current_quantity, threshold_quantity)
                VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $branchId,
                $productId,
                $inventory['variation_id'],
                $alertType,
                $inventory['quantity'],
                $inventory['min_quantity']
            ]);
        }
    }
}

/**
 * Resolve stock alerts
 */
function resolveStockAlerts($db, $branchId, $productId) {
    $stmt = $db->prepare("UPDATE stock_alerts 
        SET is_resolved = TRUE, resolved_at = NOW() 
        WHERE branch_id = ? AND product_id = ? AND is_resolved = FALSE");
    $stmt->execute([$branchId, $productId]);
}

/**
 * Create a new branch
 */
function createBranch($db, $data) {
    $required = ['name', 'code'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            return;
        }
    }
    
    $stmt = $db->prepare("INSERT INTO branches 
        (name, code, address, city, contact_person, contact_phone, contact_email, is_warehouse)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([
        $data['name'],
        strtoupper($data['code']),
        $data['address'] ?? null,
        $data['city'] ?? null,
        $data['contact_person'] ?? null,
        $data['contact_phone'] ?? null,
        $data['contact_email'] ?? null,
        isset($data['is_warehouse']) ? $data['is_warehouse'] : false
    ]);
    
    echo json_encode([
        'success' => true, 
        'message' => 'Branch created successfully',
        'id' => $db->lastInsertId()
    ]);
}
