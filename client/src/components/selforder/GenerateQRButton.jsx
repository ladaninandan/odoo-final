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

const GenerateQRButton = ({ tableId, tableNumber }) => {
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
      });
      setQrData(data);
      setOpen(true);
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
      <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading} className="gap-1">
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
              <p className="text-xs text-muted-foreground">
                Scan this QR to place orders directly from phone.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GenerateQRButton;
