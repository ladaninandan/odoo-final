import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import selfOrderApi from '../../api/selfOrderApi';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import { getStatusLabel, getStatusVariant, getSelfOrderItemKitchenLabel } from '../../utils/orderHelpers';
import {
  Clock, CheckCircle2, Flame, Coffee, Loader2, User, Phone, Receipt, MapPin, Calendar, ChefHat,
} from 'lucide-react';

/** Progress: placed → in kitchen → preparing → ready */
const statusSteps = [
  { key: 'placed', label: 'Placed', icon: Clock },
  { key: 'kitchen', label: 'In kitchen', icon: Flame },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready', label: 'Ready', icon: CheckCircle2 },
];

/**
 * Derive current step (0–3) from order status + per-item kitchen progress.
 */
function getProgressStepIndex(order) {
  const st = order.status;
  if (st === 'cancelled') return -1;
  if (st === 'draft') return 0;
  if (st === 'ready' || st === 'paid') return 3;

  const items = order.items || [];
  if (!items.length) return 1;

  const allDone = items.every((i) => i.kitchenStatus === 'completed');
  if (allDone) return 3;

  const anyPreparing = items.some((i) => i.kitchenStatus === 'preparing');
  if (anyPreparing) return 2;

  return 1;
}

function itemStatusBadgeClass(kitchenStatus) {
  switch (kitchenStatus) {
    case 'completed':
      return 'bg-green-500/15 text-green-800 border-green-500/40 dark:text-green-300';
    case 'preparing':
      return 'bg-amber-500/15 text-amber-900 border-amber-500/40 dark:text-amber-200';
    case 'to_cook':
    case 'pending':
      return 'bg-slate-500/10 text-slate-700 border-slate-500/30 dark:text-slate-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

const RESUMABLE_STATUSES = ['draft', 'sent_to_kitchen', 'ready'];

function formatDateTime(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return null;
  }
}

const SelfOrderStatus = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const preview = location.state?.orderPreview;

  const [order, setOrder] = useState(preview || null);
  const [loading, setLoading] = useState(!preview);
  const [pollError, setPollError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const { data } = await selfOrderApi.getOrderStatus(token);
        if (!cancelled) {
          setOrder(data);
          setPollError(false);
        }
      } catch (err) {
        if (!cancelled && !preview) {
          setPollError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, preview]);

  if (loading && !order) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-48 mx-auto" />
        <Skeleton className="h-32" />
        <p className="text-center text-xs text-muted-foreground">Loading your order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-2">
        <Coffee className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-muted-foreground">
          {pollError ? 'Could not load order status. Check your connection.' : 'No order found yet.'}
        </p>
        <p className="text-xs text-muted-foreground">
          If you just placed an order, wait a few seconds and refresh this page.
        </p>
      </div>
    );
  }

  if (order.status === 'cancelled') {
    return (
      <div className="p-8 text-center">
        <p className="font-medium text-destructive">This order was cancelled.</p>
        <p className="text-sm text-muted-foreground mt-2">Order #{order.orderNumber}</p>
      </div>
    );
  }

  const currentIdx = getProgressStepIndex(order);

  const lineAmount = (i) => {
    if (i.subtotal != null && i.subtotal !== '') return Number(i.subtotal);
    return (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0);
  };
  const linesSubtotal = order.items?.reduce((sum, i) => sum + lineAmount(i), 0) ?? 0;

  const subtotal =
    order.subtotal != null && !Number.isNaN(Number(order.subtotal))
      ? Number(order.subtotal)
      : linesSubtotal > 0
        ? linesSubtotal
        : null;

  const tax =
    order.tax != null && !Number.isNaN(Number(order.tax)) ? Number(order.tax) : null;

  const total =
    order.total != null && !Number.isNaN(Number(order.total))
      ? Number(order.total)
      : linesSubtotal + (tax || 0);

  return (
    <div className="p-4 space-y-5 pb-12 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <Badge variant={getStatusVariant(order.status)} className="text-sm px-4 py-1">
          {getStatusLabel(order.status)}
        </Badge>
        <p className="text-lg font-semibold">Order #{order.orderNumber}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {order.tableNumber != null && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              Table {order.tableNumber}
            </span>
          )}
          {formatDateTime(order.createdAt) && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDateTime(order.createdAt)}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        <div className="flex items-center w-full min-w-[280px] gap-0 sm:gap-0.5">
          {statusSteps.map((step, idx) => (
            <React.Fragment key={step.key}>
              <div
                className={`flex flex-col items-center gap-1 flex-1 min-w-0 ${
                  idx <= currentIdx ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0 ${
                    idx <= currentIdx ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {idx < currentIdx ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : idx === currentIdx ? (
                    <step.icon className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                  ) : (
                    <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>
                <span className="text-[9px] sm:text-[10px] font-medium text-center leading-tight px-0.5">
                  {step.label}
                </span>
              </div>
              {idx < statusSteps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 min-w-[8px] shrink ${idx < currentIdx ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {order.status === 'paid' && (
        <p className="text-center text-sm text-muted-foreground">Payment received — thank you!</p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Order details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {(order.guestName || order.guestPhone) && (
            <div className="rounded-lg bg-muted/50 border px-3 py-2.5 space-y-1.5 text-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your details</p>
              {order.guestName && (
                <p className="flex items-start gap-2">
                  <User className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <span>{order.guestName}</span>
                </p>
              )}
              {order.guestPhone && (
                <p className="flex items-start gap-2">
                  <Phone className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <span className="tabular-nums">{order.guestPhone}</span>
                </p>
              )}
            </div>
          )}

          <div className="space-y-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Items</p>
            {order.items?.map((item, i) => {
              const qty = Number(item.quantity) || 0;
              const unit = Number(item.unitPrice) || 0;
              const lineTotal = item.subtotal != null ? Number(item.subtotal) : qty * unit;
              const ks = item.kitchenStatus || 'pending';
              const label = getSelfOrderItemKitchenLabel(ks);
              const isDone = ks === 'completed';
              const isActive = ks === 'preparing';
              return (
                <div
                  key={item._id || i}
                  className="flex flex-col gap-2 py-3 border-b border-border/80 last:border-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      ) : isActive ? (
                        <ChefHat className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium text-sm leading-snug ${isDone ? 'line-through opacity-65' : ''}`}>
                          {item.name}
                        </p>
                        {item.variant ? (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.variant}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                          {formatCurrency(unit)} × {qty}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(lineTotal)}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold px-2 py-0.5 border ${itemStatusBadgeClass(ks)}`}
                      >
                        {label}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-6 sm:pl-7 leading-snug">
                    {ks === 'pending' && 'Waiting to be sent to the kitchen.'}
                    {ks === 'to_cook' && 'In line — kitchen will start soon.'}
                    {ks === 'preparing' && 'Being prepared on the grill / station.'}
                    {ks === 'completed' && 'Finished — ready to serve.'}
                  </p>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            {subtotal != null && !Number.isNaN(subtotal) && (
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
            )}
            {tax != null && !Number.isNaN(tax) && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (5%)</span>
                <span className="tabular-nums">{formatCurrency(tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-1">
              <span>Total</span>
              <span className="text-primary tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.notes ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2.5 text-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">Special requests</p>
          <p className="text-foreground leading-relaxed">{order.notes}</p>
        </div>
      ) : null}

      {RESUMABLE_STATUSES.includes(order.status) && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/order/${token}?menu=1`)}
        >
          Add more items
        </Button>
      )}

      <p className="text-center text-xs text-muted-foreground">Status updates every 5 seconds</p>
    </div>
  );
};

export default SelfOrderStatus;
