-- OJT System Schema
-- Run this to create all tables needed for OJT supervisor and trainee functionality

-- OJT Assignments (which supervisor is assigned to which trainees)
CREATE TABLE IF NOT EXISTS ojt_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supervisor_id INT NOT NULL,
    trainee_id INT NOT NULL,
    department VARCHAR(100) DEFAULT 'General',
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('active', 'completed', 'terminated') DEFAULT 'active',
    total_required_hours INT DEFAULT 600,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trainee_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (supervisor_id, trainee_id, start_date)
);

-- OJT Tasks
CREATE TABLE IF NOT EXISTS ojt_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to INT NOT NULL,
    assigned_by INT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'under_review', 'completed', 'cancelled') DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMP NULL,
    submission_text TEXT,
    submission_file VARCHAR(500),
    feedback TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- OJT Timesheets (weekly summaries)
CREATE TABLE IF NOT EXISTS ojt_timesheets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainee_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_hours DECIMAL(5,2) DEFAULT 0,
    status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_timesheet (trainee_id, week_start)
);

-- OJT Timesheet Entries (daily entries)
CREATE TABLE IF NOT EXISTS ojt_timesheet_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timesheet_id INT NOT NULL,
    entry_date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    break_hours DECIMAL(3,2) DEFAULT 0,
    hours_worked DECIMAL(4,2) DEFAULT 0,
    tasks_completed TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (timesheet_id) REFERENCES ojt_timesheets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_entry (timesheet_id, entry_date)
);

-- OJT Task Submissions/Dropbox
CREATE TABLE IF NOT EXISTS ojt_task_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    trainee_id INT NOT NULL,
    submission_type ENUM('file', 'text', 'link') DEFAULT 'file',
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT,
    file_type VARCHAR(100),
    submission_text TEXT,
    submission_link VARCHAR(500),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES ojt_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (trainee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- OJT Attendance
CREATE TABLE IF NOT EXISTS ojt_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainee_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    time_in TIMESTAMP NULL,
    time_out TIMESTAMP NULL,
    status ENUM('present', 'absent', 'late', 'half_day', 'excused') DEFAULT 'present',
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (trainee_id, attendance_date)
);

-- OJT Documents
CREATE TABLE IF NOT EXISTS ojt_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainee_id INT NOT NULL,
    uploaded_by INT NOT NULL,
    document_type ENUM('resume', 'endorsement', 'moa', 'completion', 'evaluation', 'other') DEFAULT 'other',
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT,
    file_type VARCHAR(100),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- OJT Performance Evaluations
CREATE TABLE IF NOT EXISTS ojt_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainee_id INT NOT NULL,
    evaluator_id INT NOT NULL,
    evaluation_period VARCHAR(50),
    attendance_rating INT CHECK (attendance_rating >= 1 AND attendance_rating <= 5),
    punctuality_rating INT CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5),
    initiative_rating INT CHECK (initiative_rating >= 1 AND initiative_rating <= 5),
    teamwork_rating INT CHECK (teamwork_rating >= 1 AND teamwork_rating <= 5),
    communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
    overall_rating DECIMAL(3,2),
    strengths TEXT,
    areas_for_improvement TEXT,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX idx_ojt_tasks_assigned_to ON ojt_tasks(assigned_to);
CREATE INDEX idx_ojt_tasks_assigned_by ON ojt_tasks(assigned_by);
CREATE INDEX idx_ojt_tasks_status ON ojt_tasks(status);
CREATE INDEX idx_ojt_timesheets_trainee ON ojt_timesheets(trainee_id);
CREATE INDEX idx_ojt_timesheets_supervisor ON ojt_timesheets(supervisor_id);
CREATE INDEX idx_ojt_timesheets_status ON ojt_timesheets(status);
CREATE INDEX idx_ojt_attendance_trainee ON ojt_attendance(trainee_id);
CREATE INDEX idx_ojt_attendance_date ON ojt_attendance(attendance_date);
CREATE INDEX idx_ojt_assignments_supervisor ON ojt_assignments(supervisor_id);
CREATE INDEX idx_ojt_assignments_trainee ON ojt_assignments(trainee_id);

-- Insert sample data for testing
-- First, let's create a sample supervisor and trainees if they don't exist

-- Sample OJT Supervisor (if not exists)
INSERT IGNORE INTO users (email, password_hash, first_name, last_name, role, status)
VALUES ('supervisor@fragranza.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maria', 'Santos', 'ojt_supervisor', 'active');

-- Sample OJT Trainees
INSERT IGNORE INTO users (email, password_hash, first_name, last_name, role, status, university, course, required_hours)
VALUES 
('trainee1@fragranza.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan', 'Dela Cruz', 'ojt', 'active', 'University of the Philippines', 'BS Computer Science', 500),
('trainee2@fragranza.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana', 'Garcia', 'ojt', 'active', 'Ateneo de Manila University', 'BS Information Technology', 500),
('trainee3@fragranza.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pedro', 'Reyes', 'ojt', 'active', 'De La Salle University', 'BS Computer Engineering', 500);

-- Note: Password for all sample users is 'password'
