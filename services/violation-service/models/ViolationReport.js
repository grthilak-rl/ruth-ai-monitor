const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ViolationReport = sequelize.define('ViolationReport', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
    validate: {
      isDate: true
    }
  },
  violation_type: {
    type: DataTypes.ENUM('ppe_missing', 'fall_risk', 'unauthorized_access', 'fire_hazard', 'spill_hazard', 'machine_safety', 'work_at_height'),
    allowNull: false,
    field: 'violation_type',
    validate: {
      isIn: [['ppe_missing', 'fall_risk', 'unauthorized_access', 'fire_hazard', 'spill_hazard', 'machine_safety', 'work_at_height']]
    }
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    validate: {
      isIn: [['low', 'medium', 'high', 'critical']]
    }
  },
  status: {
    type: DataTypes.ENUM('new', 'acknowledged', 'resolved', 'false_positive'),
    allowNull: false,
    defaultValue: 'new',
    validate: {
      isIn: [['new', 'acknowledged', 'resolved', 'false_positive']]
    }
  },
  confidence_score: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: true,
    field: 'confidence_score',
    validate: {
      min: 0,
      max: 100
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    }
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'thumbnail_url',
    validate: {
      isUrl: true
    }
  },
  full_image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'full_image_url',
    validate: {
      isUrl: true
    }
  },
  resolution_date: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resolution_date'
  },
  camera_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'camera_id',
    references: {
      model: 'cameras',
      key: 'id'
    }
  },
  investigator_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'investigator_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  ai_model_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'ai_model_id',
    comment: 'AI model that detected this violation'
  },
  detection_data: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'detection_data',
    comment: 'Raw detection data from AI model'
  },
  bounding_boxes: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'bounding_boxes',
    comment: 'Bounding boxes of detected objects'
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
  tableName: 'violation_reports',
  created_ats: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['created_at']
    },
    {
      fields: ['violation_type']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['status']
    },
    {
      fields: ['camera_id']
    },
    {
      fields: ['investigator_id']
    },
    {
      fields: ['ai_confidence']
    }
  ]
});

// Instance methods
ViolationReport.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  return values;
};

ViolationReport.prototype.getPublicInfo = function() {
  return {
    id: this.id,
    created_at: this.created_at,
    violation_type: this.violation_type,
    severity: this.severity,
    status: this.status,
    ai_confidence: this.ai_confidence,
    description: this.description,
    notes: this.notes,
    thumbnail_url: this.thumbnail_url,
    full_image_url: this.full_image_url,
    resolution_date: this.resolution_date,
    camera_id: this.camera_id,
    investigator_id: this.investigator_id,
    ai_model_id: this.ai_model_id,
    detection_data: this.detection_data,
    bounding_boxes: this.bounding_boxes,
    created_at: this.created_at,
    updated_at: this.updated_at
  };
};

ViolationReport.prototype.getSummary = function() {
  return {
    id: this.id,
    created_at: this.created_at,
    violation_type: this.violation_type,
    severity: this.severity,
    status: this.status,
    ai_confidence: this.ai_confidence,
    camera_id: this.camera_id,
    investigator_id: this.investigator_id
  };
};

// Class methods
ViolationReport.findByStatus = async function(status) {
  return await this.findAll({ 
    where: { status },
    order: [['created_at', 'DESC']]
  });
};

ViolationReport.findBySeverity = async function(severity) {
  return await this.findAll({ 
    where: { severity },
    order: [['created_at', 'DESC']]
  });
};

ViolationReport.findByViolationType = async function(violationType) {
  return await this.findAll({ 
    where: { violation_type: violationType },
    order: [['created_at', 'DESC']]
  });
};

ViolationReport.findByCamera = async function(cameraId) {
  return await this.findAll({ 
    where: { camera_id: cameraId },
    order: [['created_at', 'DESC']]
  });
};

ViolationReport.findByDateRange = async function(startDate, endDate) {
  return await this.findAll({
    where: {
      created_at: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    },
    order: [['created_at', 'DESC']]
  });
};

ViolationReport.getViolationStats = async function() {
  const stats = await this.findAll({
    attributes: [
      'violation_type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['violation_type'],
    raw: true
  });

  const severityStats = await this.findAll({
    attributes: [
      'severity',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['severity'],
    raw: true
  });

  const statusStats = await this.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status'],
    raw: true
  });

  const total = await this.count();
  const today = await this.count({
    where: {
      created_at: {
        [sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  const thisWeek = await this.count({
    where: {
      created_at: {
        [sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  });

  return {
    total,
    today,
    this_week: thisWeek,
    by_type: stats.reduce((acc, stat) => {
      acc[stat.violation_type] = parseInt(stat.count);
      return acc;
    }, {}),
    by_severity: severityStats.reduce((acc, stat) => {
      acc[stat.severity] = parseInt(stat.count);
      return acc;
    }, {}),
    by_status: statusStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {})
  };
};

ViolationReport.getRecentViolations = async function(limit = 10) {
  return await this.findAll({
    order: [['created_at', 'DESC']],
    limit,
    attributes: ['id', 'created_at', 'violation_type', 'severity', 'status', 'ai_confidence', 'camera_id']
  });
};

ViolationReport.getCriticalViolations = async function() {
  return await this.findAll({
    where: {
      severity: 'critical',
      status: 'investigating'
    },
    order: [['created_at', 'DESC']]
  });
};

// Associations (if needed for other services)
ViolationReport.associate = function(models) {
  // Define associations here if needed
  // ViolationReport.belongsTo(models.Camera, {
  //   foreignKey: 'camera_id',
  //   as: 'camera'
  // });
  
  // ViolationReport.belongsTo(models.User, {
  //   foreignKey: 'investigator_id',
  //   as: 'investigator'
  // });
};

module.exports = ViolationReport;
