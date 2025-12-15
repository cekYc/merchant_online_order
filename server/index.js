import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// JWT Secret Key - Üretimde .env dosyasından alınmalı
const JWT_SECRET = process.env.JWT_SECRET || 'tavux-super-secret-key-2024-change-in-production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Uploads klasörünü oluştur
const uploadsDir = join(__dirname, 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// Multer ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = file.originalname.split('.').pop();
    cb(null, `${uniqueName}.${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece JPEG, PNG, GIF ve WebP dosyaları yüklenebilir'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Database setup
const db = new Database(join(__dirname, 'durumcu.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '🍽️',
    sortOrder INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image TEXT,
    available INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customerId TEXT NOT NULL,
    items TEXT NOT NULL,
    totalAmount REAL NOT NULL,
    paymentMethod TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    note TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Varsayılan admin kullanıcısı oluştur (yoksa)
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
if (adminCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (id, username, password, role) VALUES (?, ?, ?, ?)').run(
    uuidv4(), 'admin', hashedPassword, 'admin'
  );
  console.log('Varsayılan admin oluşturuldu! (admin / admin123)');
}

// Seed default categories if empty
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (catCount.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (id, name, emoji, sortOrder) VALUES (?, ?, ?, ?)');
  insertCat.run('durum', 'Dürümler', '🌯', 1);
  insertCat.run('porsiyon', 'Porsiyonlar', '🍖', 2);
  insertCat.run('icecek', 'İçecekler', '🥤', 3);
  insertCat.run('ekstra', 'Ekstralar', '🍟', 4);
  console.log('Varsayılan kategoriler eklendi!');
}

// Seed menu items if empty
const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();
if (menuCount.count === 0) {
  const insertMenu = db.prepare(`
    INSERT INTO menu_items (name, description, price, category, image) 
    VALUES (?, ?, ?, ?, ?)
  `);

  const menuItems = [
    // Dürümler
    ['Tavuk Dürüm', 'Izgara tavuk, domates, marul, soğan, özel sos', 85, 'durum', '🌯'],
    ['Et Dürüm', 'Dana eti, domates, marul, soğan, özel sos', 110, 'durum', '🌯'],
    ['Köfte Dürüm', 'Izgara köfte, domates, marul, soğan, özel sos', 95, 'durum', '🌯'],
    ['Adana Dürüm', 'Acılı Adana kebap, domates, soğan, maydanoz', 105, 'durum', '🌯'],
    ['Karışık Dürüm', 'Tavuk + et karışık, tüm malzemeler', 120, 'durum', '🌯'],
    ['Lahmacun Dürüm', 'Lahmacun içinde döner, yeşillik', 90, 'durum', '🌯'],
    
    // Porsiyon
    ['Tavuk Porsiyon', 'Izgara tavuk göğsü, pilav, salata ile', 130, 'porsiyon', '🍗'],
    ['Et Porsiyon', 'Dana ızgara, pilav, salata ile', 160, 'porsiyon', '🥩'],
    ['Köfte Porsiyon', '6 adet ızgara köfte, pilav, salata ile', 140, 'porsiyon', '🍖'],
    ['Adana Porsiyon', 'Adana kebap, pilav, közlenmiş sebze', 150, 'porsiyon', '🍖'],
    
    // İçecekler
    ['Ayran', 'Taze ayran 300ml', 15, 'icecek', '🥛'],
    ['Kola', 'Coca Cola 330ml', 25, 'icecek', '🥤'],
    ['Fanta', 'Fanta 330ml', 25, 'icecek', '🥤'],
    ['Sprite', 'Sprite 330ml', 25, 'icecek', '🥤'],
    ['Su', 'Su 500ml', 10, 'icecek', '💧'],
    ['Şalgam', 'Acılı şalgam suyu 300ml', 15, 'icecek', '🧃'],
    
    // Ekstralar
    ['Patates Kızartması', 'Çıtır patates kızartması', 40, 'ekstra', '🍟'],
    ['Közlenmiş Biber', 'Közde pişmiş sivri biber', 15, 'ekstra', '🌶️'],
    ['Közlenmiş Domates', 'Közde pişmiş domates', 10, 'ekstra', '🍅'],
    ['Ek Sos', 'Özel sos / Acı sos', 5, 'ekstra', '🫙'],
  ];

  for (const item of menuItems) {
    insertMenu.run(...item);
  }
  console.log('Menü öğeleri eklendi!');
}

// =============================================
// ADMIN AUTH MIDDLEWARE
// =============================================
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkilendirme başlığı eksik' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = db.prepare('SELECT id, username, role FROM admins WHERE id = ?').get(decoded.adminId);
    
    if (!admin) {
      return res.status(401).json({ error: 'Geçersiz token' });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token geçersiz veya süresi dolmuş' });
  }
};

// =============================================
// ADMIN AUTH ROUTES
// =============================================

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
  }
  
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  
  if (!admin) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  }
  
  const isValidPassword = bcrypt.compareSync(password, admin.password);
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  }
  
  // Token oluştur (24 saat geçerli)
  const token = jwt.sign(
    { adminId: admin.id, username: admin.username, role: admin.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role
    }
  });
});

// Verify Token
app.get('/api/admin/verify', authenticateAdmin, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

// Change Admin Password
app.post('/api/admin/change-password', authenticateAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gerekli' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalı' });
  }
  
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  
  if (!bcrypt.compareSync(currentPassword, admin.password)) {
    return res.status(401).json({ error: 'Mevcut şifre hatalı' });
  }
  
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashedPassword, req.admin.id);
  
  res.json({ message: 'Şifre başarıyla değiştirildi' });
});

// API Routes

// Dosya yükleme endpoint'i (Admin only)
app.post('/api/upload', authenticateAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenmedi' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
  } catch (error) {
    res.status(500).json({ error: 'Dosya yüklenirken hata oluştu' });
  }
});

// Get categories
app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sortOrder').all();
  res.json(categories);
});

// Add category (admin)
app.post('/api/admin/categories', authenticateAdmin, (req, res) => {
  const { id, name, emoji } = req.body;
  
  if (!id || !name) {
    return res.status(400).json({ error: 'ID ve isim zorunludur' });
  }

  // Check if category ID already exists
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (existing) {
    return res.status(400).json({ error: 'Bu ID zaten kullanılıyor' });
  }

  const maxOrder = db.prepare('SELECT MAX(sortOrder) as max FROM categories').get();
  const newOrder = (maxOrder.max || 0) + 1;

  db.prepare('INSERT INTO categories (id, name, emoji, sortOrder) VALUES (?, ?, ?, ?)')
    .run(id, name, emoji || '🍽️', newOrder);

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  io.emit('categoriesUpdated');
  res.json(category);
});

// Update category (admin)
app.put('/api/admin/categories/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { name, emoji } = req.body;

  db.prepare('UPDATE categories SET name = ?, emoji = ? WHERE id = ?')
    .run(name, emoji, id);

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  io.emit('categoriesUpdated');
  res.json(category);
});

// Delete category (admin)
app.delete('/api/admin/categories/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;

  // Check if category has items
  const itemCount = db.prepare('SELECT COUNT(*) as count FROM menu_items WHERE category = ?').get(id);
  if (itemCount.count > 0) {
    return res.status(400).json({ 
      error: `Bu kategoride ${itemCount.count} ürün var. Önce ürünleri silmeniz veya başka kategoriye taşımanız gerekiyor.` 
    });
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  io.emit('categoriesUpdated');
  res.json({ success: true });
});

// Get menu items (for customers - only available)
app.get('/api/menu', (req, res) => {
  const items = db.prepare('SELECT * FROM menu_items WHERE available = 1').all();
  res.json(items);
});

// Get all menu items (for admin - including unavailable)
app.get('/api/admin/menu', authenticateAdmin, (req, res) => {
  const items = db.prepare('SELECT * FROM menu_items ORDER BY category, name').all();
  res.json(items);
});

// Add menu item
app.post('/api/admin/menu', authenticateAdmin, (req, res) => {
  const { name, description, price, category, image } = req.body;
  
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Ad, fiyat ve kategori zorunludur' });
  }

  const result = db.prepare(`
    INSERT INTO menu_items (name, description, price, category, image, available)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(name, description || '', price, category, image || '🍽️');

  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);
  io.emit('menuUpdated');
  res.json(item);
});

