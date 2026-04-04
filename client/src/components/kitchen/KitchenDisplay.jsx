import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchKitchenOrders, advanceStage } from '../../store/slices/kitchenSlice';
import useSocket from '../../hooks/useSocket';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Toaster } from '../ui/Toaster';
import { getKitchenStageLabel } from '../../utils/orderHelpers';
import {
  ChefHat, Clock, Flame, CheckCircle2, ArrowRight, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const stageConfig = {
  to_cook: { label: 'To Cook', icon: Clock, color: 'border-t-yellow-500' },
  preparing: { label: 'Preparing', icon: Flame, color: 'border-t-orange-500' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'border-t-green-500' },
};

const KitchenDisplay = () => {
  const dispatch = useDispatch();
  const { orders, isLoading } = useSelector((state) => state.kitchen);
  useSocket('kitchen');

  useEffect(() => {
    dispatch(fetchKitchenOrders());
    const interval = setInterval(() => dispatch(fetchKitchenOrders()), 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleAdvance = useCallback(async (orderId) => {
    try {
      await dispatch(advanceStage(orderId)).unwrap();
      dispatch(fetchKitchenOrders());
      toast.success('Stage advanced!');
    } catch (err) {
      toast.error(err || 'Failed');
    }
  }, [dispatch]);

  if (isLoading && !orders.to_cook.length && !orders.preparing.length) {
    return (
      <div className="h-screen p-6">
        <div className="grid grid-cols-3 gap-6 h-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 bg-card border-b flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <ChefHat className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold">Kitchen Display</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch(fetchKitchenOrders())}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </header>

      <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-hidden">
        {Object.entries(stageConfig).map(([stage, config]) => (
          <div key={stage} className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-3 px-1">
              <config.icon className="h-5 w-5" />
              <h2 className="font-semibold text-lg">{config.label}</h2>
              <Badge variant="secondary">{orders[stage]?.length || 0}</Badge>
            </div>
            <div className="flex-1 overflow-auto space-y-3 pr-1">
              {orders[stage]?.map((order) => {
                const elapsed = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                return (
                  <Card key={order._id} className={`border-t-4 ${config.color} animate-fade-in`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{order.orderNumber}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Table {order.table?.tableNumber || '?'}
                          </Badge>
                          <Badge
                            variant={elapsed > 15 ? 'destructive' : elapsed > 10 ? 'warning' : 'secondary'}
                            className="text-xs"
                          >
                            {elapsed}m
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {order.items?.map((item) => (
                        <div key={item._id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {item.kitchenStatus === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground shrink-0" />
                            )}
                            <span className={item.kitchenStatus === 'completed' ? 'line-through opacity-50' : ''}>
                              {item.name}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">×{item.quantity}</Badge>
                        </div>
                      ))}
                      {order.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">Note: {order.notes}</p>
                      )}
                      {stage !== 'completed' && (
                        <Button
                          size="sm"
                          variant={stage === 'to_cook' ? 'warning' : 'success'}
                          className="w-full mt-3 gap-1"
                          onClick={() => handleAdvance(order._id)}
                        >
                          {stage === 'to_cook' ? 'Start Preparing' : 'Mark Ready'}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {(!orders[stage] || orders[stage].length === 0) && (
                <div className="text-center text-muted-foreground py-8 opacity-50">
                  No orders
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Toaster />
    </div>
  );
};

export default KitchenDisplay;
