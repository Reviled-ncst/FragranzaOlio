<?php
/**
 * Input Sanitization Middleware
 * Fragranza Olio - Centralized input cleaning and validation
 * 
 * Usage:
 *   require_once __DIR__ . '/../middleware/sanitize.php';
 *   $data = sanitizeInput($data);                    // Clean all string fields
 *   $data = sanitizeInput($data, ['email' => 'email', 'phone' => 'phone']); // With type hints
 */

/**
 * Maximum allowed lengths for common field types
 */
define('MAX_LENGTHS', [
    'name'          => 100,
    'email'         => 254,   // RFC 5321
    'phone'         => 20,
    'address'       => 500,
    'city'          => 100,
    'province'      => 100,
    'zip_code'      => 20,
    'subject'       => 200,
    'message'       => 5000,
    'description'   => 5000,
    'notes'         => 2000,
    'review'        => 3000,
    'feedback'      => 3000,
    'title'         => 200,
    'url'           => 2048,
    'sku'           => 50,
    'barcode'       => 50,
    'code'          => 20,
    'reference'     => 100,
    'default'       => 1000,
]);

/**
 * Map of field name patterns to length categories
 */
function getMaxLengthForField(string $fieldName): int {
    $fieldLower = strtolower($fieldName);
    
    // Exact or contains-based matching
    $patterns = [
        'email'             => MAX_LENGTHS['email'],
        'phone'             => MAX_LENGTHS['phone'],
        'zip'               => MAX_LENGTHS['zip_code'],
        'postal'            => MAX_LENGTHS['zip_code'],
        'city'              => MAX_LENGTHS['city'],
        'province'          => MAX_LENGTHS['province'],
        'state'             => MAX_LENGTHS['province'],
        'address'           => MAX_LENGTHS['address'],
        'first_name'        => MAX_LENGTHS['name'],
        'last_name'         => MAX_LENGTHS['name'],
        'firstname'         => MAX_LENGTHS['name'],
        'lastname'          => MAX_LENGTHS['name'],
        'customer_name'     => MAX_LENGTHS['name'],
        'billing_name'      => MAX_LENGTHS['name'],
        'contact_person'    => MAX_LENGTHS['name'],
        'name'              => MAX_LENGTHS['name'],
        'subject'           => MAX_LENGTHS['subject'],
        'title'             => MAX_LENGTHS['title'],
        'description'       => MAX_LENGTHS['description'],
        'short_description' => MAX_LENGTHS['description'],
        'message'           => MAX_LENGTHS['message'],
        'review'            => MAX_LENGTHS['review'],
        'feedback'          => MAX_LENGTHS['feedback'],
        'notes'             => MAX_LENGTHS['notes'],
        'shipping_notes'    => MAX_LENGTHS['notes'],
        'terms'             => MAX_LENGTHS['notes'],
        'remarks'           => MAX_LENGTHS['notes'],
        'reason'            => MAX_LENGTHS['notes'],
        'resolution'        => MAX_LENGTHS['notes'],
        'ingredients'       => MAX_LENGTHS['description'],
        'sku'               => MAX_LENGTHS['sku'],
        'barcode'           => MAX_LENGTHS['barcode'],
        'code'              => MAX_LENGTHS['code'],
        'reference_number'  => MAX_LENGTHS['reference'],
        'tracking_number'   => MAX_LENGTHS['reference'],
        'tracking_url'      => MAX_LENGTHS['url'],
        'slug'              => MAX_LENGTHS['title'],
        'volume'            => MAX_LENGTHS['code'],
        'concentration'     => MAX_LENGTHS['code'],
        'courier'           => MAX_LENGTHS['name'],
        'courier_name'      => MAX_LENGTHS['name'],
        'supplier'          => MAX_LENGTHS['name'],
        'vehicle_type'      => 50,
        'shipping_method'   => 50,
        'department'        => MAX_LENGTHS['name'],
        'university'        => MAX_LENGTHS['name'],
        'course'            => MAX_LENGTHS['name'],
        'note'              => MAX_LENGTHS['notes'],
        'changed_by'        => MAX_LENGTHS['name'],
        'notes_top'         => MAX_LENGTHS['description'],
        'notes_middle'      => MAX_LENGTHS['description'],
        'notes_base'        => MAX_LENGTHS['description'],
        'billing_address'   => MAX_LENGTHS['address'],
        'billing_email'     => MAX_LENGTHS['email'],
        'billing_phone'     => MAX_LENGTHS['phone'],
        'contact_phone'     => MAX_LENGTHS['phone'],
        'contact_email'     => MAX_LENGTHS['email'],
    ];
    
    // Direct match first
    if (isset($patterns[$fieldLower])) {
        return $patterns[$fieldLower];
    }
    
    // Partial match for patterns containing key words
    foreach ($patterns as $pattern => $length) {
        if (strpos($fieldLower, $pattern) !== false) {
            return $length;
        }
    }
    
    return MAX_LENGTHS['default'];
}

