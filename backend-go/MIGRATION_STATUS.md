# Status Migrasi Backend Go

## Ringkasan

Backend proyek ini sudah mulai dipindahkan dari Python/FastAPI ke **Go** dengan target utama:

1. mempertahankan kontrak API frontend yang sudah ada,
2. tetap memakai database SQLite lama,
3. meminimalkan perubahan di frontend,
4. memperbaiki beberapa bug bisnis penting di backend lama.

Folder yang dipakai sekarang:

- `backend-go/` → implementasi backend Go baru
- `backend/` → backend Python lama + file data lama (`kasir.db`, `uploads/`)

## Arsitektur yang Dipilih

Backend Go dibuat sebagai **monolith sederhana** agar cocok dengan struktur proyek sekarang.

Komponen utama:

- `cmd/server/` → entry point aplikasi
- `internal/config/` → konfigurasi runtime
- `internal/database/` → koneksi database + bootstrap
- `internal/models/` → model data yang memetakan schema SQLite saat ini
- `internal/httpapi/` → router, auth middleware, dan handler route `/api/*`
- `internal/utils/` → utilitas umum seperti kompatibilitas hash password lama

Dependensi utama:

- `chi` untuk router HTTP
- `gorm` + SQLite untuk akses database
- `jwt/v5` untuk token auth
- `excelize` untuk export Excel
- `barcode` untuk generate barcode image

## Kompatibilitas yang Dipertahankan

Target kompatibilitas saat migrasi:

- path API tetap memakai pola `/api/*`
- upload statis tetap tersedia di `/uploads/*`
- format respons tetap mengikuti gaya lama sebisa mungkin
- error JSON tetap menggunakan bentuk:

```json
{ "detail": "..." }
```

- frontend tetap memakai proxy Vite ke `http://localhost:8000`

## Perubahan Penting yang Sudah Dibenahi

Selain migrasi bahasa, ada beberapa perbaikan penting yang sekaligus dimasukkan:

1. **Kompatibilitas password hash lama**
   - user lama di `backend/kasir.db` memakai `passlib pbkdf2_sha256`
   - backend Go sekarang bisa memverifikasi hash lama tersebut

2. **`cost_total` transaksi dihitung saat checkout**
   - backend lama tidak konsisten mengisi nilai ini
   - backend Go sekarang menghitung `cost_total` dari `cost_price * quantity`

3. **Validasi input server-side lebih ketat**
   - quantity transaksi harus > 0
   - harga, stok, min stock, poin, dan nilai diskon divalidasi lebih ketat

4. **Bootstrap database aman untuk DB lama**
   - backend Go tidak lagi memaksa `AutoMigrate` ke database lama yang sudah ada
   - ini mencegah kerusakan schema lama saat startup

## Hasil Verifikasi

Verifikasi yang sudah dijalankan:

### 1. Build backend Go

```bash
cd backend-go
go build ./...
```

Hasil: **lolos**

### 2. Diagnostic Go

Pemeriksaan LSP pada seluruh file `.go` di `backend-go/`.

Hasil: **0 diagnostics**

### 3. Smoke test backend Go

Pengujian dilakukan memakai **copy database sementara**, supaya `backend/kasir.db` utama tidak berubah.

Route penting yang diuji:

- `GET /health`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/discounts`
- `GET /api/users/`
- `POST /api/transactions`
- `GET /api/transactions`
- `GET /api/reports/summary`
- `DELETE /api/transactions/{id}`

Hasil: **lolos**

### 4. Integrasi frontend ↔ backend Go via proxy Vite

Yang diuji:

- root HTML frontend dev server
- login lewat endpoint proxied `/api/auth/login`
- fetch produk lewat `/api/products`
- fetch report summary lewat `/api/reports/summary`

Hasil: **lolos**

## Cara Menjalankan Backend Go

### Development

```bash
cd backend-go
go mod tidy
go run ./cmd/server
```

Default:

- port: `8000`
- database: akan mencoba memakai DB lama jika tersedia
- uploads: folder `uploads/`

### Environment Variable yang Didukung

- `PORT`
- `DB_PATH`
- `UPLOAD_DIR`
- `JWT_SECRET`
- `ALLOW_ORIGINS`

Contoh:

```bash
PORT=8000
DB_PATH=../backend/kasir.db
UPLOAD_DIR=../backend/uploads
JWT_SECRET=ubah-secret-anda
```

### Docker

`docker-compose.yml` sudah diarahkan ke build backend baru dari `./backend-go`.

Service backend sekarang:

- build context: `./backend-go`
- mount database lama: `./backend/kasir.db:/app/kasir.db`
- mount uploads lama: `./backend/uploads:/app/uploads`

## Langkah Cutover yang Disarankan

Sebelum benar-benar meninggalkan backend Python lama:

1. jalankan frontend melawan backend Go,
2. uji login admin/kasir,
3. uji flow kasir end-to-end,
4. uji halaman admin: produk, diskon, users, report,
5. uji upload gambar produk,
6. uji export CSV/Excel,
7. backup `backend/kasir.db` sebelum deployment.

## Remaining Gap / Catatan

Beberapa hal masih perlu diuji lebih jauh secara manual di UI:

- seluruh flow customer debt/hutang di frontend
- upload gambar produk dari halaman admin
- semua export format dibandingkan 1:1 dengan backend lama
- konsistensi route yang sebelumnya duplikat di backend Python

Selain itu, meskipun backend Go sudah bisa jalan, **ini tetap migrasi besar**, jadi validasi manual end-to-end di browser tetap penting sebelum backend Python lama benar-benar dibuang.
