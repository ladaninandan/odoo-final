import mongoose from 'mongoose';

/** Avoid hanging forever if MongoDB is unreachable; surface disconnects in logs. */
const mongooseOptions = {
  serverSelectionTimeoutMS: 15_000,
  socketTimeoutMS: 45_000,
  maxPoolSize: 10,
};

function attachConnectionLogging() {
  const c = mongoose.connection;
  c.on('disconnected', () => {
    console.warn('[MongoDB] disconnected — requests may fail until the driver reconnects');
  });
  c.on('reconnected', () => {
    console.log('[MongoDB] reconnected');
  });
  c.on('error', (err) => {
    console.error('[MongoDB] connection error', err?.message || err);
  });
}

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in environment');
    process.exit(1);
  }

  attachConnectionLogging();

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connect failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
