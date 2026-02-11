<?php
/**
 * Sales API
 * Handles orders, customers, invoices, complaints, and analytics
 */

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

function getOrders($db) {
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
    if (empty($data['id']) || empty($data['status'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID and status required']);
        return;
    }
    
    $sql = "UPDATE orders SET status = :status";
    $params = [':id' => $data['id'], ':status' => $data['status']];
    
    // Update payment status if provided
    if (!empty($data['payment_status'])) {
        $sql .= ", payment_status = :payment_status";
        $params[':payment_status'] = $data['payment_status'];
    }
    
    // For COD and store_payment orders, auto-mark as paid when delivered/completed
    if (($data['status'] === 'delivered' || $data['status'] === 'completed') && empty($data['payment_status'])) {
        // Check if this is a COD or store payment order
        $checkStmt = $db->prepare("SELECT payment_method FROM orders WHERE id = :id");
        $checkStmt->execute([':id' => $data['id']]);
        $order = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($order && in_array($order['payment_method'], ['cod', 'store_payment', 'COD'])) {
            $sql .= ", payment_status = 'paid'";
        }
    }
    
    if ($data['status'] === 'shipped' && !empty($data['tracking_number'])) {
        $sql .= ", tracking_number = :tracking, courier = :courier, shipped_at = NOW()";
        $params[':tracking'] = $data['tracking_number'];
        $params[':courier'] = $data['courier'] ?? null;
    }
    
    if ($data['status'] === 'delivered') {
        $sql .= ", delivered_at = NOW()";
    }
    
    $sql .= " WHERE id = :id";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(['success' => true, 'message' => 'Order status updated']);
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
    
    $sql = "SELECT * FROM customers WHERE 1=1";
    $params = [];
    
    if ($status && $status !== 'all') {
        $sql .= " AND status = :status";
        $params[':status'] = $status;
    }
    
    if ($type && $type !== 'all') {
        $sql .= " AND customer_type = :type";
        $params[':type'] = $type;
    }
    
    if ($search) {
        $sql .= " AND (first_name LIKE :search OR last_name LIKE :search2 OR email LIKE :search3)";
        $params[':search'] = "%$search%";
        $params[':search2'] = "%$search%";
        $params[':search3'] = "%$search%";
    }
    
    $sql .= " ORDER BY created_at DESC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get stats
    $stats = [
        'total' => $db->query("SELECT COUNT(*) FROM customers")->fetchColumn(),
        'active' => $db->query("SELECT COUNT(*) FROM customers WHERE status = 'active'")->fetchColumn(),
        'vip' => $db->query("SELECT COUNT(*) FROM customers WHERE status = 'vip'")->fetchColumn(),
        'inactive' => $db->query("SELECT COUNT(*) FROM customers WHERE status = 'inactive'")->fetchColumn(),
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
            status, customer_type, notes
        ) VALUES (
            :user_id, :first_name, :last_name, :email, :phone,
            :address, :city, :province, :zip_code, :country,
            :status, :customer_type, :notes
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
        ':status' => $data['status'] ?? 'active',
        ':customer_type' => $data['customer_type'] ?? 'retail',
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
            status = :status,
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
        ':status' => $data['status'] ?? 'active',
        ':customer_type' => $data['customer_type'] ?? 'retail',
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
