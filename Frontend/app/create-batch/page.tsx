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
import { getApiUrl } from "@/lib/utils";
import { ArrowLeft, Upload, FileSpreadsheet, Download, Users, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

// Sample years, semesters, and courses data
const years = [
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

const courses = [
  { id: "spm", name: "Structure Programming Methodology" },
  { id: "ds", name: "Data Structures" },
  { id: "algo", name: "Algorithms" },
  { id: "dbms", name: "Database Management Systems" },
  { id: "os", name: "Operating Systems" },
  { id: "cn", name: "Computer Networks" },
  { id: "se", name: "Software Engineering" },
  { id: "oop", name: "Object Oriented Programming" },
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
    academic_year: "",
    semester: "",
    course: "",
    description: "",
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBatchData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setBatchData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user makes a selection
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const downloadTemplate = () => {
    // Create a comprehensive CSV template with sample data
    const csvContent = `data:text/csv;charset=utf-8,Roll Number,Student Name,Email,Phone Number
CS2024001,John Doe,john.doe@example.com,+1234567890
CS2024002,Jane Smith,jane.smith@example.com,+1234567891
CS2024003,Mike Johnson,mike.johnson@example.com,+1234567892
CS2024004,Sarah Wilson,sarah.wilson@example.com,+1234567893
CS2024005,David Brown,david.brown@example.com,+1234567894`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_batch_template.csv");
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
      let parsedStudents: Student[] = [];
      const validationErrors: string[] = [];

      if (file.name.endsWith('.csv')) {
        // Handle CSV files
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
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Handle Excel files using FileReader
        const arrayBuffer = await file.arrayBuffer();
        
        // We'll simulate Excel parsing since we can't import xlsx in browser
        // In a real implementation, you'd either:
        // 1. Send the file to backend for processing, or
        // 2. Use a client-side Excel parsing library
        
        // For now, show instructions to use CSV format
        setErrors([
          'Excel files are not fully supported yet. Please convert your Excel file to CSV format.',
          'Steps: Open Excel → File → Save As → Choose CSV (Comma delimited) format'
        ]);

        setIsProcessing(false);
        return;
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
    if (!batchData.batchName || !batchData.academic_year || !batchData.semester || !batchData.course) {
      setErrors(["Please fill in all required fields"]);
      return;
    }

    if (students.length === 0) {
      setErrors(["Please upload a student list"]);
      return;
    }

    try {
      // Set loading state
      setIsProcessing(true);
      
      const batchPayload = {
        batchName: batchData.batchName,
        academicYear: batchData.academic_year,
        semester: batchData.semester,
        course: batchData.course,
        description: batchData.description,
        students: students.map(student => ({
          rollNumber: student.rollNumber,
          name: student.name,
          email: student.email,
          phoneNumber: student.phoneNumber || '',
        })),
      };

      // Get the token from local storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setErrors(["You need to be logged in to create a batch"]);
        router.push("/login");
        return;
      }
      
      // Send data to your API endpoint
      const response = await fetch(`${getApiUrl()}/api/batches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(batchPayload),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Success - redirect to dashboard or batch details
        router.push("/");
      } else {
        // Handle errors from API
        setErrors([data.message || "Failed to create batch"]);
      }
    } catch (error) {
      console.error("Error creating batch:", error);
      setErrors(["An unexpected error occurred. Please try again."]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-4 pb-10">
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
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Create New Batch
          </h1>
          <p className="text-muted-foreground">
            Set up a new batch by providing batch details and uploading student information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Batch Details */}
          <Card className="shadow-lg border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
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
                  <Label htmlFor="academic_year">
                    Year <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="academic_year"
                    value={batchData.academic_year}
                    onValueChange={(value) => handleSelectChange("academic_year", value)}
                    required
                  >
                    <SelectTrigger id="academic_year">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
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
                  <Label htmlFor="course">
                    Course <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="course"
                    value={batchData.course}
                    onValueChange={(value) => handleSelectChange("course", value)}
                    required
                  >
                    <SelectTrigger id="course">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
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
          <Card className="shadow-lg border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-chart-2" />
                Student Information
              </CardTitle>
              <CardDescription>
                Upload an Excel/CSV file with student details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Download Template */}
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <h4 className="font-medium text-foreground mb-2">
                    Need a template?
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download our template to ensure your file has the correct format.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="space-y-4">
                    {uploadedFile ? (
                      <div className="flex items-center justify-center gap-2 text-chart-2">
                        <FileSpreadsheet className="h-8 w-8" />
                        <span className="font-medium">{uploadedFile.name}</span>
                      </div>
                    ) : (
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
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
                      <p className="text-sm text-muted-foreground">
                        Supports CSV, XLS, and XLSX files
                      </p>
                    </div>
                  </div>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Validation Errors</span>
                    </div>
                    <ul className="text-sm text-destructive/80 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Student Count */}
                {students.length > 0 && (
                  <div className="bg-chart-2/10 p-4 rounded-lg border border-chart-2/20">
                    <p className="text-chart-2 font-medium">
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
          <Card className="mt-6 shadow-lg border-border bg-card">
            <CardHeader className="border-b border-border">
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
        <Card className="mt-6 shadow-lg border-border bg-card">
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
              disabled={!batchData.batchName || !batchData.academic_year || !batchData.semester || !batchData.course || students.length === 0}
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
            >
              Create Batch ({students.length} students)
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
