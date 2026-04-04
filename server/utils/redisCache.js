import redisClient from '../config/redis.js';

/**
 * Generic Redis cache helpers for POS transient state.
 * Avoids hitting MongoDB for frequently-changing data like
 * table status, order kitchen stages, and active sessions.
 */

// ── Generic helpers ──────────────────────────────────────

export const cacheGet = async (key) => {
  try {
    return await redisClient.get(key);
  } catch (err) {
    console.error(`Redis GET error [${key}]:`, err.message);
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = null) => {
  try {
    if (ttlSeconds) {
      await redisClient.set(key, value, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, value);
    }
  } catch (err) {
    console.error(`Redis SET error [${key}]:`, err.message);
  }
};

export const cacheDel = async (key) => {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error(`Redis DEL error [${key}]:`, err.message);
  }
};

// ── JSON wrappers ────────────────────────────────────────

export const cacheGetJSON = async (key) => {
  const data = await cacheGet(key);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const cacheSetJSON = async (key, value, ttlSeconds = null) => {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
};

// ── POS-specific key helpers ─────────────────────────────

export const tableStatusKey = (tableId) => `table:${tableId}:status`;
export const orderKitchenStageKey = (orderId) => `order:${orderId}:kitchenStage`;
export const activeSessionKey = (userId) => `session:active:${userId}`;
export const kitchenOrdersKey = () => `kitchen:orders`;
export const selfOrderTokenKey = (token) => `selforder:token:${token}`;

// ── Table status ─────────────────────────────────────────

export const getTableStatus = async (tableId) => {
  return await cacheGet(tableStatusKey(tableId));
};

export const setTableStatus = async (tableId, status) => {
  await cacheSet(tableStatusKey(tableId), status);
};

// ── Order kitchen stage ──────────────────────────────────

export const getOrderKitchenStage = async (orderId) => {
  return await cacheGet(orderKitchenStageKey(orderId));
};

export const setOrderKitchenStage = async (orderId, stage, ttl = 86400) => {
  await cacheSet(orderKitchenStageKey(orderId), stage, ttl);
};

// ── Active session ───────────────────────────────────────

export const getActiveSession = async (userId) => {
  return await cacheGetJSON(activeSessionKey(userId));
};

export const setActiveSession = async (userId, sessionData) => {
  await cacheSetJSON(activeSessionKey(userId), sessionData);
};

export const clearActiveSession = async (userId) => {
  await cacheDel(activeSessionKey(userId));
};
