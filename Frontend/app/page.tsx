"use client";

import React, { useState } from 'react'
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, FileText, Settings, Users, Calendar, BookOpen, ArrowRight, ChevronLeft, GraduationCap, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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

// Dummy data based on your schema
const dummyTests = [
  {
    id: "T001",
    title: "Calculus I Midterm",
    course: "MATH101",
    duration: 90,
    questions: 20,
    startTime: "2025-07-25T10:00:00",
    endTime: "2025-07-25T12:00:00",
    status: "Draft",
    batch: "A1"
  },
  {
    id: "T002",
    title: "Physics II Final",
    course: "PHYS202",
    duration: 120,
    questions: 30,
    startTime: "2025-08-01T14:00:00",
    endTime: "2025-08-01T16:00:00",
    status: "Published",
    batch: "C1"
  },
  {
    id: "T003",
    title: "Data Structures Quiz",
    course: "DS201",
    duration: 45,
    questions: 10,
    startTime: "2025-07-28T09:00:00",
    endTime: "2025-07-28T10:00:00",
    status: "Archived",
    batch: "C2"
  },
  {
    id: "T004",
    title: "Web Development Test",
    course: "WEB201",
    duration: 60,
    questions: 15,
    startTime: "2025-08-05T13:00:00",
    endTime: "2025-08-05T14:30:00",
    status: "Draft",
    batch: "D1"
  }
];

