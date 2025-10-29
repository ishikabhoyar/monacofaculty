# Monaco Faculty

## Overview
This repository contains the Monaco Faculty project, a web application with a dedicated frontend component.

## Getting Started

### Prerequisites
- Node.js and npm installed on your system
- Git for version control

### Installation

# Monaco Faculty - Online Assessment & Testing Platform

<div align="center">

![Monaco Faculty](https://img.shields.io/badge/Monaco-Faculty-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.4.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?style=for-the-badge&logo=postgresql)

A comprehensive online assessment platform for educational institutions, enabling faculty to create and manage tests, batches, and student assessments with real-time code execution support.

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎯 Overview

Monaco Faculty is a full-stack web application designed for educational institutions to conduct online assessments efficiently. The platform provides separate interfaces for faculty and students, featuring:

- **Faculty Dashboard**: Create and manage tests, batches, questions, and view student submissions
- **Student Portal**: Take assigned tests with support for multiple-choice and coding questions
- **Code Editor**: Integrated Monaco Editor for coding assessments
- **Batch Management**: Bulk student enrollment via CSV/Excel upload
- **Real-time Assessment**: Timed tests with automatic submission

---

## ✨ Features

### 👨‍🏫 For Faculty

- **Google OAuth Authentication** - Secure login with Google accounts
- **Batch Management**
  - Create batches with academic year and semester
  - Bulk student import via CSV/Excel files
  - Download template files for easy batch creation
  - Edit and delete batches
- **Test Creation & Management**
  - Multiple question types (MCQ, Coding, Short Answer, Essay)
  - Flexible scheduling with start/end times
  - Duration and attempt limits
  - Password protection for tests
  - Late submission penalties
- **Question Bank**
  - Support for DSA tags (Array, String, Tree, Graph, etc.)
  - Coding questions with test cases
  - Multiple programming languages (JavaScript, Python, Java, C++, etc.)
  - Difficulty levels (Easy, Medium, Hard)
  - Code templates and time/memory limits
- **Student Management**
  - View all students in batches
  - Track student submissions
  - Evaluate and grade submissions

### 👨‍🎓 For Students

- **Simple Authentication** - Login with roll number and batch ID
- **Test Dashboard** - View all assigned tests with status (Active, Upcoming, Completed)
- **Test Taking Interface**
  - Countdown timer
  - Multiple-choice questions
  - Integrated code editor for programming questions
  - Auto-save functionality
  - Submit answers
- **Submission History** - View past submissions and scores

### 🔧 Technical Features

- **Monaco Editor Integration** - VSCode-like code editing experience
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Dark/Light Mode** - Theme toggle for user preference
- **Real-time Validation** - Client and server-side validation
- **Secure API** - JWT-based authentication
- **Database Migrations** - Version-controlled schema changes

---

## 🛠 Tech Stack

### Frontend

- **Framework**: Next.js 15.4.3 (React 19.1.0)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: 
  - Radix UI (Accessible component primitives)
  - Shadcn UI components
  - Lucide React icons
- **Code Editor**: Monaco Editor (@monaco-editor/react 4.7.0)
- **Authentication**: @react-oauth/google
- **HTTP Client**: Axios 1.11.0
- **Markdown**: react-markdown with syntax highlighting

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: PostgreSQL (via pg 8.16.3)
- **Authentication**: 
  - JWT (jsonwebtoken 9.0.2)
  - Google OAuth (google-auth-library 10.2.1)
- **File Upload**: Multer 2.0.2
- **Excel/CSV Parsing**: xlsx 0.18.5
- **CORS**: cors 2.8.5
- **Environment**: dotenv 17.2.1

### Database

- **Primary**: PostgreSQL
- **Schema Management**: SQL migrations
- **Connection Pooling**: pg pool

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │   Faculty  │  │   Student  │  │   Monaco Editor      │  │
│  │  Dashboard │  │   Portal   │  │   (Code Challenges)  │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Express.js)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Routes: /api/faculty | /api/students | /api/tests  │   │
│  │         /api/batches | /api/questions               │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Middleware: Auth, CORS, Multer, Error Handling    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL Queries
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                     │
│  Tables: faculties, batches, students, tests, questions,    │
│         submissions, test_cases, tags, test_assignments     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Google OAuth Credentials** (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ishikabhoyar/monacofaculty.git
   cd monacofaculty
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   ```

   Create a `.env` file:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://user:password@localhost:5432/monaco_faculty
   JWT_SECRET=your-secret-key-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

   Initialize the database:
   ```bash
   # Run schema creation
   psql -U your_username -d monaco_faculty -f db/schema.sql
   
   # Run migrations
   psql -U your_username -d monaco_faculty -f db/migrations/add_submission_timestamps.sql
   psql -U your_username -d monaco_faculty -f db/migrations/remove_student_unique_constraints.sql
   ```

3. **Frontend Setup**
   ```bash
   cd ../Frontend
   npm install
   ```

   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   ```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd Backend
   node server.js
   # Server runs on http://localhost:5000
   ```

2. **Start Frontend Development Server**
   ```bash
   cd Frontend
   npm run dev
   # App runs on http://localhost:3000
   ```

3. **Access the Application**
   - Faculty Portal: `http://localhost:3000`
   - Student Portal: `http://localhost:3000/student/tests`
   - API Health Check: `http://localhost:5000/health`

---

## 📁 Project Structure

```
monacofaculty/
├── Backend/
│   ├── server.js                    # Express server entry point
│   ├── db.js                        # PostgreSQL connection pool
│   ├── authMiddleware.js            # JWT & Google OAuth middleware
│   ├── config.json                  # Cloudflare tunnel config
│   ├── package.json
│   ├── routes/
│   │   ├── faculty.js               # Faculty authentication routes
│   │   ├── batches.js               # Batch CRUD operations
│   │   ├── students.js              # Student auth & submissions
│   │   ├── tests.js                 # Test management
│   │   └── questions.js             # Question bank operations
│   ├── controllers/
│   │   └── batchController.js       # Batch business logic
│   └── db/
│       ├── schema.sql               # Database schema
│       └── migrations/              # Schema migrations
│           ├── add_submission_timestamps.sql
│           └── remove_student_unique_constraints.sql
│
├── Frontend/
│   ├── app/
│   │   ├── layout.tsx               # Root layout with theme
│   │   ├── page.tsx                 # Home/landing page
│   │   ├── login/                   # Faculty login
│   │   ├── logout/                  # Logout handler
│   │   ├── batches/                 # Batch management pages
│   │   │   ├── page.tsx             # List all batches
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Batch details
│   │   │       └── edit/page.tsx    # Edit batch
│   │   ├── create-batch/            # Bulk student import
│   │   ├── tests/                   # Test management
│   │   │   ├── page.tsx             # List all tests
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Test details
│   │   │       └── questions/       # Question management
│   │   ├── create-test/             # Test creation wizard
│   │   ├── add-question/            # Add questions to test
│   │   ├── student/                 # Student portal
│   │   │   ├── tests/               # Student test dashboard
│   │   │   ├── editor/              # Code editor for tests
│   │   │   ├── types.ts             # TypeScript types
│   │   │   └── withStudentAuth.tsx  # Student auth HOC
│   │   ├── settings/                # User settings
│   │   ├── api/
│   │   │   └── students/            # Next.js API routes
│   │   │       ├── submissions/route.ts
│   │   │       └── tests/
│   │   └── components/
│   │       └── Navbar.tsx           # Navigation component
│   ├── components/
│   │   ├── BatchesTab.tsx           # Batch listing component
│   │   ├── TestsTab.tsx             # Test listing component
│   │   ├── CodeChallenge.tsx        # Monaco editor wrapper
│   │   ├── ProtectedLayout.tsx      # Auth guard
│   │   ├── ThemeToggle.tsx          # Dark/light mode toggle
│   │   ├── LogoutButton.tsx
│   │   └── ui/                      # Shadcn UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── table.tsx
│   │       └── ...
│   ├── contexts/
│   │   └── ThemeContext.tsx         # Theme state management
│   ├── lib/
│   │   ├── facultyApi.ts            # API client
│   │   └── utils.ts                 # Utility functions
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── components.json              # Shadcn config
│   └── package.json
│
├── BATCH_CREATION.md                # Batch feature documentation
├── STUDENT_API_DOCUMENTATION.md     # Student API reference
├── STUDENT_DUPLICATE_ERROR_HANDLING.md
├── STUDENT_MULTIPLE_BATCH_MEMBERSHIP.md
├── UI_REDESIGN_SUMMARY.md
└── README.md                        # This file
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Faculty Endpoints

#### Authentication
- **POST** `/api/login` - Faculty Google OAuth login
  ```json
  // Google ID token in Authorization header
  // Response:
  {
    "success": true,
    "user": { "id": 1, "email": "faculty@example.com", "name": "Dr. Smith" },
    "token": "jwt_token_here",
    "facultyId": 1
  }
  ```

#### Batches
- **GET** `/api/batches` - Get all batches for logged-in faculty
- **GET** `/api/batches/:id` - Get specific batch details
- **POST** `/api/batches` - Create new batch with students
  ```json
  {
    "batchName": "CS 2024 A",
    "academicYear": "2024-2025",
    "semester": "1",
    "description": "Computer Science Batch A",
    "students": [
      {
        "rollNumber": "CS2024001",
        "name": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "+1234567890"
      }
    ]
  }
  ```
- **PUT** `/api/batches/:id` - Update batch information
- **DELETE** `/api/batches/:id` - Delete batch and all students

#### Tests
- **GET** `/api/tests` - Get all tests created by faculty
- **GET** `/api/tests/:id` - Get specific test details
- **POST** `/api/tests` - Create new test
  ```json
  {
    "title": "Midterm Exam",
    "courseId": "CS101",
    "description": "Data Structures Midterm",
    "instructions": "Answer all questions",
    "startTime": "2025-11-01T10:00:00Z",
    "endTime": "2025-11-01T12:00:00Z",
    "durationMinutes": 120,
    "maxAttempts": 1,
    "password": "exam2024",
    "latePenaltyPercent": 10,
    "batchId": 1
  }
  ```
- **PUT** `/api/tests/:id` - Update test
- **DELETE** `/api/tests/:id` - Delete test

#### Questions
- **GET** `/api/questions?testId=:id` - Get all questions for a test
- **GET** `/api/questions/:id` - Get specific question
- **POST** `/api/questions` - Add question to test
  ```json
  {
    "testId": 1,
    "questionText": "What is a binary tree?",
    "questionType": "multiple_choice",
    "options": ["A graph", "A tree with max 2 children", "A linked list", "An array"],
    "correctAnswer": "A tree with max 2 children",
    "marks": 5,
    "difficulty": "easy",
    "hints": ["Think about node structure", "Consider child nodes"],
    "explanation": "A binary tree is a tree data structure where each node has at most two children"
  }
  ```
- **POST** `/api/questions/coding` - Add coding question
  ```json
  {
    "testId": 1,
    "questionText": "Write a function to reverse a linked list",
    "questionType": "coding",
    "programmingLanguage": "javascript",
    "codeTemplate": "function reverseList(head) {\n  // Your code here\n}",
    "marks": 10,
    "difficulty": "medium",
    "timeLimitSeconds": 5,
    "memoryLimitMb": 256,
    "testCases": [
      {
        "input": "[1,2,3,4,5]",
        "expectedOutput": "[5,4,3,2,1]",
        "isSample": true
      }
    ]
  }
  ```
- **PUT** `/api/questions/:id` - Update question
- **DELETE** `/api/questions/:id` - Delete question

### Student Endpoints

#### Authentication
- **POST** `/api/student/login` - Student login with roll number
  ```json
  {
    "rollNumber": "CS2024001",
    "batchId": 1
  }
  // Response:
  {
    "success": true,
    "student": { "id": 1, "name": "John Doe", "rollNumber": "CS2024001" },
    "token": "jwt_token_here"
  }
  ```

#### Tests & Submissions
- **GET** `/api/students/tests` - Get all assigned tests
- **GET** `/api/students/tests/:testId/questions` - Get questions for a test (without answers)
- **GET** `/api/students/submissions` - Get all submissions by student
- **POST** `/api/students/submissions` - Submit answers
  ```json
  {
    "testId": 1,
    "answers": [
      {
        "questionId": 1,
        "submittedAnswer": "A tree with max 2 children"
      },
      {
        "questionId": 2,
        "submittedAnswer": "function reverseList(head) { ... }"
      }
    ]
  }
  ```

### File Upload

- **POST** `/api/upload/parse-file` - Parse CSV/Excel file for batch creation
  - Content-Type: `multipart/form-data`
  - Field: `file`
  - Supported: CSV, XLS, XLSX
  - Max Size: 5MB

For detailed API documentation, see [STUDENT_API_DOCUMENTATION.md](./STUDENT_API_DOCUMENTATION.md)

---

## 🗄 Database Schema

### Core Tables

#### `faculties`
```sql
CREATE TABLE faculties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    google_id VARCHAR(255) NOT NULL UNIQUE,
    department VARCHAR(255)
);
```

#### `batches`
```sql
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    batch_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    description TEXT,
    faculty_id INTEGER REFERENCES faculties(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(batch_name, academic_year, semester, faculty_id)
);
```

#### `students`
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
    google_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `tests`
```sql
CREATE TABLE tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    course_id VARCHAR(50),
    description TEXT,
    instructions TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    max_attempts INTEGER DEFAULT 1,
    password VARCHAR(100),
    late_penalty_percent INTEGER DEFAULT 0,
    faculty_id INTEGER REFERENCES faculties(id),
    batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `questions`
