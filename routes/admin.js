const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Content, Program, GalleryItem, Message, Subscriber, User } = require('../models');
const { pages, settingsGroups, programFields } = require('../lib/schemas');
const { coerce, slugify, upload, verifyCsrf, rateLimit, UPLOAD_DIR } = require('../lib/helpers');

const router = express.Router();
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);
const MIN_PW = 10;

const flash = (req, type, text) => { req.session.flash = { type, text }; };
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* ---------- auth ---------- */
router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/admin');
  const f = req.session.flash; delete req.session.flash;
  res.render('admin/login', { flash: f, csrf: res.locals.csrf });
});

router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 12 }), verifyCsrf, wrap(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const user = await User.findOne({ email });
  const ok = await bcrypt.compare(String(req.body.password || ''), user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok || !user.active) {
    flash(req, 'err', 'Invalid email or password.');
    return res.redirect('/admin/login');
  }
  await new Promise((r, j) => req.session.regenerate((e) => (e ? j(e) : r())));
  req.session.userId = String(user._id);
  user.lastLogin = new Date(); await user.save();
  res.redirect('/admin');
}));

router.post('/logout', verifyCsrf, (req, res) => req.session.destroy(() => res.redirect('/admin/login')));

router.use(wrap(async (req, res, next) => {
  const user = req.session.userId && await User.findById(req.session.userId).lean();
  if (!user || !user.active) {
    if (req.session) delete req.session.userId;
    return res.redirect('/admin/login');
  }
  res.locals.me = user;
  res.locals.isAdmin = user.role === 'admin';
  res.locals.flash = req.session.flash || null; delete req.session.flash;
  res.locals.unread = await Message.countDocuments({ read: false });
  res.locals.pageList = pages;
  res.locals.groupList = settingsGroups;
  res.locals.active = req.path;
  req.user = user;
  next();
}));

// Methods that change data must carry the CSRF token (multipart routes verify after multer parses).
router.use((req, res, next) => {
  if (req.method === 'POST' && !/^multipart\//.test(req.get('content-type') || '')) return verifyCsrf(req, res, next);
  next();
});
const adminOnly = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).render('admin/forbidden'));

/* ---------- dashboard ---------- */
router.get('/', wrap(async (req, res) => {
  const [programs, gallery, messages, subscribers, recent] = await Promise.all([
    Program.countDocuments(), GalleryItem.countDocuments(), Message.countDocuments(), Subscriber.countDocuments(),
    Message.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  res.render('admin/dashboard', { stats: { programs, gallery, messages, subscribers }, recent });
}));

/* ---------- media ---------- */
const IMG = /\.(jpe?g|png|webp|gif)$/i;
const listDir = (dir, prefix) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => IMG.test(f)).map((f) => ({ url: prefix + f, t: fs.statSync(path.join(dir, f)).mtimeMs })) : []);
router.get('/media', (req, res) => {
  const all = [...listDir(UPLOAD_DIR, '/uploads/'), ...listDir(path.join(__dirname, '..', 'public', 'images'), '/images/')];
  res.json(all.sort((a, b) => (b.url.startsWith('/uploads') - a.url.startsWith('/uploads')) || b.t - a.t).map((x) => x.url));
});
router.post('/upload', upload.single('file'), verifyCsrf, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: '/uploads/' + req.file.filename });
});

/* ---------- site settings (identity, contact, navigation, footer, colours) ---------- */
router.get('/settings', (req, res) => res.redirect('/admin/settings/identity'));
router.get('/settings/:group', adminOnly, wrap(async (req, res, next) => {
  const group = settingsGroups[req.params.group];
  if (!group) return next();
  const doc = await Content.findOne({ key: 'site' }).lean();
  res.render('admin/edit', { title: group.label, fields: group.fields, data: (doc && doc.data) || {}, action: req.originalUrl, back: null });
}));
router.post('/settings/:group', adminOnly, wrap(async (req, res, next) => {
  const group = settingsGroups[req.params.group];
  if (!group) return next();
  const clean = coerce(group.fields, req.body);
  const $set = {}; Object.keys(clean).forEach((k) => { $set['data.' + k] = clean[k]; });
  await Content.updateOne({ key: 'site' }, { $set }, { upsert: true });
  flash(req, 'ok', 'Saved. Changes are live on the website.');
  res.redirect(req.originalUrl);
}));

