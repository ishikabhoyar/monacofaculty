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
import { getApiUrl, handleAuthError } from "@/lib/utils";
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
  // Initialize activeTab from URL or sessionStorage
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabFromUrl = params.get('tab');
      if (tabFromUrl) return tabFromUrl;
      
      const savedTab = sessionStorage.getItem('activeTab');
      if (savedTab) return savedTab;
    }
    return "overview";
  });
  
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

  // Save activeTab to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('activeTab', activeTab);
      // Update URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeTab]);

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

      // Handle auth errors
      handleAuthError(response);

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

      // Handle auth errors
      handleAuthError(response);

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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#040714] dark:via-[#050a1c] dark:to-[#060b20] pb-8">
      {/* Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-white/90 backdrop-blur-xl dark:bg-[#070c1f]/95 border-r border-slate-200/40 dark:border-gray-800/20 p-5 shadow-md overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Faculty Portal
            </h2>
          </div>
        </div>
        
        <nav className="space-y-2">
          <Button 
            variant={activeTab === "overview" ? "default" : "ghost"} 
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:scale-105 hover:shadow-md dark:hover:bg-gray-800/50" 
            onClick={() => setActiveTab("overview")}
          >
            <div className="mr-3 p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            Overview
          </Button>

          <Button 
            variant={activeTab === "batches" ? "default" : "ghost"} 
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:scale-105 hover:shadow-md dark:hover:bg-gray-800/50" 
            onClick={() => setActiveTab("batches")}
          >
            <div className="mr-3 p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            Manage Batches
          </Button>

          <Button 
            variant={activeTab === "tests" ? "default" : "ghost"} 
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:scale-105 hover:shadow-md dark:hover:bg-gray-800/50" 
            onClick={() => setActiveTab("tests")}
          >
            <div className="mr-3 p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            Manage Tests
          </Button>
          
          <Button 
            variant={activeTab === "questions" ? "default" : "ghost"} 
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:scale-105 hover:shadow-md dark:hover:bg-gray-800/50" 
            onClick={() => setActiveTab("questions")}
          >
            <div className="mr-3 p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Questions Bank
          </Button>
          
          <Button 
            variant={activeTab === "submissions" ? "default" : "ghost"} 
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:scale-105 hover:shadow-md dark:hover:bg-gray-800/50" 
            onClick={() => setActiveTab("submissions")}
          >
            <div className="mr-3 p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            Submissions
          </Button>
        </nav>

        <div className="mt-auto pt-4 pb-6 border-t border-slate-200/60 dark:border-gray-800/30">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10 text-left font-normal text-sm transition-colors hover:bg-slate-100/60 dark:hover:bg-gray-800/30" 
            onClick={() => router.push("/logout")}
          >
            <div className="mr-3 p-1 rounded-md">
              <Settings className="h-4 w-4 text-slate-500 dark:text-gray-400" />
            </div>
            Logout
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-8 md:ml-64">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
              Faculty Dashboard
            </h1>
            <p className="text-slate-600 dark:text-gray-400 mt-1">
              Welcome back! Manage your academic content with ease.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm" 
              className="shadow-sm hover:shadow-md transition-all duration-200"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button 
              size="sm" 
              onClick={() => router.push("/create-batch")}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Users className="mr-2 h-4 w-4" />
              New Batch
            </Button>
            <Button 
              size="sm" 
              onClick={() => router.push("/create-test")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200"
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
            {/* Batch Statistics */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Batches</p>
                      <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{batches.length}</p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Students</p>
                      <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                        {batches.reduce((total, batch) => total + (batch.students?.length || 0), 0)}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Batches</p>
                      <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                        {batches.filter(b => b.students?.length > 0).length}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">This Month</p>
                      <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                        {batches.filter(b => {
                          const createdDate = new Date(b.created_at);
                          const now = new Date();
                          return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
                        }).length}
                      </p>
                    </div>
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                      <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Batches */}
            <Card className="shadow-lg border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-white">Your Batches</CardTitle>
                <CardDescription>Manage your student batches and view recent activity</CardDescription>
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
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-12 h-12 text-slate-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-medium mb-2 text-slate-800 dark:text-white">No batches found</h3>
                    <p className="text-slate-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      You haven't created any batches yet. Create your first batch to get started.
                    </p>
                    <Button 
                      onClick={() => router.push("/create-batch")}
                      className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Batch
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {batches.slice(0, 6).map((batch, index) => (
                      <Card 
                        key={batch.id} 
                        className="cursor-pointer group border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-900/50"
                        onClick={() => router.push(`/batches/${batch.id}`)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
                                {batch.name}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-gray-400">
                                {batch.students?.length || 0} students
                              </p>
                            </div>
                            <div className="w-10 h-10 bg-slate-100 dark:bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                              <Users className="h-5 w-5 text-slate-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-gray-400">Year:</span>
                              <span className="font-medium text-slate-800 dark:text-white">{batch.academic_year}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-gray-400">Semester:</span>
                              <span className="font-medium text-slate-800 dark:text-white">{batch.semester}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-gray-400">Created:</span>
                              <span className="font-medium text-slate-800 dark:text-white">
                                {new Date(batch.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="shadow-lg border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => router.push("/create-batch")}
                    className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Batch
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("batches")}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage All Batches
                  </Button>
                  <Button 
                    onClick={() => router.push("/create-test")}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Create New Test
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Quick Stats</CardTitle>
                  <CardDescription>Overview of your teaching activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Total Students</p>
                          <p className="text-2xl font-bold text-slate-800 dark:text-white">
                            {batches.reduce((sum, batch) => sum + (batch.student_count || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Active Tests</p>
                          <p className="text-2xl font-bold text-slate-800 dark:text-white">
                            {tests.filter(test => {
                              const now = new Date();
                              const start = new Date(test.start_time);
                              const end = new Date(test.end_time);
                              return now >= start && now <= end;
                            }).length}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Questions Created</p>
                          <p className="text-2xl font-bold text-slate-800 dark:text-white">
                            {questions.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Questions Bank</h2>
              <Button 
                onClick={() => router.push("/add-question")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
            
            {loadingQuestions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : questionsError ? (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">{questionsError}</p>
                <Button onClick={fetchQuestions} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : questions.length === 0 ? (
              <Card className="dark:bg-[#070c1f] dark:border-gray-800/40">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-slate-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium mb-2 text-slate-800 dark:text-white">No questions found</h3>
                    <p className="text-slate-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      You haven't created any questions yet. Create your first question to get started.
                    </p>
                    <Button 
                      onClick={() => router.push("/add-question")}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {questions.map((question, index) => (
                  <Card 
                    key={question.id} 
                    className="cursor-pointer group border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-900/50"
                    onClick={() => router.push(`/tests/${question.test_id || 'unknown'}/questions`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {question.question_type === 'coding' && <Code className="h-5 w-5 text-blue-600" />}
                            {question.question_type === 'multiple_choice' && <FileText className="h-5 w-5 text-green-600" />}
                            {question.question_type === 'short_answer' && <HelpCircle className="h-5 w-5 text-orange-600" />}
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                              Q{index + 1}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              question.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {question.difficulty}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-600 dark:text-gray-400 mb-3 line-clamp-3">
                            {question.question_text.length > 100 
                              ? question.question_text.substring(0, 100) + '...' 
                              : question.question_text}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                            <span>{question.test_title} - {question.test_batch_name}</span>
                            <span>{question.marks} marks</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <div className="flex justify-between items-center mb-6">
              {/* <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Student Submissions</h2> */}
              <div className="flex gap-2">
                {selectedTestForSubmissions && (
                  <Button 
                    variant="outline" 
                    className="dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => fetchSubmissions(selectedTestForSubmissions)}
                  >
                    Refresh
                  </Button>
                )}
                {selectedTestForSubmissions && (
                  <Button 
                    variant="outline" 
                    className="dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => handleTestSelectForSubmissions(null)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to Tests
                  </Button>
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
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Faculty Settings</h2>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Save Changes
              </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Account Settings */}
              <Card className="dark:bg-[#070c1f] dark:border-gray-800/40">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-800 dark:text-white">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                      Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="Dr. John Doe"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      placeholder="john.doe@somaiya.edu"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                      Department
                    </label>
                    <input 
                      type="text" 
                      placeholder="Computer Engineering"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                      Faculty ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="FAC12345"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled
                    />
                    <p className="text-xs text-slate-500 dark:text-gray-400">Faculty ID cannot be changed</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Password Settings */}
              <Card className="dark:bg-[#070c1f] dark:border-gray-800/40">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-800 dark:text-white">Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                        Current Password
                      </label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                        New Password
                      </label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                        Confirm New Password
                      </label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">Password must be at least 8 characters long and contain a mix of letters, numbers, and special characters.</p>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Update Password
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Submission Details Dialog */}
      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent className="!max-w-[98vw] w-[98vw] !max-h-[98vh] h-[98vh] dark:bg-[#070c1f] dark:border-gray-800 p-3 sm:!max-w-[98vw]">
          <DialogHeader className="pb-1">
            <DialogTitle className="dark:text-white text-base">Review Student Submission</DialogTitle>
            <DialogDescription className="dark:text-gray-400 text-xs">
              View, run, and grade student&apos;s code submission
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="h-[calc(98vh-80px)] overflow-hidden">
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