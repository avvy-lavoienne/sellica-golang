'use client';

import React, { useState } from 'react';
import { UnifiedChatProvider, useUnifiedChat } from '@/contexts/UnifiedChatContext';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * Test Component for Unified Chat Context
 * Validates Critical-1 fix: Chat UI Message Disappearance
 */
function TestChatInterface() {
  const {
    messages,
    sendMessage,
    isTyping,
    loadingStage,
    clearMessages,
    currentSession
  } = useUnifiedChat();

  const [inputValue, setInputValue] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const messageContent = inputValue.trim();
    setInputValue('');

    addTestResult(`Sending message: "${messageContent}"`);
    
    try {
      await sendMessage(messageContent);
      addTestResult(`✅ Message sent successfully`);
    } catch (error) {
      addTestResult(`❌ Error sending message: ${error}`);
    }
  };

  const runAutomatedTests = async () => {
    addTestResult('🧪 Starting automated tests...');
    
    // Test 1: Send message and verify it appears
    addTestResult('Test 1: Message persistence');
    const initialMessageCount = messages.length;
    await sendMessage('Test message 1');
    
    setTimeout(() => {
      if (messages.length > initialMessageCount) {
        addTestResult('✅ Test 1 PASSED: Message appears in state');
      } else {
        addTestResult('❌ Test 1 FAILED: Message not found in state');
      }
    }, 1000);

    // Test 2: Multiple messages
    setTimeout(async () => {
      addTestResult('Test 2: Multiple messages');
      await sendMessage('Test message 2');
      
      setTimeout(() => {
        const hasMultipleMessages = messages.length >= initialMessageCount + 2;
        if (hasMultipleMessages) {
          addTestResult('✅ Test 2 PASSED: Multiple messages persist');
        } else {
          addTestResult('❌ Test 2 FAILED: Messages not persisting correctly');
        }
      }, 1000);
    }, 2000);

    // Test 3: Session continuity
    setTimeout(() => {
      addTestResult('Test 3: Session continuity');
      if (currentSession && currentSession.messages.length > 0) {
        addTestResult('✅ Test 3 PASSED: Session maintains message history');
      } else {
        addTestResult('❌ Test 3 FAILED: Session not maintaining history');
      }
    }, 4000);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h1 className="text-2xl font-bold mb-4">Unified Chat Context Test</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Testing Critical-1 fix: Chat UI Message Disappearance resolution
        </p>

        {/* Test Controls */}
        <div className="flex gap-4 mb-6">
          <Button onClick={runAutomatedTests} variant="default">
            Run Automated Tests
          </Button>
          <Button onClick={clearMessages} variant="outline">
            Clear Messages
          </Button>
          <Button onClick={clearTestResults} variant="outline">
            Clear Test Results
          </Button>
        </div>

        {/* Message Input */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a test message..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
            >
              Send
            </Button>
          </div>
          {isTyping && (
            <p className="text-sm text-blue-600">
              {loadingStage || 'Processing...'}
            </p>
          )}
        </div>

        {/* Messages Display */}
        <div className="border rounded-lg p-4 h-64 overflow-y-auto mb-6 bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold mb-2">Messages ({messages.length}):</h3>
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet...</p>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id}
                className={`mb-2 p-2 rounded ${
                  message.sender === 'user'
                    ? 'bg-blue-100 dark:bg-blue-900 ml-8'
                    : 'bg-white dark:bg-gray-800 mr-8 border'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-sm">
                      {message.sender === 'user' ? 'You' : 'SELLY'}:
                    </strong>
                    <p className="mt-1">{message.content}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Session Info */}
        <div className="border rounded-lg p-4 mb-6 bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold mb-2">Session Info:</h3>
          <div className="text-sm space-y-1">
            <p><strong>Session ID:</strong> {currentSession?.id || 'None'}</p>
            <p><strong>Session Messages:</strong> {currentSession?.messages.length || 0}</p>
            <p><strong>Context Messages:</strong> {messages.length}</p>
            <p><strong>Last Updated:</strong> {currentSession?.updatedAt?.toLocaleString() || 'Never'}</p>
          </div>
        </div>

        {/* Test Results */}
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          <div className="h-32 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm mb-1 font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Test Page with Unified Chat Provider
 */
export default function TestUnifiedChatPage() {
  // Use authenticated user hook to resolve authentication inconsistency
  const { userId, isAuthenticated, isLoading } = useAuthenticatedUser();

  const handleMessageSent = async (message: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Return a test response with user info
    return `Test response to: "${message}". User ID: ${userId.slice(0, 8)}... (${isAuthenticated ? 'authenticated' : 'guest'}). This message should persist in the UI and not disappear.`;
  };

  // Show loading state while determining user authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg">Loading Test Chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <UnifiedChatProvider userId={userId} onMessageSent={handleMessageSent}>
        <TestChatInterface />
      </UnifiedChatProvider>
    </div>
  );
}
