<?php
/**
 * Sales API
 * Handles orders, customers, invoices, complaints, and analytics
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
            handleGetRequests($db, $action);
            break;
        
        case 'POST':
            handlePostRequests($db, $action);
            break;
        
        case 'PUT':
            handlePutRequests($db, $action);
            break;
        
        case 'DELETE':
            handleDeleteRequests($db, $action);
            break;
        
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function handleGetRequests($db, $action) {
    switch ($action) {
        case 'orders':
            getOrders($db);
            break;
        case 'order':
            getOrder($db, $_GET['id'] ?? null);
            break;
        case 'track_order':
            trackOrder($db, $_GET['order_number'] ?? null, $_GET['email'] ?? null);
            break;
        case 'customers':
            getCustomers($db);
            break;
        case 'customer':
            getCustomer($db, $_GET['id'] ?? null);
            break;
        case 'invoices':
            getInvoices($db);
            break;
        case 'invoice':
            getInvoice($db, $_GET['id'] ?? null, $_GET['order_id'] ?? null);
            break;
        case 'complaints':
            getComplaints($db);
            break;
        case 'complaint':
            getComplaint($db, $_GET['id'] ?? null);
            break;
        case 'analytics':
            getAnalytics($db);
            break;
        case 'dashboard':
            getDashboardStats($db);
            break;
        case 'settings':
            getUserSettings($db, $_GET['user_id'] ?? null);
            break;
        case 'reviews':
        case 'product-reviews':
            getProductReviews($db, $_GET['product_id'] ?? null);
            break;
        case 'order_reviews':
        case 'order-reviews':
            getOrderReviewStatus($db, $_GET['order_id'] ?? null);
            break;
        default:
            getDashboardStats($db);
    }
}
function handlePostRequests($db, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'order':
            createOrder($db, $data);
            break;
        case 'review':
            createReview($db, $data);
            break;
        case 'reviews':
            createReviewsBatch($db, $data);
            break;
        case 'customer':
            createCustomer($db, $data);
            break;
        case 'invoice':
            createInvoice($db, $data);
            break;
        case 'complaint':
            createComplaint($db, $data);
            break;
        case 'complaint-message':
            addComplaintMessage($db, $data);
            break;
        case 'settings':
            saveUserSettings($db, $data);
            break;
        case 'change_password':
            changePassword($db, $data);
            break;
        case 'customer-verify-order':
            customerVerifyOrder($db, $data);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

function handlePutRequests($db, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'order':
            updateOrder($db, $data);
            break;
        case 'order-status':
            updateOrderStatus($db, $data);
            break;
        case 'customer':
            updateCustomer($db, $data);
            break;
        case 'invoice':
            updateInvoice($db, $data);
            break;
        case 'invoice-status':
            updateInvoiceStatus($db, $data);
            break;
        case 'complaint':
            updateComplaint($db, $data);
            break;
        case 'complaint-status':
            updateComplaintStatus($db, $data);
            break;
        case 'settings':
            saveUserSettings($db, $data);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

function handleDeleteRequests($db, $action) {
    $id = $_GET['id'] ?? null;
    
    switch ($action) {
        case 'order':
            deleteOrder($db, $id);
            break;
        case 'customer':
            deleteCustomer($db, $id);
            break;
        case 'invoice':
            deleteInvoice($db, $id);
            break;
        case 'complaint':
            deleteComplaint($db, $id);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// =====================================================
// ORDERS
// =====================================================

// Auto-complete delivered/picked_up orders after 7 days
function autoCompleteDeliveredOrders($db) {
    try {
        // First, find orders to auto-complete
        $findStmt = $db->prepare("
            SELECT id FROM orders 
            WHERE status IN ('delivered', 'picked_up') 
            AND updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        $findStmt->execute();
        $orderIds = $findStmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($orderIds) === 0) {
            return 0;
        }
        
        // Update each order
        foreach ($orderIds as $orderId) {
            $updateStmt = $db->prepare("
                UPDATE orders 
                SET status = 'completed', 
                    updated_at = NOW(),
                    notes = CONCAT(COALESCE(notes, ''), ' [Auto-completed after 7 days]')
                WHERE id = :id
            ");
            $updateStmt->execute([':id' => $orderId]);
            
            // Add to status history
            $historyStmt = $db->prepare("
                INSERT INTO order_status_history (order_id, status, note, changed_by)
                VALUES (:order_id, 'completed', 'Auto-completed after 7 days', 'system')
            ");
            $historyStmt->execute([':order_id' => $orderId]);
        }
        
        return count($orderIds);
    } catch (Exception $e) {
        // Silent fail - don't break order loading
        return 0;
    }
}

function getOrders($db) {
    // Auto-complete old delivered orders
    autoCompleteDeliveredOrders($db);
    
    $status = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? null;
    $customerEmail = $_GET['customer_email'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    $sql = "SELECT o.*, 
            c.first_name as customer_first_name, 
            c.last_name as customer_last_name,
            c.email as customer_email,
            c.phone as customer_phone,
            i.invoice_number,
            i.id as invoice_id,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN invoices i ON i.order_id = o.id
            WHERE 1=1";
    $params = [];
    
    // Filter by customer email (for customer-facing orders)
    if ($customerEmail) {
        $sql .= " AND (c.email = :customer_email OR o.shipping_email = :customer_email2)";
        $params[':customer_email'] = $customerEmail;
        $params[':customer_email2'] = $customerEmail;
    }
    
    if ($status && $status !== 'all') {
        $sql .= " AND o.status = :status";
        $params[':status'] = $status;
    }
    
    if ($search) {
        $sql .= " AND (o.order_number LIKE :search OR c.first_name LIKE :search2 OR c.last_name LIKE :search3 OR c.email LIKE :search4)";
        $params[':search'] = "%$search%";
        $params[':search2'] = "%$search%";
        $params[':search3'] = "%$search%";
        $params[':search4'] = "%$search%";
    }
    
    $sql .= " ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get order items for each order and process them
    foreach ($orders as &$order) {
        $stmt = $db->prepare("SELECT * FROM order_items WHERE order_id = :order_id");
        $stmt->execute([':order_id' => $order['id']]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process items to extract image from product_snapshot and map field names
        foreach ($items as &$item) {
            if (!empty($item['product_snapshot'])) {
                $snapshot = json_decode($item['product_snapshot'], true);
                if ($snapshot && !empty($snapshot['image'])) {
                    $item['image'] = $snapshot['image'];
                }
            }
            // Map unit_price to price for frontend compatibility
            $item['price'] = $item['unit_price'] ?? 0;
            $item['total'] = $item['total_price'] ?? 0;
        }
        
        $order['items'] = $items;
        
        // Map database fields to frontend expected format
        $order['customer_name'] = trim(($order['shipping_first_name'] ?? '') . ' ' . ($order['shipping_last_name'] ?? ''));
        $order['customer_email'] = $order['customer_email'] ?? $order['shipping_email'] ?? '';
        $order['customer_phone'] = $order['customer_phone'] ?? $order['shipping_phone'] ?? '';
        
        // Extract shipping method from notes if available
        if (!empty($order['shipping_notes']) && strpos($order['shipping_notes'], 'Shipping:') === 0) {
            preg_match('/Shipping: (\w+)/', $order['shipping_notes'], $matches);
            if (!empty($matches[1])) {
                $order['shipping_method'] = $matches[1];
            }
            preg_match('/\((\w+)\)/', $order['shipping_notes'], $vehicleMatches);
            if (!empty($vehicleMatches[1])) {
                $order['vehicle_type'] = $vehicleMatches[1];
            }
        }
    }
    
    // Get total count
    $countSql = "SELECT COUNT(*) FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE 1=1";
    if ($customerEmail) {
        $countSql .= " AND (c.email = '$customerEmail' OR o.shipping_email = '$customerEmail')";
    }
    if ($status && $status !== 'all') {
        $countSql .= " AND o.status = '$status'";
    }
    $totalCount = $db->query($countSql)->fetchColumn();
    
    // Get stats
    $stats = [
        'total' => $db->query("SELECT COUNT(*) FROM orders")->fetchColumn(),
        'pending' => $db->query("SELECT COUNT(*) FROM orders WHERE status = 'pending'")->fetchColumn(),
        'processing' => $db->query("SELECT COUNT(*) FROM orders WHERE status = 'processing'")->fetchColumn(),
        'shipped' => $db->query("SELECT COUNT(*) FROM orders WHERE status = 'shipped'")->fetchColumn(),
        'delivered' => $db->query("SELECT COUNT(*) FROM orders WHERE status = 'delivered'")->fetchColumn(),
        'cancelled' => $db->query("SELECT COUNT(*) FROM orders WHERE status = 'cancelled'")->fetchColumn(),
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $orders,
        'stats' => $stats,
        'pagination' => [
            'total' => (int)$totalCount,
            'limit' => $limit,
            'offset' => $offset
        ]
    ]);
}

function getOrder($db, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID required']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT o.*, 
            c.first_name as customer_first_name, 
            c.last_name as customer_last_name,
            c.email as customer_email,
            c.phone as customer_phone,
            i.invoice_number,
            i.id as invoice_id
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN invoices i ON i.order_id = o.id
        WHERE o.id = :id
    ");
    $stmt->execute([':id' => $id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        return;
    }
    
    // Get order items
    $stmt = $db->prepare("SELECT * FROM order_items WHERE order_id = :order_id");
    $stmt->execute([':order_id' => $id]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Process items to extract image from product_snapshot and map field names
    foreach ($items as &$item) {
        if (!empty($item['product_snapshot'])) {
            $snapshot = json_decode($item['product_snapshot'], true);
            if ($snapshot && !empty($snapshot['image'])) {
                $item['image'] = $snapshot['image'];
            }
        }
        // Map unit_price to price for frontend compatibility
        $item['price'] = $item['unit_price'] ?? 0;
        $item['total'] = $item['total_price'] ?? 0;
    }
    
    $order['items'] = $items;
    
    // Map database fields to frontend expected format
    $order['customer_name'] = trim(($order['shipping_first_name'] ?? '') . ' ' . ($order['shipping_last_name'] ?? ''));
    if (empty($order['customer_email'])) {
        $order['customer_email'] = $order['shipping_email'] ?? '';
    }
    if (empty($order['customer_phone'])) {
        $order['customer_phone'] = $order['shipping_phone'] ?? '';
    }
    
    echo json_encode(['success' => true, 'data' => $order]);
}

/**
 * Track order by order number and email (for guests)
 */
