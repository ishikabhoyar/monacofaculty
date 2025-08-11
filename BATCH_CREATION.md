# Batch Creation Feature

This feature allows faculty members to create student batches by uploading Excel or CSV files with student information.

## Features

### Frontend (`/create-batch`)
- **Batch Information Form**: Enter batch name, academic year, semester, and description
- **File Upload**: Support for CSV, XLS, and XLSX files
- **Template Download**: Download a sample CSV template with the correct format
- **Real-time Validation**: Validates student data as you upload
- **Preview Table**: Shows parsed student data before creating the batch
- **Error Handling**: Displays validation errors and parsing issues

### Backend API Endpoints

#### 1. Create Batch
- **Endpoint**: `POST /api/batches`
- **Description**: Creates a new batch with student information
- **Authentication**: Required (JWT token)
- **Request Body**:
```json
{
  "batchName": "Batch A1",
  "academicYear": "first",
  "semester": "sem1", 
  "description": "First year computer science batch",
  "students": [
    {
      "rollNumber": "CS2024001",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+1234567890"
    }
  ]
}
```

#### 2. Parse Upload File
- **Endpoint**: `POST /api/upload/parse-file`
- **Description**: Parses uploaded Excel/CSV files and extracts student data
- **Authentication**: Required (JWT token)
- **Content-Type**: `multipart/form-data`
- **File Types**: CSV, XLS, XLSX
- **Max File Size**: 5MB

#### 3. Get Batches
- **Endpoint**: `GET /api/batches`
- **Description**: Retrieves all batches created by the authenticated faculty
- **Authentication**: Required (JWT token)

#### 4. Get Batch by ID
- **Endpoint**: `GET /api/batches/:id`
- **Description**: Retrieves a specific batch with student details
- **Authentication**: Required (JWT token)

#### 5. Update Batch
- **Endpoint**: `PUT /api/batches/:id`
- **Description**: Updates batch information (not students)
- **Authentication**: Required (JWT token)

#### 6. Delete Batch
- **Endpoint**: `DELETE /api/batches/:id`
- **Description**: Deletes a batch and all associated students
- **Authentication**: Required (JWT token)

## File Format Requirements

### CSV Format
The CSV file should have the following columns (case-insensitive):
- **Roll Number** (required): Student's roll number or ID
- **Student Name** (required): Full name of the student
- **Email** (required): Valid email address
- **Phone Number** (optional): Contact number

### Excel Format
Excel files (.xls, .xlsx) should follow the same column structure as CSV files.

### Sample Template
```csv
Roll Number,Student Name,Email,Phone Number
CS2024001,John Doe,john.doe@example.com,+1234567890
CS2024002,Jane Smith,jane.smith@example.com,+1234567891
CS2024003,Mike Johnson,mike.johnson@example.com,+1234567892
```

## Database Schema

### Batches Table
```sql
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    batch_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    description TEXT,
    faculty_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(batch_name, academic_year, semester, faculty_id)
);
```

### Students Table
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    batch_id INTEGER NOT NULL REFERENCES batches(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(roll_number, batch_id),
    UNIQUE(email, batch_id)
);
```

## Validation Rules

### Client-side Validation
- Batch name, academic year, and semester are required
- At least one student must be uploaded
- Email format validation
- Duplicate roll number detection within the same upload

### Server-side Validation
- All client-side validations are repeated
- Database constraint validation (unique roll numbers and emails per batch)
- File size and type validation
- Authentication and authorization checks

## Security Features

### Row Level Security (RLS)
- Faculty can only access their own batches
- Students are only accessible to faculty who created the batch

### Authentication
- All API endpoints require valid JWT authentication
- Faculty can only perform operations on their own data

## Error Handling

### Common Error Scenarios
1. **Missing Required Columns**: File doesn't have required headers
2. **Invalid Email Format**: Email addresses don't match regex pattern
3. **Duplicate Data**: Roll numbers or emails are duplicated
4. **File Parsing Errors**: Corrupted or invalid file format
5. **Database Constraints**: Violating unique constraints

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

## Usage Instructions

### For Faculty
1. **Navigate to Create Batch**: Click "New Batch" button on dashboard
2. **Fill Batch Details**: Enter batch name, select academic year and semester
3. **Download Template**: (Optional) Download the CSV template for reference
4. **Upload File**: Choose your Excel or CSV file with student data
5. **Review Data**: Check the preview table for any errors
6. **Create Batch**: Click "Create Batch" to save

### File Preparation Tips
1. **Use the Template**: Download and use the provided template
2. **Check Email Formats**: Ensure all emails are valid
3. **Unique Roll Numbers**: Avoid duplicate roll numbers
4. **Clean Data**: Remove empty rows and extra spaces
5. **Save as CSV**: For best compatibility, save Excel files as CSV

## Installation & Setup

### Backend Dependencies
```bash
npm install xlsx multer
```

### Database Setup
Run the SQL script in `Backend/schema/batch_tables.sql` to create necessary tables.

### Environment Variables
Ensure your `.env` file has the proper Supabase configuration for database access.

## Future Enhancements

1. **Bulk Student Operations**: Update or delete multiple students
2. **Import History**: Track file upload history
3. **Advanced Validation**: Phone number format validation
4. **Export Features**: Export batch data to Excel
5. **Student Communication**: Send emails to students in batch
6. **Batch Analytics**: Student enrollment statistics
