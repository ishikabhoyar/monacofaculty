const pool = require('../db');
const XLSX = require('xlsx');

class BatchController {
    constructor() {
        // Bind all methods to maintain 'this' context
        this.createBatch = this.createBatch.bind(this);
        this.getBatches = this.getBatches.bind(this);
        this.getBatchById = this.getBatchById.bind(this);
        this.updateBatch = this.updateBatch.bind(this);
        this.deleteBatch = this.deleteBatch.bind(this);
        this.addStudent = this.addStudent.bind(this);
        this.updateStudent = this.updateStudent.bind(this);
        this.deleteStudent = this.deleteStudent.bind(this);
        this.importStudents = this.importStudents.bind(this);
        this.validateStudentData = this.validateStudentData.bind(this);
        this.parseCSV = this.parseCSV.bind(this);
        this.parseExcel = this.parseExcel.bind(this);
    }

    // Create a new batch with students
    async createBatch(req, res) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const { batchName, academicYear, semester, description, students } = req.body;
            const facultyId = req.user.id;
            
            // Validate required fields
            if (!batchName || !academicYear || !semester) {
                return res.status(400).json({
                    success: false,
                    message: 'Batch name, academic year, and semester are required'
                });
            }
            
            // Check if batch already exists for this faculty
            const existingBatch = await client.query(
                'SELECT id FROM batches WHERE name = $1 AND academic_year = $2 AND semester = $3 AND faculty_id = $4',
                [batchName, academicYear, semester, facultyId]
            );
            
