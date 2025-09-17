const nodemailer = require('nodemailer');
const twilio = require('twilio');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.twilioClient = null;
    this.templates = new Map();
    this.channels = {
      in_app: { enabled: true, name: 'In-App Notifications' },
      email: { enabled: !!process.env.EMAIL_SERVICE_URL, name: 'Email Notifications' },
      sms: { enabled: !!process.env.SMS_SERVICE_URL, name: 'SMS Notifications' },
      push: { enabled: false, name: 'Push Notifications' }
    };
    
    this.initializeServices();
    this.loadTemplates();
    this.setupScheduledTasks();
  }

  /**
   * Initialize notification services
   */
  async initializeServices() {
    try {
      // Initialize email service
      if (process.env.EMAIL_SERVICE_URL) {
        this.emailTransporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        console.log('✅ Email service initialized');
      }

      // Initialize SMS service
      if (process.env.SMS_SERVICE_URL && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('✅ SMS service initialized');
      }
    } catch (error) {
      console.error('❌ Error initializing notification services:', error);
    }
  }

  /**
   * Load notification templates
   */
  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates');
      
      // Default templates
      const defaultTemplates = {
        violation_detected: {
          title: '🚨 Safety Violation Detected',
          message: 'A {{violation_type}} violation has been detected on camera {{camera_name}} with {{confidence}}% confidence.',
          channels: ['in_app', 'email'],
          severity: 'high'
        },
        camera_offline: {
          title: '📹 Camera Offline',
          message: 'Camera {{camera_name}} at {{location}} is currently offline.',
          channels: ['in_app', 'email'],
          severity: 'medium'
        },
        system_maintenance: {
          title: '⚙️ System Maintenance',
          message: 'Scheduled maintenance will begin at {{start_time}} and is expected to last {{duration}}.',
          channels: ['in_app', 'email'],
          severity: 'low'
        },
        user_login: {
          title: '🔐 User Login',
          message: 'User {{username}} has logged in from {{ip_address}}.',
          channels: ['in_app'],
          severity: 'low'
        },
        violation_resolved: {
          title: '✅ Violation Resolved',
          message: 'Violation {{violation_id}} has been resolved by {{investigator_name}}.',
          channels: ['in_app', 'email'],
          severity: 'low'
        }
      };

      // Store templates
      Object.entries(defaultTemplates).forEach(([key, template]) => {
        this.templates.set(key, template);
      });

      console.log(`✅ Loaded ${this.templates.size} notification templates`);
    } catch (error) {
      console.error('❌ Error loading templates:', error);
    }
  }

  /**
   * Setup scheduled tasks
   */
  setupScheduledTasks() {
    // Process pending notifications every minute
    cron.schedule('* * * * *', async () => {
      await this.processPendingNotifications();
    });

    // Clean up expired notifications every hour
    cron.schedule('0 * * * *', async () => {
      await this.cleanupExpiredNotifications();
    });

    // Retry failed notifications every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.retryFailedNotifications();
    });

    console.log('✅ Scheduled tasks initialized');
  }

  /**
   * Process a notification
   */
  async processNotification(notification) {
    try {
      console.log(`🔔 Processing notification: ${notification.title}`);

      // Update status to sent
      await notification.update({ 
        status: 'sent',
        sent_at: new Date()
      });

      // Send through each channel
      for (const channel of notification.channels) {
        try {
          await this.sendThroughChannel(notification, channel);
        } catch (error) {
          console.error(`❌ Failed to send notification ${notification.id} through ${channel}:`, error);
          await notification.update({
            error_message: error.message,
            retry_count: notification.retry_count + 1
          });
        }
      }

      // Update status to delivered
      await notification.update({ status: 'delivered' });
      console.log(`✅ Notification ${notification.id} processed successfully`);

    } catch (error) {
      console.error('❌ Error processing notification:', error);
      await notification.update({
        status: 'failed',
        error_message: error.message
      });
    }
  }

  /**
   * Send notification through specific channel
   */
  async sendThroughChannel(notification, channel) {
    switch (channel) {
      case 'in_app':
        // In-app notifications are handled by Socket.IO
        break;
      
      case 'email':
        await this.sendEmail(notification);
        break;
      
      case 'sms':
        await this.sendSMS(notification);
        break;
      
      case 'push':
        await this.sendPushNotification(notification);
        break;
      
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(notification) {
    if (!this.emailTransporter) {
      throw new Error('Email service not configured');
    }

    const template = this.templates.get(notification.template_id) || {
      title: notification.title,
      message: notification.message
    };

    const htmlContent = await this.renderEmailTemplate(template, notification.metadata);

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@ruth-ai.com',
      to: notification.recipient_id ? await this.getUserEmail(notification.recipient_id) : process.env.ADMIN_EMAIL,
      subject: template.title,
      html: htmlContent
    };

    await this.emailTransporter.sendMail(mailOptions);
    console.log(`📧 Email sent for notification ${notification.id}`);
  }

  /**
   * Send SMS notification
   */
  async sendSMS(notification) {
    if (!this.twilioClient) {
      throw new Error('SMS service not configured');
    }

    const template = this.templates.get(notification.template_id) || {
      message: notification.message
    };

    const message = await this.renderTemplate(template.message, notification.metadata);
    const phoneNumber = notification.recipient_id ? await this.getUserPhone(notification.recipient_id) : process.env.ADMIN_PHONE;

    await this.twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`📱 SMS sent for notification ${notification.id}`);
  }

  /**
   * Send push notification
   */
  async sendPushNotification(notification) {
    // Placeholder for push notification implementation
    console.log(`📱 Push notification sent for notification ${notification.id}`);
  }

  /**
   * Render template with data
   */
  async renderTemplate(template, data) {
    try {
      const compiledTemplate = handlebars.compile(template);
      return compiledTemplate(data || {});
    } catch (error) {
      console.error('Template rendering error:', error);
      return template;
    }
  }

  /**
   * Render email template
   */
  async renderEmailTemplate(template, data) {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          .severity-high { border-left: 4px solid #dc2626; }
          .severity-medium { border-left: 4px solid #f59e0b; }
          .severity-low { border-left: 4px solid #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ruth-AI Monitor</h1>
          </div>
          <div class="content severity-${template.severity || 'medium'}">
            <h2>${template.title}</h2>
            <p>${template.message}</p>
            <p><small>Timestamp: ${new Date().toLocaleString()}</small></p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Ruth-AI Monitor</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.renderTemplate(htmlTemplate, data);
  }

  /**
   * Get user email by ID
   */
  async getUserEmail(userId) {
    // In a real implementation, this would fetch from Auth Service
    return process.env.ADMIN_EMAIL || 'admin@ruth-ai.com';
  }

  /**
   * Get user phone by ID
   */
  async getUserPhone(userId) {
    // In a real implementation, this would fetch from Auth Service
    return process.env.ADMIN_PHONE || '+1234567890';
  }

  /**
   * Process pending notifications
   */
  async processPendingNotifications() {
    try {
      const Notification = require('../models/Notification');
      const pendingNotifications = await Notification.findPending();

      for (const notification of pendingNotifications) {
        await this.processNotification(notification);
      }
    } catch (error) {
      console.error('Error processing pending notifications:', error);
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications() {
    try {
      const Notification = require('../models/Notification');
      const expiredNotifications = await Notification.findExpired();

      for (const notification of expiredNotifications) {
        await notification.update({ status: 'expired' });
      }

      if (expiredNotifications.length > 0) {
        console.log(`🧹 Cleaned up ${expiredNotifications.length} expired notifications`);
      }
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications() {
    try {
      const Notification = require('../models/Notification');
      const failedNotifications = await Notification.findAll({
        where: {
          status: 'failed',
          retry_count: { [require('sequelize').Op.lt]: 3 }
        }
      });

      for (const notification of failedNotifications) {
        await this.processNotification(notification);
      }
    } catch (error) {
      console.error('Error retrying failed notifications:', error);
    }
  }

  /**
   * Get available templates
   */
  getTemplates() {
    const templates = [];
    this.templates.forEach((template, key) => {
      templates.push({
        id: key,
        title: template.title,
        message: template.message,
        channels: template.channels,
        severity: template.severity
      });
    });
    return templates;
  }

  /**
   * Get available channels
   */
  getChannels() {
    return Object.entries(this.channels).map(([key, config]) => ({
      id: key,
      name: config.name,
      enabled: config.enabled
    }));
  }

  /**
   * Create violation notification
   */
  async createViolationNotification(violation) {
    const Notification = require('../models/Notification');
    
    const notification = await Notification.create({
      title: '🚨 Safety Violation Detected',
      message: `A ${violation.violation_type} violation has been detected on camera ${violation.camera_id} with ${violation.ai_confidence}% confidence.`,
      type: 'violation',
      severity: violation.severity,
      channels: ['in_app', 'email'],
      recipient_type: 'all',
      metadata: {
        violation_id: violation.id,
        camera_id: violation.camera_id,
        violation_type: violation.violation_type,
        confidence: violation.ai_confidence
      },
      template_id: 'violation_detected'
    });

    await this.processNotification(notification);
    return notification;
  }

  /**
   * Create camera status notification
   */
  async createCameraStatusNotification(camera, status) {
    const Notification = require('../models/Notification');
    
    const notification = await Notification.create({
      title: `📹 Camera ${status === 'offline' ? 'Offline' : 'Online'}`,
      message: `Camera ${camera.name} at ${camera.location} is now ${status}.`,
      type: 'system',
      severity: status === 'offline' ? 'medium' : 'low',
      channels: ['in_app'],
      recipient_type: 'role',
      recipient_value: 'admin',
      metadata: {
        camera_id: camera.id,
        camera_name: camera.name,
        location: camera.location,
        status
      },
      template_id: 'camera_offline'
    });

    await this.processNotification(notification);
    return notification;
  }
}

// Export singleton instance
module.exports = new NotificationService();
