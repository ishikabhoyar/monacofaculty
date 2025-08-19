CREATE TABLE faculties (
    faculty_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    google_id VARCHAR(255) NOT NULL UNIQUE,
    department VARCHAR(255)
);

CREATE TABLE batches (
    batch_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    faculty_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(faculty_id)
);

CREATE TABLE tests (
    test_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    course_id VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    max_attempts INT DEFAULT 1,
    is_password_protected BOOLEAN DEFAULT FALSE,
    password VARCHAR(255),
    allow_late_submission BOOLEAN DEFAULT FALSE,
    faculty_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(faculty_id)
);

CREATE TABLE questions (
    question_id SERIAL PRIMARY KEY,
    test_id INT,
    question_text TEXT NOT NULL,
    options JSON,
    correct_answer VARCHAR(255),
    marks INT,
    FOREIGN KEY (test_id) REFERENCES tests(test_id)
);

CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    batch_id INT,
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id)
);

CREATE TABLE test_assignments (
    assignment_id SERIAL PRIMARY KEY,
    test_id INT,
    batch_id INT,
    FOREIGN KEY (test_id) REFERENCES tests(test_id),
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id)
);

CREATE TABLE submissions (
    submission_id SERIAL PRIMARY KEY,
    student_id INT,
    test_id INT,
    question_id INT,
    submitted_answer TEXT,
    marks_obtained INT,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (test_id) REFERENCES tests(test_id),
    FOREIGN KEY (question_id) REFERENCES questions(question_id)
);