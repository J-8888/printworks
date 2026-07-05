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

const sessions = new Map<string, number>();
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7;

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
      notes TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS filaments (
      id SERIAL PRIMARY KEY,
      brand TEXT NOT NULL,
      colour TEXT NOT NULL,
      colour_hex TEXT NOT NULL DEFAULT '#22c55e',
      material TEXT NOT NULL,
      total_weight_g REAL NOT NULL,
      remaining_weight_g REAL NOT NULL,
      cost_per_gram REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Usable',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE filaments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Usable'`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_filaments (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      filament_id INTEGER NOT NULL REFERENCES filaments(id) ON DELETE CASCADE,
      grams_used REAL NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

app.use(cors());
app.use(express.json());

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

app.post('/api/logout', (req, res) => {
  const token = req.headers['x-auth-token'] as string;
  if (token) sessions.delete(token);
  res.json({ success: true });
});

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// ── Orders ──────────────────────────────────────────────
app.get('/api/orders', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows.map(mapOrder));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch orders' }); }
});

app.post('/api/orders', async (req, res) => {
  const { customer, item, totalGbp, status, notes, phone } = req.body;
  if (!customer || !item || totalGbp === undefined || totalGbp === null)
    return res.status(400).json({ error: 'customer, item, and totalGbp are required' });
  try {
    const last = await pool.query('SELECT order_number FROM orders ORDER BY id DESC LIMIT 1');
    let nextNum = 130;
    if (last.rows.length > 0) {
      const parts = last.rows[0].order_number.split('-');
      nextNum = parseInt(parts[2], 10) + 1;
    }
    const orderNumber = `ORD-2025-${String(nextNum).padStart(4, '0')}`;
    const { rows } = await pool.query(
      'INSERT INTO orders (order_number, customer, item, total_gbp, status, notes, phone, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *',
      [orderNumber, customer, item, totalGbp, status || 'Pending', notes || '', phone || '']
    );
    res.status(201).json(mapOrder(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create order' }); }
});

app.patch('/api/orders/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, notes, totalGbp, phone } = req.body;
  const updates: string[] = []; const values: any[] = []; let idx = 1;
  if (status !== undefined) {
    const valid = ['Pending', 'Printing', 'Payment Required', 'Collected'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    updates.push(`status = $${idx++}`); values.push(status);
  }
  if (notes !== undefined) { updates.push(`notes = $${idx++}`); values.push(notes); }
  if (totalGbp !== undefined) { updates.push(`total_gbp = $${idx++}`); values.push(totalGbp); }
  if (phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(phone); }
  if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });
  values.push(id);
  try {
    const { rows } = await pool.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(mapOrder(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update order' }); }
});

app.delete('/api/orders/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete order' }); }
});

// ── Filaments ────────────────────────────────────────────
app.get('/api/filaments', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM filaments ORDER BY created_at DESC');
    res.json(rows.map(mapFilament));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch filaments' }); }
});

app.post('/api/filaments', requireAuth, async (req, res) => {
  const { brand, colour, colourHex, material, totalWeightG, costPerGram, status } = req.body;
  if (!brand || !colour || !material || !totalWeightG)
    return res.status(400).json({ error: 'brand, colour, material, totalWeightG are required' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO filaments (brand, colour, colour_hex, material, total_weight_g, remaining_weight_g, cost_per_gram, status) VALUES ($1,$2,$3,$4,$5,$5,$6,$7) RETURNING *',
      [brand, colour, colourHex || '#22c55e', material, totalWeightG, costPerGram || 0, status || 'Usable']
    );
    res.status(201).json(mapFilament(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create filament' }); }
});

app.patch('/api/filaments/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { brand, colour, colourHex, material, totalWeightG, remainingWeightG, costPerGram, status } = req.body;
  const updates: string[] = []; const values: any[] = []; let idx = 1;
  if (brand !== undefined) { updates.push(`brand = $${idx++}`); values.push(brand); }
  if (colour !== undefined) { updates.push(`colour = $${idx++}`); values.push(colour); }
  if (colourHex !== undefined) { updates.push(`colour_hex = $${idx++}`); values.push(colourHex); }
  if (material !== undefined) { updates.push(`material = $${idx++}`); values.push(material); }
  if (totalWeightG !== undefined) { updates.push(`total_weight_g = $${idx++}`); values.push(totalWeightG); }
  if (remainingWeightG !== undefined) { updates.push(`remaining_weight_g = $${idx++}`); values.push(remainingWeightG); }
  if (costPerGram !== undefined) { updates.push(`cost_per_gram = $${idx++}`); values.push(costPerGram); }
  if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status); }
  if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });
  values.push(id);
  try {
    const { rows } = await pool.query(`UPDATE filaments SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Filament not found' });
    res.json(mapFilament(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update filament' }); }
});

app.delete('/api/filaments/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM filaments WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Filament not found' });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete filament' }); }
});

