const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ---------- value coercion driven by schemas ---------- */
const BAD_URL = /^\s*(javascript|data|vbscript):/i;
const str = (v, max = 20000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function toArray(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') {
    return Object.keys(v).sort((a, b) => Number(a) - Number(b)).map((k) => v[k]);
  }
  return [];
}

function coerceValue(f, v) {
  switch (f.type) {
    case 'bool': return [].concat(v === undefined ? [] : v).includes('1');
    case 'number': { const n = Number(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : 0; }
    case 'select': return f.options.includes(v) ? v : '';
    case 'color': return /^#[0-9a-fA-F]{6}$/.test(str(v)) ? str(v) : '';
    case 'url': { const s = str(v, 2000); return BAD_URL.test(s) ? '' : s; }
    case 'image': { const s = str(v, 2000); return /^(\/|https?:\/\/)/.test(s) ? s : ''; }
    case 'group': return coerce(f.fields, v && typeof v === 'object' ? v : {});
    case 'list':
      return toArray(v)
        .map((item) => coerce(f.fields, item && typeof item === 'object' ? item : {}))
        .filter((item) => Object.entries(item).some(([k, val]) => {
          const sub = f.fields.find((x) => x.key === k);
          return sub.type !== 'bool' && sub.type !== 'number' && sub.type !== 'select' && val;
        }));
    default: return str(v, f.type === 'textarea' ? 20000 : 500);
  }
}

function coerce(fields, input = {}) {
  const out = {};
  for (const f of fields) out[f.key] = coerceValue(f, input[f.key]);
  return out;
}

/* ---------- misc ---------- */
const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '')
  .trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 80);

const paras = (text) => String(text || '').split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);

/* ---------- uploads ---------- */
const ALLOWED = { '.jpg': 1, '.jpeg': 1, '.png': 1, '.webp': 1, '.gif': 1 };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 40 },
  fileFilter: (req, file, cb) => {
    const ok = ALLOWED[path.extname(file.originalname).toLowerCase()] && /^image\//.test(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG, WEBP or GIF images up to 8MB are allowed.'), !!ok);
  },
});

/* ---------- CSRF (session token) ---------- */
function csrfToken(req) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  return req.session.csrf;
}
function verifyCsrf(req, res, next) {
  const sent = (req.body && req.body._csrf) || req.get('x-csrf-token') || req.query._csrf;
  const a = Buffer.from(String(sent || ''));
  const b = Buffer.from(csrfToken(req));
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next();
  res.status(403).send('Invalid or expired form token. Go back, refresh the page and try again.');
}

/* ---------- tiny in-memory rate limiter ---------- */
function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip + '|' + req.path;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) return res.status(429).send('Too many attempts. Please wait a few minutes and try again.');
    arr.push(now); hits.set(key, arr);
    if (hits.size > 5000) hits.clear();
    next();
  };
}

module.exports = { UPLOAD_DIR, coerce, toArray, slugify, paras, upload, csrfToken, verifyCsrf, rateLimit };
