const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CameraModelSubscription = sequelize.define('CameraModelSubscription', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  camera_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'camera_id'
  },
  detection_model_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'detection_model_id'
  },
  subscribed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'subscribed_at'
  },
  subscribed_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'subscribed_by'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'camera_model_subscriptions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['camera_id', 'detection_model_id'],
      name: 'unique_camera_model'
    },
    {
      fields: ['is_active'],
      name: 'idx_active'
    },
    {
      fields: ['camera_id'],
      name: 'idx_camera'
    },
    {
      fields: ['detection_model_id'],
      name: 'idx_model'
    }
  ]
});

module.exports = CameraModelSubscription;