const recentSubmissions = [
  { id: "S001", student: "Alice Johnson", test: "Calculus I Midterm", time: "2 hours ago", score: "85/100" },
  { id: "S002", student: "Bob Smith", test: "Physics II Final", time: "5 hours ago", score: "92/100" },
  { id: "S003", student: "Carol Davis", test: "Chemistry Lab Quiz", time: "1 day ago", score: "78/100" },
  { id: "S004", student: "David Wilson", test: "Algebra Basics", time: "1 day ago", score: "65/100" },
];

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const router = useRouter();
  
  // Get current selection data
  const getCurrentYear = () => academicData.years.find(year => year.id === selectedYear);
  const getCurrentSemester = () => getCurrentYear()?.semesters.find(sem => sem.id === selectedSemester);
  const getCurrentBatch = () => getCurrentSemester()?.batches.find(batch => batch.id === selectedBatch);
  
  // Reset selections when going back
  const resetToYear = () => {
    setSelectedYear(null);
    setSelectedSemester(null);
    setSelectedBatch(null);
  };
  
  const resetToSemester = () => {
    setSelectedSemester(null);
    setSelectedBatch(null);
  };
  
  const resetToBatch = () => {
    setSelectedBatch(null);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Sidebar */}
      <div className="hidden w-72 flex-col bg-white/90 backdrop-blur-xl dark:bg-slate-900/90 border-r border-slate-200/60 dark:border-slate-700/60 p-6 md:flex shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Faculty Portal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Monaco Institute</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          <Button 
            variant={activeTab === "overview" ? "default" : "ghost"} 
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:scale-105 hover:shadow-md" 
            onClick={() => setActiveTab("overview")}
          >
            <div className="mr-3 p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            Overview
          </Button>
          <Button 
            variant={activeTab === "tests" ? "default" : "ghost"} 
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:scale-105 hover:shadow-md" 
            onClick={() => setActiveTab("tests")}
          >
            <div className="mr-3 p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            Manage Tests
          </Button>
          <Button 
            variant={activeTab === "questions" ? "default" : "ghost"} 
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:scale-105 hover:shadow-md" 
            onClick={() => setActiveTab("questions")}
          >
            <div className="mr-3 p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Questions Bank
          </Button>
          <Button 
            variant={activeTab === "submissions" ? "default" : "ghost"} 
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:scale-105 hover:shadow-md" 
            onClick={() => setActiveTab("submissions")}
          >
            <div className="mr-3 p-1.5 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            Student Submissions
          </Button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:scale-105 hover:shadow-md" 
            onClick={() => setActiveTab("settings")}
          >
            <div className="mr-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            Settings
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Faculty Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Welcome back! Manage your academic content with ease.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-all duration-200">
              <Settings className="mr-2 h-4 w-4" />
              Settings
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
          {/* <TabsList className="grid w-full grid-cols-4 md:w-auto md:grid-cols-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Overview</TabsTrigger>
            <TabsTrigger value="tests" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Tests</TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Questions</TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Submissions</TabsTrigger>
          </TabsList> */}
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Breadcrumb Navigation */}
            {/* <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-8 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm"> */}
              {/* <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetToYear}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
              >
                Dashboard
              </Button> */}
              {selectedYear && (
                <>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetToSemester}
                    className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                  >
                    {getCurrentYear()?.name}
                  </Button>
                </>
              )}
              {selectedSemester && (
                <>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetToBatch}
                    className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                  >
                    {getCurrentSemester()?.name}
                  </Button>
                </>
              )}
              {selectedBatch && (
                <>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-white px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full">
                    {getCurrentBatch()?.name}
                  </span>
                </>
              )}
            {/* </div> */}

            {/* Year Selection */}
            {!selectedYear && (
              <div className="space-y-8 animate-in fade-in-50 duration-500 mt-16">
                <div className="text-center">
                  <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Select Academic Year
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 text-lg">Choose the academic year to manage your courses and students</p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
                  {academicData.years.map((year, index) => (
                    <Card 
                      key={year.id} 
                      className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm group animate-in fade-in-50 slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => setSelectedYear(year.id)}
                    >
                      <CardHeader className="text-center pb-6">
                        <div className="mx-auto mb-6 p-6 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                          <BookOpen className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-slate-800 dark:text-slate-100">{year.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg">
                          {year.semesters.length} Semesters Available
                        </p>
                        <div className="flex justify-center gap-8">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                              {year.semesters.reduce((total, sem) => total + sem.batches.length, 0)}
                            </div>
                            <div className="text-sm text-slate-500 font-medium">Total Batches</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                              {year.semesters.reduce((total, sem) => 
                                total + sem.batches.reduce((bTotal, batch) => bTotal + batch.students, 0), 0
                              )}
                            </div>
                            <div className="text-sm text-slate-500 font-medium">Total Students</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Semester Selection */}
            {selectedYear && !selectedSemester && (
              <div className="space-y-8 animate-in fade-in-50 duration-500">
                <div className="flex items-center gap-6 mb-8">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetToYear}
                    className="shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Years
                  </Button>
                  <div>
                    <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {getCurrentYear()?.name} - Select Semester
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">Choose the semester to manage your courses</p>
                  </div>
                </div>
                <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
                  {getCurrentYear()?.semesters.map((semester, index) => (
                    <Card 
                      key={semester.id} 
                      className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-2 border-transparent hover:border-green-200 dark:hover:border-green-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm group animate-in fade-in-50 slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => setSelectedSemester(semester.id)}
                    >
                      <CardHeader className="text-center pb-6">
                        <div className="mx-auto mb-6 p-6 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                          <Calendar className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-slate-800 dark:text-slate-100">{semester.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg">
                          {semester.batches.length} Batches Available
                        </p>
                        <div className="flex justify-center gap-8">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                              {semester.batches.reduce((total, batch) => total + batch.students, 0)}
                            </div>
                            <div className="text-sm text-slate-500 font-medium">Total Students</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                              {semester.batches[0]?.courses.length || 0}
                            </div>
                            <div className="text-sm text-slate-500 font-medium">Courses</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Batch Selection */}
            {selectedSemester && !selectedBatch && (
              <div className="space-y-8 animate-in fade-in-50 duration-500">
                <div className="flex items-center gap-6 mb-8">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetToSemester}
                    className="shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Semesters
                  </Button>
                  <div>
                    <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                      {getCurrentSemester()?.name} - Select Batch
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">Choose the batch to manage and create tests</p>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                  {getCurrentSemester()?.batches.map((batch, index) => (
                    <Card 
                      key={batch.id} 
                      className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm group animate-in fade-in-50 slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => setSelectedBatch(batch.id)}
                    >
                      <CardHeader className="text-center pb-4">
                        <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-purple-400 via-pink-500 to-indigo-600 rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">{batch.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="space-y-4">
                          <div>
                            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                              {batch.students}
                            </div>
                            <div className="text-sm text-slate-500 font-medium">Students Enrolled</div>
                          </div>
                          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                              Active Courses:
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {batch.courses.slice(0, 3).map((course) => (
                                <span 
                                  key={course} 
                                  className="px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-xs font-medium rounded-full border border-slate-300 dark:border-slate-600"
                                >
                                  {course}
                                </span>
                              ))}
                              {batch.courses.length > 3 && (
                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-xs font-medium rounded-full border border-slate-300 dark:border-slate-600">
                                  +{batch.courses.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Batch Dashboard */}
            {selectedBatch && (
              <div className="space-y-8 animate-in fade-in-50 duration-500">
                <div className="flex items-center gap-6 mb-8">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetToBatch}
                    className="shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Batches
                  </Button>
                  <div className="flex-1">
                    <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                      {getCurrentBatch()?.name} Dashboard
                    </h2>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="text-lg">{getCurrentYear()?.name}</span>
                      <span>•</span>
                      <span className="text-lg">{getCurrentSemester()?.name}</span>
                      <span>•</span>
                      <span className="text-lg font-semibold">{getCurrentBatch()?.students} Students</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => router.push("/create-test")} 
                    className="ml-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Test
                  </Button>
                </div>

                {/* Batch Stats */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total Students</CardTitle>
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{getCurrentBatch()?.students}</div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Currently enrolled
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">Active Tests</CardTitle>
                      <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                        {dummyTests.filter(test => test.status === "Published" && test.batch === selectedBatch).length}
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Currently active
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Total Courses</CardTitle>
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                        <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                        {getCurrentBatch()?.courses.length}
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        This semester
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">Recent Submissions</CardTitle>
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{recentSubmissions.length}</div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Past 24 hours
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Courses List */}
                <Card className="shadow-lg border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Courses for {getCurrentBatch()?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {getCurrentBatch()?.courses.map((course, index) => (
                        <div 
                          key={course} 
                          className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-300 hover:shadow-md hover:scale-105 animate-in fade-in-50"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{course}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {dummyTests.filter(test => test.course === course && test.batch === selectedBatch).length} tests created
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Tests for this Batch */}
                <Card className="shadow-lg border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Recent Tests - {getCurrentBatch()?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dummyTests
                        .filter(test => test.batch === selectedBatch)
                        .slice(0, 3)
                        .map((test, index) => (
                          <div 
                            key={test.id} 
                            className="flex items-center justify-between p-6 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] bg-white/50 dark:bg-slate-800/50 animate-in fade-in-50"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div>
                              <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">{test.title}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {test.course} • {test.questions} questions • {test.duration} minutes
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${
                                test.status === 'Published' 
                                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                                  : test.status === 'Draft' 
                                    ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200' 
                                    : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border border-slate-200'
                              }`}>
                                {test.status}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{formatDate(test.startTime)}</p>
                            </div>
                          </div>
                        ))}
                      {dummyTests.filter(test => test.batch === selectedBatch).length === 0 && (
                        <div className="text-center py-12">
                          <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-12 h-12 text-slate-400" />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-lg">No tests found for this batch</p>
                          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Create your first test to get started</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manage Tests</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Create, edit, and manage all your tests</p>
              </div>
              <Button 
                onClick={() => router.push("/create-test")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Test
              </Button>
            </div>
            
            <Card className="shadow-lg border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-700">
                      <TableHead className="font-semibold">Test ID</TableHead>
                      <TableHead className="font-semibold">Title</TableHead>
                      <TableHead className="font-semibold">Course</TableHead>
                      <TableHead className="font-semibold">Duration</TableHead>
                      <TableHead className="font-semibold">Questions</TableHead>
                      <TableHead className="font-semibold">Schedule</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dummyTests.map((test, index) => (
                      <TableRow 
                        key={test.id} 
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-200 animate-in fade-in-50"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="font-mono text-sm font-medium">{test.id}</TableCell>
                        <TableCell className="font-medium">{test.title}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                            {test.course}
                          </span>
                        </TableCell>
                        <TableCell>{test.duration} min</TableCell>
                        <TableCell>{test.questions}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-xs font-medium">Start: {formatDate(test.startTime)}</div>
                            <div className="text-xs text-slate-500">End: {formatDate(test.endTime)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            test.status === 'Published' 
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                              : test.status === 'Draft' 
                                ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200' 
                                : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border border-slate-200'
                          }`}>
                            {test.status}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Add Questions</DropdownMenuItem>
                              <DropdownMenuItem>Duplicate</DropdownMenuItem>
                              <DropdownMenuItem>
                                {test.status === "Published" ? "Unpublish" : "Publish"}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Questions Tab */}
          <TabsContent value="questions">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Questions Bank</h2>
              <Button onClick={() => router.push("/add-question")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <p className="text-slate-500 text-center py-8">
                  Questions bank functionality will be implemented here. <br/>
                  This will allow you to create, edit and manage questions that can be added to tests.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Student Submissions</h2>
              <div className="flex gap-2">
                <Button variant="outline">Filter</Button>
                <Button variant="outline">Export</Button>
              </div>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submission ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Submission Time</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">{submission.id}</TableCell>
                        <TableCell>{submission.student}</TableCell>
                        <TableCell>{submission.test}</TableCell>
                        <TableCell>{submission.time}</TableCell>
                        <TableCell>{submission.score}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}