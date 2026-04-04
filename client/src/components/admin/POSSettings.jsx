import React, { useEffect, useState } from 'react';
import paymentsApi from '../../api/paymentsApi';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { Banknote, CreditCard, Smartphone, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const iconMap = { cash: Banknote, digital: CreditCard, upi: Smartphone };

const POSSettings = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await paymentsApi.getMethods();
        // Ensure all 3 types exist
        const all = ['cash', 'digital', 'upi'].map((type) => {
          const found = data.find((m) => m.type === type);
          return found || { type, isEnabled: true, upiId: '' };
        });
        setMethods(all);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const toggleMethod = (type) => {
    setMethods((prev) =>
      prev.map((m) => m.type === type ? { ...m, isEnabled: !m.isEnabled } : m)
    );
  };

  const updateUPI = (upiId) => {
    setMethods((prev) =>
      prev.map((m) => m.type === 'upi' ? { ...m, upiId } : m)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await paymentsApi.updateMethods(methods);
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Configure which payment methods are available on the POS terminal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {methods.map((m) => {
            const Icon = iconMap[m.type];
            return (
              <div key={m.type} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium capitalize">{m.type}</p>
                    {m.type === 'upi' && m.isEnabled && (
                      <div className="mt-1">
                        <Input
                          placeholder="merchant@upi"
                          value={m.upiId}
                          onChange={(e) => updateUPI(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleMethod(m.type)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${m.isEnabled ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${m.isEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            );
          })}

          <Separator />
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default POSSettings;
