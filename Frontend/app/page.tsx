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
import { MoreHorizontal, PlusCircle, FileText, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    status: "Draft"
  },
  {
    id: "T002",
    title: "Physics II Final",
    course: "PHYS202",
    duration: 120,
    questions: 30,
    startTime: "2025-08-01T14:00:00",
    endTime: "2025-08-01T16:00:00",
    status: "Published"
  },
  {
    id: "T003",
    title: "Chemistry Lab Quiz",
    course: "CHEM110",
    duration: 45,
    questions: 10,
    startTime: "2025-07-28T09:00:00",
    endTime: "2025-07-28T10:00:00",
    status: "Archived"
  },
  {
    id: "T004",
    title: "Algebra Basics",
    course: "MATH099",
    duration: 60,
    questions: 15,
    startTime: "2025-08-05T13:00:00",
    endTime: "2025-08-05T14:30:00",
    status: "Draft"
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
  const router = useRouter();
  
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 md:flex">
        <div className="flex items-center gap-2 mb-8">
          <FileText className="h-6 w-6" />
          <h2 className="text-xl font-bold">Faculty Portal</h2>
        </div>
        
        <nav className="space-y-1">
          <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab("overview")}>
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16a2 2 0 002-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Overview
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab("tests")}>
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Manage Tests
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab("questions")}>
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Questions Bank
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab("submissions")}>
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Student Submissions
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab("settings")}>
            <Settings className="mr-2 h-5 w-5" />
            Settings
          </Button>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
          <div className="flex gap-2 items-center">
            <ThemeToggle />
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button size="sm" onClick={() => router.push("/create-test")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Test
            </Button>
          </div>
        </header>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dummyTests.length}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    +2 from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dummyTests.filter(test => test.status === "Published").length}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Currently active
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dummyTests.reduce((total, test) => total + test.questions, 0)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Across all tests
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Submissions</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recentSubmissions.length}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    In the past 24 hours
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Upcoming Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dummyTests
                      .filter(test => test.status === "Published" || test.status === "Draft")
                      .slice(0, 3)
                      .map(test => (
                        <div key={test.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{test.title}</p>
                            <p className="text-sm text-slate-500">{test.course} • {test.questions} questions</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatDate(test.startTime)}</p>
                            <p className="text-xs text-slate-500">Status: {test.status}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentSubmissions.map(submission => (
                      <div key={submission.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{submission.student}</p>
                          <p className="text-sm text-slate-500">{submission.test}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{submission.score}</p>
                          <p className="text-xs text-slate-500">{submission.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Tests</h2>
              <Button onClick={() => router.push("/create-test")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Test
              </Button>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Duration (min)</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dummyTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.id}</TableCell>
                        <TableCell>{test.title}</TableCell>
                        <TableCell>{test.course}</TableCell>
                        <TableCell>{test.duration}</TableCell>
                        <TableCell>{test.questions}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-xs font-medium">Start: {formatDate(test.startTime)}</div>
                            <div className="text-xs text-slate-500">End: {formatDate(test.endTime)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            test.status === 'Published' 
                              ? 'bg-green-50 text-green-700' 
                              : test.status === 'Draft' 
                                ? 'bg-yellow-50 text-yellow-700' 
                                : 'bg-slate-100 text-slate-700'
                          }`}>
                            {test.status}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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