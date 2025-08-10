"use client";

import { useState, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Upload, FileSpreadsheet, Download, Users, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

// Sample academic years and semesters data
const academicYears = [
  { id: "first", name: "First Year" },
  { id: "second", name: "Second Year" },
  { id: "third", name: "Third Year" },
  { id: "fourth", name: "Fourth Year" },
];

const semesters = [
  { id: "sem1", name: "Semester I" },
  { id: "sem2", name: "Semester II" },
  { id: "sem3", name: "Semester III" },
  { id: "sem4", name: "Semester IV" },
  { id: "sem5", name: "Semester V" },
  { id: "sem6", name: "Semester VI" },
  { id: "sem7", name: "Semester VII" },
  { id: "sem8", name: "Semester VIII" },
];

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  phoneNumber?: string;
}

export default function CreateBatchPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [batchData, setBatchData] = useState({
    batchName: "",
    academicYear: "",
    semester: "",
    description: "",
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBatchData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setBatchData((prev) => ({ ...prev, [name]: value }));
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const csvContent = "data:text/csv;charset=utf-8,Roll Number,Student Name,Email,Phone Number\nCS001,John Doe,john.doe@example.com,+1234567890\nCS002,Jane Smith,jane.smith@example.com,+1234567891\nCS003,Mike Johnson,mike.johnson@example.com,+1234567892";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "batch_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessing(true);
    setErrors([]);

    try {
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate headers
      const requiredHeaders = ['roll number', 'student name', 'email'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
        setIsProcessing(false);
        return;
      }

      const parsedStudents: Student[] = [];
      const validationErrors: string[] = [];

      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(v => v.trim());
        
        if (values.length < 3) continue; // Skip empty rows
        
        const rollNumberIndex = headers.indexOf('roll number');
        const nameIndex = headers.indexOf('student name');
        const emailIndex = headers.indexOf('email');
        const phoneIndex = headers.indexOf('phone number');

        const rollNumber = values[rollNumberIndex];
        const name = values[nameIndex];
        const email = values[emailIndex];
        const phoneNumber = phoneIndex >= 0 ? values[phoneIndex] : '';

        // Validate required fields
        if (!rollNumber || !name || !email) {
          validationErrors.push(`Row ${i + 1}: Missing required information`);
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          validationErrors.push(`Row ${i + 1}: Invalid email format`);
          continue;
        }

        parsedStudents.push({
          id: `student_${i}`,
          rollNumber,
          name,
          email,
          phoneNumber,
        });
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
      }

      setStudents(parsedStudents);
    } catch (error) {
      setErrors(['Error parsing file. Please ensure it\'s a valid CSV file.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!batchData.batchName || !batchData.academicYear || !batchData.semester) {
      alert("Please fill in all required fields");
      return;
    }

    if (students.length === 0) {
      alert("Please upload a student list");
      return;
    }

    try {
      const batchPayload = {
        ...batchData,
        students,
      };

      // Get the token from local storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("You need to be logged in to create a batch");
        router.push("/login");
        return;
      }
      
      // Send data to your API endpoint
      const response = await fetch("http://localhost:5000/api/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(batchPayload),
      });

      const result = await response.json();

      if (result.success) {
        alert("Batch created successfully!");
        router.push("/");
      } else {
        alert(`Failed to create batch: ${result.message}`);
      }
    } catch (error) {
      console.error("Error creating batch:", error);
      alert("An error occurred while creating the batch. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-black dark:via-gray-950 dark:to-slate-950 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 max-w-6xl mx-auto w-full">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-3">
            Create New Batch
          </h1>
          <p className="text-slate-600 dark:text-gray-400">
            Set up a new batch by providing batch details and uploading student information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Batch Details */}
          <Card className="shadow-lg border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200 dark:border-gray-700">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Batch Information
              </CardTitle>
              <CardDescription>
                Fill in the basic details for the new batch
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form className="space-y-6">
                <div className="grid gap-3">
                  <Label htmlFor="batchName">
                    Batch Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="batchName"
                    name="batchName"
                    value={batchData.batchName}
                    onChange={handleChange}
                    placeholder="e.g., Batch A1"
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="academicYear">
                    Academic Year <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="academicYear"
                    value={batchData.academicYear}
                    onValueChange={(value) => handleSelectChange("academicYear", value)}
                    required
                  >
                    <SelectTrigger id="academicYear">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="semester">
                    Semester <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="semester"
                    value={batchData.semester}
                    onValueChange={(value) => handleSelectChange("semester", value)}
                    required
                  >
                    <SelectTrigger id="semester">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id}>
                          {semester.name}
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
                    value={batchData.description}
                    onChange={handleChange}
                    placeholder="Brief description about the batch"
                    rows={3}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="shadow-lg border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200 dark:border-gray-700">
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                Student Information
              </CardTitle>
              <CardDescription>
                Upload an Excel/CSV file with student details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Download Template */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Need a template?
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Download our template to ensure your file has the correct format.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="space-y-4">
                    {uploadedFile ? (
                      <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                        <FileSpreadsheet className="h-8 w-8" />
                        <span className="font-medium">{uploadedFile.name}</span>
                      </div>
                    ) : (
                      <Upload className="h-12 w-12 text-slate-400 mx-auto" />
                    )}
                    
                    <div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="mb-2"
                      >
                        {isProcessing ? "Processing..." : "Choose File"}
                      </Button>
                      <p className="text-sm text-slate-500 dark:text-gray-400">
                        Supports CSV, XLS, and XLSX files
                      </p>
                    </div>
                  </div>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Validation Errors</span>
                    </div>
                    <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Student Count */}
                {students.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      ✓ {students.length} students loaded successfully
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Preview Table */}
        {students.length > 0 && (
          <Card className="mt-6 shadow-lg border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200 dark:border-gray-700">
              <CardTitle>Student Preview</CardTitle>
              <CardDescription>
                Review the student information before creating the batch
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.rollNumber}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phoneNumber || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card className="mt-6 shadow-lg border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardFooter className="flex justify-between pt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              type="submit"
              disabled={!batchData.batchName || !batchData.academicYear || !batchData.semester || students.length === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Create Batch ({students.length} students)
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
