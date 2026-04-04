import mongoose from 'mongoose';

const floorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Floor = mongoose.model('Floor', floorSchema);
export default Floor;
