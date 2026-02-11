-- Real OJT Data for Fragranza
-- This populates realistic intern and task data

-- Update existing OJT users with real data
UPDATE users SET 
    first_name = 'Renz Russel',
    last_name = 'Bauto',
    university = 'Polytechnic University of the Philippines',
    course = 'BS Information Technology',
    required_hours = 486,
    hours_completed = 312,
    ojt_start_date = '2025-11-04',
    ojt_end_date = '2026-03-15',
    department = 'IT Department',
    phone = '09171234567'
WHERE email = 'ojt@fragranza.com';

UPDATE users SET 
    first_name = 'Angela Mae',
    last_name = 'Dela Cruz',
    university = 'Technological University of the Philippines',
    course = 'BS Computer Science',
    required_hours = 486,
    hours_completed = 280,
    ojt_start_date = '2025-11-04',
    ojt_end_date = '2026-03-15',
    department = 'IT Department',
    phone = '09182345678'
WHERE email = 'ojt1@fragranza.com';

UPDATE users SET 
    first_name = 'John Patrick',
    last_name = 'Villanueva',
    university = 'University of the Philippines - Diliman',
    course = 'BS Computer Science',
    required_hours = 486,
    hours_completed = 245,
    ojt_start_date = '2025-11-11',
    ojt_end_date = '2026-03-22',
    department = 'Web Development',
    phone = '09193456789'
WHERE email = 'trainee1@fragranza.com';

UPDATE users SET 
    first_name = 'Maria Cristina',
    last_name = 'Santos',
    university = 'Ateneo de Manila University',
    course = 'BS Information Systems',
    required_hours = 486,
    hours_completed = 198,
    ojt_start_date = '2025-11-18',
    ojt_end_date = '2026-03-29',
    department = 'Digital Marketing',
    phone = '09204567890'
WHERE email = 'trainee2@fragranza.com';

UPDATE users SET 
    first_name = 'Rafael',
    last_name = 'Gonzales',
    university = 'De La Salle University',
    course = 'BS Information Technology',
    required_hours = 486,
    hours_completed = 156,
    ojt_start_date = '2025-11-25',
    ojt_end_date = '2026-04-05',
    department = 'E-commerce Operations',
    phone = '09215678901'
WHERE email = 'trainee3@fragranza.com';

-- Update supervisor with real info
UPDATE users SET 
    first_name = 'Jennifer',
    last_name = 'Mendoza',
    department = 'IT Department',
    position = 'IT Supervisor / OJT Coordinator',
    phone = '09171112233'
WHERE email = 'supervisor@fragranza.com';

-- Update assignments with correct departments
UPDATE ojt_assignments SET department = 'IT Department' WHERE trainee_id = 6;
UPDATE ojt_assignments SET department = 'IT Department' WHERE trainee_id = 9;
UPDATE ojt_assignments SET department = 'Web Development' WHERE trainee_id = 11;
UPDATE ojt_assignments SET department = 'Digital Marketing' WHERE trainee_id = 12;
UPDATE ojt_assignments SET department = 'E-commerce Operations' WHERE trainee_id = 13;

-- Clear existing tasks and create real ones
DELETE FROM ojt_tasks;

