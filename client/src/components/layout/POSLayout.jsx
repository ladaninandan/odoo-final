import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopMenu from './TopMenu';
import POSSidebar from './POSSidebar';
import { Toaster } from '../ui/Toaster';

/** Full-width order & payment flows — hide sidebar for more working space */
function useHidePosSidebar() {
  const { pathname } = useLocation();
  return (
    /^\/pos\/order\/[^/]+/.test(pathname) ||
    /^\/pos\/payment\/[^/]+/.test(pathname)
  );
}

const POSLayout = () => {
  const hideSidebar = useHidePosSidebar();

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {!hideSidebar && <POSSidebar />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopMenu />
        <main className="flex-1 overflow-auto min-h-0">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default POSLayout;
