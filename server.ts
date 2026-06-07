import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Active sessions: token -> expiry timestamp
const sessions = new Map<string, number>();
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT NOT NULL,
      customer TEXT NOT NULL,
      item TEXT NOT NULL,
      total_gbp REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware for protected routes
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers['x-auth-token'] as string;
  if (!token) return res.status(401).json({ error: 'Unauthorised' });
  const expiry = sessions.get(token);
  if (!expiry || Date.now() > expiry) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }
  next();
}

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USERNAME || 'admin';
  const validPass = process.env.ADMIN_PASSWORD || 'printworks';
  if (username === validUser && password === validPass) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_TTL);
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid username or password' });
});

// Logout
app.post('/api/logout', (req, res) => {
  const token = req.headers['x-auth-token'] as string;
  if (token) sessions.delete(token);
  res.json({ success: true });
});

// Serve static frontend
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Protected API Routes
app.get('/api/orders', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows.map(mapOrder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { customer, item, totalGbp, status } = req.body;
  if (!customer || !item || totalGbp === undefined || totalGbp === null) {
    return res.status(400).json({ error: 'customer, item, and totalGbp are required' });
  }
  try {
    const last = await pool.query('SELECT order_number FROM orders ORDER BY id DESC LIMIT 1');
    let nextNum = 130;
    if (last.rows.length > 0) {
      const parts = last.rows[0].order_number.split('-');
      nextNum = parseInt(parts[2], 10) + 1;
    }
    const orderNumber = `ORD-2025-${String(nextNum).padStart(4, '0')}`;
    const { rows } = await pool.query(
      'INSERT INTO orders (order_number, customer, item, total_gbp, status, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *',
      [orderNumber, customer, item, totalGbp, status || 'Pending']
    );
    res.status(201).json(mapOrder(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.patch('/api/orders/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  const valid = ['Pending', 'Printing', 'Payment Required', 'Collected'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const { rows } = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(mapOrder(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

app.delete('/api/orders/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Public order form
app.get('/order', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
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

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`PrintWorks API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialise database:', err);
    process.exit(1);
  });
