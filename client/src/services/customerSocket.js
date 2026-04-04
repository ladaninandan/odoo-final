import { io } from 'socket.io-client';

/** Dedicated connection for the public customer display (does not share POS/kitchen socket). */
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const customerSocket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export default customerSocket;