// ── Order Filament Usage ─────────────────────────────────
app.get('/api/orders/:id/filaments', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT of.id, of.grams_used, f.id as filament_id, f.brand, f.colour, f.colour_hex, f.material, f.cost_per_gram
       FROM order_filaments of JOIN filaments f ON f.id = of.filament_id
       WHERE of.order_id = $1`, [id]
    );
    res.json(rows.map(r => ({
      id: String(r.id), gramsUsed: r.grams_used,
      filamentId: String(r.filament_id), brand: r.brand, colour: r.colour,
      colourHex: r.colour_hex, material: r.material, costPerGram: r.cost_per_gram,
      totalCost: r.grams_used * r.cost_per_gram,
    })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch order filaments' }); }
});

app.post('/api/orders/:id/filaments', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { filamentId, gramsUsed } = req.body;
  if (!filamentId || !gramsUsed) return res.status(400).json({ error: 'filamentId and gramsUsed are required' });
  try {
    await pool.query(
      'INSERT INTO order_filaments (order_id, filament_id, grams_used) VALUES ($1,$2,$3)',
      [id, filamentId, gramsUsed]
    );
    await pool.query(
      'UPDATE filaments SET remaining_weight_g = GREATEST(0, remaining_weight_g - $1) WHERE id = $2',
      [gramsUsed, filamentId]
    );
    res.status(201).json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to log filament usage' }); }
});

app.delete('/api/orders/:orderId/filaments/:usageId', requireAuth, async (req, res) => {
  const { orderId, usageId } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT filament_id, grams_used FROM order_filaments WHERE id = $1 AND order_id = $2',
      [usageId, orderId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usage not found' });
    await pool.query('DELETE FROM order_filaments WHERE id = $1', [usageId]);
    await pool.query(
      'UPDATE filaments SET remaining_weight_g = LEAST(total_weight_g, remaining_weight_g + $1) WHERE id = $2',
      [rows[0].grams_used, rows[0].filament_id]
    );
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to remove filament usage' }); }
});

app.get('/order', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

function mapOrder(row: any) {
  return {
    id: String(row.id), orderNumber: row.order_number, customer: row.customer,
    item: row.item, totalGbp: row.total_gbp, status: row.status,
    notes: row.notes || '', phone: row.phone || '', createdAt: row.created_at,
  };
}

function mapFilament(row: any) {
  return {
    id: String(row.id), brand: row.brand, colour: row.colour,
    colourHex: row.colour_hex, material: row.material,
    totalWeightG: row.total_weight_g, remainingWeightG: row.remaining_weight_g,
    costPerGram: row.cost_per_gram, status: row.status || 'Usable',
    createdAt: row.created_at,
  };
}

initDb()
  .then(() => { app.listen(PORT, () => console.log(`PrintWorks API running on port ${PORT}`)); })
  .catch((err) => { console.error('Failed to initialise database:', err); process.exit(1); });
