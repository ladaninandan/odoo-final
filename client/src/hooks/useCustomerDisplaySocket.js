import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import customerSocket from '../services/customerSocket';
import { setCurrentOrder, updateStatus, setPaymentStatus } from '../store/slices/customerDisplaySlice';

/**
 * Public second-screen display: connects without auth and listens on the `customer` room.
 */
const useCustomerDisplaySocket = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    customerSocket.connect();
    customerSocket.emit('join', 'customer');

    const onSetOrder = (order) => dispatch(setCurrentOrder(order));
    const onStatus = ({ status }) => dispatch(updateStatus(status));
    const onPaid = () => dispatch(setPaymentStatus('paid'));

    customerSocket.on('customer:set_order', onSetOrder);
    customerSocket.on('order:status_update', onStatus);
    customerSocket.on('payment:confirmed', onPaid);

    return () => {
      customerSocket.off('customer:set_order', onSetOrder);
      customerSocket.off('order:status_update', onStatus);
      customerSocket.off('payment:confirmed', onPaid);
      customerSocket.disconnect();
    };
  }, [dispatch]);
};

export default useCustomerDisplaySocket;
