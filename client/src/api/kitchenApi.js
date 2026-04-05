import api from './apiService';

const kitchenApi = {
  getActiveOrders: () => api.get('/kitchen/orders'),
  advanceStage: (id) => api.patch(`/kitchen/orders/${id}/stage`),
  markItemPrepared: (itemId) => api.patch(`/kitchen/items/${itemId}/prepared`),
};

export default kitchenApi;
