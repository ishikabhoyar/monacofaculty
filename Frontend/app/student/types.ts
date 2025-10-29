export interface Question {
  id: number;
  question_text: string;
  marks: number;
  question_type: string;
  programming_language: string;
  code_template: string;
  time_limit_seconds: number;
  memory_limit_mb: number;
}