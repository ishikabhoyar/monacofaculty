'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CodeChallenge } from '@/components/CodeChallenge';
import withStudentAuth from '../withStudentAuth';
import { Question } from '../types';

const TestEditor = () => {
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const testId = searchParams.get('testId');
    const questionsParam = searchParams.get('questions');

    if (questionsParam) {
      try {
        const parsedQuestions = JSON.parse(decodeURIComponent(questionsParam));
        setQuestions(parsedQuestions);
        if (parsedQuestions.length > 0) {
          setCurrentQuestion(parsedQuestions[0]);
        }
      } catch (error) {
        console.error('Error parsing questions:', error);
      }
    }
  }, [searchParams]);

  const handleSubmitCode = async (code: string, language: string) => {
    if (!currentQuestion) return;

    try {
      const response = await fetch('/api/students/submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: searchParams.get('testId'),
          answers: [{
            questionId: currentQuestion.id,
            submittedAnswer: code
          }]
        })
      });

      const data = await response.json();
      if (data.success) {
        // Handle successful submission
        console.log('Code submitted successfully');
      }
    } catch (error) {
      console.error('Error submitting code:', error);
    }
  };

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-none p-4 border-b">
        <h1 className="text-xl font-semibold">{currentQuestion.question_text}</h1>
        <div className="mt-2">
          <span className="text-sm text-gray-600">
            Time Limit: {currentQuestion.time_limit_seconds}s |
            Memory Limit: {currentQuestion.memory_limit_mb}MB |
            Points: {currentQuestion.marks}
          </span>
        </div>
      </div>
      <div className="flex-grow">
        <CodeChallenge 
          initialCode={currentQuestion.code_template || ''}
          onSubmit={handleSubmitCode}
          language={currentQuestion.programming_language}
          testCases={currentQuestion.test_cases || []}
        />
      </div>
    </div>
  );
};

export default withStudentAuth(TestEditor);