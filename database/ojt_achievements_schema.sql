-- OJT Achievements Schema
-- Creates tables for trainee achievements and badges

-- Achievement Definitions Table
CREATE TABLE IF NOT EXISTS ojt_achievement_definitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT '🏆',
    badge_color VARCHAR(50) DEFAULT 'gold',
    category ENUM('attendance', 'tasks', 'milestones', 'special') DEFAULT 'milestones',
    requirement_type ENUM('count', 'streak', 'percentage', 'single') DEFAULT 'count',
    requirement_value INT DEFAULT 1,
    points INT DEFAULT 10,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Achievements Table (earned achievements)
CREATE TABLE IF NOT EXISTS ojt_user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress INT DEFAULT 0,
    is_notified TINYINT(1) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES ojt_achievement_definitions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id)
);

-- Insert Default Achievements
INSERT INTO ojt_achievement_definitions (code, name, description, icon, badge_color, category, requirement_type, requirement_value, points) VALUES
-- Attendance Achievements
('first_clock_in', 'First Day', 'Clock in for the first time', '🌟', 'blue', 'attendance', 'single', 1, 10),
('perfect_week', 'Perfect Week', 'No late arrivals for a full week (5 days)', '⭐', 'gold', 'attendance', 'streak', 5, 50),
('early_bird', 'Early Bird', 'Clock in 15+ minutes early 5 times', '🐦', 'orange', 'attendance', 'count', 5, 30),
('perfect_month', 'Perfect Month', 'No late arrivals for a full month', '👑', 'purple', 'attendance', 'streak', 22, 100),
('attendance_50', '50 Hours Completed', 'Complete 50 hours of OJT', '⏰', 'teal', 'attendance', 'count', 50, 50),
('attendance_100', '100 Hours Completed', 'Complete 100 hours of OJT', '💯', 'emerald', 'attendance', 'count', 100, 100),
('attendance_200', '200 Hours Completed', 'Complete 200 hours of OJT', '🎯', 'gold', 'attendance', 'count', 200, 200),
('attendance_300', '300 Hours Completed', 'Complete 300 hours of OJT', '🏅', 'amber', 'attendance', 'count', 300, 300),

-- Task Achievements
('first_task', 'Getting Started', 'Complete your first task', '📝', 'green', 'tasks', 'single', 1, 10),
('task_5', 'Task Achiever', 'Complete 5 tasks', '✅', 'green', 'tasks', 'count', 5, 25),
('task_10', 'Task Master', 'Complete 10 tasks', '🎖️', 'blue', 'tasks', 'count', 10, 50),
('task_25', 'Task Champion', 'Complete 25 tasks', '🏆', 'gold', 'tasks', 'count', 25, 100),
('perfect_task', 'Perfectionist', 'Get a 5/5 score on a task', '💎', 'purple', 'tasks', 'single', 1, 25),
('no_revision', 'First Try', 'Complete 5 tasks with no revisions needed', '🎯', 'emerald', 'tasks', 'count', 5, 40),

-- Milestone Achievements
('week_1', 'Week 1 Complete', 'Complete your first week of OJT', '📅', 'blue', 'milestones', 'single', 1, 20),
('halfway', 'Halfway There', 'Reach 50% of your OJT program', '🌓', 'amber', 'milestones', 'percentage', 50, 75),
('almost_done', 'Almost Done', 'Reach 90% of your OJT program', '🌕', 'gold', 'milestones', 'percentage', 90, 100),
('graduate', 'Graduate', 'Complete your OJT program', '🎓', 'purple', 'milestones', 'percentage', 100, 200),

-- Special Achievements
('quick_learner', 'Quick Learner', 'Complete first module in record time', '⚡', 'yellow', 'special', 'single', 1, 30),
('team_player', 'Team Player', 'Receive positive feedback from supervisor', '🤝', 'pink', 'special', 'single', 1, 25),
('dedicated', 'Dedicated', 'Log in on a weekend (optional)', '💪', 'red', 'special', 'single', 1, 15);
