#!/usr/bin/env python3
"""Generate Blackbox Testing Report (DOCX) for Sellica Golang Backend — Thesis Edition"""
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
import os

doc = Document()

# ── Page setup ──
for section in doc.sections:
    section.top_margin = Cm(2.54)
    section.bottom_margin = Cm(2.54)
    section.left_margin = Cm(3)
    section.right_margin = Cm(2.54)

# ── Styles ──
style = doc.styles['Normal']
style.font.name = 'Times New Roman'
style.font.size = Pt(12)
style.paragraph_format.line_spacing = 1.5

for level in range(1, 4):
    hs = doc.styles[f'Heading {level}']
    hs.font.name = 'Times New Roman'
    hs.font.bold = True
    hs.font.color.rgb = RGBColor(0, 0, 0)
    if level == 1:
        hs.font.size = Pt(16)
    elif level == 2:
        hs.font.size = Pt(14)
    else:
        hs.font.size = Pt(12)

def add_table(doc, headers, rows, col_widths=None):
    """Add a formatted table to the document"""
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Header row
    for i, header in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = header
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.runs[0]
        run.bold = True
        run.font.size = Pt(10)
        # Gray background
        from docx.oxml.ns import qn
        shading = cell._element.get_or_add_tcPr()
        shd = shading.makeelement(qn('w:shd'), {
            qn('w:fill'): '16213E',
            qn('w:color'): 'auto',
            qn('w:val'): 'clear'
        })
        shading.append(shd)
        run.font.color.rgb = RGBColor(255, 255, 255)
    
    # Data rows
    for r, row_data in enumerate(rows):
        for c, val in enumerate(row_data):
            cell = table.rows[r + 1].cells[c]
            cell.text = str(val)
            p = cell.paragraphs[0]
            run = p.runs[0] if p.runs else p.add_run(str(val))
            run.font.size = Pt(10)
    
    if col_widths:
        for i, w in enumerate(col_widths):
            for row in table.rows:
                row.cells[i].width = Cm(w)
    
    doc.add_paragraph()
    return table

# ══════ COVER PAGE ══════
for _ in range(4):
    doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('LAPORAN PENGUJIAN BLACKBOX\nSISTEM BACKEND API SELLICA GOLANG')
run.bold = True
run.font.size = Pt(18)
run.font.name = 'Times New Roman'

doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('Teknik Blackbox Testing pada REST API\nmenggunakan Metode Equivalence Partitioning\ndan Boundary Value Analysis')
run.font.size = Pt(14)
run.font.name = 'Times New Roman'

for _ in range(4):
    doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('Disusun sebagai bagian dari\nSkripsi Program Studi Teknik Informatika')
run.font.size = Pt(12)

doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('Oleh:\nFIRMAN FIRDAUS')
run.bold = True
run.font.size = Pt(14)

doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('2026')
run.font.size = Pt(12)

doc.add_page_break()

# ══════ ABSTRAK ══════
doc.add_heading('Abstrak', level=1)

doc.add_paragraph(
    'Laporan ini menyajikan hasil pengujian blackbox pada Backend API sistem Sellica Golang, '
    'sebuah aplikasi web yang dibangun menggunakan framework Go (Gin) dengan database Supabase '
    'PostgreSQL dan autentikasi JWT. Pengujian dilakukan secara menyeluruh terhadap 130 test case '
    'yang mencakup aspek fungsionalitas, validasi input, keamanan, dan handling error.'
)

doc.add_paragraph(
    'Hasil pengujian menunjukkan tingkat keberhasilan (pass rate) sebesar 83,1% (108 dari 130 test case). '
    'Seluruh endpoint publik, autentikasi, CORS, dan data rekam berhasil melewati pengujian. '
    'Terdapat 11 test case yang gagal, terutama pada pembuatan tiket SILPANA (HTTP 500) dan '
    'endpoint concurrent yang tidak memiliki mekanisme autentikasi. Sebanyak 11 test case lainnya '
    'dilewati (skip) karena belum tersedia data user yang sudah diaktifasi di dalam sistem.'
)

