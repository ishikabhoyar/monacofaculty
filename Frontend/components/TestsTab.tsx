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
          <h2 className="text-2xl font-semibold text-foreground">Manage Tests</h2>
          <p className="text-muted-foreground mt-1">Create, edit, and manage all your tests</p>
        </div>
        <button
          onClick={() => router.push("/create-test")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 px-4 py-2 rounded-lg font-medium active:scale-[0.98]"
        >
          Create Test
        </button>
      </div>

      <div className="rounded-[16px] overflow-hidden bg-card border border-border shadow-sm animate-fadeIn">
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-semibold py-2 text-muted-foreground">Test ID</th>
                <th className="text-left font-semibold py-2 text-muted-foreground">Title</th>
                <th className="text-left font-semibold py-2 text-muted-foreground">Course</th>
                <th className="text-left font-semibold py-2 text-muted-foreground">Status</th>
                <th className="text-right font-semibold py-2 text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {localTests.map((test, index) => (
                <tr
                  key={test.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors duration-150"
                >
                  <td className="py-3 font-mono text-sm text-muted-foreground">{test.id}</td>
                  <td className="py-3 font-medium text-foreground">{test.title}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {test.course}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      test.status === 'Published'
                        ? 'bg-chart-2/10 text-chart-2'
                        : 'bg-chart-4/10 text-chart-4'
                    }`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => router.push(`/tests/${test.id}`)}
                      className="text-primary hover:bg-primary/10 px-3 py-1 rounded font-medium transition-colors duration-150"
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