function trackOrder($db, $orderNumber, $email) {
    if (!$orderNumber || !$email) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order number and email are required']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT o.*, 
            i.invoice_number,
            i.id as invoice_id
        FROM orders o
        LEFT JOIN invoices i ON i.order_id = o.id
        WHERE o.order_number = :order_number 
        AND (o.shipping_email = :email OR EXISTS (
            SELECT 1 FROM customers c WHERE c.id = o.customer_id AND c.email = :email2
        ))
    ");
    $stmt->execute([
        ':order_number' => $orderNumber,
        ':email' => $email,
        ':email2' => $email
    ]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found. Please check your order number and email.']);
        return;
    }
    
    // Get order items
    $stmt = $db->prepare("SELECT * FROM order_items WHERE order_id = :order_id");
    $stmt->execute([':order_id' => $order['id']]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Process items and map field names
    foreach ($items as &$item) {
        if (!empty($item['product_snapshot'])) {
            $snapshot = json_decode($item['product_snapshot'], true);
            if ($snapshot && !empty($snapshot['image'])) {
                $item['image'] = $snapshot['image'];
            }
        }
        // Map unit_price to price for frontend compatibility
        $item['price'] = $item['unit_price'] ?? 0;
        $item['total'] = $item['total_price'] ?? 0;
    }
    
    $order['items'] = $items;
    $order['customer_name'] = trim(($order['shipping_first_name'] ?? '') . ' ' . ($order['shipping_last_name'] ?? ''));
    
    echo json_encode(['success' => true, 'data' => $order]);
}

function createOrder($db, $data) {
    try {
        $db->beginTransaction();
        
        // Generate order number (format: FO-YYMMDD-XXXX for Fragranza Orders)
        $orderNumber = 'FO-' . date('ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        // Check if order number exists, regenerate if needed
        $checkStmt = $db->prepare("SELECT COUNT(*) FROM orders WHERE order_number = :order_number");
        $checkStmt->execute([':order_number' => $orderNumber]);
        while ($checkStmt->fetchColumn() > 0) {
            $orderNumber = 'FO-' . date('ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $checkStmt->execute([':order_number' => $orderNumber]);
        }
        
        // Parse customer name if provided as single field
        $firstName = $data['shipping_first_name'] ?? '';
        $lastName = $data['shipping_last_name'] ?? '';
        if (empty($firstName) && !empty($data['customer_name'])) {
            $nameParts = explode(' ', $data['customer_name'], 2);
            $firstName = $nameParts[0] ?? '';
            $lastName = $nameParts[1] ?? '';
        }
        
        // Get customer email from various sources
        $customerEmail = $data['shipping_email'] ?? $data['customer_email'] ?? '';
        $customerPhone = $data['shipping_phone'] ?? $data['customer_phone'] ?? '';
        
        // Handle shipping address
        $shippingAddress = $data['shipping_address'] ?? '';
        $shippingCity = $data['shipping_city'] ?? '';
        $shippingProvince = $data['shipping_province'] ?? '';
        $shippingZip = $data['shipping_zip_code'] ?? $data['shipping_zip'] ?? '';
        
        // Handle notes - could be shipping_notes or just notes
        $notes = $data['shipping_notes'] ?? $data['notes'] ?? '';
        
        // Add shipping method and vehicle type to notes if provided
        if (!empty($data['shipping_method'])) {
            $notes = "Shipping: " . $data['shipping_method'];
            if (!empty($data['vehicle_type'])) {
                $notes .= " (" . $data['vehicle_type'] . ")";
            }
            if (!empty($data['notes'])) {
                $notes .= "\n" . $data['notes'];
            }
        }
        
        $stmt = $db->prepare("
            INSERT INTO orders (
                order_number, customer_id, user_id, subtotal, discount_amount, shipping_fee, 
                tax_amount, total_amount, status, payment_status, payment_method,
                shipping_first_name, shipping_last_name, shipping_email, shipping_phone,
                shipping_address, shipping_city, shipping_province, shipping_zip_code, shipping_notes
            ) VALUES (
                :order_number, :customer_id, :user_id, :subtotal, :discount_amount, :shipping_fee,
                :tax_amount, :total_amount, :status, :payment_status, :payment_method,
                :shipping_first_name, :shipping_last_name, :shipping_email, :shipping_phone,
                :shipping_address, :shipping_city, :shipping_province, :shipping_zip_code, :shipping_notes
            )
        ");
        
        $stmt->execute([
            ':order_number' => $orderNumber,
            ':customer_id' => $data['customer_id'] ?? null,
            ':user_id' => $data['user_id'] ?? null,
            ':subtotal' => $data['subtotal'] ?? 0,
            ':discount_amount' => $data['discount_amount'] ?? 0,
            ':shipping_fee' => $data['shipping_fee'] ?? 0,
            ':tax_amount' => $data['tax_amount'] ?? 0,
            ':total_amount' => $data['total_amount'] ?? 0,
            ':status' => $data['status'] ?? 'pending',
            ':payment_status' => $data['payment_status'] ?? 'pending',
            ':payment_method' => $data['payment_method'] ?? 'cod',
            ':shipping_first_name' => $firstName,
            ':shipping_last_name' => $lastName,
            ':shipping_email' => $customerEmail,
            ':shipping_phone' => $customerPhone,
            ':shipping_address' => $shippingAddress,
            ':shipping_city' => $shippingCity,
            ':shipping_province' => $shippingProvince,
            ':shipping_zip_code' => $shippingZip,
            ':shipping_notes' => $notes
        ]);
        
        $orderId = $db->lastInsertId();
        
        // Insert order items
        if (!empty($data['items'])) {
            $itemStmt = $db->prepare("
                INSERT INTO order_items (order_id, product_id, product_name, product_sku, variation, quantity, unit_price, total_price, product_snapshot)
                VALUES (:order_id, :product_id, :product_name, :product_sku, :variation, :quantity, :unit_price, :total_price, :product_snapshot)
            ");
            
            foreach ($data['items'] as $item) {
                $unitPrice = $item['unit_price'] ?? $item['price'] ?? 0;
                $quantity = $item['quantity'] ?? 1;
                $totalPrice = $item['total_price'] ?? ($unitPrice * $quantity);
                
                // Store image and other data in product_snapshot JSON
                $snapshot = json_encode([
                    'image' => $item['image'] ?? $item['product_image'] ?? null,
                    'original_price' => $unitPrice,
                    'variation' => $item['variation'] ?? null
                ]);
                
                $itemStmt->execute([
                    ':order_id' => $orderId,
                    ':product_id' => $item['product_id'] ?? null,
                    ':product_name' => $item['product_name'] ?? $item['name'] ?? 'Unknown Product',
                    ':product_sku' => $item['product_sku'] ?? $item['sku'] ?? null,
                    ':variation' => $item['variation'] ?? null,
                    ':quantity' => $quantity,
                    ':unit_price' => $unitPrice,
                    ':total_price' => $totalPrice,
                    ':product_snapshot' => $snapshot
                ]);
            }
        }
        
        // Auto-create invoice
        $invoiceNumber = 'INV-' . date('ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        $invoiceStmt = $db->prepare("
            INSERT INTO invoices (
                invoice_number, order_id, customer_id, subtotal, discount_amount,
                tax_amount, total_amount, status, issue_date, due_date,
                billing_name, billing_email, billing_phone, billing_address
            ) VALUES (
                :invoice_number, :order_id, :customer_id, :subtotal, :discount_amount,
                :tax_amount, :total_amount, :status, :issue_date, :due_date,
                :billing_name, :billing_email, :billing_phone, :billing_address
            )
        ");
        
        $invoiceStmt->execute([
            ':invoice_number' => $invoiceNumber,
            ':order_id' => $orderId,
            ':customer_id' => $data['customer_id'] ?? null,
            ':subtotal' => $data['subtotal'] ?? 0,
            ':discount_amount' => $data['discount_amount'] ?? 0,
            ':tax_amount' => $data['tax_amount'] ?? 0,
            ':total_amount' => $data['total_amount'] ?? 0,
            ':status' => 'sent',
            ':issue_date' => date('Y-m-d'),
            ':due_date' => date('Y-m-d', strtotime('+7 days')),
            ':billing_name' => trim($firstName . ' ' . $lastName),
            ':billing_email' => $customerEmail,
            ':billing_phone' => $customerPhone,
            ':billing_address' => $shippingAddress
        ]);
        
        // Update customer stats if customer_id exists
        if (!empty($data['customer_id'])) {
            $db->prepare("
                UPDATE customers 
                SET total_orders = total_orders + 1, 
                    total_spent = total_spent + :amount,
                    last_order_date = CURDATE()
                WHERE id = :customer_id
            ")->execute([':amount' => $data['total_amount'], ':customer_id' => $data['customer_id']]);
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Order created successfully',
            'data' => [
                'id' => $orderId, 
                'order_number' => $orderNumber,
                'invoice_number' => $invoiceNumber
            ]
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

function updateOrderStatus($db, $data) {
    error_log("updateOrderStatus called with: " . json_encode($data));
    
    if (empty($data['id']) || empty($data['status'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID and status required']);
        return;
    }
    
    $orderId = intval($data['id']); // Ensure it's an integer
    $newStatus = trim($data['status']);
    $salesRepId = $data['processed_by'] ?? $data['sales_rep_id'] ?? $data['user_id'] ?? null;
    
    // Validate status is a valid value
    $validStatuses = ['pending', 'ordered', 'confirmed', 'ready', 'paid_waiting_approval', 'cod_waiting_approval', 'paid_ready_pickup', 
                      'processing', 'in_transit', 'waiting_client', 'delivered', 'picked_up', 
                      'completed', 'cancelled', 'return_requested', 'return_approved', 'returned', 
                      'refund_requested', 'refunded'];
    
    if (!in_array($newStatus, $validStatuses)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid status: ' . $newStatus]);
        return;
    }
    
    error_log("Updating order $orderId to status: $newStatus by sales rep: $salesRepId");
    
    $sql = "UPDATE orders SET status = :status";
    $params = [':id' => $orderId, ':status' => $newStatus];
    
    // Update payment status if provided
    if (!empty($data['payment_status'])) {
        $sql .= ", payment_status = :payment_status";
        $params[':payment_status'] = $data['payment_status'];
    }
    
    // Add tracking URL if provided (for Lalamove/courier links)
    if (!empty($data['tracking_url'])) {
        $sql .= ", tracking_url = :tracking_url";
        $params[':tracking_url'] = $data['tracking_url'];
    }
    
    // Add courier name if provided
    if (!empty($data['courier_name'])) {
        $sql .= ", courier_name = :courier_name";
        $params[':courier_name'] = $data['courier_name'];
    }
    
    // Add estimated delivery if provided
    if (!empty($data['estimated_delivery'])) {
        $sql .= ", estimated_delivery = :estimated_delivery";
        $params[':estimated_delivery'] = $data['estimated_delivery'];
    }
    
    // For COD/COP orders, auto-mark as paid when delivered/picked_up/completed
    if (in_array($newStatus, ['delivered', 'picked_up', 'completed']) && empty($data['payment_status'])) {
        $checkStmt = $db->prepare("SELECT payment_method FROM orders WHERE id = :id");
        $checkStmt->execute([':id' => $orderId]);
        $order = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($order && in_array($order['payment_method'], ['cod', 'cop', 'store_payment', 'COD'])) {
            $sql .= ", payment_status = 'paid'";
        }
    }
    
    // Handle in_transit status with tracking info
    if ($newStatus === 'in_transit' && !empty($data['tracking_number'])) {
        $sql .= ", tracking_number = :tracking, courier = :courier, shipped_at = NOW()";
        $params[':tracking'] = $data['tracking_number'];
        $params[':courier'] = $data['courier'] ?? $data['courier_name'] ?? null;
    }
    
    // Set delivered_at timestamp
    if ($newStatus === 'delivered' || $newStatus === 'picked_up') {
        $sql .= ", delivered_at = NOW()";
        // Track sales rep who completed the pickup/delivery
        if ($salesRepId) {
            $sql .= ", processed_by = :processed_by, processed_at = NOW()";
            $params[':processed_by'] = $salesRepId;
        }
    }
    
    // When order is confirmed/processing/picked_up, deduct stock and log inventory transaction
    if (in_array($newStatus, ['confirmed', 'processing', 'picked_up', 'delivered'])) {
        // Track sales rep who processed the order
        if ($salesRepId && !isset($params[':processed_by'])) {
            $sql .= ", processed_by = :processed_by, processed_at = NOW()";
            $params[':processed_by'] = $salesRepId;
        }
        
        // Deduct stock for each order item
        try {
            // First check if stock was already deducted (to prevent double deduction)
            $checkDeductedStmt = $db->prepare("SELECT processed_by FROM orders WHERE id = :id AND processed_by IS NOT NULL");
            $checkDeductedStmt->execute([':id' => $orderId]);
            $alreadyProcessed = $checkDeductedStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$alreadyProcessed) {
                // Get order items
                $itemsStmt = $db->prepare("SELECT oi.product_id, oi.variation_id, oi.quantity, oi.product_name, p.stock_quantity as current_stock 
                    FROM order_items oi 
                    LEFT JOIN products p ON oi.product_id = p.id 
                    WHERE oi.order_id = :order_id");
                $itemsStmt->execute([':order_id' => $orderId]);
                $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get order number for reference
                $orderStmt = $db->prepare("SELECT order_number FROM orders WHERE id = :id");
                $orderStmt->execute([':id' => $orderId]);
                $orderInfo = $orderStmt->fetch(PDO::FETCH_ASSOC);
                $orderNumber = $orderInfo['order_number'] ?? "ORD-$orderId";
                
                // Get sales rep name
                $salesRepName = 'System';
                if ($salesRepId) {
                    $repStmt = $db->prepare("SELECT CONCAT(first_name, ' ', last_name) as name FROM users WHERE id = :id");
                    $repStmt->execute([':id' => $salesRepId]);
                    $rep = $repStmt->fetch(PDO::FETCH_ASSOC);
                    if ($rep) $salesRepName = $rep['name'];
                }
                
                foreach ($items as $item) {
                    $productId = $item['product_id'];
                    $quantity = $item['quantity'];
                    $currentStock = $item['current_stock'] ?? 0;
                    
                    // Deduct from product stock
                    if ($productId) {
                        $deductStmt = $db->prepare("UPDATE products SET stock_quantity = GREATEST(stock_quantity - :qty, 0) WHERE id = :product_id");
                        $deductStmt->execute([':qty' => $quantity, ':product_id' => $productId]);
                        error_log("Deducted $quantity units from product $productId for order $orderId");
                        
                        // Also deduct from variation if specified
                        if (!empty($item['variation_id'])) {
                            $deductVarStmt = $db->prepare("UPDATE product_variations SET stock_quantity = GREATEST(stock_quantity - :qty, 0) WHERE id = :variation_id");
                            $deductVarStmt->execute([':qty' => $quantity, ':variation_id' => $item['variation_id']]);
                        }
                        
                        // Log inventory transaction
                        $transactionStmt = $db->prepare("INSERT INTO inventory_transactions 
                            (product_id, variation_id, transaction_type, quantity, quantity_before, quantity_after, 
                             reference_number, reason, remarks, status, created_by, created_at)
                            VALUES (:product_id, :variation_id, 'stock_out', :quantity, :qty_before, :qty_after,
                                    :reference, :reason, :remarks, 'completed', :created_by, NOW())");
                        $transactionStmt->execute([
                            ':product_id' => $productId,
                            ':variation_id' => $item['variation_id'] ?? null,
                            ':quantity' => $quantity,
                            ':qty_before' => $currentStock,
                            ':qty_after' => max($currentStock - $quantity, 0),
                            ':reference' => $orderNumber,
                            ':reason' => 'Sales Order',
                            ':remarks' => "Sold by: $salesRepName | Order: $orderNumber | Product: " . ($item['product_name'] ?? 'Unknown'),
                            ':created_by' => $salesRepId
                        ]);
                        error_log("Logged inventory transaction for product $productId, order $orderNumber, sales rep: $salesRepName");
                    }
                }
            }
        } catch (Exception $e) {
            error_log("Failed to deduct inventory for order $orderId: " . $e->getMessage());
        }
    }

    // Handle return/refund processing - restore inventory
    if ($newStatus === 'returned' || $newStatus === 'refunded') {
        // Mark payment as refunded
        $sql .= ", payment_status = 'refunded'";
        
        // Restore inventory for order items
        try {
            // Get order items
            $itemsStmt = $db->prepare("SELECT product_id, variation_id, quantity FROM order_items WHERE order_id = :order_id");
            $itemsStmt->execute([':order_id' => $orderId]);
            $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($items as $item) {
                // Restore stock to variation if variation_id exists
                if (!empty($item['variation_id'])) {
                    $restoreStmt = $db->prepare("UPDATE product_variations SET stock_quantity = stock_quantity + :qty WHERE id = :variation_id");
                    $restoreStmt->execute([':qty' => $item['quantity'], ':variation_id' => $item['variation_id']]);
                    error_log("Restored {$item['quantity']} units to variation {$item['variation_id']}");
                }
                
                // Also update main product stock if tracking at product level
                if (!empty($item['product_id'])) {
                    $restoreProductStmt = $db->prepare("UPDATE products SET stock_quantity = stock_quantity + :qty WHERE id = :product_id");
                    $restoreProductStmt->execute([':qty' => $item['quantity'], ':product_id' => $item['product_id']]);
                    error_log("Restored {$item['quantity']} units to product {$item['product_id']}");
                }
            }
            error_log("Inventory restored for returned/refunded order $orderId");
        } catch (Exception $e) {
            error_log("Failed to restore inventory for order $orderId: " . $e->getMessage());
        }
    }
    
    $sql .= " WHERE id = :id";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    $rowsAffected = $stmt->rowCount();
    error_log("Order $orderId update executed. Rows affected: $rowsAffected. SQL: $sql");
    
    if ($rowsAffected === 0) {
        // Order might not exist or status was already the same
        error_log("Warning: No rows affected for order $orderId status update to $newStatus");
    }
    
    // Log status change in history
    try {
        $historyStmt = $db->prepare("
            INSERT INTO order_status_history (order_id, status, note, changed_by)
            VALUES (:order_id, :status, :note, :changed_by)
        ");
        $historyStmt->execute([
            ':order_id' => $orderId,
            ':status' => $newStatus,
            ':note' => $data['note'] ?? null,
            ':changed_by' => $data['changed_by'] ?? null
        ]);
    } catch (Exception $e) {
        // Table might not exist yet, ignore
        error_log("History logging failed: " . $e->getMessage());
    }
    
    echo json_encode(['success' => true, 'message' => 'Order status updated to ' . $newStatus, 'rows_affected' => $rowsAffected]);
}

/**
 * Customer verification of order receipt
 * Allows customer to confirm they received their order (picked_up or delivered -> completed)
 */
function customerVerifyOrder($db, $data) {
    $orderNumber = $data['order_number'] ?? null;
    $email = $data['email'] ?? null;
    $verificationCode = $data['verification_code'] ?? null; // Optional: QR code data
    
    if (!$orderNumber && !$verificationCode) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order number or verification code required']);
        return;
    }
    
    // If verification code provided (from QR scan), parse it
    if ($verificationCode && strpos($verificationCode, 'FRAGRANZA|') === 0) {
        $parts = explode('|', $verificationCode);
        $orderNumber = $parts[1] ?? null;
    }
    
    // Find the order
    $findSql = "SELECT o.id, o.order_number, o.status, o.shipping_email, o.customer_id, c.email as customer_email
                FROM orders o 
                LEFT JOIN customers c ON o.customer_id = c.id
                WHERE o.order_number = :order_number";
    $params = [':order_number' => $orderNumber];
    
    // If email provided, verify it matches
    if ($email) {
        $findSql .= " AND (o.shipping_email = :email OR c.email = :email2)";
        $params[':email'] = $email;
        $params[':email2'] = $email;
    }
    
    $findStmt = $db->prepare($findSql);
    $findStmt->execute($params);
    $order = $findStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found or email does not match']);
        return;
    }
    
    // Check if order is in a state that can be verified
    $verifiableStatuses = ['delivered', 'picked_up'];
    if (!in_array($order['status'], $verifiableStatuses)) {
        // If already completed, return success message
        if ($order['status'] === 'completed') {
            echo json_encode(['success' => true, 'message' => 'Order already verified', 'already_verified' => true]);
            return;
        }
        
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Order cannot be verified yet. Current status: ' . $order['status'],
            'current_status' => $order['status']
        ]);
        return;
    }
    
    // Update order to completed
    $updateStmt = $db->prepare("
        UPDATE orders 
        SET status = 'completed', 
            customer_verified_at = NOW()
        WHERE id = :id
    ");
    $updateStmt->execute([':id' => $order['id']]);
    
    // Log status change
    try {
        $historyStmt = $db->prepare("
            INSERT INTO order_status_history (order_id, status, note, changed_by)
            VALUES (:order_id, 'completed', 'Verified by customer', 'customer')
        ");
        $historyStmt->execute([':order_id' => $order['id']]);
    } catch (Exception $e) {
        error_log("History logging failed: " . $e->getMessage());
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'Order verified successfully! Thank you for shopping with Fragranza Olio.',
        'order_number' => $orderNumber
    ]);
}

function updateOrder($db, $data) {
    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID required']);
        return;
    }
    
    $stmt = $db->prepare("
        UPDATE orders SET
            status = :status,
            payment_status = :payment_status,
            shipping_notes = :shipping_notes,
            tracking_number = :tracking_number,
            courier = :courier
        WHERE id = :id
    ");
    
    $stmt->execute([
        ':id' => $data['id'],
        ':status' => $data['status'],
        ':payment_status' => $data['payment_status'],
        ':shipping_notes' => $data['shipping_notes'] ?? '',
        ':tracking_number' => $data['tracking_number'] ?? '',
        ':courier' => $data['courier'] ?? ''
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Order updated successfully']);
}

function deleteOrder($db, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID required']);
        return;
    }
    
    $stmt = $db->prepare("DELETE FROM orders WHERE id = :id");
    $stmt->execute([':id' => $id]);
    
    echo json_encode(['success' => true, 'message' => 'Order deleted successfully']);
}

// =====================================================
// CUSTOMERS
// =====================================================

function getCustomers($db) {
    $status = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? null;
    $type = $_GET['type'] ?? null;
    
    // Get all users with customer role OR any user with orders as customers
    $sql = "SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            u.address,
            u.city,
            u.province,
            u.zip_code,
            u.email_verified,
            u.status as user_status,
            u.created_at,
            CASE 
                WHEN COALESCE(order_stats.total_spent, 0) > 10000 THEN 'vip'
                WHEN u.email_verified = 1 THEN 'active'
                ELSE 'inactive'
            END as status,
            CASE 
                WHEN COALESCE(order_stats.total_spent, 0) > 10000 THEN 'vip'
                ELSE 'retail'
            END as customer_type,
            1 as is_active,
            COALESCE(order_stats.total_orders, 0) as total_orders,
            COALESCE(order_stats.total_spent, 0) as total_spent,
            order_stats.last_order_date
        FROM users u
        LEFT JOIN (
            SELECT o.user_id, 
                   COUNT(*) as total_orders, 
                   SUM(o.total_amount) as total_spent,
                   MAX(o.created_at) as last_order_date
            FROM orders o
            WHERE o.status NOT IN ('cancelled', 'refunded')
            GROUP BY o.user_id
        ) order_stats ON u.id = order_stats.user_id
        WHERE (u.role = 'customer' OR u.role IS NULL OR order_stats.total_orders > 0)";
    $params = [];
    
    // Filter by status
    if ($status && $status !== 'all') {
        if ($status === 'active') {
            $sql .= " AND u.email_verified = 1";
        } else if ($status === 'inactive') {
            $sql .= " AND u.email_verified = 0";
        } else if ($status === 'vip') {
            $sql .= " AND COALESCE(order_stats.total_spent, 0) > 10000";
        }
    }
    
    if ($search) {
        $sql .= " AND (u.first_name LIKE :search OR u.last_name LIKE :search2 OR u.email LIKE :search3 OR u.phone LIKE :search4)";
        $params[':search'] = "%$search%";
        $params[':search2'] = "%$search%";
        $params[':search3'] = "%$search%";
        $params[':search4'] = "%$search%";
    }
    
    $sql .= " ORDER BY order_stats.total_spent DESC, u.created_at DESC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get stats
    $stats = [
        'total' => $db->query("SELECT COUNT(*) FROM users WHERE role = 'customer' OR role IS NULL")->fetchColumn(),
        'active' => $db->query("SELECT COUNT(*) FROM users WHERE (role = 'customer' OR role IS NULL) AND email_verified = 1")->fetchColumn(),
        'vip' => $db->query("SELECT COUNT(*) FROM users u LEFT JOIN (SELECT user_id, SUM(total_amount) as total FROM orders WHERE status NOT IN ('cancelled', 'refunded') GROUP BY user_id) o ON u.id = o.user_id WHERE (u.role = 'customer' OR u.role IS NULL) AND COALESCE(o.total, 0) > 10000")->fetchColumn(),
        'inactive' => $db->query("SELECT COUNT(*) FROM users WHERE (role = 'customer' OR role IS NULL) AND email_verified = 0")->fetchColumn(),
    ];
    
    echo json_encode(['success' => true, 'data' => $customers, 'stats' => $stats]);
}

function getCustomer($db, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Customer ID required']);
        return;
    }
    
    $stmt = $db->prepare("SELECT * FROM customers WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $customer = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$customer) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Customer not found']);
        return;
    }
    
    // Get recent orders
    $stmt = $db->prepare("SELECT * FROM orders WHERE customer_id = :id ORDER BY created_at DESC LIMIT 5");
    $stmt->execute([':id' => $id]);
    $customer['recent_orders'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $customer]);
}

function createCustomer($db, $data) {
    $stmt = $db->prepare("
        INSERT INTO customers (
            user_id, first_name, last_name, email, phone,
            address, city, province, zip_code, country,
            is_active, customer_type, notes
        ) VALUES (
            :user_id, :first_name, :last_name, :email, :phone,
            :address, :city, :province, :zip_code, :country,
            :is_active, :customer_type, :notes
        )
    ");
    
    $stmt->execute([
        ':user_id' => $data['user_id'] ?? null,
        ':first_name' => $data['first_name'],
        ':last_name' => $data['last_name'],
        ':email' => $data['email'],
        ':phone' => $data['phone'] ?? '',
        ':address' => $data['address'] ?? '',
        ':city' => $data['city'] ?? '',
        ':province' => $data['province'] ?? '',
        ':zip_code' => $data['zip_code'] ?? '',
        ':country' => $data['country'] ?? 'Philippines',
        ':is_active' => ($data['status'] ?? 'active') === 'active' ? 1 : 0,
        ':customer_type' => $data['customer_type'] ?? 'regular',
        ':notes' => $data['notes'] ?? ''
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Customer created successfully',
        'data' => ['id' => $db->lastInsertId()]
    ]);
}

function updateCustomer($db, $data) {
    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Customer ID required']);
        return;
    }
    
    $stmt = $db->prepare("
        UPDATE customers SET
            first_name = :first_name,
            last_name = :last_name,
            email = :email,
            phone = :phone,
            address = :address,
            city = :city,
            province = :province,
            zip_code = :zip_code,
            is_active = :is_active,
            customer_type = :customer_type,
            notes = :notes
        WHERE id = :id
    ");
    
    $stmt->execute([
        ':id' => $data['id'],
        ':first_name' => $data['first_name'],
        ':last_name' => $data['last_name'],
        ':email' => $data['email'],
        ':phone' => $data['phone'] ?? '',
        ':address' => $data['address'] ?? '',
        ':city' => $data['city'] ?? '',
        ':province' => $data['province'] ?? '',
        ':zip_code' => $data['zip_code'] ?? '',
        ':is_active' => ($data['status'] ?? 'active') === 'active' ? 1 : 0,
        ':customer_type' => $data['customer_type'] ?? 'regular',
        ':notes' => $data['notes'] ?? ''
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Customer updated successfully']);
}

function deleteCustomer($db, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Customer ID required']);
        return;
    }
    
    $stmt = $db->prepare("DELETE FROM customers WHERE id = :id");
    $stmt->execute([':id' => $id]);
    
    echo json_encode(['success' => true, 'message' => 'Customer deleted successfully']);
}

// =====================================================
// INVOICES
// =====================================================

function getInvoices($db) {
    $status = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? null;
    
    $sql = "SELECT i.*, 
            c.first_name as customer_first_name, 
            c.last_name as customer_last_name,
            o.order_number
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            LEFT JOIN orders o ON i.order_id = o.id
            WHERE 1=1";
    $params = [];
    
    if ($status && $status !== 'all') {
        $sql .= " AND i.status = :status";
        $params[':status'] = $status;
    }
    
    if ($search) {
        $sql .= " AND (i.invoice_number LIKE :search OR c.first_name LIKE :search2 OR c.last_name LIKE :search3)";
        $params[':search'] = "%$search%";
        $params[':search2'] = "%$search%";
        $params[':search3'] = "%$search%";
    }
    
    $sql .= " ORDER BY i.created_at DESC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get stats
    $stats = [
        'total' => $db->query("SELECT COUNT(*) FROM invoices")->fetchColumn(),
        'paid' => $db->query("SELECT COUNT(*) FROM invoices WHERE status = 'paid'")->fetchColumn(),
        'pending' => $db->query("SELECT COUNT(*) FROM invoices WHERE status IN ('draft', 'sent')")->fetchColumn(),
        'overdue' => $db->query("SELECT COUNT(*) FROM invoices WHERE status = 'overdue'")->fetchColumn(),
        'total_amount' => $db->query("SELECT COALESCE(SUM(total_amount), 0) FROM invoices")->fetchColumn(),
        'paid_amount' => $db->query("SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'paid'")->fetchColumn(),
    ];
    
    echo json_encode(['success' => true, 'data' => $invoices, 'stats' => $stats]);
}

function getInvoice($db, $id, $orderId = null) {
    // Allow fetching invoice by order_id instead of invoice id
    if (!$id && !$orderId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invoice ID or Order ID required']);
        return;
    }
    
    if ($orderId) {
        $stmt = $db->prepare("
            SELECT i.*, 
                c.first_name as customer_first_name, 
                c.last_name as customer_last_name,
                c.email as customer_email,
                c.phone as customer_phone,
                o.order_number
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            LEFT JOIN orders o ON i.order_id = o.id
            WHERE i.order_id = :order_id
        ");
        $stmt->execute([':order_id' => $orderId]);
    } else {
        $stmt = $db->prepare("
            SELECT i.*, 
                c.first_name as customer_first_name, 
                c.last_name as customer_last_name,
                c.email as customer_email,
                c.phone as customer_phone,
                o.order_number
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            LEFT JOIN orders o ON i.order_id = o.id
            WHERE i.id = :id
        ");
        $stmt->execute([':id' => $id]);
    }
    
    $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$invoice) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Invoice not found']);
        return;
    }
    
    // Get order items if linked to order
    if ($invoice['order_id']) {
        $stmt = $db->prepare("SELECT * FROM order_items WHERE order_id = :order_id");
        $stmt->execute([':order_id' => $invoice['order_id']]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process items to extract image from product_snapshot
        foreach ($items as &$item) {
            if (!empty($item['product_snapshot'])) {
                $snapshot = json_decode($item['product_snapshot'], true);
                if ($snapshot && !empty($snapshot['image'])) {
                    $item['image'] = $snapshot['image'];
                }
            }
        }
        
        $invoice['items'] = $items;
    }
    
    echo json_encode(['success' => true, 'data' => $invoice]);
}

function createInvoice($db, $data) {
    $invoiceNumber = 'INV-' . date('Ymd') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    
    $stmt = $db->prepare("
        INSERT INTO invoices (
            invoice_number, order_id, customer_id, subtotal, discount_amount,
            tax_amount, total_amount, status, issue_date, due_date,
            billing_name, billing_email, billing_phone, billing_address, notes, terms
        ) VALUES (
            :invoice_number, :order_id, :customer_id, :subtotal, :discount_amount,
            :tax_amount, :total_amount, :status, :issue_date, :due_date,
            :billing_name, :billing_email, :billing_phone, :billing_address, :notes, :terms
        )
    ");
    
    $stmt->execute([
        ':invoice_number' => $invoiceNumber,
        ':order_id' => $data['order_id'] ?? null,
        ':customer_id' => $data['customer_id'] ?? null,
        ':subtotal' => $data['subtotal'] ?? 0,
        ':discount_amount' => $data['discount_amount'] ?? 0,
        ':tax_amount' => $data['tax_amount'] ?? 0,
        ':total_amount' => $data['total_amount'] ?? 0,
        ':status' => $data['status'] ?? 'draft',
        ':issue_date' => $data['issue_date'] ?? date('Y-m-d'),
        ':due_date' => $data['due_date'] ?? date('Y-m-d', strtotime('+7 days')),
        ':billing_name' => $data['billing_name'] ?? '',
        ':billing_email' => $data['billing_email'] ?? '',
        ':billing_phone' => $data['billing_phone'] ?? '',
        ':billing_address' => $data['billing_address'] ?? '',
        ':notes' => $data['notes'] ?? '',
        ':terms' => $data['terms'] ?? ''
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Invoice created successfully',
        'data' => ['id' => $db->lastInsertId(), 'invoice_number' => $invoiceNumber]
    ]);
}

function updateInvoiceStatus($db, $data) {
    if (empty($data['id']) || empty($data['status'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invoice ID and status required']);
        return;
    }
    
    $sql = "UPDATE invoices SET status = :status";
    $params = [':id' => $data['id'], ':status' => $data['status']];
    
    if ($data['status'] === 'paid') {
        $sql .= ", paid_at = NOW(), paid_amount = total_amount";
        if (!empty($data['payment_method'])) {
            $sql .= ", payment_method = :payment_method";
            $params[':payment_method'] = $data['payment_method'];
        }
    }
    
    $sql .= " WHERE id = :id";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(['success' => true, 'message' => 'Invoice status updated']);
}

function updateInvoice($db, $data) {
    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invoice ID required']);
        return;
    }
    
    $stmt = $db->prepare("
        UPDATE invoices SET
            status = :status,
            due_date = :due_date,
            notes = :notes
        WHERE id = :id
    ");
    
    $stmt->execute([
        ':id' => $data['id'],
        ':status' => $data['status'],
        ':due_date' => $data['due_date'],
        ':notes' => $data['notes'] ?? ''
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Invoice updated successfully']);
}

function deleteInvoice($db, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invoice ID required']);
        return;
    }
    
    $stmt = $db->prepare("DELETE FROM invoices WHERE id = :id");
    $stmt->execute([':id' => $id]);
    
    echo json_encode(['success' => true, 'message' => 'Invoice deleted successfully']);
}

// =====================================================
// COMPLAINTS
// =====================================================

function getComplaints($db) {
    $status = $_GET['status'] ?? null;
    $priority = $_GET['priority'] ?? null;
    $search = $_GET['search'] ?? null;
    
    $sql = "SELECT cp.*, 
            c.first_name as customer_first_name, 
            c.last_name as customer_last_name,
            c.email as customer_email,
            o.order_number,
            (SELECT COUNT(*) FROM complaint_messages WHERE complaint_id = cp.id) as message_count
            FROM complaints cp
            LEFT JOIN customers c ON cp.customer_id = c.id
            LEFT JOIN orders o ON cp.order_id = o.id
            WHERE 1=1";
    $params = [];
    
    if ($status && $status !== 'all') {
        $sql .= " AND cp.status = :status";
        $params[':status'] = $status;
    }
    
    if ($priority && $priority !== 'all') {
        $sql .= " AND cp.priority = :priority";
        $params[':priority'] = $priority;
    }
    
    if ($search) {
        $sql .= " AND (cp.ticket_number LIKE :search OR cp.subject LIKE :search2 OR c.first_name LIKE :search3)";
        $params[':search'] = "%$search%";
        $params[':search2'] = "%$search%";
        $params[':search3'] = "%$search%";
    }
    
    $sql .= " ORDER BY 
        CASE cp.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
        END,
        cp.created_at DESC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get stats
    $stats = [
        'total' => $db->query("SELECT COUNT(*) FROM complaints")->fetchColumn(),
        'new' => $db->query("SELECT COUNT(*) FROM complaints WHERE status = 'new'")->fetchColumn(),
        'open' => $db->query("SELECT COUNT(*) FROM complaints WHERE status = 'open'")->fetchColumn(),
        'in_progress' => $db->query("SELECT COUNT(*) FROM complaints WHERE status = 'in_progress'")->fetchColumn(),
        'resolved' => $db->query("SELECT COUNT(*) FROM complaints WHERE status = 'resolved'")->fetchColumn(),
        'closed' => $db->query("SELECT COUNT(*) FROM complaints WHERE status = 'closed'")->fetchColumn(),
    ];
    
    echo json_encode(['success' => true, 'data' => $complaints, 'stats' => $stats]);
}

function getComplaint($db, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Complaint ID required']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT cp.*, 
            c.first_name as customer_first_name, 
            c.last_name as customer_last_name,
            c.email as customer_email,
            c.phone as customer_phone,
            o.order_number
        FROM complaints cp
        LEFT JOIN customers c ON cp.customer_id = c.id
        LEFT JOIN orders o ON cp.order_id = o.id
        WHERE cp.id = :id
    ");
    $stmt->execute([':id' => $id]);
    $complaint = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$complaint) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Complaint not found']);
        return;
    }
    
    // Get messages
    $stmt = $db->prepare("
        SELECT cm.*, u.first_name, u.last_name 
        FROM complaint_messages cm 
        LEFT JOIN users u ON cm.user_id = u.id 
        WHERE cm.complaint_id = :id 
        ORDER BY cm.created_at ASC
    ");
    $stmt->execute([':id' => $id]);
    $complaint['messages'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $complaint]);
}

function createComplaint($db, $data) {
    $ticketNumber = 'TKT-' . date('Ymd') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    
    $stmt = $db->prepare("
        INSERT INTO complaints (
            ticket_number, customer_id, order_id, user_id, subject,
            category, priority, status, description
        ) VALUES (
            :ticket_number, :customer_id, :order_id, :user_id, :subject,
            :category, :priority, :status, :description
        )
    ");
    
    $stmt->execute([
        ':ticket_number' => $ticketNumber,
        ':customer_id' => $data['customer_id'] ?? null,
        ':order_id' => $data['order_id'] ?? null,
        ':user_id' => $data['user_id'] ?? null,
        ':subject' => $data['subject'],
        ':category' => $data['category'] ?? 'other',
        ':priority' => $data['priority'] ?? 'medium',
        ':status' => 'new',
        ':description' => $data['description']
    ]);
    
    $complaintId = $db->lastInsertId();
    
    // Add initial message
    $db->prepare("
        INSERT INTO complaint_messages (complaint_id, user_id, message, is_staff_reply)
        VALUES (:complaint_id, :user_id, :message, FALSE)
    ")->execute([
        ':complaint_id' => $complaintId,
        ':user_id' => $data['user_id'] ?? null,
        ':message' => $data['description']
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Complaint submitted successfully',
        'data' => ['id' => $complaintId, 'ticket_number' => $ticketNumber]
    ]);
}

function addComplaintMessage($db, $data) {
    if (empty($data['complaint_id']) || empty($data['message'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Complaint ID and message required']);
        return;
    }
    
    $stmt = $db->prepare("
        INSERT INTO complaint_messages (complaint_id, user_id, message, is_staff_reply)
        VALUES (:complaint_id, :user_id, :message, :is_staff_reply)
    ");
    
    $stmt->execute([
        ':complaint_id' => $data['complaint_id'],
        ':user_id' => $data['user_id'] ?? null,
        ':message' => $data['message'],
        ':is_staff_reply' => $data['is_staff_reply'] ?? false
    ]);
    
    // Update complaint status if staff reply
    if ($data['is_staff_reply'] ?? false) {
        $db->prepare("UPDATE complaints SET status = 'in_progress' WHERE id = :id AND status = 'new'")
           ->execute([':id' => $data['complaint_id']]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Message added successfully']);
}

function updateComplaintStatus($db, $data) {
    if (empty($data['id']) || empty($data['status'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Complaint ID and status required']);
        return;
    }
    
    $sql = "UPDATE complaints SET status = :status";
    $params = [':id' => $data['id'], ':status' => $data['status']];
    
    if ($data['status'] === 'resolved') {
        $sql .= ", resolution = :resolution, resolved_by = :resolved_by, resolved_at = NOW()";
        $params[':resolution'] = $data['resolution'] ?? '';
        $params[':resolved_by'] = $data['resolved_by'] ?? null;
    }
    
    $sql .= " WHERE id = :id";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(['success' => true, 'message' => 'Complaint status updated']);
}

function updateComplaint($db, $data) {
    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Complaint ID required']);
        return;
    }
    
    $stmt = $db->prepare("
        UPDATE complaints SET
            priority = :priority,
            status = :status,
            assigned_to = :assigned_to
        WHERE id = :id
    ");
    
    $stmt->execute([
        ':id' => $data['id'],
        ':priority' => $data['priority'],
        ':status' => $data['status'],
        ':assigned_to' => $data['assigned_to'] ?? null
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Complaint updated successfully']);
}

function deleteComplaint($db, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Complaint ID required']);
        return;
    }
    
    $stmt = $db->prepare("DELETE FROM complaints WHERE id = :id");
    $stmt->execute([':id' => $id]);
    
    echo json_encode(['success' => true, 'message' => 'Complaint deleted successfully']);
}

// =====================================================
// USER SETTINGS
// =====================================================

function getUserSettings($db, $userId) {
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID required']);
        return;
    }
    
    // Get user profile data
    $stmt = $db->prepare("SELECT id, first_name, last_name, email, phone FROM users WHERE id = :user_id");
    $stmt->execute([':user_id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        return;
    }
    
    // Get or create settings
    $stmt = $db->prepare("SELECT * FROM user_settings WHERE user_id = :user_id");
    $stmt->execute([':user_id' => $userId]);
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$settings) {
        // Create default settings
        $db->prepare("INSERT INTO user_settings (user_id) VALUES (:user_id)")
           ->execute([':user_id' => $userId]);
        
        $stmt->execute([':user_id' => $userId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Return flat structure matching frontend expectations
    echo json_encode([
        'success' => true,
        'data' => [
            'user_id' => $user['id'],
            'first_name' => $user['first_name'] ?? '',
            'last_name' => $user['last_name'] ?? '',
            'email' => $user['email'] ?? '',
            'phone' => $user['phone'] ?? '',
            'email_orders' => (bool)($settings['email_order_updates'] ?? true),
            'email_reports' => (bool)($settings['email_newsletter'] ?? true),
            'email_alerts' => (bool)($settings['email_promotions'] ?? false),
            'push_orders' => (bool)($settings['push_order_updates'] ?? true),
            'push_customers' => (bool)($settings['push_promotions'] ?? false),
            'language' => $settings['language'] ?? 'en',
            'currency' => $settings['currency'] ?? 'PHP',
            'date_format' => $settings['timezone'] ?? 'YYYY-MM-DD'
        ]
    ]);
}

function saveUserSettings($db, $data) {
    if (empty($data['user_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID required']);
        return;
    }
    
    $userId = $data['user_id'];
    
    // Update profile fields if provided
    if (isset($data['first_name']) || isset($data['last_name']) || isset($data['email']) || isset($data['phone'])) {
        $updates = [];
        $params = [':user_id' => $userId];
        
        if (isset($data['first_name'])) {
            $updates[] = "first_name = :first_name";
            $params[':first_name'] = $data['first_name'];
        }
        if (isset($data['last_name'])) {
            $updates[] = "last_name = :last_name";
            $params[':last_name'] = $data['last_name'];
        }
        if (isset($data['email'])) {
            $updates[] = "email = :email";
            $params[':email'] = $data['email'];
        }
        if (isset($data['phone'])) {
            $updates[] = "phone = :phone";
            $params[':phone'] = $data['phone'];
        }
        
        if (!empty($updates)) {
            $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = :user_id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }
    }
    
    // Update notification settings if provided
    $settingsUpdates = [];
    $settingsParams = [':user_id' => $userId];
    
    if (isset($data['email_orders'])) {
        $settingsUpdates[] = "email_order_updates = :email_orders";
        $settingsParams[':email_orders'] = $data['email_orders'] ? 1 : 0;
    }
    if (isset($data['email_reports'])) {
        $settingsUpdates[] = "email_newsletter = :email_reports";
        $settingsParams[':email_reports'] = $data['email_reports'] ? 1 : 0;
    }
    if (isset($data['email_alerts'])) {
        $settingsUpdates[] = "email_promotions = :email_alerts";
        $settingsParams[':email_alerts'] = $data['email_alerts'] ? 1 : 0;
    }
    if (isset($data['push_orders'])) {
        $settingsUpdates[] = "push_order_updates = :push_orders";
        $settingsParams[':push_orders'] = $data['push_orders'] ? 1 : 0;
    }
    if (isset($data['push_customers'])) {
        $settingsUpdates[] = "push_promotions = :push_customers";
        $settingsParams[':push_customers'] = $data['push_customers'] ? 1 : 0;
    }
    if (isset($data['language'])) {
        $settingsUpdates[] = "language = :language";
        $settingsParams[':language'] = $data['language'];
    }
    if (isset($data['currency'])) {
        $settingsUpdates[] = "currency = :currency";
        $settingsParams[':currency'] = $data['currency'];
    }
    if (isset($data['date_format'])) {
        $settingsUpdates[] = "timezone = :date_format";
        $settingsParams[':date_format'] = $data['date_format'];
    }
    
    if (!empty($settingsUpdates)) {
        // Check if settings exist
        $stmt = $db->prepare("SELECT id FROM user_settings WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        
        if ($stmt->fetch()) {
            // Update
            $sql = "UPDATE user_settings SET " . implode(", ", $settingsUpdates) . " WHERE user_id = :user_id";
            $stmt = $db->prepare($sql);
            $stmt->execute($settingsParams);
        } else {
            // Insert with defaults
            $db->prepare("INSERT INTO user_settings (user_id) VALUES (:user_id)")
               ->execute([':user_id' => $userId]);
            
            $sql = "UPDATE user_settings SET " . implode(", ", $settingsUpdates) . " WHERE user_id = :user_id";
            $stmt = $db->prepare($sql);
            $stmt->execute($settingsParams);
        }
    }
    
    echo json_encode(['success' => true, 'message' => 'Settings saved successfully']);
}

function changePassword($db, $data) {
    if (empty($data['user_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID required']);
        return;
    }
    
    if (empty($data['current_password']) || empty($data['new_password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Current and new password required']);
        return;
    }
    
    $userId = $data['user_id'];
    
    // Get current password hash
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = :user_id");
    $stmt->execute([':user_id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        return;
    }
    
    // Verify current password
    if (!password_verify($data['current_password'], $user['password_hash'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
        return;
    }
    
    // Hash and update new password
    $newHash = password_hash($data['new_password'], PASSWORD_BCRYPT, ['cost' => 12]);
    $updateStmt = $db->prepare("UPDATE users SET password_hash = :hash WHERE id = :user_id");
    $updateStmt->execute([':hash' => $newHash, ':user_id' => $userId]);
    
    echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
}

// =====================================================
// ANALYTICS
// =====================================================

function getAnalytics($db) {
    $period = $_GET['period'] ?? '30days';
    
    // Determine date range
    switch ($period) {
        case '7days':
            $startDate = date('Y-m-d', strtotime('-7 days'));
            break;
        case '30days':
            $startDate = date('Y-m-d', strtotime('-30 days'));
            break;
        case '90days':
            $startDate = date('Y-m-d', strtotime('-90 days'));
            break;
        case 'year':
            $startDate = date('Y-m-d', strtotime('-1 year'));
            break;
        default:
            $startDate = date('Y-m-d', strtotime('-30 days'));
    }
    
    // Revenue stats
    $revenueStmt = $db->prepare("
        SELECT 
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COUNT(*) as total_orders,
            COALESCE(AVG(total_amount), 0) as avg_order_value
        FROM orders 
        WHERE created_at >= :start_date AND payment_status = 'paid'
    ");
    $revenueStmt->execute([':start_date' => $startDate]);
    $revenue = $revenueStmt->fetch(PDO::FETCH_ASSOC);
    
    // Daily revenue for chart
    $dailyStmt = $db->prepare("
        SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total_amount), 0) as revenue,
            COUNT(*) as orders
        FROM orders 
        WHERE created_at >= :start_date AND payment_status = 'paid'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ");
    $dailyStmt->execute([':start_date' => $startDate]);
    $dailyData = $dailyStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Top products
    $topProductsStmt = $db->prepare("
        SELECT 
            oi.product_name,
            SUM(oi.quantity) as total_sold,
            SUM(oi.total_price) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= :start_date AND o.payment_status = 'paid'
        GROUP BY oi.product_name
        ORDER BY total_sold DESC
        LIMIT 10
    ");
    $topProductsStmt->execute([':start_date' => $startDate]);
    $topProducts = $topProductsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Sales by category
    $categoryStmt = $db->prepare("
        SELECT 
            c.name as category,
            COUNT(DISTINCT o.id) as orders,
            COALESCE(SUM(oi.total_price), 0) as revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE o.created_at >= :start_date AND o.payment_status = 'paid'
        GROUP BY c.name
        ORDER BY revenue DESC
    ");
    $categoryStmt->execute([':start_date' => $startDate]);
    $categoryData = $categoryStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Customer stats
    $newCustomers = $db->prepare("SELECT COUNT(*) FROM customers WHERE created_at >= :start_date");
    $newCustomers->execute([':start_date' => $startDate]);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'revenue' => $revenue,
            'daily' => $dailyData,
            'topProducts' => $topProducts,
            'categories' => $categoryData,
            'newCustomers' => $newCustomers->fetchColumn()
        ]
    ]);
}

function getDashboardStats($db) {
    $period = $_GET['period'] ?? 'month';
    
    // Determine date range based on period
    switch ($period) {
        case 'today':
            $startDate = date('Y-m-d');
            break;
        case 'week':
            $startDate = date('Y-m-d', strtotime('-7 days'));
            break;
        case 'quarter':
            $startDate = date('Y-m-d', strtotime('-90 days'));
            break;
        case 'month':
        default:
            $startDate = date('Y-m-01');
    }
    
    // Today's orders count
    $todayOrders = $db->query("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()")->fetchColumn();
    
    // Total sales for period
    $stmt = $db->prepare("SELECT COALESCE(SUM(total_amount), 0) as total_sales FROM orders WHERE created_at >= :start_date AND payment_status = 'paid'");
    $stmt->execute([':start_date' => $startDate]);
    $totalSales = $stmt->fetchColumn();
    
    // New customers this period
    $stmt = $db->prepare("SELECT COUNT(*) FROM customers WHERE created_at >= :start_date");
    $stmt->execute([':start_date' => $startDate]);
    $newCustomers = $stmt->fetchColumn();
    
    // Average order value
    $stmt = $db->prepare("SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE created_at >= :start_date AND payment_status = 'paid'");
    $stmt->execute([':start_date' => $startDate]);
    $avgOrderValue = $stmt->fetchColumn();
    
    // Recent orders with customer names
    $recentOrdersStmt = $db->query("
        SELECT 
            o.id,
            o.order_number,
            CONCAT(c.first_name, ' ', c.last_name) as customer_name,
            o.total_amount,
            o.status,
            o.created_at
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        ORDER BY o.created_at DESC 
        LIMIT 5
    ");
    $recentOrders = $recentOrdersStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Top customers
    $topCustomersStmt = $db->query("
        SELECT 
            c.id,
            CONCAT(c.first_name, ' ', c.last_name) as name,
            c.email,
            c.total_orders,
            c.total_spent,
            (SELECT MAX(created_at) FROM orders WHERE customer_id = c.id) as last_order_date
        FROM customers c 
        ORDER BY c.total_spent DESC 
        LIMIT 4
    ");
    $topCustomers = $topCustomersStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'total_sales' => (float)$totalSales,
            'monthly_target' => 1500000,
            'orders_today' => (int)$todayOrders,
            'new_customers' => (int)$newCustomers,
            'conversion_rate' => 68,
            'average_order_value' => (float)$avgOrderValue,
            'recent_orders' => $recentOrders,
            'top_customers' => $topCustomers
        ]
    ]);
}

// =====================================================
// PRODUCT REVIEWS FUNCTIONS
// =====================================================

function getProductReviews($db, $productId) {
    if (!$productId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID required']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT 
            r.*,
            COALESCE(r.customer_name, CONCAT(u.first_name, ' ', u.last_name)) as reviewer_name
        FROM product_reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.product_id = :product_id AND r.status = 'approved'
        ORDER BY r.created_at DESC
    ");
    $stmt->execute([':product_id' => $productId]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get rating stats
    $statsStmt = $db->prepare("
        SELECT 
            COUNT(*) as total,
            AVG(rating) as average,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
        FROM product_reviews
        WHERE product_id = :product_id AND status = 'approved'
    ");
    $statsStmt->execute([':product_id' => $productId]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'reviews' => $reviews,
            'stats' => [
                'total' => (int)$stats['total'],
                'average' => round((float)$stats['average'], 1),
                'distribution' => [
                    5 => (int)$stats['five_star'],
                    4 => (int)$stats['four_star'],
                    3 => (int)$stats['three_star'],
                    2 => (int)$stats['two_star'],
                    1 => (int)$stats['one_star']
                ]
            ]
        ]
    ]);
}

function getOrderReviewStatus($db, $orderId) {
    if (!$orderId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID required']);
        return;
    }
    
    // Check if order is eligible for review (delivered or picked_up)
    $orderStmt = $db->prepare("
        SELECT id, status FROM orders WHERE id = :id
    ");
    $orderStmt->execute([':id' => $orderId]);
    $order = $orderStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        return;
    }
    
    $canReview = in_array($order['status'], ['delivered', 'picked_up', 'completed']);
    
    // Get items and their review status
    $itemsStmt = $db->prepare("
        SELECT 
            oi.id as order_item_id,
            oi.product_id,
            oi.product_name,
            oi.variation,
            oi.reviewed,
            pr.id as review_id,
            pr.rating,
            pr.review
        FROM order_items oi
        LEFT JOIN product_reviews pr ON pr.order_item_id = oi.id
        WHERE oi.order_id = :order_id
    ");
    $itemsStmt->execute([':order_id' => $orderId]);
    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'can_review' => $canReview,
            'order_status' => $order['status'],
            'items' => $items
        ]
    ]);
}

function createReview($db, $data) {
    if (empty($data['product_id']) || empty($data['rating'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID and rating required']);
        return;
    }
    
    $rating = intval($data['rating']);
    if ($rating < 1 || $rating > 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Rating must be between 1 and 5']);
        return;
    }
    
    // Check if already reviewed (for order items)
    if (!empty($data['order_item_id'])) {
        $checkStmt = $db->prepare("SELECT reviewed FROM order_items WHERE id = :id");
        $checkStmt->execute([':id' => $data['order_item_id']]);
        $existingItem = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingItem && $existingItem['reviewed']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'You have already reviewed this item']);
            return;
        }
    }
    
    // Verify order status if order_id provided
    $isVerifiedPurchase = false;
    if (!empty($data['order_id'])) {
        $orderStmt = $db->prepare("SELECT status FROM orders WHERE id = :id");
        $orderStmt->execute([':id' => $data['order_id']]);
        $order = $orderStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order || !in_array($order['status'], ['delivered', 'picked_up', 'completed'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Order must be delivered before reviewing']);
            return;
        }
        $isVerifiedPurchase = true;
    }
    
    try {
        $db->beginTransaction();
        
        $stmt = $db->prepare("
            INSERT INTO product_reviews (
                product_id, order_id, order_item_id, user_id,
                customer_name, customer_email, rating,
                title, review, is_verified_purchase, status
            ) VALUES (
                :product_id, :order_id, :order_item_id, :user_id,
                :customer_name, :customer_email, :rating,
                :title, :review, :is_verified_purchase, :status
            )
        ");
        
        $stmt->execute([
            ':product_id' => $data['product_id'],
            ':order_id' => $data['order_id'] ?? null,
            ':order_item_id' => $data['order_item_id'] ?? null,
            ':user_id' => $data['user_id'] ?? null,
            ':customer_name' => $data['customer_name'] ?? null,
            ':customer_email' => $data['customer_email'] ?? null,
            ':rating' => $rating,
            ':title' => $data['title'] ?? null,
            ':review' => $data['review'] ?? null,
            ':is_verified_purchase' => $isVerifiedPurchase ? 1 : 0,
            ':status' => $isVerifiedPurchase ? 'approved' : 'pending' // Auto-approve verified purchases
        ]);
        
        $reviewId = $db->lastInsertId();
        
        // Mark order item as reviewed
        if (!empty($data['order_item_id'])) {
            $updateStmt = $db->prepare("UPDATE order_items SET reviewed = 1, review_id = :review_id WHERE id = :id");
            $updateStmt->execute([':review_id' => $reviewId, ':id' => $data['order_item_id']]);
        }
        
        // Update product average rating if auto-approved
        if ($isVerifiedPurchase) {
            $updateProductStmt = $db->prepare("
                UPDATE products SET
                    average_rating = (SELECT AVG(rating) FROM product_reviews WHERE product_id = :pid AND status = 'approved'),
                    review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = :pid2 AND status = 'approved')
                WHERE id = :pid3
            ");
            $updateProductStmt->execute([
                ':pid' => $data['product_id'],
                ':pid2' => $data['product_id'],
                ':pid3' => $data['product_id']
            ]);
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => $isVerifiedPurchase ? 'Review submitted successfully!' : 'Review submitted for moderation',
            'review_id' => $reviewId
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to submit review: ' . $e->getMessage()]);
    }
}

/**
 * Batch create reviews for multiple products in an order
 */
function createReviewsBatch($db, $data) {
    if (empty($data['reviews']) || !is_array($data['reviews'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Reviews array required']);
        return;
    }
    
    $reviews = $data['reviews'];
    $successCount = 0;
    $errors = [];
    
    try {
        $db->beginTransaction();
        
        foreach ($reviews as $index => $reviewData) {
            // Validate required fields
            if (empty($reviewData['product_id']) || empty($reviewData['rating'])) {
                $errors[] = "Review #$index: Product ID and rating required";
                continue;
            }
            
            $rating = intval($reviewData['rating']);
            if ($rating < 1 || $rating > 5) {
                $errors[] = "Review #$index: Rating must be between 1 and 5";
                continue;
            }
            
            // Check if already reviewed
            if (!empty($reviewData['order_item_id'])) {
                $checkStmt = $db->prepare("SELECT reviewed FROM order_items WHERE id = :id");
                $checkStmt->execute([':id' => $reviewData['order_item_id']]);
                $existingItem = $checkStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($existingItem && $existingItem['reviewed']) {
                    continue; // Skip already reviewed items
                }
            }
            
            // Verify order status if order_id provided
            $isVerifiedPurchase = false;
            if (!empty($reviewData['order_id'])) {
                $orderStmt = $db->prepare("SELECT status FROM orders WHERE id = :id");
                $orderStmt->execute([':id' => $reviewData['order_id']]);
                $order = $orderStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($order && in_array($order['status'], ['delivered', 'picked_up', 'completed'])) {
                    $isVerifiedPurchase = true;
                }
            }
            
            // Insert review
            $stmt = $db->prepare("
                INSERT INTO product_reviews (
                    product_id, order_id, order_item_id, user_id,
                    customer_name, customer_email, rating,
                    title, review, is_verified_purchase, status
                ) VALUES (
                    :product_id, :order_id, :order_item_id, :user_id,
                    :customer_name, :customer_email, :rating,
                    :title, :review, :is_verified_purchase, :status
                )
            ");
            
            $stmt->execute([
                ':product_id' => $reviewData['product_id'],
                ':order_id' => $reviewData['order_id'] ?? null,
                ':order_item_id' => $reviewData['order_item_id'] ?? null,
                ':user_id' => $reviewData['user_id'] ?? null,
                ':customer_name' => $reviewData['customer_name'] ?? null,
                ':customer_email' => $reviewData['customer_email'] ?? null,
                ':rating' => $rating,
                ':title' => $reviewData['title'] ?? null,
                ':review' => $reviewData['review'] ?? null,
                ':is_verified_purchase' => $isVerifiedPurchase ? 1 : 0,
                ':status' => $isVerifiedPurchase ? 'approved' : 'pending'
            ]);
            
            $reviewId = $db->lastInsertId();
            
            // Mark order item as reviewed
            if (!empty($reviewData['order_item_id'])) {
                $updateStmt = $db->prepare("UPDATE order_items SET reviewed = 1, review_id = :review_id WHERE id = :id");
                $updateStmt->execute([':review_id' => $reviewId, ':id' => $reviewData['order_item_id']]);
            }
            
            // Update product average rating
            if ($isVerifiedPurchase) {
                $updateProductStmt = $db->prepare("
                    UPDATE products SET
                        average_rating = (SELECT AVG(rating) FROM product_reviews WHERE product_id = :pid AND status = 'approved'),
                        review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = :pid2 AND status = 'approved')
                    WHERE id = :pid3
                ");
                $updateProductStmt->execute([
                    ':pid' => $reviewData['product_id'],
                    ':pid2' => $reviewData['product_id'],
                    ':pid3' => $reviewData['product_id']
                ]);
            }
            
            $successCount++;
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => $successCount > 0,
            'message' => $successCount . ' review(s) submitted successfully' . (count($errors) > 0 ? ', ' . count($errors) . ' failed' : ''),
            'submitted' => $successCount,
            'errors' => $errors
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to submit reviews: ' . $e->getMessage()]);
    }
}
