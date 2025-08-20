"use client";

import React from 'react';
import { cn } from '@/lib/conn/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

export function MarkdownRenderer({
  content,
  className,
  isUser = false
}: MarkdownRendererProps) {
  // Guard against undefined content
  if (!content) {
    return null;
  }
  // Simple markdown processing for bold text
  const processMarkdown = (text: string): (string | React.ReactElement)[] => {
    // Guard against undefined or null text
    if (!text || typeof text !== 'string') {
      return [''];
    }

    // Replace all **text** patterns with bold elements
    const boldPattern = /\*\*([^*]+)\*\*/g;
    const matches = Array.from(text.matchAll(boldPattern));

    // If we found matches, process them
    if (matches.length > 0) {
      const parts: (string | React.ReactElement)[] = [];
      let lastIndex = 0;

      matches.forEach((match, index) => {
        // Add text before the match
        if (match.index! > lastIndex) {
          parts.push(text.slice(lastIndex, match.index));
        }

        // Add the bold element
        parts.push(
          <strong key={`bold-${index}`} className="font-semibold text-inherit">
            {match[1]}
          </strong>
        );

        lastIndex = match.index! + match[0].length;
      });

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return parts;
    }

    // No bold formatting found, return as is
    return [text];
  };

  return (
    <div className={cn(
      "text-sm leading-relaxed whitespace-pre-wrap",
      isUser
        ? "text-primary-foreground"
        : "text-foreground",
      className
    )}>
      {processMarkdown(content)}
    </div>
  );
}

export default MarkdownRenderer;
