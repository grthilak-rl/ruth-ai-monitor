const { DataTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  first_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'first_name'
  },
  last_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'last_name'
  },
  role: {
    type: DataTypes.ENUM('admin', 'operator', 'viewer'),
    allowNull: false,
    defaultValue: 'viewer',
    validate: {
      isIn: [['admin', 'operator', 'viewer']]
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
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
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(12);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(12);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  try {
    const isValid = await bcrypt.compare(password, this.password_hash);
    return isValid;
  } catch (error) {
    console.error('Password validation error:', error);
    return false;
  }
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password_hash;
  return values;
};

User.prototype.getPublicProfile = function() {
  return {
    id: this.id,
    username: this.username,
    email: this.email,
    first_name: this.first_name,
    last_name: this.last_name,
    role: this.role,
    is_active: this.is_active,
    last_login: this.last_login,
    created_at: this.created_at
  };
};

// Class methods
User.findByEmail = async function(email) {
  return await this.findOne({ where: { email } });
};

User.findByUsername = async function(username) {
  return await this.findOne({ where: { username } });
};

User.findActiveUser = async function(identifier) {
  return await this.findOne({
    where: {
      [Op.or]: [
        { email: identifier },
        { username: identifier }
      ],
      is_active: true
    }
  });
};

// Associations (if needed for other services)
User.associate = function(models) {
  // Define associations here if needed
  // User.hasMany(models.ViolationReport, {
  //   foreignKey: 'acknowledged_by',
  //   as: 'acknowledged_violations'
  // });
};

module.exports = User;