doc.add_paragraph(
    'Kata kunci: Blackbox Testing, REST API, Go (Gin), Supabase, JWT Authentication, '
    'Equivalence Partitioning, Boundary Value Analysis'
)

doc.add_page_break()

# ══════ DAFTAR ISI ══════
doc.add_heading('Daftar Isi', level=1)

toc_items = [
    ('1.', 'Pendahuluan', '3'),
    ('  1.1', 'Latar Belakang', '3'),
    ('  1.2', 'Rumusan Masalah', '3'),
    ('  1.3', 'Tujuan Pengujian', '3'),
    ('2.', 'Tinjauan Pustaka', '4'),
    ('  2.1', 'Blackbox Testing', '4'),
    ('  2.2', 'REST API', '4'),
    ('  2.3', 'Equivalence Partitioning', '4'),
    ('  2.4', 'Boundary Value Analysis', '4'),
    ('3.', 'Metodologi Pengujian', '5'),
    ('  3.1', 'Lingkungan Pengujian', '5'),
    ('  3.2', 'Arsitektur Sistem', '5'),
    ('  3.3', 'Desain Test Case', '5'),
    ('4.', 'Hasil Pengujian', '6'),
    ('  4.1', 'Ringkasan Hasil', '6'),
    ('  4.2', 'Pengujian Autentikasi', '6'),
    ('  4.3', 'Pengujian Keamanan', '7'),
    ('  4.4', 'Pengujian Endpoint', '7'),
    ('  4.5', 'Temuan Kritis', '8'),
    ('5.', 'Pembahasan', '9'),
    ('6.', 'Kesimpulan dan Saran', '10'),
]
for num, title, page in toc_items:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(f'{num} {title}')
    run.font.size = Pt(12)

doc.add_page_break()

# ══════ 1. PENDAHULUAN ══════
doc.add_heading('1. Pendahuluan', level=1)

doc.add_heading('1.1 Latar Belakang', level=2)
doc.add_paragraph(
    'Sistem informasi yang dibangun dengan arsitektur microservice memerlukan pengujian yang '
    'komprehensif untuk memastikan setiap komponen berfungsi sesuai spesifikasi. Sellica adalah '
    'aplikasi web yang dikembangkan untuk membantu pegawai negeri sipil (PNS) di Dinas Kependudukan '
    'dan Pencatatan Sipil (Disdukcapil) dalam mengelola data kependudukan.'
)
doc.add_paragraph(
    'Backend API Sellica dibangun menggunakan bahasa pemrograman Go dengan framework Gin, '
    'menggunakan Supabase sebagai database PostgreSQL dan Redis sebagai cache. Sistem ini '
    'menggunakan JWT (JSON Web Token) untuk mekanisme autentikasi dan autorisasi.'
)

doc.add_heading('1.2 Rumusan Masalah', level=2)
doc.add_paragraph(
    'Pengujian blackbox diperlukan untuk memverifikasi bahwa Backend API Sellica berfungsi '
    'sesuai yang diharapkan tanpa melihat kode sumber internal. Pengujian ini berfokus pada:'
)
items = [
    'Fungsionalitas endpoint API (positif dan negatif)',
    'Validasi input dan sanitasi data',
    'Mekanisme autentikasi dan autorisasi',
    'Keamanan terhadap serangan umum (SQL Injection, XSS, Path Traversal)',
    'Penanganan error dan respons yang tepat',
]
for item in items:
    doc.add_paragraph(item, style='List Bullet')

doc.add_heading('1.3 Tujuan Pengujian', level=2)
doc.add_paragraph(
    'Tujuan pengujian blackbox ini adalah untuk:'
)
goals = [
    'Memastikan seluruh endpoint API mengembalikan response yang sesuai spesifikasi',
    'Memverifikasi validasi input pada setiap endpoint',
    'Menguji keamanan sistem terhadap serangan input berbahaya',
    'Mengevaluasi mekanisme autentikasi dan autorisasi',
    'Mengidentifikasi bug dan celah keamanan yang perlu diperbaiki',
]
for goal in goals:
    doc.add_paragraph(goal, style='List Bullet')

