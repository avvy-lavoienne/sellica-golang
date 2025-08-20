/**
 * Test Page for Enhanced SELLY Chatbot
 * Tests draggable functionality and clear chat feature
 */

'use client';

import React, { useState } from 'react';
import { ChatbotIntegration } from '@/components/chatbot/ChatbotIntegration';
import { ChatMessage } from '@/types/chatbot';

export default function TestChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Halo! Saya SELLY, asisten data cerdas Anda. Bagaimana saya bisa membantu Anda hari ini?',
      sender: 'selly',
      timestamp: new Date(Date.now() - 60000),
      status: 'sent',
      type: 'text',
    },
    {
      id: '2',
      content: 'Berapa total aktivitas user hari ini?',
      sender: 'user',
      timestamp: new Date(Date.now() - 30000),
      status: 'sent',
      type: 'text',
    },
    {
      id: '3',
      content: 'Berdasarkan data terbaru, terdapat 150 aktivitas user hari ini dengan rincian:\n\n📊 **Kolom yang Relevan:**\n• aktivitas_user.status\n• aktivitas_user.created_at\n• aktivitas_user.operator_id\n\n🔍 **Analisis Lanjutan:**\n• **Trend Analysis**: Aktivitas naik 15% vs kemarin\n• **Anomaly Detection**: Spike aktivitas jam 14:00 terdeteksi\n\n💡 **Saran Optimasi:**\n• Monitor kapasitas sistem saat jam puncak\n• Analisis pola aktivitas untuk optimasi resource',
      sender: 'selly',
      timestamp: new Date(),
      status: 'sent',
      type: 'data',
      metadata: {
        confidence: 0.92,
        dataQuery: JSON.stringify([{ total: 150, success: 120, pending: 20, error: 10 }]),
        suggestions: [
          'Siapa operator yang paling aktif?',
          'Bagaimana trend aktivitas minggu ini?',
          'Ada pola error yang perlu diperhatikan?',
          'Breakdown aktivitas per jam?'
        ],
        schemaInsights: {
          suggestedColumns: ['aktivitas_user.status', 'aktivitas_user.created_at', 'aktivitas_user.operator_id'],
          availableAnalytics: ['COUNT', 'GROUP BY', 'DATE_TRUNC'],
          tableRelationships: ['aktivitas_user → users', 'aktivitas_user → operators'],
          dataQualityNotes: ['Data real-time', 'Akurasi 95%', 'Update setiap 5 menit']
        },
        proactiveInsights: [
          {
            type: 'trend',
            title: 'Peningkatan Aktivitas',
            description: 'Aktivitas user meningkat 15% dibanding kemarin, menunjukkan tren positif engagement',
            query: 'trend aktivitas user 7 hari terakhir',
            confidence: 0.87,
            complexity: 'intermediate'
          },
          {
            type: 'anomaly',
            title: 'Spike Jam 14:00',
            description: 'Terjadi lonjakan aktivitas signifikan pada jam 14:00, perlu investigasi lebih lanjut',
            query: 'detail aktivitas jam 14:00 hari ini',
            confidence: 0.94,
            complexity: 'basic'
          }
        ],
        queryOptimizations: [
          'Gunakan filter waktu spesifik untuk analisis yang lebih akurat',
          'Pertimbangkan grouping berdasarkan operator untuk insight lebih detail'
        ]
      }
    }
  ]);

  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate SELLY response
    setTimeout(() => {
      const sellyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Terima kasih atas pertanyaan Anda: "${message}"\n\nSaya sedang menganalisis data untuk memberikan jawaban yang akurat. Fitur Enhanced Query Intelligence dengan visualizations sedang memproses permintaan Anda.\n\n🔍 **Status Pemrosesan:**\n• Query parsing: ✅ Selesai\n• Schema analysis: ✅ Selesai  \n• Data retrieval: ✅ Selesai\n• Insight generation: ✅ Selesai\n\nSilakan coba pertanyaan lain untuk menguji fitur draggable dan clear chat!`,
        sender: 'selly',
        timestamp: new Date(),
        status: 'sent',
        type: 'text',
        metadata: {
          suggestions: [
            'Coba drag chatbox ini ke posisi lain',
            'Test fitur clear chat dengan tombol trash',
            'Gunakan Ctrl+Shift+Delete untuk clear chat',
            'Eksplorasi fitur Enhanced Query Intelligence'
          ]
        }
      };

      setMessages(prev => [...prev, sellyMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        content: 'Chat berhasil dibersihkan! 🎉\n\nHalo! Saya SELLY, asisten data cerdas Anda. Bagaimana saya bisa membantu Anda hari ini?\n\n✨ **Fitur Baru yang Tersedia:**\n• 🎯 Draggable chatbox - seret untuk memindahkan posisi\n• 🧹 Clear chat - hapus riwayat percakapan\n• 📊 Enhanced visualizations - chart interaktif\n• 🔍 Advanced insights - analisis proaktif\n• 💬 Follow-up questions - eksplorasi terpandu',
        sender: 'selly',
        timestamp: new Date(),
        status: 'sent',
        type: 'text',
        metadata: {
          suggestions: [
            'Test drag functionality',
            'Coba pertanyaan data analysis',
            'Eksplorasi fitur visualisasi',
            'Gunakan keyboard shortcuts'
          ]
        }
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            🚀 SELLY Enhanced Chatbot Test
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
            Test the new draggable functionality and clear chat feature. 
            Drag the chatbox around, try the clear chat button, and explore Enhanced Query Intelligence!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto text-sm">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="font-semibold text-primary mb-2">🎯 Draggable Features</h3>
              <ul className="text-left text-muted-foreground space-y-1">
                <li>• Drag handle di header chat</li>
                <li>• Smooth drag interactions</li>
                <li>• Boundary constraints</li>
                <li>• Position persistence</li>
                <li>• Touch support untuk mobile</li>
              </ul>
            </div>
            
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h3 className="font-semibold text-destructive mb-2">🧹 Clear Chat Features</h3>
              <ul className="text-left text-muted-foreground space-y-1">
                <li>• Clear button di header</li>
                <li>• Confirmation dialog</li>
                <li>• Keyboard shortcut (Ctrl+Shift+Del)</li>
                <li>• Glass-morphism styling</li>
                <li>• Preserve Enhanced Intelligence</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground mb-4">
          <p>Click the chat button to start testing • Drag the chatbox around • Try clearing the chat</p>
        </div>
      </div>

      {/* Enhanced ChatInterface */}
      <ChatbotIntegration
        position="bottom-right"
        userId="test-user"
      />
    </div>
  );
}
