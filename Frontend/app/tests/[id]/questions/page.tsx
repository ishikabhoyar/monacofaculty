"use client";

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQuestionsForTest, createQuestion, updateQuestion, deleteQuestion, bulkCreateQuestions, getTestCasesForQuestion, createTestCase, updateTestCase, deleteTestCase, getAllQuestions, copyQuestion } from '../../../../lib/facultyApi';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Code, FileText, HelpCircle, Tag, Clock, MemoryStick, Library, Copy } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
  question_type: string;
  difficulty: string;
  programming_language?: string;
  code_template?: string;
  time_limit_seconds?: number;
  memory_limit_mb?: number;
  hints?: string[];
  explanation?: string;
  tags?: Array<{ id: string; name: string; color: string; }>;
  test_title?: string;
  course_id?: string;
}

export default function QuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [loadingQuestionBank, setLoadingQuestionBank] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    marks: 1,
    difficulty: 'medium',
    programming_language: 'python',
    code_template: '',
    time_limit_seconds: 5,
    memory_limit_mb: 256,
    hints: [] as string[],
    explanation: '',
    tags: [] as Array<{ id: string; name: string; color: string; }>
  });

  useEffect(() => {
    fetchQuestions();
  }, [testId]);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await getQuestionsForTest(testId, token);
      if (response.success) {
        setQuestions(response.questions);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      marks: 1,
      difficulty: 'medium',
      programming_language: 'python',
      code_template: '',
      time_limit_seconds: 5,
      memory_limit_mb: 256,
      hints: [],
      explanation: '',
      tags: []
    });
  };

  const fetchQuestionBank = async () => {
    setLoadingQuestionBank(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await getAllQuestions(token);
      if (response.success) {
        // Filter out questions already in current test
        const currentQuestionIds = questions.map(q => q.id);
        const availableQuestions = response.questions.filter(
          (q: Question) => !currentQuestionIds.includes(q.id)
        );
        setQuestionBank(availableQuestions);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch question bank');
    } finally {
      setLoadingQuestionBank(false);
    }
  };

  const handleCopyQuestion = async (questionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await copyQuestion(questionId, testId, token);
      if (response.success) {
        setQuestions([...questions, response.question]);
        setError('');
        // Remove the copied question from question bank
        setQuestionBank(questionBank.filter(q => q.id !== questionId));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to copy question');
    }
  };

  const filteredQuestionBank = questionBank.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (q.test_title && q.test_title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || q.question_type === filterType;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesType && matchesDifficulty;
  });


  const handleAddQuestion = async () => {
    if (!formData.question_text.trim() || !formData.correct_answer.trim()) {
      setError('Question text and correct answer are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Transform field names from snake_case to camelCase for backend
      const response = await createQuestion({
        testId,
        questionText: formData.question_text,
        questionType: formData.question_type,
        options: formData.options.filter(opt => opt.trim() !== ''),
        correctAnswer: formData.correct_answer,
        marks: formData.marks,
        difficulty: formData.difficulty,
        programmingLanguage: formData.programming_language,
        codeTemplate: formData.code_template,
        timeLimitSeconds: formData.time_limit_seconds,
        memoryLimitMb: formData.memory_limit_mb,
        hints: formData.hints,
        explanation: formData.explanation,
        tags: formData.tags.map(tag => tag.id)
      }, token);

      if (response.success) {
        setQuestions([...questions, response.question]);
        setShowAddForm(false);
        resetForm();
        setError('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add question');
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question.id);
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type || 'multiple_choice',
      options: question.options ? [...question.options, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      correct_answer: question.correct_answer || '',
      marks: question.marks,
      difficulty: question.difficulty || 'medium',
      programming_language: question.programming_language || 'python',
      code_template: question.code_template || '',
      time_limit_seconds: question.time_limit_seconds || 5,
      memory_limit_mb: question.memory_limit_mb || 256,
      hints: question.hints || [],
      explanation: question.explanation || '',
      tags: question.tags || []
    });
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Transform field names from snake_case to camelCase for backend
      const response = await updateQuestion(editingQuestion, {
        questionText: formData.question_text,
        questionType: formData.question_type,
        options: formData.options.filter(opt => opt.trim() !== ''),
        correctAnswer: formData.correct_answer,
        marks: formData.marks,
        difficulty: formData.difficulty,
        programmingLanguage: formData.programming_language,
        codeTemplate: formData.code_template,
        timeLimitSeconds: formData.time_limit_seconds,
        memoryLimitMb: formData.memory_limit_mb,
        hints: formData.hints,
        explanation: formData.explanation,
        tags: formData.tags.map(tag => tag.id)
      }, token);

      if (response.success) {
        setQuestions(questions.map(q =>
          q.id === editingQuestion ? response.question : q
        ));
        setEditingQuestion(null);
        resetForm();
        setError('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await deleteQuestion(questionId, token);
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleCancel = () => {
    setEditingQuestion(null);
    setShowAddForm(false);
    resetForm();
    setError('');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Test
        </button>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Questions</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowQuestionBank(true);
                fetchQuestionBank();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <Library className="h-5 w-5 mr-2" /> Browse Question Bank
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" /> Add Question
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingQuestion) && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingQuestion ? 'Edit Question' : 'Add New Question'}
          </h2>

          <div className="space-y-4">
            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Question Type</label>
              <select
                value={formData.question_type}
                onChange={(e) => setFormData({...formData, question_type: e.target.value})}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="coding">Coding Question</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Question Text</label>
              <textarea
                value={formData.question_text}
                onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                placeholder="Enter your question here... (Markdown supported)"
              />
            </div>

            {/* MCQ Options - Only show for multiple_choice */}
            {formData.question_type === 'multiple_choice' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Options</label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <span className="w-8 text-sm text-gray-500">{String.fromCharCode(65 + index)}.</span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index] = e.target.value;
                          setFormData({...formData, options: newOptions});
                        }}
                        className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Correct Answer</label>
                  <select
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({...formData, correct_answer: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select correct answer</option>
                    {formData.options.map((option, index) => (
                      option.trim() && (
                        <option key={index} value={option}>
                          {String.fromCharCode(65 + index)}. {option}
                        </option>
                      )
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Coding Question Fields */}
            {formData.question_type === 'coding' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Programming Language</label>
                    <select
                      value={formData.programming_language}
                      onChange={(e) => setFormData({...formData, programming_language: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Code Template (Starter Code)</label>
                  <textarea
                    value={formData.code_template}
                    onChange={(e) => setFormData({...formData, code_template: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={6}
                    placeholder="def solution():\n    # Your code here\n    pass"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Time Limit (seconds)</label>
                    <input
                      type="number"
                      value={formData.time_limit_seconds}
                      onChange={(e) => setFormData({...formData, time_limit_seconds: parseInt(e.target.value) || 5})}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Memory Limit (MB)</label>
                    <input
                      type="number"
                      value={formData.memory_limit_mb}
                      onChange={(e) => setFormData({...formData, memory_limit_mb: parseInt(e.target.value) || 256})}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="128"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Explanation (Optional)</label>
                  <textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Explain the solution approach... (Markdown supported)"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Marks</label>
                <input
                  type="number"
                  value={formData.marks}
                  onChange={(e) => setFormData({...formData, marks: parseInt(e.target.value) || 1})}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              {formData.question_type === 'multiple_choice' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingQuestion ? 'Update' : 'Add'} Question
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center"
              >
                <X className="h-4 w-4 mr-2" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No questions added yet.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Add your first question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  {/* Question Header */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      {question.question_type === 'coding' && <Code className="h-5 w-5 text-blue-600" />}
                      {question.question_type === 'multiple_choice' && <FileText className="h-5 w-5 text-green-600" />}
                      {question.question_type === 'short_answer' && <HelpCircle className="h-5 w-5 text-orange-600" />}
                      <h3 className="text-lg font-semibold">Q{index + 1}:</h3>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">({question.marks} marks)</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {question.difficulty}
                    </span>
                    {question.tags && question.tags.length > 0 && (
                      <div className="flex gap-1">
                        {question.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                            style={{ backgroundColor: tag.color + '20', color: tag.color }}
                          >
                            <Tag className="h-3 w-3" />
                            {tag.name}
                          </span>
                        ))}
                        {question.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{question.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Question Text with Markdown */}
                  <div className="text-gray-800 dark:text-gray-200 mb-4 prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      components={{
                        code({ node, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match && !className?.includes('\n');
                          return !isInline && match ? (
                            <SyntaxHighlighter
                              style={oneDark as any}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-md"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {question.question_text}
                    </ReactMarkdown>
                  </div>

                  {/* Coding Question Specific Info */}
                  {question.question_type === 'coding' && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {question.programming_language && (
                          <span className="flex items-center gap-1">
                            <Code className="h-4 w-4" />
                            {question.programming_language}
                          </span>
                        )}
                        {question.time_limit_seconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {question.time_limit_seconds}s
                          </span>
                        )}
                        {question.memory_limit_mb && (
                          <span className="flex items-center gap-1">
                            <MemoryStick className="h-4 w-4" />
                            {question.memory_limit_mb}MB
                          </span>
                        )}
                      </div>
                      {question.code_template && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-2">Starter Code:</h4>
                          <SyntaxHighlighter
                            style={oneDark}
                            language={question.programming_language || 'python'}
                            className="text-sm"
                          >
                            {question.code_template}
                          </SyntaxHighlighter>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Multiple Choice Options */}
                  {question.question_type === 'multiple_choice' && question.options && (
                    <div className="space-y-1 mb-4">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center">
                          <span className="w-6 text-sm text-gray-500 dark:text-gray-400">{String.fromCharCode(65 + optIndex)}.</span>
                          <span className={`text-sm ${option === question.correct_answer ? 'text-green-600 font-semibold dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {option}
                            {option === question.correct_answer && <span className="ml-2 text-xs">(Correct Answer)</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hints and Explanation for Coding Questions */}
                  {question.question_type === 'coding' && (question.hints?.length || question.explanation) && (
                    <div className="space-y-3">
                      {question.hints && question.hints.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Hints:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {question.hints.map((hint, hintIndex) => (
                              <li key={hintIndex}>{hint}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {question.explanation && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Solution Explanation:</h4>
                          <div className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>{question.explanation}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditQuestion(question)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md flex items-center text-sm"
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md flex items-center text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {questions.length > 0 && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <div className="text-center text-gray-600">
            Total Questions: {questions.length} | Total Marks: {questions.reduce((sum, q) => sum + q.marks, 0)}
          </div>
        </div>
      )}

      {/* Question Bank Modal */}
      {showQuestionBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">Browse Question Bank</h2>
              <button
                onClick={() => setShowQuestionBank(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-6 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search questions or test titles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Question Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="coding">Coding</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Question List */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 240px)' }}>
              {loadingQuestionBank ? (
                <div className="text-center py-8">Loading question bank...</div>
              ) : filteredQuestionBank.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {questionBank.length === 0 ? 'No questions available in your question bank yet.' : 'No questions match your filters.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuestionBank.map((question) => (
                    <div key={question.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {question.question_type === 'coding' ? (
                              <Code className="h-4 w-4 text-blue-600" />
                            ) : question.question_type === 'short_answer' ? (
                              <HelpCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <FileText className="h-4 w-4 text-purple-600" />
                            )}
                            <span className="text-xs font-semibold text-gray-500 uppercase">
                              {question.question_type.replace('_', ' ')}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              question.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {question.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">
                              {question.marks} marks
                            </span>
                            {question.test_title && (
                              <span className="text-xs text-gray-400 italic">
                                from: {question.test_title}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-800 mb-2">
                            {question.question_text.length > 200 
                              ? question.question_text.substring(0, 200) + '...' 
                              : question.question_text}
                          </div>
                          {question.tags && question.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {question.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="text-xs px-2 py-1 rounded"
                                  style={{ 
                                    backgroundColor: tag.color + '20', 
                                    color: tag.color 
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopyQuestion(question.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center text-sm whitespace-nowrap"
                        >
                          <Copy className="h-4 w-4 mr-1" /> Copy to Test
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}