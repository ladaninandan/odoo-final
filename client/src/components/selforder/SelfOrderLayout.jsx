import React from 'react';
import { Outlet } from 'react-router-dom';
import { Coffee } from 'lucide-react';

const SelfOrderLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2">
          <Coffee className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-primary">Odoo Cafe</h1>
          <span className="ml-auto text-xs text-muted-foreground">Self Order</span>
        </div>
      </header>
      <main className="max-w-md mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default SelfOrderLayout;
