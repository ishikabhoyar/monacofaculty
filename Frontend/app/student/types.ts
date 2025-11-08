export interface TestCase {
  id: number;
  input: string;
  expected_output: string;
  is_sample: boolean;
  is_hidden: boolean;
}

export interface Question {
  id: number;
  question_text: string;
  marks: number;
  question_type: string;
  programming_language: string;
  code_template: string;
  time_limit_seconds: number;
  memory_limit_mb: number;
  test_cases?: TestCase[];
}