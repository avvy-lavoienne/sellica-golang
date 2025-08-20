import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat dan Ketentuan | Sellica',
  description: 'Syarat dan ketentuan penggunaan aplikasi Sellica - Sistem Elektronik Layanan Kependudukan',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Syarat dan Ketentuan
            </h1>
            
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Penerimaan Syarat
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Dengan menggunakan aplikasi Sellica, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. 
                  Jika Anda tidak menyetujui syarat ini, mohon untuk tidak menggunakan layanan kami.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Penggunaan Layanan
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Aplikasi ini disediakan untuk keperluan layanan kependudukan. Anda setuju untuk:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Menggunakan layanan sesuai dengan peraturan yang berlaku</li>
                  <li>Memberikan informasi yang akurat dan terkini</li>
                  <li>Tidak menyalahgunakan sistem atau data</li>
                  <li>Menjaga kerahasiaan akun dan kata sandi</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Tanggung Jawab Pengguna
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Pengguna bertanggung jawab atas semua aktivitas yang dilakukan menggunakan akun mereka 
                  dan harus segera melaporkan jika terjadi penggunaan yang tidak sah.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Pembatasan Layanan
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Kami berhak untuk membatasi atau menghentikan akses ke layanan jika terjadi pelanggaran 
                  terhadap syarat dan ketentuan ini atau peraturan yang berlaku.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Perubahan Syarat
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Syarat dan ketentuan ini dapat berubah sewaktu-waktu. Perubahan akan diberitahukan 
                  melalui aplikasi atau saluran komunikasi resmi.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Kontak
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Untuk pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi:
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
