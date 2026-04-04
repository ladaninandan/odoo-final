import React from 'react';
import { Outlet } from 'react-router-dom';
import TopMenu from './TopMenu';
import { Toaster } from '../ui/Toaster';

const POSLayout = () => {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopMenu />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
};

export default POSLayout;
