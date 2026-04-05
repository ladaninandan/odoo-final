import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Coffee } from 'lucide-react';
import { SelfOrderCartProvider } from '../../context/SelfOrderCartContext';

const SelfOrderLayout = () => {
  return (
    <SelfOrderCartProvider>
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 99999, top: 72 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            fontSize: '0.875rem',
            maxWidth: 'min(100vw - 2rem, 360px)',
          },
        }}
      />
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2">
          <Coffee className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-primary">Odoo Cafe</h1>
          <span className="ml-auto text-xs text-muted-foreground">Self Order</span>
        </div>
      </header>
      <main className="w-full max-w-4xl mx-auto pb-safe px-0 sm:px-4">
        <Outlet />
      </main>
    </div>
    </SelfOrderCartProvider>
  );
};

export default SelfOrderLayout;
