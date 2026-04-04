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
