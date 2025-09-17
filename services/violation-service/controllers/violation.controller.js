const { validationResult } = require('express-validator');
const ViolationReport = require('../models/ViolationReport');
const aiIntegrationService = require('../services/aiIntegration.service');
const ObjectsToCsv = require('objects-to-csv');

/**
 * Get all violations
 * @route GET /violations
 */
const getAllViolations = async (req, res) => {
  try {
    const { 
      status, 
      severity, 
      violation_type, 
      start_date, 
      end_date, 
      camera_id, 
      investigator_id,
      limit,
      offset,
      sort_by = 'timestamp',
      sort_order = 'DESC'
    } = req.query;
    
    // Build filter conditions
    const whereConditions = {};
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (severity) {
      whereConditions.severity = severity;
    }
    
    if (violation_type) {
      whereConditions.violation_type = violation_type;
    }
    
    if (camera_id) {
      whereConditions.camera_id = camera_id;
    }
    
    if (investigator_id) {
      whereConditions.investigator_id = investigator_id;
    }
    
    // Date range filter
    if (start_date || end_date) {
      whereConditions.timestamp = {};
      
      if (start_date) {
        whereConditions.timestamp[require('sequelize').Op.gte] = new Date(start_date);
      }
      
      if (end_date) {
        whereConditions.timestamp[require('sequelize').Op.lte] = new Date(end_date);
      }
    }

    // Build order clause
    const orderClause = [[sort_by, sort_order.toUpperCase()]];

    // Build limit and offset
    const queryOptions = {
      where: whereConditions,
      order: orderClause
    };

    if (limit) {
      queryOptions.limit = parseInt(limit);
    }

    if (offset) {
      queryOptions.offset = parseInt(offset);
    }

    const violations = await ViolationReport.findAll(queryOptions);
    const totalCount = await ViolationReport.count({ where: whereConditions });

    res.json({
      success: true,
      count: violations.length,
      total: totalCount,
      violations: violations.map(violation => violation.getPublicInfo())
    });
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch violations' 
    });
  }
};

/**
 * Get violation by ID
 * @route GET /violations/:id
 */
const getViolationById = async (req, res) => {
  try {
    const violation = await ViolationReport.findByPk(req.params.id);

    if (!violation) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Violation report not found' 
      });
    }

    res.json({
      success: true,
      violation: violation.getPublicInfo()
    });
  } catch (error) {
    console.error('Error fetching violation:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch violation' 
    });
  }
};

/**
 * Create a new violation report
 * @route POST /violations
 */
const createViolation = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { 
      violation_type, 
      severity, 
      ai_confidence, 
      description, 
      camera_id, 
      ai_model_id,
      detection_data,
      bounding_boxes,
      thumbnail_url,
      full_image_url
    } = req.body;

    // Create new violation report
    const newViolation = await ViolationReport.create({
      violation_type,
      severity,
      ai_confidence,
      description,
      camera_id,
      ai_model_id,
      detection_data,
      bounding_boxes,
      thumbnail_url,
      full_image_url,
      status: 'investigating'
    });

    res.status(201).json({
      success: true,
      message: 'Violation report created successfully',
      violation: newViolation.getPublicInfo()
    });
  } catch (error) {
    console.error('Error creating violation:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to create violation report' 
    });
  }
};

/**
 * Update violation report
 * @route PUT /violations/:id
 */
const updateViolation = async (req, res) => {
  try {
    const violation = await ViolationReport.findByPk(req.params.id);
    if (!violation) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Violation report not found' 
      });
    }

    const { 
      status, 
      description, 
      notes, 
      investigator_id,
      resolution_date
    } = req.body;

    // Update violation
    await violation.update({
      status: status || violation.status,
      description: description || violation.description,
      notes: notes || violation.notes,
      investigator_id: investigator_id || violation.investigator_id,
      resolution_date: resolution_date || violation.resolution_date
    });

    res.json({
      success: true,
      message: 'Violation report updated successfully',
      violation: violation.getPublicInfo()
    });
  } catch (error) {
    console.error('Error updating violation:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update violation report' 
    });
  }
};

/**
 * Delete violation report
 * @route DELETE /violations/:id
 */
const deleteViolation = async (req, res) => {
  try {
    const violation = await ViolationReport.findByPk(req.params.id);
    if (!violation) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Violation report not found' 
      });
    }

    await violation.destroy();

    res.json({
      success: true,
      message: 'Violation report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting violation:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to delete violation report' 
    });
  }
};

/**
 * Acknowledge violation
 * @route POST /violations/:id/acknowledge
 */
const acknowledgeViolation = async (req, res) => {
  try {
    const violation = await ViolationReport.findByPk(req.params.id);
    if (!violation) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Violation report not found' 
      });
    }

    const { notes } = req.body;

    await violation.update({
      status: 'reviewed',
      investigator_id: req.userId,
      notes: notes || violation.notes
    });

    res.json({
      success: true,
      message: 'Violation acknowledged successfully',
      violation: violation.getPublicInfo()
    });
  } catch (error) {
    console.error('Error acknowledging violation:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to acknowledge violation' 
    });
  }
};

/**
 * Resolve violation
 * @route POST /violations/:id/resolve
 */
const resolveViolation = async (req, res) => {
  try {
    const violation = await ViolationReport.findByPk(req.params.id);
    if (!violation) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Violation report not found' 
      });
    }

    const { notes } = req.body;

    await violation.update({
      status: 'resolved',
      investigator_id: req.userId,
      notes: notes || violation.notes,
      resolution_date: new Date()
    });

    res.json({
      success: true,
      message: 'Violation resolved successfully',
      violation: violation.getPublicInfo()
    });
  } catch (error) {
    console.error('Error resolving violation:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to resolve violation' 
    });
  }
};