/* ---------- pages ---------- */
router.get('/pages', (req, res) => res.render('admin/pages'));
router.get('/pages/:key', wrap(async (req, res, next) => {
  const def = pages[req.params.key];
  if (!def) return next();
  const doc = await Content.findOne({ key: req.params.key }).lean();
  res.render('admin/edit', { title: def.label, fields: def.fields, data: (doc && doc.data) || {}, action: req.originalUrl, back: { url: def.url, label: 'View page' } });
}));
router.post('/pages/:key', wrap(async (req, res, next) => {
  const def = pages[req.params.key];
  if (!def) return next();
  await Content.updateOne({ key: req.params.key }, { $set: { data: coerce(def.fields, req.body) } }, { upsert: true });
  flash(req, 'ok', 'Saved. Changes are live on the website.');
  res.redirect(req.originalUrl);
}));

/* ---------- programs ---------- */
router.get('/programs', wrap(async (req, res) => {
  res.render('admin/programs', { programs: await Program.find().sort({ order: 1, createdAt: 1 }).lean() });
}));
router.get('/programs/new', (req, res) => res.render('admin/edit', {
  title: 'New program', fields: programFields, data: { published: true, featured: true, currency: '$', ctaLabel: 'Donate', ctaLink: '/donate', order: 99 },
  action: '/admin/programs', back: { url: '/admin/programs', label: '← All programs' },
}));

async function saveProgram(doc, body) {
  const d = coerce(programFields, body);
  if (!d.title) throw Object.assign(new Error('Title is required'), { status: 400 });
  let slug = slugify(d.slug || d.title) || 'program';
  const base = slug; let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Program.exists({ slug, _id: { $ne: doc._id } })) slug = `${base}-${++n}`;
  d.slug = slug;
  Object.assign(doc, d);
  await doc.save();
  return doc;
}
router.post('/programs', wrap(async (req, res) => {
  const doc = await saveProgram(new Program(), req.body);
  flash(req, 'ok', 'Program created.'); res.redirect('/admin/programs/' + doc._id);
}));
router.get('/programs/:id', wrap(async (req, res, next) => {
  const pr = await Program.findById(req.params.id).lean().catch(() => null);
  if (!pr) return next();
  res.render('admin/edit', { title: pr.title, fields: programFields, data: pr, action: req.originalUrl, back: { url: '/programs/' + pr.slug, label: 'View on site' }, deleteUrl: `/admin/programs/${pr._id}/delete` });
}));
router.post('/programs/:id', wrap(async (req, res, next) => {
  const pr = await Program.findById(req.params.id).catch(() => null);
  if (!pr) return next();
  await saveProgram(pr, req.body);
  flash(req, 'ok', 'Program saved.'); res.redirect('/admin/programs/' + pr._id);
}));
router.post('/programs/:id/delete', wrap(async (req, res) => {
  await Program.deleteOne({ _id: req.params.id });
  flash(req, 'ok', 'Program deleted.'); res.redirect('/admin/programs');
}));

/* ---------- gallery ---------- */
router.get('/gallery', wrap(async (req, res) => {
  res.render('admin/gallery', { items: await GalleryItem.find().sort({ order: 1, createdAt: 1 }).lean() });
}));
router.post('/gallery/upload', upload.array('images', 40), verifyCsrf, wrap(async (req, res) => {
  const last = await GalleryItem.findOne().sort({ order: -1 }).lean();
  let o = last ? last.order + 1 : 0;
  await GalleryItem.insertMany((req.files || []).map((f) => ({ image: '/uploads/' + f.filename, order: o++ })));
  flash(req, 'ok', `${(req.files || []).length} photo(s) added.`); res.redirect('/admin/gallery');
}));
router.post('/gallery/save', wrap(async (req, res) => {
  const items = Object.values(req.body.items || {});
  await Promise.all(items.filter((i) => /^[a-f0-9]{24}$/.test(i.id || '')).map((i) => GalleryItem.updateOne({ _id: i.id }, {
    caption: String(i.caption || '').slice(0, 300), visible: [].concat(i.visible || []).includes('1'), order: Number(i.order) || 0,
  })));
  flash(req, 'ok', 'Gallery saved.'); res.redirect('/admin/gallery');
}));
router.post('/gallery/:id/delete', wrap(async (req, res) => {
  await GalleryItem.deleteOne({ _id: req.params.id });
  flash(req, 'ok', 'Photo removed.'); res.redirect('/admin/gallery');
}));

