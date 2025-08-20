# SELLY Chatbot - Smart Electronic Liaison for Logical Yielding

SELLY adalah asisten data cerdas yang terintegrasi dengan sistem Sellica untuk memberikan akses mudah dan intuitif ke informasi database menggunakan bahasa Indonesia alami.

## 🚀 Fitur Utama

### 💬 Interface Chat Enterprise
- Desain glass-morphism dengan efek backdrop blur
- Responsif untuk semua ukuran layar (mobile-first)
- Animasi micro yang halus (duration-300)
- Efek border glow yang mengkilap
- Compliance WCAG 2.1 AA untuk aksesibilitas

### 🧠 Kecerdasan Query
- Pemrosesan bahasa Indonesia alami
- Deteksi intent otomatis (statistik, pencarian, bantuan, data)
- Ekstraksi entitas dari query pengguna
- Confidence scoring untuk akurasi respons

### 📊 Integrasi Database Lengkap
- Akses ke semua 9 tabel database
- Statistik real-time sistem
- Pencarian cross-table
- Ringkasan data otomatis
- Monitoring kesehatan sistem

### 🤖 AI-Ready Architecture
- Siap integrasi dengan DeepSeek API
- Fallback ke respons placeholder
- Konfigurasi fleksibel untuk berbagai provider AI
- Context-aware conversation

## 📁 Struktur File

```
src/components/chatbot/
├── ChatInterface.tsx          # Interface chat utama
├── ChatMessage.tsx           # Komponen pesan dan display
├── SellyChat.tsx            # Enhanced chat interface
├── ChatbotIntegration.tsx   # Komponen integrasi utama
├── ChatFeatures.tsx         # Fitur lanjutan dan polish
└── README.md               # Dokumentasi ini

src/contexts/
└── ChatContext.tsx          # State management global

src/hooks/
└── useChatHistory.ts        # Hook untuk riwayat pesan

src/services/chatbot/
├── dataService.ts           # Service akses database
├── aiService.ts             # Layer service AI
└── queryIntelligence.ts     # Pemrosesan query cerdas

src/types/
└── chatbot.ts               # Definisi TypeScript

src/utils/
└── chatUtils.ts             # Fungsi utilitas
```

## 🛠️ Instalasi dan Setup

### 1. Integrasi Dasar

```tsx
import { ChatbotIntegration } from '@/components/chatbot/ChatbotIntegration';

function MyDashboard() {
  return (
    <div>
      {/* Konten dashboard Anda */}
      
      {/* Tambahkan SELLY chatbot */}
      <ChatbotIntegration 
        position="bottom-right"
        userId={currentUser.id}
      />
    </div>
  );
}
```

### 2. Dengan Konfigurasi AI

```tsx
<ChatbotIntegration 
  position="bottom-right"
  userId={currentUser.id}
  apiKey={process.env.DEEPSEEK_API_KEY}
  disabled={false}
/>
```

### 3. Menggunakan Context

```tsx
import { ChatProvider, useChat } from '@/contexts/ChatContext';

function App() {
  return (
    <ChatProvider userId="user123">
      <MyComponent />
    </ChatProvider>
  );
}

function MyComponent() {
  const { sendMessage, messages, isTyping } = useChat();
  
  const handleSend = async () => {
    await sendMessage("Statistik sistem");
  };
  
  return (
    <div>
      <button onClick={handleSend}>Kirim Pesan</button>
      {/* Render messages */}
    </div>
  );
}
```

## 🎯 Cara Penggunaan

### Query yang Didukung

#### 📊 Statistik
```
"statistik sistem"
"ringkasan data"
"jumlah pengguna"
"aktivitas terbaru"
```

#### 🔍 Pencarian
```
"cari John Doe"
"temukan NIK 1234567890"
"cari data dalam tabel profiles"
```

#### 📋 Data Request
```
"tampilkan data salah rekam"
"lihat pengajuan bulanan"
"data dokumentasi"
```

#### ❓ Bantuan
```
"bantuan"
"cara menggunakan SELLY"
"help"
```

### Contoh Interaksi

**User**: "Berikan statistik lengkap sistem"

