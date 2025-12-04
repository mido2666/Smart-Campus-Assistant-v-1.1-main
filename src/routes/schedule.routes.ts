import { Router } from 'express';
import { ScheduleController } from '../controllers/schedule.controller.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Middleware to check if user is a professor or admin
 */
const requireProfessorOrAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'PROFESSOR' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Professor or Admin role required.'
    });
  }
  next();
};

/**
 * Middleware to check if user can access schedule (professor owns it or is admin)
 */
const canAccessSchedule = async (req: any, res: any, next: any) => {
  try {
    const scheduleId = parseInt(req.params.id);

    if (req.user.role === 'ADMIN') {
      return next();
    }

    // For professors, check if they own the schedule
    if (req.user.role === 'PROFESSOR') {
      const { ScheduleService } = await import('../services/schedule.service.js');
      const schedule = await ScheduleService.getScheduleById(scheduleId);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }

      if (schedule.professorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own schedules.'
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking schedule access'
    });
  }
};

// Apply authentication to all routes
router.use(AuthMiddleware.authenticate());

/**
 * @route   GET /api/schedule
 * @desc    Get all schedules with optional filtering
 * @access  Public (authenticated users)
 * @query   professorId - Filter by professor ID
 * @query   courseId - Filter by course ID
 * @query   dayOfWeek - Filter by day of week (0-6)
 * @query   isActive - Filter by active status
 */
router.get('/', ScheduleController.getAllSchedules);

/**
 * @route   GET /api/schedule/user
 * @desc    Get user's schedule (student or professor)
 * @access  Authenticated users
 */
router.get('/user', ScheduleController.getUserSchedule);

/**
 * @route   GET /api/schedule/debug
 * @desc    Get debug info for schedule
 * @access  Authenticated users
 */
router.get('/debug', ScheduleController.debugSchedule);

/**
 * @route   GET /api/schedule/today
 * @desc    Get today's schedule for the authenticated user
 * @access  Authenticated users
 */
router.get('/today', ScheduleController.getTodaySchedule);

/**
 * @route   GET /api/schedule/stats
 * @desc    Get schedule statistics
 * @access  Public (authenticated users)
 * @query   professorId - Filter by professor ID
 */
router.get('/stats', ScheduleController.getScheduleStats);

/**
 * @route   GET /api/schedule/day/:dayOfWeek
 * @desc    Get schedules for a specific day
 * @access  Public (authenticated users)
 * @query   professorId - Filter by professor ID
 */
router.get('/day/:dayOfWeek', ScheduleController.getSchedulesByDay);

/**
 * @route   GET /api/schedule/room/:room
 * @desc    Get schedules for a specific room
 * @access  Public (authenticated users)
 * @query   dayOfWeek - Filter by day of week (0-6)
 */
router.get('/room/:room', ScheduleController.getSchedulesByRoom);

/**
 * @route   GET /api/schedule/:id
 * @desc    Get schedule by ID
 * @access  Public (authenticated users)
 */
router.get('/:id', ScheduleController.getScheduleById);

/**
 * @route   POST /api/schedule
 * @desc    Create a new schedule entry
 * @access  Professor or Admin
 */
router.post('/', requireProfessorOrAdmin, ScheduleController.createSchedule);

/**
 * @route   POST /api/schedule/check-conflict
 * @desc    Check for schedule conflicts
 * @access  Professor or Admin
 */
router.post('/check-conflict', requireProfessorOrAdmin, ScheduleController.checkScheduleConflict);

/**
 * @route   PUT /api/schedule/:id
 * @desc    Update schedule
 * @access  Professor (own schedules) or Admin
 */
router.put('/:id', canAccessSchedule, ScheduleController.updateSchedule);

/**
 * @route   DELETE /api/schedule/:id
 * @desc    Delete schedule (soft delete)
 * @access  Professor (own schedules) or Admin
 */
router.delete('/:id', canAccessSchedule, ScheduleController.deleteSchedule);

export default router;
