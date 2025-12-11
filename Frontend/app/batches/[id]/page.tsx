"use client";

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Users, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  PlusCircle,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  Mail,
  Phone
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getApiUrl, handleAuthError } from "@/lib/utils";

interface Student {
  id: string;
  roll_number: string;
  name: string;
  email: string;
  phone_number?: string;
  created_at: string;
}

interface Batch {
  id: string;
  batch_name: string;
  academic_year: string;
  semester: string;
  description?: string;
  created_at: string;
  students: Student[];
}

export default function BatchDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.id as string;
  
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({
    roll_number: '',
    name: '',
    email: '',
    phone_number: ''
  });

  // Fetch batch details
  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${getApiUrl()}/api/batches/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Handle auth errors
      handleAuthError(response);

      const data = await response.json();

      if (response.ok && data.success) {
        setBatch(data.batch);
      } else {
        setError(data.message || 'Failed to fetch batch details');
      }
    } catch (error) {
      console.error('Error fetching batch details:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add student to batch
  const handleAddStudent = async () => {
    if (!newStudent.roll_number || !newStudent.name || !newStudent.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${getApiUrl()}/api/batches/${batchId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rollNumber: newStudent.roll_number,
          name: newStudent.name,
          email: newStudent.email,
          phoneNumber: newStudent.phone_number
        }),
      });

      // Handle auth errors
      handleAuthError(response);

      const data = await response.json();

      if (response.ok && data.success) {
        setNewStudent({ roll_number: '', name: '', email: '', phone_number: '' });
        setShowAddStudent(false);
        fetchBatchDetails(); // Refresh data
      } else {
        alert(data.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Network error. Please try again.');
    }
  };

  // Update student
  const handleUpdateStudent = async () => {
    if (!editingStudent) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${getApiUrl()}/api/batches/${batchId}/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rollNumber: editingStudent.roll_number,
          name: editingStudent.name,
          email: editingStudent.email,
          phoneNumber: editingStudent.phone_number
        }),
      });

      // Handle auth errors
      handleAuthError(response);

      const data = await response.json();

      if (response.ok && data.success) {
        setEditingStudent(null);
        fetchBatchDetails(); // Refresh data
      } else {
        alert(data.message || 'Failed to update student');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Network error. Please try again.');
    }
  };

  // Delete student
  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${getApiUrl()}/api/batches/${batchId}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Handle auth errors
      handleAuthError(response);

      const data = await response.json();

      if (response.ok && data.success) {
        fetchBatchDetails(); // Refresh data
      } else {
        alert(data.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Network error. Please try again.');
    }
  };

  // Export students to CSV
  const handleExportStudents = () => {
    if (!batch?.students?.length) return;

    const csvContent = `data:text/csv;charset=utf-8,Roll Number,Student Name,Email,Phone Number\n${
      batch.students.map(student => 
        `${student.roll_number},${student.name},${student.email},${student.phone_number || ''}`
      ).join('\n')
    }`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${batch.batch_name}_students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download template
  const handleDownloadTemplate = () => {
    const csvContent = `data:text/csv;charset=utf-8,Roll Number,Student Name,Email,Phone Number\nCS2024001,John Doe,john.doe@example.com,+1234567890\nCS2024002,Jane Smith,jane.smith@example.com,+1234567891`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter students based on search
  const filteredStudents = batch?.students?.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2 text-foreground">Error Loading Batch</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {batch.batch_name}
              </h1>
              <p className="text-muted-foreground">
                {batch.academic_year} • {batch.semester} • {batch.students?.length || 0} students
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => router.push(`/batches/${batchId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Batch
            </Button>
          </div>
        </div>

        {/* Batch Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="bg-card border-border hover-lift transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold text-foreground">{batch.students?.length || 0}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover-lift transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                  <p className="text-2xl font-bold text-foreground">{batch.students?.length || 0}</p>
                </div>
                <div className="p-2 bg-chart-2/10 rounded-lg">
                  <div className="h-4 w-4 bg-chart-2 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover-lift transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-lg font-bold text-foreground">
                    {new Date(batch.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-2 bg-chart-4/10 rounded-lg">
                  <div className="h-4 w-4 bg-chart-4 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover-lift transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Batch ID</p>
                  <p className="text-lg font-bold text-foreground font-mono">{batch.id}</p>
                </div>
                <div className="p-2 bg-chart-5/10 rounded-lg">
                  <div className="h-4 w-4 bg-chart-5 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Management */}
        <Card className="shadow-lg border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Students</CardTitle>
                <CardDescription>Manage students in this batch</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportStudents}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Student</DialogTitle>
                      <DialogDescription>
                        Add a new student to the batch. All fields except phone number are required.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="roll_number">Roll Number *</Label>
                        <Input
                          id="roll_number"
                          value={newStudent.roll_number}
                          onChange={(e) => setNewStudent(prev => ({ ...prev, roll_number: e.target.value }))}
                          placeholder="CS2024001"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={newStudent.name}
                          onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newStudent.email}
                          onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john.doe@example.com"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          value={newStudent.phone_number}
                          onChange={(e) => setNewStudent(prev => ({ ...prev, phone_number: e.target.value }))}
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddStudent(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddStudent}>
                        Add Student
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, roll number, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Students Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono">{student.roll_number}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.phone_number || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingStudent(student)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteStudent(student.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No students found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first student.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Student Dialog */}
        <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>
                Update student information. All fields except phone number are required.
              </DialogDescription>
            </DialogHeader>
            {editingStudent && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_roll_number">Roll Number *</Label>
                  <Input
                    id="edit_roll_number"
                    value={editingStudent.roll_number}
                    onChange={(e) => setEditingStudent(prev => prev ? { ...prev, roll_number: e.target.value } : null)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_name">Full Name *</Label>
                  <Input
                    id="edit_name"
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_email">Email *</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={editingStudent.email}
                    onChange={(e) => setEditingStudent(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_phone_number">Phone Number</Label>
                  <Input
                    id="edit_phone_number"
                    value={editingStudent.phone_number || ''}
                    onChange={(e) => setEditingStudent(prev => prev ? { ...prev, phone_number: e.target.value } : null)}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingStudent(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStudent}>
                Update Student
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}