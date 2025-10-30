"use client";

import React, { useState, useEffect } from 'react'
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  PlusCircle, 
  FileText, 
  Settings, 
  Users, 
  Calendar, 
  BookOpen, 
  ArrowRight, 
  ChevronLeft, 
  GraduationCap, 
  TrendingUp, 
  Clock, 
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Code,
  HelpCircle
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import BatchesTab from "@/components/BatchesTab";
import TestsTab from "@/components/TestsTab";
import SubmissionCodeViewer from "@/components/SubmissionCodeViewer";
import { getApiUrl } from "@/lib/utils";
import { getSubmissions } from "@/lib/facultyApi";

// Academic data structure
const academicData = {
  years: [
    {
      id: "first",
      name: "First Year",
      semesters: [
        {
          id: "sem1",
          name: "Semester I",
          batches: [
            { id: "A1", name: "Batch A1", students: 45, courses: ["MATH101", "PHYS101", "CHEM101"] },
            { id: "A2", name: "Batch A2", students: 42, courses: ["MATH101", "PHYS101", "CHEM101"] },
            { id: "A3", name: "Batch A3", students: 48, courses: ["MATH101", "PHYS101", "CHEM101"] },
          ]
        },
        {
          id: "sem2",
          name: "Semester II",
          batches: [
            { id: "B1", name: "Batch B1", students: 44, courses: ["MATH102", "PHYS102", "PROG101"] },
            { id: "B2", name: "Batch B2", students: 46, courses: ["MATH102", "PHYS102", "PROG101"] },
            { id: "B3", name: "Batch B3", students: 41, courses: ["MATH102", "PHYS102", "PROG101"] },
          ]
        }
      ]
    },
    {
      id: "second",
      name: "Second Year",
      semesters: [
        {
          id: "sem3",
          name: "Semester III",
          batches: [
            { id: "C1", name: "Batch C1", students: 38, courses: ["DS201", "ALGO201", "DB201"] },
            { id: "C2", name: "Batch C2", students: 40, courses: ["DS201", "ALGO201", "DB201"] },
            { id: "C3", name: "Batch C3", students: 39, courses: ["DS201", "ALGO201", "DB201"] },
          ]
        },
        {
          id: "sem4",
          name: "Semester IV",
          batches: [
            { id: "D1", name: "Batch D1", students: 37, courses: ["WEB201", "MOBILE201", "AI201"] },
            { id: "D2", name: "Batch D2", students: 41, courses: ["WEB201", "MOBILE201", "AI201"] },
            { id: "D3", name: "Batch D3", students: 36, courses: ["WEB201", "MOBILE201", "AI201"] },
          ]
        }
      ]
    }
  ]
};

