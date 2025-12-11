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
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-background pb-8">
      {/* Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-white dark:bg-card border-r border-[#e5e5e5] dark:border-border p-5 overflow-y-auto"
        style={{
          boxShadow: "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px"
        }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-[#146e96] rounded-xl">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#111A4A] dark:text-foreground">
              Faculty Portal
            </h2>
          </div>
        </div>
        
        <nav className="space-y-1">
          <Button 
            variant={activeTab === "overview" ? "default" : "ghost"} 
            className={`w-full justify-start h-11 text-left font-medium transition-all duration-200 rounded-xl ${
              activeTab === "overview" 
                ? "bg-[#146e96] text-white hover:bg-[#0f5a7a]" 
                : "text-[#666666] hover:text-[#111A4A] hover:bg-[#f0f9ff] dark:text-muted-foreground dark:hover:bg-accent"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <div className={`mr-3 p-1.5 rounded-lg ${activeTab === "overview" ? "bg-white/20" : "bg-[#146e96]/10 dark:bg-primary/20"}`}>
              <BarChart3 className={`h-4 w-4 ${activeTab === "overview" ? "text-white" : "text-[#146e96] dark:text-primary"}`} />
            </div>
            Overview
          </Button>

          <Button 
            variant={activeTab === "batches" ? "default" : "ghost"} 
            className={`w-full justify-start h-11 text-left font-medium transition-all duration-200 rounded-xl ${
              activeTab === "batches" 
                ? "bg-[#146e96] text-white hover:bg-[#0f5a7a]" 
                : "text-[#666666] hover:text-[#111A4A] hover:bg-[#f0f9ff] dark:text-muted-foreground dark:hover:bg-accent"
            }`}
            onClick={() => setActiveTab("batches")}
          >
            <div className={`mr-3 p-1.5 rounded-lg ${activeTab === "batches" ? "bg-white/20" : "bg-[#8b5cf6]/10 dark:bg-chart-3/20"}`}>
              <Users className={`h-4 w-4 ${activeTab === "batches" ? "text-white" : "text-[#8b5cf6] dark:text-chart-3"}`} />
            </div>
            Manage Batches
          </Button>

          <Button 
            variant={activeTab === "tests" ? "default" : "ghost"} 
            className={`w-full justify-start h-11 text-left font-medium transition-all duration-200 rounded-xl ${
              activeTab === "tests" 
                ? "bg-[#146e96] text-white hover:bg-[#0f5a7a]" 
                : "text-[#666666] hover:text-[#111A4A] hover:bg-[#f0f9ff] dark:text-muted-foreground dark:hover:bg-accent"
            }`}
            onClick={() => setActiveTab("tests")}
          >
            <div className={`mr-3 p-1.5 rounded-lg ${activeTab === "tests" ? "bg-white/20" : "bg-[#10b981]/10 dark:bg-chart-2/20"}`}>
              <FileText className={`h-4 w-4 ${activeTab === "tests" ? "text-white" : "text-[#10b981] dark:text-chart-2"}`} />
            </div>
            Manage Tests
          </Button>
          
          <Button 
            variant={activeTab === "questions" ? "default" : "ghost"} 
            className={`w-full justify-start h-11 text-left font-medium transition-all duration-200 rounded-xl ${
              activeTab === "questions" 
                ? "bg-[#146e96] text-white hover:bg-[#0f5a7a]" 
                : "text-[#666666] hover:text-[#111A4A] hover:bg-[#f0f9ff] dark:text-muted-foreground dark:hover:bg-accent"
            }`}
            onClick={() => setActiveTab("questions")}
          >
            <div className={`mr-3 p-1.5 rounded-lg ${activeTab === "questions" ? "bg-white/20" : "bg-[#f59e0b]/10 dark:bg-chart-4/20"}`}>
              <svg className={`h-4 w-4 ${activeTab === "questions" ? "text-white" : "text-[#f59e0b] dark:text-chart-4"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Questions Bank
          </Button>
          
          <Button 
            variant={activeTab === "submissions" ? "default" : "ghost"} 
            className={`w-full justify-start h-11 text-left font-medium transition-all duration-200 rounded-xl ${
              activeTab === "submissions" 
                ? "bg-[#146e96] text-white hover:bg-[#0f5a7a]" 
                : "text-[#666666] hover:text-[#111A4A] hover:bg-[#f0f9ff] dark:text-muted-foreground dark:hover:bg-accent"
            }`}
            onClick={() => setActiveTab("submissions")}
          >
            <div className={`mr-3 p-1.5 rounded-lg ${activeTab === "submissions" ? "bg-white/20" : "bg-[#0ea5e9]/10 dark:bg-chart-5/20"}`}>
              <TrendingUp className={`h-4 w-4 ${activeTab === "submissions" ? "text-white" : "text-[#0ea5e9] dark:text-chart-5"}`} />
            </div>
            Submissions
          </Button>

          <Button 
            variant={activeTab === "settings" ? "default" : "ghost"} 
            className={`w-full justify-start h-11 text-left font-medium transition-all duration-200 rounded-xl ${
              activeTab === "settings" 
                ? "bg-[#146e96] text-white hover:bg-[#0f5a7a]" 
                : "text-[#666666] hover:text-[#111A4A] hover:bg-[#f0f9ff] dark:text-muted-foreground dark:hover:bg-accent"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            <div className={`mr-3 p-1.5 rounded-lg ${activeTab === "settings" ? "bg-white/20" : "bg-[#666666]/10 dark:bg-muted"}`}>
              <Settings className={`h-4 w-4 ${activeTab === "settings" ? "text-white" : "text-[#666666] dark:text-muted-foreground"}`} />
            </div>
            Settings
          </Button>
        </nav>

        <div className="mt-auto pt-4 pb-6 border-t border-[#e5e5e5] dark:border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10 text-left font-normal text-sm text-[#666666] hover:text-[#111A4A] hover:bg-[#fafafa] dark:text-muted-foreground dark:hover:bg-accent rounded-xl" 
            onClick={() => router.push("/logout")}
          >
            <div className="mr-3 p-1 rounded-md">
              <Settings className="h-4 w-4" />
            </div>
            Logout
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-8 md:ml-64">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-normal text-[#111A4A] dark:text-foreground tracking-tight">
              Faculty Dashboard
            </h1>
            <p className="text-[#7C7F88] dark:text-muted-foreground mt-1">
              Welcome back! Manage your academic content with ease.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Button 
              size="sm" 
              onClick={() => router.push("/create-batch")}
              className="bg-[#10b981] hover:bg-[#059669] text-white rounded-lg"
            >
              <Users className="mr-2 h-4 w-4" />
              New Batch
            </Button>
            <Button 
              size="sm" 
              onClick={() => router.push("/create-test")}
              className="bg-[#146e96] hover:bg-[#0f5a7a] text-white rounded-lg"
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
            <div className="grid gap-5 md:grid-cols-4 mb-6">
              <div className="rounded-[20px] p-5 bg-white dark:bg-card"
                style={{
                  backgroundImage: "linear-gradient(rgb(255, 255, 255), rgb(252, 252, 252))",
                  boxShadow: "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px -1.4px"
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#7C7F88] dark:text-muted-foreground">Total Batches</p>
                    <p className="text-2xl font-semibold text-[#111A4A] dark:text-foreground mt-1">{batches.length}</p>
                  </div>
                  <div className="p-3 bg-[#146e96]/10 dark:bg-primary/20 rounded-xl">
                    <Users className="h-6 w-6 text-[#146e96] dark:text-primary" />
                  </div>
                </div>
              </div>
              
              <div className="rounded-[20px] p-5 bg-white dark:bg-card"
                style={{
                  backgroundImage: "linear-gradient(rgb(255, 255, 255), rgb(252, 252, 252))",
                  boxShadow: "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px -1.4px"
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#7C7F88] dark:text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-semibold text-[#111A4A] dark:text-foreground mt-1">
                      {batches.reduce((total, batch) => total + (batch.students?.length || 0), 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-[#10b981]/10 dark:bg-chart-2/20 rounded-xl">
                    <GraduationCap className="h-6 w-6 text-[#10b981] dark:text-chart-2" />
                  </div>
                </div>
              </div>
              
              <div className="rounded-[20px] p-5 bg-white dark:bg-card"
                style={{
                  backgroundImage: "linear-gradient(rgb(255, 255, 255), rgb(252, 252, 252))",
                  boxShadow: "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px -1.4px"
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#7C7F88] dark:text-muted-foreground">Active Batches</p>
                    <p className="text-2xl font-semibold text-[#111A4A] dark:text-foreground mt-1">
                      {batches.filter(b => b.students?.length > 0).length}
                    </p>
                  </div>
                  <div className="p-3 bg-[#8b5cf6]/10 dark:bg-chart-3/20 rounded-xl">
                    <BookOpen className="h-6 w-6 text-[#8b5cf6] dark:text-chart-3" />
                  </div>
                </div>
              </div>
              
              <div className="rounded-[20px] p-5 bg-white dark:bg-card"
                style={{
                  backgroundImage: "linear-gradient(rgb(255, 255, 255), rgb(252, 252, 252))",
                  boxShadow: "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px -1.4px"
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#7C7F88] dark:text-muted-foreground">This Month</p>
                    <p className="text-2xl font-semibold text-[#111A4A] dark:text-foreground mt-1">
                      {batches.filter(b => {
                        const createdDate = new Date(b.created_at);
                        const now = new Date();
                        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                  <div className="p-3 bg-[#f59e0b]/10 dark:bg-chart-4/20 rounded-xl">
                    <Calendar className="h-6 w-6 text-[#f59e0b] dark:text-chart-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Batches */}
            <div className="rounded-[24px] p-6 bg-white dark:bg-card"
              style={{
                backgroundImage: "linear-gradient(rgb(255, 255, 255), rgb(252, 252, 252))",
                boxShadow: "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px -1.4px, rgba(0, 0, 0, 0.04) 0px 6px 6px -3px"
              }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[#111A4A] dark:text-foreground">Your Batches</h3>
                <p className="text-[#7C7F88] dark:text-muted-foreground text-sm mt-1">Manage your student batches and view recent activity</p>
              </div>
              <div>
                {loadingBatches ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#146e96] dark:border-primary"></div>
                  </div>
                ) : batchError ? (
                  <div className="text-center py-8">
                    <p className="text-destructive">{batchError}</p>
                    <Button onClick={fetchBatches} className="mt-4 bg-[#146e96] hover:bg-[#0f5a7a] text-white rounded-lg">
                      Try Again
                    </Button>
                  </div>
                ) : batches.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-[#f0f9ff] dark:bg-accent rounded-full flex items-center justify-center mb-4">
                      <Users className="w-12 h-12 text-[#146e96] dark:text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-2 text-[#111A4A] dark:text-foreground">No batches found</h3>
                    <p className="text-[#7C7F88] dark:text-muted-foreground mb-6 max-w-md mx-auto">
                      You haven't created any batches yet. Create your first batch to get started.
                    </p>
                    <Button 
                      onClick={() => router.push("/create-batch")}
                      className="bg-[#146e96] hover:bg-[#0f5a7a] text-white rounded-lg"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Batch
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {batches.slice(0, 6).map((batch, index) => (
                      <div 
                        key={batch.id} 
                        className="cursor-pointer group rounded-[16px] p-5 border border-[#e5e5e5] dark:border-border hover:border-[#146e96] dark:hover:border-primary transition-all duration-200 bg-white dark:bg-card"
                        onClick={() => router.push(`/batches/${batch.id}`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-[#111A4A] dark:text-foreground mb-1">
                              {batch.name}
                            </h3>
                            <p className="text-sm text-[#7C7F88] dark:text-muted-foreground">
                              {batch.students?.length || 0} students
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-[#f0f9ff] dark:bg-accent rounded-lg flex items-center justify-center group-hover:bg-[#146e96]/10 transition-colors">
                            <Users className="h-5 w-5 text-[#146e96] dark:text-primary" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#7C7F88] dark:text-muted-foreground">Year:</span>
                            <span className="font-medium text-[#111A4A] dark:text-foreground">{batch.academic_year}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#7C7F88] dark:text-muted-foreground">Semester:</span>
                            <span className="font-medium text-[#111A4A] dark:text-foreground">{batch.semester}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#7C7F88] dark:text-muted-foreground">Created:</span>
                            <span className="font-medium text-[#111A4A] dark:text-foreground">
                              {new Date(batch.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-[24px] p-6 bg-white dark:bg-card"
                style={{
                  backgroundImage: "linear-gradient(rgb(255, 255, 255), rgb(252, 252, 252))",
                  boxShadow: "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px -1.4px"
                }}
              >
                <h3 className="text-lg font-semibold text-[#111A4A] dark:text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push("/create-batch")}
                    className="w-full justify-start bg-[#10b981] hover:bg-[#059669] text-white rounded-xl h-11"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Batch
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("batches")}
                    variant="outline"
                    className="w-full justify-start border-[#e5e5e5] dark:border-border text-[#666666] dark:text-muted-foreground hover:border-[#146e96] hover:text-[#146e96] dark:hover:border-primary dark:hover:text-primary rounded-xl h-11"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage All Batches
                  </Button>
                  <Button 
                    onClick={() => router.push("/create-test")}
                    variant="outline"
                    className="w-full justify-start border-[#e5e5e5] dark:border-border text-[#666666] dark:text-muted-foreground hover:border-[#146e96] hover:text-[#146e96] dark:hover:border-primary dark:hover:text-primary rounded-xl h-11"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Create New Test
                  </Button>
                </div>
              </div>

              <div className="rounded-[24px] p-6 bg-white dark:bg-card"
                style={{
                  backgroundImage: "linear-gradient(rgb(255, 255, 255), rgb(252, 252, 252))",
                  boxShadow: "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px -1.4px"
                }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#111A4A] dark:text-foreground">Quick Stats</h3>
                  <p className="text-sm text-[#7C7F88] dark:text-muted-foreground">Overview of your teaching activities</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#f0f9ff] dark:bg-accent rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#146e96]/20 dark:bg-primary/30 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-[#146e96] dark:text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#7C7F88] dark:text-muted-foreground">Total Students</p>
                        <p className="text-xl font-semibold text-[#111A4A] dark:text-foreground">
                          {batches.reduce((sum, batch) => sum + (batch.student_count || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#f0fdf4] dark:bg-chart-2/10 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#10b981]/20 dark:bg-chart-2/30 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-[#10b981] dark:text-chart-2" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#7C7F88] dark:text-muted-foreground">Active Tests</p>
                        <p className="text-xl font-semibold text-[#111A4A] dark:text-foreground">
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
                  
                  <div className="flex items-center justify-between p-3 bg-[#faf5ff] dark:bg-chart-3/10 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#8b5cf6]/20 dark:bg-chart-3/30 rounded-full flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-[#8b5cf6] dark:text-chart-3" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#7C7F88] dark:text-muted-foreground">Questions Created</p>
                        <p className="text-xl font-semibold text-[#111A4A] dark:text-foreground">
                          {questions.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#146e96] dark:border-primary"></div>
              </div>
            ) : testsError ? (
              <div className="text-center py-8">
                <p className="text-destructive">{testsError}</p>
                <Button onClick={fetchTests} className="mt-4 bg-[#146e96] hover:bg-[#0f5a7a] text-white rounded-lg">
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
              <h2 className="text-2xl font-semibold text-[#111A4A] dark:text-foreground">Questions Bank</h2>
              <Button 
                onClick={() => router.push("/add-question")}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
            
            {loadingQuestions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5cf6] dark:border-chart-3"></div>
              </div>
            ) : questionsError ? (
              <div className="text-center py-8">
                <p className="text-destructive">{questionsError}</p>
                <Button onClick={fetchQuestions} className="mt-4 bg-[#146e96] hover:bg-[#0f5a7a] text-white rounded-lg">
                  Try Again
                </Button>
              </div>
            ) : questions.length === 0 ? (
              <div className="rounded-[24px] p-6 bg-white dark:bg-card"
                style={{
                  backgroundImage: "linear-gradient(rgb(255, 255, 255), rgb(252, 252, 252))",
                  boxShadow: "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px -1.4px"
                }}
              >
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-[#faf5ff] dark:bg-chart-3/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-[#8b5cf6] dark:text-chart-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium mb-2 text-[#111A4A] dark:text-foreground">No questions found</h3>
                  <p className="text-[#7C7F88] dark:text-muted-foreground mb-6 max-w-md mx-auto">
                    You haven't created any questions yet. Create your first question to get started.
                  </p>
                  <Button 
                    onClick={() => router.push("/add-question")}
                    className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Question
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {questions.map((question, index) => (
                  <div 
                    key={question.id} 
                    className="cursor-pointer group rounded-[16px] p-5 border border-[#e5e5e5] dark:border-border hover:border-[#8b5cf6] dark:hover:border-chart-3 transition-all duration-200 bg-white dark:bg-card"
                    onClick={() => router.push(`/tests/${question.test_id || 'unknown'}/questions`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {question.question_type === 'coding' && <Code className="h-5 w-5 text-[#146e96] dark:text-primary" />}
                          {question.question_type === 'multiple_choice' && <FileText className="h-5 w-5 text-[#10b981] dark:text-chart-2" />}
                          {question.question_type === 'short_answer' && <HelpCircle className="h-5 w-5 text-[#f59e0b] dark:text-chart-4" />}
                          <h3 className="text-lg font-semibold text-[#111A4A] dark:text-foreground">
                            Q{index + 1}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            question.difficulty === 'easy' ? 'bg-[#f0fdf4] text-[#10b981] dark:bg-chart-2/20 dark:text-chart-2' :
                            question.difficulty === 'medium' ? 'bg-[#fffbeb] text-[#f59e0b] dark:bg-chart-4/20 dark:text-chart-4' :
                            'bg-[#fef2f2] text-[#ef4444] dark:bg-destructive/20 dark:text-destructive'
                          }`}>
                            {question.difficulty}
                          </span>
                        </div>
                        
                        <p className="text-sm text-[#7C7F88] dark:text-muted-foreground mb-3 line-clamp-3">
                          {question.question_text.length > 100 
                            ? question.question_text.substring(0, 100) + '...' 
                            : question.question_text}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-[#7C7F88] dark:text-muted-foreground">
                          <span>{question.test_title} - {question.test_batch_name}</span>
                          <span className="font-medium text-[#111A4A] dark:text-foreground">{question.marks} marks</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <div className="flex justify-between items-center mb-6">
              {/* <h2 className="text-2xl font-semibold text-[#111A4A] dark:text-foreground">Student Submissions</h2> */}
              <div className="flex gap-2">
                {selectedTestForSubmissions && (
                  <Button 
                    variant="outline" 
                    className="border-[#e5e5e5] dark:border-border bg-white dark:bg-card text-[#666666] dark:text-muted-foreground hover:bg-[#fafafa] dark:hover:bg-muted rounded-lg"
                    onClick={() => fetchSubmissions(selectedTestForSubmissions)}
                  >
                    Refresh
                  </Button>
                )}
                {selectedTestForSubmissions && (
                  <Button 
                    variant="outline" 
                    className="border-[#e5e5e5] dark:border-border bg-white dark:bg-card text-[#666666] dark:text-muted-foreground hover:bg-[#fafafa] dark:hover:bg-muted rounded-lg"
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#146e96] dark:border-primary"></div>
                  </div>
                ) : testsError ? (
                  <div className="rounded-[16px] p-6 bg-white dark:bg-card border border-[#e5e5e5] dark:border-border">
                    <p className="text-center text-destructive">{testsError}</p>
                  </div>
                ) : tests.length === 0 ? (
                  <div className="rounded-[16px] p-6 bg-white dark:bg-card border border-[#e5e5e5] dark:border-border">
                    <p className="text-center text-[#7C7F88] dark:text-muted-foreground">No tests found</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tests.map((test) => {
                      const now = new Date();
                      const startTime = new Date(test.start_time);
                      const endTime = new Date(test.end_time);
                      let status = 'Draft';
                      let statusColor = 'bg-[#f5f5f5] text-[#7C7F88] dark:bg-muted dark:text-muted-foreground';
                      
                      if (endTime < now) {
                        status = 'Completed';
                        statusColor = 'bg-[#f5f5f5] text-[#666666] dark:bg-muted dark:text-muted-foreground';
                      } else if (startTime <= now && endTime >= now) {
                        status = 'Active';
                        statusColor = 'bg-[#f0fdf4] text-[#10b981] dark:bg-chart-2/20 dark:text-chart-2';
                      } else if (startTime > now) {
                        status = 'Upcoming';
                        statusColor = 'bg-[#f0f9ff] text-[#146e96] dark:bg-primary/20 dark:text-primary';
                      }

                      return (
                        <div 
                          key={test.id}
                          className="cursor-pointer rounded-[16px] p-5 border border-[#e5e5e5] dark:border-border hover:border-[#146e96] dark:hover:border-primary transition-all duration-200 bg-white dark:bg-card"
                          onClick={() => handleTestSelectForSubmissions(test.id)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-[#111A4A] dark:text-foreground line-clamp-2">
                              {test.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor} whitespace-nowrap ml-2`}>
                              {status}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm text-[#7C7F88] dark:text-muted-foreground">
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
                            className="w-full mt-4 bg-[#146e96] hover:bg-[#0f5a7a] text-white rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestSelectForSubmissions(test.id);
                            }}
                          >
                            View Submissions <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Show Submissions for Selected Test */
              <div>
                {loadingSubmissions ? (
                  <div className="rounded-[16px] p-6 bg-white dark:bg-card border border-[#e5e5e5] dark:border-border">
                    <p className="text-center text-[#7C7F88] dark:text-muted-foreground">Loading submissions...</p>
                  </div>
                ) : submissionsError ? (
                  <div className="rounded-[16px] p-6 bg-white dark:bg-card border border-[#e5e5e5] dark:border-border">
                    <p className="text-center text-destructive">{submissionsError}</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="rounded-[16px] p-6 bg-white dark:bg-card border border-[#e5e5e5] dark:border-border">
                    <p className="text-center text-[#7C7F88] dark:text-muted-foreground">No submissions yet for this test</p>
                  </div>
                ) : (
                  <div className="rounded-[16px] overflow-hidden bg-white dark:bg-card border border-[#e5e5e5] dark:border-border">
                    <div className="p-6">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#e5e5e5] dark:border-border">
                            <TableHead className="text-[#666666] dark:text-muted-foreground">Student</TableHead>
                            <TableHead className="text-[#666666] dark:text-muted-foreground">Question</TableHead>
                            <TableHead className="text-[#666666] dark:text-muted-foreground">Batch</TableHead>
                            <TableHead className="text-[#666666] dark:text-muted-foreground">Submitted</TableHead>
                            <TableHead className="text-[#666666] dark:text-muted-foreground">Score</TableHead>
                            <TableHead className="text-right text-[#666666] dark:text-muted-foreground">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissions.map((submission) => (
                            <TableRow key={submission.submission_id} className="border-[#e5e5e5] dark:border-border hover:bg-[#fafafa] dark:hover:bg-muted/50">
                              <TableCell className="font-medium text-[#111A4A] dark:text-foreground">
                                <div>
                                  <div>{submission.student_name}</div>
                                  <div className="text-xs text-[#7C7F88] dark:text-muted-foreground">{submission.student_roll}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-[#666666] dark:text-muted-foreground">
                                <div className="max-w-xs truncate" title={submission.question_text}>
                                  {submission.question_text}
                                </div>
                              </TableCell>
                              <TableCell className="text-[#666666] dark:text-muted-foreground">{submission.batch_name}</TableCell>
                              <TableCell className="text-[#7C7F88] dark:text-muted-foreground">{formatTimeAgo(submission.submitted_at)}</TableCell>
                              <TableCell className="text-[#111A4A] dark:text-foreground">
                                {submission.marks_obtained !== null 
                                  ? `${submission.marks_obtained}/${submission.total_marks}` 
                                  : 'Not graded'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-[#146e96] hover:text-[#0f5a7a] dark:text-primary dark:hover:bg-primary/20"
                                  onClick={() => viewSubmissionDetails(submission)}
                                >
                                  View Code
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-[#111A4A] dark:text-foreground">Faculty Settings</h2>
              <Button 
                className="bg-[#146e96] hover:bg-[#0f5a7a] text-white rounded-lg"
              >
                Save Changes
              </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Account Settings */}
              <div className="rounded-[16px] p-6 bg-white dark:bg-card border border-[#e5e5e5] dark:border-border">
                <h3 className="text-xl font-semibold text-[#111A4A] dark:text-foreground mb-6">Account Settings</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#666666] dark:text-muted-foreground">
                      Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="Dr. John Doe"
                      className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white dark:bg-card dark:border-border text-[#111A4A] dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#146e96] dark:focus:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#666666] dark:text-muted-foreground">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      placeholder="john.doe@somaiya.edu"
                      className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white dark:bg-card dark:border-border text-[#111A4A] dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#146e96] dark:focus:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#666666] dark:text-muted-foreground">
                      Department
                    </label>
                    <input 
                      type="text" 
                      placeholder="Computer Engineering"
                      className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white dark:bg-card dark:border-border text-[#111A4A] dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#146e96] dark:focus:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#666666] dark:text-muted-foreground">
                      Faculty ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="FAC12345"
                      className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg bg-[#fafafa] dark:bg-muted dark:border-border text-[#7C7F88] dark:text-muted-foreground cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-[#7C7F88] dark:text-muted-foreground">Faculty ID cannot be changed</p>
                  </div>
                </div>
              </div>
              
              {/* Password Settings */}
              <div className="rounded-[16px] p-6 bg-white dark:bg-card border border-[#e5e5e5] dark:border-border">
                <h3 className="text-xl font-semibold text-[#111A4A] dark:text-foreground mb-6">Change Password</h3>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#666666] dark:text-muted-foreground">
                        Current Password
                      </label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white dark:bg-card dark:border-border text-[#111A4A] dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#146e96] dark:focus:ring-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#666666] dark:text-muted-foreground">
                        New Password
                      </label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white dark:bg-card dark:border-border text-[#111A4A] dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#146e96] dark:focus:ring-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#666666] dark:text-muted-foreground">
                        Confirm New Password
                      </label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white dark:bg-card dark:border-border text-[#111A4A] dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#146e96] dark:focus:ring-primary"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <p className="text-xs text-[#7C7F88] dark:text-muted-foreground mb-4">Password must be at least 8 characters long and contain a mix of letters, numbers, and special characters.</p>
                      <Button 
                        className="w-full bg-[#146e96] hover:bg-[#0f5a7a] text-white rounded-lg"
                      >
                        Update Password
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Submission Details Dialog */}
      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent className="!max-w-[98vw] w-[98vw] !max-h-[98vh] h-[98vh] bg-white dark:bg-card border border-[#e5e5e5] dark:border-border p-3 sm:!max-w-[98vw] rounded-[16px]">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-[#111A4A] dark:text-foreground text-base">Review Student Submission</DialogTitle>
            <DialogDescription className="text-[#7C7F88] dark:text-muted-foreground text-xs">
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