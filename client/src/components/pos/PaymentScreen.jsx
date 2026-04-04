import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { initiatePayment, confirmPayment, selectMethod, resetPayment } from '../../store/slices/paymentSlice';
import { clearCart } from '../../store/slices/cartSlice';
import { setCurrentOrder } from '../../store/slices/ordersSlice';
import { fetchFloors } from '../../store/slices/floorsSlice';
import ordersApi from '../../api/ordersApi';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  getStatusLabel,
  getStatusVariant,
  allocateOrderTaxAcrossLines,
  getEffectiveTaxRatePercent,
} from '../../utils/orderHelpers';
import {
  Banknote, CreditCard, Smartphone, QrCode, CheckCircle2, Loader2, ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

const methods = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-green-500/10 text-green-700 border-green-500/30' },
  { id: 'digital', label: 'Digital', icon: CreditCard, color: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
  { id: 'upi', label: 'UPI', icon: Smartphone, color: 'bg-purple-500/10 text-purple-700 border-purple-500/30' },
];

const PaymentScreen = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedMethod, activePayment, qrCode, status } = useSelector((state) => state.payment);
  const { currentOrder } = useSelector((state) => state.orders);
  const { total } = useSelector((state) => state.cart);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const { data } = await ordersApi.getById(orderId);
        dispatch(setCurrentOrder(data));
      } catch {
        toast.error('Could not load order');
        navigate('/pos/floor');
      }
    })();
  }, [orderId, dispatch, navigate]);

  const orderTotal = currentOrder?.total ?? total;

  const lineRows = useMemo(
    () => (currentOrder ? allocateOrderTaxAcrossLines(currentOrder) : []),
    [currentOrder]
  );
  const taxRatePct = useMemo(() => getEffectiveTaxRatePercent(currentOrder), [currentOrder]);

  const handleSelectMethod = (method) => {
    dispatch(selectMethod(method));
  };

  const handlePay = async () => {
    if (!selectedMethod) return toast.error('Select a payment method');
    setProcessing(true);
    try {
      const payment = await dispatch(initiatePayment({
        orderId: orderId || currentOrder?._id,
        method: selectedMethod,
        amount: orderTotal,
      })).unwrap();

      if (selectedMethod === 'upi') {
        // Show QR, wait for manual confirm
        return;
      }

      // Auto-confirm for cash/digital
      await dispatch(confirmPayment(payment._id)).unwrap();
      toast.success('Payment confirmed! 🎉');
      dispatch(clearCart());
      dispatch(resetPayment());
      dispatch(fetchFloors());
      setTimeout(() => navigate('/pos/floor'), 1500);
    } catch (err) {
      toast.error(err || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmUPI = async () => {
    if (!activePayment) return;
    setProcessing(true);
    try {
      await dispatch(confirmPayment(activePayment._id)).unwrap();
      toast.success('UPI Payment confirmed! 🎉');
      dispatch(clearCart());
      dispatch(resetPayment());
      dispatch(fetchFloors());
      setTimeout(() => navigate('/pos/floor'), 1500);
    } catch (err) {
      toast.error(err || 'Confirmation failed');
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'confirmed') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground mb-4">Order has been marked as paid</p>
          <Button onClick={() => navigate('/pos/floor')}>Back to Floor</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment</h1>
            {currentOrder && (
              <div className="mt-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{currentOrder.orderNumber}</span>
                  <Badge variant={getStatusVariant(currentOrder.status)} className="text-xs">
                    {getStatusLabel(currentOrder.status)}
                  </Badge>
                </div>
                {currentOrder.customer?.name && (
                  <p className="text-xs text-muted-foreground">
                    Customer: {currentOrder.customer.name}
                    {(currentOrder.customer.mobile || currentOrder.customer.phone)
                      ? ` · ${currentOrder.customer.mobile || currentOrder.customer.phone}`
                      : ''}
                    {currentOrder.customer.email ? ` · ${currentOrder.customer.email}` : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Order summary */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bill summary</CardTitle>
            {currentOrder && (
              <div className="text-xs text-muted-foreground space-y-1 font-normal">
                {currentOrder.table != null && (
                  <p>
                    Table{' '}
                    <span className="font-medium text-foreground">
                      {typeof currentOrder.table === 'object' && currentOrder.table !== null
                        ? currentOrder.table.tableNumber
                        : '—'}
                    </span>
                    {typeof currentOrder.table === 'object' &&
                      currentOrder.table?.floor?.name && (
                      <span className="text-muted-foreground">
                        {' '}
                        · {currentOrder.table.floor.name}
                      </span>
                    )}
                  </p>
                )}
                {currentOrder.createdAt && (
                  <p>
                    {new Date(currentOrder.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
                {currentOrder.source === 'self_order' && (
                  <p>
                    Source: <span className="text-foreground">Self-order</span>
                    {(currentOrder.guestName || currentOrder.guestPhone) && (
                      <>
                        {' · '}
                        {[currentOrder.guestName, currentOrder.guestPhone].filter(Boolean).join(' · ')}
                      </>
                    )}
                  </p>
                )}
                {currentOrder.notes ? (
                  <p className="pt-1 border-t border-border/60 mt-1">
                    <span className="text-muted-foreground">Notes: </span>
                    <span className="text-foreground whitespace-pre-wrap">{currentOrder.notes}</span>
                  </p>
                ) : null}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="rounded-md border overflow-x-auto">
              {lineRows.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">No line items on this order.</p>
              ) : (
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="p-2 font-medium pl-3">Item</th>
                      <th className="p-2 font-medium text-right w-12">Qty</th>
                      <th className="p-2 font-medium text-right whitespace-nowrap">Unit</th>
                      <th className="p-2 font-medium text-right whitespace-nowrap">Subtotal</th>
                      <th className="p-2 font-medium text-right whitespace-nowrap">
                        Tax{taxRatePct != null ? ` (${taxRatePct}%)` : ''}
                      </th>
                      <th className="p-2 font-medium text-right pr-3 whitespace-nowrap">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineRows.map(({ item, lineSubtotal, lineTax, lineTotal }, idx) => (
                      <tr key={item._id || idx} className="border-b border-border/50 last:border-0">
                        <td className="p-2 pl-3 align-top">
                          <div className="font-medium text-foreground">{item.name}</div>
                          {item.variant ? (
                            <div className="text-xs text-muted-foreground mt-0.5">{item.variant}</div>
                          ) : null}
                        </td>
                        <td className="p-2 text-right align-top tabular-nums">{item.quantity}</td>
                        <td className="p-2 text-right align-top tabular-nums whitespace-nowrap">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="p-2 text-right align-top tabular-nums whitespace-nowrap">
                          {formatCurrency(lineSubtotal)}
                        </td>
                        <td className="p-2 text-right align-top tabular-nums whitespace-nowrap">
                          {formatCurrency(lineTax)}
                        </td>
                        <td className="p-2 pr-3 text-right align-top font-medium tabular-nums whitespace-nowrap">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums font-medium">
                  {formatCurrency(currentOrder?.subtotal ?? 0)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Tax
                  {taxRatePct != null ? ` (${taxRatePct}%)` : ''}
                </span>
                <span className="tabular-nums font-medium">
                  {formatCurrency(currentOrder?.tax ?? 0)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-base pt-1 border-t">
                <span className="font-semibold">Amount to pay</span>
                <span className="tabular-nums font-bold text-primary text-lg">
                  {formatCurrency(orderTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Method Selection */}
        {!qrCode && (
          <div className="grid grid-cols-3 gap-3">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelectMethod(m.id)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  selectedMethod === m.id
                    ? 'border-primary bg-primary/5 scale-105 shadow-md'
                    : `${m.color} hover:scale-102`
                }`}
              >
                <m.icon className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* UPI QR Code */}
        {qrCode && selectedMethod === 'upi' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Scan UPI QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                <img src={qrCode} alt="UPI QR Code" className="w-48 h-48" />
              </div>
            </CardContent>
            <CardFooter className="justify-center">
              <Button onClick={handleConfirmUPI} disabled={processing} variant="success" className="gap-2">
                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle2 className="h-4 w-4" />
                Confirm Payment Received
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Pay Button */}
        {!qrCode && (
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handlePay}
            disabled={!selectedMethod || processing}
          >
            {processing && <Loader2 className="h-4 w-4 animate-spin" />}
            Pay {formatCurrency(orderTotal)}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentScreen;
