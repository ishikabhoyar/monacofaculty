# Student API Integration Documentation

## Overview

The Monaco Faculty system now includes comprehensive student functionality, allowing students to authenticate, access assigned tests, view questions, and submit answers. This documentation covers the complete student API integration.

## Authentication

### Student Login

Students authenticate using their roll number and batch ID, receiving a JWT token for subsequent API calls.

**Endpoint:** `POST /api/student/login`

**Request Body:**
```json
{
  "rollNumber": "CS2024001",
  "batchId": 1
}
```

**Success Response (200):**
```json
{
  "success": true,
  "student": {
    "id": 1,
    "rollNumber": "CS2024001",
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400`: Missing roll number or batch ID
- `401`: Invalid credentials
- `500`: Server error

## Student API Endpoints

All student endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### 1. Get Available Tests

Retrieves all tests assigned to the student's batch.

**Endpoint:** `GET /api/students/tests`

**Response:**
```json
{
  "success": true,
  "tests": [
    {
      "id": 1,
      "title": "Midterm Examination",
      "course": "PHYS202",
      "description": "Physics midterm exam",
      "instructions": "Answer all questions",
      "start_time": "2025-09-24T19:13:00.000Z",
      "end_time": "2025-09-29T22:13:00.000Z",
      "duration_minutes": 91,
      "max_attempts": 1,
      "status": "Active", // "Active", "Upcoming", or "Completed"
      "faculty_name": "Dr. Smith"
    }
  ]
}
```

### 2. Get Test Questions

Retrieves questions for a specific test. **Note:** Sensitive information (correct answers, hints, explanations) is automatically excluded for security.

