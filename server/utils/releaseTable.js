import Table from '../models/Table.js';
import { setTableStatus } from './redisCache.js';

/** True when every line item is done in the kitchen (ready to clear the table). */
export const allKitchenItemsComplete = (order) => {
  if (!order?.items?.length) return true;
  return order.items.every((i) => i.kitchenStatus === 'completed');
};

/**
 * Mark table available and notify POS — call when the meal is fully done in the kitchen
 * (not when payment alone is taken).
 */
export const releaseTableForOrder = async (order, io) => {
  const tableId = order.table;
  if (!tableId) return;

  await Table.findByIdAndUpdate(tableId, { status: 'available', currentOrder: null });
  await setTableStatus(tableId, 'available');

  if (io) {
    io.to('pos').emit('table:status_update', { tableId: String(tableId), status: 'available' });
  }
};
