'use client';

import React, { useState, useEffect, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { Play, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SubmissionCodeViewerProps {
  submission: {
    submission_id: string;
    student_name: string;
    student_roll: string;
    test_title: string;
    question_text: string;
    submitted_answer: string;
    programming_language: string;
    total_marks: number;
    marks_obtained: number | null;
    batch_name: string;
    submitted_at: string;
  };
  onGrade: (submissionId: string, marks: number) => Promise<void>;
}

interface TerminalLine {
  type: 'output' | 'error' | 'system';
  content: string;
}

const SubmissionCodeViewer: React.FC<SubmissionCodeViewerProps> = ({ submission, onGrade }) => {
  const [code, setCode] = useState(submission.submitted_answer || '');
  const [language, setLanguage] = useState(submission.programming_language || 'javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<TerminalLine[]>([]);
  const [activeSocket, setActiveSocket] = useState<WebSocket | null>(null);
  const [marks, setMarks] = useState<string>(submission.marks_obtained?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Update code if submission changes
  useEffect(() => {
    setCode(submission.submitted_answer || '');
    setLanguage(submission.programming_language || 'javascript');
    setMarks(submission.marks_obtained?.toString() || '');
  }, [submission]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Map language names to backend identifiers
  const getLanguageIdentifier = (uiLanguage: string): string => {
    const languageMap: Record<string, string> = {
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'c++': 'cpp',
      'cpp': 'cpp',
      'c': 'c'
    };
    return languageMap[uiLanguage.toLowerCase()] || uiLanguage.toLowerCase();
  };

  // Reset execution state
  const resetExecutionState = () => {
    setIsRunning(false);
    
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }
    
    setActiveSocket(null);
  };

  // Connect to WebSocket
  const connectToWebSocket = (id: string) => {
    console.log('Connecting to WebSocket with ID:', id);
    
    // Force close any existing connections
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
      
      if (socketRef.current.readyState !== WebSocket.CLOSED) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }
    
    if (activeSocket) {
      setActiveSocket(null);
    }

    const wsUrl = `ws://localhost:8080/api/ws/terminal/${id}`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      setActiveSocket(socket);
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        
        switch (message.type) {
          case 'output':
            setTerminalOutput(prev => [
              ...prev,
              { 
                type: message.content.isError ? 'error' : 'output', 
                content: message.content.text 
              }
            ]);
            break;
            
          case 'input_prompt':
            setTerminalOutput(prev => [
              ...prev,
              { type: 'output', content: message.content }
            ]);
            break;
          
          case 'status':
            let statusText = '';
            let statusValue = '';
            
            if (typeof message.content === 'object') {
              statusText = `Status: ${message.content.status}`;
              statusValue = message.content.status;
            } else {
              statusText = `Status: ${message.content}`;
              statusValue = message.content;
            }
            
            setTerminalOutput(prev => [
              ...prev,
              { type: 'system', content: statusText }
            ]);
            
            if (statusValue.includes('completed') || statusValue.includes('failed')) {
              setTimeout(() => {
                setIsRunning(false);
              }, 500);
            }
            break;
          
          case 'error':
            let errorContent = '';
            if (typeof message.content === 'object' && message.content.message) {
              errorContent = message.content.message;
            } else {
              errorContent = String(message.content);
            }
            
            setTerminalOutput(prev => [
              ...prev,
              { type: 'error', content: errorContent }
            ]);
            
            setTimeout(() => {
              setIsRunning(false);
            }, 500);
            break;
          
          case 'system':
            const systemContent = String(message.content);
            setTerminalOutput(prev => [
              ...prev,
              { type: 'system', content: systemContent }
            ]);
            
            if (systemContent.includes('Connection will close') || 
                systemContent.includes('completed successfully') ||
                systemContent.includes('Execution completed')) {
              setTimeout(() => {
                setIsRunning(false);
              }, 500);
            }
            break;
            
          default:
            console.log('Unknown message type:', message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setTerminalOutput(prev => [
        ...prev,
        { type: 'error', content: 'WebSocket connection error' }
      ]);
      
      setTimeout(() => {
        setIsRunning(false);
      }, 500);
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setActiveSocket(null);
      
      setTimeout(() => {
        resetExecutionState();
      }, 100);
    };
    
    socketRef.current = socket;
    return socket;
  };

  // Handle code execution
  const runCode = async () => {
    console.log('Run button clicked');

    resetExecutionState();
    
    setTimeout(async () => {
      if (activeSocket || socketRef.current) {
        console.warn('Socket still exists after reset, forcing cleanup');
        if (activeSocket && activeSocket.readyState !== WebSocket.CLOSED) {
          activeSocket.close();
        }
        if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
          socketRef.current.close();
        }
        socketRef.current = null;
        setActiveSocket(null);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setIsRunning(true);
      setTerminalOutput([
        { type: 'system', content: 'Running student code...' }
      ]);
      
      try {
        const response = await fetch('http://localhost:8080/api/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            language: getLanguageIdentifier(language),
            input: '',
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        connectToWebSocket(data.id);
        
      } catch (error) {
        console.error('Error submitting code:', error);
        setTerminalOutput(prev => [
          ...prev,
          { type: 'error', content: `Error: ${error instanceof Error ? error.message : String(error)}` }
        ]);
        
        resetExecutionState();
      }
    }, 200);
  };

  // Handle grading
  const handleGrade = async () => {
    const marksValue = parseFloat(marks);
    
    if (isNaN(marksValue) || marksValue < 0 || marksValue > submission.total_marks) {
      setTerminalOutput(prev => [
        ...prev,
        { type: 'error', content: `Please enter a valid score between 0 and ${submission.total_marks}` }
      ]);
      return;
    }

    setIsSaving(true);
    setTerminalOutput(prev => [
      ...prev,
      { type: 'system', content: `Saving marks: ${marksValue}/${submission.total_marks}...` }
    ]);
    
    try {
      console.log('Grading submission:', submission.submission_id, 'with marks:', marksValue);
      await onGrade(submission.submission_id, marksValue);
      setTerminalOutput(prev => [
        ...prev,
        { type: 'system', content: `✓ Marks saved successfully: ${marksValue}/${submission.total_marks}` }
      ]);
    } catch (error) {
      console.error('Error saving marks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save marks. Please try again.';
      setTerminalOutput(prev => [
        ...prev,
        { type: 'error', content: `✗ ${errorMessage}` }
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  // Get editor language mode
  const getEditorLanguage = (lang: string): string => {
    const langMap: Record<string, string> = {
      'c++': 'cpp',
      'cpp': 'cpp',
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'c': 'c'
    };
    return langMap[lang.toLowerCase()] || 'javascript';
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Student Info Header */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-gray-900/50 rounded-lg border border-slate-200 dark:border-gray-800">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Student</p>
          <p className="text-sm font-semibold dark:text-white">{submission.student_name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">{submission.student_roll}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Test</p>
          <p className="text-sm font-semibold dark:text-white">{submission.test_title}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Batch</p>
          <p className="text-sm dark:text-white">{submission.batch_name}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Submitted</p>
          <p className="text-sm dark:text-white">
            {submission.submitted_at 
              ? new Date(submission.submitted_at).toLocaleString()
              : 'N/A'}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Question</p>
          <p className="text-sm dark:text-white">{submission.question_text}</p>
        </div>
      </div>

      {/* Editor Section */}
      <div className="flex-grow flex flex-col border border-slate-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="flex-none border-b bg-background dark:bg-gray-900/50">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Language: <span className="text-blue-600 dark:text-blue-400">{language}</span>
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm"
                className="flex items-center gap-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                onClick={runCode}
                disabled={isRunning}
              >
                <Play size={14} /> {isRunning ? 'Running...' : 'Run Code'}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-grow">
          <Editor
            height="100%"
            language={getEditorLanguage(language)}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: false,
            }}
          />
        </div>
        
        {/* Terminal Output */}
        <div className="flex-none border-t bg-background dark:bg-gray-900/50" style={{ height: '180px' }}>
          <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted dark:bg-gray-800/50">
            <span className="text-xs font-medium">Output</span>
          </div>
          <div className="p-2 h-full overflow-auto font-mono text-xs bg-black text-white" style={{ height: 'calc(100% - 33px)' }}>
            {terminalOutput.length === 0 ? (
              <div className="text-gray-500">Run the code to see output...</div>
            ) : (
              terminalOutput.map((line, index) => (
                <div 
                  key={index} 
                  className={`${
                    line.type === 'error' ? 'text-red-400' : 
                    line.type === 'system' ? 'text-blue-400' : 
                    'text-white'
                  }`}
                >
                  {line.content}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grading Section */}
      <div className="flex items-end gap-4 p-4 bg-slate-50 dark:bg-gray-900/50 rounded-lg border border-slate-200 dark:border-gray-800">
        <div className="flex-1">
          <Label htmlFor="marks" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Award Marks (out of {submission.total_marks})
          </Label>
          <Input
            id="marks"
            type="number"
            min="0"
            max={submission.total_marks}
            step="0.5"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            className="mt-1"
            placeholder={`0 - ${submission.total_marks}`}
          />
        </div>
        <Button 
          onClick={handleGrade}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <CheckCircle size={16} className="mr-1" />
              Save Marks
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SubmissionCodeViewer;