/**
 * Mark violation as false positive
 * @route POST /violations/:id/false-positive
 */
const markFalsePositive = async (req, res) => {
  try {
    const violation = await ViolationReport.findByPk(req.params.id);
    if (!violation) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Violation report not found' 
      });
    }

    const { notes } = req.body;

    await violation.update({
      status: 'false_positive',
      investigator_id: req.userId,
      notes: notes || violation.notes,
      resolution_date: new Date()
    });

    res.json({
      success: true,
      message: 'Violation marked as false positive successfully',
      violation: violation.getPublicInfo()
    });
  } catch (error) {
    console.error('Error marking violation as false positive:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to mark violation as false positive' 
    });
  }
};

/**
 * Bulk update violations
 * @route POST /violations/bulk-update
 */
const bulkUpdateViolations = async (req, res) => {
  try {
    const { violation_ids, status, investigator_id, notes } = req.body;

    if (!Array.isArray(violation_ids) || violation_ids.length === 0) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'violation_ids must be a non-empty array' 
      });
    }

    if (!status) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'status is required' 
      });
    }

    const updateData = {
      status,
      investigator_id: investigator_id || req.userId
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'resolved') {
      updateData.resolution_date = new Date();
    }

    const [updatedCount] = await ViolationReport.update(
      updateData,
      {
        where: {
          id: { [require('sequelize').Op.in]: violation_ids }
        }
      }
    );

    res.json({
      success: true,
      message: `${updatedCount} violations updated successfully`,
      updated_count: updatedCount
    });
  } catch (error) {
    console.error('Error bulk updating violations:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update violations' 
    });
  }
};

/**
 * Get violation statistics
 * @route GET /violations/stats
 */
const getViolationStats = async (req, res) => {
  try {
    const stats = await ViolationReport.getViolationStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting violation stats:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get violation statistics' 
    });
  }
};

/**
 * Export violations to CSV
 * @route GET /violations/export
 */
const exportViolations = async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      status, 
      severity, 
      violation_type,
      camera_id 
    } = req.query;

    // Build filter conditions
    const whereConditions = {};
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (severity) {
      whereConditions.severity = severity;
    }
    
    if (violation_type) {
      whereConditions.violation_type = violation_type;
    }
    
    if (camera_id) {
      whereConditions.camera_id = camera_id;
    }
    
    // Date range filter
    if (start_date || end_date) {
      whereConditions.timestamp = {};
      
      if (start_date) {
        whereConditions.timestamp[require('sequelize').Op.gte] = new Date(start_date);
      }
      
      if (end_date) {
        whereConditions.timestamp[require('sequelize').Op.lte] = new Date(end_date);
      }
    }

    const violations = await ViolationReport.findAll({
      where: whereConditions,
      order: [['created_at', 'DESC']]
    });

    // Convert to CSV format
    const csvData = violations.map(violation => ({
      id: violation.id,
      timestamp: violation.timestamp,
      violation_type: violation.violation_type,
      severity: violation.severity,
      status: violation.status,
      ai_confidence: violation.ai_confidence,
      description: violation.description,
      camera_id: violation.camera_id,
      investigator_id: violation.investigator_id,
      resolution_date: violation.resolution_date
    }));

    const csv = new ObjectsToCsv(csvData);
    const csvString = await csv.toString();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="violations.csv"');
    res.send(csvString);
  } catch (error) {
    console.error('Error exporting violations:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to export violations' 
    });
  }
};

/**
 * Get AI processing status
 * @route GET /violations/processing/status
 */
const getProcessingStatus = async (req, res) => {
  try {
    const { camera_id } = req.query;
    
    if (camera_id) {
      const status = await aiIntegrationService.getProcessingStatus(camera_id);
      res.json({
        success: true,
        ...status
      });
    } else {
      const health = await aiIntegrationService.healthCheck();
      res.json({
        success: true,
        ...health
      });
    }
  } catch (error) {
    console.error('Error getting processing status:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get processing status' 
    });
  }
};

/**
 * Start violation processing
 * @route POST /violations/processing/start
 */
const startProcessing = async (req, res) => {
  try {
    const { camera_id, model_type, interval_ms } = req.body;

    if (!camera_id) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'camera_id is required' 
      });
    }

    const result = await aiIntegrationService.startViolationProcessing(
      camera_id, 
      model_type || 'work_at_height', 
      interval_ms || 5000
    );

    res.json({
      success: true,
      message: 'Violation processing started successfully',
      ...result
    });
  } catch (error) {
    console.error('Error starting processing:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to start violation processing' 
    });
  }
};

/**
 * Stop violation processing
 * @route POST /violations/processing/stop
 */
const stopProcessing = async (req, res) => {
  try {
    const { camera_id, processing_id } = req.body;

    if (!camera_id) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'camera_id is required' 
      });
    }

    const result = await aiIntegrationService.stopViolationProcessing(
      camera_id, 
      processing_id
    );

    res.json({
      success: true,
      message: 'Violation processing stopped successfully',
      ...result
    });
  } catch (error) {
    console.error('Error stopping processing:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to stop violation processing' 
    });
  }
};

module.exports = {
  getAllViolations,
  getViolationById,
  createViolation,
  updateViolation,
  deleteViolation,
  acknowledgeViolation,
  resolveViolation,
  markFalsePositive,
  bulkUpdateViolations,
  getViolationStats,
  exportViolations,
  getProcessingStatus,
  startProcessing,
  stopProcessing
};