-- Tasks for Renz Russel Bauto (ID: 6) - IT Department
INSERT INTO ojt_tasks (title, description, assigned_to, assigned_by, priority, status, due_date, created_at) VALUES
('Setup Development Environment', 'Install and configure XAMPP, VS Code, Git, and Node.js on workstation. Document the setup process for future interns.', 6, 7, 'high', 'completed', '2025-11-08', '2025-11-04 08:00:00'),
('Database Schema Documentation', 'Create comprehensive documentation for the fragranza_db database schema including all tables, relationships, and field descriptions.', 6, 7, 'medium', 'completed', '2025-11-15', '2025-11-06 09:00:00'),
('Implement User Authentication', 'Develop the PHP backend for user login, registration, and session management with proper security measures.', 6, 7, 'high', 'completed', '2025-11-22', '2025-11-11 10:00:00'),
('Product Catalog API Development', 'Create RESTful API endpoints for product listing, filtering, search, and pagination functionality.', 6, 7, 'high', 'completed', '2025-12-06', '2025-11-18 09:00:00'),
('Shopping Cart Implementation', 'Develop frontend and backend for shopping cart functionality including add, remove, update quantity, and persist cart data.', 6, 7, 'high', 'completed', '2025-12-20', '2025-12-01 10:00:00'),
('Order Management System', 'Build the order processing system including checkout flow, order status tracking, and order history.', 6, 7, 'high', 'in_progress', '2026-02-14', '2026-01-15 09:00:00'),
('Inventory Management Module', 'Create inventory tracking system with stock alerts, reorder notifications, and inventory reports.', 6, 7, 'medium', 'pending', '2026-02-28', '2026-02-01 10:00:00'),
('System Testing & Bug Fixes', 'Conduct thorough testing of all developed modules and fix identified bugs. Create test documentation.', 6, 7, 'high', 'pending', '2026-03-10', '2026-02-15 09:00:00');

-- Tasks for Angela Mae Dela Cruz (ID: 9) - IT Department
INSERT INTO ojt_tasks (title, description, assigned_to, assigned_by, priority, status, due_date, created_at) VALUES
('Learn React & TypeScript Basics', 'Complete React fundamentals course and build sample components. Document learning progress.', 9, 7, 'high', 'completed', '2025-11-11', '2025-11-04 08:30:00'),
('UI Component Library Setup', 'Set up and configure Tailwind CSS, create reusable UI components (buttons, inputs, cards, modals).', 9, 7, 'medium', 'completed', '2025-11-18', '2025-11-08 09:00:00'),
('Homepage Design Implementation', 'Convert Figma designs to responsive React components for the homepage including hero section, featured products, and testimonials.', 9, 7, 'high', 'completed', '2025-11-29', '2025-11-15 10:00:00'),
('Product Listing Page', 'Develop the product catalog page with grid/list views, filtering sidebar, sorting options, and pagination.', 9, 7, 'high', 'completed', '2025-12-13', '2025-11-25 09:00:00'),
('Product Detail Page', 'Create the product detail page with image gallery, size/variant selection, add to cart, and related products section.', 9, 7, 'high', 'completed', '2025-12-27', '2025-12-08 10:00:00'),
('User Dashboard Development', 'Build the customer dashboard with order history, address book, wishlist, and profile management.', 9, 7, 'high', 'in_progress', '2026-02-07', '2026-01-08 09:00:00'),
('Checkout Flow UI', 'Implement multi-step checkout process with address form, payment method selection, and order confirmation.', 9, 7, 'high', 'pending', '2026-02-21', '2026-02-01 10:00:00'),
('Mobile Responsiveness Optimization', 'Ensure all pages are fully responsive and optimized for mobile devices. Test on various screen sizes.', 9, 7, 'medium', 'pending', '2026-03-07', '2026-02-10 09:00:00');

-- Tasks for John Patrick Villanueva (ID: 11) - Web Development
INSERT INTO ojt_tasks (title, description, assigned_to, assigned_by, priority, status, due_date, created_at) VALUES
('Git Version Control Training', 'Learn Git workflow, branching strategies, and collaboration practices. Set up GitHub account and practice with sample repo.', 11, 7, 'high', 'completed', '2025-11-15', '2025-11-11 08:00:00'),
('Admin Dashboard Layout', 'Create the admin panel layout with sidebar navigation, header with user menu, and main content area.', 11, 7, 'medium', 'completed', '2025-11-22', '2025-11-13 09:00:00'),
('Admin Product Management', 'Develop CRUD interface for managing products including image upload, categories, pricing, and inventory.', 11, 7, 'high', 'completed', '2025-12-06', '2025-11-20 10:00:00'),
('Admin Order Management', 'Build order management interface with order list, filtering, status updates, and order details view.', 11, 7, 'high', 'completed', '2025-12-20', '2025-12-01 09:00:00'),
('Admin User Management', 'Create user management system with user list, role assignment, account status, and activity logs.', 11, 7, 'high', 'in_progress', '2026-02-01', '2026-01-10 10:00:00'),
('Sales Reports & Analytics', 'Implement sales dashboard with charts, revenue reports, top products, and export functionality.', 11, 7, 'medium', 'pending', '2026-02-15', '2026-01-25 09:00:00'),
('Content Management System', 'Build CMS for managing homepage banners, promotional content, and static pages.', 11, 7, 'low', 'pending', '2026-03-01', '2026-02-05 10:00:00');

