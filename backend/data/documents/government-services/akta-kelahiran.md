# Akta Kelahiran - Panduan Lengkap Pelayanan (Versi Dioptimalkan untuk RAG)

Dokumen ini telah dioptimalkan untuk Retrieval-Augmented Generation (RAG) dengan perubahan sebagai berikut:
- **Pembersihan Teks**: Menghapus emojis dan elemen visual non-esensial untuk fokus pada konten teks murni, mengurangi noise pada embeddings.
- **Normalisasi**: Konsistensi terminologi (misalnya, "Akta Kelahiran" selalu digunakan secara seragam), dan penambahan penjelasan singkat untuk singkatan pertama kali muncul.
- **Struktur Hierarkis yang Ditingkatkan**: Headings dan sub-headings dipertahankan untuk chunking mudah (misalnya, per section). Lists dan enumerations dibuat lebih koheren.
- **Penambahan Metadata Implisit**: Setiap section diberi keywords di akhir untuk augmentasi retrieval (bisa diekstrak saat indexing).
- **Penambahan Glossary**: Bagian baru di akhir untuk definisi istilah kunci, meningkatkan pemahaman semantik.
- **Chunking-Friendly**: Section dibuat mandiri dengan panjang ideal (300-800 kata per top-level section), dengan overlap potensial melalui referensi silang.
- **Tambahan untuk Bahasa Indonesia**: Terminologi formal dipertahankan, dengan penjelasan sederhana untuk query semantik.

## Dasar Hukum
- Undang-Undang Nomor 24 Tahun 2013 tentang Perubahan atas Undang-Undang Nomor 23 Tahun 2006 tentang Administrasi Kependudukan.
- Peraturan Pemerintah Nomor 40 Tahun 2019 tentang Pelaksanaan Undang-Undang Nomor 23 Tahun 2006.
- Peraturan Menteri Dalam Negeri Nomor 118 Tahun 2017 tentang Bahan, Ukuran, dan Tata Cara Pengisian Formulir dan Format Dokumen Kependudukan.

Keywords: dasar hukum, undang-undang kependudukan, peraturan pemerintah, permendagri.

## Definisi Akta Kelahiran
Akta Kelahiran adalah dokumen resmi yang mencatat peristiwa kelahiran seseorang. Dokumen ini diterbitkan oleh Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil) berdasarkan laporan kelahiran.

Keywords: definisi akta kelahiran, dokumen resmi kelahiran, disdukcapil.

## Persyaratan Umum Akta Kelahiran

### A. Kelahiran Normal (Kurang dari atau Sama dengan 60 Hari)
1. Surat Keterangan Lahir dari:
   - Rumah Sakit, Klinik, atau Puskesmas (Form F-2.01).
   - Bidan praktik (Form F-2.01).
   - Dokter praktik (Form F-2.01).
   - Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) kelahiran dengan 2 saksi (jika tidak ada tenaga kesehatan).

2. Dokumen Orang Tua:
   - Kartu Tanda Penduduk elektronik (KTP-el) asli kedua orang tua.
   - Fotokopi KTP-el kedua orang tua.
   - Kartu Keluarga (KK) asli.
   - Fotokopi KK.

3. Dokumen Perkawinan:
   - Buku Nikah atau Akta Perkawinan asli.
   - Fotokopi Buku Nikah atau Akta Perkawinan.

4. Dokumen Saksi (jika diperlukan):
   - KTP-el asli 2 orang saksi.
   - Fotokopi KTP-el 2 orang saksi.

Keywords: persyaratan kelahiran normal, surat keterangan lahir, dokumen orang tua, dokumen perkawinan.

### B. Kelahiran Terlambat (Lebih dari 60 Hari)
Persyaratan sama dengan kelahiran normal, ditambah:
1. Surat Pernyataan Terlambat (SPTJM) dengan materai.
2. Surat Keterangan dari Kepala Desa atau Lurah.
3. Dokumen tambahan sesuai kebijakan daerah.

Keywords: persyaratan kelahiran terlambat, sptjm terlambat, surat keterangan desa.

