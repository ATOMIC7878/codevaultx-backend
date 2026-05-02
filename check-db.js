require('dotenv').config();
const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get all collections
    const collections = await db.listCollections().toArray();

    console.log('📊 DATABASE COLLECTIONS:\n');

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`📁 ${collection.name}: ${count} documents`);

      // Show sample of first 3 documents
      if (count > 0) {
        const samples = await db.collection(collection.name).find().limit(3).toArray();
        console.log(`   Sample: ${JSON.stringify(samples, null, 2).substring(0, 200)}...\n`);
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();
