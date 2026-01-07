-- Migration: Add camera_model_subscriptions table
-- Date: 2025-12-17
-- Description: Adds subscription tracking for camera-model associations

USE ruth_monitor;

-- Create camera_model_subscriptions table
CREATE TABLE IF NOT EXISTS camera_model_subscriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  camera_id INT UNSIGNED NOT NULL,
  detection_model_id INT UNSIGNED NOT NULL,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  subscribed_by INT UNSIGNED,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_camera_model (camera_id, detection_model_id),
  FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
  FOREIGN KEY (detection_model_id) REFERENCES detection_models(id) ON DELETE CASCADE,
  FOREIGN KEY (subscribed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_active (is_active),
  INDEX idx_camera (camera_id),
  INDEX idx_model (detection_model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing camera_detection_models data to subscriptions
INSERT INTO camera_model_subscriptions (camera_id, detection_model_id, is_active, subscribed_at, created_at, updated_at)
SELECT
  camera_id,
  detection_model_id,
  is_active,
  COALESCE(last_activated, created_at) as subscribed_at,
  created_at,
  updated_at
FROM camera_detection_models
ON DUPLICATE KEY UPDATE
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;

-- Verify migration
SELECT 'Migration completed successfully' AS status,
       COUNT(*) AS subscriptions_created
FROM camera_model_subscriptions;
