import { initializeDB } from './jsonDb.js';

const connectDB = async () => {
  try {
    await initializeDB();
    console.log('✅ Local JSON Database Connected');
  } catch (error) {
    console.error(`❌ Database error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
