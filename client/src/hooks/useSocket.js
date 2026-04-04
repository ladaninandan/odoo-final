import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socket from '../services/socket';

/**
 * Central socket hook — manages connection lifecycle and
 * dispatches Redux actions on incoming socket events.
 *
 * Call this once at the app level (e.g., in POSLayout or App).
 * Individual features can import `socket` directly for emit.
 */
const useSocket = (room = 'pos') => {
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Connect and join room
    socket.auth = { token: accessToken };
    socket.connect();
    socket.emit('join', room);

    // ── Kitchen events ───────────────────────────────
    socket.on('order:new', (order) => {
      // Will be handled by kitchenSlice once it exists
      dispatch({ type: 'kitchen/addOrder', payload: order });
    });

    socket.on('order:status_update', ({ orderId, status }) => {
      dispatch({ type: 'orders/updateOrderStatus', payload: { orderId, status } });
      dispatch({ type: 'customerDisplay/updateStatus', payload: status });
    });

    socket.on('order:item_prepared', ({ orderId, itemId }) => {
      dispatch({ type: 'kitchen/markItemPrepared', payload: { orderId, itemId } });
    });

    socket.on('kitchen:stage_update', ({ orderId, stage }) => {
      dispatch({ type: 'kitchen/updateStage', payload: { orderId, stage } });
    });

    // ── Table events ─────────────────────────────────
    socket.on('table:status_update', ({ tableId, status }) => {
      dispatch({ type: 'floors/updateTableStatus', payload: { tableId, status } });
    });

    // ── Payment events ───────────────────────────────
    socket.on('payment:confirmed', ({ orderId }) => {
      dispatch({ type: 'customerDisplay/setPaymentStatus', payload: 'paid' });
      dispatch({ type: 'cart/clearCart' });
    });

    // ── Session events ───────────────────────────────
    socket.on('session:closed', ({ sessionId }) => {
      dispatch({ type: 'session/sessionClosed', payload: sessionId });
    });

    return () => {
      socket.off('order:new');
      socket.off('order:status_update');
      socket.off('order:item_prepared');
      socket.off('kitchen:stage_update');
      socket.off('table:status_update');
      socket.off('payment:confirmed');
      socket.off('session:closed');
      socket.disconnect();
    };
  }, [isAuthenticated, accessToken, room, dispatch]);

  const emit = useCallback((event, data) => {
    socket.emit(event, data);
  }, []);

  return { socket, emit };
};

export default useSocket;
