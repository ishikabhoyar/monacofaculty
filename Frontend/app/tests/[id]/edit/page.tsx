"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Users, AlertCircle, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getApiUrl } from "@/lib/utils";

// Sample course data - in a real app, this would come from your API
const courses = [
  { id: "spm", name: "Structure Programming Methodology" },
  { id: "ds", name: "Data Structures" },
  { id: "algo", name: "Algorithms" },
  { id: "dbms", name: "Database Management Systems" },
  { id: "os", name: "Operating Systems" },
  { id: "cn", name: "Computer Networks" },
  { id: "se", name: "Software Engineering" },
  { id: "oop", name: "Object Oriented Programming" },
  { id: "math101", name: "Calculus I" },
  { id: "phys202", name: "Physics II" },
];

interface Batch {
  id: string;
  batch_name?: string;
  name?: string;
  academic_year: string;
  semester: string;
  students?: any[];
}

// Helper function to format academic year display
const formatYear = (academicYear: string) => {
  const yearMap: { [key: string]: string } = {
    'first': 'First Year',
    'second': 'Second Year',
    'third': 'Third Year',
    'fourth': 'Fourth Year',
  };
  return yearMap[academicYear] || academicYear;
};

// Helper function to format datetime for input
const formatDateTimeLocal = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingTest, setFetchingTest] = useState(true);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [testData, setTestData] = useState({
    title: "",
    courseId: "",
    description: "",
    instructions: "",
    startTime: "",
    endTime: "",
    durationMinutes: "90",
    maxAttempts: "1",
    password: "",
    latePenaltyPercent: "0",
    batchId: "",
  });

  // Fetch test data on component mount
  useEffect(() => {
    fetchTestData();
    fetchBatches();
  }, [testId]);

  const fetchTestData = async () => {
    try {
      setFetchingTest(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/tests/${testId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const test = data.test;
        
        // Pre-populate form with existing test data
        setTestData({
          title: test.title || "",
          courseId: test.course_id || "",
          description: test.description || "",
          instructions: test.instructions || "",
          startTime: formatDateTimeLocal(test.start_time),
          endTime: formatDateTimeLocal(test.end_time),
          durationMinutes: test.duration_minutes?.toString() || "90",
          maxAttempts: test.max_attempts?.toString() || "1",
          password: test.password || "",
          latePenaltyPercent: test.late_penalty_percent?.toString() || "0",
          batchId: test.batch_id?.toString() || "",
        });
        
        // Set checkboxes
        setIsPasswordProtected(!!test.password);
        setAllowLateSubmission(test.late_penalty_percent > 0);
      } else {
        console.error('Failed to fetch test:', data.message);
        alert('Failed to load test data');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      alert('Error loading test data');
      router.push('/');
    } finally {
      setFetchingTest(false);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
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
        console.error('Failed to fetch batches:', data.message);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTestData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setTestData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!testData.title || !testData.batchId || !testData.startTime || !testData.endTime || !testData.durationMinutes) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate that end time is after start time
    if (new Date(testData.endTime) <= new Date(testData.startTime)) {
      alert("End time must be after start time");
      return;
    }

    try {
      // Get the token from local storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("You need to be logged in to update a test");
        router.push("/login");
        return;
      }
      
      // Build payload
      const payload = {
        ...testData,
        durationMinutes: parseInt(testData.durationMinutes),
        maxAttempts: parseInt(testData.maxAttempts),
        latePenaltyPercent: parseInt(testData.latePenaltyPercent),
        // Only include password if protection is enabled
        password: isPasswordProtected ? testData.password : "",
      };
      
      // Send data to your API endpoint with PUT method
      const response = await fetch(`${getApiUrl()}/api/tests/${testId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Success - redirect to test details page
        router.push(`/tests/${testId}`);
      } else {
        // Handle errors from API
        alert(data.message || "Failed to update test");
      }
    } catch (error) {
      console.error("Error updating test:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const selectedBatch = batches.find(batch => batch.id.toString() === testData.batchId);

  // Show loading state while fetching test data
  if (fetchingTest || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-gray-900 dark:to-black p-4 pb-10">
        <div className="w-full max-w-4xl">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg">Loading test data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-gray-900 dark:to-black p-4 pb-10">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/tests/${testId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Test Details
          </Button>
          <ThemeToggle />
        </div>

        <Card className="w-full shadow-md dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="border-b dark:border-gray-800">
            <CardTitle>Edit Test</CardTitle>
            <CardDescription>
              Update the test details and settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 dark:bg-gray-900">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Batch Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Batch Selection</h3>
                  
                  {batches.length === 0 ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                        <span className="text-yellow-800 dark:text-yellow-200 font-medium">No batches found</span>
                      </div>
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                        You need to have at least one batch to assign this test.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <Label htmlFor="batchId">
                        Select Batch <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        name="batchId"
                        value={testData.batchId}
                        onValueChange={(value) =>
                          handleSelectChange("batchId", value)
                        }
                        required
                      >
                        <SelectTrigger id="batchId" className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectValue placeholder="Choose a batch for this test" />
                        </SelectTrigger>
                        <SelectContent>
                          {batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id.toString()}>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-blue-600" />
                              <div>
                                <div className="font-medium">{batch.batch_name || batch.name}</div>
                                <div className="text-xs text-gray-500">
                                  {formatYear(batch.academic_year)} • {batch.semester} • {batch.students?.length || 0} students
                                </div>
                              </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedBatch && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                            <div>
                              <div className="font-medium text-blue-900 dark:text-blue-100">
                                {selectedBatch.batch_name || selectedBatch.name}
                              </div>
                              <div className="text-sm text-blue-700 dark:text-blue-300">
                                {formatYear(selectedBatch.academic_year)} • {selectedBatch.semester} • {selectedBatch.students?.length || 0} students
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>

                  <div className="grid gap-3">
                    <Label htmlFor="title">
                      Test Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={testData.title}
                      onChange={handleChange}
                      placeholder="e.g., Midterm Exam"
                      className="dark:bg-gray-800 dark:border-gray-700"
                      required
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="courseId">
                      Course <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      name="courseId"
                      value={testData.courseId}
                      onValueChange={(value) =>
                        handleSelectChange("courseId", value)
                      }
                      required
                    >
                      <SelectTrigger id="courseId" className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} ({course.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={testData.description}
                      onChange={handleChange}
                      placeholder="Provide a brief description of the test"
                      className="dark:bg-gray-800 dark:border-gray-700"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      name="instructions"
                      value={testData.instructions}
                      onChange={handleChange}
                      placeholder="Instructions for students taking the test"
                      className="dark:bg-gray-800 dark:border-gray-700"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Test Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Test Settings</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="startTime">
                        Start Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startTime"
                        name="startTime"
                        type="datetime-local"
                        value={testData.startTime}
                        onChange={handleChange}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        required
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="endTime">
                        End Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="endTime"
                        name="endTime"
                        type="datetime-local"
                        value={testData.endTime}
                        onChange={handleChange}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                      <Input
                        id="durationMinutes"
                        name="durationMinutes"
                        type="number"
                        value={testData.durationMinutes}
                        onChange={handleChange}
                        placeholder="e.g., 90"
                        className="dark:bg-gray-800 dark:border-gray-700"
                        min="1"
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="maxAttempts">Max Attempts</Label>
                      <Input
                        id="maxAttempts"
                        name="maxAttempts"
                        type="number"
                        value={testData.maxAttempts}
                        onChange={handleChange}
                        placeholder="e.g., 1"
                        className="dark:bg-gray-800 dark:border-gray-700"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Password Protection */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="passwordProtected"
                      checked={isPasswordProtected}
                      onCheckedChange={(checked) => setIsPasswordProtected(checked === true)}
                      className="border-gray-400 dark:border-gray-600"
                    />
                    <Label htmlFor="passwordProtected">Password Protection</Label>
                  </div>

                  {isPasswordProtected && (
                    <div className="grid gap-3">
                      <Label htmlFor="password">Test Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={testData.password}
                        onChange={handleChange}
                        placeholder="Enter a password for the test"
                        className="dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                  )}

                  {/* Late Submission Settings */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowLateSubmission"
                      checked={allowLateSubmission}
                      onCheckedChange={(checked) => setAllowLateSubmission(checked === true)}
                      className="border-gray-400 dark:border-gray-600"
                    />
                    <Label htmlFor="allowLateSubmission">Allow Late Submissions</Label>
                  </div>

                  {allowLateSubmission && (
                    <div className="grid gap-3">
                      <Label htmlFor="latePenaltyPercent">Late Submission Penalty (%)</Label>
                      <Input
                        id="latePenaltyPercent"
                        name="latePenaltyPercent"
                        type="number"
                        value={testData.latePenaltyPercent}
                        onChange={handleChange}
                        placeholder="e.g., 10"
                        className="dark:bg-gray-800 dark:border-gray-700"
                        min="0"
                        max="100"
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6 dark:border-gray-800 dark:bg-gray-900">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push(`/tests/${testId}`)}
              className="dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              type="submit"
              disabled={!testData.batchId || !testData.title || !testData.startTime || !testData.endTime}
              className="dark:bg-blue-900 dark:hover:bg-blue-800"
            >
              Update Test
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function EditTestPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-gray-900 dark:to-black p-4 pb-10">
        <div className="w-full max-w-4xl">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    }>
      <EditTestPage />
    </Suspense>
  );
}

export default EditTestPageWrapper;
