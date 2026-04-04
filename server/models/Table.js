import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    floor: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
    tableNumber: { type: Number, required: true },
    seats: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved'],
      default: 'available',
    },
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);

// Unique table number per floor
tableSchema.index({ floor: 1, tableNumber: 1 }, { unique: true });

const Table = mongoose.model('Table', tableSchema);
export default Table;
