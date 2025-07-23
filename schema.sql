CREATE TABLE tests (
    test_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    faculty_name VARCHAR(200) NOT NULL,
    password VARCHAR(100) NOT NULL, -- Password for test access
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructions TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL, -- Individual test duration
    max_attempts INT DEFAULT 1,
    is_published BOOLEAN DEFAULT FALSE,
    allow_late_submission BOOLEAN DEFAULT FALSE,
    late_penalty_percent DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_faculty (faculty_id),
    INDEX idx_start_time (start_time),
    INDEX idx_published (is_published)
);

CREATE TABLE questions (
    question_id INT PRIMARY KEY AUTO_INCREMENT,
    test_id INT NOT NULL,
    question_number INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    problem_statement TEXT NOT NULL, -- Markdown content
    sample_input TEXT,
    sample_output TEXT,
    constraints_info TEXT,
    max_score DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    time_limit_seconds INT DEFAULT 30, -- Execution time limit
    memory_limit_mb INT DEFAULT 128,
    allowed_languages JSON, -- Array of language_ids that are allowed
    starter_code JSON, -- Object with language_id as key and starter code as value
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (test_id) REFERENCES tests(test_id) ON DELETE CASCADE,
    UNIQUE KEY unique_question_number (test_id, question_number),
    INDEX idx_test (test_id),
    INDEX idx_difficulty (difficulty_level)
);

CREATE TABLE question_submissions (
    submission_id INT PRIMARY KEY AUTO_INCREMENT,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    language_id INT NOT NULL,
    submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    code_file_path VARCHAR(500), -- Path to actual code file in file system
    status ENUM('not_attempted', 'attempted', 'running', 'completed', 'error') DEFAULT 'not_attempted',
    execution_time_ms INT DEFAULT 0,
    memory_used_mb DECIMAL(8,2) DEFAULT 0.00,
    compilation_error TEXT,
    runtime_error TEXT,
    score DECIMAL(5,2) DEFAULT 0.00,
    test_cases_passed INT DEFAULT 0,
    total_test_cases INT DEFAULT 0,
    
    FOREIGN KEY (attempt_id) REFERENCES test_attempts(attempt_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES programming_languages(language_id),
    UNIQUE KEY unique_submission (attempt_id, question_id),
    INDEX idx_attempt (attempt_id),
    INDEX idx_question (question_id),
    INDEX idx_status (status)
);