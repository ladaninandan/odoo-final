import Table from '../models/Table.js';
import SelfOrderLink from '../models/SelfOrderLink.js';

/** True when every line item is done in the kitchen (ready to clear the table). */
export const allKitchenItemsComplete = (order) => {
  if (!order?.items?.length) return true;
  return order.items.every((i) => i.kitchenStatus === 'completed');
};

/**
 * Invalidate self-order QR links for a table so the next guest must use a newly generated QR.
 * Call whenever the table becomes available (payment, cancel, manual free).
 */
export async function invalidateSelfOrderLinksForTable(tableId) {
  if (!tableId) return;
  const id = tableId._id != null ? tableId._id : tableId;
  await SelfOrderLink.updateMany({ tableId: id }, { $set: { active: false } });
}

/**
 * Mark table available and notify POS — call when the meal is fully done in the kitchen
 * (not when payment alone is taken).
 */
export const releaseTableForOrder = async (order, io) => {
  const tableId = order.table;
  if (!tableId) return;

  await Table.findByIdAndUpdate(tableId, { status: 'available', currentOrder: null });
  await invalidateSelfOrderLinksForTable(tableId);

  if (io) {
    io.to('pos').emit('table:status_update', { tableId: String(tableId), status: 'available' });
  }
};
