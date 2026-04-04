import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { initiatePayment, confirmPayment, selectMethod, resetPayment } from '../../store/slices/paymentSlice';
import { clearCart } from '../../store/slices/cartSlice';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { formatCurrency } from '../../utils/formatCurrency';
import { getStatusLabel, getStatusVariant } from '../../utils/orderHelpers';
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

  const orderTotal = currentOrder?.total || total;

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
      <div className="w-full max-w-lg space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment</h1>
            {currentOrder && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">{currentOrder.orderNumber}</span>
                <Badge variant={getStatusVariant(currentOrder.status)} className="text-xs">
                  {getStatusLabel(currentOrder.status)}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
            <p className="text-4xl font-bold text-primary">{formatCurrency(orderTotal)}</p>
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
