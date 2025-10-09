id
uuid
Default: gen_random_uuid()
nama_pengaduan
varchar
NULL

kategori_pengaduan
varchar
NULL

alasan_pengaduan
text
NULL

nama_pelapor
varchar
NULL

nik_pengaduan
varchar
NULL

nomor_telepon
varchar
NULL

alamat
text
NULL

ticket_status
varchar
Default: 'submitted'::character varying

priority_level
varchar
Default: 'medium'::character varying

created_at
timestamp

mm/dd/yyyy --:--:-- --

Default: now()

updated_at
timestamp

mm/dd/yyyy --:--:-- --

Default: now()

last_updated
timestamp

mm/dd/yyyy --:--:-- --

Default: now()

Optional Fields
These are columns that do not need any value

email
varchar
NULL

ticket_code
varchar
NULL

assigned_to
varchar
NULL

estimated_resolution
timestamp

mm/dd/yyyy --:--:-- --

actual_resolution
timestamp

mm/dd/yyyy --:--:-- --

resolution_notes
text
NULL

created_by_ip
inet
NULL
sub_kategori_pengaduan
varchar
NULL

deskripsi_pengaduan
text
NULL

tindak_lanjut_pengaduan
text
NULL

tanggal_pengaduan
date

mm/dd/yyyy

is_anonymous
bool

FALSE

FALSE
creator_name
varchar
NULL

user_id
uuid