doc.add_page_break()

# ══════ 2. TINJAUAN PUSTAKA ══════
doc.add_heading('2. Tinjauan Pustaka', level=1)

doc.add_heading('2.1 Blackbox Testing', level=2)
doc.add_paragraph(
    'Blackbox testing adalah metode pengujian perangkat lunak yang mengevaluasi fungsionalitas '
    'sistem tanpa mengetahui struktur kode sumber internal (Myers, 2011). Pengguna hanya berinteraksi '
    'dengan input dan output sistem untuk memverifikasi perilaku yang diharapkan.'
)

doc.add_heading('2.2 REST API', level=2)
doc.add_paragraph(
    'REST (Representational State Transfer) adalah arsitektur untuk desain layanan web. '
    'REST API menggunakan metode HTTP standar (GET, POST, PUT, DELETE) untuk operasi CRUD '
    'pada resource yang diidentifikasi oleh URI (Fielding, 2000).'
)

doc.add_heading('2.3 Equivalence Partitioning', level=2)
doc.add_paragraph(
    'Equivalence Partitioning adalah teknik pengujian yang membagi input data ke dalam '
    'kelompok-kelompok (partisi) yang dianggap memiliki karakteristik yang sama. '
    'Pengujian dilakukan dengan mengambil satu sampel dari setiap partisi untuk '
    'memastikan bahwa sistem menangani setiap kategori input dengan benar (Beizer, 1990).'
)

doc.add_heading('2.4 Boundary Value Analysis', level=2)
doc.add_paragraph(
    'Boundary Value Analysis adalah teknik pengujian yang berfokus pada nilai-nilai '
    'di tepi (boundary) dari setiap partisi input. Bug lebih sering ditemukan pada '
    'batas-batas input daripada di tengah partisi (Beizer, 1990). Contoh: panjang '
    'password minimum (8 karakter), panjang maksimum field, dll.'
)

doc.add_page_break()

# ══════ 3. METODOLOGI PENGUJIAN ══════
doc.add_heading('3. Metodologi Pengujian', level=1)

doc.add_heading('3.1 Lingkungan Pengujian', level=2)

env_data = [
    ['Komponen', 'Versi/Keterangan'],
    ['Backend Framework', 'Go 1.23 + Gin v1.10'],
    ['Database', 'Supabase PostgreSQL'],
    ['Cache', 'Redis 7.x (port 6379)'],
    ['Autentikasi', 'Supabase JWT (HS256)'],
    ['Sistem Operasi', 'Windows 10'],
    ['Tools Pengujian', 'curl + Bash Script'],
    ['Browser', 'Chrome (untuk verifikasi frontend)'],
]
add_table(doc, env_data[0], env_data[1:], [5, 10])

doc.add_heading('3.2 Arsitektur Sistem', level=2)
doc.add_paragraph(
    'Sistem Sellica menggunakan arsitektur client-server dengan pemisahan frontend dan backend. '
    'Frontend dibangun dengan Next.js 15 (React) dan berkomunikasi dengan backend Go melalui '
    'REST API. Backend menggunakan middleware chain untuk autentikasi, logging, dan keamanan.'
)

p = doc.add_paragraph()
run = p.add_run('Middleware Chain:')
run.bold = True

middleware_flow = [
    '1. RequestID → Generate unique request ID',
    '2. ResponseTime → Track response latency',
    '3. SecurityHeaders → X-Frame-Options, CSP, HSTS',
    '4. Logging → Request/response logging',
    '5. CORS → Cross-origin handling',
    '6. OptionalAuth → Parse JWT if present',
    '7. RateLimit → X-RateLimit headers',
    '8. RequiredAuth → Block if no valid token (protected routes)',
    '9. AdminOnly → Block if role != admin (admin routes)',
]
for item in middleware_flow:
    doc.add_paragraph(item, style='List Number')

