import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request, Response, NextFunction } from 'express';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'materials');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `material-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type - allow PDFs
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  }
});

// Material upload middleware
export const uploadMaterial = upload.single('file');

// Error handling middleware for multer
export const handleMaterialUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one file is allowed'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message
        });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload failed'
    });
  }
  next();
};

// Delete file utility
export const deleteMaterialFile = (filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(uploadsDir, filename);
    fs.unlink(filePath, (error) => {
      if (error && error.code !== 'ENOENT') {
        reject(new Error(`Failed to delete file: ${error.message}`));
      } else {
        resolve();
      }
    });
  });
};

// Get file URL utility
export const getMaterialFileUrl = (filename: string): string => {
  // Remove 'material-' prefix and extension to get the ID if needed, 
  // but here we just return the full path relative to server
  return `/uploads/materials/${filename}`;
};
