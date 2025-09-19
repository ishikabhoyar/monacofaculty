"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";

const dummyTests = [
  {
    id: "T001",
    title: "Calculus I Midterm",
    course: "MATH101",
    status: "Draft"
  }
];

interface TestsTabProps {
  tests?: any[];
  onTestUpdate?: (updatedTests: any[]) => void;
}

export default function TestsTab({ tests = dummyTests, onTestUpdate }: TestsTabProps) {
  const router = useRouter();
  const [localTests, setLocalTests] = useState(tests);

  useEffect(() => {
    setLocalTests(tests);
  }, [tests]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manage Tests</h2>
          <p className="text-slate-600 dark:text-gray-400 mt-1">Create, edit, and manage all your tests</p>
        </div>
        <button
          onClick={() => router.push("/create-test")}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2 rounded-lg text-white"
        >
          Create Test
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-slate-200 dark:border-gray-800 p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left font-semibold py-2">Test ID</th>
              <th className="text-left font-semibold py-2">Title</th>
              <th className="text-left font-semibold py-2">Course</th>
              <th className="text-left font-semibold py-2">Status</th>
              <th className="text-right font-semibold py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {localTests.map((test, index) => (
              <tr
                key={test.id}
                className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <td className="py-3 font-mono text-sm">{test.id}</td>
                <td className="py-3 font-medium">{test.title}</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                    {test.course}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    test.status === 'Published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {test.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => router.push(`/tests/${test.id}`)}
                    className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