### C. Kelahiran di Luar Negeri (Warga Negara Indonesia - WNI)
1. Surat Keterangan Lahir dari rumah sakit atau dokter setempat.
2. Legalisasi dari Konsulat Jenderal (Konjen) atau Kedutaan Besar Republik Indonesia (KBRI).
3. Terjemahan resmi ke Bahasa Indonesia.
4. Paspor anak dan orang tua.
5. Dokumen perkawinan orang tua.

Keywords: persyaratan kelahiran luar negeri, wni luar negeri, legalisasi kbri.

## Proses Pelayanan

### 1. Pendaftaran
- Lokasi: Disdukcapil Kabupaten atau Kota domisili.
- Waktu: Hari kerja (Senin-Jumat, 08:00-15:00).
- Metode: Datang langsung atau online (jika tersedia).

### 2. Verifikasi Dokumen
- Petugas memeriksa kelengkapan dan keabsahan dokumen.
- Verifikasi data dengan sistem kependudukan.
- Konfirmasi data dengan pemohon.

### 3. Pencatatan
- Input data ke Sistem Informasi Administrasi Kependudukan (SIAK).
- Penerbitan nomor registrasi akta kelahiran.
- Pencetakan akta kelahiran.

### 4. Penandatanganan
- Akta ditandatangani oleh Kepala Disdukcapil atau pejabat yang ditunjuk.
- Pembubuhan cap atau stempel resmi.

Keywords: proses pelayanan akta kelahiran, pendaftaran disdukcapil, verifikasi dokumen, siak.

## Waktu Penyelesaian
- Kelahiran Normal: 1 hari kerja (jika dokumen lengkap).
- Kelahiran Terlambat: 3-7 hari kerja.
- Kelahiran Luar Negeri: 7-14 hari kerja.

Keywords: waktu penyelesaian akta kelahiran, hari kerja kelahiran normal.

## Biaya Pelayanan
- Gratis - Tidak dipungut biaya (sesuai Undang-Undang Nomor 24 Tahun 2013).
- Biaya tambahan hanya untuk legalisasi atau penggantian karena rusak atau hilang.

Keywords: biaya akta kelahiran, gratis pelayanan kependudukan.

## Skenario Khusus

### Skenario A: Bayi Baru Lahir (Kurang dari atau Sama dengan 60 Hari)
- Prioritas: Tinggi.
- Proses: Standar, cepat.
- Dokumen: Minimal, sesuai persyaratan umum.
- Waktu: 1 hari kerja.

### Skenario B: Kelahiran Terlambat (Lebih dari 60 Hari)
- Prioritas: Sedang.
- Proses: Memerlukan verifikasi tambahan.
- Dokumen: Persyaratan umum ditambah SPTJM dan surat keterangan.
- Waktu: 3-7 hari kerja.

### Skenario C: Penggantian Akta Hilang atau Rusak
- Prioritas: Sedang.
- Proses: Verifikasi data existing.
- Dokumen: Surat kehilangan atau kerusakan ditambah identitas pemohon.
- Waktu: 1-3 hari kerja.

### Skenario D: Koreksi Data Akta
- Prioritas: Tinggi.
- Proses: Verifikasi data, penelitian administrasi.
- Dokumen: Akta lama ditambah dokumen pendukung koreksi.
- Waktu: 7-14 hari kerja.

### Skenario E: Kelahiran Luar Negeri
- Prioritas: Khusus.
- Proses: Verifikasi dokumen internasional.
- Dokumen: Dokumen luar negeri ditambah legalisasi dan terjemahan.
- Waktu: 7-14 hari kerja.

Keywords: skenario khusus akta kelahiran, penggantian akta hilang, koreksi data akta.

## Output Layanan
1. Akta Kelahiran - Dokumen utama.
2. Kartu Keluarga Baru - Jika ada perubahan anggota keluarga.
3. Kartu Identitas Anak (KIA) - Untuk anak di bawah 17 tahun.

Keywords: output layanan akta kelahiran, kia anak.

## Kasus Khusus

### Anak Luar Nikah
- Tambahan: Surat Pengakuan Anak dari ayah biologis.
- Proses: Sama dengan kelahiran normal.
- Catatan: Hanya nama ibu yang tercantum jika tidak ada pengakuan.