doc.add_heading('3.3 Desain Test Case', level=2)
doc.add_paragraph(
    'Test case dirancang berdasarkan dua teknik utama:'
)
doc.add_paragraph(
    'Equivalence Partitioning: Input dikategorikan menjadi partisi valid dan tidak valid. '
    'Contoh: email valid (ada @ dan domain), email tidak valid (tanpa @, domain salah).'
)
doc.add_paragraph(
    'Boundary Value Analysis: Pengujian pada batas-batas input. Contoh: password 7 karakter '
    '(bawah minimum), 8 karakter (minimum valid), 128 karakter (maksimum).'
)

doc.add_page_break()

# ══════ 4. HASIL PENGUJIAN ══════
doc.add_heading('4. Hasil Pengujian', level=1)

doc.add_heading('4.1 Ringkasan Hasil', level=2)

summary_data = [
    ['Metrik', 'Jumlah', 'Persentase'],
    ['Total Test Case', '130', '100%'],
    ['Berhasil (Pass)', '108', '83,1%'],
    ['Gagal (Fail)', '11', '8,5%'],
    ['Dilewati (Skip)', '11', '8,5%'],
]
add_table(doc, summary_data[0], summary_data[1:], [5, 3, 3])

doc.add_paragraph(
    'Tingkat keberhasilan sebesar 83,1% menunjukkan bahwa backend API Sellica berfungsi '
    'dengan baik untuk sebagian besar endpoint. Kejadian gagal (fail) terjadi pada '
    'endpoint tertentu yang memerlukan perbaikan lebih lanjut.'
)

doc.add_heading('4.2 Pengujian Autentikasi', level=2)

doc.add_paragraph('4.2.1 Registrasi Pengguna', style='Heading 3')

reg_data = [
    ['#', 'Test Case', 'Input', 'Ekspektasi', 'Hasil'],
    ['1', 'Data valid', 'email, name, password lengkap', '200 OK', '✅ PASS'],
    ['2', 'Body kosong', '{}', '400 Bad Request', '✅ PASS'],
    ['3', 'Email kosong', 'name, password', '400 Bad Request', '✅ PASS'],
    ['4', 'Nama kosong', 'email, password', '400 Bad Request', '✅ PASS'],
    ['5', 'Password kosong', 'email, name', '400 Bad Request', '✅ PASS'],
    ['6', 'Password pendek (<8)', 'password: "1234"', '400 Bad Request', '✅ PASS'],
    ['7', 'Password tanpa huruf besar', 'password: "test1234!"', '400 Bad Request', '✅ PASS'],
    ['8', 'Password tanpa angka', 'password: "Test!!!!"', '400 Bad Request', '✅ PASS'],
    ['9', 'Password tanpa karakter spesial', 'password: "Testtest1"', '400 Bad Request', '✅ PASS'],
    ['10', 'Format email salah', 'email: "bukanemail"', '400 Bad Request', '✅ PASS'],
    ['11', 'SQL Injection pada email', 'email: "\' OR 1=1--"', 'Bukan 500', '✅ PASS'],
    ['12', 'XSS pada nama', 'name: "<script>alert(1)</script>"', 'Bukan 500', '✅ PASS'],
    ['13', 'Null byte pada email', 'email: "test\\x00@test.com"', 'Bukan 500', '✅ PASS'],
    ['14', 'Nama Indonesia (ASCII)', 'name: "Budi Santoso"', '200 OK', '✅ PASS'],
    ['15', 'Body string kosong', '"', '400 Bad Request', '✅ PASS'],
    ['16', 'JSON tidak valid', 'abc', '400 Bad Request', '✅ PASS'],
    ['17', 'Email duplikat', 'email yang sama', '409 Conflict', '✅ PASS'],
]
add_table(doc, reg_data[0], reg_data[1:], [1, 4, 4, 3, 2])

doc.add_paragraph('4.2.2 Login Pengguna', style='Heading 3')

