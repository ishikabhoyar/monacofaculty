"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ArrowLeft, Save } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Batch {
  id: string;
  batch_name: string;
  academic_year: string;
  semester: string;
  description?: string;
  created_at: string;
  students?: any[];
}

export default function EditBatchPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.id as string;
  
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    batch_name: '',
    academic_year: '',
    semester: '',
    description: ''
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

      const response = await fetch(`http://localhost:5000/api/batches/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBatch(data.batch);
        setFormData({
          batch_name: data.batch.batch_name,
          academic_year: data.batch.academic_year,
          semester: data.batch.semester,
          description: data.batch.description || ''
        });
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

  // Update batch
  const handleUpdateBatch = async () => {
    if (!formData.batch_name || !formData.academic_year || !formData.semester) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/batches/${batchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push(`/batches/${batchId}`);
      } else {
        alert(data.message || 'Failed to update batch');
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      alert('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Error Loading Batch</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-gray-900 dark:to-black p-4">
      <div className="max-w-2xl mx-auto">
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                Edit Batch
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                Update batch information
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Edit Form */}
        <Card className="shadow-lg border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-white">Batch Information</CardTitle>
            <CardDescription>Update the batch details below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="batch_name">Batch Name *</Label>
                <Input
                  id="batch_name"
                  value={formData.batch_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, batch_name: e.target.value }))}
                  placeholder="e.g., Batch A1"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="academic_year">Academic Year *</Label>
                <Select
                  value={formData.academic_year}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, academic_year: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">First Year</SelectItem>
                    <SelectItem value="second">Second Year</SelectItem>
                    <SelectItem value="third">Third Year</SelectItem>
                    <SelectItem value="fourth">Fourth Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="semester">Semester *</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem1">Semester I</SelectItem>
                    <SelectItem value="sem2">Semester II</SelectItem>
                    <SelectItem value="sem3">Semester III</SelectItem>
                    <SelectItem value="sem4">Semester IV</SelectItem>
                    <SelectItem value="sem5">Semester V</SelectItem>
                    <SelectItem value="sem6">Semester VI</SelectItem>
                    <SelectItem value="sem7">Semester VII</SelectItem>
                    <SelectItem value="sem8">Semester VIII</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for the batch"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateBatch}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Batch Info */}
        <Card className="mt-6 shadow-lg border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Batch Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-gray-500">Batch ID</Label>
                <p className="font-mono text-sm">{batch.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Created Date</Label>
                <p className="text-sm">{new Date(batch.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Total Students</Label>
                <p className="text-sm">{batch.students?.length || 0} students</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <p className="text-sm">{(batch.students?.length || 0) > 0 ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}