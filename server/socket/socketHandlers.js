/**
 * Socket.IO event handler registration.
 * Manages rooms (kitchen, pos, customer) and relays events between clients.
 */
const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // ── Room management ────────────────────────────────
    socket.on('join', (room) => {
      const validRooms = ['kitchen', 'pos', 'customer'];
      if (validRooms.includes(room)) {
        socket.join(room);
        console.log(`[Socket] ${socket.id} joined room: ${room}`);
      }
    });

    // ── Order events (from POS → Kitchen) ──────────────
    socket.on('order:send_to_kitchen', (order) => {
      io.to('kitchen').emit('order:new', order);
      io.to('customer').emit('order:status_update', {
        orderId: order._id,
        status: 'sent_to_kitchen',
      });
      console.log(`[Socket] Order ${order._id || order.orderNumber} sent to kitchen`);
    });

    // ── Kitchen events (from Kitchen → POS + Customer) ─
    socket.on('kitchen:update_stage', ({ orderId, stage }) => {
      io.to('pos').emit('kitchen:stage_update', { orderId, stage });
      io.to('customer').emit('order:status_update', { orderId, status: stage });
      console.log(`[Socket] Order ${orderId} stage → ${stage}`);
    });

    socket.on('kitchen:mark_item', ({ orderId, itemId }) => {
      io.to('pos').emit('order:item_prepared', { orderId, itemId });
      console.log(`[Socket] Order ${orderId} item ${itemId} prepared`);
    });

    // ── Table events ───────────────────────────────────
    socket.on('table:update_status', ({ tableId, status }) => {
      io.to('pos').emit('table:status_update', { tableId, status });
      console.log(`[Socket] Table ${tableId} → ${status}`);
    });

    // ── Payment events ─────────────────────────────────
    socket.on('payment:confirm', ({ orderId, paymentId }) => {
      io.to('pos').emit('payment:confirmed', { orderId, paymentId });
      io.to('customer').emit('payment:confirmed', { orderId });
      console.log(`[Socket] Payment confirmed for order ${orderId}`);
    });

    // ── Session events ─────────────────────────────────
    socket.on('session:close', ({ sessionId }) => {
      io.to('pos').emit('session:closed', { sessionId });
      console.log(`[Socket] Session ${sessionId} closed`);
    });

    // ── Disconnect ─────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
    });
  });
};

export default registerSocketHandlers;