/* ---------- messages & subscribers ---------- */
router.get('/messages', wrap(async (req, res) => {
  res.render('admin/messages', { messages: await Message.find().sort({ createdAt: -1 }).limit(300).lean() });
}));
router.post('/messages/:id/read', wrap(async (req, res) => { await Message.updateOne({ _id: req.params.id }, { read: true }); res.redirect('/admin/messages'); }));
router.post('/messages/:id/delete', wrap(async (req, res) => { await Message.deleteOne({ _id: req.params.id }); res.redirect('/admin/messages'); }));

router.get('/subscribers', adminOnly, wrap(async (req, res) => {
  res.render('admin/subscribers', { subs: await Subscriber.find().sort({ createdAt: -1 }).lean() });
}));
router.get('/subscribers.csv', adminOnly, wrap(async (req, res) => {
  const subs = await Subscriber.find().sort({ createdAt: -1 }).lean();
  const cell = (v) => `"${String(v).replace(/^[=+\-@]/, "'$&").replace(/"/g, '""')}"`;
  res.type('text/csv').set('Content-Disposition', 'attachment; filename="subscribers.csv"')
    .send('email,subscribed\n' + subs.map((s) => `${cell(s.email)},${s.createdAt.toISOString()}`).join('\n'));
}));
router.post('/subscribers/:id/delete', adminOnly, wrap(async (req, res) => { await Subscriber.deleteOne({ _id: req.params.id }); res.redirect('/admin/subscribers'); }));

/* ---------- users ---------- */
const activeAdmins = (excludeId) => User.countDocuments({ role: 'admin', active: true, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });

router.get('/users', adminOnly, wrap(async (req, res) => res.render('admin/users', { users: await User.find().sort({ createdAt: 1 }).lean() })));
router.post('/users', adminOnly, wrap(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || String(password || '').length < MIN_PW) {
    flash(req, 'err', `Name, valid email and a password of at least ${MIN_PW} characters are required.`); return res.redirect('/admin/users');
  }
  if (await User.exists({ email: email.toLowerCase().trim() })) { flash(req, 'err', 'A user with that email already exists.'); return res.redirect('/admin/users'); }
  await User.create({ name: String(name).trim().slice(0, 100), email, role: role === 'admin' ? 'admin' : 'editor', passwordHash: await bcrypt.hash(password, 12) });
  flash(req, 'ok', 'User created.'); res.redirect('/admin/users');
}));
router.post('/users/:id', adminOnly, wrap(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.redirect('/admin/users');
  const role = req.body.role === 'admin' ? 'admin' : 'editor';
  const active = [].concat(req.body.active || []).includes('1');
  if (u.role === 'admin' && (role !== 'admin' || !active) && (await activeAdmins(u._id)) === 0) {
    flash(req, 'err', 'There must be at least one active admin.'); return res.redirect('/admin/users');
  }
  u.name = String(req.body.name || u.name).trim().slice(0, 100); u.role = role; u.active = active;
  if (req.body.password) {
    if (req.body.password.length < MIN_PW) { flash(req, 'err', `Password must be at least ${MIN_PW} characters.`); return res.redirect('/admin/users'); }
    u.passwordHash = await bcrypt.hash(req.body.password, 12);
  }
  await u.save(); flash(req, 'ok', 'User updated.'); res.redirect('/admin/users');
}));
router.post('/users/:id/delete', adminOnly, wrap(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.redirect('/admin/users');
  if (String(u._id) === String(req.user._id)) { flash(req, 'err', 'You cannot delete your own account.'); return res.redirect('/admin/users'); }
  if (u.role === 'admin' && (await activeAdmins(u._id)) === 0) { flash(req, 'err', 'There must be at least one active admin.'); return res.redirect('/admin/users'); }
  await u.deleteOne(); flash(req, 'ok', 'User deleted.'); res.redirect('/admin/users');
}));

/* ---------- my account ---------- */
router.get('/account', (req, res) => res.render('admin/account'));
router.post('/account', wrap(async (req, res) => {
  const u = await User.findById(req.user._id);
  if (!(await bcrypt.compare(String(req.body.current || ''), u.passwordHash))) { flash(req, 'err', 'Current password is incorrect.'); return res.redirect('/admin/account'); }
  if (String(req.body.password || '').length < MIN_PW) { flash(req, 'err', `New password must be at least ${MIN_PW} characters.`); return res.redirect('/admin/account'); }
  u.passwordHash = await bcrypt.hash(req.body.password, 12);
  if (req.body.name) u.name = String(req.body.name).trim().slice(0, 100);
  await u.save(); flash(req, 'ok', 'Account updated.'); res.redirect('/admin/account');
}));

router.use((req, res) => res.status(404).render('admin/forbidden', { notFound: true }));
module.exports = router;