-- Tasks for Maria Cristina Santos (ID: 12) - Digital Marketing
INSERT INTO ojt_tasks (title, description, assigned_to, assigned_by, priority, status, due_date, created_at) VALUES
('Social Media Audit', 'Analyze current social media presence, engagement metrics, and competitor analysis. Create comprehensive report.', 12, 7, 'high', 'completed', '2025-11-22', '2025-11-18 08:00:00'),
('Content Calendar Creation', 'Develop monthly content calendar for Facebook, Instagram, and TikTok with post themes and scheduling.', 12, 7, 'medium', 'completed', '2025-11-29', '2025-11-20 09:00:00'),
('Product Photography Guidelines', 'Create photography guidelines for product shots, lifestyle images, and social media content.', 12, 7, 'medium', 'completed', '2025-12-06', '2025-11-25 10:00:00'),
('Email Marketing Setup', 'Set up email marketing platform, create email templates, and plan welcome series and promotional campaigns.', 12, 7, 'high', 'completed', '2025-12-20', '2025-12-02 09:00:00'),
('SEO Optimization', 'Conduct keyword research, optimize product descriptions, meta tags, and create SEO content strategy.', 12, 7, 'high', 'in_progress', '2026-02-01', '2026-01-06 10:00:00'),
('Influencer Marketing Campaign', 'Research and create list of potential influencer partners. Develop outreach strategy and collaboration proposals.', 12, 7, 'medium', 'pending', '2026-02-15', '2026-01-20 09:00:00'),
('Analytics & Reporting Setup', 'Configure Google Analytics, set up conversion tracking, and create weekly/monthly reporting templates.', 12, 7, 'high', 'pending', '2026-02-28', '2026-02-01 10:00:00');

-- Tasks for Rafael Gonzales (ID: 13) - E-commerce Operations
INSERT INTO ojt_tasks (title, description, assigned_to, assigned_by, priority, status, due_date, created_at) VALUES
('E-commerce Platform Training', 'Complete training on the Fragranza e-commerce system, understand order flow, and inventory management.', 13, 7, 'high', 'completed', '2025-11-29', '2025-11-25 08:00:00'),
('Product Data Entry', 'Enter 50 product listings with complete details including descriptions, images, pricing, and categories.', 13, 7, 'medium', 'completed', '2025-12-13', '2025-11-27 09:00:00'),
('Customer Service Protocols', 'Document customer service procedures for inquiries, complaints, returns, and refunds. Create FAQ document.', 13, 7, 'high', 'completed', '2025-12-20', '2025-12-05 10:00:00'),
('Shipping & Logistics Setup', 'Research courier partners, set up shipping rates, and create shipping guidelines document.', 13, 7, 'high', 'in_progress', '2026-01-31', '2025-12-15 09:00:00'),
('Return & Refund Policy', 'Draft comprehensive return and refund policy. Create process flow for handling returns.', 13, 7, 'medium', 'pending', '2026-02-15', '2026-01-10 10:00:00'),
('Inventory Audit Process', 'Develop inventory counting procedures, reconciliation methods, and discrepancy handling protocols.', 13, 7, 'medium', 'pending', '2026-03-01', '2026-02-01 09:00:00');

-- Create timesheets with realistic hours
DELETE FROM ojt_timesheets;

