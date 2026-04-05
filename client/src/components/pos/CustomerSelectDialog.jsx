import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveCustomer } from '../../store/slices/cartSlice';
import customersApi from '../../api/customersApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import {
  Search,
  UserPlus,
  Loader2,
  Users,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '',
  phone: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  state: '',
  country: '',
  notes: '',
};

function initialsFromName(name) {
  if (!name || !String(name).trim()) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Search / create customer — polished POS dialog.
 */
const CustomerSelectDialog = ({ open, onOpenChange, tableLabel }) => {
  const dispatch = useDispatch();
  const [tab, setTab] = useState('search');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setResults([]);
      setForm(emptyForm);
      setTab('search');
      setMoreOpen(false);
    }
  }, [open]);

  const runSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await customersApi.getAll({ q: q.trim(), limit: 20 });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => runSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, runSearch, open]);

  const pickCustomer = (customer) => {
    dispatch(setActiveCustomer(customer));
    toast.success(`Customer: ${customer.name}`);
    onOpenChange(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const { data } = await customersApi.create({
        name: form.name.trim(),
        phone: form.phone.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        notes: form.notes.trim(),
      });
      pickCustomer(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[540px] w-[calc(100vw-1.25rem)] max-h-[min(92vh,720px)] p-0 gap-0 overflow-hidden flex flex-col sm:rounded-2xl border-border/80 shadow-2xl">
        <div className="shrink-0 border-b border-border bg-gradient-to-br from-primary/8 via-card to-muted/30 px-5 pt-6 pb-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20">
                <Users className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold tracking-tight text-left">
                  Who is dining?
                </DialogTitle>
                <DialogDescription className="text-left mt-1 text-sm text-muted-foreground">
                  Link this bill to a customer before sending to the kitchen.
                </DialogDescription>
              </div>
            </div>
            {tableLabel && (
              <Badge variant="secondary" className="shrink-0 font-mono text-xs px-2.5 py-1">
                {tableLabel}
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
          <div className="px-4 sm:px-5 pt-4 shrink-0">
            <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl bg-muted/80 p-1">
              <TabsTrigger
                value="search"
                className="rounded-lg gap-2 data-[state=active]:shadow-sm data-[state=active]:bg-background"
              >
                <Search className="h-4 w-4" />
                Find existing
              </TabsTrigger>
              <TabsTrigger
                value="new"
                className="rounded-lg gap-2 data-[state=active]:shadow-sm data-[state=active]:bg-background"
              >
                <UserPlus className="h-4 w-4" />
                New
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="search" className="flex-1 flex flex-col min-h-0 mt-0 px-4 sm:px-5 pb-5 pt-3 outline-none data-[state=inactive]:hidden">
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Name, phone, email, city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-10 pr-10 rounded-xl border-border/80 bg-background shadow-sm"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setSearch('')}
                  aria-label="Clear"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              )}
            </div>

            <div className="flex-1 min-h-[220px] max-h-[min(42vh,340px)] rounded-xl border border-border/60 bg-muted/20 overflow-hidden flex flex-col">
              {searching && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary opacity-80" />
                  <p className="text-sm">Searching customers…</p>
                </div>
              )}

              {!searching && search.trim().length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                  <div className="rounded-full bg-primary/10 p-4 text-primary">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Search your customer list</p>
                  <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                    Type a name, number, or email to find someone you have served before.
                  </p>
                </div>
              )}

              {!searching && search.trim().length >= 1 && results.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">No matches</p>
                  <p className="text-xs text-muted-foreground">
                    Try another term or switch to <strong>New</strong> to add them.
                  </p>
                  <Button type="button" variant="outline" size="sm" className="mt-2 gap-2" onClick={() => setTab('new')}>
                    <UserPlus className="h-4 w-4" />
                    Create new customer
                  </Button>
                </div>
              )}

              {!searching && results.length > 0 && (
                <ul className="overflow-y-auto p-2 space-y-1.5">
                  {results.map((c) => (
                    <li key={c._id}>
                      <button
                        type="button"
                        className={cn(
                          'w-full text-left rounded-xl border border-transparent bg-card px-3 py-3 shadow-sm',
                          'transition-all hover:border-primary/35 hover:bg-primary/[0.04] hover:shadow-md',
                          'flex items-center gap-3 group'
                        )}
                        onClick={() => pickCustomer(c)}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary text-sm font-bold ring-2 ring-primary/10">
                          {initialsFromName(c.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-foreground truncate">{c.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            {(c.mobile || c.phone) && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3 shrink-0 opacity-70" />
                                {c.mobile || c.phone}
                              </span>
                            )}
                            {c.email && (
                              <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                                <Mail className="h-3 w-3 shrink-0 opacity-70" />
                                {c.email}
                              </span>
                            )}
                            {c.city && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3 shrink-0 opacity-70" />
                                {c.city}
                              </span>
                            )}
                          </div>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="new" className="flex-1 flex flex-col min-h-0 mt-0 px-4 sm:px-5 pb-5 pt-3 outline-none overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-4 pb-2">
              <div className="space-y-2">
                <Label htmlFor="cd-name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Full name *
                </Label>
                <Input
                  id="cd-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cd-mobile" className="text-xs font-medium">
                    Mobile
                  </Label>
                  <Input
                    id="cd-mobile"
                    inputMode="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="+91 …"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cd-email" className="text-xs font-medium">
                    Email
                  </Label>
                  <Input
                    id="cd-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="optional"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setMoreOpen((v) => !v)}
              >
                <span>More details (optional)</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', moreOpen && 'rotate-180')} />
              </button>

              {moreOpen && (
                <div className="space-y-3 rounded-xl border border-border/80 bg-muted/15 p-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="cd-phone">Phone (alternate)</Label>
                    <Input
                      id="cd-phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cd-address">Address</Label>
                    <Textarea id="cd-address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-lg resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="cd-city">City</Label>
                      <Input id="cd-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cd-state">State</Label>
                      <Input id="cd-state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="rounded-lg" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cd-country">Country</Label>
                    <Input id="cd-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cd-notes">Notes</Label>
                    <Input id="cd-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-lg" placeholder="Allergies, preferences…" />
                  </div>
                </div>
              )}

              <Separator className="my-2" />

              <Button
                className="w-full h-12 text-base gap-2 rounded-xl shadow-md"
                type="button"
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Save &amp; attach to this order
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerSelectDialog;
