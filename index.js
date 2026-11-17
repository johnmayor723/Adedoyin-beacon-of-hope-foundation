require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const seed = require('./lib/seed');
const { ensureOriginalSnapshot } = require('./lib/snapshots');
const { UPLOAD_DIR, csrfToken } = require('./lib/helpers');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/adedoyin';
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
  next();
});
app.use(express.urlencoded({ extended: true, limit: '1mb', parameterLimit: 5000 }));
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: isProd ? '7d' : 0 }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: isProd ? '7d' : 0, setHeaders: (res) => res.set('Content-Disposition', 'inline') }));

if (isProd && !process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET must be set in production.'); process.exit(1);
}
app.use(session({
  name: 'abhf.sid',
  secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI, ttl: 60 * 60 * 24 * 7, autoRemove: 'interval', autoRemoveInterval: 30 }),
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.SECURE_COOKIES === '1', maxAge: 1000 * 60 * 60 * 24 * 7 },
}));
app.use((req, res, next) => { res.locals.csrf = csrfToken(req); next(); });

app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/site'));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(err.status || 500).send(err.status === 403 || err.code === 'LIMIT_FILE_SIZE' || /Only JPG/.test(err.message) ? err.message : 'Something went wrong.');
});

mongoose.connect(MONGO_URI)
  .then(() => seed())
  .then(() => ensureOriginalSnapshot())
  .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}  (admin: /admin)`)))
  .catch((e) => { console.error('Failed to start:', e.message); process.exit(1); });
