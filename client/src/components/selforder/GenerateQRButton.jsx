import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import selfOrderApi from '../../api/selfOrderApi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../ui/Dialog';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

const GenerateQRButton = ({ tableId, tableNumber, className }) => {
  const [open, setOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { current: session } = useSelector((state) => state.session);

  const handleGenerate = async () => {
    if (!session) return toast.error('Open a session first');
    setLoading(true);
    try {
      const { data } = await selfOrderApi.generateToken({
        tableId,
        sessionId: session._id,
        clientOrigin: typeof window !== 'undefined' ? window.location.origin : undefined,
      });
      setQrData(data);
      setOpen(true);
      if (data.reused) {
        toast.success('Same QR link — still valid until this table is cleared after payment.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(qrData.menuUrl);
    toast.success('Link copied!');
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={loading}
        className={cn('gap-1', className)}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <QrCode className="h-3 w-3" />}
        QR
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Self-Order QR — Table {tableNumber}</DialogTitle>
          </DialogHeader>
          {qrData && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={qrData.menuUrl} size={200} level="H" />
              </div>
              <Badge variant="outline" className="text-xs">{qrData.token}</Badge>
              {qrData.reused && (
                <p className="text-xs text-muted-foreground">
                  Reused existing link — it stays the same until the table is free again.
                </p>
              )}
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={qrData.menuUrl}
                  className="flex-1 text-xs p-2 rounded border bg-muted truncate"
                />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-left leading-relaxed">
                Scan with a phone on the same Wi‑Fi. Run the app with{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">npm run start:lan</code> so the
                network can reach this screen, then open POS at{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">http://YOUR_PC_IP:3000</code> before
                generating the QR (replace YOUR_PC_IP with this machine&apos;s LAN address).
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GenerateQRButton;