            if (existingBatch.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'A batch with this name already exists for the selected academic year and semester'
                });
            }
            
            // Insert batch
            const batchResult = await client.query(
                `INSERT INTO batches (name, academic_year, semester, description, faculty_id)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, name, academic_year, semester, description, created_at`,
                [batchName, academicYear, semester, description || '', facultyId]
            );
            
            const batch = batchResult.rows[0];
            
            // Insert students if provided
            let insertedStudents = [];
            if (students && Array.isArray(students) && students.length > 0) {
                const validationErrors = [];
                
                // Validate student data
                for (let i = 0; i < students.length; i++) {
                    const student = students[i];
                    const errors = this.validateStudentData(student, i + 1);
                    validationErrors.push(...errors);
                }
                
                if (validationErrors.length > 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: 'Validation errors in student data',
                        errors: validationErrors
                    });
                }
                
                // Check for existing students with same roll number or email in ANY batch
                const rollNumbers = students.map(s => s.rollNumber);
                const emails = students.map(s => s.email);
                
                const existingStudentsCheck = await client.query(
                    `SELECT roll_number, email, batch_id, 
                            (SELECT name FROM batches WHERE id = students.batch_id) as batch_name
                     FROM students 
                     WHERE roll_number = ANY($1) OR email = ANY($2)`,
                    [rollNumbers, emails]
                );
                
                if (existingStudentsCheck.rows.length > 0) {
                    const duplicateErrors = [];
                    
                    for (const existing of existingStudentsCheck.rows) {
                        const studentIndex = students.findIndex(
                            s => s.rollNumber === existing.roll_number || s.email === existing.email
                        );
                        
                        if (existing.roll_number && rollNumbers.includes(existing.roll_number)) {
                            duplicateErrors.push(
                                `Student ${studentIndex + 1}: Roll number '${existing.roll_number}' already exists in batch '${existing.batch_name}'`
                            );
                        }
                        if (existing.email && emails.includes(existing.email)) {
                            duplicateErrors.push(
                                `Student ${studentIndex + 1}: Email '${existing.email}' already exists in batch '${existing.batch_name}'`
                            );
                        }
                    }
                    
                    await client.query('ROLLBACK');
                    return res.status(409).json({
                        success: false,
                        message: 'Some students already exist in other batches',
                        errors: [...new Set(duplicateErrors)] // Remove duplicates
                    });
                }
                
                // Check for duplicates within the current submission
                const rollNumberDuplicates = rollNumbers.filter((item, index) => rollNumbers.indexOf(item) !== index);
                const emailDuplicates = emails.filter((item, index) => emails.indexOf(item) !== index);
                
                if (rollNumberDuplicates.length > 0 || emailDuplicates.length > 0) {
                    const duplicateErrors = [];
                    
                    if (rollNumberDuplicates.length > 0) {
                        duplicateErrors.push(`Duplicate roll numbers in submission: ${[...new Set(rollNumberDuplicates)].join(', ')}`);
                    }
                    if (emailDuplicates.length > 0) {
                        duplicateErrors.push(`Duplicate emails in submission: ${[...new Set(emailDuplicates)].join(', ')}`);
                    }
                    
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: 'Duplicate student data in submission',
                        errors: duplicateErrors
                    });
                }
                
                // Insert students one by one for better error handling
                for (let i = 0; i < students.length; i++) {
                    const student = students[i];
                    
                    try {
                        const studentResult = await client.query(
                            `INSERT INTO students (roll_number, name, email, phone, batch_id)
                             VALUES ($1, $2, $3, $4, $5)
                             RETURNING id, roll_number, name, email, phone, created_at`,
                            [student.rollNumber, student.name, student.email, student.phoneNumber || '', batch.id]
                        );
                        insertedStudents.push(studentResult.rows[0]);
                    } catch (error) {
                        await client.query('ROLLBACK');
                        
                        // Handle unique constraint violations
                        if (error.code === '23505') {
                            let errorMessage = '';
                            if (error.constraint && error.constraint.includes('roll_number')) {
                                errorMessage = `Student ${i + 1}: Roll number '${student.rollNumber}' already exists`;
                            } else if (error.constraint && error.constraint.includes('email')) {
                                errorMessage = `Student ${i + 1}: Email '${student.email}' already exists`;
                            } else {
                                errorMessage = `Student ${i + 1}: Duplicate entry detected`;
                            }
                            
                            return res.status(409).json({
                                success: false,
                                message: 'Failed to add student due to duplicate data',
                                error: errorMessage
                            });
                        }
                        
                        throw error; // Re-throw if it's not a constraint violation
                    }
                }
            }
            
            await client.query('COMMIT');
            
            res.status(201).json({
                success: true,
                message: 'Batch created successfully',
                batch: {
                    ...batch,
                    students: insertedStudents
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating batch:', error);
            
            // Handle specific database errors
            if (error.code === '23505') {
                // Unique constraint violation
                return res.status(409).json({
                    success: false,
                    message: 'Duplicate entry detected',
                    error: error.detail || 'A student with this roll number or email already exists'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        } finally {
            client.release();
        }
    }

    // Get all batches for the authenticated faculty
    async getBatches(req, res) {
        try {
            const facultyId = req.user.id;
            
            const result = await pool.query(
                `SELECT b.*, 
                        COALESCE(json_agg(
                            json_build_object(
                                'id', s.id,
                                'roll_number', s.roll_number,
                                'name', s.name,
                                'email', s.email,
                                'phone_number', s.phone,
                                'created_at', s.created_at
                            )
                        ) FILTER (WHERE s.id IS NOT NULL), '[]') as students
                 FROM batches b
                 LEFT JOIN students s ON b.id = s.batch_id
                 WHERE b.faculty_id = $1
                 GROUP BY b.id
                 ORDER BY b.created_at DESC`,
                [facultyId]
            );
            
            res.json({
                success: true,
                batches: result.rows
            });
            
        } catch (error) {
            console.error('Error fetching batches:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get a specific batch by ID
    async getBatchById(req, res) {
        try {
            const { id } = req.params;
            const facultyId = req.user.id;
            
            const result = await pool.query(
                `SELECT b.*, 
                        COALESCE(json_agg(
                            json_build_object(
                                'id', s.id,
                                'roll_number', s.roll_number,
                                'name', s.name,
                                'email', s.email,
                                'phone_number', s.phone,
                                'created_at', s.created_at
                            )
                        ) FILTER (WHERE s.id IS NOT NULL), '[]') as students
                 FROM batches b
                 LEFT JOIN students s ON b.id = s.batch_id
                 WHERE b.id = $1 AND b.faculty_id = $2
                 GROUP BY b.id`,
                [id, facultyId]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Batch not found'
                });
            }
            
            res.json({
                success: true,
                batch: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error fetching batch:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update a batch
    async updateBatch(req, res) {
        try {
            const { id } = req.params;
            const { batchName, academicYear, semester, description } = req.body;
            const facultyId = req.user.id;
            
            // Validate required fields
            if (!batchName || !academicYear || !semester) {
                return res.status(400).json({
                    success: false,
                    message: 'Batch name, academic year, and semester are required'
                });
            }
            
            // Check if batch exists and belongs to faculty
            const existingBatch = await pool.query(
                'SELECT id FROM batches WHERE id = $1 AND faculty_id = $2',
                [id, facultyId]
            );
            
            if (existingBatch.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Batch not found'
                });
            }
            
            // Check for duplicate batch name in same academic year/semester
            const duplicateCheck = await pool.query(
                'SELECT id FROM batches WHERE name = $1 AND academic_year = $2 AND semester = $3 AND faculty_id = $4 AND id != $5',
                [batchName, academicYear, semester, facultyId, id]
            );
            
            if (duplicateCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'A batch with this name already exists for the selected academic year and semester'
                });
            }
            
            // Update batch
            const result = await pool.query(
                `UPDATE batches 
                 SET name = $1, academic_year = $2, semester = $3, description = $4, updated_at = NOW()
                 WHERE id = $5 AND faculty_id = $6
                 RETURNING id, name, academic_year, semester, description, updated_at`,
                [batchName, academicYear, semester, description || '', id, facultyId]
            );
            
            res.json({
                success: true,
                message: 'Batch updated successfully',
                batch: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error updating batch:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete a batch
    async deleteBatch(req, res) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const { id } = req.params;
            const facultyId = req.user.id;
            
            // Check if batch exists and belongs to faculty
            const existingBatch = await client.query(
                'SELECT id FROM batches WHERE id = $1 AND faculty_id = $2',
                [id, facultyId]
            );
            
            if (existingBatch.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Batch not found'
                });
            }
            
            // Delete students first (cascade will handle this, but let's be explicit)
            await client.query('DELETE FROM students WHERE batch_id = $1', [id]);
            
            // Delete batch
            await client.query('DELETE FROM batches WHERE id = $1 AND faculty_id = $2', [id, facultyId]);
            
            await client.query('COMMIT');
            
            res.json({
                success: true,
                message: 'Batch deleted successfully'
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error deleting batch:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        } finally {
            client.release();
        }
    }

    // Add a student to a batch
    async addStudent(req, res) {
        try {
            const { id } = req.params;
            const { rollNumber, name, email, phoneNumber } = req.body;
            const facultyId = req.user.id;
            
            // Validate required fields
            if (!rollNumber || !name || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Roll number, name, and email are required'
                });
            }
            
            // Check if batch exists and belongs to faculty
            const batchCheck = await pool.query(
                'SELECT id FROM batches WHERE id = $1 AND faculty_id = $2',
                [id, facultyId]
            );
            
            if (batchCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Batch not found'
                });
            }
            
            // Validate student data
            const validationErrors = this.validateStudentData({ rollNumber, name, email, phoneNumber }, 1);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: validationErrors
                });
            }
            
            // Insert student
            const result = await pool.query(
                `INSERT INTO students (roll_number, name, email, phone, batch_id)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, roll_number, name, email, phone, created_at`,
                [rollNumber, name, email, phoneNumber || '', id]
            );
            
            res.status(201).json({
                success: true,
                message: 'Student added successfully',
                student: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error adding student:', error);
            
            // Handle unique constraint violations
            if (error.code === '23505') {
                if (error.constraint.includes('roll_number')) {
                    return res.status(409).json({
                        success: false,
                        message: 'A student with this roll number already exists in this batch'
                    });
                } else if (error.constraint.includes('email')) {
                    return res.status(409).json({
                        success: false,
                        message: 'A student with this email already exists in this batch'
                    });
                }
            }
            
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update a student
    async updateStudent(req, res) {
        try {
            const { id, studentId } = req.params;
            const { rollNumber, name, email, phoneNumber } = req.body;
            const facultyId = req.user.id;
            
            // Validate required fields
            if (!rollNumber || !name || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Roll number, name, and email are required'
                });
            }
            
            // Check if batch exists and belongs to faculty
            const batchCheck = await pool.query(
                'SELECT id FROM batches WHERE id = $1 AND faculty_id = $2',
                [id, facultyId]
            );
            
            if (batchCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Batch not found'
                });
            }
            
            // Check if student exists in the batch
            const studentCheck = await pool.query(
                'SELECT id FROM students WHERE id = $1 AND batch_id = $2',
                [studentId, id]
            );
            
            if (studentCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found in this batch'
                });
            }
            
            // Validate student data
            const validationErrors = this.validateStudentData({ rollNumber, name, email, phoneNumber }, 1);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: validationErrors
                });
            }
            
            // Update student
            const result = await pool.query(
                `UPDATE students 
                 SET roll_number = $1, name = $2, email = $3, phone = $4
                 WHERE id = $5 AND batch_id = $6
                 RETURNING id, roll_number, name, email, phone`,
                [rollNumber, name, email, phoneNumber || '', studentId, id]
            );
            
            res.json({
                success: true,
                message: 'Student updated successfully',
                student: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error updating student:', error);
            
            // Handle unique constraint violations
            if (error.code === '23505') {
                if (error.constraint.includes('roll_number')) {
                    return res.status(409).json({
                        success: false,
                        message: 'A student with this roll number already exists in this batch'
                    });
                } else if (error.constraint.includes('email')) {
                    return res.status(409).json({
                        success: false,
                        message: 'A student with this email already exists in this batch'
                    });
                }
            }
            
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete a student
    async deleteStudent(req, res) {
        try {
            const { id, studentId } = req.params;
            const facultyId = req.user.id;
            
            // Check if batch exists and belongs to faculty
            const batchCheck = await pool.query(
                'SELECT id FROM batches WHERE id = $1 AND faculty_id = $2',
                [id, facultyId]
            );
            
            if (batchCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Batch not found'
                });
            }
            
            // Check if student exists in the batch
            const studentCheck = await pool.query(
                'SELECT id FROM students WHERE id = $1 AND batch_id = $2',
                [studentId, id]
            );
            
            if (studentCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found in this batch'
                });
            }
            
            // Delete student
            await pool.query('DELETE FROM students WHERE id = $1 AND batch_id = $2', [studentId, id]);
            
            res.json({
                success: true,
                message: 'Student deleted successfully'
            });
            
        } catch (error) {
            console.error('Error deleting student:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Import students from file
    async importStudents(req, res) {
        try {
            const { id } = req.params;
            const facultyId = req.user.id;
            const file = req.file;
            
            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }
            
            // Check if batch exists and belongs to faculty
            const batchCheck = await pool.query(
                'SELECT id FROM batches WHERE id = $1 AND faculty_id = $2',
                [id, facultyId]
            );
            
            if (batchCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Batch not found'
                });
            }
            
            let students = [];
            
            // Parse file based on type
            if (file.originalname.endsWith('.csv')) {
                students = this.parseCSV(file.buffer);
            } else if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
                students = this.parseExcel(file.buffer);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Unsupported file format. Please upload CSV or Excel files.'
                });
            }
            
            // Validate and process students
            const results = {
                total: students.length,
                successful: 0,
                failed: 0,
                errors: []
            };
            
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                for (let i = 0; i < students.length; i++) {
                    const student = students[i];
                    
                    // Validate student data
                    const validationErrors = this.validateStudentData(student, i + 1);
                    
                    if (validationErrors.length > 0) {
                        results.failed++;
                        results.errors.push(...validationErrors);
                        continue;
                    }
                    
                    try {
                        // Insert student
                        await client.query(
                            `INSERT INTO students (roll_number, name, email, phone, batch_id)
                             VALUES ($1, $2, $3, $4, $5)`,
                            [student.rollNumber, student.name, student.email, student.phoneNumber || '', id]
                        );
                        results.successful++;
                    } catch (error) {
                        results.failed++;
                        
                        // Handle unique constraint violations
                        if (error.code === '23505') {
                            if (error.constraint.includes('roll_number')) {
                                results.errors.push(`Row ${i + 1}: Roll number '${student.rollNumber}' already exists`);
                            } else if (error.constraint.includes('email')) {
                                results.errors.push(`Row ${i + 1}: Email '${student.email}' already exists`);
                            } else {
                                results.errors.push(`Row ${i + 1}: Duplicate data`);
                            }
                        } else {
                            results.errors.push(`Row ${i + 1}: ${error.message}`);
                        }
                    }
                }
                
                await client.query('COMMIT');
                
                res.json({
                    success: true,
                    message: `Import completed. ${results.successful} students added, ${results.failed} failed.`,
                    results
                });
                
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
            
        } catch (error) {
            console.error('Error importing students:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during import'
            });
        }
    }

    // Validate student data
    validateStudentData(student, rowNumber = null) {
        const errors = [];
        const rowPrefix = rowNumber ? `Row ${rowNumber}: ` : '';
        
        // Validate roll number
        if (!student.rollNumber || typeof student.rollNumber !== 'string') {
            errors.push(`${rowPrefix}Roll number is required`);
        } else if (student.rollNumber.trim().length === 0) {
            errors.push(`${rowPrefix}Roll number cannot be empty`);
        } else if (student.rollNumber.length > 50) {
            errors.push(`${rowPrefix}Roll number must be less than 50 characters`);
        }
        
        // Validate name
        if (!student.name || typeof student.name !== 'string') {
            errors.push(`${rowPrefix}Name is required`);
        } else if (student.name.trim().length === 0) {
            errors.push(`${rowPrefix}Name cannot be empty`);
        } else if (student.name.length > 200) {
            errors.push(`${rowPrefix}Name must be less than 200 characters`);
        }
        
        // Validate email
        if (!student.email || typeof student.email !== 'string') {
            errors.push(`${rowPrefix}Email is required`);
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(student.email.trim())) {
                errors.push(`${rowPrefix}Invalid email format`);
            } else if (student.email.length > 255) {
                errors.push(`${rowPrefix}Email must be less than 255 characters`);
            }
        }
        
        // Validate phone number (optional)
        if (student.phoneNumber && typeof student.phoneNumber === 'string') {
            if (student.phoneNumber.length > 20) {
                errors.push(`${rowPrefix}Phone number must be less than 20 characters`);
            }
        }
        
        return errors;
    }

    // Parse CSV file
    parseCSV(buffer) {
        const text = buffer.toString('utf-8');
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header row and one data row');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Validate required headers
        const requiredHeaders = ['roll number', 'student name', 'email'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
        }
        
        const students = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            if (values.length < 3) continue; // Skip incomplete rows
            
            const rollNumberIndex = headers.indexOf('roll number');
            const nameIndex = headers.indexOf('student name');
            const emailIndex = headers.indexOf('email');
            const phoneIndex = headers.indexOf('phone number');
            
            const rollNumber = values[rollNumberIndex] || '';
            const name = values[nameIndex] || '';
            const email = values[emailIndex] || '';
            const phoneNumber = phoneIndex >= 0 ? values[phoneIndex] || '' : '';
            
            if (rollNumber && name && email) {
                students.push({
                    rollNumber,
                    name,
                    email,
                    phoneNumber
                });
            }
        }
        
        return students;
    }

    // Parse Excel file
    parseExcel(buffer) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
            throw new Error('Excel file must have at least a header row and one data row');
        }
        
        const headers = jsonData[0].map(h => h ? h.toString().trim().toLowerCase() : '');
        
        // Validate required headers
        const requiredHeaders = ['roll number', 'student name', 'email'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
        }
        
        const students = [];
        
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            if (row.length < 3) continue; // Skip incomplete rows
            
            const rollNumberIndex = headers.indexOf('roll number');
            const nameIndex = headers.indexOf('student name');
            const emailIndex = headers.indexOf('email');
            const phoneIndex = headers.indexOf('phone number');
            
            const rollNumber = row[rollNumberIndex] ? row[rollNumberIndex].toString().trim() : '';
            const name = row[nameIndex] ? row[nameIndex].toString().trim() : '';
            const email = row[emailIndex] ? row[emailIndex].toString().trim() : '';
            const phoneNumber = phoneIndex >= 0 && row[phoneIndex] ? row[phoneIndex].toString().trim() : '';
            
            if (rollNumber && name && email) {
                students.push({
                    rollNumber,
                    name,
                    email,
                    phoneNumber
                });
            }
        }
        
        return students;
    }
}

module.exports = new BatchController();