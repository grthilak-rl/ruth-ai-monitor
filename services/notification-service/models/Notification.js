const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 2000]
    }
  },
  type: {
    type: DataTypes.ENUM('violation', 'system', 'maintenance', 'alert', 'info'),
    allowNull: false,
    validate: {
      isIn: [['violation', 'system', 'maintenance', 'alert', 'info']]
    }
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium',
    validate: {
      isIn: [['low', 'medium', 'high', 'critical']]
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'read'),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'sent', 'delivered', 'failed', 'read']]
    }
  },
  channels: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['in_app'],
    comment: 'Array of notification channels: in_app, email, sms, push'
  },
  recipient_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'recipient_id',
    comment: 'Specific user ID for targeted notifications'
  },
  recipient_type: {
    type: DataTypes.ENUM('user', 'role', 'all'),
    allowNull: false,
    defaultValue: 'all',
    field: 'recipient_type',
    validate: {
      isIn: [['user', 'role', 'all']]
    }
  },
  recipient_value: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'recipient_value',
    comment: 'Role name or user ID for targeted notifications'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data like violation_id, camera_id, etc.'
  },
  template_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'template_id',
    comment: 'Template used for this notification'
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'scheduled_at',
    comment: 'When to send the notification (for scheduled notifications)'
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_at',
    comment: 'When the notification was actually sent'
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
    comment: 'When the notification was read by the user'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at',
    comment: 'When the notification expires'
  },
  retry_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'retry_count',
    comment: 'Number of retry attempts for failed notifications'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
    comment: 'Error message if notification failed'
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
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['recipient_id']
    },
    {
      fields: ['recipient_type']
    },
    {
      fields: ['type']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['status']
    },
    {
      fields: ['scheduled_at']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['expires_at']
    }
  ]
});

// Instance methods
Notification.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  return values;
};

Notification.prototype.getPublicInfo = function() {
  return {
    id: this.id,
    title: this.title,
    message: this.message,
    type: this.type,
    severity: this.severity,
    status: this.status,
    channels: this.channels,
    recipient_id: this.recipient_id,
    recipient_type: this.recipient_type,
    recipient_value: this.recipient_value,
    metadata: this.metadata,
    template_id: this.template_id,
    scheduled_at: this.scheduled_at,
    sent_at: this.sent_at,
    read_at: this.read_at,
    expires_at: this.expires_at,
    retry_count: this.retry_count,
    error_message: this.error_message,
    created_at: this.created_at,
    updated_at: this.updated_at
  };
};

Notification.prototype.getSummary = function() {
  return {
    id: this.id,
    title: this.title,
    type: this.type,
    severity: this.severity,
    status: this.status,
    recipient_id: this.recipient_id,
    created_at: this.created_at,
    read_at: this.read_at
  };
};

// Class methods
Notification.findByRecipient = async function(recipientId) {
  return await this.findAll({ 
    where: { recipient_id: recipientId },
    order: [['created_at', 'DESC']]
  });
};

Notification.findByType = async function(type) {
  return await this.findAll({ 
    where: { type },
    order: [['created_at', 'DESC']]
  });
};

Notification.findByStatus = async function(status) {
  return await this.findAll({ 
    where: { status },
    order: [['created_at', 'DESC']]
  });
};

Notification.findUnread = async function(recipientId = null) {
  const whereClause = { 
    status: { [require('sequelize').Op.in]: ['sent', 'delivered'] },
    read_at: null
  };
  
  if (recipientId) {
    whereClause.recipient_id = recipientId;
  }
  
  return await this.findAll({ 
    where: whereClause,
    order: [['created_at', 'DESC']]
  });
};

Notification.findPending = async function() {
  return await this.findAll({ 
    where: { 
      status: 'pending',
      scheduled_at: {
        [require('sequelize').Op.lte]: new Date()
      }
    },
    order: [['created_at', 'ASC']]
  });
};

Notification.findExpired = async function() {
  return await this.findAll({ 
    where: { 
      expires_at: {
        [require('sequelize').Op.lt]: new Date()
      },
      status: { [require('sequelize').Op.in]: ['pending', 'sent'] }
    },
    order: [['created_at', 'DESC']]
  });
};

Notification.getNotificationStats = async function() {
  const stats = await this.findAll({
    attributes: [
      'type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['type'],
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
  const unread = await this.count({
    where: {
      status: { [require('sequelize').Op.in]: ['sent', 'delivered'] },
      read_at: null
    }
  });

  const today = await this.count({
    where: {
      created_at: {
        [require('sequelize').Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  return {
    total,
    unread,
    today,
    by_type: stats.reduce((acc, stat) => {
      acc[stat.type] = parseInt(stat.count);
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

Notification.getRecentNotifications = async function(limit = 10) {
  return await this.findAll({
    order: [['created_at', 'DESC']],
    limit,
    attributes: ['id', 'title', 'type', 'severity', 'status', 'recipient_id', 'created_at']
  });
};

Notification.getCriticalNotifications = async function() {
  return await this.findAll({
    where: {
      severity: 'critical',
      status: { [require('sequelize').Op.in]: ['pending', 'sent'] }
    },
    order: [['created_at', 'DESC']]
  });
};

// Associations (if needed for other services)
Notification.associate = function(models) {
  // Define associations here if needed
  // Notification.belongsTo(models.User, {
  //   foreignKey: 'recipient_id',
  //   as: 'recipient'
  // });
};

module.exports = Notification;
