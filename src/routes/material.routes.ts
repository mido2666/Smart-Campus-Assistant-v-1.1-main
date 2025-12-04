import { Router } from 'express';
import { MaterialController } from '../controllers/material.controller.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { uploadMaterial, handleMaterialUploadError } from '../middleware/material-upload.middleware.js';

const router = Router();

// Apply authentication to all routes
router.use(AuthMiddleware.authenticate());

/**
 * Middleware to check if user is a professor or admin
 */
const requireProfessorOrAdmin = (req: any, res: any, next: any) => {
    const userRole = req.user.role.toUpperCase();
    if (userRole !== 'PROFESSOR' && userRole !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Professor or Admin role required.'
        });
    }
    next();
};

/**
 * @route   POST /api/materials/upload
 * @desc    Upload a material file (PDF)
 * @access  Professor or Admin
 */
router.post(
    '/upload',
    requireProfessorOrAdmin,
    uploadMaterial,
    handleMaterialUploadError,
    MaterialController.uploadMaterial
);

/**
 * @route   POST /api/materials/link
 * @desc    Add a link material
 * @access  Professor or Admin
 */
router.post(
    '/link',
    requireProfessorOrAdmin,
    MaterialController.addLink
);

/**
 * @route   GET /api/materials/course/:courseId
 * @desc    Get all materials for a course
 * @access  Authenticated Users (Students enrolled or Professors)
 */
router.get(
    '/course/:courseId',
    MaterialController.getCourseMaterials
);

/**
 * @route   DELETE /api/materials/:id
 * @desc    Delete a material
 * @access  Professor or Admin
 */
router.delete(
    '/:id',
    requireProfessorOrAdmin,
    MaterialController.deleteMaterial
);

export default router;
