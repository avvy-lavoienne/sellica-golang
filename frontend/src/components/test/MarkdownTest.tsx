"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';

export function MarkdownTest() {
  const testContent = "This is **bold text** and this is *italic text*. Here's a list:\n\n- Item 1\n- Item 2\n- Item 3";
  
  return (
    <div className="p-4 border border-gray-300 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Markdown Test</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Raw Content:</h4>
        <pre className="bg-gray-100 p-2 rounded text-sm">{testContent}</pre>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2">With ReactMarkdown (prose classes):</h4>
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{testContent}</ReactMarkdown>
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2">With ReactMarkdown (no prose classes):</h4>
        <ReactMarkdown>{testContent}</ReactMarkdown>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Manual HTML for comparison:</h4>
        <div>
          This is <strong>bold text</strong> and this is <em>italic text</em>. Here&apos;s a list:
          <ul className="list-disc pl-4 mt-2">
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
