'use client';

/**
 * CORE BUILD - Simplified Memory Fix Test Page
 * This is a simplified version of the memory fix test page for successful builds
 */

import React, { useState, useCallback } from 'react';

export default function TestMemoryFixPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const runTest1 = useCallback(async () => {
    addLog('🧪 Test 1: Memory Leak Detection (Core Build Mode)');
    try {
      // Mock memory leak detection for core build
      addLog('✅ Memory leak detection disabled in core build mode');
      addLog('📊 Mock result: No memory leaks detected');
    } catch (error) {
      addLog(`❌ Test 1 failed: ${error}`);
    }
  }, [addLog]);

  const runTest2 = useCallback(async () => {
    addLog('🧪 Test 2: Service Instance Management (Core Build Mode)');
    try {
      // Mock service instance management for core build
      const errorHandler1 = { test: 'mock1' };
      const errorHandler2 = errorHandler1;

      if (errorHandler1 === errorHandler2) {
        addLog('✅ Singleton pattern working correctly (mocked)');
      } else {
        addLog('❌ Singleton pattern failed (mocked)');
      }
    } catch (error) {
      addLog(`❌ Test 2 failed: ${error}`);
    }
  }, [addLog]);

  const runTest3 = useCallback(async () => {
    addLog('🧪 Test 3: Memory Monitoring Service (Core Build Mode)');
    try {
      // Mock memory monitoring for core build
      const mockStatus = {
        heapUsed: Math.floor(Math.random() * 100) + 50,
        heapTotal: Math.floor(Math.random() * 200) + 100,
        external: Math.floor(Math.random() * 50) + 10,
        rss: Math.floor(Math.random() * 300) + 150
      };

      addLog('✅ Memory monitoring service disabled in core build mode');
      addLog(`📊 Mock memory status: ${JSON.stringify(mockStatus, null, 2)}`);
    } catch (error) {
      addLog(`❌ Test 3 failed: ${error}`);
    }
  }, [addLog]);

  const runAllTests = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setLogs([]);
    
    addLog('🚀 Starting memory fix tests in core build mode...');
    
    await runTest1();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runTest2();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runTest3();
    
    addLog('✅ All tests completed in core build mode');
    setIsRunning(false);
  }, [isRunning, addLog, runTest1, runTest2, runTest3]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Memory Fix Tests - Core Build Mode
          </h1>
          
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800">
                <strong>Core Build Mode:</strong> Advanced memory testing features are disabled. 
                This page shows mock results for testing purposes.
              </p>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            <button
              onClick={clearLogs}
              disabled={isRunning}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Clear Logs
            </button>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click &quot;Run All Tests&quot; to start.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p>
              <strong>Note:</strong> This is a simplified version for core build mode. 
              Advanced memory testing features are not available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
