const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_COOKIE = 'admin_session';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const adminSessions = new Map();

function parseCookies(cookieHeader) {
  const out = {};
  const raw = String(cookieHeader || '');
  if (!raw) return out;

  const parts = raw.split(';');
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=');
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join('=') || '');
  }
  return out;
}

function setAdminCookie(res, token) {
  const isProduction = NODE_ENV === 'production';
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  });
}

function clearAdminCookie(res) {
  res.cookie(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 0,
    path: '/'
  });
}

function isAdmin(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[ADMIN_COOKIE];
  return Boolean(token && adminSessions.has(token));
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function ensureStorage() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.mkdir(UPLOADS_DIR, { recursive: true });
  try {
    await fsp.access(REPORTS_FILE);
  } catch {
    await fsp.writeFile(REPORTS_FILE, JSON.stringify([]), 'utf8');
  }
}

async function readReports() {
  const raw = await fsp.readFile(REPORTS_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeReports(reports) {
  await fsp.writeFile(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf8');
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (_req, file, cb) {
    const safeExt = path.extname(file.originalname || '').slice(0, 10);
    const name = `report_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/admin/me', (req, res) => {
  res.json({ authenticated: isAdmin(req) });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (String(username) !== ADMIN_USER || String(password) !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  adminSessions.set(token, { createdAt: Date.now() });
  setAdminCookie(res, token);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[ADMIN_COOKIE];
  if (token) adminSessions.delete(token);
  clearAdminCookie(res);
  res.json({ ok: true });
});

app.get('/api/reports', async (_req, res) => {
  try {
    const reports = await readReports();
    res.json(reports);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read reports' });
  }
});

app.post('/api/reports', upload.single('image'), async (req, res) => {
  try {
    const { description, lat, lng } = req.body;
    const image = req.file;

    if (!image) return res.status(400).json({ error: 'Image is required' });

    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return res.status(400).json({ error: 'Valid GPS coordinates are required' });
    }

    const report = {
      id: `r_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      description: String(description || '').trim(),
      lat: latNum,
      lng: lngNum,
      imageUrl: `/uploads/${image.filename}`,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const reports = await readReports();
    reports.unshift(report);
    await writeReports(reports);

    res.status(201).json(report);
  } catch (_e) {
    res.status(500).json({ error: 'Failed to create report' });
  }
});

app.put('/api/reports/:id/resolve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const reports = await readReports();
    const idx = reports.findIndex((r) => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Report not found' });

    reports[idx] = { ...reports[idx], status: 'Resolved', resolvedAt: new Date().toISOString() };
    await writeReports(reports);

    res.json(reports[idx]);
  } catch (_e) {
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

app.delete('/api/reports/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const reports = await readReports();
    const idx = reports.findIndex((r) => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Report not found' });

    const [removed] = reports.splice(idx, 1);
    await writeReports(reports);

    if (removed && removed.imageUrl) {
      const filePath = path.join(__dirname, removed.imageUrl.replace(/^\//, ''));
      fs.unlink(filePath, () => {});
    }

    res.json({ ok: true });
  } catch (_e) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureStorage().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
