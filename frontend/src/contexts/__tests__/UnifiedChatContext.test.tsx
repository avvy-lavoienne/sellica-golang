/**
 * UnifiedChatContext Test Suite
 * Critical-1 Fix Validation: Chat UI Message Disappearance
 * 
 * Tests the unified context provider to ensure messages appear and persist correctly
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedChatProvider, useUnifiedChat } from '../UnifiedChatContext';

// Test component that uses the context
const TestChatComponent: React.FC = () => {
  const { messages, sendMessage, isTyping } = useUnifiedChat();

  return (
    <div>
      <div data-testid="message-count">{messages.length}</div>
      <div data-testid="typing-status">{isTyping ? 'typing' : 'idle'}</div>
      
      {messages.map((message) => (
        <div key={message.id} data-testid={`message-${message.sender}`}>
          {message.content}
        </div>
      ))}
      
      <button
        data-testid="send-button"
        onClick={() => sendMessage('Test message')}
      >
        Send Message
      </button>
    </div>
  );
};

// Mock message handler
const mockMessageHandler = jest.fn().mockResolvedValue('Mock AI response');

describe('UnifiedChatContext - Critical-1 Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  test('should render without errors', () => {
    render(
      <UnifiedChatProvider onMessageSent={mockMessageHandler}>
        <TestChatComponent />
      </UnifiedChatProvider>
    );

    expect(screen.getByTestId('message-count')).toHaveTextContent('0');
    expect(screen.getByTestId('typing-status')).toHaveTextContent('idle');
  });

  test('should add user message immediately (optimistic update)', async () => {
    render(
      <UnifiedChatProvider onMessageSent={mockMessageHandler}>
        <TestChatComponent />
      </UnifiedChatProvider>
    );

    const sendButton = screen.getByTestId('send-button');
    
    // Send message
    fireEvent.click(sendButton);

    // User message should appear immediately
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('1');
      expect(screen.getByTestId('message-user')).toHaveTextContent('Test message');
    });
  });

  test('should add AI response after processing', async () => {
    render(
      <UnifiedChatProvider onMessageSent={mockMessageHandler}>
        <TestChatComponent />
      </UnifiedChatProvider>
    );

    const sendButton = screen.getByTestId('send-button');
    
    // Send message
    fireEvent.click(sendButton);

    // Wait for AI response
    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('2');
      expect(screen.getByTestId('message-selly')).toHaveTextContent('Mock AI response');
    }, { timeout: 3000 });

    // Verify message handler was called
    expect(mockMessageHandler).toHaveBeenCalledWith('Test message');
  });

  test('should show typing indicator during processing', async () => {
    // Delay the mock response
    const delayedHandler = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('Delayed response'), 100))
    );

    render(
      <UnifiedChatProvider onMessageSent={delayedHandler}>
        <TestChatComponent />
      </UnifiedChatProvider>
    );

    const sendButton = screen.getByTestId('send-button');
    
    // Send message
    fireEvent.click(sendButton);

    // Should show typing immediately
    await waitFor(() => {
      expect(screen.getByTestId('typing-status')).toHaveTextContent('typing');
    });

    // Should stop typing after response
    await waitFor(() => {
      expect(screen.getByTestId('typing-status')).toHaveTextContent('idle');
    }, { timeout: 3000 });
  });

  test('should prevent duplicate messages', async () => {
    render(
      <UnifiedChatProvider onMessageSent={mockMessageHandler}>
        <TestChatComponent />
      </UnifiedChatProvider>
    );

    const sendButton = screen.getByTestId('send-button');
    
    // Send same message twice quickly
    fireEvent.click(sendButton);
    fireEvent.click(sendButton);

    // Should only have one user message (duplicate prevention)
    await waitFor(() => {
      const userMessages = screen.getAllByTestId('message-user');
      expect(userMessages).toHaveLength(1);
    });
  });

  test('should handle message sending errors gracefully', async () => {
    const errorHandler = jest.fn().mockRejectedValue(new Error('API Error'));

    render(
      <UnifiedChatProvider onMessageSent={errorHandler}>
        <TestChatComponent />
      </UnifiedChatProvider>
    );

    const sendButton = screen.getByTestId('send-button');
    
    // Send message that will fail
    fireEvent.click(sendButton);

    // Should still show user message
    await waitFor(() => {
      expect(screen.getByTestId('message-user')).toHaveTextContent('Test message');
    });

    // Should stop typing after error
    await waitFor(() => {
      expect(screen.getByTestId('typing-status')).toHaveTextContent('idle');
    }, { timeout: 3000 });
  });

  test('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<TestChatComponent />);
    }).toThrow('useUnifiedChat must be used within a UnifiedChatProvider');

    consoleSpy.mockRestore();
  });
});
