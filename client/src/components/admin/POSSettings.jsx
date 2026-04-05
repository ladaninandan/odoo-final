import React, { useCallback, useEffect, useState } from 'react';
import paymentsApi from '../../api/paymentsApi';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/utils';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Save,
  Loader2,
  Settings2,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const METHOD_CONFIG = {
  cash: {
    title: 'Cash',
    description: 'Accept cash payments at the counter.',
    icon: Banknote,
    accent: 'from-amber-500/15 to-card dark:from-amber-500/20',
    border: 'border-amber-500/20',
  },
  digital: {
    title: 'Card & digital',
    description: 'Card readers and other non-cash digital tenders.',
    icon: CreditCard,
    accent: 'from-sky-500/15 to-card dark:from-sky-500/20',
    border: 'border-sky-500/20',
  },
  upi: {
    title: 'UPI',
    description: 'QR and UPI flows — set your merchant VPA below.',
    icon: Smartphone,
    accent: 'from-violet-500/15 to-card dark:from-violet-500/20',
    border: 'border-violet-500/20',
  },
};

const DEFAULT_TYPES = ['cash', 'digital', 'upi'];

function normalizeMethods(data) {
  return DEFAULT_TYPES.map((type) => {
    const found = (data || []).find((m) => m.type === type);
    return found || { type, isEnabled: true, upiId: '' };
  });
}

const POSSettings = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await paymentsApi.getMethods();
      setMethods(normalizeMethods(data));
      setDirty(false);
    } catch (e) {
      const msg = e.response?.data?.message || 'Could not load payment settings';
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleMethod = (type) => {
    setMethods((prev) =>
      prev.map((m) => (m.type === type ? { ...m, isEnabled: !m.isEnabled } : m)),
    );
    setDirty(true);
  };

  const updateUPI = (upiId) => {
    setMethods((prev) => prev.map((m) => (m.type === 'upi' ? { ...m, upiId } : m)));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await paymentsApi.updateMethods(methods);
      toast.success('Settings saved');
      setDirty(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const enabledCount = methods.filter((m) => m.isEnabled).length;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Settings2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">
                POS payment options and related preferences for your location.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading || saving} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || loading || !dirty} className="gap-2 min-w-[8rem]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={() => load()}>
            Retry
          </Button>
        </div>
      )}

      {/* Quick summary */}
      {!loading && methods.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span>
            <span className="font-medium text-foreground">{enabledCount}</span> of {methods.length} payment methods
            enabled for checkout
            {dirty && <span className="text-amber-600 dark:text-amber-400"> · Unsaved changes</span>}
          </span>
        </div>
      )}

      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20">
          <CardTitle className="text-lg">Payment methods</CardTitle>
          <CardDescription>
            Choose which options cashiers see on the payment screen. UPI requires a valid merchant ID when enabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading && !methods.length ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : !methods.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nothing loaded yet. Use <strong className="text-foreground">Refresh</strong> or fix the error above.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {methods.map((m) => {
                const cfg = METHOD_CONFIG[m.type] || METHOD_CONFIG.cash;
                const Icon = cfg.icon;
                return (
                  <li
                    key={m.type}
                    className={cn(
                      'p-5 sm:p-6 transition-colors',
                      'bg-gradient-to-br',
                      cfg.accent,
                    )}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4 min-w-0">
                        <div
                          className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background/80',
                            cfg.border,
                          )}
                        >
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{cfg.title}</h3>
                            <span
                              className={cn(
                                'text-xs font-medium px-2 py-0.5 rounded-full',
                                m.isEnabled
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground',
                              )}
                            >
                              {m.isEnabled ? 'Enabled' : 'Off'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{cfg.description}</p>

                          {m.type === 'upi' && m.isEnabled && (
                            <div className="pt-3 space-y-2 max-w-md">
                              <Label htmlFor="upi-id" className="text-xs font-medium">
                                Merchant UPI ID (VPA)
                              </Label>
                              <Input
                                id="upi-id"
                                placeholder="e.g. yourstore@paytm"
                                value={m.upiId || ''}
                                onChange={(e) => updateUPI(e.target.value)}
                                autoComplete="off"
                                className="font-mono text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:pl-4 shrink-0 sm:pt-1">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={m.isEnabled}
                          aria-label={`${m.isEnabled ? 'Disable' : 'Enable'} ${cfg.title}`}
                          onClick={() => toggleMethod(m.type)}
                          className={cn(
                            'relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            m.isEnabled ? 'bg-primary' : 'bg-muted',
                          )}
                        >
                          <span
                            className={cn(
                              'pointer-events-none absolute top-0.5 left-0.5 block h-5 w-5 rounded-full bg-background shadow transition-transform',
                              m.isEnabled ? 'translate-x-5' : 'translate-x-0',
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Bottom save — visible on long pages */}
      {!loading && methods.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-muted/30 px-4 py-4">
          <p className="text-sm text-muted-foreground">
            {dirty ? 'You have changes to save.' : 'All changes saved to the server.'}
          </p>
          <Button onClick={handleSave} disabled={saving || !dirty} className="gap-2 sm:min-w-[10rem]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </Button>
        </div>
      )}
    </div>
  );
};

export default POSSettings;
