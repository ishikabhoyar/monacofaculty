"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

// Sample course data - in a real app, this would come from your API
const courses = [
  { id: "MATH101", name: "Calculus I" },
  { id: "PHYS202", name: "Physics II" },
  { id: "CHEM110", name: "Chemistry Lab" },
  { id: "MATH099", name: "Algebra Basics" },
  { id: "CS201", name: "Data Structures" },
];

export default function CreateTestPage() {
  const router = useRouter();
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
  });

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
    if (!testData.title || !testData.courseId || !testData.startTime || !testData.endTime) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Prepare data for API
      const testPayload = {
        ...testData,
        isPasswordProtected,
        password: isPasswordProtected ? testData.password : null,
        allowLateSubmission,
        latePenaltyPercent: allowLateSubmission ? testData.latePenaltyPercent : "0",
      };

      // Get the token from local storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("You need to be logged in to create a test");
        router.push("/login");
        return;
      }
      
      // Send data to your API endpoint
      const response = await fetch("http://localhost:5000/api/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(testPayload),
      });

      const result = await response.json();

      if (result.success) {
        alert("Test created successfully!");
        router.push("/");
      } else {
        alert(`Failed to create test: ${result.message}`);
      }
    } catch (error) {
      console.error("Error creating test:", error);
      alert("An error occurred while creating the test. Please try again.");
    }
  };

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
            <CardTitle>Create New Test</CardTitle>
            <CardDescription>
              Fill in the details to create a new test for your students.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 dark:bg-gray-900">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
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
              onClick={() => router.push("/")}
              className="dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              type="submit"
              className="dark:bg-blue-900 dark:hover:bg-blue-800"
            >
              Create Test
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}