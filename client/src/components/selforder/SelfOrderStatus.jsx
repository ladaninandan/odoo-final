import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import selfOrderApi from '../../api/selfOrderApi';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import { getStatusLabel, getStatusVariant } from '../../utils/orderHelpers';
import { Clock, CheckCircle2, Flame, Coffee, Loader2 } from 'lucide-react';

const statusSteps = [
  { key: 'draft', label: 'Order Placed', icon: Clock },
  { key: 'sent_to_kitchen', label: 'In Kitchen', icon: Flame },
  { key: 'ready', label: 'Ready!', icon: CheckCircle2 },
];

const SelfOrderStatus = () => {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await selfOrderApi.getOrderStatus(token);
        setOrder(data);
      } catch {}
      setLoading(false);
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-48 mx-auto" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <Coffee className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-muted-foreground">No order found</p>
      </div>
    );
  }

  const currentIdx = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <div className="p-4 space-y-6 pb-12">
      <div className="text-center">
        <Badge variant={getStatusVariant(order.status)} className="text-sm px-4 py-1">
          {getStatusLabel(order.status)}
        </Badge>
        <p className="text-sm text-muted-foreground mt-2">Order #{order.orderNumber}</p>
      </div>

      {/* Status stepper */}
      <div className="flex items-center justify-between px-4">
        {statusSteps.map((step, idx) => (
          <React.Fragment key={step.key}>
            <div className={`flex flex-col items-center gap-1 ${idx <= currentIdx ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${idx <= currentIdx ? 'bg-primary text-white' : 'bg-muted'}`}>
                {idx < currentIdx ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : idx === currentIdx ? (
                  <step.icon className="h-5 w-5 animate-pulse" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span className="text-xs font-medium">{step.label}</span>
            </div>
            {idx < statusSteps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${idx < currentIdx ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Order items */}
      <Card>
        <CardContent className="pt-6 space-y-2">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {item.kitchenStatus === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <span className={item.kitchenStatus === 'completed' ? 'line-through opacity-50' : ''}>
                  {item.name}
                </span>
              </div>
              <span>× {item.quantity}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(order.total)}</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Auto-updating every 5 seconds
      </p>
    </div>
  );
};

export default SelfOrderStatus;
