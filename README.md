# Tavux Dürüm - Online Sipariş Sistemi

Modern, gerçek zamanlı dürümcü sipariş ve yönetim sistemi.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![SQLite](https://img.shields.io/badge/SQLite-3-orange)
![Socket.io](https://img.shields.io/badge/Socket.io-4-black)

## İçindekiler

- [Özellikler](#-özellikler)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Proje Yapısı](#-proje-yapısı)
- [Teknolojiler](#-teknolojiler)

## Özellikler

### Müşteri Paneli
- Kullanıcı kaydı (ad, soyad, telefon, adres)
- Kategorilere göre menü görüntüleme
- Sepete ürün ekleme/çıkarma
- 3 farklı ödeme seçeneği:
  - Kapıda Nakit
  - Kapıda Kart
  - Online Ödeme
- Sipariş geçmişi ve takibi
- Sipariş iptali (yola çıkmadan önce)
- Mobil uyumlu tasarım

### Admin/Tezgah Paneli
- Anlık sipariş bildirimi (ses + masaüstü)
- Sipariş durumu güncelleme
- Sipariş ID kopyalama (kurye için)
- **Menü Yönetimi:**
  - Ürün ekleme/düzenleme/silme
  - Görsel yükleme (PNG, JPG, GIF, WebP)
  - Emoji desteği
  - Ürün fiyatı ve açıklaması
  - Satışta/Satışta değil durumu
- **Kategori Yönetimi:**
  - Kategori ekleme/silme
  - Emoji ile kategori simgesi
  - Ürünlü kategori silme koruması

### Kurye Paneli
- Sipariş ID ile arama
- Sipariş detaylarını görüntüleme
- Teslimat onaylama

### Gerçek Zamanlı
- Socket.io ile anlık güncellemeler
- Yeni sipariş bildirimi
- Durum değişikliği senkronizasyonu

## Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Adımlar

1. **Repoyu klonlayın:**
```bash
git clone <repo-url>
cd tavux
```

2. **Server bağımlılıklarını yükleyin:**
```bash
cd server
npm install
```

3. **Client bağımlılıklarını yükleyin:**
```bash
cd ../client
npm install
```

4. **Server'ı başlatın:**
```bash
cd ../server
node index.js
```

5. **Client'ı başlatın (yeni terminal):**
```bash
cd client
npm run dev
```

## Kullanım

### Erişim Linkleri

| Panel | URL | Açıklama |
|-------|-----|----------|
| Müşteri | http://localhost:5173 | Sipariş verme |
| Admin | http://localhost:5173/admin | Sipariş ve menü yönetimi |
| Kurye | http://localhost:5173/kurye | Teslimat takibi |

### Sipariş Durumları

| Durum | Açıklama |
|-------|----------|
| Yeni Sipariş | Sipariş alındı, onay bekliyor |
| Hazırlanıyor | Sipariş hazırlanıyor |
| Hazır | Sipariş hazır, kurye bekliyor |
| Yolda | Kurye yola çıktı |
| Teslim Edildi | Sipariş teslim edildi |
| İptal | Sipariş iptal edildi |

## API Dokümantasyonu

### Genel Endpointler

```
GET  /api/menu              # Menüyü getir (müşteri için)
GET  /api/categories        # Kategorileri getir
POST /api/upload            # Görsel yükle
```

### Sipariş Endpointleri

```
GET  /api/orders            # Tüm siparişleri getir
POST /api/orders            # Yeni sipariş oluştur
GET  /api/orders/:id        # Sipariş detayı
PATCH /api/orders/:id/status # Sipariş durumu güncelle
```

### Müşteri Endpointleri

```
POST /api/customers         # Müşteri kaydı
GET  /api/customers/:phone  # Müşteri bilgileri
GET  /api/customers/:phone/orders # Müşteri siparişleri
DELETE /api/customers/:phone/orders/:orderId # Sipariş iptal
```

### Admin Endpointleri

```
GET    /api/admin/menu           # Tüm menü öğeleri
POST   /api/admin/menu           # Ürün ekle
PUT    /api/admin/menu/:id       # Ürün güncelle
DELETE /api/admin/menu/:id       # Ürün sil

POST   /api/admin/categories     # Kategori ekle
PUT    /api/admin/categories/:id # Kategori güncelle
DELETE /api/admin/categories/:id # Kategori sil
```

### Kurye Endpointleri

```
GET /api/courier/order/:shortId  # Kısa ID ile sipariş ara
```

## Proje Yapısı

```
tavux/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Bileşenleri
│   │   │   ├── Menu.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── MyOrders.jsx
│   │   │   └── Register.jsx
│   │   ├── pages/          # Sayfa Bileşenleri
│   │   │   ├── CustomerApp.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   └── CourierPanel.jsx
│   │   ├── App.jsx         # Ana uygulama
│   │   ├── main.jsx        # Giriş noktası
│   │   └── index.css       # Stiller
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Node.js Backend
│   ├── index.js            # Ana sunucu dosyası
│   ├── uploads/            # Yüklenen görseller
│   ├── durumcu.db          # SQLite veritabanı
│   └── package.json
│
└── README.md
```

## Teknolojiler

### Frontend
- **React 18** - UI Framework
- **Vite 6** - Build Tool
- **Tailwind CSS** - Styling
- **React Router DOM 7** - Routing
- **Socket.io Client** - Gerçek zamanlı iletişim
- **Lucide React** - İkonlar

### Backend
- **Node.js** - Runtime
- **Express** - Web Framework
- **Socket.io** - WebSocket
- **better-sqlite3** - Veritabanı
- **Multer** - Dosya yükleme
- **UUID** - Benzersiz ID üretimi

### Veritabanı
- **SQLite** - Hafif, dosya tabanlı veritabanı

## Ekran Görüntüleri

### Müşteri Arayüzü
- Hoş geldiniz ekranı ve menü
- Kategori filtreleme (kaydırılabilir)
- Sepet ve ödeme
- Sipariş takibi

### Admin Paneli
- Anlık sipariş listesi
- Menü ve kategori yönetimi
- Görsel yükleme

### Kurye Paneli
- ID ile sipariş arama
- Teslimat onaylama

## Lisans

MIT License

## Geliştirici

Eray Çiçek

---

**Afiyet olsun!**
