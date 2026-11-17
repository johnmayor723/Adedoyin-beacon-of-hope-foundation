const mongoose = require('mongoose');
const { Schema } = mongoose;

// Singleton-style content documents: { key, data }.
// key 'site' holds global settings; other keys are page keys (home, about, ...).
const Content = mongoose.model('Content', new Schema({
  key: { type: String, unique: true, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true, minimize: false }));

const Program = mongoose.model('Program', new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  summary: { type: String, default: '' },
  body: { type: String, default: '' },
  cardImage: { type: String, default: '' },
  heroImage: { type: String, default: '' },
  heroTitle: { type: String, default: '' },
  heroSubtitle: { type: String, default: '' },
  sections: [{ heading: String, text: String, image: String }],
  gallery: [{ image: String, caption: String }],
  showProgress: { type: Boolean, default: false },
  currency: { type: String, default: '$' },
  raised: { type: Number, default: 0 },
  goal: { type: Number, default: 0 },
  ctaLabel: { type: String, default: 'Donate' },
  ctaLink: { type: String, default: '/donate' },
  featured: { type: Boolean, default: true },
  published: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  seoDescription: { type: String, default: '' },
}, { timestamps: true }));

const GalleryItem = mongoose.model('GalleryItem', new Schema({
  image: { type: String, required: true },
  caption: { type: String, default: '' },
  visible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true }));

const Message = mongoose.model('Message', new Schema({
  name: String, email: String, phone: String, message: String,
  read: { type: Boolean, default: false },
}, { timestamps: true }));

const Subscriber = mongoose.model('Subscriber', new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
}, { timestamps: true }));

const User = mongoose.model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor'], default: 'editor' },
  active: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true }));

// A full copy of the editable site-content collections (Content/Program/
// GalleryItem), taken before a change is saved -- lets an admin undo a
// content edit/delete. 'original' is captured once, the first time this
// feature runs, and is never rotated away (see lib/snapshots.js); 'auto' is
// capped at the 3 most recent. Messages/Subscribers/Users are deliberately
// never included: those are ongoing visitor/account data, not editable
// "site content", and rolling them back would itself be a data-loss bug.
const Snapshot = mongoose.model('Snapshot', new Schema({
  kind: { type: String, enum: ['original', 'auto'], required: true },
  label: { type: String, default: '' },
  data: {
    content: { type: [Schema.Types.Mixed], default: [] },
    programs: { type: [Schema.Types.Mixed], default: [] },
    gallery: { type: [Schema.Types.Mixed], default: [] },
  },
}, { timestamps: true }));

module.exports = { Content, Program, GalleryItem, Message, Subscriber, User, Snapshot };
