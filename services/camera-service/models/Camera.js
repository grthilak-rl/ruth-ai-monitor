const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Camera = sequelize.define('Camera', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'maintenance'),
    allowNull: false,
    defaultValue: 'offline',
    validate: {
      isIn: [['online', 'offline', 'maintenance']]
    }
  },
  feed_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'feed_url'
  },
  last_maintenance: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_maintenance'
  },
  installation_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'installation_date'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  vas_device_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'vas_device_id',
    comment: 'VAS device ID for integration'
  },
  janus_stream_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'janus_stream_id',
    comment: 'Janus Gateway stream ID for WebRTC'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address'
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 65535
    }
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  resolution: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['1920x1080', '1280x720', '640x480', '320x240']]
    }
  },
  frame_rate: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 60
    },
    field: 'frame_rate'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'cameras',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['vas_device_id']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Instance methods
Camera.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  // Don't expose password in JSON output
  delete values.password;
  return values;
};

Camera.prototype.getPublicInfo = function() {
  return {
    id: this.id,
    name: this.name,
    location: this.location,
    status: this.status,
    feed_url: this.feed_url,
    last_maintenance: this.last_maintenance,
    installation_date: this.installation_date,
    is_active: this.is_active,
    vas_device_id: this.vas_device_id,
    janus_stream_id: this.janus_stream_id,
    ip_address: this.ip_address,
    port: this.port,
    username: this.username,
    resolution: this.resolution,
    frame_rate: this.frame_rate,
    created_at: this.created_at,
    updated_at: this.updated_at
  };
};

Camera.prototype.getStreamInfo = function() {
  return {
    id: this.id,
    name: this.name,
    location: this.location,
    status: this.status,
    vas_device_id: this.vas_device_id,
    janus_stream_id: this.janus_stream_id,
    feed_url: this.feed_url,
    ip_address: this.ip_address,
    port: this.port,
    resolution: this.resolution,
    frame_rate: this.frame_rate
  };
};

// Class methods
Camera.findByVASDeviceId = async function(vasDeviceId) {
  return await this.findOne({ where: { vas_device_id: vasDeviceId } });
};

Camera.findActiveCameras = async function() {
  return await this.findAll({ 
    where: { is_active: true },
    order: [['name', 'ASC']]
  });
};

Camera.findOnlineCameras = async function() {
  return await this.findAll({ 
    where: { 
      is_active: true,
      status: 'online'
    },
    order: [['name', 'ASC']]
  });
};

Camera.findByStatus = async function(status) {
  return await this.findAll({ 
    where: { status },
    order: [['name', 'ASC']]
  });
};

Camera.getCameraStats = async function() {
  const stats = await this.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status'],
    raw: true
  });

  const total = await this.count();
  const active = await this.count({ where: { is_active: true } });

  return {
    total,
    active,
    inactive: total - active,
    by_status: stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {})
  };
};

// Associations (if needed for other services)
Camera.associate = function(models) {
  // Define associations here if needed
  // Camera.hasMany(models.ViolationReport, {
  //   foreignKey: 'camera_id',
  //   as: 'violations'
  // });
  
  // Camera.belongsToMany(models.DetectionModel, {
  //   through: 'CameraDetectionModels',
  //   foreignKey: 'camera_id',
  //   as: 'detectionModels'
  // });
};

module.exports = Camera;
