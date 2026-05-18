const cron = require('node-cron');
const Media = require('../models/Media');
const Message = require('../models/Message');

async function purgeExpiredMedia() {
  const now = new Date();
  const expired = await Media.find({ expiryDate: { $lte: now } }).select('_id');
  const ids = expired.map((m) => m._id);
  if (ids.length === 0) {
    console.log('[cleanup] no expired media');
    return { deletedMedia: 0, clearedMessages: 0 };
  }

  // Detach message references so the chat history still shows "media expired" rather than dangling refs.
  const cleared = await Message.updateMany(
    { media: { $in: ids } },
    { $set: { media: null } }
  );
  const deleted = await Media.deleteMany({ _id: { $in: ids } });

  console.log(`[cleanup] purged ${deleted.deletedCount} media, detached ${cleared.modifiedCount} messages`);
  return { deletedMedia: deleted.deletedCount, clearedMessages: cleared.modifiedCount };
}

function startCleanupJob() {
  // Runs daily at 03:00 server time.
  cron.schedule('0 3 * * *', () => {
    purgeExpiredMedia().catch((err) => console.error('[cleanup] failed', err));
  });
  // Also run once at boot so a long-stopped server catches up immediately.
  purgeExpiredMedia().catch((err) => console.error('[cleanup] boot run failed', err));
  console.log('[cleanup] scheduled daily at 03:00');
}

module.exports = { startCleanupJob, purgeExpiredMedia };