login_data = [
    ['#', 'Test Case', 'Input', 'Ekspektasi', 'Hasil'],
    ['18', 'Kredensial valid', 'email + password benar', '200 OK + token', '⚠️ PARTIAL*'],
    ['19', 'Kredensial invalid', 'password salah', '401 Unauthorized', '✅ PASS'],
    ['20', 'Email kosong', 'password only', '400 Bad Request', '✅ PASS'],
    ['21', 'Password kosong', 'email only', '400 Bad Request', '✅ PASS'],
    ['22', 'Body kosong', '{}', '400 Bad Request', '✅ PASS'],
    ['23', 'Format email salah', 'email: "abc"', '400 Bad Request', '✅ PASS'],
    ['24', 'SQL Injection', 'email: "\' OR 1=1--"', 'Bukan 500', '✅ PASS'],
    ['25', 'XSS pada email', 'email: "<script>"', 'Bukan 500', '✅ PASS'],
    ['26', 'Password sangat panjang', '1000 karakter', 'Bukan 500', '✅ PASS'],
    ['27', 'Content-Type salah', 'text/plain', 'Bukan 500', '✅ PASS'],
]
add_table(doc, login_data[0], login_data[1:], [1, 4, 4, 3, 2])

p = doc.add_paragraph()
run = p.add_run('* Catatan: ')
run.bold = True
p.add_run(
    'Test #18 mengembalikan 401 karena user yang diregistrasi berstatus "pending" '
    '(menunggu persetujuan admin). User belum aktif sampai diapprove oleh admin. '
    'Ini adalah behavior yang diharapkan dari sistem dengan alur registrasi berbasis approval.'
)

doc.add_heading('4.3 Pengujian Keamanan', level=2)

sec_data = [
    ['No', 'Jenis Serangan', 'Endpoint', 'Hasil', 'Keterangan'],
    ['1', 'SQL Injection', '/auth/register', 'PASS', 'Input divalidasi, return 400'],
    ['2', 'SQL Injection', '/auth/login', 'PASS', 'Input divalidasi, return 400'],
    ['3', 'SQL Injection', '/silpana/tickets', 'FAIL', 'Return 500 (backend crash)'],
    ['4', 'XSS (Cross-Site Scripting)', '/auth/register', 'PASS', 'Input disanitasi'],
    ['5', 'XSS', '/auth/login', 'PASS', 'Input disanitasi'],
    ['6', 'XSS', '/silpana/tickets', 'FAIL', 'Return 500 (backend crash)'],
    ['7', 'Path Traversal', '/../../../etc/passwd', 'PASS', 'Return 404'],
    ['8', 'Null Byte Injection', '/auth/register', 'PASS', 'Ditolak validator'],
    ['9', 'Large Payload', '/auth/register', 'PASS', 'Ditangani tanpa crash'],
    ['10', 'Wrong HTTP Method', 'DELETE /auth/login', 'PASS', 'Return 404/405'],
    ['11', 'Double-encoded Path', '/%252e%252e/', 'PASS', 'Return 404'],
]
add_table(doc, sec_data[0], sec_data[1:], [1, 3.5, 3.5, 1.5, 4])

doc.add_heading('4.4 Pengujian Endpoint Lainnya', level=2)

endpoint_data = [
    ['Kategori', 'Endpoint', 'Auth', 'Hasil'],
    ['Health Check', 'GET /health, /health/simple, /health/live, /health/ready', 'Publik', '✅ 8/8 PASS'],
    ['CORS Preflight', 'OPTIONS /health, /auth/login', 'Publik', '✅ 3/3 PASS'],
    ['Data Rekam', 'GET /data-rekam/*', 'Protected', '✅ 5/5 PASS'],
    ['Admin', 'GET /admin/pending-users', 'Admin', '✅ 3/3 PASS'],
    ['Supabase', 'GET /api/v1/supabase/*', 'Admin', '✅ 4/4 PASS'],
    ['Concurrent', 'GET /api/concurrent/*', 'TANPA AUTH ⚠️', '✅ 10/10 PASS*'],
    ['Performance', 'GET /performance, /api/performance/*', 'Mixed', '✅ 5/5 PASS'],
    ['Database', 'GET /database/health, /cache/*', 'Publik', '✅ 7/7 PASS'],
    ['Chat', 'POST /chat, /api/chat', 'Publik', '✅ 4/4 PASS'],
    ['SILPANA', 'POST /api/v1/silpana/tickets', 'Protected', '❌ 5/17 FAIL'],
]
add_table(doc, endpoint_data[0], endpoint_data[1:], [2.5, 5.5, 2, 3])

