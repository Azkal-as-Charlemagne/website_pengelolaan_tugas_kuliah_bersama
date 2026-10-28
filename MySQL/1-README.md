# Campus Study & Task Management Database

Database relasional untuk aplikasi pengelolaan aktivitas akademik mahasiswa: profil pengguna, institusi pendidikan, mata kuliah, kelompok belajar, tugas personal/kelompok, subtask, dan komentar. Skema ditulis menggunakan SQL bergaya MySQL dan ditujukan untuk dijalankan pada **TiDB**.

> **Status dokumentasi:** README ini mendokumentasikan struktur SQL yang tersedia. Ini bukan klaim bahwa seluruh DDL sudah diuji pada versi TiDB tertentu. Sebelum deployment, jalankan DDL pada database development dan validasi kompatibilitas fungsi, constraint, serta perilaku foreign key/check constraint.

## Daftar Isi

- [1. Ringkasan Proyek](#1-ringkasan-proyek)
- [2. Cakupan Fitur](#2-cakupan-fitur)
- [3. Teknologi dan Asumsi](#3-teknologi-dan-asumsi)
- [4. Arsitektur Data](#4-arsitektur-data)
- [5. Sumber Data Akademik: PDDIKTI](#5-sumber-data-akademik-pddikti)
- [6. Struktur Tabel](#6-struktur-tabel)
- [7. Relasi dan Alur Data](#7-relasi-dan-alur-data)
- [8. Aturan Bisnis yang Tercermin dalam Skema](#8-aturan-bisnis-yang-tercermin-dalam-skema)
- [9. Instalasi di TiDB](#9-instalasi-di-tidb)
- [10. Catatan Kompatibilitas TiDB](#10-catatan-kompatibilitas-tidb)
- [11. Panduan Integrasi Aplikasi](#11-panduan-integrasi-aplikasi)
- [12. Keamanan](#12-keamanan)
- [13. Indeks dan Kinerja](#13-indeks-dan-kinerja)
- [14. Validasi dan Pengujian](#14-validasi-dan-pengujian)
- [15. Batasan dan Pekerjaan Lanjutan](#15-batasan-dan-pekerjaan-lanjutan)
- [16. Glosarium](#16-glosarium)

## 1. Ringkasan Proyek

Skema ini mendukung aplikasi akademik yang memungkinkan pengguna mengatur mata kuliah dan tugas, baik untuk kebutuhan pribadi maupun kolaborasi dalam kelompok belajar.

Model data memisahkan kredensial autentikasi dari profil pengguna, memisahkan referensi institusi akademik dari data operasional aplikasi, serta menggunakan tabel tugas universal untuk merepresentasikan tugas personal dan tugas yang ditujukan kepada anggota kelompok.

### Tujuan utama

1. Menyimpan kredensial autentikasi secara terpisah dari profil publik pengguna.
2. Menghubungkan profil mahasiswa dengan perguruan tinggi, fakultas, dan program studi.
3. Menyediakan pencatatan mata kuliah berdasarkan program studi.
4. Mendukung kelompok belajar dan keanggotaan dengan peran `Admin` atau `Member`.
5. Mendukung tugas personal dan tugas kelompok melalui satu model tugas.
6. Mendukung subtask, status penyelesaian, prioritas, deadline, tautan file, komentar, dan balasan komentar.

### Di luar cakupan skema saat ini

DDL yang tersedia belum mendefinisikan sistem semester akademik yang lengkap, kalender perkuliahan, nilai, presensi, pembayaran, notifikasi, audit log, atau mekanisme sinkronisasi otomatis ke PDDIKTI. Fitur-fitur tersebut tidak boleh dianggap sudah tersedia hanya karena database memiliki data institusi atau mata kuliah.

## 2. Cakupan Fitur

| Area | Kemampuan yang didukung oleh tabel |
|---|---|
| Autentikasi | Email unik, hash kata sandi, status aktif, waktu pembuatan akun, kolom waktu reset kata sandi |
| Profil | Nama depan/bagian nama belakang, username, avatar, tema UI |
| Referensi akademik | Perguruan tinggi, fakultas, program studi, jenjang |
| Mata kuliah | Kode, nama, SKS, semester, pemilik/pembuat data, program studi |
| Kelompok belajar | Nama grup, deskripsi, avatar, pembuat grup |
| Keanggotaan | Pengguna yang bergabung, peran, metode bergabung, waktu bergabung |
| Tugas | Tugas personal atau tugas grup, anggota penerima tugas grup, prioritas, status, deadline, file |
| Subtask | Rincian tugas turunan dengan status, prioritas, deadline, dan file |
| Diskusi | Komentar pada tugas atau subtask dan referensi balasan komentar |

## 3. Teknologi dan Asumsi

### Database target

- **Database:** TiDB.
- **Mode SQL:** kompatibilitas MySQL.
- **Storage engine pada DDL sumber:** `InnoDB`.
- **Character set pada DDL sumber:** `utf8mb4`.
- **Identifier:** primary key berbentuk `BINARY(16)` dengan default `UUID_TO_BIN(UUID())` pada SQL sumber.
- **Referential integrity:** foreign key, unique constraint, dan check constraint digunakan pada beberapa tabel.

TiDB memiliki kompatibilitas MySQL, tetapi kompatibilitas tidak berarti setiap fungsi, opsi DDL, atau perilaku constraint MySQL tersedia persis sama pada semua versi/konfigurasi. Lihat catatan kompatibilitas di bawah dan uji DDL pada cluster target.

### Konvensi data

- Nama tabel akademik menggunakan bahasa Inggris, sementara tabel mata kuliah bernama `mata_kuliah`.
- Nilai enum ditulis persis seperti yang didefinisikan pada SQL, termasuk kapitalisasi dan ejaan.
- `created_at` umumnya diisi otomatis menggunakan `CURRENT_TIMESTAMP`.
- `updated_at` tersedia pada beberapa tabel, tetapi SQL tidak mendefinisikan mekanisme otomatis untuk memperbaruinya. Aplikasi atau trigger yang kompatibel perlu mengelolanya.
- ID akademik internal berbeda dari ID sumber eksternal seperti ID yang berasal dari PDDIKTI. Kolom sumber disediakan untuk menyimpan identitas asal data.

## 4. Arsitektur Data

Skema dapat dipahami sebagai empat kelompok data.

### A. Identitas dan profil

- `user_authentication`: kredensial dan status akun.
- `user_profiles`: informasi profil dan keterkaitan pengguna dengan institusi akademik.

Pemisahan ini memungkinkan informasi autentikasi dikelola dengan kontrol akses lebih ketat daripada data profil.

### B. Referensi akademik

- `universities`: data perguruan tinggi.
- `faculties`: fakultas atau unit akademik yang berada di bawah perguruan tinggi.
- `study_programs`: program studi di bawah fakultas.

Relasi yang dirancang adalah:

`universities` → `faculties` → `study_programs`

Kolom seperti `university_source`, `faculty_source`, `prodi_source`, serta pasangan ID sumber digunakan untuk mencatat asal data. Untuk data yang diimpor dari PDDIKTI, aplikasi sebaiknya menggunakan label sumber yang konsisten, misalnya `PDDIKTI`, dan menyimpan ID sumber sesuai identitas resmi yang diperoleh dari sumber tersebut.

### C. Mata kuliah dan kolaborasi

- `mata_kuliah`: mata kuliah yang dicatat oleh pengguna dan dikaitkan ke program studi.
- `study_group`: kelompok belajar yang dibuat pengguna.
- `group_member`: hubungan antara pengguna dan kelompok, beserta perannya.

### D. Tugas dan diskusi

- `universal_tasks`: tugas utama personal atau grup.
- `universal_sub_task`: rincian atau langkah turunan dari tugas utama.
- `commentars`: komentar pada tugas/subtask dan hubungan balasan komentar.

Nama `commentars` dan `commentar` dipertahankan sesuai DDL sumber agar dokumentasi cocok dengan skema aktual. Jika nama akan diubah, lakukan migrasi terencana dan sesuaikan kode aplikasi serta query.

## 5. Sumber Data Akademik: PDDIKTI

**Data referensi perguruan tinggi, fakultas, dan program studi direncanakan bersumber dari PDDIKTI (Pangkalan Data Pendidikan Tinggi).** PDDIKTI adalah sumber referensi akademik eksternal; database aplikasi ini menyimpan salinan/representasi lokal agar profil pengguna dapat mengacu pada entitas akademik tersebut.

Situs resmi: [PDDIKTI](https://pddikti.kemdiktisaintek.go.id/)

### Kolom yang relevan untuk provenance data

| Entitas | Kolom pada skema | Tujuan |
|---|---|---|
| Perguruan tinggi | `university_source` | Menandai sumber data, misalnya `PDDIKTI` |
| Perguruan tinggi | `source_id` | Menyimpan ID entitas perguruan tinggi pada sumber |
| Perguruan tinggi | `university_code`, `university_name`, `country_code`, `university_slug` | Kode, nama, negara, dan slug internal |
| Fakultas | `faculty_source` | Menandai sumber data fakultas |
| Fakultas | `faculty_source_id` | Menyimpan ID fakultas dari sumber |
| Fakultas | `faculty_code`, `faculty_name`, `faculty_slug` | Kode, nama, dan slug lokal |
| Program studi | `prodi_source` | Menandai sumber data program studi |
| Program studi | `prodi_source_id` | Menyimpan ID program studi dari sumber |
| Program studi | `prodi_code`, `prodi_name`, `jenjang`, `prodi_slug` | Kode, nama, jenjang, dan slug lokal |

### Hal penting tentang integrasi PDDIKTI

SQL ini **belum mengambil data dari PDDIKTI secara otomatis**. SQL hanya menyediakan kolom untuk menyimpan data akademik dan asal datanya. Mekanisme pengambilan, pemetaan, validasi, pembaruan, dan penanganan perubahan data harus dibuat pada proses terpisah.

Alur integrasi yang disarankan:

1. **Ambil data melalui kanal resmi yang tersedia.** Pastikan metode akses, izin penggunaan, ketentuan layanan, dan batasan pemanfaatan datanya sesuai kebijakan PDDIKTI. Jangan mengasumsikan adanya API publik tertentu tanpa verifikasi.
2. **Simpan data mentah sementara** pada staging area atau file terkontrol sebelum mengubah tabel referensi produksi.
3. **Normalisasi dan validasi** kode, nama, jenjang, ID sumber, serta relasi perguruan tinggi–fakultas–program studi.
4. **Upsert berdasarkan identitas sumber yang stabil**, bukan berdasarkan nama saja. Nama dapat berubah atau memiliki kemiripan.
5. **Catat waktu sinkronisasi dan hasil proses** di log/metadata ETL. Skema saat ini belum memiliki kolom `last_synced_at`, status sinkronisasi, atau tabel audit impor; fitur itu perlu ditambahkan jika diperlukan.
6. **Tangani perubahan dan data yang tidak lagi tersedia** dengan kebijakan eksplisit. Jangan langsung menghapus referensi yang sedang dipakai oleh profil pengguna; foreign key `ON DELETE RESTRICT` dimaksudkan untuk mencegah penghapusan tertentu yang merusak referensi.
7. **Verifikasi relasi akademik** sebelum menyimpan profil. `user_profiles` memiliki foreign key terpisah ke universitas, fakultas, dan program studi, tetapi DDL saat ini tidak menjamin bahwa ketiganya membentuk satu jalur hierarki yang konsisten. Validasi itu perlu dilakukan oleh aplikasi atau diperkuat lewat desain constraint tambahan.

### Data PDDIKTI bukan data akademik personal pengguna

Kolom akademik pada tabel referensi tidak membuktikan status aktif seorang mahasiswa, status registrasi, nilai, atau riwayat pendidikan pengguna. Skema ini hanya menyimpan hubungan profil aplikasi dengan referensi perguruan tinggi/fakultas/program studi yang dipilih. Jangan menyajikan profil tersebut sebagai verifikasi resmi status mahasiswa tanpa proses verifikasi yang memang tersedia dan sah.

## 6. Struktur Tabel

Total tabel pada DDL yang diberikan: **11 tabel**.

### 6.1 `user_authentication`

Menyimpan informasi untuk autentikasi akun.

| Kolom | Tipe | Ketentuan | Makna |
|---|---|---|---|
| `user_auth_id` | `BINARY(16)` | PK, default UUID pada SQL sumber | ID internal autentikasi |
| `email` | `VARCHAR(260)` | NOT NULL, UNIQUE | Email akun |
| `password_hash` | `TEXT` | NOT NULL | Hash kata sandi, bukan kata sandi asli |
| `created_at` | `TIMESTAMP` | NOT NULL, default waktu saat ini | Waktu pembuatan akun |
| `password_reset_at` | `TIMESTAMP` | NULL | Kolom waktu terkait reset kata sandi; semantik tepat perlu ditetapkan aplikasi |
| `is_active` | `BOOLEAN` | NOT NULL | Status aktif akun |

Constraint:
- `uq_user_email`: email harus unik.
- `chk_user_email`: pemeriksaan format email menggunakan pola regex pada SQL sumber.

Catatan: DDL tidak memberi default untuk `is_active`; proses registrasi harus mengirim nilainya secara eksplisit. Regex email hanya validasi format dasar, bukan bukti bahwa alamat email benar-benar dimiliki pengguna.

### 6.2 `universities`

Menyimpan referensi perguruan tinggi.

| Kolom | Tipe | Makna |
|---|---|---|
| `university_id` | `BINARY(16)` | ID internal |
| `university_code` | `VARCHAR(30)` | Kode perguruan tinggi |
| `university_source` | `VARCHAR(20)` | Sistem sumber data |
| `source_id` | `VARCHAR(100)` | ID perguruan tinggi pada sumber |
| `university_name` | `VARCHAR(100)` | Nama perguruan tinggi |
| `country_code` | `VARCHAR(5)` | Kode negara, misalnya `IDN` |
| `university_slug` | `VARCHAR(300)` | Slug unik |
| `created_at` | `TIMESTAMP` | Waktu pencatatan |
| `updated_at` | `TIMESTAMP` | Waktu pembaruan, nullable |

Constraint:
- `uq_slug_university`: slug unik.
- `uq_university_comb`: kombinasi kode, ID sumber, dan slug unik.

Catatan: SQL sumber mendefinisikan keunikan slug dua kali secara konseptual—sebagai inline `UNIQUE` pada kolom dan sebagai constraint bernama `uq_slug_university`. Periksa apakah DDL diterima oleh versi TiDB target; satu deklarasi unik yang jelas biasanya cukup.

### 6.3 `faculties`

Menyimpan fakultas atau unit akademik dan menghubungkannya ke perguruan tinggi.

| Kolom | Tipe | Makna |
|---|---|---|
| `faculty_id` | `BINARY(16)` | ID internal |
| `university_id` | `BINARY(16)` | Perguruan tinggi induk |
| `faculty_source` | `VARCHAR(20)` | Sumber data |
| `faculty_source_id` | `VARCHAR(100)` | ID fakultas pada sumber |
| `faculty_code` | `VARCHAR(30)` | Kode fakultas |
| `faculty_name` | `VARCHAR(100)` | Nama fakultas |
| `faculty_slug` | `VARCHAR(300)` | Slug lokal |
| `created_at` / `updated_at` | `TIMESTAMP` | Waktu pencatatan/pembaruan |

Constraint:
- `fk_faculty_university`: fakultas mengacu ke `universities`.
- `uq_faculty_code`: kode fakultas unik secara global.
- `uq_faculty_university_comb`: kombinasi universitas, ID sumber fakultas, dan slug unik.

Catatan desain: keunikan `faculty_code` secara global mungkin terlalu ketat jika kode hanya unik dalam satu perguruan tinggi. Pastikan asumsi tersebut cocok dengan data sumber. Jika tidak, pertimbangkan unique key komposit yang sesuai.

### 6.4 `study_programs`

Menyimpan program studi.

| Kolom | Tipe | Makna |
|---|---|---|
| `prodi_id` | `BINARY(16)` | ID internal |
| `faculty_id` | `BINARY(16)` | Fakultas induk |
| `prodi_source` | `VARCHAR(20)` | Sumber data |
| `prodi_source_id` | `VARCHAR(100)` | ID program studi pada sumber |
| `prodi_code` | `VARCHAR(30)` | Kode program studi |
| `prodi_name` | `VARCHAR(100)` | Nama program studi |
| `prodi_slug` | `VARCHAR(300)` | Slug lokal |
| `jenjang` | `VARCHAR(15)` | Jenjang pendidikan |
| `created_at` / `updated_at` | `TIMESTAMP` | Waktu pencatatan/pembaruan |

Constraint:
- `fk_prodi_faculty`: program studi mengacu ke `faculties`.
- `uq_prodi_code`: kode program studi unik secara global.
- `uq_prodi_faculty_comb`: kombinasi fakultas, ID sumber prodi, dan slug unik.

Catatan desain: validasi apakah kode program studi benar-benar unik secara global dalam sumber yang digunakan. `jenjang` berupa teks bebas, sehingga daftar nilai yang diterima perlu ditetapkan oleh aplikasi atau constraint tambahan.

### 6.5 `user_profiles`

Menyimpan profil aplikasi dan pilihan referensi akademik pengguna.

| Kolom | Tipe | Makna |
|---|---|---|
| `user_id` | `BINARY(16)` | ID internal profil |
| `user_auth_id` | `BINARY(16)` | Referensi akun autentikasi |
| `front_name` | `VARCHAR(50)` | Bagian nama depan |
| `back_name` | `VARCHAR(50)` | Bagian nama belakang |
| `username` | `VARCHAR(40)` | Username unik |
| `university_id` | `BINARY(16)` | Referensi perguruan tinggi |
| `faculty_id` | `BINARY(16)` | Referensi fakultas |
| `prodi_id` | `BINARY(16)` | Referensi program studi |
| `created_at` / `updated_at` | `TIMESTAMP` | Waktu pencatatan/pembaruan |
| `avatar_url` | `VARCHAR(260)` | URL avatar, nullable |
| `theme` | `ENUM('Light','Dark','System')` | Preferensi tema; default `System` |

Constraint:
- `fk_user_auth`: profil mengacu ke akun autentikasi.
- `fk_user_university`, `fk_user_faculty`, `fk_user_prodi`: referensi akademik.
- `uq_username`: username unik.
- `chk_regex_username`: username hanya boleh berisi karakter sesuai regex pada SQL sumber.

Catatan:
- DDL tidak menyatakan `user_auth_id` unik pada `user_profiles`, sehingga secara struktural satu akun dapat memiliki lebih dari satu profil. Jika aturan produk adalah satu akun = satu profil, tambahkan unique constraint.
- Foreign key universitas, fakultas, dan program studi memvalidasi keberadaan tiap baris, tetapi belum memastikan bahwa fakultas berada pada universitas yang dipilih dan program studi berada pada fakultas tersebut.
- Penamaan `front_name`/`back_name` dipertahankan sesuai sumber. Tentukan aturan aplikasi untuk nama yang hanya memiliki satu bagian atau tidak mengikuti pola nama depan/belakang.

### 6.6 `mata_kuliah`

Menyimpan mata kuliah yang dicatat dalam konteks pengguna.

| Kolom | Tipe | Makna |
|---|---|---|
| `matkul_id` | `BINARY(16)` | ID internal |
| `user_id` | `BINARY(16)` | Pengguna terkait/pencatat |
| `prodi_id` | `BINARY(16)` | Program studi terkait |
| `matkul_code` | `VARCHAR(30)` | Kode mata kuliah |
| `matkul_name` | `VARCHAR(100)` | Nama mata kuliah |
| `sks` | `TINYINT UNSIGNED` | Jumlah SKS |
| `semester` | `TINYINT UNSIGNED` | Nomor semester |
| `created_at` | `TIMESTAMP` | Waktu pembuatan |

Constraint:
- `fk_user_matkul`: pengguna harus ada di `user_profiles`.
- `fk_matkul_prodi`: program studi harus ada.
- `uq_matkul_code`: kode mata kuliah unik secara global.

Catatan desain:
- `uq_matkul_code` dapat mencegah kode mata kuliah yang sama digunakan pada program studi atau pengguna berbeda. Evaluasi apakah keunikan seharusnya berupa `(user_id, matkul_code)`, `(prodi_id, matkul_code)`, atau kombinasi lain sesuai aturan aplikasi.
- Skema tidak menyimpan tahun ajaran, semester akademik (misalnya ganjil/genap pada tahun tertentu), dosen, kelas resmi, atau status mata kuliah. Kolom `semester` hanya berupa angka semester.
- Tabel ini bukan otomatis katalog mata kuliah resmi PDDIKTI; sumber data PDDIKTI yang dinyatakan pada kebutuhan saat ini terutama untuk data institusi/fakultas/program studi.

### 6.7 `study_group`

Menyimpan kelompok belajar.

| Kolom | Tipe | Makna |
|---|---|---|
| `group_id` | `BINARY(16)` | ID kelompok |
| `matkul_id` | `BINARY(16)` | Mata kuliah yang menjadi konteks kelompok |
| `created_by` | `BINARY(16)` | Profil pembuat |
| `group_name` | `VARCHAR(30)` | Nama kelompok |
| `description` | `VARCHAR(250)` | Deskripsi opsional |
| `avatar_url` | `VARCHAR(260)` | URL avatar opsional |
| `created_at` / `updated_at` | `TIMESTAMP` | Waktu pembuatan/pembaruan |

Constraint:
- `fk_matkul_group`: grup terkait ke mata kuliah.
- `fk_created_group`: pembuat harus merupakan profil pengguna.

### 6.8 `group_member`

Menyimpan keanggotaan pengguna pada kelompok belajar.

| Kolom | Tipe | Makna |
|---|---|---|
| `member_id` | `BINARY(16)` | ID baris keanggotaan |
| `group_id` | `BINARY(16)` | Kelompok |
| `user_member` | `BINARY(16)` | Pengguna yang bergabung |
| `user_role` | `ENUM('Admin','Member')` | Peran dalam grup; default `Member` |
| `joined_method` | `VARCHAR(50)` | Cara bergabung |
| `joined_at` | `TIMESTAMP` | Waktu bergabung |

Constraint:
- `fk_user_member`: pengguna harus ada.
- `fk_group_member`: grup harus ada.

Catatan desain: belum ada unique constraint pada `(group_id, user_member)`. Tanpa constraint tersebut, database dapat menerima baris keanggotaan ganda untuk pengguna yang sama di grup yang sama. Tambahkan unique key jika satu pengguna hanya boleh memiliki satu keanggotaan aktif per grup. Skema juga belum menentukan bagaimana memastikan setiap grup selalu memiliki satu admin atau bagaimana perubahan peran diotorisasi.

### 6.9 `universal_tasks`

Menyimpan tugas personal maupun tugas kelompok.

| Kolom | Tipe | Makna |
|---|---|---|
| `task_id` | `BINARY(16)` | ID tugas |
| `user_id` | `BINARY(16)` nullable | Pemilik untuk tugas personal |
| `group_id` | `BINARY(16)` nullable | Kelompok untuk tugas grup |
| `task_member` | `BINARY(16)` nullable | Referensi baris keanggotaan penerima tugas grup |
| `matkul_id` | `BINARY(16)` | Mata kuliah terkait |
| `created_by` | `BINARY(16)` | Pengguna pembuat tugas |
| `task_title` | `VARCHAR(40)` | Judul |
| `description` | `VARCHAR(250)` | Deskripsi opsional |
| `deadline` | `DATETIME` | Tenggat |
| `priority_status` | `ENUM('Low','Medium','High','Urgent')` | Prioritas; default `Medium` |
| `task_status` | `ENUM('Selesai','Belum Selesai')` | Status; default `Belum Selesai` |
| `url_task_file` | `VARCHAR(300)` | Tautan file opsional |
| `created_at` / `updated_at` | `TIMESTAMP` | Waktu pembuatan/pembaruan |

Constraint:
- Foreign key ke profil pengguna, grup, keanggotaan, dan mata kuliah.
- `chk_task_comb_identity` mengharuskan salah satu pola:
  - Personal: `user_id` terisi, `group_id` dan `task_member` NULL.
  - Grup: `user_id` NULL, `group_id` dan `task_member` terisi.

Catatan penting: check constraint tersebut hanya memeriksa pola NULL/non-NULL. Ia tidak memastikan bahwa `task_member` benar-benar anggota dari `group_id` yang sama, atau bahwa mata kuliah tugas sesuai dengan mata kuliah kelompok. Validasi tersebut harus dilakukan aplikasi atau diperkuat dalam desain database.

### 6.10 `universal_sub_task`

Menyimpan subtask yang menjadi bagian dari tugas utama.

| Kolom | Tipe | Makna |
|---|---|---|
| `s_task_id` | `BINARY(16)` | ID subtask |
| `task_id` | `BINARY(16)` | Tugas induk |
| `user_id` | `BINARY(16)` nullable | Pemilik untuk subtask personal |
| `group_id` | `BINARY(16)` nullable | Grup untuk subtask grup |
| `s_task_member` | `BINARY(16)` nullable | Keanggotaan penerima subtask grup |
| `matkul_id` | `BINARY(16)` | Mata kuliah terkait |
| `created_by` | `BINARY(16)` | Pembuat subtask |
| `s_task_title` | `VARCHAR(40)` | Judul subtask |
| `description` | `VARCHAR(250)` | Deskripsi opsional |
| `deadline` | `DATETIME` | Tenggat subtask |
| `priority_status` | `ENUM('Low','Medium','High','Urgent')` | Prioritas |
| `s_task_status` | `ENUM('Selesai','Belum Selesai')` | Status penyelesaian |
| `url_task_file` | `VARCHAR(300)` | Tautan file opsional |
| `created_at` / `updated_at` | `TIMESTAMP` | Waktu pembuatan/pembaruan |

Constraint:
- `fk_s_task_task`: subtask harus memiliki tugas induk.
- Foreign key lain mengacu pada pengguna, grup, anggota grup, mata kuliah, dan pembuat.
- `chk_s_task_comb_identity` menggunakan pola identitas personal/grup yang sama dengan tugas utama.

Catatan: skema tidak memaksa `user_id`, `group_id`, `s_task_member`, dan `matkul_id` pada subtask konsisten dengan tugas induknya. Jangan mengandalkan foreign key saja untuk menjamin konsistensi tersebut.

### 6.11 `commentars`

Menyimpan komentar pada tugas atau subtask, termasuk referensi komentar yang dibalas.

| Kolom | Tipe | Makna |
|---|---|---|
| `commentar_id` | `BINARY(16)` | ID komentar |
| `user_id` | `BINARY(16)` | Pengguna penulis komentar |
| `task_id` | `BINARY(16)` nullable | Tugas yang dikomentari |
| `s_task_id` | `BINARY(16)` nullable | Subtask yang dikomentari |
| `commentar` | `VARCHAR(250)` | Isi komentar |
| `created_at` | `TIMESTAMP` | Waktu pembuatan |
| `reply_id` | `BINARY(16)` nullable | Referensi komentar yang dibalas |
| `reply_count` | `INT` nullable | Kolom jumlah balasan |

Constraint:
- `fk_user_commentar`: penulis harus ada.
- `fk_task_commentat`: referensi tugas, jika ada, harus valid.
- `fk_s_task_commentar`: referensi subtask, jika ada, harus valid.
- `fk_reply_commentar`: referensi balasan menunjuk komentar lain.
- `chk_commentar_identity_comb`: mengharuskan komentar terkait tepat pada salah satu dari tugas atau subtask.

Catatan:
- `reply_id` memungkinkan relasi balasan ke komentar lain. Aplikasi perlu menetapkan apakah balasan bertingkat diperbolehkan dan mencegah siklus.
- `reply_count` tidak otomatis terhitung atau diperbarui oleh DDL. Jika disimpan sebagai cache, perbarui secara konsisten dalam transaksi atau hitung jumlah balasan saat query.
- Constraint identitas komentar memastikan salah satu target terisi, tetapi tidak memvalidasi bahwa balasan mengarah ke komentar pada target yang sama.

## 7. Relasi dan Alur Data

### Relasi inti

```text
user_authentication
        |
        | 1 akun -> satu atau lebih profil secara struktural (belum dibatasi UNIQUE)
        v
user_profiles -------------------- universities
   |   |   \                            |
   |   |    \                           v
   |   |     \                       faculties
   |   |      \                         |
   |   |       \                        v
   |   |        ------------------ study_programs
   |   |
   |   +---- mata_kuliah <---- study_programs
   |                |
   |                v
   |            study_group <---- user_profiles (created_by)
   |                |
   |                v
   |            group_member ---- user_profiles
   |
   +---- universal_tasks ---- mata_kuliah
   |            |
   |            v
   |      universal_sub_task
   |
   +---- commentars ---- universal_tasks / universal_sub_task
                 |
                 +---- commentars (reply_id)
```

Diagram di atas bersifat konseptual; relasi aktual ditentukan oleh foreign key pada DDL.

### Alur pembuatan data yang disarankan

1. Impor atau buat data `universities`.
2. Buat `faculties` dengan `university_id` yang valid.
3. Buat `study_programs` dengan `faculty_id` yang valid.
4. Buat akun di `user_authentication`.
5. Buat profil di `user_profiles` dengan ID referensi akademik yang valid dan konsisten secara hierarki.
6. Buat catatan `mata_kuliah` untuk pengguna dan program studi.
7. Jika diperlukan, buat `study_group` berdasarkan mata kuliah.
8. Tambahkan pengguna ke grup melalui `group_member`.
9. Buat tugas personal atau grup di `universal_tasks`.
10. Tambahkan rincian tugas di `universal_sub_task`.
11. Tambahkan komentar dan balasan di `commentars`.

Urutan ini adalah rekomendasi alur operasional, bukan prosedur tersimpan yang sudah ada dalam SQL.

## 8. Aturan Bisnis yang Tercermin dalam Skema

### Nilai enum

| Kolom | Nilai yang diizinkan |
|---|---|
| `user_profiles.theme` | `Light`, `Dark`, `System` |
| `group_member.user_role` | `Admin`, `Member` |
| `universal_tasks.priority_status` | `Low`, `Medium`, `High`, `Urgent` |
| `universal_tasks.task_status` | `Selesai`, `Belum Selesai` |
| `universal_sub_task.priority_status` | `Low`, `Medium`, `High`, `Urgent` |
| `universal_sub_task.s_task_status` | `Selesai`, `Belum Selesai` |

### Pola identitas tugas

| Jenis | `user_id` | `group_id` | `task_member` |
|---|---|---|---|
| Personal | Terisi | NULL | NULL |
| Grup | NULL | Terisi | Terisi |

Subtask menggunakan pola serupa melalui `user_id`, `group_id`, dan `s_task_member`.

### Perilaku penghapusan

Beberapa foreign key menggunakan `ON DELETE RESTRICT`, sedangkan sebagian tidak menyebutkan aksi penghapusan secara eksplisit. Perilaku default bergantung pada implementasi database. Untuk menjaga konsistensi, gunakan kebijakan penghapusan yang eksplisit dan uji hasilnya pada TiDB. Data akademik referensi yang sudah digunakan profil sebaiknya tidak dihapus secara sembarangan.

## 9. Instalasi di TiDB

> Sesuaikan langkah ini dengan layanan TiDB yang dipakai (misalnya TiDB Cloud atau cluster yang dikelola sendiri), kredensial, TLS, dan versi server. Jangan menyimpan password database di repository.

1. Buat cluster/database TiDB dan siapkan kredensial dengan hak minimum yang dibutuhkan.
2. Sambungkan menggunakan SQL client yang mendukung koneksi MySQL, misalnya MySQL CLI, DBeaver, atau client pilihan tim.
3. Pilih database target:

   ```sql
   USE nama_database;
   ```

4. Simpan DDL sebagai file, misalnya `schema.sql`.
5. Tinjau dan uji bagian yang berpotensi berbeda pada TiDB terlebih dahulu, terutama `UUID_TO_BIN(UUID())`, regex, `CHECK`, `ENUM`, foreign key, dan unique constraint ganda.
6. Jalankan DDL di lingkungan development atau staging sebelum production. Pastikan tabel dibuat sesuai urutan dependensi:
   1. `user_authentication`
   2. `universities`
   3. `faculties`
   4. `study_programs`
   5. `user_profiles`
   6. `mata_kuliah`
   7. `study_group`
   8. `group_member`
   9. `universal_tasks`
   10. `universal_sub_task`
   11. `commentars`
7. Verifikasi hasilnya dengan `SHOW TABLES;`, `SHOW CREATE TABLE nama_tabel;`, dan pengujian insert/update/delete yang aman.
8. Jalankan rangkaian pengujian constraint dan integritas sebelum aplikasi dihubungkan ke database.

Jangan menyalin kredensial, sertifikat privat, connection string dengan password, atau data pengguna nyata ke README maupun commit Git.

## 10. Catatan Kompatibilitas TiDB

DDL sumber menggunakan sintaks MySQL, tetapi beberapa detail perlu diverifikasi sebelum dianggap siap produksi.

### 10.1 `UUID_TO_BIN(UUID())`

Semua primary key menggunakan pola default `UUID_TO_BIN(UUID())`. Pastikan fungsi `UUID_TO_BIN()` didukung oleh versi TiDB yang dipakai. Jika tidak didukung, gunakan strategi UUID yang memang didukung TiDB, lalu samakan cara pembentukan dan pembacaan ID pada aplikasi. Jangan mengganti representasi UUID secara parsial: seluruh foreign key harus memakai format biner yang sama.

### 10.2 `CHECK` constraint

DDL memakai `CHECK` untuk format email/username dan kombinasi identitas tugas/komentar. Pastikan versi TiDB menegakkan constraint tersebut sesuai ekspektasi. Walaupun constraint diterima oleh parser, uji dengan memasukkan data yang sengaja melanggar aturan pada environment pengujian.

### 10.3 Regex

DDL memakai operator `REGEXP` dengan pola email dan username. Uji sintaks, escaping backslash, dan perilakunya pada TiDB target. Validasi input tetap perlu dilakukan di aplikasi; pemeriksaan regex database bukan pengganti validasi bisnis.

### 10.4 Unique constraint ganda pada `universities.university_slug`

Kolom `university_slug` sudah didefinisikan `UNIQUE` secara inline dan kemudian diberi constraint `uq_slug_university` yang juga `UNIQUE`. Periksa apakah DDL diterima oleh parser TiDB. Bila tidak diperlukan dua indeks unik, pertahankan satu definisi unik yang bernama dan konsisten.

### 10.5 Foreign key dan `ON DELETE`

Uji apakah foreign key didukung dan diaktifkan sesuai konfigurasi cluster, lalu verifikasi semua relasi setelah pembuatan tabel. Jangan berasumsi constraint referensial aktif hanya karena sintaks DDL ada. Pastikan perilaku penghapusan untuk constraint yang tidak menuliskan `ON DELETE` eksplisit sesuai kebutuhan.

### 10.6 `ENUM`, `BOOLEAN`, dan tipe numerik

Uji nilai enum, representasi boolean, serta rentang `TINYINT UNSIGNED` pada driver aplikasi. `sks` dan `semester` tidak diberi check constraint rentang khusus pada DDL sumber, sehingga nilai yang masuk tetap harus divalidasi sesuai aturan akademik.

## 11. Panduan Integrasi Aplikasi

### Transaksi

Operasi yang terdiri dari beberapa perubahan terkait sebaiknya dilakukan dalam satu transaksi. Contoh: membuat tugas grup dan menetapkan penerimanya, atau membuat akun beserta profilnya. Jika satu langkah gagal, rollback agar tidak meninggalkan data setengah jadi.

### Validasi sebelum insert/update

Aplikasi setidaknya perlu memvalidasi:
- Format email dan username.
- Kebijakan password dan hasil hashing.
- Keberadaan serta konsistensi hierarki universitas–fakultas–program studi.
- Apakah pengguna berhak membuat atau mengubah grup.
- Apakah penerima tugas benar-benar anggota dari grup yang dituju.
- Apakah tugas/subtask menggunakan mata kuliah yang konsisten.
- Apakah komentar menunjuk tepat satu target dan balasan berada pada konteks yang diizinkan.
- Nilai SKS, nomor semester, deadline, panjang teks, dan URL.
- Zona waktu yang digunakan aplikasi untuk menafsirkan `DATETIME` dan `TIMESTAMP`.

### Timestamp dan deadline

`created_at` memakai default `CURRENT_TIMESTAMP` pada DDL. `updated_at` tidak otomatis diperbarui oleh definisi yang tersedia. Tentukan satu kebijakan zona waktu, idealnya konsisten di aplikasi dan koneksi database, serta dokumentasikan bagaimana deadline lokal dikonversi/disimpan. `DATETIME` sendiri tidak menyimpan informasi zona waktu.

### File dan avatar

`avatar_url` dan `url_task_file` menyimpan URL/path, bukan isi file. Simpan file di layanan penyimpanan yang sesuai dan kontrol aksesnya; jangan menganggap bahwa URL yang tersimpan otomatis privat atau aman.

## 12. Keamanan

### Autentikasi

- Simpan hanya password hash yang dibuat oleh algoritma hashing password yang sesuai, seperti Argon2id atau bcrypt dengan parameter yang dikonfigurasi secara benar.
- Jangan mengenkripsi atau menyimpan kata sandi asli sebagai pengganti password hashing.
- Terapkan rate limiting, perlindungan brute-force, verifikasi email bila diperlukan, dan alur reset password yang memiliki token acak, kedaluwarsa, serta penggunaan sekali.
- `password_reset_at` bukan token reset. Skema saat ini tidak menyimpan token reset, masa berlaku, atau status penggunaan token.
- `is_active` wajib diisi saat pembuatan akun.

### Akses database

- Gunakan akun database dengan least privilege; jangan memakai akun administrator untuk koneksi aplikasi.
- Gunakan TLS untuk koneksi jaringan jika didukung oleh lingkungan deployment.
- Simpan secret di secret manager atau environment configuration yang aman, bukan di source code.
- Pisahkan kredensial development, staging, dan production.
- Batasi akses ke `password_hash` dan data personal.
- Hindari mencatat password, token reset, connection string, atau informasi autentikasi ke log.

### Otorisasi aplikasi

Foreign key dan check constraint bukan sistem otorisasi. Aplikasi tetap harus memeriksa apakah pengguna yang sedang login boleh membaca atau mengubah tugas, subtask, komentar, profil, dan keanggotaan tertentu. Jangan mengandalkan ID yang dikirim client sebagai bukti kepemilikan.

### Data akademik

Gunakan data akademik sesuai ketentuan sumber dan tujuan penggunaan yang sah. Jangan menganggap data yang berhasil disimpan di database sebagai data yang telah diverifikasi resmi pada saat pengguna memilihnya. Simpan provenance sumber secara konsisten.

## 13. Indeks dan Kinerja

Primary key, unique constraint, dan foreign key membentuk sebagian struktur indeks, tetapi DDL saat ini belum mendefinisikan indeks tambahan yang ditujukan khusus untuk query aplikasi.

Sebelum menambah indeks, kumpulkan query utama dan ukur dengan data representatif. Kandidat yang layak dievaluasi (bukan indeks yang sudah ada) meliputi:

- `user_profiles(user_auth_id)` untuk pencarian profil dari akun.
- `mata_kuliah(user_id)` dan `mata_kuliah(prodi_id)`.
- `study_group(matkul_id)` dan `study_group(created_by)`.
- `group_member(group_id, user_member)` — pertimbangkan sebagai unique constraint jika aturan bisnis melarang keanggotaan ganda.
- `universal_tasks(user_id, deadline)` untuk daftar tugas personal.
- `universal_tasks(group_id, task_member, deadline)` untuk tugas kelompok.
- `universal_sub_task(task_id, deadline)`.
- `commentars(task_id, created_at)`, `commentars(s_task_id, created_at)`, dan `commentars(reply_id)` sesuai pola akses.

Indeks menambah biaya tulis dan penyimpanan. Pastikan indeks yang diusulkan tidak menduplikasi indeks yang otomatis dibuat oleh primary key atau unique constraint, dan validasi rencana query menggunakan fasilitas EXPLAIN yang tersedia pada TiDB.

## 14. Validasi dan Pengujian

Sebelum release, gunakan checklist berikut.

### DDL dan kompatibilitas

- [ ] Semua 11 tabel berhasil dibuat di cluster TiDB target.
- [ ] Fungsi default UUID menghasilkan nilai `BINARY(16)` yang valid.
- [ ] Semua foreign key dan unique constraint terpasang serta berfungsi.
- [ ] Check constraint benar-benar menolak data yang melanggar aturan.
- [ ] Regex email/username berfungsi sesuai pola yang dimaksud.
- [ ] Nilai enum menerima nilai valid dan menolak nilai yang tidak valid sesuai mode SQL.
- [ ] Tidak ada definisi indeks unik yang tidak sengaja duplikatif.

### Integritas data

- [ ] Profil tidak dapat menunjuk akun atau entitas akademik yang tidak ada.
- [ ] Fakultas benar-benar milik universitas yang dipilih.
- [ ] Program studi benar-benar berada pada fakultas yang dipilih.
- [ ] Keanggotaan ganda dalam grup ditangani sesuai aturan bisnis.
- [ ] Tugas personal memiliki `user_id` dan tidak memiliki `group_id`/`task_member`.
- [ ] Tugas grup memiliki `group_id` dan `task_member` yang benar-benar cocok.
- [ ] Subtask konsisten dengan tugas induk.
- [ ] Komentar memiliki tepat satu target: tugas atau subtask.
- [ ] Penghapusan data induk tidak menyebabkan kehilangan data turunan yang tidak disengaja.

### Keamanan dan operasional

- [ ] Password disimpan sebagai hash yang sesuai.
- [ ] Otorisasi diperiksa di backend, bukan hanya pada UI.
- [ ] Secret tidak masuk ke Git atau log.
- [ ] Backup dan prosedur pemulihan telah diuji.
- [ ] Proses impor PDDIKTI memiliki validasi, logging, dan penanganan kegagalan.
- [ ] Query utama telah diuji dengan data yang mendekati volume penggunaan sebenarnya.

## 15. Batasan dan Pekerjaan Lanjutan

Daftar berikut adalah temuan dari DDL yang tersedia, bukan perubahan yang sudah diterapkan.

1. **Konsistensi hierarki akademik:** foreign key pada profil memvalidasi setiap ID secara terpisah, tetapi tidak memastikan ketiganya berada pada satu jalur hierarki.
2. **Kardinalitas profil-akun:** `user_profiles.user_auth_id` belum unik. Tambahkan unique constraint jika satu akun hanya boleh mempunyai satu profil.
3. **Keunikan mata kuliah:** `matkul_code` unik secara global; pastikan cakupan ini memang sesuai kebutuhan.
4. **Keunikan keanggotaan:** belum ada unique constraint untuk pasangan grup-pengguna.
5. **Konsistensi tugas grup:** check constraint belum membuktikan bahwa penerima tugas adalah anggota dari grup yang tepat.
6. **Konsistensi subtask:** data pemilik/grup/anggota/mata kuliah belum dipastikan cocok dengan tugas induk.
7. **Konsistensi komentar dan balasan:** target komentar divalidasi, tetapi konteks target komentar induk dan balasan belum divalidasi.
8. **`reply_count`:** tidak dikelola otomatis oleh DDL.
9. **`updated_at`:** tidak otomatis berubah pada update berdasarkan definisi yang tersedia.
10. **Reset password:** belum ada tabel/token reset, masa berlaku, atau mekanisme konsumsi token.
11. **Lifecycle akun dan penghapusan:** kebijakan soft delete/deaktivasi dan retensi data belum didefinisikan.
12. **Provenance PDDIKTI:** belum ada tabel staging, waktu sinkronisasi, versi snapshot, status aktif referensi, atau audit perubahan.
13. **Validasi akademik:** tidak ada mekanisme yang mengonfirmasi bahwa pengguna benar-benar terdaftar pada program studi yang dipilih.
14. **Indeks query:** indeks tambahan harus dirancang berdasarkan pola query dan pengukuran, bukan ditambahkan secara membabi buta.
15. **DDL TiDB:** fungsi UUID, regex, check constraint, dan perilaku foreign key harus diverifikasi pada versi/konfigurasi TiDB aktual.

Rekomendasi urutan prioritas: (1) pastikan DDL berjalan di TiDB, (2) tegaskan aturan kardinalitas dan konsistensi data, (3) implementasikan otorisasi backend, (4) bangun pipeline PDDIKTI yang legal dan dapat diaudit, lalu (5) optimalkan indeks berdasarkan query nyata.

## 16. Glosarium

- **PDDIKTI:** Pangkalan Data Pendidikan Tinggi, sumber referensi informasi pendidikan tinggi Indonesia.
- **PK (Primary Key):** identitas unik setiap baris.
- **FK (Foreign Key):** referensi ke baris pada tabel lain.
- **Unique constraint:** aturan agar nilai atau kombinasi nilai tidak duplikat.
- **Check constraint:** aturan yang membatasi nilai/keadaan baris.
- **UUID:** identifier unik yang digunakan sebagai ID internal.
- **Slug:** representasi teks yang ramah URL dan biasanya digunakan sebagai identifier berbasis nama.
- **ETL:** Extract, Transform, Load; proses mengambil, membersihkan/mengubah, lalu memuat data.
- **Provenance:** informasi mengenai asal dan jalur data.
- **Least privilege:** memberikan hak akses minimum yang diperlukan.
- **TiDB:** database SQL terdistribusi yang kompatibel dengan protokol/ekosistem MySQL.

---

## Catatan Kontribusi

Sebelum mengirim perubahan skema:

1. Jelaskan alasan perubahan dan aturan bisnis yang ingin dijaga.
2. Perbarui DDL serta dokumentasi tabel/relasi secara bersamaan.
3. Sertakan migrasi yang dapat ditinjau dan rencana rollback bila relevan.
4. Uji pada versi TiDB yang dipakai proyek.
5. Jangan memasukkan secret, data mahasiswa nyata, atau dump database sensitif ke repository.