**Endpoint:** `GET /api/students/tests/{testId}/questions`

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": 1,
      "question_text": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "marks": 5,
      "question_type": "multiple_choice",
      "difficulty": "easy",
      "programming_language": null,
      "code_template": null,
      "time_limit_seconds": null,
      "memory_limit_mb": null
    },
    {
      "id": 2,
      "question_text": "Write a function to reverse a string",
      "options": [],
      "marks": 10,
      "question_type": "coding",
      "difficulty": "medium",
      "programming_language": "javascript",
      "code_template": "function reverseString(str) {\n    // Your code here\n}",
      "time_limit_seconds": 5,
      "memory_limit_mb": 256
    }
  ]
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Access denied: Test not available for this student"
}
```

### 3. Get Student Submissions

Retrieves all submissions made by the authenticated student.

**Endpoint:** `GET /api/students/submissions`

**Response:**
```json
{
  "success": true,
  "submissions": [
    {
      "id": 1,
      "test_id": 1,
      "question_id": 1,
      "submitted_answer": "Paris",
      "marks_obtained": 5,
      "test_title": "Geography Quiz",
      "question_text": "What is the capital of France?",
      "total_marks": 5
    }
  ]
}
```

### 4. Submit Answers

Submits answers for a test. Can be used for both new submissions and updates to existing ones.

**Endpoint:** `POST /api/students/submissions`

**Request Body:**
```json
{
  "testId": 1,
  "answers": [
    {
      "questionId": 1,
      "submittedAnswer": "Paris"
    },
    {
      "questionId": 2,
      "submittedAnswer": "function reverseString(str) {\n    return str.split('').reverse().join('');\n}"
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Answers submitted successfully",
  "submissions": [
    {
      "id": 1,
      "student_id": 1,
      "test_id": 1,
      "question_id": 1,
      "submitted_answer": "Paris",
      "marks_obtained": null
    }
  ]
}
```

**Error Responses:**
- `400`: Invalid request format
- `403`: Test not available to student
- `500`: Server error

## Integration Steps

### 1. Frontend Setup

Create a student login page that collects roll number and batch ID:

```typescript
// Login component
const handleStudentLogin = async (rollNumber: string, batchId: number) => {
  try {
    const response = await fetch('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNumber, batchId })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentInfo', JSON.stringify(data.student));
      // Redirect to student dashboard
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### 2. API Client Setup

Create a student API client with authentication:

```typescript
// Student API client
class StudentAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    return fetch(`/api/students${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  async getTests() {
    const response = await this.request('/tests');
    return response.json();
  }

  async getQuestions(testId: number) {
    const response = await this.request(`/tests/${testId}/questions`);
    return response.json();
  }

  async getSubmissions() {
    const response = await this.request('/submissions');
    return response.json();
  }

  async submitAnswers(testId: number, answers: any[]) {
    const response = await this.request('/submissions', {
      method: 'POST',
      body: JSON.stringify({ testId, answers })
    });
    return response.json();
  }
}
```

### 3. Student Dashboard

Create a dashboard that shows available tests:

```typescript
// Student Dashboard Component
const StudentDashboard = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    if (!token) {
      // Redirect to login
      return;
    }

    const api = new StudentAPI(token);

    api.getTests().then(data => {
      if (data.success) {
        setTests(data.tests);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1>Available Tests</h1>
      {tests.map(test => (
        <div key={test.id} className="test-card">
          <h3>{test.title}</h3>
          <p>Course: {test.course}</p>
          <p>Status: {test.status}</p>
          <p>Duration: {test.duration_minutes} minutes</p>
          <button
            onClick={() => navigate(`/test/${test.id}`)}
            disabled={test.status !== 'Active'}
          >
            {test.status === 'Active' ? 'Take Test' : test.status}
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 4. Test Taking Interface

Create a test interface that loads questions and handles submissions:

```typescript
// Test Taking Component
const TakeTest = ({ testId }: { testId: number }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    const api = new StudentAPI(token);

    // Load questions
    api.getQuestions(testId).then(data => {
      if (data.success) {
        setQuestions(data.questions);
        // Initialize answers object
        const initialAnswers = {};
        data.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      }
    });

    // Load test details for timer
    api.getTests().then(data => {
      if (data.success) {
        const test = data.tests.find(t => t.id === testId);
        if (test) {
          setTimeLeft(test.duration_minutes * 60); // Convert to seconds
        }
      }
    });
  }, [testId]);

  const handleSubmit = async () => {
    const token = localStorage.getItem('studentToken');
    const api = new StudentAPI(token);

    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId: parseInt(questionId),
      submittedAnswer: answer
    }));

    const result = await api.submitAnswers(testId, answersArray);
    if (result.success) {
      alert('Test submitted successfully!');
      // Redirect to results or dashboard
    }
  };

  return (
    <div>
      <div className="timer">
        Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>

      {questions.map(question => (
        <div key={question.id} className="question">
          <h3>{question.question_text}</h3>

          {question.question_type === 'multiple_choice' ? (
            <div className="options">
              {question.options.map((option, index) => (
                <label key={index}>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={(e) => setAnswers({
                      ...answers,
                      [question.id]: e.target.value
                    })}
                  />
                  {option}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[question.id]}
              onChange={(e) => setAnswers({
                ...answers,
                [question.id]: e.target.value
              })}
              placeholder="Enter your answer here..."
            />
          )}
        </div>
      ))}

      <button onClick={handleSubmit}>Submit Test</button>
    </div>
  );
};
```

## Security Considerations

1. **JWT Token Storage**: Store tokens securely (localStorage is acceptable for this use case, but consider httpOnly cookies for production)

2. **Token Expiration**: Tokens expire after 24 hours. Implement automatic logout on token expiry.

3. **Access Control**: All endpoints validate that students can only access tests assigned to their batch.

4. **Data Privacy**: Students cannot see correct answers, hints, or explanations for questions.

## Error Handling

Implement comprehensive error handling in your frontend:

```typescript
const handleApiError = (error: any) => {
  if (error.message?.includes('Token expired') || error.message?.includes('Invalid token')) {
    // Clear token and redirect to login
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentInfo');
    window.location.href = '/student/login';
  } else if (error.message?.includes('Access denied')) {
    alert('You do not have permission to access this resource');
  } else {
    alert('An error occurred. Please try again.');
  }
};
```

## Testing

Use the following curl commands to test the endpoints:

```bash
# Login
curl -X POST http://localhost:5000/api/student/login \
  -H "Content-Type: application/json" \
  -d '{"rollNumber":"CS2024001","batchId":1}'

# Get tests (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/students/tests \
  -H "Authorization: Bearer TOKEN"

# Get questions for test 1
curl -X GET http://localhost:5000/api/students/tests/1/questions \
  -H "Authorization: Bearer TOKEN"

# Submit answers
curl -X POST http://localhost:5000/api/students/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"testId":1,"answers":[{"questionId":1,"submittedAnswer":"Paris"}]}'
```

## Database Schema

The student functionality relies on these database tables:
- `students`: Student information and batch assignment
- `tests`: Test definitions
- `test_assignments`: Test-to-batch assignments
- `questions`: Question definitions
- `submissions`: Student answer submissions

Ensure your database is properly initialized with the schema before deploying.</content>
<parameter name="filePath">e:\projects\monacofaculty\STUDENT_API_DOCUMENTATION.md