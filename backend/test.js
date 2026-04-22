const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'c:/Users/prana/Projects/supermart/backend/.env.local' });
(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const user = await db.collection('users').findOne({});
  if (!user) return console.log('No user found');
  try {
    await db.collection('users').updateOne(
      { _id: user._id },
      { $push: { addresses: { id: '123', label: 'Home', addressLine: 'Test', city: 'Test', pincode: '123456', isDefault: false } } }
    );
    console.log('Success!');
  } catch(e) {
    console.error(e);
  }
  await client.close();
})();
