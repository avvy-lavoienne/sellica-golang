'use client';

import React, { useState } from 'react';

export default function DebugChatPage() {
  const [messages, setMessages] = useState<Array<{id: string, content: string, sender: string}>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user'
    };

    console.log('🔍 [DEBUG] Adding user message:', userMessage);
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: {
            userId: 'debug-user',
            timestamp: new Date().toISOString(),
          }
        }),
      });

      const data = await response.json();
      console.log('🔍 [DEBUG] API response:', data);

      if (data.content) {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          content: data.content,
          sender: 'selly'
        };

        console.log('🔍 [DEBUG] Adding AI message:', aiMessage);
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('🔍 [DEBUG] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Chat</h1>
      
      <div className="border rounded-lg p-4 h-96 overflow-y-auto mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet...</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`mb-2 p-2 rounded ${
              message.sender === 'user' ? 'bg-blue-100 ml-8' : 'bg-white mr-8'
            }`}>
              <strong>{message.sender === 'user' ? 'You' : 'SELLY'}:</strong>
              <p>{message.content}</p>
            </div>
          ))
        )}
        {isLoading && (
          <div className="bg-gray-200 mr-8 p-2 rounded">
            <strong>SELLY:</strong>
            <p>Typing...</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !inputValue.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Debug Info:</h3>
        <p>Messages count: {messages.length}</p>
        <p>Is loading: {isLoading.toString()}</p>
        <p>Input value: &quot;{inputValue}&quot;</p>
      </div>
    </div>
  );
}