**SELLY**: 
```
📊 Ringkasan Sistem:
• Total Record: 15,234
• Total Tabel: 9
• Total Pengguna: 156
• Aktivitas Terbaru: 89
• Status Sistem: 🟢 Sangat Baik
```

**User**: "Cari data John Doe"

**SELLY**:
```
🔍 Hasil Pencarian "John Doe":
Ditemukan 3 hasil yang sesuai.

[Tabel data dengan hasil pencarian]
```

## ⚙️ Konfigurasi

### Environment Variables

```env
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_api_key_here

# Chatbot Settings
SELLY_ENABLED=true
SELLY_MAX_MESSAGES=100
SELLY_AUTO_SAVE=true
SELLY_POSITION=bottom-right
```

### Konfigurasi AI Service

```typescript
import { aiService } from '@/services/chatbot/aiService';

// Update konfigurasi
aiService.updateConfig({
  apiKey: 'your-deepseek-api-key',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 1000
});

// Cek status konfigurasi
const isConfigured = aiService.isConfigured();
```

### Kustomisasi UI

```typescript
import { useChatbotIntegration } from '@/components/chatbot/ChatbotIntegration';

function AdminPanel() {
  const { enableChatbot, disableChatbot, updateApiKey } = useChatbotIntegration();
  
  return (
    <div>
      <button onClick={() => enableChatbot('api-key')}>
        Aktifkan SELLY
      </button>
      <button onClick={disableChatbot}>
        Nonaktifkan SELLY
      </button>
    </div>
  );
}
```

## 🧪 Testing

### Manual Testing

```typescript
import { runChatbotTests } from '@/components/chatbot/__tests__/chatbot.test';

// Jalankan test suite lengkap
await runChatbotTests();
```

### Test Scenarios

1. **Functionality Tests**:
   - Chat button interaction
   - Message sending/receiving
   - Query processing
   - Database integration

2. **UI/UX Tests**:
   - Responsive design
   - Accessibility compliance
   - Animation performance
   - Touch interaction

3. **Error Handling**:
   - Network failures
   - Invalid queries
   - Database errors
   - API timeouts

## 🎨 Customization

### Tema dan Styling

```css
/* Custom CSS variables */
:root {
  --selly-primary: #your-color;
  --selly-background: rgba(255, 255, 255, 0.95);
  --selly-border: rgba(0, 0, 0, 0.1);
}
```

### Posisi Chat

```typescript
// Opsi posisi yang tersedia
type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

<ChatbotIntegration position="bottom-left" />
```

### Quick Actions Kustom

```typescript
const customActions: QuickAction[] = [
  {
    id: 'custom',
    label: 'Query Kustom',
    description: 'Deskripsi query kustom',
    icon: '🔧',
    query: 'Query yang akan dikirim',
    category: 'data'
  }
];
```

## 🔧 Troubleshooting

### Masalah Umum

**Chat tidak muncul**:
- Pastikan `enableChatbot={true}` di layout
- Cek console untuk error JavaScript
- Verifikasi import komponen

**Query tidak diproses**:
- Periksa koneksi database
- Cek format query dalam bahasa Indonesia
- Lihat log error di browser console

**AI tidak merespons**:
- Verifikasi API key DeepSeek
- Cek koneksi internet
- Pastikan konfigurasi AI service benar

### Debug Mode

```typescript
// Aktifkan debug logging
localStorage.setItem('selly-debug', 'true');

// Lihat state internal
console.log(chatHistory.exportData());
```

## 📈 Performance Tips

1. **Optimasi Memory**: Set `maxMessages` untuk membatasi riwayat
2. **Lazy Loading**: Komponen chat dimuat saat dibutuhkan
3. **Debounced Save**: Auto-save dengan delay 1 detik
4. **Efficient Queries**: Database query dioptimasi untuk performa

## 🤝 Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test:chatbot
```

### Code Style

- Gunakan TypeScript untuk semua file baru
- Follow existing naming conventions
- Tambahkan JSDoc untuk fungsi public
- Gunakan Indonesian untuk user-facing text

## 📄 License

© 2025 Sellica • All rights reserved

---

**Dibuat dengan ❤️ oleh Tim Sellica**

Untuk pertanyaan atau dukungan, hubungi tim development atau buat issue di repository.