```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id),
    question_text TEXT NOT NULL,
    options JSON,
    correct_answer VARCHAR(255),
    marks INTEGER,
    question_type VARCHAR(50) DEFAULT 'multiple_choice',
    difficulty VARCHAR(20) DEFAULT 'easy',
    programming_language VARCHAR(50),
    code_template TEXT,
    time_limit_seconds INTEGER,
    memory_limit_mb INTEGER,
    hints TEXT,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `submissions`
```sql
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    test_id INTEGER REFERENCES tests(id),
    question_id INTEGER REFERENCES questions(id),
    submitted_answer TEXT,
    marks_obtained INTEGER,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Supporting Tables

- **`test_cases`** - Test cases for coding questions
- **`tags`** - DSA and topic tags (Array, String, Tree, etc.)
- **`question_tags`** - Junction table for question-tag relationships
- **`test_assignments`** - Junction table for test-batch assignments

For complete schema, see [Backend/db/schema.sql](./Backend/db/schema.sql)

---

## 🔐 Authentication

### Faculty Authentication Flow

1. Faculty clicks "Login with Google"
2. Frontend redirects to Google OAuth
3. Google returns ID token
4. Frontend sends ID token to `/api/login`
5. Backend verifies token with Google
6. Backend generates JWT token
7. Frontend stores JWT token
8. Subsequent requests include JWT in Authorization header

