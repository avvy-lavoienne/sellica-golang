import { ChatMessage, ChatSession } from '@/types/chatbot';

/**
 * Utility functions for chat functionality
 */

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Format message content for sharing
 */
export function formatMessageForSharing(message: ChatMessage): string {
  const timestamp = message.timestamp.toLocaleString('id-ID');
  const sender = message.sender === 'user' ? 'Anda' : 'SELLY';
  
  let content = `[${timestamp}] ${sender}: ${message.content}`;
  
  if (message.metadata?.dataType) {
    content += `\n(Tipe Data: ${message.metadata.dataType})`;
  }
  
  return content;
}

/**
 * Export chat session to text format
 */
export function exportChatSession(session: ChatSession): string {
  const header = `=== Chat Session SELLY ===\n`;
  const sessionInfo = `Sesi: ${session.id}\n`;
  const dateInfo = `Tanggal: ${session.createdAt.toLocaleString('id-ID')}\n`;
  const messageCount = `Total Pesan: ${session.messages.length}\n\n`;
  
  const messages = session.messages
    .map(message => formatMessageForSharing(message))
    .join('\n\n');
  
  return header + sessionInfo + dateInfo + messageCount + messages;
}

/**
 * Export data from message to CSV format
 */
export function exportMessageDataToCSV(message: ChatMessage): string | null {
  if (!message.metadata?.tableData || !Array.isArray(message.metadata.tableData)) {
    return null;
  }
  
  const data = message.metadata.tableData;
  if (data.length === 0) return null;
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  // Convert data to CSV rows
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Download text content as file
 */
export function downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Generate filename for chat export
 */
export function generateChatExportFilename(session: ChatSession, format: 'txt' | 'csv' = 'txt'): string {
  const date = session.createdAt.toISOString().split('T')[0];
  const time = session.createdAt.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `selly-chat-${date}-${time}.${format}`;
}

/**
 * Validate message content
 */
export function validateMessageContent(content: string): {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
} {
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      error: 'Pesan tidak boleh kosong',
      suggestions: ['Ketik pertanyaan atau permintaan Anda']
    };
  }
  
  if (content.length > 1000) {
    return {
      isValid: false,
      error: 'Pesan terlalu panjang (maksimal 1000 karakter)',
      suggestions: ['Bagi pesan menjadi beberapa bagian', 'Gunakan kata-kata yang lebih ringkas']
    };
  }
  
  // Check for potentially harmful content (basic check)
  const suspiciousPatterns = [
    /script\s*>/i,
    /<\s*iframe/i,
    /javascript:/i,
    /on\w+\s*=/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(content))) {
    return {
      isValid: false,
      error: 'Pesan mengandung konten yang tidak diizinkan',
      suggestions: ['Gunakan teks biasa tanpa kode HTML atau JavaScript']
    };
  }
  
  return { isValid: true };
}

/**
 * Extract keywords from message for search
 */
export function extractKeywords(message: string): string[] {
  // Remove common Indonesian stop words
  const stopWords = [
    'dan', 'atau', 'yang', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'dalam',
    'adalah', 'akan', 'telah', 'sudah', 'belum', 'tidak', 'bukan', 'juga', 'saja',
    'ini', 'itu', 'saya', 'anda', 'kita', 'mereka', 'dia', 'nya'
  ];
  
  return message
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 10); // Limit to 10 keywords
}

/**
 * Calculate message similarity for duplicate detection
 */
export function calculateMessageSimilarity(message1: string, message2: string): number {
  const keywords1 = new Set(extractKeywords(message1));
  const keywords2 = new Set(extractKeywords(message2));
  
  const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
  const union = new Set([...keywords1, ...keywords2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Format data for display in chat
 */
export function formatDataForChat(data: any, type: 'table' | 'stats' | 'list' = 'stats'): string {
  if (!data) return 'Tidak ada data tersedia';
  
  if (Array.isArray(data)) {
    if (data.length === 0) return 'Tidak ada data ditemukan';
    
    if (type === 'table') {
      // Format as simple table
      const headers = Object.keys(data[0] || {});
      const maxRows = Math.min(data.length, 5);
      
      let result = `📋 **Data (${data.length} record):**\n\n`;
      
      for (let i = 0; i < maxRows; i++) {
        const row = data[i];
        result += `**Record ${i + 1}:**\n`;
        headers.slice(0, 4).forEach(header => {
          const value = row[header];
          result += `• ${header}: ${value}\n`;
        });
        result += '\n';
      }
      
      if (data.length > maxRows) {
        result += `... dan ${data.length - maxRows} record lainnya\n`;
      }
      
      return result;
    }
    
    if (type === 'list') {
      return `📋 **Daftar (${data.length} item):**\n` +
             data.slice(0, 10).map((item, index) => 
               `${index + 1}. ${typeof item === 'object' ? JSON.stringify(item) : item}`
             ).join('\n') +
             (data.length > 10 ? `\n... dan ${data.length - 10} item lainnya` : '');
    }
  }
  
  if (typeof data === 'object') {
    // Format as stats
    const entries = Object.entries(data).slice(0, 8);
    return '📊 **Statistik:**\n' +
           entries.map(([key, value]) => 
             `• ${key.replace(/_/g, ' ')}: ${typeof value === 'number' ? value.toLocaleString('id-ID') : value}`
           ).join('\n');
  }
  
  return String(data);
}

/**
 * Generate contextual suggestions based on message content
 */
export function generateSuggestions(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('error') || lowerMessage.includes('gagal')) {
    return [
      'Coba refresh halaman dan ulangi',
      'Periksa koneksi internet Anda',
      'Hubungi administrator jika masalah berlanjut'
    ];
  }
  
  if (lowerMessage.includes('cari') || lowerMessage.includes('temukan')) {
    return [
      'Gunakan kata kunci yang lebih spesifik',
      'Coba cari dengan NIK atau nama lengkap',
      'Periksa ejaan kata kunci pencarian'
    ];
  }
  
  if (lowerMessage.includes('statistik') || lowerMessage.includes('ringkasan')) {
    return [
      'Coba tanyakan "statistik pengguna"',
      'Atau "ringkasan data sistem"',
      'Untuk detail tabel: "data salah rekam"'
    ];
  }
  
  return [
    'Coba gunakan pertanyaan yang lebih spesifik',
    'Ketik "bantuan" untuk panduan lengkap',
    'Atau pilih salah satu tombol aksi cepat'
  ];
}

/**
 * Check if message contains sensitive information
 */
export function containsSensitiveInfo(message: string): boolean {
  // Check for patterns that might be NIK, phone numbers, etc.
  const sensitivePatterns = [
    /\b\d{16}\b/, // 16-digit numbers (potential NIK)
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card pattern
    /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/, // Phone number pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
  ];
  
  return sensitivePatterns.some(pattern => pattern.test(message));
}

/**
 * Sanitize message content for display
 */
export function sanitizeMessage(message: string): string {
  return message
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date: Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (format === 'relative') {
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID');
  }
  
  if (format === 'long') {
    return date.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Short format (default)
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
}
