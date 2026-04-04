import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/lanServerUrl';

/** Dedicated connection for the public customer display (does not share POS/kitchen socket). */
const customerSocket = io(getSocketUrl(), {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export default customerSocket;
