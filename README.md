# Esnaf Durum - Online Siparis Sistemi

Modern, gercek zamanli durumcu siparis ve yonetim sistemi.

## Icindekiler

- [Ozellikler](#ozellikler)
- [Kurulum](#kurulum)
- [Kullanim](#kullanim)
- [API Dokumantasyonu](#api-dokumantasyonu)
- [Guvenlik](#guvenlik)
- [Proje Yapisi](#proje-yapisi)
- [Teknolojiler](#teknolojiler)

## Ozellikler

### Musteri Paneli
- SMS dogrulama ile kayit/giris sistemi (sifresiz)
- Ayri kayit ol ve giris yap akislari
- Profil duzenleme (ad, soyad, adres)
- Oturum hatirla ve cikis yapabilme
- Kategorilere gore menu goruntuleme (kaydirilabilir kategori cizgisi)
- Sepete urun ekleme/cikarma
- 3 farkli odeme secenegi:
  - Kapida Nakit
  - Kapida Kart
  - Online Odeme
- Siparis gecmisi ve takibi
- Siparis iptali (yola cikmadan once)
- Mobil uyumlu tasarim

### Admin/Tezgah Paneli
- JWT tabanli guvenli giris sistemi
- Varsayilan kullanici: admin / admin123
- Sifre degistirme ozelligi
- Anlik siparis bildirimi (ses + masaustu)
- Siparis durumu guncelleme
- Siparis ID kopyalama (kurye icin)
- Menu Yonetimi:
  - Urun ekleme/duzenleme/silme
  - Gorsel yukleme (PNG, JPG, GIF, WebP - max 5MB)
  - Emoji destegi
  - Urun fiyati ve aciklamasi
  - Satista/Satista degil durumu
- Kategori Yonetimi:
  - Kategori ekleme/silme
  - Emoji ile kategori simgesi
  - Urunlu kategori silme korumasi

### Kurye Paneli
- JWT tabanli guvenli giris sistemi
- Siparis ID ile arama
- Siparis detaylarini goruntuleme
- Telefon numarasina dokunarak arama
- Haritada adres gosterme
- Teslimat onaylama

### Gercek Zamanli Ozellikler
- Socket.io ile anlik guncellemeler
- Yeni siparis bildirimi
- Durum degisikligi senkronizasyonu

### Guvenlik Ozellikleri
- JWT (JSON Web Token) tabanli kimlik dogrulama
  - Admin token suresi: 24 saat
  - Musteri token suresi: 7 gun
- Bcrypt ile sifre hashleme
- Tum admin endpoint'leri korumali
- Musteri siparisleri JWT ile korumali (kimlik taklidi engellendi)
- Guvenli dosya yukleme (mimetype tabanli uzanti dogrulama)
- SMS dogrulama kodlari 5 dakika sonra otomatik silinir
- Yetkisiz erisim engelleme

## Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Adimlar

1. Repoyu klonlayin:
```bash
git clone https://github.com/cekYc/merchant_online_order.git
cd tavux
```

2. Bagimliliklari yukleyin:
```bash
npm install
cd client && npm install && cd ..
```

3. Uygulamayi baslatin:
```bash
npm run dev
```

Bu komut hem server'i (port 3001) hem client'i (port 5173) ayni anda baslatir.

## Kullanim

### Erisim Linkleri

| Panel | URL | Aciklama |
|-------|-----|----------|
| Musteri | http://localhost:5173 | Siparis verme |
| Admin | http://localhost:5173/admin | Siparis ve menu yonetimi |
| Kurye | http://localhost:5173/kurye | Teslimat takibi |

### Varsayilan Admin Girisi
- Kullanici Adi: admin
- Sifre: admin123
- Onemli: Ilk giriste sifreyi degistirin!

### Siparis Durumlari

| Durum | Aciklama |
|-------|----------|
| Yeni Siparis | Siparis alindi, onay bekliyor |
| Hazirlaniyor | Siparis hazirlaniyor |
| Hazir | Siparis hazir, kurye bekliyor |
| Yolda | Kurye yola cikti |
| Teslim Edildi | Siparis teslim edildi |
| Iptal | Siparis iptal edildi |

### SMS Dogrulama (Gelistirme Modu)
Gelistirme modunda SMS kodlari konsola yazdirilir ve API response'unda devCode olarak doner.
Production'da gercek SMS servisi entegre edilmelidir.

## API Dokumantasyonu

### Genel Endpointler (Public)

```
GET  /api/menu              # Menuyu getir (sadece aktif urunler)
GET  /api/categories        # Kategorileri getir
```

### Kimlik Dogrulama Endpointleri

```
POST /api/admin/login       # Admin girisi, JWT token doner
GET  /api/admin/verify      # Token dogrulama (Auth gerekli)
POST /api/admin/change-password # Sifre degistir (Auth gerekli)
```

### SMS Dogrulama Endpointleri

```
POST /api/auth/send-code    # SMS kodu gonder
POST /api/auth/verify-code  # SMS kodunu dogrula
POST /api/auth/register     # Musteri kayit/guncelleme
```

### Siparis Endpointleri

```
GET  /api/orders            # Tum siparisler (Admin Auth gerekli)
POST /api/orders            # Yeni siparis olustur (Musteri Auth gerekli)
GET  /api/orders/:id        # Siparis detayi (Public - kurye icin)
PATCH /api/orders/:id/status # Durum guncelle (Admin Auth gerekli)
PATCH /api/orders/:id/cancel # Siparis iptal (musteri)
```

### Musteri Endpointleri

```
GET  /api/customers/:customerId/orders  # Musteri siparisleri
```

### Admin Endpointleri (Tumu Auth Gerekli)

```
POST   /api/upload               # Gorsel yukle
GET    /api/admin/menu           # Tum menu ogeleri
POST   /api/admin/menu           # Urun ekle
PUT    /api/admin/menu/:id       # Urun guncelle
DELETE /api/admin/menu/:id       # Urun sil

POST   /api/admin/categories     # Kategori ekle
PUT    /api/admin/categories/:id # Kategori guncelle
DELETE /api/admin/categories/:id # Kategori sil
```

## Guvenlik

### JWT Kimlik Dogrulama
Tum admin ve kritik islemler JWT token ile korunmaktadir.

Token alma:
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Token kullanma:
```bash
curl http://localhost:3001/api/admin/menu \
  -H "Authorization: Bearer <token>"
```

### Korumali Endpointler
- POST /api/upload
- GET/POST/PUT/DELETE /api/admin/menu/*
- GET/POST/PUT/DELETE /api/admin/categories/*
- GET /api/orders (tum siparisler)
- PATCH /api/orders/:id/status

### Guvenlik Onerileri
1. Production'da JWT_SECRET environment variable olarak ayarlanmali
2. Varsayilan admin sifresi hemen degistirilmeli
3. HTTPS kullanilmali
4. Rate limiting eklenebilir

## Proje Yapisi

```
tavux/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Bilesenleri
│   │   │   ├── Menu.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── MyOrders.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   └── OrderSuccess.jsx
│   │   ├── contexts/       # React Context
│   │   │   └── AdminContext.jsx
│   │   ├── pages/          # Sayfa Bilesenleri
│   │   │   ├── CustomerApp.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── CourierPanel.jsx
│   │   ├── App.jsx         # Ana uygulama + CartContext
│   │   ├── main.jsx        # Giris noktasi
│   │   └── index.css       # Tailwind stiller
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Node.js Backend
│   ├── index.js            # Ana sunucu dosyasi
│   ├── uploads/            # Yuklenen gorseller
│   ├── durumcu.db          # SQLite veritabani
│   └── package.json
│
├── package.json            # Root package (concurrently)
└── README.md
```

## Veritabani Semasi

### customers
- id (TEXT, PRIMARY KEY)
- firstName (TEXT)
- lastName (TEXT)
- phone (TEXT, UNIQUE)
- address (TEXT)
- createdAt (DATETIME)

### admins
- id (TEXT, PRIMARY KEY)
- username (TEXT, UNIQUE)
- password (TEXT, hashed)
- role (TEXT)
- createdAt (DATETIME)

### categories
- id (TEXT, PRIMARY KEY)
- name (TEXT)
- emoji (TEXT)
- sortOrder (INTEGER)

### menu_items
- id (INTEGER, PRIMARY KEY)
- name (TEXT)
- description (TEXT)
- price (REAL)
- category (TEXT)
- image (TEXT)
- available (INTEGER)

### orders
- id (TEXT, PRIMARY KEY)
- customerId (TEXT, FOREIGN KEY)
- items (TEXT, JSON)
- totalAmount (REAL)
- paymentMethod (TEXT)
- status (TEXT)
- note (TEXT)
- createdAt (DATETIME)

## Teknolojiler

### Frontend
- React 18 - UI Framework
- Vite 6 - Build Tool
- Tailwind CSS - Styling
- React Router DOM 7 - Routing
- Socket.io Client - Gercek zamanli iletisim
- Lucide React - Ikonlar

### Backend
- Node.js - Runtime
- Express - Web Framework
- Socket.io - WebSocket
- better-sqlite3 - Veritabani
- Multer - Dosya yukleme
- UUID - Benzersiz ID uretimi
- jsonwebtoken - JWT token
- bcryptjs - Sifre hashleme

### Veritabani
- SQLite - Hafif, dosya tabanli veritabani

## Lisans

MIT License

## Gelistirici

Eray Cicek

---

GitHub: https://github.com/cekYc/merchant_online_order
