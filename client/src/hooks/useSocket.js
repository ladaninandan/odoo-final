import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socket from '../services/socket';
import { fetchFloors } from '../store/slices/floorsSlice';
import { fetchKitchenOrders } from '../store/slices/kitchenSlice';

/**
 * Join both `pos` and `kitchen` rooms so all authenticated clients receive floor + kitchen events
 * (avoids missed `order:new` / `table:status_update` when only one room was joined).
 * Does NOT disconnect on unmount — avoids losing events when switching POS ↔ Kitchen or React Strict Mode.
 */
const useSocket = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector((state) => state.auth);
  const joinRetryRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (joinRetryRef.current) {
        clearTimeout(joinRetryRef.current);
        joinRetryRef.current = null;
      }
      socket.disconnect();
      return;
    }

    socket.auth = { token: accessToken };

    const joinRooms = () => {
      socket.emit('join', 'pos');
      socket.emit('join', 'kitchen');
    };

    const scheduleJoinRetry = () => {
      if (joinRetryRef.current) clearTimeout(joinRetryRef.current);
      joinRetryRef.current = setTimeout(() => {
        joinRooms();
        joinRetryRef.current = null;
      }, 100);
    };

    const onConnect = () => {
      joinRooms();
      scheduleJoinRetry();
    };

    const onOrderNew = (order) => {
      dispatch({ type: 'kitchen/addOrder', payload: order });
      dispatch(fetchKitchenOrders());
    };

    const onOrderUpdated = () => {
      dispatch(fetchKitchenOrders());
    };

    const onOrderStatusUpdate = ({ orderId, status }) => {
      dispatch({ type: 'orders/updateOrderStatus', payload: { orderId, status } });
      dispatch({ type: 'customerDisplay/updateStatus', payload: status });
    };

    const onItemPrepared = ({ orderId, itemId }) => {
      dispatch({ type: 'kitchen/markItemPrepared', payload: { orderId, itemId } });
      dispatch(fetchKitchenOrders());
    };

    const onKitchenStage = ({ orderId, stage }) => {
      dispatch({ type: 'kitchen/updateStage', payload: { orderId, stage } });
      dispatch(fetchKitchenOrders());
    };

    const onTableStatus = ({ tableId, status }) => {
      dispatch({ type: 'floors/updateTableStatus', payload: { tableId, status } });
    };

    const onPaymentConfirmed = () => {
      dispatch(fetchFloors());
      dispatch({ type: 'customerDisplay/setPaymentStatus', payload: 'paid' });
      dispatch({ type: 'cart/clearCart' });
    };

    const onSessionClosed = ({ sessionId }) => {
      dispatch({ type: 'session/sessionClosed', payload: sessionId });
    };

    socket.on('connect', onConnect);
    socket.on('order:new', onOrderNew);
    socket.on('order:updated', onOrderUpdated);
    socket.on('order:status_update', onOrderStatusUpdate);
    socket.on('order:item_prepared', onItemPrepared);
    socket.on('kitchen:stage_update', onKitchenStage);
    socket.on('table:status_update', onTableStatus);
    socket.on('payment:confirmed', onPaymentConfirmed);
    socket.on('session:closed', onSessionClosed);

    if (socket.connected) {
      joinRooms();
      scheduleJoinRetry();
    } else {
      socket.connect();
    }

    return () => {
      if (joinRetryRef.current) {
        clearTimeout(joinRetryRef.current);
        joinRetryRef.current = null;
      }
      socket.off('connect', onConnect);
      socket.off('order:new', onOrderNew);
      socket.off('order:updated', onOrderUpdated);
      socket.off('order:status_update', onOrderStatusUpdate);
      socket.off('order:item_prepared', onItemPrepared);
      socket.off('kitchen:stage_update', onKitchenStage);
      socket.off('table:status_update', onTableStatus);
      socket.off('payment:confirmed', onPaymentConfirmed);
      socket.off('session:closed', onSessionClosed);
    };
  }, [isAuthenticated, accessToken, dispatch]);

  const emit = useCallback((event, data) => {
    socket.emit(event, data);
  }, []);

  return { socket, emit };
};

export default useSocket;
