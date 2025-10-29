'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Test {
  id: string;
  title: string;
  description: string;
  status: string;
  duration_minutes: number;
  faculty_name: string;
  password_required: boolean;
}

const TestList = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/students/tests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTests(data.tests);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const handleTestClick = (test: Test) => {
    setSelectedTest(test);
    if (test.password_required) {
      setShowPasswordModal(true);
    } else {
      startTest(test.id);
    }
  };

  const startTest = async (testId: string, password: string | null = null) => {
    try {
      const response = await fetch(`/api/students/tests/${testId}/questions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Navigate to the editor with the test data
        window.location.href = `/editor?testId=${testId}&questions=${encodeURIComponent(JSON.stringify(data.questions))}`;
      }
    } catch (error) {
      console.error('Error starting test:', error);
      setError('Failed to start test. Please try again.');
    }
  };

  const handlePasswordSubmit = () => {
    if (password && selectedTest) {
      startTest(selectedTest.id, password);
      setShowPasswordModal(false);
      setPassword('');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Available Tests</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map((test) => (
          <Card key={test.id} className="p-6">
            <h2 className="text-xl font-semibold mb-2">{test.title}</h2>
            <p className="text-gray-600 mb-2">{test.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-2 py-1 rounded-full text-sm ${getStatusBadgeClass(test.status)}`}>
                {test.status}
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                {test.duration_minutes} minutes
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                By {test.faculty_name}
              </span>
              <Button
                onClick={() => handleTestClick(test)}
                disabled={test.status !== 'Active'}
              >
                Start Test
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Test Password</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit}>
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestList;