import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | Sellica',
  description: 'Kebijakan privasi untuk aplikasi Sellica - Sistem Elektronik Layanan Kependudukan',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Kebijakan Privasi
            </h1>
            
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Informasi yang Kami Kumpulkan
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, seperti:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Informasi identitas untuk keperluan administrasi kependudukan</li>
                  <li>Data kontak untuk komunikasi layanan</li>
                  <li>Informasi penggunaan aplikasi untuk peningkatan layanan</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Penggunaan Informasi
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Informasi yang kami kumpulkan digunakan untuk:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Menyediakan layanan kependudukan yang diminta</li>
                  <li>Meningkatkan kualitas layanan</li>
                  <li>Komunikasi terkait layanan</li>
                  <li>Kepatuhan terhadap peraturan yang berlaku</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Keamanan Data
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Kami menerapkan langkah-langkah keamanan yang sesuai untuk melindungi informasi pribadi Anda 
                  dari akses, penggunaan, atau pengungkapan yang tidak sah.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Hak Anda
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda. 
                  Untuk melakukan hal tersebut, silakan hubungi kami melalui kontak yang tersedia.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Kontak
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi:
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
