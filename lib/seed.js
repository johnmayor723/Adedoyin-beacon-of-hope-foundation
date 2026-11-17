// Seeds the database with the website's ORIGINAL content so nothing is lost.
// Safe to run repeatedly: it only fills in what is missing. Use --reset to wipe content first.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Content, Program, GalleryItem, User } = require('../models');

const PUBLIC = path.join(__dirname, '..', 'public');
// Use an image only if the file really exists in the repo (some referenced originals were never committed).
const img = (name) => (fs.existsSync(path.join(PUBLIC, 'images', name)) ? '/images/' + name : '');

const site = {
  siteName: 'Adedoyin Beacon of Hope Foundation',
  tagline: '...empowering mind & inspiring life',
  logo: img('Logo1.jpg'),
  favicon: img('favicon.png'),
  navButtonLabel: 'Support Us',
  navButtonLink: '/donate',
  phone: '+2348143074296',
  email: 'info@adedoyinbeaconofhopefoundation.com.ng',
  address: '25 Iyalode Abosede Ewuelepe, Ikorodu, Lagos, Nigeria',
  notifyEmail: 'info@adedoyinbeaconofhopefoundation.com.ng',
  headerLinks: [
    { label: 'Home', url: '/', visible: true },
    { label: 'About Us', url: '/about-us', visible: true },
    { label: 'Programs', url: '/programs', visible: true },
    { label: 'Gallery', url: '/gallery', visible: true },
    { label: 'Contact', url: '/contact', visible: true },
  ],
  footerAbout: 'Empowering lives and providing support to those in need in our community.',
  footerLinks: [
    { label: 'About Us', url: '/about-us', visible: true },
    { label: 'Programs', url: '/programs', visible: true },
    { label: 'Gallery', url: '/gallery', visible: true },
    { label: 'Team', url: '/about-us#team', visible: true },
    { label: 'Contact', url: '/contact', visible: true },
  ],
  socials: ['facebook', 'instagram', 'twitter', 'youtube'].map((platform) => ({ platform, url: '' })),
  copyright: 'Adedoyin Beacon of Hope Foundation. All Rights Reserved.',
  colorPrimary: '#2f7a55',
  colorAccent: '#7dc426',
  colorWarm: '#ff8200',
  colorInk: '#0f2a1e',
};

const banner = (title, subtitle, image) => ({ title, subtitle, image });
const seo = (title, description) => ({ title, description });

