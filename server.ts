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

// Send email via Resend
async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'Printworks <orders@resend.dev>',
        to,
        subject,
        html,
      }),
    });
  } catch (err) {
    console.error('Email send failed:', err);
  }
}

function orderConfirmationEmail(customer: string, orderNumber: string, item: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0e1014;color:#e8e8e8;border-radius:16px;padding:32px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
        <div style="width:36px;height:36px;background:rgba(34,197,94,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#22c55e;font-size:18px;">⬡</span>
        </div>
        <div>
          <p style="margin:0;font-size:14px;font-weight:800;letter-spacing:0.05em;color:#e8e8e8;">PRINTWORKS</p>
          <p style="margin:0;font-size:10px;color:#4a4f5a;letter-spacing:0.1em;text-transform:uppercase;">3D Print Lab</p>
        </div>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#e8e8e8;margin:0 0 8px;">Order Received!</h1>
      <p style="color:#4a4f5a;font-size:14px;line-height:1.6;margin:0 0 24px;">Hi ${customer}, thanks for your order! We have received it and will get started soon.</p>
      <div style="background:#141720;border:1px solid #1e2228;border-radius:16px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:10px;color:#4a4f5a;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">Order Number</p>
        <p style="margin:0 0 16px;font-size:20px;font-weight:700;font-family:monospace;color:#22c55e;">${orderNumber}</p>
        <p style="margin:0 0 4px;font-size:10px;color:#4a4f5a;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">Item</p>
        <p style="margin:0;font-size:14px;color:#e8e8e8;">${item}</p>
      </div>
      <p style="color:#4a4f5a;font-size:13px;line-height:1.6;margin:0;">We will email you again when your print is ready to collect. If you have any questions, just reply to this email.</p>
    </div>
  `;
}

function readyToCollectEmail(customer: string, orderNumber: string, item: string, totalGbp: number) {
  const priceText = totalGbp > 0 ? `<p style="margin:0 0 4px;font-size:10px;color:#4a4f5a;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">Total</p><p style="margin:0 0 16px;font-size:18px;font-weight:700;font-family:monospace;color:#e8e8e8;">£${totalGbp.toFixed(2)}</p>` : '';
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0e1014;color:#e8e8e8;border-radius:16px;padding:32px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
        <div style="width:36px;height:36px;background:rgba(34,197,94,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#22c55e;font-size:18px;">⬡</span>
        </div>
        <div>
          <p style="margin:0;font-size:14px;font-weight:800;letter-spacing:0.05em;color:#e8e8e8;">PRINTWORKS</p>
          <p style="margin:0;font-size:10px;color:#4a4f5a;letter-spacing:0.1em;text-transform:uppercase;">3D Print Lab</p>
        </div>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#22c55e;margin:0 0 8px;">Ready to Collect!</h1>
      <p style="color:#4a4f5a;font-size:14px;line-height:1.6;margin:0 0 24px;">Hi ${customer}, great news — your 3D print is ready to collect! Pop in whenever suits you.</p>
      <div style="background:#141720;border:1px solid #1e2228;border-radius:16px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:10px;color:#4a4f5a;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">Order Number</p>
        <p style="margin:0 0 16px;font-size:20px;font-weight:700;font-family:monospace;color:#22c55e;">${orderNumber}</p>
        <p style="margin:0 0 4px;font-size:10px;color:#4a4f5a;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">Item</p>
        <p style="margin:0 0 16px;font-size:14px;color:#e8e8e8;">${item}</p>
        ${priceText}
      </div>
      <p style="color:#4a4f5a;font-size:13px;line-height:1.6;margin:0;">See you soon!</p>
    </div>
  `;
}

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
      email TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT ''`);
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
  const { customer, item, totalGbp, status, notes, email } = req.body;
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
      'INSERT INTO orders (order_number, customer, item, total_gbp, status, notes, email, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *',
      [orderNumber, customer, item, totalGbp, status || 'Pending', notes || '', email || '']
    );
    const order = mapOrder(rows[0]);

    // Send confirmation email automatically
    if (email) {
      await sendEmail(
        email,
        `Order Received - ${orderNumber}`,
        orderConfirmationEmail(customer, orderNumber, item)
      );
    }

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.patch('/api/orders/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, notes, totalGbp, email } = req.body;
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (status !== undefined) {
    const valid = ['Pending', 'Printing', 'Payment Required', 'Collected'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    updates.push(`status = $${idx++}`); values.push(status);
  }
  if (notes !== undefined) { updates.push(`notes = $${idx++}`); values.push(notes); }
  if (totalGbp !== undefined) { updates.push(`total_gbp = $${idx++}`); values.push(totalGbp); }
  if (email !== undefined) { updates.push(`email = $${idx++}`); values.push(email); }

  if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

  values.push(id);
  try {
    const { rows } = await pool.query(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = mapOrder(rows[0]);

    // Auto-send "ready to collect" email when status changes to Collected
    if (status === 'Collected' && order.email) {
      await sendEmail(
        order.email,
        `Ready to Collect - ${order.orderNumber}`,
        readyToCollectEmail(order.customer, order.orderNumber, order.item, order.totalGbp)
      );
    }

    res.json(order);
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

app.get('/order', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

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
    notes: row.notes || '',
    email: row.email || '',
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