-- Week 1 timesheets (Nov 4-8, 2025)
INSERT INTO ojt_timesheets (trainee_id, supervisor_id, week_start, week_end, total_hours, status, submitted_at, reviewed_at, reviewed_by) VALUES
(6, 7, '2025-11-04', '2025-11-08', 40, 'approved', '2025-11-08 17:00:00', '2025-11-09 09:00:00', 7),
(9, 7, '2025-11-04', '2025-11-08', 40, 'approved', '2025-11-08 17:00:00', '2025-11-09 09:00:00', 7);

-- Week 2 timesheets (Nov 11-15, 2025)
INSERT INTO ojt_timesheets (trainee_id, supervisor_id, week_start, week_end, total_hours, status, submitted_at, reviewed_at, reviewed_by) VALUES
(6, 7, '2025-11-11', '2025-11-15', 40, 'approved', '2025-11-15 17:00:00', '2025-11-16 09:00:00', 7),
(9, 7, '2025-11-11', '2025-11-15', 40, 'approved', '2025-11-15 17:00:00', '2025-11-16 09:00:00', 7),
(11, 7, '2025-11-11', '2025-11-15', 40, 'approved', '2025-11-15 17:00:00', '2025-11-16 09:00:00', 7);

-- Week 3 timesheets (Nov 18-22, 2025)
INSERT INTO ojt_timesheets (trainee_id, supervisor_id, week_start, week_end, total_hours, status, submitted_at, reviewed_at, reviewed_by) VALUES
(6, 7, '2025-11-18', '2025-11-22', 40, 'approved', '2025-11-22 17:00:00', '2025-11-23 09:00:00', 7),
(9, 7, '2025-11-18', '2025-11-22', 40, 'approved', '2025-11-22 17:00:00', '2025-11-23 09:00:00', 7),
(11, 7, '2025-11-18', '2025-11-22', 40, 'approved', '2025-11-22 17:00:00', '2025-11-23 09:00:00', 7),
(12, 7, '2025-11-18', '2025-11-22', 40, 'approved', '2025-11-22 17:00:00', '2025-11-23 09:00:00', 7);

-- Week 4 timesheets (Nov 25-29, 2025)
INSERT INTO ojt_timesheets (trainee_id, supervisor_id, week_start, week_end, total_hours, status, submitted_at, reviewed_at, reviewed_by) VALUES
(6, 7, '2025-11-25', '2025-11-29', 40, 'approved', '2025-11-29 17:00:00', '2025-11-30 09:00:00', 7),
(9, 7, '2025-11-25', '2025-11-29', 40, 'approved', '2025-11-29 17:00:00', '2025-11-30 09:00:00', 7),
(11, 7, '2025-11-25', '2025-11-29', 40, 'approved', '2025-11-29 17:00:00', '2025-11-30 09:00:00', 7),
(12, 7, '2025-11-25', '2025-11-29', 40, 'approved', '2025-11-29 17:00:00', '2025-11-30 09:00:00', 7),
(13, 7, '2025-11-25', '2025-11-29', 40, 'approved', '2025-11-29 17:00:00', '2025-11-30 09:00:00', 7);

-- Recent weeks (Feb 2026)
INSERT INTO ojt_timesheets (trainee_id, supervisor_id, week_start, week_end, total_hours, status, submitted_at) VALUES
(6, 7, '2026-02-03', '2026-02-07', 40, 'submitted', '2026-02-07 17:00:00'),
(9, 7, '2026-02-03', '2026-02-07', 38, 'submitted', '2026-02-07 17:00:00'),
(11, 7, '2026-02-03', '2026-02-07', 40, 'submitted', '2026-02-07 17:00:00'),
(12, 7, '2026-02-03', '2026-02-07', 36, 'submitted', '2026-02-07 17:00:00'),
(13, 7, '2026-02-03', '2026-02-07', 40, 'submitted', '2026-02-07 17:00:00');

