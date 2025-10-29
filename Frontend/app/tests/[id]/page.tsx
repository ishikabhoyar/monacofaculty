"use client";

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTestById, getQuestionsForTest } from '../../../lib/facultyApi';
import { ArrowLeft, BookOpen, Clock, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Test {
  id: string;
  title: string;
  batch_name: string;
  description?: string;
  instructions?: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  max_attempts: number;
  password?: string;
  late_penalty_percent?: number;
  created_at: string;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
}

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTestData();
  }, [testId]);

  const fetchTestData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const [testResponse, questionsResponse] = await Promise.all([
        getTestById(testId, token),
        getQuestionsForTest(testId, token)
      ]);

      if (testResponse.success) {
        setTest(testResponse.test);
      }
      if (questionsResponse.success) {
        setQuestions(questionsResponse.questions);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch test data');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTestStatus = (test: Test) => {
    const now = new Date();
    const startTime = new Date(test.start_time);
    const endTime = new Date(test.end_time);

    if (startTime > now) return { status: 'Upcoming', color: 'text-blue-600 bg-blue-100' };
    if (startTime <= now && endTime > now) return { status: 'Active', color: 'text-green-600 bg-green-100' };
    return { status: 'Completed', color: 'text-gray-600 bg-gray-100' };
  };

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading test details...</div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">{error || 'Test not found'}</div>
        <button
          onClick={() => router.back()}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { status, color } = getTestStatus(test);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tests
        </button>
        <h1 className="text-3xl font-bold">{test.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-600">Batch: {test.batch_name}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-600">Duration: {test.duration_minutes} minutes</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-600">Max Attempts: {test.max_attempts}</span>
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded-full text-sm ${color}`}>
                  {status}
                </span>
              </div>
            </div>

            {test.description && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{test.description}</p>
              </div>
            )}

            {test.instructions && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Instructions</h3>
                <p className="text-gray-700">{test.instructions}</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Schedule</h2>
            <div className="space-y-2">
              <p><strong>Start Time:</strong> {formatDateTime(test.start_time)}</p>
              <p><strong>End Time:</strong> {formatDateTime(test.end_time)}</p>
              <p><strong>Created:</strong> {formatDateTime(test.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Questions Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Questions ({questions.length})
            </h2>
            <div className="space-y-2">
              <p><strong>Total Questions:</strong> {questions.length}</p>
              <p><strong>Total Marks:</strong> {totalMarks}</p>
              <p><strong>Average per Question:</strong> {questions.length > 0 ? (totalMarks / questions.length).toFixed(1) : 0} marks</p>
            </div>

            <div className="mt-4">
              <Link
                href={`/tests/${testId}/questions`}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md flex items-center justify-center"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Questions
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/tests/${testId}/edit`}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md flex items-center justify-center"
              >
                Edit Test
              </Link>
              <button
                onClick={() => {/* Add edit functionality */}}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Delete Test
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Preview */}
      {questions.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Questions Preview</h2>
          <div className="space-y-4">
            {questions.slice(0, 5).map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">Q{index + 1}: {question.question_text}</h3>
                  <span className="text-sm text-gray-500">{question.marks} marks</span>
                </div>
                <div className="ml-4">
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center mb-1">
                      <span className="w-6 text-sm text-gray-500">{String.fromCharCode(65 + optIndex)}.</span>
                      <span className="text-sm">{option}</span>
                      {option === question.correct_answer && (
                        <span className="ml-2 text-green-600 text-xs">(Correct)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {questions.length > 5 && (
              <p className="text-center text-gray-500">
                ... and {questions.length - 5} more questions
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}