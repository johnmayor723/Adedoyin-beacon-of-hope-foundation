const express = require('express');
const nodemailer = require('nodemailer');
const { Content, Program, GalleryItem, Message, Subscriber } = require('../models');
const { paras, rateLimit, verifyCsrf } = require('../lib/helpers');

const router = express.Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Load global settings once per request and expose to every template.
router.use(async (req, res, next) => {
  try {
    const doc = await Content.findOne({ key: 'site' }).lean();
    const s = (doc && doc.data) || {};
    res.locals.site = s;
    res.locals.paras = paras;
    res.locals.year = new Date().getFullYear();
    res.locals.path = req.path;
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;
    next();
  } catch (e) { next(e); }
});

const page = async (key) => ((await Content.findOne({ key }).lean()) || {}).data || {};
const render = (view, key, extra = {}) => async (req, res, next) => {
  try {
    const p = await page(key);
    res.render('site/' + view, { p, title: (p.seo && p.seo.title) || res.locals.site.siteName, description: p.seo && p.seo.description, ...(typeof extra === 'function' ? await extra(req) : extra) });
  } catch (e) { next(e); }
};

router.get('/', render('home', 'home', async () => {
  const p = await page('home');
  const limit = (p.programs && p.programs.limit) || 6;
  const programs = await Program.find({ published: true, featured: true }).sort({ order: 1, createdAt: 1 }).limit(limit).lean();
  return { programs };
}));
router.get('/about-us', render('about', 'about'));
router.get('/programs', render('programs', 'programs', async () => ({
  programs: await Program.find({ published: true }).sort({ order: 1, createdAt: 1 }).lean(),
})));
router.get('/gallery', render('gallery', 'gallery', async () => ({
  items: await GalleryItem.find({ visible: true }).sort({ order: 1, createdAt: 1 }).lean(),
})));
router.get('/contact', render('contact', 'contact'));
router.get('/donate', render('donate', 'donate'));

router.get('/programs/:slug', async (req, res, next) => {
  try {
    const program = await Program.findOne({ slug: req.params.slug, published: true }).lean();
    if (!program) return next();
    const others = await Program.find({ published: true, _id: { $ne: program._id } }).sort({ order: 1 }).limit(3).lean();
    res.render('site/program', { program, others, title: program.title, description: program.seoDescription || program.summary });
  } catch (e) { next(e); }
});

// Legacy URLs
['/causes'].forEach((u) => router.get(u, (req, res) => res.redirect(301, '/programs')));
['/contacts', '/contact-us', '/contact%20us'].forEach((u) => router.get(u, (req, res) => res.redirect(301, '/contact')));

/* ---------- forms ---------- */
async function notify(site, msg) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS || !site.notifyEmail) return;
  const t = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } });
  await t.sendMail({
    from: process.env.MAIL_USER, to: site.notifyEmail, replyTo: msg.email,
    subject: `New website message from ${msg.name.replace(/[\r\n]+/g, ' ')}`,
    text: `From: ${msg.name} <${msg.email}>\nPhone: ${msg.phone || '-'}\n\n${msg.message}`,
  });
}

router.post('/contact', rateLimit({ windowMs: 10 * 60 * 1000, max: 6 }), verifyCsrf, async (req, res, next) => {
  try {
    const b = req.body || {};
    const back = (type, text) => { req.session.flash = { type, text }; res.redirect('/contact#form'); };
    if (b.website) return back('ok', 'Thank you!'); // honeypot
    const msg = { name: String(b.name || '').trim().slice(0, 120), email: String(b.email || '').trim().slice(0, 200), phone: String(b.phone || '').trim().slice(0, 40), message: String(b.message || '').trim().slice(0, 5000) };
    if (!msg.name || !EMAIL.test(msg.email) || !msg.message) return back('err', 'Please enter your name, a valid email and a message.');
    await Message.create(msg);
    const p = await page('contact');
    notify(res.locals.site, msg).catch((e) => console.error('Mail error:', e.message));
    back('ok', (p.form && p.form.success) || 'Thank you! Your message has been received.');
  } catch (e) { next(e); }
});

router.post('/subscribe', rateLimit({ windowMs: 10 * 60 * 1000, max: 10 }), verifyCsrf, async (req, res, next) => {
  try {
    const email = String((req.body || {}).email || '').trim().toLowerCase().slice(0, 200);
    const home = await page('home');
    if (req.body.website) { req.session.flash = { type: 'ok', text: 'Thank you!' }; return res.redirect('/#subscribe'); }
    if (!EMAIL.test(email)) req.session.flash = { type: 'err', text: 'Please enter a valid email address.' };
    else {
      await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
      req.session.flash = { type: 'ok', text: (home.cta && home.cta.success) || 'Thank you for subscribing!' };
    }
    res.redirect('/#subscribe');
  } catch (e) { next(e); }
});

router.use((req, res) => res.status(404).render('site/404', { title: 'Page not found', description: '' }));

module.exports = router;
