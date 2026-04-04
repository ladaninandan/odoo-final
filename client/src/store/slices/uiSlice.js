import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    activeScreen: 'floor',
    sidebarOpen: false,
  },
  reducers: {
    setActiveScreen: (state, { payload }) => { state.activeScreen = payload; },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, { payload }) => { state.sidebarOpen = payload; },
  },
});

export const { setActiveScreen, toggleSidebar, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;
