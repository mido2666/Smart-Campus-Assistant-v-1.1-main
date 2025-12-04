import { Request, Response } from 'express';
import prisma from '../../config/database.js';
import { deleteMaterialFile, getMaterialFileUrl } from '../middleware/material-upload.middleware.js';
import { NotificationService } from '../services/notification.service.js';
import path from 'path';

/**
 * Material Controller
 * Handles operations for course materials (files and links)
 */
export class MaterialController {

    /**
     * Upload a material file
     */
    static async uploadMaterial(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const { courseId, title, description } = req.body;

            if (!courseId || !title) {
                // Clean up file if validation fails
                await deleteMaterialFile(req.file.filename);
                return res.status(400).json({
                    success: false,
                    message: 'Course ID and Title are required'
                });
            }

            // Verify course exists
            const course = await prisma.course.findUnique({
                where: { id: parseInt(courseId) }
            });

            if (!course) {
                await deleteMaterialFile(req.file.filename);
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Create material record
            const material = await prisma.courseMaterial.create({
                data: {
                    courseId: parseInt(courseId),
                    title,
                    description,
                    type: 'FILE',
                    url: req.file.filename, // Store filename, full URL generated on retrieval
                    fileSize: req.file.size
                }
            });

            // Send notifications to enrolled students (async, don't wait)
            MaterialController.sendMaterialNotifications(parseInt(courseId), title, 'FILE').catch((err: any) => {
                console.error('Failed to send notifications:', err);
            });

            return res.status(201).json({
                success: true,
                message: 'Material uploaded successfully',
                data: {
                    ...material,
                    url: getMaterialFileUrl(material.url)
                }
            });

        } catch (error) {
            // Clean up file on error
            if (req.file) {
                await deleteMaterialFile(req.file.filename).catch(console.error);
            }
            console.error('Error uploading material:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload material'
            });
        }
    }

    /**
     * Add a link material
     */
    static async addLink(req: Request, res: Response) {
        try {
            const { courseId, title, description, url } = req.body;

            if (!courseId || !title || !url) {
                return res.status(400).json({
                    success: false,
                    message: 'Course ID, Title, and URL are required'
                });
            }

            // Verify course exists
            const course = await prisma.course.findUnique({
                where: { id: parseInt(courseId) }
            });

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Create material record
            const material = await prisma.courseMaterial.create({
                data: {
                    courseId: parseInt(courseId),
                    title,
                    description,
                    type: 'LINK',
                    url: url
                }
            });

            // Send notifications to enrolled students (async, don't wait)
            MaterialController.sendMaterialNotifications(parseInt(courseId), title, 'LINK').catch((err: any) => {
                console.error('Failed to send notifications:', err);
            });

            return res.status(201).json({
                success: true,
                message: 'Link added successfully',
                data: material
            });

        } catch (error) {
            console.error('Error adding link:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to add link'
            });
        }
    }

    /**
     * Get materials for a course
     */
    static async getCourseMaterials(req: Request, res: Response) {
        try {
            const { courseId } = req.params;

            if (!courseId) {
                return res.status(400).json({
                    success: false,
                    message: 'Course ID is required'
                });
            }

            const materials = await prisma.courseMaterial.findMany({
                where: { courseId: parseInt(courseId) },
                orderBy: { createdAt: 'desc' }
            });

            // Process URLs for files
            const processedMaterials = materials.map(m => ({
                ...m,
                url: m.type === 'FILE' ? getMaterialFileUrl(m.url) : m.url
            }));

            return res.json({
                success: true,
                data: processedMaterials
            });

        } catch (error) {
            console.error('Error fetching materials:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch materials'
            });
        }
    }

    /**
     * Delete a material
     */
    static async deleteMaterial(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const material = await prisma.courseMaterial.findUnique({
                where: { id: parseInt(id) }
            });

            if (!material) {
                return res.status(404).json({
                    success: false,
                    message: 'Material not found'
                });
            }

            // If it's a file, delete from disk
            if (material.type === 'FILE') {
                await deleteMaterialFile(material.url).catch(err => {
                    console.warn(`Failed to delete file ${material.url}:`, err);
                    // Continue to delete DB record even if file delete fails (orphaned file)
                });
            }

            await prisma.courseMaterial.delete({
                where: { id: parseInt(id) }
            });

            return res.json({
                success: true,
                message: 'Material deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting material:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete material'
            });
        }
    }

    /**
     * Send notifications to enrolled students
     * @private helper method
     */
    private static async sendMaterialNotifications(courseId: number, materialTitle: string, materialType: string): Promise<void> {
        try {
            // Get course details
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                include: {
                    professor: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    enrollments: {
                        where: { status: 'ACTIVE' },
                        select: {
                            studentId: true
                        }
                    }
                }
            });

            if (!course || !course.enrollments.length) {
                console.log('No enrolled students found for course:', courseId);
                return;
            }

            const professorName = `${course.professor.firstName} ${course.professor.lastName}`;
            const studentIds = course.enrollments.map(e => e.studentId);

            // Create notification service instance
            const notificationService = new NotificationService();

            // Send notification to all enrolled students
            const materialTypeAr = materialType === 'FILE' ? 'ملف' : 'رابط';
            const title = `📚 محاضرة جديدة: ${course.courseName}`;
            const message = `Dr. ${professorName} أضاف ${materialTypeAr} جديد: ${materialTitle}`;

            await notificationService.createBulkNotifications({
                userIds: studentIds,
                title,
                message,
                type: 'INFO' as any,
                category: 'COURSE' as any,
                metadata: {
                    courseName: course.courseName,
                    courseCode: course.courseCode,
                    professorName: professorName,
                    materialTitle: materialTitle,
                    materialType: materialType,
                    courseId: course.id
                },
                sendEmail: false // Set to true if you want email notifications
            });

            console.log(`Notifications sent to ${studentIds.length} students for material: ${materialTitle}`);
        } catch (error) {
            console.error('Error sending material notifications:', error);
            throw error;
        }
    }
}
