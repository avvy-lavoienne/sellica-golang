# SELLICA Database Schema Report

**Generated:** 7/27/2025, 9:14:48 PM

## Summary

- **Tables:** 10
- **Columns:** 100
- **Relationships:** 6
- **Storage Buckets:** 2

## Tables

### adjudicate_record

- **Type:** BASE TABLE
- **Estimated Rows:** 7
- **Primary Keys:** id

#### Columns

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| user_id | uuid | No | FK → undefined.undefined |
| nik_adjudicate | text | No | - |
| nama_adjudicate | text | No | - |
| nik_pengaju | text | No | - |
| nama_pengaju | text | No | - |
| jenis_eksepsi | text | No | - |
| tanggal_pengajuan | timestamp | No | - |
| created_at | timestamp | No | - |
| is_ready_to_record | boolean | No | - |
| estimasi_tanggal_perekaman | unknown | Yes | - |

### aktivitas_siak

- **Type:** BASE TABLE
- **Estimated Rows:** 7
- **Primary Keys:** id

#### Columns

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| user_id | uuid | No | FK → undefined.undefined |
| total_aktivitas_individu | text | No | - |
| total_aktivitas_keseluruhan | text | No | - |
| fix_anomali_data | text | No | - |
| restore_data_maintenance | text | No | - |
| restore_data_ktp | text | No | - |
| daftar_duplikasi | text | No | - |
| login_user | text | No | - |
| logout_user | text | No | - |
| mutasi_elemen_data | text | No | - |
| bulan_rekapitulasi | text | No | - |
| created_at | timestamp | No | - |

### aktivitas_user

- **Type:** BASE TABLE
- **Estimated Rows:** 0
- **Primary Keys:** None

### dokumentasi

- **Type:** BASE TABLE
- **Estimated Rows:** 9
- **Primary Keys:** id

#### Columns

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| tanggal | timestamp | No | - |
| judul | text | No | - |
| keterangan | text | No | - |
| foto | text | No | - |
| created_by | uuid | No | - |
| created_at | timestamp | No | - |

### duplicate_operator

- **Type:** BASE TABLE
- **Estimated Rows:** 96
- **Primary Keys:** id

#### Columns

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| user_id | uuid | No | FK → undefined.undefined |
| nik_duplicate | text | No | - |
| nama_duplicate | text | No | - |
| nik_operator | text | No | - |
| nama_operator | text | No | - |
| nik_pengaju | text | No | - |
| nama_pengaju | text | No | - |
| tanggal_perekaman | timestamp | No | - |
| tanggal_pengajuan | timestamp | No | - |
| created_at | timestamp | No | - |
| is_ready_to_record | boolean | No | - |
| estimasi_tanggal_perekaman | unknown | Yes | - |

### pending_users

- **Type:** BASE TABLE
- **Estimated Rows:** 8
- **Primary Keys:** id

#### Columns

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| email | text | No | - |
| name | text | No | - |
| password | text | No | - |
| requested_at | timestamp | No | - |
| status | text | No | - |
| approved_at | timestamp | No | - |
| approved_by | uuid | No | - |
| user_metadata | jsonb | No | - |

### pengaduan_bulanan

- **Type:** BASE TABLE
- **Estimated Rows:** 2
- **Primary Keys:** id

#### Columns

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| user_id | uuid | No | FK → undefined.undefined |
| nik_pengaduan | text | No | - |
| nama_pengaduan | text | No | - |
| alasan_pengaduan | text | No | - |
| deskripsi_pengaduan | text | No | - |
| nomor_telepon | text | No | - |
| tindak_lanjut_pengaduan | text | No | - |
| tanggal_pengaduan | timestamp | No | - |
| created_at | timestamp | No | - |

### pengajuan_bulanan

- **Type:** BASE TABLE
- **Estimated Rows:** 2,530
- **Primary Keys:** id

#### Columns

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| user_id | uuid | No | FK → undefined.undefined |
| nik_pengajuan_hapus | text | No | - |
| nama_pengajuan | text | No | - |
| alasan_pengajuan | text | No | - |
| alasan_lainnya | unknown | Yes | - |
| nik_pengaju | text | No | - |
| nama_pengaju | text | No | - |
| tanggal_pengajuan | timestamp | No | - |
| estimasi_tanggal_perekaman | timestamp | No | - |
| is_ready_to_record | boolean | No | - |
| created_at | timestamp | No | - |

### profiles

- **Type:** BASE TABLE
- **Estimated Rows:** 10
- **Primary Keys:** id

#### Columns

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| name | text | No | - |
| nip | text | No | - |
| position | text | No | - |
| avatar_url | unknown | Yes | - |
| updated_at | timestamp | No | - |
| nik | text | No | - |
| role | text | No | - |
| email | text | Yes | - |

### salah_rekam

- **Type:** BASE TABLE
- **Estimated Rows:** 112
- **Primary Keys:** id

#### Columns

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | No | PK |
| user_id | uuid | No | FK → undefined.undefined |
| nik_salah_rekam | text | No | - |
| nama_salah_rekam | text | No | - |
| nik_pemilik_biometric | text | No | - |
| nama_pemilik_biometric | text | No | - |
| nik_pemilik_foto | text | No | - |
| nama_pemilik_foto | text | No | - |
| nik_petugas_rekam | text | No | - |
| nama_petugas_rekam | text | No | - |
| tanggal_perekaman | timestamp | No | - |
| nik_pengaju | text | No | - |
| nama_pengaju | text | No | - |
| created_at | timestamp | No | - |
| is_ready_to_record | boolean | No | - |
| estimasi_tanggal_perekaman | timestamp | No | - |

