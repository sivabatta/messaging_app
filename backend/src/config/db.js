const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);

  // Migration: we dropped the email field; drop its legacy unique index if it lingers,
  // otherwise new email-less signups would collide on null.
  try {
    await mongoose.connection.collection('users').dropIndex('email_1');
    console.log('[db] dropped legacy email_1 index');
  } catch (e) {
    if (e.codeName !== 'IndexNotFound') console.warn('[db] index drop:', e.message);
  }

  console.log('[db] connected to MongoDB');
}

module.exports = connectDB;
