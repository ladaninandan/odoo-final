/**
 * Chains the same population as GET /orders so PATCH/create/kitchen responses
 * never return raw ObjectIds for refs (avoids intermittent missing nested fields on the client).
 */
export function populateOrderDetail(query) {
  return query
    .populate({
      path: 'table',
      select: 'tableNumber floor status',
      populate: { path: 'floor', select: 'name' },
    })
    .populate('customer', 'name phone mobile email address city state country notes')
    .populate('createdBy', 'first_name last_name email')
    .populate('session', 'status openedAt closedAt openingBalance totalSales')
    .populate({
      path: 'items.product',
      select: 'name price image unit category taxRate',
      populate: { path: 'category', select: 'name' },
    });
}
