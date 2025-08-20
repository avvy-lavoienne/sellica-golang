import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lupa Kata Sandi | Sellica',
  description: 'Reset kata sandi untuk aplikasi Sellica - Sistem Elektronik Layanan Kependudukan',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Lupa Kata Sandi
            </h1>
            
            <div className="text-center mb-8">
              <p className="text-gray-600 dark:text-gray-300">
                Masukkan email Anda untuk menerima tautan reset kata sandi
              </p>
            </div>

            <form className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm
                           text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200"
                  placeholder="Masukkan email Anda"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                         text-white font-semibold py-3 px-6 rounded-lg
                         transform transition-all duration-200 hover:scale-105
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         shadow-lg hover:shadow-xl"
              >
                Kirim Tautan Reset
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Ingat kata sandi Anda?{' '}
                <a 
                  href="/login" 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Masuk di sini
                </a>
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Catatan:</strong> Fitur reset kata sandi akan segera tersedia. 
                Untuk saat ini, silakan hubungi administrator sistem untuk bantuan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
