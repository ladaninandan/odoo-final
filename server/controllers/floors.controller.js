import Floor from '../models/Floor.js';
import Table from '../models/Table.js';

export const getFloors = async (req, res) => {
  try {
    const floors = await Floor.find({ isActive: true }).sort({ name: 1 });
    // Attach tables to each floor
    const floorsWithTables = await Promise.all(
      floors.map(async (floor) => {
        const tables = await Table.find({ floor: floor._id, isActive: true })
          .populate('currentOrder', 'orderNumber status total')
          .sort({ tableNumber: 1 });
        return { ...floor.toObject(), tables };
      })
    );
    res.json(floorsWithTables);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch floors', error: err.message });
  }
};

export const createFloor = async (req, res) => {
  try {
    const { name } = req.body;
    const floor = await Floor.create({ name });
    res.status(201).json({ ...floor.toObject(), tables: [] });
  } catch (err) {
    res.status(400).json({ message: 'Failed to create floor', error: err.message });
  }
};

export const updateFloor = async (req, res) => {
  try {
    const floor = await Floor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!floor) return res.status(404).json({ message: 'Floor not found' });
    res.json(floor);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update floor', error: err.message });
  }
};

export const deleteFloor = async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);
    if (!floor) return res.status(404).json({ message: 'Floor not found' });

    const tablesOnFloor = await Table.find({ floor: req.params.id, isActive: true });
    const blocked = tablesOnFloor.filter((t) => t.status !== 'available');
    if (blocked.length > 0) {
      return res.status(409).json({
        message:
          'Cannot delete this floor while any table is occupied or reserved. Free all tables first.',
      });
    }

    await Table.deleteMany({ floor: req.params.id });
    await Floor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Floor and its tables deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete floor', error: err.message });
  }
};