### Student Authentication Flow

1. Student enters roll number and batch ID
2. Frontend sends credentials to `/api/student/login`
3. Backend validates against database
4. Backend generates JWT token with student info
5. Frontend stores JWT token
6. Student can access assigned tests

### Security Features

- **JWT Expiration**: Tokens expire after 24 hours
- **Password Hashing**: Bcrypt for test passwords
- **CORS**: Configured for specific origins
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization

---

## 🚢 Deployment

### Backend Deployment

The backend is configured with Cloudflare Tunnel for secure access:

```json
{
  "tunnel": "38e6bf5a-5f9f-438e-8b44-40c55b834079",
  "ingress": [
    {
      "hostname": "monacofbackend.ishikabhoyar.tech",
      "service": "http://localhost:6666"
    }
  ]
}
```

**Deployment Steps:**
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy with Docker or directly on server
5. Configure Cloudflare Tunnel (see [Backend/README.tunnel.md](./Backend/README.tunnel.md))

### Frontend Deployment

**Vercel (Recommended):**
```bash
cd Frontend
vercel --prod
```

**Self-hosted:**
```bash
cd Frontend
npm run build
npm start
```

### Environment Variables for Production

**Backend:**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-production-secret
GOOGLE_CLIENT_ID=prod-client-id
GOOGLE_CLIENT_SECRET=prod-client-secret
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://monacofbackend.ishikabhoyar.tech
NEXT_PUBLIC_GOOGLE_CLIENT_ID=prod-client-id
```

---

## 📖 Additional Documentation

- [Batch Creation Guide](./BATCH_CREATION.md)
- [Student API Documentation](./STUDENT_API_DOCUMENTATION.md)
- [Student Duplicate Handling](./STUDENT_DUPLICATE_ERROR_HANDLING.md)
- [Multiple Batch Membership](./STUDENT_MULTIPLE_BATCH_MEMBERSHIP.md)
- [UI Redesign Summary](./UI_REDESIGN_SUMMARY.md)
- [Timezone Fix](./Backend/TIMEZONE_FIX.md)
- [Cloudflare Tunnel Setup](./Backend/README.tunnel.md)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with clear messages**
   ```bash
   git commit -m 'Add: amazing new feature'
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Coding Standards

