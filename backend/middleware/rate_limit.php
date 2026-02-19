<?php
/**
 * Rate Limiting Middleware
 * Fragranza Olio - IP-based rate limiting using file storage
 * 
 * Usage:
 *   require_once __DIR__ . '/../middleware/rate_limit.php';
 *   checkRateLimit('login', 5, 60);       // 5 attempts per 60 seconds
 *   checkRateLimit('register', 10, 3600); // 10 attempts per hour
 *   checkRateLimit('reset', 3, 3600);     // 3 attempts per hour
 */

define('RATE_LIMIT_DIR', sys_get_temp_dir() . '/fragranza_rate_limits');

/**
 * Get the client's real IP, accounting for proxies/tunnels
 */
function getRateLimitClientIP(): string {
    // Cloudflare
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return $_SERVER['HTTP_CF_CONNECTING_IP'];
    }
    // Standard proxy header - only trust if behind known reverse proxy
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = array_map('trim', explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']));
        // Take the first (client) IP
        return filter_var($ips[0], FILTER_VALIDATE_IP) ?: $_SERVER['REMOTE_ADDR'];
    }
    if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        return filter_var($_SERVER['HTTP_X_REAL_IP'], FILTER_VALIDATE_IP) ?: $_SERVER['REMOTE_ADDR'];
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Check rate limit for an action
 * 
 * @param string $action    Action identifier (e.g., 'login', 'register', 'reset')
 * @param int    $maxAttempts Maximum attempts allowed in the window
 * @param int    $windowSeconds Time window in seconds
 * @return bool  true if within limit, sends 429 and exits if exceeded
 */
function checkRateLimit(string $action, int $maxAttempts, int $windowSeconds): bool {
    $ip = getRateLimitClientIP();
    
    // Sanitize for filename: hash the IP to avoid path traversal
    $ipHash = md5($ip);
    $actionSafe = preg_replace('/[^a-z0-9_]/', '', strtolower($action));
    
    // Ensure rate limit directory exists
    if (!is_dir(RATE_LIMIT_DIR)) {
        @mkdir(RATE_LIMIT_DIR, 0700, true);
    }
    
    $filePath = RATE_LIMIT_DIR . "/{$actionSafe}_{$ipHash}.json";
    
    $now = time();
    $attempts = [];
    
    // Read existing attempts
    if (file_exists($filePath)) {
        $data = @file_get_contents($filePath);
        if ($data !== false) {
            $decoded = json_decode($data, true);
            if (is_array($decoded)) {
                // Filter out expired attempts
                $attempts = array_filter($decoded, function($timestamp) use ($now, $windowSeconds) {
                    return ($now - $timestamp) < $windowSeconds;
                });
                $attempts = array_values($attempts);
            }
        }
    }
    
    // Check if limit exceeded
    if (count($attempts) >= $maxAttempts) {
        // Calculate retry-after time
        $oldestAttempt = min($attempts);
        $retryAfter = $windowSeconds - ($now - $oldestAttempt);
        $retryAfter = max(1, $retryAfter);
        
        http_response_code(429);
        header("Retry-After: $retryAfter");
        echo json_encode([
            'success' => false,
            'message' => 'Too many requests. Please try again later.',
            'retry_after' => $retryAfter
        ]);
        exit;
    }
    
    // Record this attempt
    $attempts[] = $now;
    
    // Write back with exclusive lock
    $fp = @fopen($filePath, 'c');
    if ($fp) {
        if (flock($fp, LOCK_EX)) {
            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($attempts));
            flock($fp, LOCK_UN);
        }
        fclose($fp);
    }
    
    // Add rate limit headers for transparency
    $remaining = $maxAttempts - count($attempts);
    header("X-RateLimit-Limit: $maxAttempts");
    header("X-RateLimit-Remaining: $remaining");
    header("X-RateLimit-Reset: " . ($now + $windowSeconds));
    
    return true;
}

/**
 * Clean up expired rate limit files (call periodically or via cron)
 * Removes files older than 2 hours
 */
function cleanupRateLimitFiles(): void {
    if (!is_dir(RATE_LIMIT_DIR)) {
        return;
    }
    
    $cutoff = time() - 7200; // 2 hours
    $files = glob(RATE_LIMIT_DIR . '/*.json');
    
    if ($files === false) {
        return;
    }
    
    foreach ($files as $file) {
        if (filemtime($file) < $cutoff) {
            @unlink($file);
        }
    }
}
