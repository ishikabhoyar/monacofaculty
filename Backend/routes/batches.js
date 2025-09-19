const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const authMiddleware = require('../authMiddleware');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Allow CSV and Excel files
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
        }
    }
});

// All batch routes require authentication
router.use(authMiddleware);

// Batch CRUD operations
router.post('/', batchController.createBatch);
router.get('/', batchController.getBatches);
router.get('/:id', batchController.getBatchById);
router.put('/:id', batchController.updateBatch);
router.delete('/:id', batchController.deleteBatch);

// Student management within batches
router.post('/:id/students', batchController.addStudent);
router.put('/:id/students/:studentId', batchController.updateStudent);
router.delete('/:id/students/:studentId', batchController.deleteStudent);

// File import operations
router.post('/:id/import-students', upload.single('file'), batchController.importStudents);

module.exports = router;