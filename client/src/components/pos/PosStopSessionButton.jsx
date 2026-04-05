import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeSession, fetchCurrentSession } from '../../store/slices/sessionSlice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog';
import { StopCircle, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Cashier / POS: close the active till session (closing cash count) without using the admin panel.
 */
const PosStopSessionButton = ({ variant = 'outline', size = 'sm', className = '', label = 'Stop session' }) => {
  const dispatch = useDispatch();
  const session = useSelector((state) => state.session.current);
  const [open, setOpen] = useState(false);
  const [closingBalance, setClosingBalance] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?._id) return undefined;
    const id = setInterval(() => {
      dispatch(fetchCurrentSession());
    }, 8000);
    return () => clearInterval(id);
  }, [dispatch, session?._id]);

  const pendingOrdersCount = Number(session?.pendingOrdersCount ?? 0);
  const canCloseSession = useMemo(
    () => session?.canCloseSession !== false && pendingOrdersCount === 0,
    [session?.canCloseSession, pendingOrdersCount]
  );

  if (!session) return null;

  const handleClose = async () => {
    if (!canCloseSession) {
      toast.error('Finish payment for all open orders (or cancel them) before stopping the session.');
      return;
    }
    setSaving(true);
    try {
      await dispatch(
        closeSession({
          id: session._id,
          closingBalance: parseFloat(closingBalance) || 0,
        })
      ).unwrap();
      toast.success('Session stopped');
      setClosingBalance('');
      setOpen(false);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Could not stop session');
    }
    setSaving(false);
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={`gap-1.5 ${className}`}
        title={
          canCloseSession
            ? 'Stop till session'
            : 'Complete payment for all orders on this till first'
        }
        onClick={() => {
          dispatch(fetchCurrentSession());
          setOpen(true);
        }}
      >
        <StopCircle className="h-4 w-4" />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stop session</DialogTitle>
          <DialogDescription>
            Count the cash in the drawer and enter the closing balance. This ends the current till session for all POS
            terminals.
          </DialogDescription>
        </DialogHeader>
        {!canCloseSession ? (
          <div className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>
              {pendingOrdersCount > 0
                ? `${pendingOrdersCount} order(s) still need payment or must be cancelled. Finish them before stopping the session.`
                : 'Complete payment for every order on this till before stopping the session.'}
            </p>
          </div>
        ) : null}
        <div className="space-y-2 py-2">
          <Label htmlFor="pos-closing-balance">Closing cash balance</Label>
          <Input
            id="pos-closing-balance"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={closingBalance}
            onChange={(e) => setClosingBalance(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleClose}
            disabled={saving || !canCloseSession}
            className="gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="h-4 w-4" />}
            Confirm stop
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
};

export default PosStopSessionButton;
