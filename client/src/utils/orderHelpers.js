/**
 * Returns a human-readable label for an order status.
 */
export const getStatusLabel = (status) => {
  const labels = {
    draft: 'Draft',
    sent_to_kitchen: 'In Kitchen',
    ready: 'Ready',
    paid: 'Paid',
    cancelled: 'Cancelled',
    to_cook: 'To Cook',
    preparing: 'Preparing',
    completed: 'Completed',
  };
  return labels[status] || status;
};

/**
 * Returns a badge variant for an order status.
 */
export const getStatusVariant = (status) => {
  const variants = {
    draft: 'secondary',
    sent_to_kitchen: 'warning',
    ready: 'success',
    paid: 'default',
    cancelled: 'destructive',
  };
  return variants[status] || 'secondary';
};

/**
 * Returns a color class for a table status.
 */
export const getTableStatusColor = (status) => {
  const colors = {
    available: 'bg-green-500/10 border-green-500 text-green-700',
    occupied: 'bg-orange-500/10 border-orange-500 text-orange-700',
    reserved: 'bg-red-500/10 border-red-500 text-red-700',
  };
  return colors[status] || '';
};

/**
 * Returns a kitchen stage label.
 */
export const getKitchenStageLabel = (stage) => {
  const labels = {
    pending: 'Pending',
    to_cook: 'To Cook',
    preparing: 'Preparing',
    completed: 'Completed',
  };
  return labels[stage] || stage;
};

/**
 * Guest-facing labels for mobile order tracking (per line item).
 */
export const getSelfOrderItemKitchenLabel = (kitchenStatus) => {
  const labels = {
    pending: 'Received',
    to_cook: 'Queued',
    preparing: 'Preparing',
    completed: 'Cooked',
  };
  return labels[kitchenStatus] || getKitchenStageLabel(kitchenStatus);
};

/**
 * KDS column for an order (matches server `getActiveKitchenOrders` grouping).
 */
export const getOrderKitchenStage = (order) => {
  const items = order?.items || [];
  if (!items.length) return 'to_cook';
  if (items.every((i) => i.kitchenStatus === 'completed')) return 'completed';
  if (items.some((i) => i.kitchenStatus === 'preparing')) return 'preparing';
  return 'to_cook';
};

/** Line subtotal from stored subtotal or qty × unit price. */
export const getOrderLineSubtotal = (item) => {
  if (item == null) return 0;
  if (item.subtotal != null && item.subtotal !== '') {
    const n = Number(item.subtotal);
    if (!Number.isNaN(n)) return n;
  }
  const q = Number(item.quantity) || 0;
  const u = Number(item.unitPrice) || 0;
  return q * u;
};

/**
 * Split order-level tax across lines proportionally so line taxes sum to `order.tax`.
 */
export const allocateOrderTaxAcrossLines = (order) => {
  const items = order?.items || [];
  const orderTax = Number(order?.tax) || 0;
  const lineSubs = items.map(getOrderLineSubtotal);
  const sum = lineSubs.reduce((a, b) => a + b, 0);
  if (!items.length) return [];

  if (sum <= 0) {
    return items.map((item, i) => {
      const lineSubtotal = lineSubs[i];
      const lineTax = i === items.length - 1 ? orderTax : 0;
      return {
        item,
        lineSubtotal,
        lineTax,
        lineTotal: parseFloat((lineSubtotal + lineTax).toFixed(2)),
      };
    });
  }

  let allocated = 0;
  return items.map((item, i) => {
    const lineSubtotal = lineSubs[i];
    const isLast = i === items.length - 1;
    const lineTax = isLast
      ? parseFloat((orderTax - allocated).toFixed(2))
      : parseFloat((orderTax * (lineSubtotal / sum)).toFixed(2));
    if (!isLast) allocated += lineTax;
    return {
      item,
      lineSubtotal,
      lineTax,
      lineTotal: parseFloat((lineSubtotal + lineTax).toFixed(2)),
    };
  });
};

/** Effective tax rate from order totals (e.g. 5 when tax is 5% of subtotal). */
export const getEffectiveTaxRatePercent = (order) => {
  const sub = Number(order?.subtotal) || 0;
  const tax = Number(order?.tax) || 0;
  if (sub <= 0) return null;
  return parseFloat(((tax / sub) * 100).toFixed(2));
};
