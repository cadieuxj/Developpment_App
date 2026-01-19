'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Loader2, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  logs: string[];
  executionTime?: number;
}

interface CodeExecutorProps {
  code: string;
  language: string;
  projectId: string;
}

export function CodeExecutor({ code, language, projectId }: CodeExecutorProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);

  const executeCode = async () => {
    setIsExecuting(true);
    setShowOutput(true);
    setResult(null);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          projectId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || 'Execution failed',
          logs: [],
        });
        return;
      }

      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: [],
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const stopExecution = () => {
    // TODO: Implement stop functionality
    setIsExecuting(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {isExecuting ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={stopExecution}
            disabled={!isExecuting}
          >
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={executeCode}
            disabled={isExecuting || !code}
          >
            <Play className="w-4 h-4 mr-2" />
            Run Code
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowOutput(!showOutput)}
        >
          <Terminal className="w-4 h-4 mr-2" />
          {showOutput ? 'Hide' : 'Show'} Output
        </Button>
        {isExecuting && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Executing...
          </div>
        )}
      </div>

      {/* Output Panel */}
      {showOutput && (
        <div className="flex-1 overflow-y-auto bg-gray-900 text-gray-100 p-4 font-mono text-sm">
          {!result && !isExecuting && (
            <div className="text-gray-500">
              Click "Run Code" to execute your code in a secure E2B sandbox.
            </div>
          )}

          {isExecuting && (
            <div className="flex items-center gap-2 text-yellow-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Executing code in sandbox...
            </div>
          )}

          {result && (
            <div className="space-y-2">
              {/* Status */}
              <div
                className={cn(
                  'font-semibold',
                  result.success ? 'text-green-400' : 'text-red-400'
                )}
              >
                {result.success ? '✓ Execution Successful' : '✗ Execution Failed'}
              </div>

              {/* Execution Time */}
              {result.executionTime && (
                <div className="text-gray-400 text-xs">
                  Execution time: {result.executionTime}ms
                </div>
              )}

              {/* Logs */}
              {result.logs && result.logs.length > 0 && (
                <div className="mt-4">
                  <div className="text-blue-400 font-semibold mb-2">Logs:</div>
                  {result.logs.map((log, index) => (
                    <div key={index} className="text-gray-300">
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {/* Output */}
              {result.output && (
                <div className="mt-4">
                  <div className="text-green-400 font-semibold mb-2">Output:</div>
                  <pre className="text-gray-100 whitespace-pre-wrap">
                    {result.output}
                  </pre>
                </div>
              )}

              {/* Error */}
              {result.error && (
                <div className="mt-4">
                  <div className="text-red-400 font-semibold mb-2">Error:</div>
                  <pre className="text-red-300 whitespace-pre-wrap">
                    {result.error}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
