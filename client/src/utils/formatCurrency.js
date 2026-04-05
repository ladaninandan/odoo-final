/**
 * Formats a number as Indian Rupee currency.
 * @param {number} amount
 * @returns {string} e.g. "₹1,200.00"
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats a number without currency symbol.
 * @param {number} amount
 * @returns {string} e.g. "1,200.00"
 */
export const formatNumber = (amount) => {
  if (!amount) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
