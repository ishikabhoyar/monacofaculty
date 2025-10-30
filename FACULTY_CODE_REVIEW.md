# Faculty Code Review & Grading Feature

## Overview
Faculty members can now view, run, and grade student code submissions directly in a Monaco editor with real-time code execution.

## Features

### 1. **Interactive Code Viewer**
   - Full Monaco editor integration with syntax highlighting
   - Support for multiple programming languages (JavaScript, Python, Java, C++, C)
   - Read/Write access to review and potentially test modifications

### 2. **Code Execution**
   - Run student code directly from the viewer
   - Real-time terminal output with WebSocket connection
   - View compilation errors, runtime errors, and program output
   - Useful for testing edge cases and validating solutions

### 3. **Grading System**
   - Input marks directly in the viewer interface
   - Validates marks against question's total marks
   - Updates reflected immediately in submissions list
   - Persists to database with timestamp

## How to Use

### Accessing Student Submissions
1. Navigate to the **"Submissions"** tab in the Faculty Portal
2. View list of all student submissions with details:
   - Student name and roll number
   - Test title and question
   - Batch information
   - Submission timestamp
   - Current grade (if already graded)

### Reviewing Code
1. Click **"View Code"** button on any submission
2. A full-screen dialog opens with:
   - **Top Panel**: Student info, test details, question text
   - **Middle Panel**: Monaco code editor with student's code
   - **Bottom Panel**: Terminal for code execution output
   - **Grading Section**: Input field and save button

### Running Student Code
1. Click the **"Run Code"** button in the editor toolbar
2. Code is sent to execution server via WebSocket
3. Output appears in real-time in the terminal below
4. Watch for:
   - Standard output
   - Error messages (in red)
   - System messages (in blue)

### Grading Submissions
1. Review the code and test execution
2. Enter marks in the grading input field
3. Marks must be between 0 and the question's total marks
4. Click **"Save Marks"** to persist the grade
5. Success confirmation appears in the terminal

## Technical Details

### Frontend Components
- **SubmissionCodeViewer.tsx**: Main component for code review
  - Monaco Editor integration
  - WebSocket connection management
  - Grading interface
  
### Backend API Endpoints
- **PUT /api/faculty/submissions/:submissionId/grade**
  - Validates faculty authorization
  - Checks marks against question total
  - Updates submission with marks and timestamp
  - Returns updated submission data

### Database Updates
- `marks_obtained` field updated on submission
- `graded_at` timestamp recorded
- Validates faculty owns the test before allowing grading

## Security & Authorization
- Faculty can only grade submissions for their own tests
- JWT authentication required for all grading operations
- Marks validation prevents over-grading
- WebSocket connections for code execution are isolated per submission

## Benefits
1. **Faster Grading**: Review and grade in one interface
2. **Better Evaluation**: Run code to verify functionality
3. **Transparency**: See exactly what student submitted
4. **Flexibility**: Test edge cases and different inputs
5. **Efficiency**: No need to copy/paste code elsewhere

## Future Enhancements
- Automated test case execution
- Side-by-side comparison with expected output
- Bulk grading for similar submissions
- Comments and feedback on specific lines
- Plagiarism detection integration