const pages = {
  home: {
    hero: {
      badge: 'Founded 2021 · Ikorodu, Lagos',
      title: 'Welcome to Adedoyin Beacon of Hope',
      subtitle: 'We are committed to making a difference in our community by empowering lives and providing support to those in need. Join us in making an impact today.',
      image: img('hero1.jpg'),
      primaryLabel: 'Support Us', primaryLink: '/donate',
      secondaryLabel: 'Our Programs', secondaryLink: '/programs',
    },
    mission: {
      visible: true, eyebrow: 'What we do', title: 'Our Mission',
      intro: 'Our organization pursues several goals that can be identified as our mission. Learn more about them below.',
      items: [
        { icon: 'book', title: 'Educational Support', text: 'Our main mission is to save and rescue permanently displaced children.' },
        { icon: 'sun', title: 'Peace On The Planet', text: 'By working with our partners, we aim to establish peaceful relationships.' },
        { icon: 'health', title: 'Health Care Provision & Protection', text: 'We provide global care and protection to support children all over the world.' },
      ],
    },
    programs: {
      visible: true, eyebrow: 'Get involved', title: 'Latest Causes',
      intro: 'There are various charity causes and projects, in which you can always take part. Feel free to learn about them below or browse our website for more information.',
      limit: 6, buttonLabel: 'View all programs',
    },
    cta: {
      visible: true, title: 'Subscribe to Stay Informed',
      text: 'Get updates on our programs and the impact your support makes.',
      image: img('h8.jpg'), buttonLabel: 'Subscribe', success: 'Thank you for subscribing!',
    },
    seo: seo('Adedoyin Beacon of Hope Foundation', 'Empowering mind & inspiring life. Education, health and community support in Lagos, Nigeria.'),
  },
  about: {
    banner: banner('About Us', 'Empowering mind & inspiring life', img('abouthero.jpg')),
    story: {
      title: 'About Adedoyin Beacon Of Hope Foundation',
      paragraphs: [
        'The ABHF was born in 2021 after the COVID-19 pandemic. It was aimed at addressing the challenges that arose during and after the crisis. ABHF emerged to provide essential services such as food, mental health campaigns for youths, educational support through payment of school fees and WAEC enrollment.',
        'We are committed to helping each child access quality learning opportunities and resources, providing support for underprivileged youth. Our work often involves fundraising, supplying educational materials, offering scholarship and mentorship programs. Our organization focuses on addressing barriers to education and promoting social equity.',
        'Overall, our goal is to ensure that every child can learn and thrive regardless of their background. We also work for the elderly by improving the quality of life for seniors, particularly low-income and those in need of financial assistance. We have an ongoing monthly food bank and healthcare support. Our overarching goal is to ensure that our elderly individuals are treated with dignity, receive the support they need, and can maintain an active and fulfilling lifestyle.',
      ].join('\n\n'),
      image: img('abouthero.jpg'),
    },
    mission: {
      visible: true, title: 'Our Mission', intro: 'Achieving Change through Educational Aids',
      items: [
        { icon: 'book', title: 'Educational support', text: 'Educational support to every child, school fees payments..' },
        { icon: 'hand', title: 'Empowerment', text: 'Involved marginalized underprivileged communities to overcome poverty.' },
        { icon: 'users', title: 'Community development', text: 'We collaborate with local communities to develop sustainable solutions that address their specific needs..' },
        { icon: 'sun', title: 'Increasing Awareness', text: 'Raising awareness to inspire action, ensuring every child’s right to education, health, and emotional well-being is recognized and protected.' },
        { icon: 'health', title: 'Healthcare initiatives.', text: 'Providing medical care, hospital bill payments, vaccination, sanitary towels to schools, healthcare education, and emotional support..' },
      ],
    },
    team: {
      visible: true, title: 'Our Team', intro: '',
      members: [
        { name: 'Dr Adedoyin Olugbode', role: 'Chairman', photo: img('hero1.jpg'), bio: '' },
        { name: 'Adeshina Oluwaseun', role: 'Trustee', photo: img('Team2.jpg'), bio: '' },
        { name: 'Fatokun Mathew Babafemi', role: 'Secretary', photo: img('Team1.jpg'), bio: '' },
      ],
    },
    seo: seo('About Us – Adedoyin Beacon of Hope Foundation', 'Learn about the Adedoyin Beacon of Hope Foundation, founded in 2021.'),
  },
  programs: {
    banner: banner('Our Programs', 'Causes and projects you can take part in', img('h1.jpg')),
    intro: { eyebrow: 'Causes', title: 'Programs that change lives', text: 'There are various charity causes and projects, in which you can always take part.' },
    seo: seo('Programs – Adedoyin Beacon of Hope Foundation', 'Food bank, Pad a Girl, mental health awareness and more.'),
  },
  gallery: {
    banner: banner('Gallery', 'Moments from our outreach', img('h5.jpg')),
    intro: { title: 'Image Gallery', text: '' },
    seo: seo('Gallery – Adedoyin Beacon of Hope Foundation', 'Photos from our programs and outreach.'),
  },
  contact: {
    banner: banner('Contacts', 'We would love to hear from you', img('h4.jpg')),
    intro: { title: 'Get in touch', text: 'You can call us anytime. Feel free to email us your questions.' },
    form: { title: 'Get in Touch', buttonLabel: 'Send', success: 'Thank you! Your message has been received.' },
    seo: seo('Contact – Adedoyin Beacon of Hope Foundation', 'Contact the Adedoyin Beacon of Hope Foundation in Ikorodu, Lagos.'),
  },
  donate: {
    banner: banner('Donate', 'Your support changes lives', img('food.jpg')),
    intro: { title: 'Support our work', text: 'Every contribution helps us reach more children, families and elderly people in need.' },
    bank: {
      title: 'Bank Deposit Information',
      details: [
        { label: 'Bank Name', value: 'XYZ Bank' },
        { label: 'Account Name', value: 'Adedoyin Beacon of Hope' },
        { label: 'Account Number', value: '1234567890' },
        { label: 'Swift Code', value: 'ABCDXYZ' },
      ],
      note: '',
    },
    seo: seo('Donate – Adedoyin Beacon of Hope Foundation', 'Support the Adedoyin Beacon of Hope Foundation.'),
  },
};

