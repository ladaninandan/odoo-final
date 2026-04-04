import crypto from 'crypto';

const generateSelfOrderToken = (tableId, sessionId) => {
  const raw = `${tableId}-${sessionId}-${Date.now()}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 12).toUpperCase();
};

export default generateSelfOrderToken;
