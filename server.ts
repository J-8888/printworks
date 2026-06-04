import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Database setup
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'printworks.db');
const dir = path.dirname(dbPath);
import { mkdirSync } from 'fs';
mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL,
    customer TEXT NOT NULL,
    item TEXT NOT NULL,
    total_gbp REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Seed if empty
const count = db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number };
if (count.c === 0) {
  const insert = db.prepare(
    'INSERT INTO orders (order_number, customer, item, total_gbp, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const seeds = [
    ['ORD-2025-0129', 'James Walker', 'Spur Gear 32T', 18.40, 'Pending', '2025-06-04T10:42:00Z'],
    ['ORD-2025-0128', 'Laura Chapman', 'Camera Mount', 24.99, 'Printing', '2025-06-04T09:15:00Z'],
    ['ORD-2025-0127', 'Michael Reeves', 'D&D Castle Tower', 34.00, 'Payment Required', '2025-06-03T16:33:00Z'],
    ['ORD-2025-0126', 'Sarah Bennett', 'Geometric Planter', 16.50, 'Collected', '2025-06-03T14:08:00Z'],
    ['ORD-2025-0125', 'Daniel Turner', 'Door Hinge', 22.80, 'Pending', '2025-06-03T11:27:00Z'],
  ];
  for (const s of seeds) {
    insert.run(...s);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// API Routes
app.get('/api/orders', (_req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(orders.map(mapOrder));
});

app.post('/api/orders', (req, res) => {
  const { customer, item, totalGbp, status } = req.body;
  if (!customer || !item || !totalGbp) {
    return res.status(400).json({ error: 'customer, item, and totalGbp are required' });
  }
  const lastOrder = db.prepare("SELECT order_number FROM orders ORDER BY id DESC LIMIT 1").get() as { order_number: string } | undefined;
  let nextNum = 130;
  if (lastOrder) {
    const parts = lastOrder.order_number.split('-');
    nextNum = parseInt(parts[2], 10) + 1;
  }
  const orderNumber = `ORD-2025-${String(nextNum).padStart(4, '0')}`;
  const result = db.prepare(
    'INSERT INTO orders (order_number, customer, item, total_gbp, status, created_at) VALUES (?, ?, ?, ?, ?, datetime(?))'
  ).run(orderNumber, customer, item, totalGbp, status || 'Pending', new Date().toISOString());
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(mapOrder(order));
});

app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  const valid = ['Pending', 'Printing', 'Payment Required', 'Collected'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(mapOrder(order));
});

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true });
});

// SPA fallback
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

function mapOrder(row: any) {
  return {
    id: String(row.id),
    orderNumber: row.order_number,
    customer: row.customer,
    item: row.item,
    totalGbp: row.total_gbp,
    status: row.status,
    createdAt: row.created_at,
  };
}

app.listen(PORT, () => {
  console.log(`PrintWorks API running on port ${PORT}`);
});