const programs = [
  {
    title: 'Orphanages Support Mission', cardImage: img('abouthero.jpg'), raised: 1000, goal: 100000, showProgress: true,
    summary: 'Our main mission is to save and rescue permanently displaced children.',
  },
  {
    title: 'Girls Vision For The World', cardImage: img('h2.jpg'), raised: 92160, goal: 100000, showProgress: true,
    summary: 'Supporting girls to learn, grow and thrive.',
  },
  {
    title: 'Mental Health Awareness Project', cardImage: img('mental.jpg'), raised: 92160, goal: 100000, showProgress: true,
    summary: 'Supporting Mental Health Awareness. Our programmes offer workshops and counseling to promote mental health and break the stigma.',
  },
  {
    title: 'Pad A Girl Project', cardImage: img('h82.jpg'), raised: 52380, goal: 55000, showProgress: true,
    summary: 'Empowering Girls with Sanitary Pads. Pad a Girl provides girls with sanitary pads to prevent school absenteeism due to period poverty.',
  },
  {
    title: 'Monthly Food Bank', cardImage: img('food.jpg'), raised: 42280, goal: 45000, showProgress: true,
    summary: 'Fighting Hunger, One Meal at a Time. The Monthly Food Bank provides food supplies to families in need. Help ensure no one goes hungry.',
  },
];

const gallery = ['h1.jpg', 'h2.jpg', 'h3.jpg', 'h4.jpg', 'h5.jpg', 'h6.jpg', 'h7.jpg', 'h82.jpg', 'T1.jpeg', 'T3.jpeg', 'T4.jpeg', 'T5.jpeg', 'T6.jpeg', 'T7.jpeg', 'T8.jpeg', 'T9.jpeg', 'T10.jpeg'];

const slugify = (s) => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

async function seed({ reset = false } = {}) {
  if (reset) {
    await Promise.all([Content.deleteMany({}), Program.deleteMany({}), GalleryItem.deleteMany({})]);
  }
  const put = async (key, data) => { if (!(await Content.exists({ key }))) await Content.create({ key, data }); };
  await put('site', site);
  for (const [k, v] of Object.entries(pages)) await put(k, v);

  if ((await Program.countDocuments()) === 0) {
    await Program.insertMany(programs.map((p, i) => ({
      ...p, slug: slugify(p.title), order: i, heroImage: p.cardImage, body: p.summary,
      ctaLabel: 'Donate', ctaLink: '/donate', featured: true, published: true, currency: '$',
    })));
  }
  if ((await GalleryItem.countDocuments()) === 0) {
    const items = gallery.map((f, i) => ({ image: img(f), order: i })).filter((g) => g.image);
    await GalleryItem.insertMany(items.map((g, i) => ({ ...g, order: i })));
  }
  if ((await User.countDocuments()) === 0) {
    const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
    await User.create({ name: 'Administrator', email, role: 'admin', passwordHash: await bcrypt.hash(password, 12) });
    console.log('\n================ FIRST ADMIN CREATED ================');
    console.log('  Email:    ' + email);
    console.log('  Password: ' + (process.env.ADMIN_PASSWORD ? '(from ADMIN_PASSWORD in .env)' : password));
    console.log('  Log in at /admin and change the password.');
    console.log('=====================================================\n');
  }
}

module.exports = seed;
module.exports.data = { site, pages, programs, gallery: gallery.map((f) => img(f)).filter(Boolean), slugify };

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/adedoyin')
    .then(() => seed({ reset: process.argv.includes('--reset') }))
    .then(() => { console.log('Seed complete.'); return mongoose.disconnect(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