// Update menu item
app.put('/api/admin/menu/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, image, available } = req.body;

  db.prepare(`
    UPDATE menu_items 
    SET name = ?, description = ?, price = ?, category = ?, image = ?, available = ?
    WHERE id = ?
  `).run(name, description, price, category, image, available ? 1 : 0, id);

  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  io.emit('menuUpdated');
  res.json(item);
});

// Delete menu item
app.delete('/api/admin/menu/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
  io.emit('menuUpdated');
  res.json({ success: true });
});

// SMS kodlarını geçici olarak tutacak (gerçek uygulamada Redis kullanılabilir)
const verificationCodes = new Map();

// Generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send verification code (SMS simulation)
app.post('/api/auth/send-code', (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'Telefon numarası gerekli' });
  }

  const code = generateCode();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 dakika geçerli
  
  verificationCodes.set(phone, { code, expiresAt });
  
  // SMS simülasyonu - gerçek uygulamada Twilio/Netgsm kullanılır
  console.log(`\n📱 SMS GÖNDERİLDİ`);
  console.log(`   Telefon: ${phone}`);
  console.log(`   Doğrulama Kodu: ${code}`);
  console.log(`   Geçerlilik: 5 dakika\n`);
  
  // Müşterinin kayıtlı olup olmadığını kontrol et
  const customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
  
  res.json({ 
    success: true, 
    message: 'Doğrulama kodu gönderildi',
    isRegistered: !!customer,
    // Development modda kodu da gönder (production'da kaldırılmalı)
    devCode: process.env.NODE_ENV !== 'production' ? code : undefined
  });
});