/**
 * Sanitize a single string value
 * - Trims whitespace
 * - Removes null bytes
 * - Applies htmlspecialchars to prevent XSS
 * - Enforces maximum length
 * 
 * @param mixed  $value     The value to sanitize
 * @param string $fieldName The field name (used for max length detection)
 * @return mixed Sanitized value (non-strings pass through unchanged)
 */
function sanitizeString($value, string $fieldName = ''): mixed {
    if (!is_string($value)) {
        return $value;
    }
    
    // Remove null bytes (injection vector)
    $value = str_replace("\0", '', $value);
    
    // Trim whitespace
    $value = trim($value);
    
    // Enforce max length
    $maxLen = getMaxLengthForField($fieldName);
    if (mb_strlen($value) > $maxLen) {
        $value = mb_substr($value, 0, $maxLen);
    }
    
    // Encode HTML entities to prevent stored XSS
    $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    
    return $value;
}

/**
 * Sanitize an email specifically
 * - Trims, lowercases, validates format
 * 
 * @param string $email
 * @return string|false Returns clean email or false if invalid
 */
function sanitizeEmail(string $email): string|false {
    $email = trim(strtolower($email));
    $email = filter_var($email, FILTER_SANITIZE_EMAIL);
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    
    if (strlen($email) > MAX_LENGTHS['email']) {
        return false;
    }
    
    return $email;
}

/**
 * Sanitize a phone number
 * - Only allows digits, +, -, (, ), spaces
 * 
 * @param string $phone
 * @return string Sanitized phone number
 */
function sanitizePhone(string $phone): string {
    $phone = trim($phone);
    $phone = preg_replace('/[^0-9+\-() ]/', '', $phone);
    return mb_substr($phone, 0, MAX_LENGTHS['phone']);
}

/**
 * Sanitize all string fields in an input array (recursive for nested arrays)
 * 
 * @param array $data       The input data array
 * @param array $fieldTypes Optional type hints: ['email' => 'email', 'phone' => 'phone']
 *                          Keys are field names, values are: 'email', 'phone', or 'string' (default)
 * @return array Sanitized data
 */
function sanitizeInput(array $data, array $fieldTypes = []): array {
    $sanitized = [];
    
    foreach ($data as $key => $value) {
        if (is_array($value)) {
            // Recurse into nested arrays (e.g., order items)
            $sanitized[$key] = sanitizeInput($value, $fieldTypes);
        } elseif (is_string($value)) {
            // Check for type-specific sanitization
            $type = $fieldTypes[$key] ?? 'string';
            
            switch ($type) {
                case 'email':
                    $cleaned = sanitizeEmail($value);
                    $sanitized[$key] = $cleaned !== false ? $cleaned : '';
                    break;
                case 'phone':
                    $sanitized[$key] = sanitizePhone($value);
                    break;
                default:
                    $sanitized[$key] = sanitizeString($value, $key);
                    break;
            }
        } else {
            // Pass through non-string values (int, float, bool, null)
            $sanitized[$key] = $value;
        }
    }
    
    return $sanitized;
}

/**
 * Validate that a value is in an allowed list (whitelist validation)
 * 
 * @param string $value   The value to check
 * @param array  $allowed The list of allowed values
 * @param string $default Default value if not in list
 * @return string The validated value or default
 */
function validateWhitelist(string $value, array $allowed, string $default = ''): string {
    return in_array($value, $allowed, true) ? $value : $default;
}
