"use client";

import { PlusCircle, Edit, Trash2, Eye, BookOpen, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTests, getBatches, deleteTest, getSubmissions } from '../../lib/facultyApi';

interface Test {
  id: string;
  title: string;
  batch_name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  max_attempts: number;
  created_at: string;
}

interface Batch {
  id: string;
  batch_name: string;
}

interface Submission {
  submission_id: string;
  student_name: string;
  student_roll: string;
  student_email: string;
  question_text: string;
  submitted_answer: string;
  marks_obtained: number | null;
  total_marks: number;
  submitted_at: string;
  question_type: string;
  programming_language: string | null;
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<{ [key: string]: Submission[] }>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const [testsResponse, batchesResponse] = await Promise.all([
        getTests(token),
        getBatches(token)
      ]);

      if (testsResponse.success) {
        setTests(testsResponse.tests);
      }
      if (batchesResponse.success) {
        setBatches(batchesResponse.batches);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await deleteTest(testId, token);
      setTests(tests.filter(test => test.id !== testId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete test');
    }
  };

  const toggleSubmissions = async (testId: string) => {
    if (expandedTestId === testId) {
      setExpandedTestId(null);
      return;
    }

    setExpandedTestId(testId);

    // If submissions are already loaded, don't fetch again
    if (submissions[testId]) {
      return;
    }

    // Fetch submissions for this test
    setLoadingSubmissions({ ...loadingSubmissions, [testId]: true });
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await getSubmissions(token, testId);
      if (response.success) {
        setSubmissions({ ...submissions, [testId]: response.submissions });
      }
    } catch (err: any) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoadingSubmissions({ ...loadingSubmissions, [testId]: false });
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesBatch = !selectedBatch || test.batch_name === selectedBatch;
    const now = new Date();
    const startTime = new Date(test.start_time);
    const endTime = new Date(test.end_time);

    let matchesStatus = true;
    if (statusFilter === 'upcoming') {
      matchesStatus = startTime > now;
    } else if (statusFilter === 'active') {
      matchesStatus = startTime <= now && endTime > now;
    } else if (statusFilter === 'completed') {
      matchesStatus = endTime <= now;
    }

    return matchesBatch && matchesStatus;
  });

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading tests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Tests</h1>
        <Link
          href="/create-test"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusCircle className="h-5 w-5 mr-2" /> Create Test
        </Link>
      </div>

      {/* Filtering options */}
      <div className="mb-6 flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow">
        <select
          className="border rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setSelectedBatch(e.target.value)}
          value={selectedBatch}
        >
          <option value="">All Batches</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.batch_name}>{batch.batch_name}</option>
          ))}
        </select>

        <select
          className="border rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setStatusFilter(e.target.value)}
          value={statusFilter}
        >
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Tests list */}
      {filteredTests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No tests found.</p>
          <Link
            href="/create-test"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Create your first test
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTests.map((test) => {
            const { status, color } = getTestStatus(test);
            const isExpanded = expandedTestId === test.id;
            const testSubmissions = submissions[test.id] || [];
            const isLoadingSubmissions = loadingSubmissions[test.id];
            
            return (
              <div key={test.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{test.title}</h3>
                    <p className="text-gray-600 mb-2">Batch: {test.batch_name}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>Duration: {test.duration_minutes} minutes</span>
                      <span>Max Attempts: {test.max_attempts}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${color}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/tests/${test.id}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md flex items-center text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Link>
                    <Link
                      href={`/tests/${test.id}/edit`}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md flex items-center text-sm"
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Link>
                    <Link
                      href={`/tests/${test.id}/questions`}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-md flex items-center text-sm"
                    >
                      <BookOpen className="h-4 w-4 mr-1" /> Questions
                    </Link>
                    <button
                      onClick={() => toggleSubmissions(test.id)}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-md flex items-center text-sm"
                    >
                      <FileText className="h-4 w-4 mr-1" /> Submissions
                      {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md flex items-center text-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <p>Start: {formatDateTime(test.start_time)}</p>
                  <p>End: {formatDateTime(test.end_time)}</p>
                  <p>Created: {formatDateTime(test.created_at)}</p>
                </div>

                {/* Submissions section */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold mb-4">Submissions for {test.batch_name}</h4>
                    
                    {isLoadingSubmissions ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Loading submissions...</p>
                      </div>
                    ) : testSubmissions.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No submissions yet for this test.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Roll Number
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Question
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Marks
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Submitted At
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Answer
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {testSubmissions.map((submission) => (
                              <tr key={submission.submission_id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {submission.student_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {submission.student_email}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {submission.student_roll}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm text-gray-900 max-w-xs truncate" title={submission.question_text}>
                                    {submission.question_text}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {submission.question_type}
                                  </span>
                                  {submission.programming_language && (
                                    <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                      {submission.programming_language}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <span className={`font-semibold ${
                                    submission.marks_obtained !== null 
                                      ? submission.marks_obtained >= submission.total_marks * 0.7
                                        ? 'text-green-600'
                                        : submission.marks_obtained >= submission.total_marks * 0.4
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                      : 'text-gray-500'
                                  }`}>
                                    {submission.marks_obtained !== null ? submission.marks_obtained : 'N/A'} / {submission.total_marks}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {formatDateTime(submission.submitted_at)}
                                </td>
                                <td className="px-4 py-3">
                                  <details className="text-sm">
                                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                      View Answer
                                    </summary>
                                    <div className="mt-2 p-3 bg-gray-50 rounded-md max-h-48 overflow-auto">
                                      <pre className="whitespace-pre-wrap text-xs">
                                        {submission.submitted_answer}
                                      </pre>
                                    </div>
                                  </details>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}