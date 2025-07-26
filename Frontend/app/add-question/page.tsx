"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

// Sample test data - would come from your API
const tests = [
  { id: "T001", title: "Calculus I Midterm", course: "MATH101" },
  { id: "T002", title: "Physics II Final", course: "PHYS202" },
  { id: "T003", title: "Chemistry Lab Quiz", course: "CHEM110" },
  { id: "T004", title: "Algebra Basics", course: "MATH099" },
];

// Programming languages allowed
const programmingLanguages = [
  { id: "java", name: "Java" },
  { id: "python", name: "Python" },
  { id: "cpp", name: "C++" },
  { id: "javascript", name: "JavaScript" },
  { id: "csharp", name: "C#" },
];

export default function AddQuestionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("edit");
  const [starterCodeLanguage, setStarterCodeLanguage] = useState("python");
  const [selectedLanguages, setSelectedLanguages] = useState(["python", "java"]);

  const [questionData, setQuestionData] = useState({
    testId: "",
    questionNumber: "",
    title: "",
    problemStatement: "# Question Title\n\nWrite your question here using Markdown.\n\n## Example\n\nYou can include examples, code snippets, and more.\n\n```python\ndef example():\n    return \"Hello World\"\n```",
    sampleInput: "",
    sampleOutput: "",
    constraintsInfo: "",
    maxScore: "10",
    timeLimitSeconds: "30",
    memoryLimitMb: "128",
    starterCode: {
      python: "# Write your Python code here\n\ndef solution():\n    # TODO: Implement your solution\n    pass\n",
      java: "// Write your Java code here\n\npublic class Solution {\n    public static void main(String[] args) {\n        // TODO: Implement your solution\n    }\n}",
      cpp: "// Write your C++ code here\n\n#include <iostream>\n\nint main() {\n    // TODO: Implement your solution\n    return 0;\n}",
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuestionData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setQuestionData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLanguageToggle = (language) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(language)) {
        return prev.filter(lang => lang !== language);
      } else {
        return [...prev, language];
      }
    });
  };

  const handleStarterCodeChange = (language, code) => {
    setQuestionData((prev) => ({
      ...prev,
      starterCode: {
        ...prev.starterCode,
        [language]: code
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!questionData.testId || !questionData.title || !questionData.problemStatement) {
      alert("Please fill in all required fields");
      return;
    }
    
    // In a real application, you would send this data to your API
    // Prepare the data according to your schema
    const formattedData = {
      ...questionData,
      allowedLanguages: selectedLanguages,
    };
    
    console.log("Submitting question data:", formattedData);
    
    // Simulate successful creation and redirect
    setTimeout(() => {
      alert("Question added successfully!");
      router.push("/");
    }, 1000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/")} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <Card className="w-full shadow-md">
          <CardHeader className="border-b">
            <CardTitle>Add New Question</CardTitle>
            <CardDescription>Create a new question for your test using Markdown formatting.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Question Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Question Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="testId">Test <span className="text-red-500">*</span></Label>
                      <Select
                        name="testId"
                        value={questionData.testId}
                        onValueChange={(value) => handleSelectChange("testId", value)}
                        required
                      >
                        <SelectTrigger id="testId">
                          <SelectValue placeholder="Select a test" />
                        </SelectTrigger>
                        <SelectContent>
                          {tests.map((test) => (
                            <SelectItem key={test.id} value={test.id}>
                              {test.title} ({test.course})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="questionNumber">Question Number <span className="text-red-500">*</span></Label>
                      <Input
                        id="questionNumber"
                        name="questionNumber"
                        type="number"
                        value={questionData.questionNumber}
                        onChange={handleChange}
                        placeholder="e.g., 1"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="title">Question Title <span className="text-red-500">*</span></Label>
                    <Input
                      id="title"
                      name="title"
                      value={questionData.title}
                      onChange={handleChange}
                      placeholder="e.g., Array Sum Algorithm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="maxScore">Maximum Score</Label>
                      <Input
                        id="maxScore"
                        name="maxScore"
                        type="number"
                        value={questionData.maxScore}
                        onChange={handleChange}
                        placeholder="e.g., 10"
                        min="1"
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="timeLimitSeconds">Time Limit (seconds)</Label>
                      <Input
                        id="timeLimitSeconds"
                        name="timeLimitSeconds"
                        type="number"
                        value={questionData.timeLimitSeconds}
                        onChange={handleChange}
                        placeholder="e.g., 30"
                        min="1"
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="memoryLimitMb">Memory Limit (MB)</Label>
                      <Input
                        id="memoryLimitMb"
                        name="memoryLimitMb"
                        type="number"
                        value={questionData.memoryLimitMb}
                        onChange={handleChange}
                        placeholder="e.g., 128"
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Problem Statement (Markdown)</h3>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="edit">Edit</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="edit" className="mt-2">
                      <Textarea
                        id="problemStatement"
                        name="problemStatement"
                        value={questionData.problemStatement}
                        onChange={handleChange}
                        className="min-h-[300px] font-mono"
                        placeholder="Write your question in Markdown format..."
                        required
                      />
                    </TabsContent>
                    
                    <TabsContent value="preview" className="mt-2">
                      <Card className="border p-4 min-h-[300px] prose dark:prose-invert max-w-none">
                        {/* In a real app, render markdown here */}
                        <div dangerouslySetInnerHTML={{ 
                          __html: "This is a preview placeholder. In a real application, the Markdown would be rendered here." 
                        }} />
                      </Card>
                    </TabsContent>
                  </Tabs>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="grid gap-3">
                      <Label htmlFor="sampleInput">Sample Input</Label>
                      <Textarea
                        id="sampleInput"
                        name="sampleInput"
                        value={questionData.sampleInput}
                        onChange={handleChange}
                        placeholder="Enter sample input..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid gap-3">
                      <Label htmlFor="sampleOutput">Sample Output</Label>
                      <Textarea
                        id="sampleOutput"
                        name="sampleOutput"
                        value={questionData.sampleOutput}
                        onChange={handleChange}
                        placeholder="Enter expected output..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="constraintsInfo">Constraints</Label>
                    <Textarea
                      id="constraintsInfo"
                      name="constraintsInfo"
                      value={questionData.constraintsInfo}
                      onChange={handleChange}
                      placeholder="Time/space complexity constraints, input ranges, etc."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Allowed Languages & Starter Code */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Programming Languages</h3>
                  
                  <div className="space-y-3">
                    <Label>Allowed Programming Languages</Label>
                    <div className="flex flex-wrap gap-3">
                      {programmingLanguages.map(lang => (
                        <div key={lang.id} className="flex items-center space-x-2 border rounded-md p-2">
                          <Switch 
                            id={`lang-${lang.id}`}
                            checked={selectedLanguages.includes(lang.id)}
                            onCheckedChange={() => handleLanguageToggle(lang.id)}
                          />
                          <Label htmlFor={`lang-${lang.id}`}>{lang.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Starter Code (Optional)</Label>
                      <Select
                        value={starterCodeLanguage}
                        onValueChange={setStarterCodeLanguage}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedLanguages.map(langId => {
                            const language = programmingLanguages.find(l => l.id === langId);
                            return (
                              <SelectItem key={langId} value={langId}>
                                {language?.name || langId}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedLanguages.includes(starterCodeLanguage) && (
                      <Textarea
                        value={questionData.starterCode[starterCodeLanguage] || ''}
                        onChange={(e) => handleStarterCodeChange(starterCodeLanguage, e.target.value)}
                        className="font-mono"
                        placeholder={`Add starter code for ${starterCodeLanguage}...`}
                        rows={8}
                      />
                    )}
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" type="button" onClick={() => router.push("/")}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} type="submit">
              Add Question
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}