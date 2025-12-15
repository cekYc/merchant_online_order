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
`);

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

// API Routes

// Dosya yükleme endpoint'i
app.post('/api/upload', upload.single('image'), (req, res) => {
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
app.post('/api/admin/categories', (req, res) => {
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
app.put('/api/admin/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, emoji } = req.body;

  db.prepare('UPDATE categories SET name = ?, emoji = ? WHERE id = ?')
    .run(name, emoji, id);

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  io.emit('categoriesUpdated');
  res.json(category);
});

// Delete category (admin)
app.delete('/api/admin/categories/:id', (req, res) => {
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
app.get('/api/admin/menu', (req, res) => {
  const items = db.prepare('SELECT * FROM menu_items ORDER BY category, name').all();
  res.json(items);
});

// Add menu item
app.post('/api/admin/menu', (req, res) => {
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
app.put('/api/admin/menu/:id', (req, res) => {
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
app.delete('/api/admin/menu/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
  io.emit('menuUpdated');
  res.json({ success: true });
});

// Register/Login customer (by phone)
app.post('/api/customers/auth', (req, res) => {
  const { firstName, lastName, phone, address } = req.body;
  
  if (!firstName || !lastName || !phone || !address) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
  }

  // Check if customer exists
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
app.get('/api/orders', (req, res) => {
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

// Update order status
app.patch('/api/orders/:id/status', (req, res) => {
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
