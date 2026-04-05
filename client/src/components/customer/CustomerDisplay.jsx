import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useCustomerDisplaySocket from '../../hooks/useCustomerDisplaySocket';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import { Separator } from '../ui/Separator';
import { formatCurrency } from '../../utils/formatCurrency';
import { getStatusLabel } from '../../utils/orderHelpers';
import { Coffee, CheckCircle2, Clock, Flame, UtensilsCrossed } from 'lucide-react';

const statusIcons = {
  draft: Clock,
  sent_to_kitchen: Flame,
  ready: UtensilsCrossed,
  paid: CheckCircle2,
};

const CustomerDisplay = () => {
  useCustomerDisplaySocket();
  const { currentOrder, paymentStatus } = useSelector((state) => state.customerDisplay);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (paymentStatus === 'paid') {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-white">
        <div className="text-center animate-fade-in">
          <CheckCircle2 className="h-24 w-24 mx-auto mb-6 animate-pulse-glow" />
          <h1 className="text-4xl font-bold mb-3">Thank You!</h1>
          <p className="text-xl opacity-80">Payment received. Enjoy your meal!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Coffee className="h-8 w-8 text-blue-400" />
          <h1 className="text-2xl font-bold">Odoo POS Cafe</h1>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums">
            {time.toLocaleTimeString()}
          </p>
          <p className="text-sm opacity-60">{time.toLocaleDateString()}</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        {currentOrder ? (
          <Card className="w-full max-w-lg bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold">{currentOrder.orderNumber}</h2>
                <Badge variant="outline" className="mt-2 border-white/30 text-white">
                  {getStatusLabel(currentOrder.status)}
                </Badge>
              </div>
              <Separator className="bg-white/20" />
              <div className="space-y-2">
                {currentOrder.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <Separator className="bg-white/20" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-blue-300">{formatCurrency(currentOrder.total)}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center animate-fade-in">
            <Coffee className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h2 className="text-2xl font-bold opacity-50">Welcome</h2>
            <p className="opacity-30 mt-2">Your order will appear here</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-sm opacity-30">
        Customer Display — Odoo POS Cafe
      </footer>
    </div>
  );
};

export default CustomerDisplay;