const recentSubmissions = [
  { id: "S001", student: "Alice Johnson", test: "Calculus I Midterm", time: "2 hours ago", score: "85/100" },
  { id: "S002", student: "Bob Smith", test: "Physics II Final", time: "5 hours ago", score: "92/100" },
  { id: "S003", student: "Carol Davis", test: "Chemistry Lab Quiz", time: "1 day ago", score: "78/100" },
  { id: "S004", student: "David Wilson", test: "Algebra Basics", time: "1 day ago", score: "65/100" },
];

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [batches, setBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [testsError, setTestsError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [selectedTestForSubmissions, setSelectedTestForSubmissions] = useState<string | null>(null);
  const router = useRouter();

  // Fetch batches from backend
  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      setBatchError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${getApiUrl()}/api/batches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBatches(data.batches || []);
      } else {
        setBatchError(data.message || 'Failed to fetch batches');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setBatchError('Network error. Please try again.');
    } finally {
      setLoadingBatches(false);
    }
  };

  // Fetch tests from backend
  const fetchTests = async () => {
    try {
      setLoadingTests(true);
      setTestsError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${getApiUrl()}/api/tests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTests(data.tests || []);
      } else {
        setTestsError(data.message || 'Failed to fetch tests');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      setTestsError('Network error. Please try again.');
    } finally {
      setLoadingTests(false);
    }
  };

  // Fetch questions from backend
  const fetchQuestions = async () => {
    try {
      setLoadingQuestions(true);
      setQuestionsError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // For now, we'll fetch questions from all tests. In a real implementation,
      // you might want to create a dedicated endpoint for all questions
      const allQuestions: any[] = [];
      
      // Get all tests first to fetch questions from each
      const testsResponse = await fetch(`${getApiUrl()}/api/tests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const testsData = await testsResponse.json();
      
      if (testsResponse.ok && testsData.success) {
        // Fetch questions for each test
        for (const test of testsData.tests || []) {
          try {
            const questionsResponse = await fetch(`${getApiUrl()}/api/questions/test/${test.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            const questionsData = await questionsResponse.json();
            
            if (questionsResponse.ok && questionsData.success) {
              // Add test info to each question
              const questionsWithTest = (questionsData.questions || []).map((q: any) => ({
                ...q,
                test_title: test.title,
                test_batch_name: test.batch_name
              }));
              allQuestions.push(...questionsWithTest);
            }
          } catch (questionError) {
            console.error(`Error fetching questions for test ${test.id}:`, questionError);
          }
        }
      }

      setQuestions(allQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestionsError('Network error. Please try again.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchTests();
    fetchQuestions();
  }, []);

  // Fetch submissions
  const fetchSubmissions = async (testId?: string) => {
    try {
      setLoadingSubmissions(true);
      setSubmissionsError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await getSubmissions(token, testId);
      
      if (response.success) {
        setSubmissions(response.submissions || []);
      } else {
        setSubmissionsError('Failed to load submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissionsError('Network error. Please try again.');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Handle test selection for submissions
  const handleTestSelectForSubmissions = async (testId: string | null) => {
    setSelectedTestForSubmissions(testId);
    if (testId) {
      await fetchSubmissions(testId);
    } else {
      setSubmissions([]);
    }
  };

  // Reset selected test when switching tabs
  useEffect(() => {
    if (activeTab !== 'submissions') {
      setSelectedTestForSubmissions(null);
      setSubmissions([]);
    }
  }, [activeTab]);

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const viewSubmissionDetails = (submission: any) => {
    setSelectedSubmission(submission);
    setIsSubmissionDialogOpen(true);
  };

  const handleGradeSubmission = async (submissionId: string, marks: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${getApiUrl()}/api/faculty/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ marks }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update marks';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Grading successful:', result);

      // Update the submission in the local state
      setSubmissions(prev => 
        prev.map(sub => 
          sub.submission_id === submissionId 
            ? { ...sub, marks_obtained: marks }
            : sub
        )
      );

      // Update selected submission if it's the one being graded
      if (selectedSubmission?.submission_id === submissionId) {
        setSelectedSubmission({ ...selectedSubmission, marks_obtained: marks });
      }
    } catch (error) {
      console.error('Error grading submission:', error);
      throw error;
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-neutral-50 via-stone-50 to-zinc-50 dark:from-[#0a0a0a] dark:via-[#0c0c0c] dark:to-[#0e0e0e] pb-8">
      {/* Sidebar */}
      <div className="hidden w-72 flex-col bg-white/60 backdrop-blur-2xl dark:bg-black/40 border-r border-neutral-200/50 dark:border-white/[0.08] p-6 md:flex">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2.5 bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300 rounded-2xl">
            <GraduationCap className="h-6 w-6 text-white dark:text-black" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Faculty Portal
            </h2>
          </div>
        </div>
        
        <nav className="space-y-1.5">
          <Button 
            variant={activeTab === "overview" ? "default" : "ghost"} 
            className={`w-full justify-start h-11 text-left font-medium transition-all duration-300 ${
              activeTab === "overview" 
                ? "bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100" 
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/50 dark:hover:bg-white/5"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 className="h-4 w-4 mr-3" />
            Overview
          </Button>

          <Button 
            variant={activeTab === "batches" ? "default" : "ghost"} 
            className={`w-full justify-start h-11 text-left font-medium transition-all duration-300 ${
              activeTab === "batches" 
                ? "bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100" 
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/50 dark:hover:bg-white/5"
            }`}
            onClick={() => setActiveTab("batches")}
          >
            <Users className="h-4 w-4 mr-3" />
            Manage Batches
          </Button>

          <Button 
            variant={activeTab === "tests" ? "default" : "ghost"} 
            className={`w-full justify-start h-11 text-left font-medium transition-all duration-300 ${
              activeTab === "tests" 
                ? "bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100" 
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/50 dark:hover:bg-white/5"
            }`}
            onClick={() => setActiveTab("tests")}
          >
            <FileText className="h-4 w-4 mr-3" />
            Manage Tests
          </Button>
          
          <Button 
            variant={activeTab === "questions" ? "default" : "ghost"} 
            className={`w-full justify-start h-11 text-left font-medium transition-all duration-300 ${
              activeTab === "questions" 
                ? "bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100" 
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/50 dark:hover:bg-white/5"
            }`}
            onClick={() => setActiveTab("questions")}
          >
            <HelpCircle className="h-4 w-4 mr-3" />
            Questions Bank
          </Button>
          
          <Button 
            variant={activeTab === "submissions" ? "default" : "ghost"} 
            className={`w-full justify-start h-11 text-left font-medium transition-all duration-300 ${
              activeTab === "submissions" 
                ? "bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100" 
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/50 dark:hover:bg-white/5"
            }`}
            onClick={() => setActiveTab("submissions")}
          >
            <TrendingUp className="h-4 w-4 mr-3" />
            Submissions
          </Button>
        </nav>

        <div className="mt-auto pt-6 border-t border-neutral-200/50 dark:border-white/[0.08]">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10 text-left font-normal text-sm text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/50 dark:hover:bg-white/5 transition-all duration-300" 
            onClick={() => router.push("/logout")}
          >
            <Settings className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
              Dashboard
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <ThemeToggle />
            <Button 
              size="sm" 
              onClick={() => router.push("/create-batch")}
              className="bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all duration-300"
            >
              <Users className="mr-2 h-4 w-4" />
              New Batch
            </Button>
            <Button 
              size="sm" 
              onClick={() => router.push("/create-test")}
              className="bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all duration-300"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Test
            </Button>
          </div>
        </header>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* <TabsList className="grid w-full grid-cols-5 md:w-auto md:grid-cols-5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Overview</TabsTrigger>
            <TabsTrigger value="batches" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Batches</TabsTrigger>
            <TabsTrigger value="tests" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Tests</TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Questions</TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Submissions</TabsTrigger>
          </TabsList> */}
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-neutral-200/50 dark:border-white/[0.08] hover:bg-white/80 dark:hover:bg-white/[0.07] transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Batches</p>
                      <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{batches.length}</p>
                    </div>
                    <Users className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-neutral-200/50 dark:border-white/[0.08] hover:bg-white/80 dark:hover:bg-white/[0.07] transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Total Tests</p>
                      <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{tests.length}</p>
                    </div>
                    <FileText className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-neutral-200/50 dark:border-white/[0.08] hover:bg-white/80 dark:hover:bg-white/[0.07] transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Questions</p>
                      <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{questions.length}</p>
                    </div>
                    <HelpCircle className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Batches */}
            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-neutral-200/50 dark:border-white/[0.08]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recent Batches</CardTitle>
                    <CardDescription className="text-neutral-500 dark:text-neutral-400 text-sm">Your active student batches</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab("batches")}
                    className="text-neutral-600 dark:text-neutral-400"
                  >
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingBatches ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : batchError ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 dark:text-red-400">{batchError}</p>
                    <Button onClick={fetchBatches} className="mt-4">
                      Try Again
                    </Button>
                  </div>
                ) : batches.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto w-20 h-20 bg-neutral-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                      <Users className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">No batches found</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-md mx-auto">
                      You haven't created any batches yet. Create your first batch to get started.
                    </p>
                    <Button 
                      onClick={() => router.push("/create-batch")}
                      className="bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Batch
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {batches.slice(0, 5).map((batch, index) => (
                      <div 
                        key={batch.id} 
                        className="flex items-center justify-between p-4 rounded-xl bg-white/40 dark:bg-white/[0.03] border border-neutral-200/50 dark:border-white/[0.08] hover:bg-white/60 dark:hover:bg-white/[0.05] cursor-pointer transition-all duration-200"
                        onClick={() => router.push(`/batches/${batch.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-neutral-100 dark:bg-white/10 rounded-xl flex items-center justify-center">
                            <Users className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                          </div>
                          <div>
                            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                              {batch.batch_name}
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {batch.academic_year} • Semester {batch.semester}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {batch.students?.length || 0} students
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {new Date(batch.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-neutral-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Tests */}
            <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-neutral-200/50 dark:border-white/[0.08]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Active Tests</CardTitle>
                    <CardDescription className="text-neutral-500 dark:text-neutral-400 text-sm">Ongoing and upcoming tests</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab("tests")}
                    className="text-neutral-600 dark:text-neutral-400"
                  >
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTests ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-900 dark:border-neutral-100"></div>
                  </div>
                ) : tests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-neutral-400 dark:text-neutral-500 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">No tests created yet</p>
                    <Button 
                      size="sm"
                      onClick={() => router.push("/create-test")}
                      className="mt-4 bg-neutral-900 dark:bg-white text-white dark:text-black"
                    >
                      Create First Test
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tests.slice(0, 3).map((test) => {
                      const now = new Date();
                      const startTime = new Date(test.start_time);
                      const endTime = new Date(test.end_time);
                      let status = 'Upcoming';
                      let statusColor = 'bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300';
                      
                      if (endTime < now) {
                        status = 'Completed';
                        statusColor = 'bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-500';
                      } else if (startTime <= now && endTime >= now) {
                        status = 'Active';
                        statusColor = 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
                      }

                      return (
                        <div 
                          key={test.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/40 dark:bg-white/[0.03] border border-neutral-200/50 dark:border-white/[0.08] hover:bg-white/60 dark:hover:bg-white/[0.05] cursor-pointer transition-all duration-200"
                          onClick={() => setActiveTab("tests")}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-neutral-100 dark:bg-white/10 rounded-xl flex items-center justify-center">
                              <FileText className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                            </div>
                            <div>
                              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                                {test.title}
                              </h3>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {test.batch_name} • {test.duration_minutes} min
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                              {status}
                            </span>
                            <ArrowRight className="h-4 w-4 text-neutral-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Batches Tab */}
          <TabsContent value="batches" className="space-y-6">
            <BatchesTab />
          </TabsContent>
          
          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-6">
            {loadingTests ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : testsError ? (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">{testsError}</p>
                <Button onClick={fetchTests} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : (
              <TestsTab 
                tests={tests}
                onTestUpdate={(updatedTests) => {
                  setTests(updatedTests);
                }} 
              />
            )}
          </TabsContent>
          
          {/* Questions Tab */}
          <TabsContent value="questions">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Questions Bank</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage all your test questions</p>
              </div>
              <Button 
                onClick={() => router.push("/add-question")}
                className="bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
            
            {loadingQuestions ? (
              <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-neutral-200/50 dark:border-white/[0.08]">
                <CardContent className="pt-6">
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-900 dark:border-neutral-100"></div>
                  </div>
                </CardContent>
              </Card>
            ) : questionsError ? (
              <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-neutral-200/50 dark:border-white/[0.08]">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-red-600 dark:text-red-400">{questionsError}</p>
                    <Button onClick={fetchQuestions} className="mt-4" variant="outline">
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : questions.length === 0 ? (
              <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-neutral-200/50 dark:border-white/[0.08]">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-neutral-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                      <HelpCircle className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">No questions yet</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto text-sm">
                      Create questions to add them to your tests
                    </p>
                    <Button 
                      onClick={() => router.push("/add-question")}
                      className="bg-neutral-900 dark:bg-white text-white dark:text-black"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create First Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-neutral-200/50 dark:border-white/[0.08]">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {questions.map((question, index) => (
                      <div 
                        key={question.id} 
                        className="flex items-center justify-between p-4 rounded-xl bg-white/40 dark:bg-white/[0.03] border border-neutral-200/50 dark:border-white/[0.08] hover:bg-white/60 dark:hover:bg-white/[0.05] cursor-pointer transition-all duration-200"
                        onClick={() => router.push(`/tests/${question.test_id || 'unknown'}/questions`)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-neutral-100 dark:bg-white/10 rounded-xl flex items-center justify-center">
                            {question.question_type === 'coding' && <Code className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />}
                            {question.question_type === 'multiple_choice' && <FileText className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />}
                            {question.question_type === 'short_answer' && <HelpCircle className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                                Question {index + 1}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                question.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                question.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                {question.difficulty}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                              {question.question_text}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {question.marks} marks
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {question.test_title}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-neutral-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedTestForSubmissions ? 'Student Submissions' : 'Select Test'}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {selectedTestForSubmissions ? 'Review and grade submissions' : 'Choose a test to view submissions'}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedTestForSubmissions && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-neutral-300 dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-white/5"
                      onClick={() => fetchSubmissions(selectedTestForSubmissions)}
                    >
                      Refresh
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-neutral-300 dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-white/5"
                      onClick={() => handleTestSelectForSubmissions(null)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                  </>
                )}
              </div>
            </div>

            {!selectedTestForSubmissions ? (
              /* Show Tests List */
              <div>
                {/* <Card className="dark:bg-[#070c1f] dark:border-gray-800/40 mb-4">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
                      Select a test to view submissions
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Click on a test to see all student submissions for that test.
                    </p>
                  </CardContent>
                </Card> */}

                {loadingTests ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : testsError ? (
                  <Card className="dark:bg-[#070c1f] dark:border-gray-800/40">
                    <CardContent className="pt-6">
                      <p className="text-center text-red-500">{testsError}</p>
                    </CardContent>
                  </Card>
                ) : tests.length === 0 ? (
                  <Card className="dark:bg-[#070c1f] dark:border-gray-800/40">
                    <CardContent className="pt-6">
                      <p className="text-center text-gray-500 dark:text-gray-400">No tests found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tests.map((test) => {
                      const now = new Date();
                      const startTime = new Date(test.start_time);
                      const endTime = new Date(test.end_time);
                      let status = 'Draft';
                      let statusColor = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
                      
                      if (endTime < now) {
                        status = 'Completed';
                        statusColor = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
                      } else if (startTime <= now && endTime >= now) {
                        status = 'Active';
                        statusColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                      } else if (startTime > now) {
                        status = 'Upcoming';
                        statusColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                      }

                      return (
                        <Card 
                          key={test.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow dark:bg-[#070c1f] dark:border-gray-800/40 dark:hover:border-blue-800"
                          onClick={() => handleTestSelectForSubmissions(test.id)}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-semibold text-slate-800 dark:text-white line-clamp-2">
                                {test.title}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor} whitespace-nowrap ml-2`}>
                                {status}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                <span>{test.batch_name}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>{new Date(test.start_time).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>{test.duration_minutes} minutes</span>
                              </div>
                            </div>

                            <Button 
                              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTestSelectForSubmissions(test.id);
                              }}
                            >
                              View Submissions <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Show Submissions for Selected Test */
              <div>
                {loadingSubmissions ? (
                  <Card className="dark:bg-[#070c1f] dark:border-gray-800/40">
                    <CardContent className="pt-6">
                      <p className="text-center text-gray-500 dark:text-gray-400">Loading submissions...</p>
                    </CardContent>
                  </Card>
                ) : submissionsError ? (
                  <Card className="dark:bg-[#070c1f] dark:border-gray-800/40">
                    <CardContent className="pt-6">
                      <p className="text-center text-red-500">{submissionsError}</p>
                    </CardContent>
                  </Card>
                ) : submissions.length === 0 ? (
                  <Card className="dark:bg-[#070c1f] dark:border-gray-800/40">
                    <CardContent className="pt-6">
                      <p className="text-center text-gray-500 dark:text-gray-400">No submissions yet for this test</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="dark:bg-[#070c1f] dark:border-gray-800/40">
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow className="dark:border-gray-800/40">
                            <TableHead className="text-slate-600 dark:text-gray-400">Student</TableHead>
                            <TableHead className="text-slate-600 dark:text-gray-400">Question</TableHead>
                            <TableHead className="text-slate-600 dark:text-gray-400">Batch</TableHead>
                            <TableHead className="text-slate-600 dark:text-gray-400">Submitted</TableHead>
                            <TableHead className="text-slate-600 dark:text-gray-400">Score</TableHead>
                            <TableHead className="text-right text-slate-600 dark:text-gray-400">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissions.map((submission) => (
                            <TableRow key={submission.submission_id} className="dark:border-gray-800/40 dark:hover:bg-[#0a1029]">
                              <TableCell className="font-medium text-slate-800 dark:text-gray-300">
                                <div>
                                  <div>{submission.student_name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">{submission.student_roll}</div>
                                </div>
                              </TableCell>
                              <TableCell className="dark:text-gray-300">
                                <div className="max-w-xs truncate" title={submission.question_text}>
                                  {submission.question_text}
                                </div>
                              </TableCell>
                              <TableCell className="dark:text-gray-300">{submission.batch_name}</TableCell>
                              <TableCell className="dark:text-gray-400">{formatTimeAgo(submission.submitted_at)}</TableCell>
                              <TableCell className="dark:text-gray-300">
                                {submission.marks_obtained !== null 
                                  ? `${submission.marks_obtained}/${submission.total_marks}` 
                                  : 'Not graded'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                                  onClick={() => viewSubmissionDetails(submission)}
                                >
                                  View Code
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Submission Details Dialog */}
      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-[95vh] dark:bg-[#070c1f] dark:border-gray-800 p-6">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Review Student Submission</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              View, run, and grade student&apos;s code submission
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="h-[calc(95vh-120px)] overflow-hidden">
              <SubmissionCodeViewer 
                submission={selectedSubmission}
                onGrade={handleGradeSubmission}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}