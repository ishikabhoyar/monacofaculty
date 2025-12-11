'use client';

import React, { useState, useEffect, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { Play, Send } from 'lucide-react';
import { getExecutorApiUrl, getExecutorWsUrl } from '@/lib/utils';

interface TestCase {
  id: number;
  input: string;
  expected_output: string;
  is_sample: boolean;
  is_hidden: boolean;
}

interface CodeChallengeProps {
  initialCode?: string;
  onSubmit?: (code: string, language: string) => Promise<void>;
  language?: string;
  testCases?: TestCase[];
}

interface TerminalLine {
  type: 'output' | 'error' | 'system';
  content: string;
}

export const CodeChallenge: React.FC<CodeChallengeProps> = ({ 
  initialCode = '', 
  onSubmit,
  language: initialLanguage = 'javascript',
  testCases = []
}) => {
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<TerminalLine[]>([]);
  const [activeSocket, setActiveSocket] = useState<WebSocket | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Update code when initialCode changes
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  // Update language when initialLanguage changes
  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  // Cleanup WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Get default code template for a language
  const getDefaultTemplate = (lang: string): string => {
    const templates: Record<string, string> = {
      'javascript': '// Write your code here\nconsole.log("Hello, World!");\n',
      'python': '# Write your code here\nprint("Hello, World!")\n',
      'java': 'public class Solution {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}',
      'cpp': '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, World!" << endl;\n  return 0;\n}',
      'c': '#include <stdio.h>\n\nint main() {\n  printf("Hello, World!\\n");\n  return 0;\n}'
    };
    return templates[lang.toLowerCase()] || '// Write your code here\n';
  };

  // Map frontend language names to backend language identifiers
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

    const wsUrl = `${getExecutorWsUrl()}/api/ws/terminal/${id}`;
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
        { type: 'system', content: 'Running code...' }
      ]);
      
      try {
        const response = await fetch(`${getExecutorApiUrl()}/api/submit`, {
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

  // Handle code submission
  const submitCode = async () => {
    if (!onSubmit) {
      setTerminalOutput([
        { type: 'error', content: 'Submit handler not configured' }
      ]);
      return;
    }

    setIsRunning(true);
    setTerminalOutput([
      { type: 'system', content: 'Submitting solution...' }
    ]);
    
    try {
      await onSubmit(code, language);
      setTerminalOutput(prev => [
        ...prev,
        { type: 'system', content: '✓ Submission successful!' }
      ]);
    } catch (error) {
      console.error('Error submitting solution:', error);
      setTerminalOutput(prev => [
        ...prev,
        { type: 'error', content: `Error: ${error instanceof Error ? error.message : String(error)}` }
      ]);
    } finally {
      setIsRunning(false);
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
    <div className="flex flex-col h-full">
      <div className="flex-none border-b bg-background">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1.5 border rounded-md bg-background text-sm"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button 
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              onClick={runCode}
              disabled={isRunning}
            >
              <Play size={14} /> Run
            </button>
            
            <button 
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              onClick={submitCode}
              disabled={isRunning}
            >
              <Send size={14} /> Submit
            </button>
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
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'off',
            wrappingIndent: 'none',
            formatOnPaste: false,
            formatOnType: false,
            acceptSuggestionOnEnter: 'off',
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
          }}
        />
      </div>
      
      {/* Test Cases Section */}
      {testCases && testCases.length > 0 && (
        <div className="flex-none border-t bg-background" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted">
            <span className="text-sm font-medium">Sample Test Cases</span>
          </div>
          <div className="p-3 space-y-3">
            {testCases.map((testCase, index) => (
              <div key={testCase.id} className="border rounded-md p-2 bg-card">
                <div className="text-sm font-medium mb-1">Test Case {index + 1}</div>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Input:</span>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs font-mono">{testCase.input}</pre>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Expected Output:</span>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs font-mono">{testCase.expected_output}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex-none border-t bg-background" style={{ height: '200px' }}>
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted">
          <span className="text-sm font-medium text-foreground">Terminal</span>
        </div>
        <div className="p-2 h-full overflow-auto font-mono text-sm bg-background text-foreground" style={{ height: 'calc(100% - 33px)' }}>
          {terminalOutput.map((line, index) => (
            <div 
              key={index} 
              className={`${
                line.type === 'error' ? 'text-red-400' : 
                line.type === 'system' ? 'text-primary' : 
                'text-foreground'
              }`}
            >
              {line.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CodeChallenge;
