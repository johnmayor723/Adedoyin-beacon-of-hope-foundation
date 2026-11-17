const { Content, Program, GalleryItem, Snapshot } = require('../models');

const MAX_AUTO = 3;

async function captureState() {
  const [content, programs, gallery] = await Promise.all([
    Content.find().lean(),
    Program.find().lean(),
    GalleryItem.find().lean(),
  ]);
  return { content, programs, gallery };
}

async function saveSnapshot(kind, label) {
  await Snapshot.create({ kind, label, data: await captureState() });
  if (kind === 'auto') {
    const stale = await Snapshot.find({ kind: 'auto' }).sort({ createdAt: -1 }).skip(MAX_AUTO).select('_id');
    if (stale.length) await Snapshot.deleteMany({ _id: { $in: stale.map((s) => s._id) } });
  }
}

// Runs once on boot. After this first capture, the permanent backup never
// changes again, regardless of how many times the server restarts.
async function ensureOriginalSnapshot() {
  if (await Snapshot.exists({ kind: 'original' })) return;
  await saveSnapshot('original', 'Original state (permanent backup)');
}

async function restoreSnapshot(id) {
  const snap = await Snapshot.findById(id).lean();
  if (!snap) throw Object.assign(new Error('Snapshot not found'), { status: 404 });

  // A restore is itself a major change -- snapshot what's about to be
  // overwritten first, so restoring to an older state is never a dead end.
  await saveSnapshot('auto', `Before restoring "${snap.label || snap.kind}"`);

  await Promise.all([Content.deleteMany({}), Program.deleteMany({}), GalleryItem.deleteMany({})]);
  await Promise.all([
    snap.data.content.length ? Content.insertMany(snap.data.content) : null,
    snap.data.programs.length ? Program.insertMany(snap.data.programs) : null,
    snap.data.gallery.length ? GalleryItem.insertMany(snap.data.gallery) : null,
  ]);
}

module.exports = { saveSnapshot, ensureOriginalSnapshot, restoreSnapshot };
