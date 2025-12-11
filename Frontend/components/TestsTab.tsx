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
          <h2 className="text-2xl font-semibold text-[#111A4A] dark:text-foreground">Manage Tests</h2>
          <p className="text-[#7C7F88] dark:text-muted-foreground mt-1">Create, edit, and manage all your tests</p>
        </div>
        <button
          onClick={() => router.push("/create-test")}
          className="bg-[#146e96] hover:bg-[#0f5a7a] text-white transition-all duration-200 px-4 py-2 rounded-lg font-medium"
        >
          Create Test
        </button>
      </div>

      <div className="rounded-[16px] overflow-hidden bg-white dark:bg-card border border-[#e5e5e5] dark:border-border">
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5] dark:border-border">
                <th className="text-left font-semibold py-2 text-[#666666] dark:text-muted-foreground">Test ID</th>
                <th className="text-left font-semibold py-2 text-[#666666] dark:text-muted-foreground">Title</th>
                <th className="text-left font-semibold py-2 text-[#666666] dark:text-muted-foreground">Course</th>
                <th className="text-left font-semibold py-2 text-[#666666] dark:text-muted-foreground">Status</th>
                <th className="text-right font-semibold py-2 text-[#666666] dark:text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {localTests.map((test, index) => (
                <tr
                  key={test.id}
                  className="border-b border-[#e5e5e5] dark:border-border hover:bg-[#fafafa] dark:hover:bg-muted/50"
                >
                  <td className="py-3 font-mono text-sm text-[#7C7F88] dark:text-muted-foreground">{test.id}</td>
                  <td className="py-3 font-medium text-[#111A4A] dark:text-foreground">{test.title}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-[#f0f9ff] text-[#146e96] dark:bg-primary/20 dark:text-primary rounded-full text-sm">
                      {test.course}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      test.status === 'Published'
                        ? 'bg-[#f0fdf4] text-[#10b981] dark:bg-chart-2/20 dark:text-chart-2'
                        : 'bg-[#fffbeb] text-[#f59e0b] dark:bg-chart-4/20 dark:text-chart-4'
                    }`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => router.push(`/tests/${test.id}`)}
                      className="text-[#146e96] hover:text-[#0f5a7a] dark:text-primary dark:hover:text-primary/80 px-3 py-1 rounded font-medium"
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
    </div>
  );
}
