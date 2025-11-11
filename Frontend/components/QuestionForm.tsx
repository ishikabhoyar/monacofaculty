"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, X, Save } from "lucide-react";
import { getAllTags, createTestCase } from "../lib/facultyApi";
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TestCase {
  input: string;
  expected_output: string;
  is_sample: boolean;
  is_hidden: boolean;
  time_limit_seconds: number;
  memory_limit_mb: number;
}

interface QuestionFormProps {
  testId?: string;
  initialData?: any;
  onSuccess: (question: any) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

export default function QuestionForm({ 
  testId, 
  initialData, 
  onSuccess, 
  onCancel,
  mode = 'create'
}: QuestionFormProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    question_text: initialData?.question_text || '',
    question_type: initialData?.question_type || 'multiple_choice',
    options: initialData?.options || ['', '', '', ''],
    correct_answer: initialData?.correct_answer || '',
    marks: initialData?.marks || 1,
    difficulty: initialData?.difficulty || 'medium',
    programming_language: initialData?.programming_language || 'python',
    code_template: initialData?.code_template || '',
    time_limit_seconds: initialData?.time_limit_seconds || 5,
    memory_limit_mb: initialData?.memory_limit_mb || 256,
    hints: initialData?.hints || [],
    explanation: initialData?.explanation || '',
    tags: initialData?.tags || []
  });

  const [testCases, setTestCases] = useState<TestCase[]>([{
    input: '',
    expected_output: '',
    is_sample: true,
    is_hidden: false,
    time_limit_seconds: 5,
    memory_limit_mb: 256
  }]);

  const [currentHint, setCurrentHint] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await getAllTags(token);
      if (response.success) {
        setTags(response.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addHint = () => {
    if (currentHint.trim()) {
      setFormData({ ...formData, hints: [...formData.hints, currentHint.trim()] });
      setCurrentHint('');
    }
  };

  const removeHint = (index: number) => {
    const newHints = formData.hints.filter((_, i) => i !== index);
    setFormData({ ...formData, hints: newHints });
  };

  const addTestCase = () => {
    setTestCases([...testCases, {
      input: '',
      expected_output: '',
      is_sample: true,
      is_hidden: false,
      time_limit_seconds: 5,
      memory_limit_mb: 256
    }]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
    const newTestCases = [...testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setTestCases(newTestCases);
  };

  const toggleTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;

    const isSelected = formData.tags.some((t: any) => t.id === tagId);
    if (isSelected) {
      setFormData({ ...formData, tags: formData.tags.filter((t: any) => t.id !== tagId) });
    } else {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const handleSubmit = async () => {
    if (!formData.question_text.trim()) {
      setError('Question text is required');
      return;
    }

    if (formData.question_type === 'multiple_choice' && formData.options.filter(o => o.trim()).length < 2) {
      setError('Please provide at least 2 options for multiple choice questions');
      return;
    }

    if (!formData.correct_answer.trim()) {
      setError('Correct answer is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const questionPayload = {
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
        tags: formData.tags.map((tag: any) => tag.id)
      };

      onSuccess(questionPayload);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save question');
      setSubmitting(false);
    }
  };

  return (
    <Card className="dark:bg-[#070c1f] dark:border-gray-800/40">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{mode === 'edit' ? 'Edit Question' : 'Add New Question'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Question Type */}
        <div>
          <Label>Question Type</Label>
          <Select
            value={formData.question_type}
            onValueChange={(value) => setFormData({ ...formData, question_type: value })}
          >
            <SelectTrigger className="dark:bg-gray-800/50 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
              <SelectItem value="coding">Coding Question</SelectItem>
              <SelectItem value="short_answer">Short Answer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Question Text */}
        <div>
          <Label>Question Text *</Label>
          <Textarea
            value={formData.question_text}
            onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
            placeholder="Enter your question here"
            rows={4}
            className="dark:bg-gray-800/50 dark:border-gray-700"
          />
        </div>

        {/* Multiple Choice Options */}
        {formData.question_type === 'multiple_choice' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Options</Label>
              <Button type="button" onClick={addOption} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Add Option
              </Button>
            </div>
            {formData.options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="dark:bg-gray-800/50 dark:border-gray-700"
                />
                {formData.options.length > 2 && (
                  <Button
                    type="button"
                    onClick={() => removeOption(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Correct Answer */}
        <div>
          <Label>Correct Answer *</Label>
          {formData.question_type === 'multiple_choice' ? (
            <Select
              value={formData.correct_answer}
              onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
            >
              <SelectTrigger className="dark:bg-gray-800/50 dark:border-gray-700">
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                {formData.options.filter(o => o.trim()).map((option, index) => (
                  <SelectItem key={index} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Textarea
              value={formData.correct_answer}
              onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
              placeholder="Enter the correct answer"
              rows={3}
              className="dark:bg-gray-800/50 dark:border-gray-700"
            />
          )}
        </div>

        {/* Marks and Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Marks</Label>
            <Input
              type="number"
              value={formData.marks}
              onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
              min="1"
              className="dark:bg-gray-800/50 dark:border-gray-700"
            />
          </div>
          <div>
            <Label>Difficulty</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
            >
              <SelectTrigger className="dark:bg-gray-800/50 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Coding Question Specific Fields */}
        {formData.question_type === 'coding' && (
          <>
            <div>
              <Label>Programming Language</Label>
              <Select
                value={formData.programming_language}
                onValueChange={(value) => setFormData({ ...formData, programming_language: value })}
              >
                <SelectTrigger className="dark:bg-gray-800/50 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Code Template (Optional)</Label>
              <div className="border rounded dark:border-gray-700" style={{ height: '200px' }}>
                <MonacoEditor
                  height="200px"
                  language={formData.programming_language}
                  value={formData.code_template}
                  onChange={(value) => setFormData({ ...formData, code_template: value || '' })}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            {/* Hints */}
            <div className="space-y-3">
              <Label>Hints (Optional)</Label>
              {formData.hints.map((hint, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input value={hint} disabled className="dark:bg-gray-800/50 dark:border-gray-700" />
                  <Button
                    type="button"
                    onClick={() => removeHint(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={currentHint}
                  onChange={(e) => setCurrentHint(e.target.value)}
                  placeholder="Add a hint"
                  className="dark:bg-gray-800/50 dark:border-gray-700"
                  onKeyPress={(e) => e.key === 'Enter' && addHint()}
                />
                <Button type="button" onClick={addHint} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Explanation */}
            <div>
              <Label>Solution Explanation (Optional)</Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Explain the solution approach..."
                rows={4}
                className="dark:bg-gray-800/50 dark:border-gray-700"
              />
            </div>
          </>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <Label>Tags (Optional)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => {
                const isSelected = formData.tags.some((t: any) => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded text-sm transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-2'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: tag.color + '30',
                      color: tag.color,
                      borderColor: tag.color,
                      borderWidth: '1px'
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Saving...' : mode === 'edit' ? 'Update Question' : 'Add Question'}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
