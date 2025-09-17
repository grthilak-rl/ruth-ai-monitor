-- Ruth-AI Monitor Database Initialization
-- This script creates the database schema for the microservices architecture

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ruth_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ruth_monitor;

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role ENUM('admin', 'operator', 'viewer') DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cameras table
CREATE TABLE IF NOT EXISTS cameras (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status ENUM('online', 'offline', 'maintenance') DEFAULT 'offline',
    feed_url VARCHAR(500),
    last_maintenance TIMESTAMP NULL,
    installation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    vas_device_id VARCHAR(255) NULL COMMENT 'VAS device ID for integration',
    janus_stream_id VARCHAR(255) NULL COMMENT 'Janus Gateway stream ID for WebRTC',
    ip_address VARCHAR(45),
    port INT,
    username VARCHAR(255),
    password VARCHAR(255),
    resolution VARCHAR(20),
    frame_rate INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Detection models table
CREATE TABLE IF NOT EXISTS detection_models (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_type ENUM('fall_detection', 'work_at_height', 'ppe_detection', 'fire_detection') NOT NULL,
    accuracy DECIMAL(5,2),
    version VARCHAR(50),
    model_path VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Camera-Detection Model association table
CREATE TABLE IF NOT EXISTS camera_detection_models (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    camera_id INT UNSIGNED NOT NULL,
    detection_model_id INT UNSIGNED NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_activated TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
    FOREIGN KEY (detection_model_id) REFERENCES detection_models(id) ON DELETE CASCADE,
    UNIQUE KEY unique_camera_model (camera_id, detection_model_id)
);

-- Violation reports table
CREATE TABLE IF NOT EXISTS violation_reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    camera_id INT UNSIGNED NOT NULL,
    detection_model_id INT UNSIGNED NOT NULL,
    violation_type ENUM('ppe_missing', 'fall_risk', 'fire_hazard', 'spill_hazard', 'machine_safety') NOT NULL,
    confidence_score DECIMAL(5,2),
    description TEXT,
    image_path VARCHAR(500),
    video_path VARCHAR(500),
    coordinates JSON,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('new', 'acknowledged', 'resolved', 'false_positive') DEFAULT 'new',
    acknowledged_by INT UNSIGNED NULL,
    acknowledged_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
    FOREIGN KEY (detection_model_id) REFERENCES detection_models(id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Snapshots table (for VAS integration)
CREATE TABLE IF NOT EXISTS snapshots (
    id VARCHAR(36) PRIMARY KEY,
    camera_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    vas_snapshot_id VARCHAR(255) NULL,
    timestamp TIMESTAMP NOT NULL,
    image_path VARCHAR(500),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bookmarks table (for VAS integration)
CREATE TABLE IF NOT EXISTS bookmarks (
    id VARCHAR(36) PRIMARY KEY,
    camera_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    vas_bookmark_id VARCHAR(255) NULL,
    timestamp TIMESTAMP NOT NULL,
    description TEXT,
    mouse_position JSON,
    video_path VARCHAR(500),
    snapshot_path VARCHAR(500),
    duration_before INT DEFAULT 5,
    duration_after INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT IGNORE INTO users (username, email, password_hash, first_name, last_name, role) 
VALUES ('admin', 'admin@ruth-ai.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin');

-- Insert default detection models
INSERT IGNORE INTO detection_models (name, description, model_type, accuracy, version) VALUES
('Fall Detection Model', 'YOLOv7-based pose estimation for fall detection', 'fall_detection', 94.5, '1.0.0'),
('Work at Height Detection', 'YOLOv8-based object detection for work at height safety', 'work_at_height', 92.3, '1.0.0'),
('PPE Detection Model', 'Personal Protective Equipment detection model', 'ppe_detection', 89.7, '1.0.0'),
('Fire Detection Model', 'Fire and smoke detection model', 'fire_detection', 96.1, '1.0.0');

-- Insert default system settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('vas_api_url', 'http://10.30.250.245:8000/api', 'VAS API endpoint URL'),
('vas_username', 'admin', 'VAS API username'),
('jwt_secret', 'ruth_monitor_jwt_secret_key', 'JWT secret key'),
('jwt_expires_in', '24h', 'JWT token expiration time'),
('max_violation_age_days', '30', 'Maximum age for violation reports in days'),
('snapshot_retention_days', '7', 'Snapshot retention period in days'),
('bookmark_retention_days', '30', 'Bookmark retention period in days');

-- Create indexes for better performance
CREATE INDEX idx_cameras_status ON cameras(status);
CREATE INDEX idx_cameras_vas_device_id ON cameras(vas_device_id);
CREATE INDEX idx_violation_reports_camera_id ON violation_reports(camera_id);
CREATE INDEX idx_violation_reports_created_at ON violation_reports(created_at);
CREATE INDEX idx_violation_reports_status ON violation_reports(status);
CREATE INDEX idx_snapshots_camera_id ON snapshots(camera_id);
CREATE INDEX idx_snapshots_timestamp ON snapshots(timestamp);
CREATE INDEX idx_bookmarks_camera_id ON bookmarks(camera_id);
CREATE INDEX idx_bookmarks_timestamp ON bookmarks(timestamp);

-- Create views for common queries
CREATE OR REPLACE VIEW camera_with_models AS
SELECT 
    c.*,
    GROUP_CONCAT(DISTINCT dm.name) as model_names,
    GROUP_CONCAT(DISTINCT dm.model_type) as model_types,
    COUNT(DISTINCT dm.id) as model_count
FROM cameras c
LEFT JOIN camera_detection_models cdm ON c.id = cdm.camera_id AND cdm.is_active = TRUE
LEFT JOIN detection_models dm ON cdm.detection_model_id = dm.id AND dm.is_active = TRUE
GROUP BY c.id;

CREATE OR REPLACE VIEW violation_summary AS
SELECT 
    vr.*,
    c.name as camera_name,
    c.location as camera_location,
    dm.name as model_name,
    dm.model_type,
    u.username as acknowledged_by_username
FROM violation_reports vr
JOIN cameras c ON vr.camera_id = c.id
JOIN detection_models dm ON vr.detection_model_id = dm.id
LEFT JOIN users u ON vr.acknowledged_by = u.id;