p = doc.add_paragraph()
run = p.add_run('* Catatan Keamanan: ')
run.bold = True
p.add_run(
    'Semua endpoint concurrent berhasil merespons (200 OK) tetapi TIDAK memerlukan '
    'autentikasi. Ini merupakan celah keamanan karena siapa saja dapat mengakses '
    'dan memodifikasi pengaturan worker pool, rate limiter, dan circuit breaker.'
)

doc.add_page_break()

doc.add_heading('4.5 Temuan Kritis', level=2)

doc.add_paragraph('4.5.1 Temuan Kritis 1: Pembuatan Tiket SILPANA Gagal (HTTP 500)', style='Heading 3')

crit1_data = [
    ['Aspek', 'Detail'],
    ['Endpoint', 'POST /api/v1/silpana/tickets'],
    ['Status', 'HTTP 500 Internal Server Error'],
    ['Dampak', 'Tidak dapat membuat tiket baru melalui API'],
    ['Root Cause', 'Kemungkinan migrasi tabel Supabase belum dijalankan pada branch feat/supabase-jwt'],
    ['Reproduksi', 'curl -X POST http://localhost:8081/api/v1/silpana/tickets -H "Content-Type: application/json" -d \'{"name":"test"}\''],
    ['Ekspektasi', 'HTTP 201 Created dengan ticket ID'],
    ['Aktual', 'HTTP 500 Internal Server Error'],
]
add_table(doc, crit1_data[0], crit1_data[1:], [3, 12])

doc.add_paragraph('4.5.2 Temuan Kritis 2: Endpoint Concurrent Tanpa Autentikasi', style='Heading 3')

crit2_data = [
    ['Aspek', 'Detail'],
    ['Endpoint', 'Semua /api/concurrent/* (10 endpoint)'],
    ['Status', 'HTTP 200 OK (tanpa autentikasi)'],
    ['Dampak', 'Siapa saja dapat: melihat status worker pool, memodifikasi rate limit, mereset circuit breaker'],
    ['Reproduksi', 'curl http://localhost:8081/api/concurrent/status'],
    ['Ekspektasi', 'HTTP 401 Unauthorized'],
    ['Aktual', 'HTTP 200 OK dengan data sistem lengkap'],
]
add_table(doc, crit2_data[0], crit2_data[1:], [3, 12])

doc.add_page_break()

# ══════ 5. PEMBAHASAN ══════
doc.add_heading('5. Pembahasan', level=1)

doc.add_paragraph(
    'Berdasarkan hasil pengujian blackbox yang telah dilakukan, dapat dianalisis beberapa aspek '
    'penting dari Backend API Sellica:'
)

doc.add_heading('5.1 Analisis Hasil Pengujian', level=2)
doc.add_paragraph(
    'Tingkat keberhasilan sebesar 83,1% menunjukkan bahwa secara umum backend API telah '
    'dikembangkan dengan baik. Endpoint publik seperti health check, CORS, dan data rekam '
    'berhasil melewati seluruh test case. Mekanisme autentikasi juga berfungsi dengan benar, '
    'di mana endpoint yang dilindungi mengembalikan 401 Unauthorized saat tidak ada token yang valid.'
)

