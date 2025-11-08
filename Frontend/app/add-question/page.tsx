"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2, Code, FileText, HelpCircle } from "lucide-react";
import { getTests, createQuestion, getAllTags, createTestCase } from "../../lib/facultyApi";
import dynamic from 'next/dynamic';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Test {
  id: string;
  title: string;
  batch_name: string;
}

interface Tag {
  id: string;
  name: string;
  description: string;
  color: string;
}

export default function AddQuestionPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [questionData, setQuestionData] = useState({
    testId: "",
    question_text: "",
    options: ["", "", "", ""],
    correct_answer: "",
    marks: 1,
    questionType: "multiple_choice",
    difficulty: "easy",
    programmingLanguage: "",
    codeTemplate: "",
    timeLimitSeconds: 1,
    memoryLimitMb: 256,
    hints: [] as string[],
    explanation: "",
    tags: [] as string[],
    testCases: [] as { input: string; expectedOutput: string; isHidden: boolean }[]
  });

  useEffect(() => {
    fetchTestsAndTags();
  }, []);

  const fetchTestsAndTags = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const [testsResponse, tagsResponse] = await Promise.all([
        getTests(token),
        getAllTags(token)
      ]);

      if (testsResponse.success) {
        setTests(testsResponse.tests);
      }
      if (tagsResponse.success) {
        setTags(tagsResponse.tags);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuestionData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...questionData.options];
    newOptions[index] = value;
    setQuestionData((prev) => ({ ...prev, options: newOptions }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setQuestionData((prev) => ({ ...prev, [name]: value }));
  };

  const addOption = () => {
    if (questionData.options.length < 6) {
      setQuestionData((prev) => ({
        ...prev,
        options: [...prev.options, ""]
      }));
    }
  };

  const removeOption = (index: number) => {
    if (questionData.options.length > 2) {
      const newOptions = questionData.options.filter((_, i) => i !== index);
      setQuestionData((prev) => ({
        ...prev,
        options: newOptions,
        correct_answer: prev.correct_answer === questionData.options[index] ? "" : prev.correct_answer
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!questionData.testId || !questionData.question_text.trim()) {
      alert("Please select a test and enter the question text");
      return;
    }

    if (questionData.questionType === 'multiple_choice') {
      const validOptions = questionData.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        alert("Please provide at least 2 options");
        return;
      }

      if (!questionData.correct_answer || !validOptions.includes(questionData.correct_answer)) {
        alert("Please select a valid correct answer from the options");
        return;
      }
    }

    if (questionData.questionType === 'coding') {
      if (!questionData.programmingLanguage) {
        alert("Please select a programming language for coding questions");
        return;
      }
      if (questionData.testCases.length === 0) {
        alert("Please add at least one test case for coding questions");
        return;
      }
      const validTestCases = questionData.testCases.filter(tc => tc.input.trim() && tc.expectedOutput.trim());
      if (validTestCases.length === 0) {
        alert("Please provide valid input and expected output for at least one test case");
        return;
      }
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const submitData = {
        testId: questionData.testId,
        questionText: questionData.question_text,
        marks: questionData.marks,
        questionType: questionData.questionType,
        difficulty: questionData.difficulty,
        tags: questionData.tags,
        ...questionData.questionType === 'multiple_choice' && {
          options: questionData.options.filter(opt => opt.trim() !== ''),
          correctAnswer: questionData.correct_answer
        },
        ...questionData.questionType === 'coding' && {
          programmingLanguage: questionData.programmingLanguage,
          codeTemplate: questionData.codeTemplate,
          timeLimitSeconds: questionData.timeLimitSeconds,
          memoryLimitMb: questionData.memoryLimitMb,
          hints: questionData.hints.filter(h => h.trim() !== ''),
          explanation: questionData.explanation
        }
      };

      const response = await createQuestion(submitData, token);

      if (response.success) {
        // If it's a coding question with test cases, create them now
        if (questionData.questionType === 'coding' && questionData.testCases.length > 0) {
          const validTestCases = questionData.testCases.filter(tc => tc.input.trim() && tc.expectedOutput.trim());
          for (const testCase of validTestCases) {
            try {
              await createTestCase(response.question.id, {
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                isHidden: testCase.isHidden,
                timeLimitSeconds: questionData.timeLimitSeconds,
                memoryLimitMb: questionData.memoryLimitMb
              }, token);
            } catch (testCaseError) {
              console.error('Error creating test case:', testCaseError);
              // Continue with other test cases even if one fails
            }
          }
        }

        alert("Question added successfully!");
        router.push(`/tests/${questionData.testId}/questions`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to add question");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-gray-900 dark:to-black p-4 pb-10">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <ThemeToggle />
        </div>

        <Card className="w-full shadow-md dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="border-b dark:border-gray-800">
            <CardTitle>Add New Question</CardTitle>
            <CardDescription>Create a multiple-choice or coding question for your test.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 dark:bg-gray-900">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Test Selection */}
              <div className="grid gap-3">
                <Label htmlFor="testId">Select Test <span className="text-red-500">*</span></Label>
                <Select
                  name="testId"
                  value={questionData.testId}
                  onValueChange={(value) => handleSelectChange("testId", value)}
                  required
                >
                  <SelectTrigger id="testId" className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue placeholder="Choose a test to add the question to">
                      {questionData.testId && tests.find(t => t.id === questionData.testId) ? 
                        `${tests.find(t => t.id === questionData.testId)?.title} - ${tests.find(t => t.id === questionData.testId)?.batch_name}` : 
                        "Choose a test to add the question to"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {tests.map((test) => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.title} - {test.batch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Type Selection */}
              <div className="grid gap-3">
                <Label htmlFor="questionType">Question Type <span className="text-red-500">*</span></Label>
                <Select
                  name="questionType"
                  value={questionData.questionType}
                  onValueChange={(value) => handleSelectChange("questionType", value)}
                >
                  <SelectTrigger id="questionType" className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Multiple Choice
                      </div>
                    </SelectItem>
                    <SelectItem value="coding">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Coding Problem
                      </div>
                    </SelectItem>
                    <SelectItem value="short_answer">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Short Answer
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Level */}
              <div className="grid gap-3">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  name="difficulty"
                  value={questionData.difficulty}
                  onValueChange={(value) => handleSelectChange("difficulty", value)}
                >
                  <SelectTrigger id="difficulty" className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question Text */}
              <div className="grid gap-3">
                <Label htmlFor="question_text">Question Text <span className="text-red-500">*</span></Label>
                <Textarea
                  id="question_text"
                  name="question_text"
                  value={questionData.question_text}
                  onChange={handleChange}
                  className="min-h-[100px] dark:bg-gray-800 dark:border-gray-700"
                  placeholder={questionData.questionType === 'coding' ? "Describe the coding problem in detail..." : "Enter your question here..."}
                  required
                />
                <p className="text-sm text-gray-500">Supports Markdown formatting</p>
              </div>

              {/* Tags Selection */}
              <div className="grid gap-3">
                <Label>Tags (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm cursor-pointer border ${
                        questionData.tags.includes(tag.id)
                          ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200'
                          : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                      }`}
                      onClick={() => {
                        const newTags = questionData.tags.includes(tag.id)
                          ? questionData.tags.filter(t => t !== tag.id)
                          : [...questionData.tags, tag.id];
                        setQuestionData(prev => ({ ...prev, tags: newTags }));
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Type Specific Fields */}
              {questionData.questionType === 'multiple_choice' && (
                <>
                  {/* Options */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Answer Options <span className="text-red-500">*</span></Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        disabled={questionData.options.length >= 6}
                        className="dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Option
                      </Button>
                    </div>

                    {questionData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-8 text-sm font-medium text-gray-600 dark:text-gray-400">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          className="flex-1 dark:bg-gray-800 dark:border-gray-700"
                        />
                        {questionData.options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(index)}
                            className="dark:border-gray-700 dark:hover:bg-gray-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Correct Answer */}
                  <div className="grid gap-3">
                    <Label htmlFor="correct_answer">Correct Answer <span className="text-red-500">*</span></Label>
                    <Select
                      name="correct_answer"
                      value={questionData.correct_answer}
                      onValueChange={(value) => handleSelectChange("correct_answer", value)}
                      required
                    >
                      <SelectTrigger id="correct_answer" className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue placeholder="Select the correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {questionData.options.map((option, index) => (
                          option.trim() && (
                            <SelectItem key={index} value={option}>
                              {String.fromCharCode(65 + index)}. {option}
                            </SelectItem>
                          )
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {questionData.questionType === 'coding' && (
                <Tabs defaultValue="code" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="code">Code Template</TabsTrigger>
                    <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
                    <TabsTrigger value="constraints">Constraints</TabsTrigger>
                    <TabsTrigger value="hints">Hints & Solution</TabsTrigger>
                  </TabsList>

                  <TabsContent value="code" className="space-y-4">
                    {/* Programming Language */}
                    <div className="grid gap-3">
                      <Label htmlFor="programmingLanguage">Programming Language <span className="text-red-500">*</span></Label>
                      <Select
                        name="programmingLanguage"
                        value={questionData.programmingLanguage}
                        onValueChange={(value) => handleSelectChange("programmingLanguage", value)}
                      >
                        <SelectTrigger id="programmingLanguage" className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectValue placeholder="Select programming language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="cpp">C++</SelectItem>
                          <SelectItem value="c">C</SelectItem>
                          <SelectItem value="csharp">C#</SelectItem>
                          <SelectItem value="go">Go</SelectItem>
                          <SelectItem value="rust">Rust</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Code Template */}
                    <div className="grid gap-3">
                      <Label htmlFor="codeTemplate">Starter Code Template (Optional)</Label>
                      <div className="border rounded-md dark:border-gray-700">
                        <MonacoEditor
                          height="300px"
                          language={questionData.programmingLanguage || 'python'}
                          value={questionData.codeTemplate}
                          onChange={(value) => setQuestionData(prev => ({ ...prev, codeTemplate: value || '' }))}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            roundedSelection: false,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                          }}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="test-cases" className="space-y-4">
                    {/* Test Cases */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Test Cases <span className="text-red-500">*</span></Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuestionData(prev => ({
                            ...prev,
                            testCases: [...prev.testCases, { input: '', expectedOutput: '', isHidden: false }]
                          }))}
                          className="dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Test Case
                        </Button>
                      </div>

                      {questionData.testCases.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No test cases added yet. Add at least one test case for the coding problem.
                        </p>
                      )}

                      {questionData.testCases.map((testCase, index) => (
                        <Card key={index} className="dark:bg-gray-800 dark:border-gray-700">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-sm">Test Case {index + 1}</CardTitle>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`hidden-${index}`}
                                    checked={testCase.isHidden}
                                    onCheckedChange={(checked) => {
                                      const newTestCases = [...questionData.testCases];
                                      newTestCases[index].isHidden = checked as boolean;
                                      setQuestionData(prev => ({ ...prev, testCases: newTestCases }));
                                    }}
                                  />
                                  <Label htmlFor={`hidden-${index}`} className="text-xs">Hidden</Label>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newTestCases = questionData.testCases.filter((_, i) => i !== index);
                                    setQuestionData(prev => ({ ...prev, testCases: newTestCases }));
                                  }}
                                  className="dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid gap-3">
                              <Label htmlFor={`input-${index}`}>Input</Label>
                              <Textarea
                                id={`input-${index}`}
                                value={testCase.input}
                                onChange={(e) => {
                                  const newTestCases = [...questionData.testCases];
                                  newTestCases[index].input = e.target.value;
                                  setQuestionData(prev => ({ ...prev, testCases: newTestCases }));
                                }}
                                className="min-h-[80px] font-mono text-sm dark:bg-gray-900 dark:border-gray-600"
                                placeholder="Enter test input..."
                              />
                            </div>
                            <div className="grid gap-3">
                              <Label htmlFor={`output-${index}`}>Expected Output</Label>
                              <Textarea
                                id={`output-${index}`}
                                value={testCase.expectedOutput}
                                onChange={(e) => {
                                  const newTestCases = [...questionData.testCases];
                                  newTestCases[index].expectedOutput = e.target.value;
                                  setQuestionData(prev => ({ ...prev, testCases: newTestCases }));
                                }}
                                className="min-h-[80px] font-mono text-sm dark:bg-gray-900 dark:border-gray-600"
                                placeholder="Enter expected output..."
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="constraints" className="space-y-4">
                    {/* Time and Memory Limits */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-3">
                        <Label htmlFor="timeLimitSeconds">Time Limit (seconds)</Label>
                        <Input
                          id="timeLimitSeconds"
                          name="timeLimitSeconds"
                          type="number"
                          value={questionData.timeLimitSeconds}
                          onChange={handleChange}
                          className="dark:bg-gray-800 dark:border-gray-700"
                          min="1"
                          max="300"
                        />
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="memoryLimitMb">Memory Limit (MB)</Label>
                        <Input
                          id="memoryLimitMb"
                          name="memoryLimitMb"
                          type="number"
                          value={questionData.memoryLimitMb}
                          onChange={handleChange}
                          className="dark:bg-gray-800 dark:border-gray-700"
                          min="1"
                          max="1024"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="hints" className="space-y-4">
                    {/* Hints */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Hints (Optional)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuestionData(prev => ({ ...prev, hints: [...prev.hints, ''] }))}
                          className="dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Hint
                        </Button>
                      </div>
                      {questionData.hints.map((hint, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Hint {index + 1}:
                          </span>
                          <Input
                            value={hint}
                            onChange={(e) => {
                              const newHints = [...questionData.hints];
                              newHints[index] = e.target.value;
                              setQuestionData(prev => ({ ...prev, hints: newHints }));
                            }}
                            placeholder="Enter a hint..."
                            className="flex-1 dark:bg-gray-800 dark:border-gray-700"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newHints = questionData.hints.filter((_, i) => i !== index);
                              setQuestionData(prev => ({ ...prev, hints: newHints }));
                            }}
                            className="dark:border-gray-700 dark:hover:bg-gray-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Solution Explanation */}
                    <div className="grid gap-3">
                      <Label htmlFor="explanation">Solution Explanation (Optional)</Label>
                      <Textarea
                        id="explanation"
                        name="explanation"
                        value={questionData.explanation}
                        onChange={handleChange}
                        className="min-h-[100px] dark:bg-gray-800 dark:border-gray-700"
                        placeholder="Explain the solution approach..."
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {/* Marks */}
              <div className="grid gap-3">
                <Label htmlFor="marks">Marks</Label>
                <Input
                  id="marks"
                  name="marks"
                  type="number"
                  value={questionData.marks}
                  onChange={handleChange}
                  className="w-24 dark:bg-gray-800 dark:border-gray-700"
                  min="1"
                  max="100"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="dark:bg-blue-900 dark:hover:bg-blue-800"
                >
                  {submitting ? "Adding..." : "Add Question"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-start border-t pt-6 dark:border-gray-800 dark:bg-gray-900">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/")}
              className="dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}