const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const router = express.Router();
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow CSV and Excel files
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.match(/\.(csv|xls|xlsx)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

// Route: POST /api/batches/parse-file - Parse uploaded Excel/CSV file
router.post('/parse-file', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const students = [];
    const errors = [];

    try {
      // Parse Excel or CSV file
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = xlsx.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'File is empty or has no valid data'
        });
      }

      // Validate headers (case-insensitive)
      const firstRow = jsonData[0];
      const headers = Object.keys(firstRow).map(h => h.toLowerCase().trim());
      
      const requiredHeaders = ['roll number', 'student name', 'email'];
      const headerMap = {};
      
      // Map headers to standard names
      requiredHeaders.forEach(required => {
        const found = headers.find(h => 
          h.includes(required.replace(' ', '')) || 
          h.includes(required) ||
          (required === 'roll number' && (h.includes('roll') || h.includes('id'))) ||
          (required === 'student name' && (h.includes('name') || h.includes('student'))) ||
          (required === 'email' && h.includes('email'))
        );
        
        if (found) {
          headerMap[required] = Object.keys(firstRow).find(k => 
            k.toLowerCase().trim() === found
          );
        }
      });

      // Check for missing required headers
      const missingHeaders = requiredHeaders.filter(h => !headerMap[h]);
      if (missingHeaders.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required columns: ${missingHeaders.join(', ')}`,
          availableHeaders: Object.keys(firstRow)
        });
      }

      // Find phone number header (optional)
      const phoneHeader = Object.keys(firstRow).find(k => 
        k.toLowerCase().includes('phone') || 
        k.toLowerCase().includes('mobile') ||
        k.toLowerCase().includes('contact')
      );

      // Process each row
      jsonData.forEach((row, index) => {
        const rowNum = index + 2; // +2 because Excel is 1-indexed and we skip header
        
        const rollNumber = row[headerMap['roll number']];
        const name = row[headerMap['student name']];
        const email = row[headerMap['email']];
        const phoneNumber = phoneHeader ? row[phoneHeader] : '';

        // Validate required fields
        if (!rollNumber || !name || !email) {
          errors.push(`Row ${rowNum}: Missing required information`);
          return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(email).trim())) {
          errors.push(`Row ${rowNum}: Invalid email format (${email})`);
          return;
        }

        // Check for duplicate roll numbers in the same file
        if (students.find(s => s.rollNumber === String(rollNumber).trim())) {
          errors.push(`Row ${rowNum}: Duplicate roll number (${rollNumber})`);
          return;
        }

        students.push({
          rollNumber: String(rollNumber).trim(),
          name: String(name).trim(),
          email: String(email).trim(),
          phoneNumber: phoneNumber ? String(phoneNumber).trim() : ''
        });
      });

      res.json({
        success: true,
        data: {
          students,
          totalRows: jsonData.length,
          validStudents: students.length,
          errors: errors.length > 0 ? errors : null
        }
      });

    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      res.status(400).json({
        success: false,
        message: 'Error parsing file. Please ensure it\'s a valid Excel or CSV file.',
        error: parseError.message
      });
    }

  } catch (error) {
    console.error('Error in parse-file:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