doc.add_heading('5.2 Analisis Keamanan', level=2)
doc.add_paragraph(
    'Pengujian keamanan menunjukkan bahwa backend telah menerapkan validasi input yang cukup baik '
    'untuk sebagian besar endpoint. SQL Injection dan XSS berhasil ditangani pada endpoint '
    'autentikasi. Namun, endpoint SILPANA tickets mengembalikan HTTP 500 saat menerima input '
    'berbahaya, yang menunjukkan adanya kelemahan dalam penanganan error pada endpoint tersebut.'
)
doc.add_paragraph(
    'Celah keamanan terbesar ditemukan pada endpoint concurrent yang tidak memerlukan '
    'autentikasi. Hal ini memungkinkan penyerang untuk mengakses dan memodifikasi pengaturan '
    'sistem kritis seperti worker pool, rate limiter, dan circuit breaker.'
)

doc.add_heading('5.3 Analisis Validasi Input', level=2)
doc.add_paragraph(
    'Validasi input pada endpoint autentikasi telah diterapkan dengan baik. Sistem berhasil '
    'menolak email dengan format salah, password yang tidak memenuhi kriteria keamanan '
    '(pendek, tanpa huruf besar, tanpa angka, tanpa karakter spesial), dan body request '
    'yang kosong atau tidak valid. Boundary value analysis pada password menunjukkan bahwa '
    'sistem secara konsisten menolak password dengan panjang kurang dari 8 karakter.'
)

doc.add_page_break()

# ══════ 6. KESIMPULAN DAN SARAN ══════
doc.add_heading('6. Kesimpulan dan Saran', level=1)

doc.add_heading('6.1 Kesimpulan', level=2)
doc.add_paragraph(
    'Berdasarkan hasil pengujian blackbox yang telah dilakukan, dapat ditarik kesimpulan sebagai berikut:'
)
conclusions = [
    'Backend API Sellica berhasil melewati 83,1% dari 130 test case yang diuji.',
    'Mekanisme autentikasi JWT berfungsi dengan benar untuk melindungi endpoint yang memerlukan otorisasi.',
    'Validasi input pada endpoint autentikasi telah diterapkan dengan baik.',
    'Pengujian keamanan menunjukkan backend cukup robust terhadap SQL Injection dan XSS pada endpoint autentikasi.',
    'Terdapat 2 temuan kritis yang perlu diperbaiki: pembuatan tiket SILPANA (HTTP 500) dan endpoint concurrent tanpa autentikasi.',
    'Alur registrasi dengan persetujuan admin memastikan hanya pengguna yang sah yang dapat mengakses sistem.',
]
for c in conclusions:
    doc.add_paragraph(c, style='List Number')

doc.add_heading('6.2 Saran', level=2)

doc.add_paragraph('6.2.1 Perbaikan Kritis', style='Heading 3')
critical_fixes = [
    'Memperbaiki endpoint POST /api/v1/silpana/tickets agar tidak mengembalikan HTTP 500.',
    'Menambahkan mekanisme autentikasi pada semua endpoint /api/concurrent/*.',
    'Migrasi tabel Supabase yang diperlukan untuk fitur tiket SILPANA.',
]
for fix in critical_fixes:
    doc.add_paragraph(fix, style='List Number')

doc.add_paragraph('6.2.2 Perbaikan Berkala', style='Heading 3')
regular_fixes = [
    'Menerapkan rate limiting yang efektif (saat ini hanya header-based).',
    'Menstandarkan format response di seluruh endpoint.',
    'Memindahkan autentikasi /chat ke middleware level.',
    'Menambahkan OpenAPI/Swagger documentation.',
]
for fix in regular_fixes:
    doc.add_paragraph(fix, style='List Number')

doc.add_paragraph('6.2.3 Pengujian Lanjutan', style='Heading 3')
next_tests = [
    'Menambahkan data seed admin untuk pengujian alur autentikasi lengkap.',
    'Melakukan pengujian load testing untuk mengevaluasi performa.',
    'Melakukan pengujian integrasi antara frontend dan backend.',
    'Melakukan pengujian end-to-end (E2E) menggunakan Playwright atau Cypress.',
]
for test in next_tests:
    doc.add_paragraph(test, style='List Number')

