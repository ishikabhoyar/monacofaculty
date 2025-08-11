-- Batch management tables for Monaco Faculty Portal

-- Table to store batch information
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    batch_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(50) NOT NULL, -- e.g., 'first', 'second', 'third', 'fourth'
    semester VARCHAR(50) NOT NULL, -- e.g., 'sem1', 'sem2', etc.
    description TEXT,
    faculty_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(batch_name, academic_year, semester, faculty_id)
);

-- Table to store student information
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(roll_number, batch_id),
    UNIQUE(email, batch_id)
);

-- Add indexes for better performance
CREATE INDEX idx_batches_faculty ON batches(faculty_id);
CREATE INDEX idx_batches_academic ON batches(academic_year, semester);
CREATE INDEX idx_students_batch ON students(batch_id);
CREATE INDEX idx_students_roll ON students(roll_number);
CREATE INDEX idx_students_email ON students(email);

-- Add RLS (Row Level Security) policies
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policy: Faculty can only see their own batches
CREATE POLICY "Faculty can view own batches" ON batches
    FOR ALL USING (auth.uid() = faculty_id);

-- Policy: Faculty can view students in their batches
CREATE POLICY "Faculty can view students in own batches" ON students
    FOR ALL USING (
        batch_id IN (
            SELECT id FROM batches WHERE faculty_id = auth.uid()
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for batches
CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
