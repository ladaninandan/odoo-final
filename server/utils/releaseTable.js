import mongoose from 'mongoose';
import Table from '../models/Table.js';
import SelfOrderLink from '../models/SelfOrderLink.js';

/** True when every line item is done in the kitchen (ready to clear the table). */
export const allKitchenItemsComplete = (order) => {
  if (!order?.items?.length) return true;
  return order.items.every((i) => i.kitchenStatus === 'completed');
};

/** True when the bill can be taken: every line has reached the final kitchen stage. */
export function orderReadyForPayment(order) {
  if (!order?.items?.length) return false;
  return order.items.every((i) => i.kitchenStatus === 'completed');
}

/** Normalize populated ref or id string to ObjectId for consistent DB queries. */
export function resolveTableObjectId(tableRef) {
  if (tableRef == null) return null;
  const raw = tableRef._id != null ? tableRef._id : tableRef;
  const s = String(raw);
  return mongoose.isValidObjectId(s) ? new mongoose.Types.ObjectId(s) : null;
}

/**
 * Invalidate self-order QR links for a table so the next guest must use a newly generated QR.
 * Call whenever the table becomes available (payment, cancel, manual free).
 */
export async function invalidateSelfOrderLinksForTable(tableId) {
  const oid = resolveTableObjectId(tableId);
  if (!oid) return;
  await SelfOrderLink.updateMany({ tableId: oid }, { $set: { active: false } });
}

/**
 * Deactivate the exact link used for this order (covers edge cases where tableId on the link
 * does not match the order’s table ref format).
 */
export async function invalidateSelfOrderLinkByToken(token) {
  if (token == null || token === '') return;
  const t = String(token).trim();
  if (!t) return;
  // Match stored casing (links are usually uppercase; tolerate legacy rows)
  await SelfOrderLink.updateMany(
    { token: { $regex: new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
    { $set: { active: false } }
  );
}

/**
 * Mark table available and notify POS — call when the meal is fully done in the kitchen
 * (not when payment alone is taken).
 */
export const releaseTableForOrder = async (order, io) => {
  const tableOid = resolveTableObjectId(order.table);
  if (!tableOid) return;

  await Table.findByIdAndUpdate(tableOid, { status: 'available', currentOrder: null });
  await invalidateSelfOrderLinksForTable(tableOid);
  if (order.selfOrderToken) {
    await invalidateSelfOrderLinkByToken(order.selfOrderToken);
  }

  if (io) {
    io.to('pos').emit('table:status_update', { tableId: String(tableOid), status: 'available' });
  }
};