// Verify code and login
app.post('/api/auth/verify-code', (req, res) => {
  const { phone, code } = req.body;
  
  if (!phone || !code) {
    return res.status(400).json({ error: 'Telefon ve kod gerekli' });
  }

  const stored = verificationCodes.get(phone);
  
  if (!stored) {
    return res.status(400).json({ error: 'Doğrulama kodu bulunamadı. Yeni kod isteyin.' });
  }
  
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(phone);
    return res.status(400).json({ error: 'Doğrulama kodunun süresi dolmuş. Yeni kod isteyin.' });
  }
  
  if (stored.code !== code) {
    return res.status(400).json({ error: 'Yanlış doğrulama kodu' });
  }
  
  // Kod doğru, temizle
  verificationCodes.delete(phone);
  
  // Müşteriyi getir
  const customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
  
  res.json({ 
    success: true, 
    customer,
    isRegistered: !!customer
  });
});

// Register new customer (after phone verification)
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, phone, address } = req.body;
  
  if (!firstName || !lastName || !phone || !address) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
  }

  // Check if customer already exists
  let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
  
  if (customer) {
    // Update existing customer
    db.prepare(`
      UPDATE customers SET firstName = ?, lastName = ?, address = ? WHERE phone = ?
    `).run(firstName, lastName, address, phone);
    customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
  } else {
    // Create new customer
    const id = uuidv4();
    db.prepare(`
      INSERT INTO customers (id, firstName, lastName, phone, address)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, firstName, lastName, phone, address);
    customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  }
  
  res.json(customer);
});

// Legacy auth endpoint (keep for compatibility)
app.post('/api/customers/auth', (req, res) => {
  const { firstName, lastName, phone, address } = req.body;
  
  if (!firstName || !lastName || !phone || !address) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
  }

  let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
  
  if (customer) {
    db.prepare(`
      UPDATE customers SET firstName = ?, lastName = ?, address = ? WHERE phone = ?
    `).run(firstName, lastName, address, phone);
    customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
  } else {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO customers (id, firstName, lastName, phone, address)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, firstName, lastName, phone, address);
    customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  }
  
  res.json(customer);
});

// Get customer by phone
app.get('/api/customers/:phone', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(req.params.phone);
  if (customer) {
    res.json(customer);
  } else {
    res.status(404).json({ error: 'Müşteri bulunamadı' });
  }
});

// Create order
app.post('/api/orders', (req, res) => {
  const { customerId, items, totalAmount, paymentMethod, note } = req.body;
  
  if (!customerId || !items || !totalAmount || !paymentMethod) {
    return res.status(400).json({ error: 'Eksik bilgi' });
  }

  // Check if customer exists
  const customerExists = db.prepare('SELECT id FROM customers WHERE id = ?').get(customerId);
  if (!customerExists) {
    return res.status(400).json({ error: 'Müşteri bulunamadı. Lütfen tekrar giriş yapın.' });
  }

  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO orders (id, customerId, items, totalAmount, paymentMethod, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, customerId, JSON.stringify(items), totalAmount, paymentMethod, note || '');

  const order = db.prepare(`
    SELECT o.*, c.firstName, c.lastName, c.phone, c.address
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    WHERE o.id = ?
  `).get(id);

  order.items = JSON.parse(order.items);
  
  // Emit to admin panel
  io.emit('newOrder', order);
  
  res.json(order);
});

// Get all orders (for admin)
app.get('/api/orders', authenticateAdmin, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, c.firstName, c.lastName, c.phone, c.address
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    ORDER BY o.createdAt DESC
  `).all();
  
  orders.forEach(order => {
    order.items = JSON.parse(order.items);
  });
  
  res.json(orders);
});

