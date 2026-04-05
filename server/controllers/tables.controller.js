import Table from '../models/Table.js';
import { invalidateSelfOrderLinksForTable } from '../utils/releaseTable.js';

export const getTables = async (req, res) => {
  try {
    const { floor } = req.query;
    const filter = { isActive: true };
    if (floor) filter.floor = floor;

    const tables = await Table.find(filter)
      .populate('currentOrder', 'orderNumber status total')
      .sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tables', error: err.message });
  }
};

export const createTable = async (req, res) => {
  try {
    const { floor, tableNumber, seats } = req.body;
    const table = await Table.create({ floor, tableNumber, seats });
    res.status(201).json(table);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create table', error: err.message });
  }
};

export const updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    if (table.status === 'available') {
      await invalidateSelfOrderLinksForTable(req.params.id);
    }
    res.json(table);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update table', error: err.message });
  }
};

export const updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status, ...(status === 'available' ? { currentOrder: null } : {}) },
      { new: true }
    );
    if (!table) return res.status(404).json({ message: 'Table not found' });

    if (status === 'available') {
      await invalidateSelfOrderLinksForTable(req.params.id);
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to('pos').emit('table:status_update', { tableId: String(table._id), status });

    res.json(table);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update table status', error: err.message });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found' });
    if (table.status !== 'available') {
      return res.status(409).json({
        message: 'Only tables that are available (not occupied or reserved) can be deleted.',
      });
    }
    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: 'Table deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete table', error: err.message });
  }
};
