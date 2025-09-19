
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFacultyData, updateFacultyData } from "@/lib/facultyApi";

export default function Settings() {
  const [facultyData, setFacultyData] = useState({
    name: '',
    email: '',
    department: '',
    faculty_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        // Assume the faculty ID and token are stored in localStorage after login
        const facultyId = localStorage.getItem('facultyId');
        const token = localStorage.getItem('token');

        if (facultyId && token) {
          const data = await getFacultyData(facultyId, token);
          setFacultyData(data.faculty);
        } else {
          setError('You are not logged in.');
        }
      } catch (err) {
        setError('Failed to fetch faculty data.');
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFacultyData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const facultyId = localStorage.getItem('facultyId');
      const token = localStorage.getItem('token');

      if (facultyId && token) {
        await updateFacultyData(facultyId, facultyData, token);
        alert('Faculty data updated successfully!');
      } else {
        setError('You are not logged in.');
      }
    } catch (err) {
      setError('Failed to update faculty data.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Faculty Settings</h2>
      <Button
        onClick={handleSubmit}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        Save Changes
      </Button>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      {/* Account Settings */}
      <Card className="dark:bg-[#070c1f] dark:border-gray-800/40">
        <CardHeader>
          <CardTitle className="text-xl text-slate-800 dark:text-white">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={facultyData.name}
              onChange={handleChange}
              placeholder="Dr. John Doe"
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={facultyData.email}
              onChange={handleChange}
              placeholder="john.doe@somaiya.edu"
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Department
            </label>
            <input
              type="text"
              name="department"
              value={facultyData.department}
              onChange={handleChange}
              placeholder="Computer Engineering"
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Faculty ID
            </label>
            <input
              type="text"
              name="faculty_id"
              value={facultyData.faculty_id}
              disabled
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 dark:text-gray-400">Faculty ID cannot be changed</p>
          </div>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card className="dark:bg-[#070c1f] dark:border-gray-800/40">
        <CardHeader>
          <CardTitle className="text-xl text-slate-800 dark:text-white">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-4">
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">Password must be at least 8 characters long and contain a mix of letters, numbers, and special characters.</p>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Update Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
