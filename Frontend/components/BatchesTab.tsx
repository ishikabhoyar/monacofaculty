"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {Select, SelectTrigger, SelectItem,SelectValue,SelectContent,SelectGroup,SelectLabel } from "@/components/ui/select";
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
  MoreHorizontal, 
  PlusCircle, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload as UploadIcon, FileText, CheckCircle as CheckCircleIcon, XCircle, AlertTriangle } from "lucide-react";
import { getApiUrl, handleAuthError } from "@/lib/utils";

interface Batch {
  id: string;
  name: string;
  academic_year: string;
  semester: string;
  student_count?: number;
  created_at: string;
  status?: string;
  description?: string;
  students?: any[];
}

interface BatchesTabProps {
  batches?: Batch[];
  onBatchUpdate?: (updatedBatches: Batch[]) => void;
}

export default function BatchesTab({ batches = [], onBatchUpdate }: BatchesTabProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localBatches, setLocalBatches] = useState<Batch[]>(batches);
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [importResults, setImportResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [selectedBatchForImport, setSelectedBatchForImport] = useState<string>('');

  // Fetch batches from backend
  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
        console.log('Batches data received:', data.batches);
        const batchesWithCount = data.batches.map((batch: any) => ({
          ...batch,
          student_count: batch.students?.length || 0,
          status: batch.students?.length > 0 ? 'Active' : 'Inactive'
        }));
        
        console.log('Processed batches:', batchesWithCount);
        setLocalBatches(batchesWithCount);
        onBatchUpdate?.(batchesWithCount);
      } else {
        setError(data.message || 'Failed to fetch batches');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load batches on component mount
  useEffect(() => {
    fetchBatches();
  }, []);

  // Batch management functions
  const handleDeleteBatch = async (batchId: string) => {
    if (!window.confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingBatch(batchId);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${getApiUrl()}/api/batches/${batchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Handle auth errors
      handleAuthError(response);

      const data = await response.json();

      if (response.ok && data.success) {
        // Remove batch from local state
        const updatedBatches = localBatches.filter(batch => batch.id !== batchId);
        setLocalBatches(updatedBatches);
        onBatchUpdate?.(updatedBatches);
      } else {
        alert(data.message || 'Failed to delete batch');
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Network error. Please try again.');
    } finally {
      setDeletingBatch(null);
    }
  };

  const handleViewBatch = (batchId: string) => {
    // Navigate to batch details page
    router.push(`/batches/${batchId}`);
  };

  const handleEditBatch = (batchId: string) => {
    // Navigate to batch edit page
    router.push(`/batches/${batchId}/edit`);
  };

  const handleExportBatch = async (batchId: string) => {
    try {
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
        const batch = data.batch;
        const csvContent = `data:text/csv;charset=utf-8,Roll Number,Student Name,Email,Phone Number\n${
          batch.students?.map((student: any) => 
            `${student.roll_number},${student.name},${student.email},${student.phone_number || ''}`
          ).join('\n') || ''
        }`;
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${batch.name}_students.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(data.message || 'Failed to export batch');
      }
    } catch (error) {
      console.error('Error exporting batch:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleRefresh = () => {
    fetchBatches();
  };

  const handleImportStudents = async (batchId: string) => {
    if (!importFile) return;

    try {
      setImportStatus('uploading');
      setImportProgress(10);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', importFile);

      setImportProgress(30);
      setImportStatus('processing');

      const response = await fetch(`${getApiUrl()}/api/batches/${batchId}/import-students`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      // Handle auth errors
      handleAuthError(response);

      const data = await response.json();

      if (response.ok && data.success) {
        setImportStatus('success');
        setImportProgress(100);
        setImportResults(data.results);
        
        // Refresh batch data
        fetchBatches();
        
        // Close dialog after success
        setTimeout(() => {
          setShowImportDialog(false);
          setImportFile(null);
          setImportStatus('idle');
          setImportProgress(0);
          setImportResults(null);
        }, 3000);
      } else {
        setImportStatus('error');
        setImportResults(data.results || { total: 0, successful: 0, failed: 1, errors: [data.message] });
      }
    } catch (error) {
      console.error('Error importing students:', error);
      setImportStatus('error');
      setImportResults({ total: 1, successful: 0, failed: 1, errors: ['Network error occurred'] });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a CSV or Excel file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setImportFile(file);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manage Batches</h2>
            <p className="text-slate-600 dark:text-gray-400 mt-1">Loading your batches...</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manage Batches</h2>
            <p className="text-slate-600 dark:text-gray-400 mt-1">Error loading batches</p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </div>
        
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-100">Error Loading Batches</h3>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manage Batches</h2>
          <p className="text-slate-600 dark:text-gray-400 mt-1">Create, edit, and manage all your student batches</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            className="shadow-sm hover:shadow-md transition-all duration-200"
          >
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            className="shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Students
          </Button>
          <Button 
            variant="outline"
            onClick={() => {/* Handle export all batches */}}
            className="shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button 
            onClick={() => router.push("/create-batch")}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Batch
          </Button>
        </div>
      </div>
      
      {/* Batch Statistics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Total Batches</p>
                <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">{localBatches.length}</p>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Batches</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {localBatches.filter(b => b.status === 'Active').length}
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Students</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                  {localBatches.reduce((total, batch) => total + (batch.student_count || 0), 0)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
                  {localBatches.filter(b => {
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
      
      {/* Batches Table */}
      <Card className="shadow-lg border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-white">All Batches</CardTitle>
          <CardDescription>Manage your student batches and their information</CardDescription>
        </CardHeader>
        <CardContent>
          {localBatches.length === 0 ? (
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
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead className="font-semibold">Batch ID</TableHead>
                  <TableHead className="font-semibold">Batch Name</TableHead>
                  <TableHead className="font-semibold">Year</TableHead>
                  <TableHead className="font-semibold">Semester</TableHead>
                  <TableHead className="font-semibold">Students</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localBatches.map((batch, index) => (
                  <TableRow 
                    key={batch.id} 
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-200 animate-in fade-in-50"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-mono text-sm font-medium">{batch.id}</TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">{batch.name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                        {batch.academic_year}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full text-sm">
                        {batch.semester}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{batch.student_count || 0}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        batch.status === 'Active' 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                          : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border border-slate-200'
                      }`}>
                        {batch.status || 'Inactive'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 dark:text-gray-400">
                      {new Date(batch.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                            disabled={deletingBatch === batch.id}
                          >
                            <span className="sr-only">Open menu</span>
                            {deletingBatch === batch.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewBatch(batch.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditBatch(batch.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Batch
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportBatch(batch.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Students
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBatch(batch.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            disabled={deletingBatch === batch.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Batch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Import Students Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Students</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to add students to a batch. Download the template first if needed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Selection */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File</Label>
              <div className="flex items-center gap-2">
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {importFile ? importFile.name : 'Choose File'}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Supported formats: CSV, XLS, XLSX (Max 5MB)
              </p>
            </div>

            {/* Batch Selection */}
            <div className="space-y-2">
              <Label>Select Batch</Label>
              <Select onValueChange={(value) => setSelectedBatchForImport(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a batch" />
                </SelectTrigger>
                <SelectContent>
                  {localBatches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.academic_year} - {batch.semester})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Progress */}
            {importStatus !== 'idle' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {importStatus === 'uploading' && <Upload className="h-4 w-4 animate-pulse" />}
                  {importStatus === 'processing' && <FileText className="h-4 w-4 animate-pulse" />}
                  {importStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {importStatus === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                  <span className="text-sm font-medium">
                    {importStatus === 'uploading' && 'Uploading file...'}
                    {importStatus === 'processing' && 'Processing data...'}
                    {importStatus === 'success' && 'Import completed successfully!'}
                    {importStatus === 'error' && 'Import failed'}
                  </span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}

            {/* Results */}
            {importResults && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    <div className="text-lg font-bold text-blue-600">{importResults.total}</div>
                    <div className="text-xs text-blue-600">Total</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    <div className="text-lg font-bold text-green-600">{importResults.successful}</div>
                    <div className="text-xs text-green-600">Success</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    <div className="text-lg font-bold text-red-600">{importResults.failed}</div>
                    <div className="text-xs text-red-600">Failed</div>
                  </div>
                </div>
                
                {importResults.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">Errors:</span>
                    </div>
                    <ul className="text-xs text-red-600 space-y-1">
                      {importResults.errors.slice(0, 3).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {importResults.errors.length > 3 && (
                        <li>• ...and {importResults.errors.length - 3} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportFile(null);
                setImportStatus('idle');
                setImportProgress(0);
                setImportResults(null);
              }}
              disabled={importStatus === 'uploading' || importStatus === 'processing'}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedBatchForImport && handleImportStudents(selectedBatchForImport)}
              disabled={!importFile || !selectedBatchForImport || importStatus === 'uploading' || importStatus === 'processing'}
            >
              {importStatus === 'uploading' || importStatus === 'processing' ? 'Importing...' : 'Import Students'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}