import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Cookie | Sellica',
  description: 'Kebijakan penggunaan cookie untuk aplikasi Sellica - Sistem Elektronik Layanan Kependudukan',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Kebijakan Cookie
            </h1>
            
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Apa itu Cookie?
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Cookie adalah file kecil yang disimpan di perangkat Anda ketika mengunjungi situs web. 
                  Cookie membantu kami menyediakan pengalaman yang lebih baik dan personal.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Jenis Cookie yang Kami Gunakan
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cookie Esensial
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Cookie yang diperlukan untuk fungsi dasar aplikasi, termasuk autentikasi dan keamanan sesi.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cookie Fungsional
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Cookie yang menyimpan preferensi Anda seperti tema (gelap/terang) dan pengaturan bahasa.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cookie Analitik
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Cookie yang membantu kami memahami bagaimana Anda menggunakan aplikasi untuk meningkatkan layanan.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Pengelolaan Cookie
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Anda dapat mengelola atau menghapus cookie melalui pengaturan browser Anda. 
                  Namun, menonaktifkan cookie tertentu dapat mempengaruhi fungsionalitas aplikasi.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Cookie Pihak Ketiga
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Kami menggunakan layanan pihak ketiga yang dapat menempatkan cookie di perangkat Anda 
                  untuk keperluan analitik dan peningkatan layanan.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Kontak
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Jika Anda memiliki pertanyaan tentang kebijakan cookie ini, silakan hubungi:
                  <br />
                  <strong>Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut</strong>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