- **TypeScript**: Use strict types, avoid `any`
- **React**: Functional components with hooks
- **Code Style**: Follow ESLint configuration
- **Commits**: Use conventional commit messages
- **Testing**: Add tests for new features

---

## 🐛 Known Issues & Roadmap

### Current Issues
- [ ] Code execution engine not implemented (submissions are stored but not evaluated)
- [ ] Real-time collaboration not available
- [ ] Limited support for batch operations on existing students

### Roadmap
- [ ] Implement code execution with Docker containers
- [ ] Add plagiarism detection for code submissions
- [ ] Real-time test monitoring for faculty
- [ ] Analytics dashboard with student performance metrics
- [ ] Mobile app for iOS and Android
- [ ] Integration with LMS platforms (Canvas, Moodle)
- [ ] AI-powered question generation
- [ ] Proctoring features with webcam monitoring

---

## 📝 License

This project is currently private and proprietary. All rights reserved.

For licensing inquiries, contact the repository owner.

---

## 👥 Team

**Developer**: Ishika Bhoyar ([@ishikabhoyar](https://github.com/ishikabhoyar))

---

## 📞 Support

For issues, questions, or feature requests:

- **GitHub Issues**: [Create an issue](https://github.com/ishikabhoyar/monacofaculty/issues)
- **Email**: [Contact via GitHub](https://github.com/ishikabhoyar)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [Shadcn UI](https://ui.shadcn.com/) - Beautiful UI components
- [Express.js](https://expressjs.com/) - Backend framework
- [PostgreSQL](https://www.postgresql.org/) - Database

---

<div align="center">

**Last Updated**: October 30, 2025

Made with ❤️ for education

</div>

## Project Structure
```
monacofaculty/
├── Frontend/       # Frontend application files
│   ├── public/     # Public assets
│   ├── src/        # Source files
│   └── package.json # Frontend dependencies
└── README.md
```

## Technologies
- JavaScript/TypeScript
- React (assumed based on Frontend structure)
- Node.js
- npm package manager
- [Other relevant technologies]

## Features
- Interactive faculty management interface
- User authentication system
- Course and curriculum management
- Student-faculty interaction portal
- Administrative dashboard

## Development Status
This project is currently under active development.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
[MIT/Apache/GNU or other relevant license]

## Contact
- GitHub: [@ishikabhoyar](https://github.com/ishikabhoyar)
- [Other contact information if desired]

---

Last updated: 2025-08-14 07:07:22 UTC