-- Current week (draft)
INSERT INTO ojt_timesheets (trainee_id, supervisor_id, week_start, week_end, total_hours, status) VALUES
(6, 7, '2026-02-09', '2026-02-13', 16, 'draft'),
(9, 7, '2026-02-09', '2026-02-13', 16, 'draft'),
(11, 7, '2026-02-09', '2026-02-13', 16, 'draft'),
(12, 7, '2026-02-09', '2026-02-13', 12, 'draft'),
(13, 7, '2026-02-09', '2026-02-13', 16, 'draft');

-- Add some attendance records
DELETE FROM ojt_attendance;

-- Sample attendance for current month
INSERT INTO ojt_attendance (trainee_id, supervisor_id, attendance_date, time_in, time_out, status, notes) VALUES
-- Renz Russel Bauto
(6, 7, '2026-02-03', '2026-02-03 08:00:00', '2026-02-03 17:00:00', 'present', 'Regular work day'),
(6, 7, '2026-02-04', '2026-02-04 08:15:00', '2026-02-04 17:00:00', 'late', 'Traffic delay'),
(6, 7, '2026-02-05', '2026-02-05 08:00:00', '2026-02-05 17:00:00', 'present', NULL),
(6, 7, '2026-02-06', '2026-02-06 08:00:00', '2026-02-06 17:00:00', 'present', NULL),
(6, 7, '2026-02-07', '2026-02-07 08:00:00', '2026-02-07 17:00:00', 'present', NULL),
-- Angela Mae Dela Cruz
(9, 7, '2026-02-03', '2026-02-03 08:00:00', '2026-02-03 17:00:00', 'present', NULL),
(9, 7, '2026-02-04', '2026-02-04 08:00:00', '2026-02-04 17:00:00', 'present', NULL),
(9, 7, '2026-02-05', '2026-02-05 08:00:00', '2026-02-05 16:00:00', 'half_day', 'Doctor appointment'),
(9, 7, '2026-02-06', '2026-02-06 08:00:00', '2026-02-06 17:00:00', 'present', NULL),
(9, 7, '2026-02-07', '2026-02-07 08:00:00', '2026-02-07 17:00:00', 'present', NULL),
-- John Patrick Villanueva
(11, 7, '2026-02-03', '2026-02-03 08:00:00', '2026-02-03 17:00:00', 'present', NULL),
(11, 7, '2026-02-04', '2026-02-04 08:00:00', '2026-02-04 17:00:00', 'present', NULL),
(11, 7, '2026-02-05', '2026-02-05 08:00:00', '2026-02-05 17:00:00', 'present', NULL),
(11, 7, '2026-02-06', NULL, NULL, 'absent', 'Sick leave - flu'),
(11, 7, '2026-02-07', '2026-02-07 08:00:00', '2026-02-07 17:00:00', 'present', NULL),
-- Maria Cristina Santos
(12, 7, '2026-02-03', '2026-02-03 08:30:00', '2026-02-03 17:00:00', 'late', 'MRT delay'),
(12, 7, '2026-02-04', '2026-02-04 08:00:00', '2026-02-04 17:00:00', 'present', NULL),
(12, 7, '2026-02-05', '2026-02-05 08:00:00', '2026-02-05 17:00:00', 'present', NULL),
(12, 7, '2026-02-06', '2026-02-06 08:00:00', '2026-02-06 16:30:00', 'present', 'Left early - school requirement'),
(12, 7, '2026-02-07', '2026-02-07 08:00:00', '2026-02-07 17:00:00', 'present', NULL),
-- Rafael Gonzales
(13, 7, '2026-02-03', '2026-02-03 08:00:00', '2026-02-03 17:00:00', 'present', NULL),
(13, 7, '2026-02-04', '2026-02-04 08:00:00', '2026-02-04 17:00:00', 'present', NULL),
(13, 7, '2026-02-05', '2026-02-05 08:00:00', '2026-02-05 17:00:00', 'present', NULL),
(13, 7, '2026-02-06', '2026-02-06 08:00:00', '2026-02-06 17:00:00', 'present', NULL),
(13, 7, '2026-02-07', '2026-02-07 08:00:00', '2026-02-07 17:00:00', 'present', NULL);

SELECT 'Real OJT data inserted successfully!' as status;
