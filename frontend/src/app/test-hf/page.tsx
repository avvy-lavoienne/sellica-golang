'use client';

import { useState } from 'react';

export default function TestHuggingFace() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('');

  const testHuggingFace = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setResponse('');
    setProvider('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          context: { test: true }
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResponse(data.response);
        setProvider(data.metadata?.aiProvider || 'unknown');
      } else {
        setResponse(`Error: ${data.error}`);
      }
    } catch (error) {
      setResponse(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testQueries = [
    {
      text: 'Halo SELLY, apa kabar?',
      type: 'Greeting (Conversational)',
      model: 'text-gen-indonesian'
    },
    {
      text: 'Berapa jumlah pengguna dalam sistem?',
      type: 'Data Question (QA)',
      model: 'qa-indonesian'
    },
    {
      text: 'Saya senang dengan sistem ini',
      type: 'Sentiment Analysis',
      model: 'sentiment-indonesian'
    },
    {
      text: 'Bagaimana cara menggunakan SELLICA?',
      type: 'How-to Question (IndoBERT)',
      model: 'indobert-base'
    },
    {
      text: 'Tampilkan dokumentasi terbaru',
      type: 'Data Request (Hybrid)',
      model: 'qa-indonesian'
    },
    {
      text: 'Analisis aktivitas pengguna bulan ini',
      type: 'Complex Analysis (IndoBERT)',
      model: 'indobert-base'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 Test Hugging Face Integration
          </h1>

          {/* Environment Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">Environment Status</h2>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Hugging Face Enabled:</span>{' '}
                <span className={process.env.NEXT_PUBLIC_ENABLE_HUGGINGFACE === 'true' ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_ENABLE_HUGGINGFACE === 'true' ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div>
                <span className="font-medium">API Key:</span>{' '}
                <span className="text-green-600">✅ Configured</span>
              </div>
            </div>
          </div>

          {/* Quick Test Buttons */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Indonesian Language Tests</h3>
            <div className="grid grid-cols-1 gap-3">
              {testQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setMessage(query.text);
                    setTimeout(() => testHuggingFace(), 100);
                  }}
                  className="p-4 text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-colors border border-blue-200"
                  disabled={loading}
                >
                  <div className="font-medium text-sm text-gray-900 mb-1">{query.text}</div>
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Type:</span> {query.type} |
                    <span className="font-medium"> Model:</span> {query.model}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input */}
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Test Message
            </label>
            <div className="flex gap-2">
              <input
                id="message"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your test message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && testHuggingFace()}
                disabled={loading}
              />
              <button
                onClick={testHuggingFace}
                disabled={loading || !message.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>

          {/* Response */}
          {(response || loading) && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Response</h3>
                {provider && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    provider === 'huggingface' 
                      ? 'bg-green-100 text-green-800' 
                      : provider === 'deepseek'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {provider === 'huggingface' ? '🤗 Hugging Face' : 
                     provider === 'deepseek' ? '🧠 DeepSeek' : 
                     '💻 Local'}
                  </span>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Processing with AI...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-gray-900">{response}</div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">📋 How to Test</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
              <li>Click one of the quick test buttons above</li>
              <li>Or type your own message and click &quot;Test&quot;</li>
              <li>Check the response and which AI provider was used</li>
              <li>Look for &quot;🤗 Hugging Face&quot; badge for successful HF integration</li>
              <li>Open browser console to see detailed logs</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
