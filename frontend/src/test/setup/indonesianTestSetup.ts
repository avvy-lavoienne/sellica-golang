/**
 * Indonesian Test Setup - Localization Configuration
 * 
 * Configures test environment for Indonesian language and regional settings.
 */

// Set default locale to Indonesian
Object.defineProperty(global, 'navigator', {
  value: {
    language: 'id-ID',
    languages: ['id-ID', 'en-US'],
  },
  writable: true,
});

// Indonesian error messages
const indonesianMessages = {
  authError: 'Gagal masuk - silakan periksa kredensial Anda',
  dataError: 'Gagal memuat data - silakan coba lagi',
  networkError: 'Kesalahan koneksi - periksa koneksi internet Anda',
  validationError: 'Data tidak valid - silakan periksa input Anda',
  successMessage: 'Operasi berhasil',
};

// Make Indonesian messages available globally in tests
(global as any).indonesianMessages = indonesianMessages;

// Set document language
if (typeof document !== 'undefined') {
  document.documentElement.lang = 'id';
}

export {};