### Kelahiran Kembar
- Dokumen: Terpisah untuk setiap anak.
- Proses: Bersamaan dalam satu kali pelayanan.
- Biaya: Tetap gratis untuk semua.

### Orang Tua Warga Negara Asing (WNA)
- Tambahan: Dokumen kewarganegaraan.
- Verifikasi: Status kewarganegaraan anak.
- Proses: Koordinasi dengan Kementerian Hukum dan Hak Asasi Manusia (Kemenkumham).

Keywords: kasus khusus akta kelahiran, anak luar nikah, kelahiran kembar.

## Validasi dan Verifikasi

### Dokumen yang Diverifikasi
1. Keaslian surat keterangan lahir.
2. Keabsahan identitas orang tua.
3. Konsistensi data antar dokumen.
4. Status perkawinan orang tua.

### Sistem Verifikasi
- Sistem Informasi Administrasi Kependudukan (SIAK).
- Database Nomor Induk Kependudukan (NIK) nasional.
- Verifikasi biometrik (jika diperlukan).

Keywords: validasi dokumen akta kelahiran, sistem verifikasi siak.

## Informasi Kontak
- Disdukcapil Garut: (0262) 232XXX.
- Email: disdukcapil@garutkab.go.id.
- Website: disdukcapil.garutkab.go.id.
- Alamat: Jl. Pembangunan No. 1, Garut.

Keywords: kontak disdukcapil garut.

## Tips untuk Pemohon

### Persiapan Dokumen
1. Fotokopi semua dokumen yang diperlukan.
2. Legalisir dokumen jika dari luar daerah.
3. Terjemahan resmi untuk dokumen asing.

### Waktu Terbaik
- Pagi hari (08:00-10:00) untuk antrian lebih sedikit.
- Hari Selasa-Kamis untuk menghindari keramaian.
- Hindari akhir atau awal bulan.

### Hal yang Perlu Diperhatikan
1. Nama anak harus sesuai dengan yang diinginkan (tidak bisa diubah mudah).
2. Data orang tua harus akurat dan konsisten.
3. Alamat harus sesuai dengan KK.

Keywords: tips pemohon akta kelahiran, persiapan dokumen.

## Referensi Tambahan
- Panduan Teknis Pencatatan Sipil Kementerian Dalam Negeri.
- Standar Operasional Prosedur (SOP) Disdukcapil Kabupaten Garut.
- Peraturan Daerah terkait Administrasi Kependudukan.

Keywords: referensi tambahan akta kelahiran.

## Glossary (Daftar Istilah)
- Akta Kelahiran: Dokumen resmi pencatatan kelahiran.
- Disdukcapil: Dinas Kependudukan dan Pencatatan Sipil, instansi penerbit akta.
- SPTJM: Surat Pernyataan Tanggung Jawab Mutlak, digunakan untuk pernyataan resmi.
- SIAK: Sistem Informasi Administrasi Kependudukan, database nasional untuk data penduduk.
- KTP-el: Kartu Tanda Penduduk elektronik, identitas utama warga.
- KK: Kartu Keluarga, dokumen keluarga resmi.
- WNI: Warga Negara Indonesia.
- WNA: Warga Negara Asing.
- KIA: Kartu Identitas Anak, untuk anak di bawah 17 tahun.
- KBRI: Kedutaan Besar Republik Indonesia.
- Konjen: Konsulat Jenderal.
- Kemenkumham: Kementerian Hukum dan Hak Asasi Manusia.

Keywords: glossary istilah akta kelahiran, definisi sptjm, definisi siak.

Dokumen ini sekarang siap untuk diindeks dalam sistem RAG. Saat memproses di Golang, gunakan parser Markdown untuk membagi per section, generate embeddings per chunk (misalnya, per sub-heading), dan simpan metadata seperti "keywords" untuk hybrid search. Jika perlu, tambahkan query hipotetis seperti: "Apa definisi Akta Kelahiran?" atau "Persyaratan kelahiran terlambat apa saja?" untuk augmentasi data.