// Get customer orders (for customer to see their orders)
app.get('/api/customers/:customerId/orders', (req, res) => {
  const { customerId } = req.params;
  const orders = db.prepare(`
    SELECT o.*, c.firstName, c.lastName, c.phone, c.address
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    WHERE o.customerId = ?
    ORDER BY o.createdAt DESC
  `).all(customerId);
  
  orders.forEach(order => {
    order.items = JSON.parse(order.items);
  });
  
  res.json(orders);
});

// Get single order (for courier) - supports full ID or short ID (last 8 chars)
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  let order;
  
  // Try full ID first
  order = db.prepare(`
    SELECT o.*, c.firstName, c.lastName, c.phone, c.address
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    WHERE o.id = ?
  `).get(id);
  
  // If not found, try matching last 8 characters (short ID)
  if (!order && id.length <= 8) {
    order = db.prepare(`
      SELECT o.*, c.firstName, c.lastName, c.phone, c.address
      FROM orders o
      JOIN customers c ON o.customerId = c.id
      WHERE UPPER(SUBSTR(o.id, -8)) = UPPER(?)
    `).get(id);
  }
  
  if (!order) {
    return res.status(404).json({ error: 'Sipariş bulunamadı' });
  }
  
  order.items = JSON.parse(order.items);
  res.json(order);
});

// Cancel order (for customer - only if not out for delivery)
app.patch('/api/orders/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { customerId } = req.body;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  
  if (!order) {
    return res.status(404).json({ error: 'Sipariş bulunamadı' });
  }
  
  if (order.customerId !== customerId) {
    return res.status(403).json({ error: 'Bu siparişi iptal etme yetkiniz yok' });
  }
  
  // Can only cancel if not out for delivery or delivered
  if (order.status === 'out_for_delivery' || order.status === 'delivered') {
    return res.status(400).json({ error: 'Yola çıkmış veya teslim edilmiş siparişler iptal edilemez' });
  }
  
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('cancelled', id);
  
  const updatedOrder = db.prepare(`
    SELECT o.*, c.firstName, c.lastName, c.phone, c.address
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    WHERE o.id = ?
  `).get(id);
  
  updatedOrder.items = JSON.parse(updatedOrder.items);
  io.emit('orderUpdated', updatedOrder);
  
  res.json(updatedOrder);
});

// Update order status (admin/courier only)
app.patch('/api/orders/:id/status', authenticateAdmin, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  
  const order = db.prepare(`
    SELECT o.*, c.firstName, c.lastName, c.phone, c.address
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    WHERE o.id = ?
  `).get(id);
  
  order.items = JSON.parse(order.items);
  
  io.emit('orderUpdated', order);
  
  res.json(order);
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Yeni bağlantı:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Bağlantı kesildi:', socket.id);
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🌯 Dürümcü sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});
