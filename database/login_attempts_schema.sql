-- Login Attempts Tracking Schema
-- Tracks all login attempts (success and failed) for security monitoring

CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    user_id INT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    failure_reason VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    location VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_login_attempts_email (email),
    INDEX idx_login_attempts_ip (ip_address),
    INDEX idx_login_attempts_created (created_at),
    INDEX idx_login_attempts_success (success),
    INDEX idx_login_attempts_user (user_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- View for recent failed attempts (useful for detecting brute force)
CREATE OR REPLACE VIEW failed_login_summary AS
SELECT 
    email,
    ip_address,
    COUNT(*) as attempt_count,
    MAX(created_at) as last_attempt,
    MIN(created_at) as first_attempt
FROM login_attempts
WHERE success = FALSE
  AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY email, ip_address
HAVING COUNT(*) >= 3
ORDER BY attempt_count DESC;

-- Show structure
DESCRIBE login_attempts;
