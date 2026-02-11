-- Notifications Schema
-- Enhanced notification system for OJT and all users

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS ojt_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('task', 'timesheet', 'attendance', 'document', 'module', 'general', 'system') DEFAULT 'general',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(500),
    reference_id INT NULL COMMENT 'ID of related task, timesheet, etc.',
    reference_type VARCHAR(50) NULL COMMENT 'Type of reference: task, timesheet, attendance, etc.',
    action_type VARCHAR(50) NULL COMMENT 'Specific action: new_task, task_approved, task_rejected, task_revised, etc.',
    is_read TINYINT(1) DEFAULT 0,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON ojt_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON ojt_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON ojt_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_action_type ON ojt_notifications(action_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON ojt_notifications(created_at);

-- Add new columns if they don't exist (for existing tables)
-- Run these one by one if the table already exists

-- ALTER TABLE ojt_notifications ADD COLUMN IF NOT EXISTS reference_id INT NULL COMMENT 'ID of related task, timesheet, etc.' AFTER link;
-- ALTER TABLE ojt_notifications ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50) NULL COMMENT 'Type of reference: task, timesheet, attendance, etc.' AFTER reference_id;
-- ALTER TABLE ojt_notifications ADD COLUMN IF NOT EXISTS action_type VARCHAR(50) NULL COMMENT 'Specific action: new_task, task_approved, etc.' AFTER reference_type;

-- Activity Log table for tracking all user transactions/movements
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL COMMENT 'Type: task, timesheet, attendance, user, product, order, etc.',
    entity_id INT NULL,
    description TEXT,
    old_values JSON NULL COMMENT 'Previous values before change',
    new_values JSON NULL COMMENT 'New values after change',
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for activity log
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity_type ON activity_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at);
