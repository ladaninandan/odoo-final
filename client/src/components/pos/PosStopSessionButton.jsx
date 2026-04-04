import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeSession } from '../../store/slices/sessionSlice';
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
import { StopCircle, Loader2 } from 'lucide-react';
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

  if (!session) return null;

  const handleClose = async () => {
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
      toast.error(err || 'Could not stop session');
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
        onClick={() => setOpen(true)}
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
          <Button type="button" variant="destructive" onClick={handleClose} disabled={saving} className="gap-2">
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