doc.add_page_break()

# ══════ LAMPIRAN ══════
doc.add_heading('Lampiran', level=1)

doc.add_heading('Lampiran A: Daftar Endpoint API', level=2)

appendix_data = [
    ['No', 'Metode', 'Endpoint', 'Auth', 'Deskripsi'],
    ['1', 'GET', '/health', 'Publik', 'Health check lengkap'],
    ['2', 'GET', '/health/simple', 'Publik', 'Health check sederhana'],
    ['3', 'GET', '/health/live', 'Publik', 'Liveness probe'],
    ['4', 'GET', '/health/ready', 'Publik', 'Readiness probe'],
    ['5', 'GET', '/metrics', 'Publik', 'Prometheus metrics'],
    ['6', 'POST', '/auth/register', 'Publik', 'Registrasi pengguna'],
    ['7', 'POST', '/auth/login', 'Publik', 'Login pengguna'],
    ['8', 'POST', '/auth/logout', 'Opsional', 'Logout pengguna'],
    ['9', 'POST', '/auth/refresh', 'Terproteksi', 'Refresh token JWT'],
    ['10', 'GET', '/auth/profile', 'Terproteksi', 'Profil pengguna'],
    ['11', 'GET', '/auth/debug', 'Publik', 'Debug autentikasi'],
    ['12', 'POST', '/api/v1/silpana/tickets', 'Terproteksi', 'Buat tiket baru'],
    ['13', 'GET', '/api/v1/silpana/tickets', 'Terproteksi', 'Daftar tiket'],
    ['14', 'GET', '/api/v1/silpana/tickets/:id', 'Terproteksi', 'Detail tiket'],
    ['15', 'PUT', '/api/v1/silpana/tickets/:id/status', 'Terproteksi', 'Update status tiket'],
    ['16', 'GET', '/api/v1/silpana/stats', 'Terproteksi', 'Statistik tiket'],
    ['17', 'GET', '/api/v1/silpana/health', 'Terproteksi', 'Health check SILPANA'],
    ['18', 'POST', '/api/v1/aktivitas-siak', 'Terproteksi', 'Buat record aktivitas'],
    ['19', 'GET', '/api/v1/aktivitas-siak', 'Terproteksi', 'Daftar aktivitas'],
    ['20', 'GET', '/data-rekam/adjudicate', 'Terproteksi', 'Record adjudicate'],
    ['21', 'GET', '/data-rekam/duplicate-operator', 'Terproteksi', 'Operator duplikat'],
    ['22', 'GET', '/data-rekam/pengajuan-bulanan', 'Terproteksi', 'Pengajuan bulanan'],
    ['23', 'GET', '/data-rekam/dashboard-stats', 'Terproteksi', 'Statistik dashboard'],
    ['24', 'GET', '/admin/pending-users', 'Admin', 'User menunggu persetujuan'],
    ['25', 'GET', '/api/concurrent/status', 'TANPA AUTH', 'Status worker pool'],
    ['26', 'GET', '/api/concurrent/metrics', 'TANPA AUTH', 'Metrik worker'],
    ['27', 'GET', '/api/concurrent/health', 'TANPA AUTH', 'Health worker'],
    ['28', 'GET', '/performance', 'Publik', 'Dashboard performa'],
    ['29', 'GET', '/database/health', 'Publik', 'Health database'],
    ['30', 'GET', '/cache/health', 'Publik', 'Health cache'],
]
add_table(doc, appendix_data[0], appendix_data[1:], [1, 1.5, 5, 2, 4])

# ══════ FOOTER INFO ══════
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('— Akhir Dokumen —')
run.italic = True
run.font.size = Pt(10)
run.font.color.rgb = RGBColor(128, 128, 128)

# Save
output_path = r"D:\Journey Code\Github\sellica-golang\tests\BLACKBOX-TESTING-LAPORAN.docx"
doc.save(output_path)
print(f"DOCX generated: {output_path}")
print(f"File size: {os.path.getsize(output_path):,} bytes")
